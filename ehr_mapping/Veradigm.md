# EHR Mapping — Veradigm

## Category
**Category 1 — Fixed field list.** Field names from Veradigm's Unity API / tech-provided list. No template fetch for the mapping dropdown.

---

## Extra Fields YAML keys

| YAML key | Required? | Type | Purpose | Example | Source |
|---|---|---|---|---|---|
| `ehr_field_name` | Yes | Text | Veradigm section identifier — determines which `SaveXNote` API action is called to write the content | `"historySections"` | Tech (field name list from Vignesh) |

**Example YAML:**
```yaml
ehr_field_name: "historySections"
```

> No `ehr_field_id` or template ID required. Only `ehr_field_name` is needed. The EHR Template Name (not ID) is selected from a list provided by tech.

---

## Available `ehr_field_name` values

| Section | `ehr_field_name` | Veradigm API action |
|---|---|---|
| History (HPI, Medical / Social / Family / Surgical Hx) | `historySections` | `SaveHistoryNote` |
| Physical Exam | `physicalExams` | `SavePENote` |
| Review of Systems | `reviewOfSystem` | `SaveROSNote` |
| Assessment & Plan | `assessmentPlanHP` | `SaveAPNote` |
| Reason for Visit | `reasonsForVisit` | `SaveRFVNote` |
| Vitals | `vitals` | `SaveVitalNote` |
| ICD-10 codes | `ICD` | Separate diagnosis API (not `SaveXNote`) |

---

## Setup (dependency on tech)

1. Vignesh adds the EHR Doctor name and EHR Doctor ID
2. Vignesh provides the list of EHR Template Names — ops selects the relevant one and adds it to the mapping
3. Ops provides Summarizer IDs and names to tech for pipeline setup

**User settings:** Same checkboxes as other EHRs (Disable push to EHR, Appointments with time, Allow subsequent note push). Appointment pull time and order configured as normal. EHR Doctor name and ID set up by tech.

---

## Relevant `config` keys

| Key | Useful? | Notes |
|---|---|---|
| `append` | ✅ Yes | Veradigm fetches existing note content before pushing |
| `prepend` | ✅ Yes | Same as above |
| `separator` | ✅ Yes | **→ Moving to Template Settings** |
| `char_limit` | ✅ Yes | **→ Moving to Template Settings** |
| `push_subsections` | ✅ Yes | **→ Moving to Template Settings** |
| `retain_headings` | ✅ Yes | **→ Moving to Template Settings** |
| `skip_empty_subsections` | ✅ Yes | **→ Moving to Template Settings** |
| `line_separator` | ❌ No | ECW HL7 only — Veradigm uses `\r\n` hardcoded in code |

> `separator`, `char_limit`, `push_subsections`, `retain_headings`, and `skip_empty_subsections` are being promoted to a global **Template Settings** level. Doctors will configure them once per template rather than per mapping row.

---

## What doctors can change

| Why doctor does this | Doctor / Admin action | Effect on mapping | Needs ops? |
|---|---|---|---|
| Practice restructured the note layout; provider changed specialty | Renames or removes a section in Veradigm | `ehr_field_name` no longer maps to a valid section — push fails with error | ❌ Yes — get updated field name list from tech |

---

## What breaks the mapping

| What breaks it | How it fails | Visible to doctor? |
|---|---|---|
| Wrong `ehr_field_name` (not in the known 7-item list) | `FieldPushException` raised with field name in message → `FatalException` → ops email | No |
| Chart locked by another user | `FieldPushException` with lock message → `FatalException` → ops email | No — currently ops email only; no in-app notification |

---

## Push errors

| Error | Exception | Behaviour | Doctor-actionable? |
|---|---|---|---|
| Field failed to save (wrong `ehr_field_name` or API rejection) | `FieldPushException` → `FatalException` | No retry — ops email | ✅ Yes — ops remaps the field |
| Chart locked by another user | `FieldPushException` with lock message → `FatalException` | No retry — ops email | ✅ Yes — doctor exits chart in Veradigm, pushes again from note screen |

**No `push_errors` DB table exists today** — all failures go to ops email and CloudWatch only. Doctor is not notified in-app.

---

## Where this lives in the code

| Location | Role |
|---|---|
| `ehr_layer/veradigm.py:770` | `_process_field()` — reads `ehr_field_name`, calls `SaveXNote` |
| `ehr_layer/veradigm.py:344` | `section_name_mapping` — maps `ehr_field_name` to Veradigm API action |
| `ehr_layer/veradigm.py:810` | `_process_icd_codes()` — separate handler for `ICD` field |
| `ehr_layer/section_text_builder.py` | Reads `config` keys at push time |
