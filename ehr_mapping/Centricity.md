# EHR Mapping — Centricity (Athena Flow)

## Category

**Category 1 — Fixed field list.** Field names are a fixed set from the Centricity/Athena Flow integration. Dropdown is hardcoded — no template fetch. Centricity routes section content based on `ehr_field_name`.

---

## Extra Fields YAML keys

| YAML key | Required? | Type | Purpose | Example | Source |
|---|---|---|---|---|---|
| `ehr_field_name` | Yes | Text | Section name passed to the Centricity push — Centricity routes content based on this value | `"hpi"` | Fixed list (see below) |

**Example YAML:**
```yaml
ehr_field_name: "hpi"
```

> Centricity is also referred to as "Athena Flow" in some parts of the codebase. It is a separate integration from AthenaOne.

---

## Available `ehr_field_name` values

| Section | `ehr_field_name` |
|---|---|
| Chief Complaint | `chief_complaint` |
| HPI | `hpi` |
| ROS | `ros` |
| Physical Exam | `physical_exam` |
| Assessment & Plan | `assessment_plan` |
| Past Medical History | `past_medical_history` |

---

## Relevant `config` keys

| Key | Useful? | Notes |
|---|---|---|
| `append` | ❌ No | Centricity does not fetch existing note content |
| `prepend` | ❌ No | Same as above |
| `separator` | ✅ Yes | |
| `char_limit` | ✅ Yes | |
| `push_subsections` | ✅ Yes | |
| `retain_headings` | ✅ Yes | |
| `skip_empty_subsections` | ✅ Yes | |
| `line_separator` | ❌ No | ECW HL7 only |

---

## What doctors can change

Doctors can remap any section from the hardcoded field list (no API call). Wrong `ehr_field_name` values are silently accepted — content may land in the wrong field with no error. Structural changes to the encounter template should be escalated to tech.

---

## What breaks the mapping

| What breaks it | How it fails | Visible to doctor? |
|---|---|---|
| Wrong `ehr_field_name` | Push fails or content goes to wrong field | No — doctor sees nothing |

---

## Where this lives in the code

| Location | Role |
|---|---|
| `ehr_layer/athenaflow.py` | Centricity push using `ehr_field_name` |
| `ehr_layer/section_text_builder.py` | Reads `config` keys at push time |
