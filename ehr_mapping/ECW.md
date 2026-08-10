# EHR Mapping — eClinicalWorks (ECW)

ECW has two integration modes. Each mapping row uses one or the other — not both.

| Mode | How it works |
|---|---|
| **Main (HL7 ORU)** | Marvix builds an HL7 ORU message and uploads it to ECW via S3 |
| **Selective Copy (Scribe-it)** | Doctor copies the note from Marvix → opens ECW → pastes via Ctrl+V + "Scribe It" |

> The template must have **Selective Copy** checked in the V2/V1 Template Editor for Scribe-it push to work.

---

## Main (HL7 ORU) — Extra Fields YAML keys

| YAML key | Required? | Type | Purpose | Example | Source |
|---|---|---|---|---|---|
| `ehr_field_name` | Yes | Text | ECW section name — written as `ehr_field_name^ehr_field_name` into the OBR 4.0 segment of the HL7 ORU message | `"HPI"` | Lookup table below |
| `section_code` | No | Text | ECW vendor code — written into OBR 5.0; required to route content to the correct subsection (e.g. HPI > General) | `"GEN"` | Lookup table below |

**Example YAML:**
```yaml
ehr_field_name: "HPI"
section_code: "HPI"
```

**Subsection example:**
```yaml
ehr_field_name: "HPI"
section_code: "GEN"
```

### Section names and codes

| Section | `ehr_field_name` | `section_code` | OBR segment |
|---|---|---|---|
| Chief Complaints | `Chief Complaints` | `CC` | OBR 4.0 |
| HPI | `HPI` | `HPI` | OBR 4.0 |
| HPI > General subsection | `HPI` | `GEN` | OBR 5.0 |
| Medical History | `Medical History` | `MHX` | OBR 4.0 |
| Surgical History | `Surgical History` | `SUR` | OBR 4.0 |
| Hospitalization | `Hospitalization` | `HOS` | OBR 4.0 |
| Family History | `Family History` | `FHX` | OBR 4.0 |
| Social History | `Social History` | `SHX` | OBR 4.0 |
| ROS | `ROS` | `ROS` | OBR 4.0 |
| Examination | `Examination` | `EXM` | OBR 4.0 |
| Examination > General subsection | `Examination` | `GEX` | OBR 5.0 |
| Physical Examination | `Physical Examination` | `PEX` | OBR 4.0 |
| Assessment | `Assessment` | `ASM` | OBR 4.0 |
| Treatment | `Treatment` | `TRT` | OBR 4.0 |
| Procedure | `Procedure` | `PRO` | OBR 4.0 |

---

## Selective Copy (Scribe-it) — Extra Fields YAML keys

| YAML key | Required? | Type | Purpose | Example | Source |
|---|---|---|---|---|---|
| `ehr_field_name` | Yes | Text | Exact ECW shortcut command name including colon — used as the paste target in Scribe-it | `"HPI:"` | ECW shortcut list |
| `field_label` | No | Text | ⚠️ Not found in Lambda code — may be unused or legacy | `"HPI:"` | — |
| `replace_colon_with_dash` | No | Boolean | ⚠️ Not found in Lambda code — may be unused or legacy | `true` | — |

**Example YAML:**
```yaml
ehr_field_name: "HPI:"
```

### Selective Copy — available shortcut commands

These are the ECW shortcut commands available for Scribe-it paste targets:

**Shortcut Commands section:**
Chief Complaints · HPI · ROS · ROS Note · Examination · Procedures · Preventive Medicine · Allergies · Social History · Medical History · Hospitalization · Surgical History · Family History · Physical Therapy Assessment · Vitals · Assessment Notes · Treatment Notes · Clinical Notes · Assessment · Next Appointment · OB History · GYN History

**Merge section:**
Examination · Merge Last Progress Notes · Merge Template · Merge {Section Names} From Last Progress Note · ROS · Procedures · Examination · Physical Therapy Assessment

**Order section:**
List Order Set · Order {Lab/DI/Procedure/Immunization} · List Templates · List Assessments

**Other section:**
Add EM · Add CPT · Lock Progress Notes · Print Visit Summary · Use Template · Verify All History · Vitals Taken · Assign Progress Notes To · Import All History · Print Progress Note · Fax PN to PCP

---

## Relevant `config` keys

| Key | Useful? | Notes |
|---|---|---|
| `append` | ❌ No | ECW does not fetch existing note content |
| `prepend` | ❌ No | Same as above |
| `separator` | ✅ Yes | **→ Moving to Template Settings** |
| `char_limit` | ✅ Yes | **→ Moving to Template Settings** |
| `push_subsections` | ✅ Yes | **→ Moving to Template Settings** |
| `retain_headings` | ✅ Yes | **→ Moving to Template Settings** |
| `skip_empty_subsections` | ✅ Yes | **→ Moving to Template Settings** |
| `line_separator` | ✅ Yes — main mode only | **Required** for HL7 ORU formatting. Not needed for Selective Copy. **→ Moving to Template Settings** |

> `separator`, `char_limit`, `push_subsections`, `retain_headings`, `skip_empty_subsections`, and `line_separator` are being promoted to a global **Template Settings** level. Doctors will configure them once per template rather than per mapping row.

---

## `config` key specific to ECW

| Key | Type | What it does |
|---|---|---|
| `line_separator` | Text | Replaces all `\n` with this string — required for the ECW HL7 ORU pipeline to format correctly |

---

## What doctors can change

| Why doctor does this | Doctor / Admin action | Effect on mapping | Needs ops? |
|---|---|---|---|
| Practice IT did a system update or customisation; new Scribe-it configuration | Admin changes section structure or codes | `section_code` mismatch — HL7 file uploaded but ECW silently rejects it | ❌ Yes — update `section_code` in YAML |

---

## What breaks the mapping

| Mode | What breaks it | How it fails | Visible to doctor? |
|---|---|---|---|
| Main | Wrong `section_code` or `ehr_field_name` | HL7 file written to S3, ECW rejects silently | No — no feedback from ECW |
| Selective Copy | `ehr_field_name` doesn't exactly match ECW shortcut command | Scribe-it paste lands in wrong field or does nothing | Sometimes — doctor may notice wrong field |

---

## Push errors

**Main (HL7 ORU) mode — entirely undetectable:**

Lambda uploads the HL7 file to S3 and receives a 200. ECW polls S3 and processes the file asynchronously with no callback to Marvix. Lambda never knows if ECW accepted or rejected the note.

| What can go wrong | How it fails | Visible? |
|---|---|---|
| Wrong `section_code` or `ehr_field_name` | HL7 file uploaded, ECW silently rejects or routes to wrong field | ❌ No |
| ECW system issue | HL7 file uploaded, ECW never processes | ❌ No |

**Selective Copy (Scribe-it) mode — entirely manual:**

Marvix has no push mechanism. Doctor copies and pastes. No errors are detectable.

**Mitigation**: ops spot-checks the ECW chart after onboarding and after any mapping change.

---

## Where this lives in the code

| Location | Role |
|---|---|
| `ehr_layer/section_text_builder.py` | Reads `config` keys including `line_separator` at push time |
