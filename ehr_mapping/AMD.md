# EHR Mapping — AdvancedMD (AMD)

## Category
**Category 2 — Flexible field list.** Fields come from the doctor's AMD note template (fetch / Connect EHR).

---

## Extra Fields YAML keys

| YAML key | Required? | Type | Purpose | Example | Source |
|---|---|---|---|---|---|
| `ehr_field_id` | Yes | Number | AMD's internal field ID — sent in the push payload as `@id` to identify which field to write to | `12345` | Postman API |
| `ehr_field_name` | Yes | Text | AMD's field label — used as the stable match key during auto-remap (re-fetches the template and finds the new `ehr_field_id` by this name) | `"History of Present Illness"` | Postman API |
| `ordinal` | Yes | Number | Field position within the page — sent in the push payload as `@ordinal`; AMD requires it to locate the field in the note | `1` | Postman API |
| `page_name` | Auto | Text | AMD page the field belongs to — groups fields into the correct page block in the push payload and used during auto-remap | — | Backend (AMD API) — do not enter |
| `max_character_length` | Auto | Number | Field character limit fetched from AMD — shown in the character limit indicator in My Templates; used in error messages when push exceeds the limit | — | Backend (AMD API) — do not enter |

**Example YAML:**
```yaml
ehr_field_id: 12345
ehr_field_name: "History of Present Illness"
ordinal: 1
```

> `page_name` and `max_character_length` are auto-populated by the backend when you save the mapping — do not enter them manually.

---

## What doctors can change

| Why doctor does this | Doctor / Admin action | Effect on mapping | Needs ops? |
|---|---|---|---|
| Customising note layout; billing team asked for a new field; cleaning up unused fields | Adds, removes, or reorders fields within a page (AMD reassigns internal `@id` and `@ordinal`) | Marvix detects "Control not found", re-fetches template, re-matches by `page_name` + `ehr_field_name` | ✅ No — auto-recovery |
| Making field labels clearer for their workflow | Renames a page or field inside their AMD template | Auto-remap fails — `page_name` or `ehr_field_name` no longer matches, field silently dropped | ❌ Yes — update `page_name` / `ehr_field_name` in YAML |
| New visit type (e.g. added telehealth or new specialty); practice switched to a standardised template | Switches to a completely different AMD template | Mapping points at wrong template — pushes to wrong fields or fails entirely | ❌ Yes — update `ehr_template_id` + re-enter all YAML fields |

---

## What breaks the mapping

| What breaks it | How it fails | Visible to doctor? |
|---|---|---|
| Template ID change, field renamed/removed | `EhrTemplateChangeException` raised → auto-recovery attempted | Yes — AMD shows error; Marvix retries |

### Auto-remap (how AMD self-heals)

When AMD returns "Control not found", Marvix automatically:
1. Re-fetches the AMD template
2. Matches each field by `page_name` + `ehr_field_name` to get the new `@id` and `@ordinal`
3. Updates the mapping and retries the push

This survives field reordering and ID reassignment. It **fails** if `page_name` or `ehr_field_name` was renamed — ops must update the YAML manually in that case.

---

## Relevant `config` keys

| Key | Useful? | Notes |
|---|---|---|
| `append` | ✅ Yes | AMD fetches existing note content before pushing — append works |
| `prepend` | ✅ Yes | Same as above |
| `separator` | ✅ Yes | Joins text when multiple sections map to one field. **→ Moving to Template Settings** |
| `char_limit` | ✅ Yes | A different mechanism from `max_character_length` above — Marvix truncates the section's outgoing text to this length *before* pushing, to avoid AMD rejecting an over-length push. Doctor/ops-settable. **→ Moving to Template Settings** |
| `push_subsections` | ✅ Yes | **→ Moving to Template Settings** |
| `retain_headings` | ✅ Yes | **→ Moving to Template Settings** |
| `skip_empty_subsections` | ✅ Yes | **→ Moving to Template Settings** |
| `line_separator` | ❌ No | ECW HL7 only |

> `separator`, `char_limit`, `push_subsections`, `retain_headings`, and `skip_empty_subsections` are being promoted to a global **Template Settings** level. Doctors will configure them once per template rather than per mapping row.

---

## Push errors

| Error | Exception | Behaviour | Doctor-actionable? |
|---|---|---|---|
| Field control no longer exists in EHR template | `EhrTemplateChangeException` | Lambda auto-recovers: re-fetches template, rebuilds mapping by `page_name` + `ehr_field_name`, retries push. If retry also fails → `FatalException` → ops email | ✅ Yes — if auto-recovery fails, ops must remap |
| `ehr_template_id` deleted from AMD | `FatalException`: `"Template not found."` | No retry — ops email only | ✅ Yes — ops picks new EHR template, remaps all sections |
| Section text exceeds AMD character limit | `FatalException`: `"Value is too long."` | Error message includes section name and the character limit | ✅ Yes — doctor shortens the note |
| MA account missing Create Pt Notes permission | `FatalException`: `"permission level does not allow Create Pt Notes"` | No retry — ops email only | ✅ Yes — practice admin fixes MA account in AMD |
| Provider not found | `FatalException`: `"Provider not found."` | No retry — ops email only | ❌ No — ops/tech fixes setup |
| Field value rejected | `FatalException`: `"Value is not valid"` | No retry — ops email only | ❌ No — ops fixes YAML |
| `"add a new patient note"` error from AMD | `ManagedException` (`alert_policy="final_failure"`) | Retried; ops only emailed if retries are exhausted | ❌ No — resolves automatically unless retries exhaust |

**No `push_errors` DB table exists today** — all failures go to ops email and CloudWatch only. Doctor is not notified in-app.

---

## Where this lives in the code

| Location | Role |
|---|---|
| `internal_endpoints.py:4311` | Auto-populates `max_character_length` from AMD API |
| `ehr_layer/advancedmd.py:1647` | `get_updated_ehr_mapping()` — auto-remap logic |
| `ehr_layer/advancedmd.py:239` | `handle_push_note_failures()` — maps AMD error text to `FatalException`/`ManagedException`/`EhrTemplateChangeException` |
| `ehr_layer/section_text_builder.py` | Reads `config` keys at push time |
