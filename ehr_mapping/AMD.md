# EHR Mapping — AdvancedMD (AMD)

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
| `char_limit` | ✅ Yes | AMD enforces `max_character_length` per field — set this to avoid push errors. **→ Moving to Template Settings** |
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

**No `push_errors` DB table exists today** — all failures go to ops email and CloudWatch only. Doctor is not notified in-app.

---

## Where this lives in the code

| Location | Role |
|---|---|
| `internal_endpoints.py:3797` | Auto-populates `max_character_length` from AMD API |
| `ehr_layer/advancedmd.py:1629` | `get_updated_ehr_mapping()` — auto-remap logic |
| `ehr_layer/section_text_builder.py` | Reads `config` keys at push time |

---

## My Templates prototype (AMD branch)

Living notes for branch `cursor/amd-ehr-34b9`. Visual / UX prototype — not production wiring.  
Related: [MY_TEMPLATES_PRD.md](../MY_TEMPLATES_PRD.md), [ERROR_UX.md](ERROR_UX.md).

### Repo layout (this branch)

```
index.html              # app entry (GitHub Pages)
*.jsx / design-tokens.js
MY_TEMPLATES_PRD.md     # product PRD
BACKEND.md
EHR_PUSH_FAILURE_LOG_ANALYSIS.md
ehr_mapping/            # per-EHR docs — AMD notes live in AMD.md
design/                 # Figma + screenshots (not runtime)
  screenshots/
.github/                # historical design-PR bodies
```

### Prototype scope

- Tweaks EHR switcher fixed to `AMD`; runtime `ehr` always `AMD`
- Template list filtered to AMD templates only
- Mapping display: **`Office Visit > Field Name`** (Title Case) on chips, picker, and char limits

### Confirmed decisions

| Topic | Decision |
|---|---|
| Configuration column | **Not needed for AMD** |
| EHR path style | **`Office Visit > Title Case`** everywhere |
| Template types | **Self-serve** and **Ops-managed** |
| Request New Section | **Ops-managed only** (self-serve uses + Add section) |
| STATIC section badge | **Dropped** † |
| EHR Pull / File Upload ghost rows | **Dropped** † |

### Still to align

1. Cat 2 create: **Connect EHR** step (pick AMD note template / field list) — `EHR_TEMPLATES_BY_SYSTEM.AMD` exists but unused
2. AMD **checkbox** fields in the real picker (today: tweak demo only)
3. Push-error polish: too-long should not offer Remap; cover more AMD fatal cases if needed for the mock

### PRD vs prototype (AMD) — 2026-08-10

Sources: [MY_TEMPLATES_PRD.md](../MY_TEMPLATES_PRD.md), this file, [ERROR_UX.md](ERROR_UX.md).

| Area | Status | Notes |
|---|---|---|
| Self-serve vs ops gating | **Present** | **Request New Section = ops-managed only.** Self-serve: + Add section + Prompt edit. |
| Self-serve vs Ops-managed **list tabs** | **Present** | Tabs with counts; seeded `General 3 — Custom` + `Follow Up — My Push` |
| `Office Visit > Title Case` mapping + picker | **Present** | Chips, picker, char limits aligned |
| Cat 2 Connect EHR / fetch at create | **Missing** | Create is Starting point → Describe → Review; no EHR template pick |
| Remap from field list | **Present** | Mocked static AMD field list (no live fetch) |
| Output settings (push mode, additional text, default negative, char limit) | **Present** | Sliders panel; Configuration column correctly omitted |
| AMD checkbox fields in picker | **Partial** | Dual-mapping demo via Tweaks only |
| Push errors: template changed / too long / permission | **Partial** | Three scenarios in Tweaks; Remap affordance on too-long banner is wrong |
| Preview output | **Present** | Header; enabled sections + default negatives |
| M / S indicators + popovers | **Present** | |
| Parent As one / Each separately | **Present** | |
| Shared field when two sections map to same destination | **Present** | |

### Changelog

| Date | Change |
|---|---|
| 2026-08-10 | Branch created; EHR locked to AMD |
| 2026-08-10 | Confirmed: no Configuration column; one path style; Self-serve / Ops-managed |
| 2026-08-10 | Dropped STATIC badge + EHR Pull/File Upload ghost rows † |
| 2026-08-10 | Unified path style to `Office Visit > Title Case` on seeded chips + picker |
| 2026-08-10 | Merged `main` (PRD, `ehr_mapping/`, error-scenario + dual-mapping demos). Kept AMD lock; STATIC/ghost stay dropped |
| 2026-08-10 | Consolidated prototype notes into this file; removed standalone AMD branch docs |
| 2026-08-10 | Cleaned branch layout: removed stale `My Templates.html` + junk; moved design assets to `design/` |
| 2026-08-10 | Compared branch vs PRD for AMD; logged scoreboard above |
| 2026-08-10 | Added **Ops-managed / Self-serve** template list tabs + ownership badge/hint; seeded two self-serve AMD templates |
| 2026-08-10 | Corrected: **Request New Section is ops-managed only** (self-serve adds sections directly) |

### Footnotes — dropped / superseded

† **STATIC (dropped)** — section-level badge for non-AI / fixed content (old mock: lock on HPI / Labs).  
*Still in the mock (different concept):* **Static Start / Static End** — fixed boilerplate around a section body.

† **EHR Pull / File Upload ghost rows (dropped)** — inbound rows like Vitals (“Inserted by EHR Pull”) or file upload; enable only, no mapping chip.

†† **`Clinical Notes > snake_case` path style (superseded)** — older design chips; prototype now uses **`Office Visit > Title Case`** only.
