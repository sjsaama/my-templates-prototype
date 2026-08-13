# EHR Mapping — DrChrono

## Extra Fields YAML keys

| YAML key | Required? | Type | Purpose | Example | Source |
|---|---|---|---|---|---|
| `ehr_field_id` | Yes | Number | DrChrono clinical note field ID — sent in the POST to `/clinical_note_field_values` to identify the target field | `84213206` | Template file (tech) |
| `ehr_field_name` | Yes | Text | Field display name — used to route special fields (e.g. `icd10_codes`, `cpt_codes`) to separate push handlers | `"Past Medical History Freewrite"` | Template file (tech) |

**Example YAML:**
```yaml
ehr_field_id: 84213206
ehr_field_name: "Past Medical History Freewrite"
```

**Special fields routed by `ehr_field_name`:**

| `ehr_field_name` value | What happens |
|---|---|
| `icd10_codes` | Routed to ICD-10 code push handler (not a free-text field) |
| `cpt_codes` | Routed to CPT code push handler |

---

## Relevant `config` keys

| Key | Useful? | Notes |
|---|---|---|
| `append` | ✅ Yes | DrChrono fetches existing note content before pushing |
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
| Practice cleaning up old fields no longer used; changed specialty focus | Archives a clinical note field in DrChrono | `ehr_field_id` becomes invalid — push silently fails, logged only | ❌ Yes — get new field ID from updated template file |
| New visit type; practice added or restructured note sections | Changes template / adds new fields | Existing field IDs may no longer match | ❌ Yes — obtain new field IDs from updated template file |

---

## What breaks the mapping

| What breaks it | How it fails | Visible to doctor? |
|---|---|---|
| `ehr_field_id` archived or deleted | Returns `False`, logged only | No — silently dropped |

---

## Push errors

| Error | Exception | Behaviour | Doctor-actionable? |
|---|---|---|---|
| Any failure while building/pushing the note (including auth failure or rate limit hit while fetching existing note content) | `save_note`'s single top-level `try/except Exception` catches everything — logged via `logger.error`, returns `False` | Not per-field, not retried, no ops email | ❌ No — ops must check CloudWatch |
| ICD/CPT/chief complaint push failure | Each of `__save_icd10_codes`/`__save_cpt_code`/`__save_chief_complaint` has its own try/except — `logger.warning` only | Not raised, not retried; failure in one doesn't stop the others | ❌ No — ops must check CloudWatch |
| Auth failure (`CredentialsException`) / rate limit (`ThrottledException`) | Raised by `handle_response_errors()`, which is called from `__get_note_for_appointment` (the existing-content fetch inside `save_note`) | **Not** a special case — `save_note`'s blanket `except Exception` catches these the same as any other error and returns `False`. They do not bubble past the Lambda or trigger a distinct retry path in this file. | ❌ No — ops reconnects integration / waits, based on the logged error |

**Known gap**: `save_note` funnels every exception — including per-field push failures and auth/rate-limit errors hit while fetching existing note content — into one generic `logger.error` + `return False`. There's no per-field visibility into which DrChrono field(s) failed, and no ops email/alert. Push issues banner cannot work for DrChrono without a Lambda change to surface failures per field.

**No `push_errors` DB table exists today** — all failures go to ops email and CloudWatch only.

---

## Where this lives in the code

| Location | Role |
|---|---|
| `ehr_layer/drchrono.py` | Uses `ehr_field_id` + `ehr_field_name` |
| `ehr_layer/section_text_builder.py` | Reads `config` keys at push time |
