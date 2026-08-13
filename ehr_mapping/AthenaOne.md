# EHR Mapping — AthenaOne

## Extra Fields YAML keys

| YAML key | Required? | Type | Purpose | Example | Source |
|---|---|---|---|---|---|
| `ehr_field_name` | Yes | Text | Athena's snake_case section identifier — mapped to hardcoded push logic per section type | `"hpi"` | See lookup table below |

**Example YAML:**
```yaml
ehr_field_name: "hpi"
```

---

## Available `ehr_field_name` values

| Section | `ehr_field_name` |
|---|---|
| Chief Complaint | `encounterreasonnote` |
| HPI | `hpi` |
| ROS | `reviewofsystems` |
| Physical Exam | `physicalexam` |
| Assessment / Plan | `assessment_with_problems` |
| Order Sets | `ordersets` |
| Billing Notes | `billingnotes` — free-text push to the encounter's billing/services note (`__save_billing_note`), unrelated to diagnosis codes despite the similar-sounding name |
| ICD-10/SNOMED Diagnoses | `diagnoses` — extracts diagnoses from the section text, resolves SNOMED codes, and pushes each via a separate diagnoses API (`__save_diagnoses`) — not in the Extra Fields YAML reference doc before, confirmed via code |
| Discussion Notes | `discussion_notes` |
| Patient Instructions | `patient_instructions` |

> Must be exact snake_case. Any deviation silently fails — the push is attempted but Athena rejects the field.

---

## Advanced YAML options

| YAML key | Type | Example | What it does |
|---|---|---|---|
| `keep_bullet_points` | Boolean | `true` | Preserves bullet formatting when pushing to Assessment/Plan — without it bullets are stripped |

---

## Relevant `config` keys

| Key | Useful? | Notes |
|---|---|---|
| `append` | ✅ Yes — behavior differs by section | HPI, Physical Exam, ROS: Marvix does a GET before the PUT and combines with existing content. Assessment, Chief Complaint: no fetch — `append`/`prepend` just toggle the EHR API's own replace flag (`replacetext`/`appendtext`), so Athena handles the combining server-side |
| `prepend` | ✅ Yes — HPI/Physical Exam/ROS only | For those three sections, existing content is fetched and prepended when set. Not applicable to Assessment/Chief Complaint (no separate prepend flag for those) |
| `separator` | ✅ Yes | **→ Moving to Template Settings** |
| `char_limit` | ✅ Yes | **→ Moving to Template Settings** |
| `push_subsections` | ✅ Yes | **→ Moving to Template Settings** |
| `retain_headings` | ✅ Yes | **→ Moving to Template Settings** |
| `skip_empty_subsections` | ✅ Yes | **→ Moving to Template Settings** |
| `line_separator` | ❌ No | ECW HL7 only |

> `separator`, `char_limit`, `push_subsections`, `retain_headings`, and `skip_empty_subsections` are being promoted to a global **Template Settings** level. Doctors will configure them once per template rather than per mapping row.

---

## MA account permissions required

For the practice's MA account in Athena:
- View and select any departments
- View appointments (Calendar view)
- Create appointment
- Ability to Start check-in within appointment
- Delete appointment (optional — for test cleanup)
- View patient chart
- Upload document to patient (for imaging result summarization)
- View Exam Note Sections
- Edit fields in Exam
- Open Marvix Smart launch (iframe) from Exam sections
- Role: **Clinical Staff + Clinical Admin**

Marvix appears as **Marvix AI Scribe** in the Athena Embedded App Access list. Enabled app spaces:
- Encounter: Reason for Visit
- Encounter: History of Present Illness
- Encounter: Review of Systems
- Encounter: Physical Exam
- Encounter: Assessment & Plan
- Apps Tab
- App Dock

---

## What doctors can change

| Why doctor does this | Doctor / Admin action | Effect on mapping | Needs ops? |
|---|---|---|---|
| Practice IT customised the encounter template; Athena pushed an update that changed section names | Renames or removes a section in Athena | `ehr_field_name` no longer matches — push fails with generic error email | ❌ Yes — update `ehr_field_name` in YAML |

---

## What breaks the mapping

| What breaks it | How it fails | Visible to doctor? |
|---|---|---|
| Wrong `ehr_field_name` (must be exact snake_case from the lookup table) | Generic exception → alert email to ops; push not retried | No — doctor sees nothing |

---

## Push errors

| Error | Exception | Behaviour | Doctor-actionable? |
|---|---|---|---|
| Patient check-in not complete in Athena | `LockedEncounterException` → `FatalException`: `"Can't push the note because the patient's check-in is not yet complete in Athena..."` | No retry — ops email only | ✅ Yes — doctor completes check-in in Athena (or clicks "Go to Exam"), then pushes again |
| Per-section push failure (e.g. Unable to push HPI) | bare `Exception` | Logged + ops email; push continues for remaining sections | ❌ No — ops investigates |
| API quota exceeded | `ManagedException` | Retried with backoff | ❌ No — resolves automatically |
| Wrong `ehr_field_name` (must be exact snake_case) | bare `Exception` | Athena rejects the field silently — logged + ops email | ❌ No — ops fixes YAML |

**No `push_errors` DB table exists today** — all failures go to ops email and CloudWatch only. Doctor is not notified in-app.

---

## Where this lives in the code

| Location | Role |
|---|---|
| `ehr_layer/athenaone.py:1584` | `save_note()` — routes each mapped field to the right Athena API call by `ehr_field_name` |
| `ehr_layer/athenaone.py:761` | `__update_note_section()` — per-section push logic; GET-then-combine for HPI/Physical Exam/ROS (~940-1035), flag-only replace for Assessment (~890)/Chief Complaint (~915) |
| `ehr_layer/section_text_builder.py` | Reads `config` keys and `keep_bullet_points` at push time |

> Note: `ehr_layer/athenaflow.py` implements the `AthenaFlow` class, which is the **Centricity**
> integration — a separate EHR from AthenaOne. See [Centricity.md](Centricity.md). It is not used for
> AthenaOne push.
