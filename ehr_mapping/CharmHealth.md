# EHR Mapping — CharmHealth

## Category
**Category 2 — Flexible field list.** Fields come from the doctor's CharmHealth template. Re-fetch not available — remap from existing list or Contact support.

---

## Extra Fields YAML keys

| YAML key | Required? | Type | Purpose | Example | Source |
|---|---|---|---|---|---|
| `ehr_field_id` | Yes (except Chief Complaint) | Number | Charm entry ID — identifies the specific SOAP template entry to write to | `194780800000679203` | Postman API |
| `ehr_field_name` | Chief Complaint only | Text | Fixed string `"chief_complaints"` — triggers a separate Chief Complaint push path | `"chief_complaints"` | — |

**Example YAML (standard section):**
```yaml
ehr_field_id: 194780800000679203
```

**Example YAML (Chief Complaint):**
```yaml
ehr_field_name: "chief_complaints"
```

---

## Relevant `config` keys

| Key | Useful? | Notes |
|---|---|---|
| `append` | ✅ Yes | CharmHealth fetches existing note content before pushing |
| `prepend` | ✅ Yes | Same as above |
| `separator` | ✅ Yes | **→ Moving to Template Settings** |
| `char_limit` | ✅ Yes | **→ Moving to Template Settings** |
| `push_subsections` | ✅ Yes | **→ Moving to Template Settings** |
| `retain_headings` | ✅ Yes | **→ Moving to Template Settings** |
| `skip_empty_subsections` | ✅ Yes | **→ Moving to Template Settings** |
| `line_separator` | ❌ No | ECW HL7 only |

> `separator`, `char_limit`, `push_subsections`, `retain_headings`, and `skip_empty_subsections` are being promoted to a global **Template Settings** level. Doctors will configure them once per template rather than per mapping row.

---

## What doctors can change

| Why doctor does this | Doctor / Admin action | Effect on mapping | Needs ops? |
|---|---|---|---|
| Practice restructured encounter templates; changed specialty | Changes template or removes an entry field | `ehr_field_id` no longer valid — silently skipped or fatal "mapping error" | ❌ Yes — get new field IDs from Postman API |

---

## What breaks the mapping

| What breaks it | How it fails | Visible to doctor? |
|---|---|---|
| Missing or wrong `ehr_field_id` | SOAP mode: field skipped silently. Default mode: fatal error with generic "contact support" message | Partial — fatal only in default mode |

---

## Push errors

| Error | Exception | Behaviour | Doctor-actionable? |
|---|---|---|---|
| Account locked | `FatalException`: `"Your account has been locked"` | No retry — ops email | ❌ No — ops/practice admin unlocks |
| Signed SOAP encounter (can't edit) | `FatalException`: `"Notes can not be edited for signed soap encounter."` | No retry — ops email | ❌ No — chart already signed |
| Signed encounter (can't edit) | `FatalException`: `"Notes can not be edited for signed encounter."` | No retry — ops email | ❌ No — chart already signed |
| Wrong `ehr_field_id` (standard mode) | `FatalException`: `"Template mapping error."` | No retry — ops email | ❌ No — ops fixes field ID |
| Any field failure in SOAP mode | No exception raised | **Silently skipped** — no error returned by CharmHealth API | ❌ Undetectable |

**SOAP mode is undetectable**: if `ehr_template_name` starts with `"soap"`, CharmHealth returns no per-field errors. Marvix cannot know which sections landed. Ops must spot-check the chart after onboarding.

**No `push_errors` DB table exists today** — all failures go to ops email and CloudWatch only.

---

## Where this lives in the code

| Location | Role |
|---|---|
| `ehr_layer/charm.py` | Uses `ehr_field_id` (or `ehr_field_name` for chief_complaints) |
| `ehr_layer/section_text_builder.py` | Reads `config` keys at push time |
