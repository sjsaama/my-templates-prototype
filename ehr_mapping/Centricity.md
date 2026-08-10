# EHR Mapping — Centricity (Athena Flow)

## Category

**Category 3 — Auto push, no field mapping.** Ops defines `ehr_field_name` per section in the YAML; Centricity routes content based on that name. No template fetch needed and no doctor-facing field picker — the mapping is entirely ops-managed.

---

## Extra Fields YAML keys

| YAML key | Required? | Type | Purpose | Example | Source |
|---|---|---|---|---|---|
| `ehr_field_name` | Yes | Text | Section name passed to the Centricity push — Centricity routes content based on this value | `"hpi"` | Tech |

**Example YAML:**
```yaml
ehr_field_name: "hpi"
```

> Centricity is also referred to as "Athena Flow" in some parts of the codebase. It is a separate integration from AthenaOne.

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

No doctor-side changes are known to affect the mapping for Centricity — the integration is simpler than AMD or Athena. Any structural change to the encounter template should be escalated to tech.

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
