# EHR Mapping — eClinicalWorks (ECW)

Backend mapping reference + My Templates prototype notes (`cursor/ecw-ehr-f6a6`).  
Related: [MY_TEMPLATES_PRD.md](../MY_TEMPLATES_PRD.md), [ERROR_UX.md](ERROR_UX.md), [SHARED_CONFIG.md](SHARED_CONFIG.md), [EHR_PUSH_FAILURE_LOG_ANALYSIS.md](../EHR_PUSH_FAILURE_LOG_ANALYSIS.md).

ECW is **Category 1** — fixed field list. No API fetch to populate the mapping picker. No Connect EHR step on create.

ECW has two integration modes. Each mapping row uses one or the other — not both. The My Templates picker can set **both** destinations on a section: Primary (HL7 / shortcut) and optional **Scribe-it**.


| Mode                           | How it works                                                                     |
| ------------------------------ | -------------------------------------------------------------------------------- |
| **Main (HL7 ORU)**             | Marvix builds an HL7 ORU message and uploads it to ECW via S3                    |
| **Selective Copy (Scribe-it)** | Doctor copies the note from Marvix → opens ECW → pastes via Ctrl+V + "Scribe It" |


> The template must have **Selective Copy** checked in the V2/V1 Template Editor for Scribe-it push to work.

---

## Extra Fields YAML keys

### Main (HL7 ORU)


| YAML key         | Required? | Type | Purpose                                                                                                          | Example | Source             |
| ---------------- | --------- | ---- | ---------------------------------------------------------------------------------------------------------------- | ------- | ------------------ |
| `ehr_field_name` | Yes       | Text | ECW section name — written as `ehr_field_name^ehr_field_name` into the OBR 4.0 segment of the HL7 ORU message    | `"HPI"` | Lookup table below |
| `section_code`   | No        | Text | ECW vendor code — written into OBR 5.0; required to route content to the correct subsection (e.g. HPI > General) | `"GEN"` | Lookup table below |


```yaml
ehr_field_name: "HPI"
section_code: "HPI"
```

**Subsection example:**

```yaml
ehr_field_name: "HPI"
section_code: "GEN"
```

### Selective Copy (Scribe-it)


| YAML key                  | Required? | Type    | Purpose                                                                                 | Example  | Source            |
| ------------------------- | --------- | ------- | --------------------------------------------------------------------------------------- | -------- | ----------------- |
| `ehr_field_name`          | Yes       | Text    | Exact ECW shortcut command name including colon — used as the paste target in Scribe-it | `"HPI:"` | ECW shortcut list |
| `field_label`             | No        | Text    | ⚠️ Not found in Lambda code — may be unused or legacy                                   | `"HPI:"` | —                 |
| `replace_colon_with_dash` | No        | Boolean | ⚠️ Not found in Lambda code — may be unused or legacy                                   | `true`   | —                 |


```yaml
ehr_field_name: "HPI:"
```

### Section names and codes (HL7)


| Section                          | `ehr_field_name`       | `section_code` | OBR segment |
| -------------------------------- | ---------------------- | -------------- | ----------- |
| Chief Complaints                 | `Chief Complaints`     | `CC`           | OBR 4.0     |
| HPI                              | `HPI`                  | `HPI`          | OBR 4.0     |
| HPI > General subsection         | `HPI`                  | `GEN`          | OBR 5.0     |
| Medical History                  | `Medical History`      | `MHX`          | OBR 4.0     |
| Surgical History                 | `Surgical History`     | `SUR`          | OBR 4.0     |
| Hospitalization                  | `Hospitalization`      | `HOS`          | OBR 4.0     |
| Family History                   | `Family History`       | `FHX`          | OBR 4.0     |
| Social History                   | `Social History`       | `SHX`          | OBR 4.0     |
| ROS                              | `ROS`                  | `ROS`          | OBR 4.0     |
| Examination                      | `Examination`          | `EXM`          | OBR 4.0     |
| Examination > General subsection | `Examination`          | `GEX`          | OBR 5.0     |
| Physical Examination             | `Physical Examination` | `PEX`          | OBR 4.0     |
| Assessment                       | `Assessment`           | `ASM`          | OBR 4.0     |
| Treatment                        | `Treatment`            | `TRT`          | OBR 4.0     |
| Procedure                        | `Procedure`            | `PRO`          | OBR 4.0     |


### Selective Copy — available shortcut commands

**Shortcut Commands:** Chief Complaints · HPI · ROS · ROS Note · Examination · Procedures · Preventive Medicine · Allergies · Social History · Medical History · Hospitalization · Surgical History · Family History · Physical Therapy Assessment · Vitals · Assessment Notes · Treatment Notes · Clinical Notes · Assessment · Next Appointment · OB History · GYN History

**Merge / Order / Other:** see ops onboarding lists (Merge Last Progress Notes, Order {Lab/DI/…}, Lock Progress Notes, etc.).

**Prototype Primary picker** shows shortcut commands **with trailing colon** (`HPI:`, `Assessment:`) — the literal commands eCW recognizes for paste / selective copy. HL7 YAML still uses names without colon + `section_code`.

**Prototype Scribe-it picker** uses a separate note-panel list (`ScribeIt > HPI`, `ScribeIt > Physical Exam`, …).

---

## What doctors can change


| Why                               | Doctor / Admin action                   | Effect on mapping                                                  | Needs ops?                                                  |
| --------------------------------- | --------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------- |
| Wrong Primary shortcut            | Remap from fixed list in My Templates   | Points at a different `ehr_field_name`                             | No                                                          |
| Wrong Scribe-it destination       | Remap Scribe-it column                  | Different paste target                                             | No                                                          |
| Practice IT changed section codes | Admin changes ECW section structure     | `section_code` mismatch — HL7 uploaded but ECW may reject silently | Yes — update `section_code` in YAML                         |
| New Scribe-it configuration       | Practice / doctor shortcut list changes | Paste lands wrong or does nothing                                  | Sometimes — remap if shortcut still in fixed list; else ops |


No AMD-style auto-remap. Remap is **Flow A** — reopen fixed dropdown, no API call.

---

## Settings — global and local

Product model: **template defaults**, with **per-section overrides only where noted**.  
YAML today still stores some values per row (`config.`*) until Template Settings migration lands.


| Scope | Settings |
|---|---|
| **Global** | **Character limit** (`char_limit`). **Section / subsection separators** (`separator`). **Line separator** (`line_separator`) — ECW HL7 main only. Subsection join (`push_subsections`, `retain_headings`, `skip_empty_subsections`) → Template Settings |
| **Local** | Additional text, Default negative |
| **Not on ECW** | **Push setting** (`append` / `prepend`) — AMD-only (ECW does not fetch existing note content) |


### `line_separator`


| Key              | Type | What it does                                                                                                                 |
| ---------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------- |
| `line_separator` | Text | Replaces all `\n` with this string — required for the ECW HL7 ORU pipeline to format correctly. Not used for Selective Copy. |


Common value: `\X0A\` (HL7 hex LF). Prototype template bar exposes this control.

### Other `config` keys (moving to Template Settings)


| Key                                                               | Useful?                | Notes                                    |
| ----------------------------------------------------------------- | ---------------------- | ---------------------------------------- |
| `append` / `prepend`                                              | ❌ No                   | ECW does not fetch existing note content |
| `separator`                                                       | ✅ Yes                  | → Template Settings                      |
| `char_limit`                                                      | ✅ Yes                  | → Template Settings (global)             |
| `push_subsections` / `retain_headings` / `skip_empty_subsections` | ✅ Yes                  | → Template Settings                      |
| `line_separator`                                                  | ✅ Yes — main mode only | → Template Settings                      |


---

## Push errors

### Surface (in-app)

Errors appear at **two levels** at once when detectable / ops-flagged:

1. **Template banner** — summary
2. **Section row strip** — primary action surface


| Action              | Meaning                                                   |
| ------------------- | --------------------------------------------------------- |
| **Remap**           | Open dual-column picker → Primary and/or Scribe-it → Save |
| **Got it**          | Dismiss awareness (rare for eCW)                          |
| **Contact support** | Ops / practice admin must act                             |


### Note text (HL7 ORU) — largely undetectable

Lambda uploads the HL7 file to S3 and receives a 200. ECW polls S3 asynchronously with **no callback**. Lambda never knows if ECW accepted or rejected the note text.


| What can go wrong                        | How it fails                                    | Visible? | Doctor sees                    | Actions                                                     |
| ---------------------------------------- | ----------------------------------------------- | -------- | ------------------------------ | ----------------------------------------------------------- |
| Wrong `section_code` or `ehr_field_name` | HL7 uploaded; ECW rejects or misroutes silently | ❌ No     | Nothing unless ops spot-checks | Ops YAML / doctor Remap after spot-check (`mapping_broken`) |
| ECW system issue                         | File never processed                            | ❌ No     | Nothing                        | Ops                                                         |


**Mitigation:** ops spot-checks the ECW chart after onboarding and after any mapping change. Prototype scenario: `ecw_wrong_shortcut`.

### Selective Copy (Scribe-it) — entirely manual

Marvix has no automated push for this path. Doctor copies and pastes. Wrong shortcut → paste lands wrong or does nothing. Doctor may notice. Prototype: `ecw_scribeit_mismatch` (Remap + Contact support).

### Order sections — detectable as Lambda WARNINGs

Order pushes (lab, prescription, referral, imaging, procedure, vaccine) **do** surface as WARNINGs in Lambda when pattern matching fails — these are **not** note-text HL7 failures.

Log pattern (May–Aug 2026, ~2,100 records):  
`Couldn't find any Orders of type: [order_type], pattern matching failed or empty field provided`


| Order type                                      | Approx. 3-mo count |
| ----------------------------------------------- | ------------------ |
| vaccine_order / procedure_order / imaging_order | ~392 each          |
| referral_order                                  | ~374               |
| lab_order                                       | ~366               |
| prescription_order                              | ~184               |



| Error                 | Behaviour today                           | Doctor sees                                                      | Actions                                                                                   |
| --------------------- | ----------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Order config mismatch | WARNING in Lambda; ops email / CloudWatch | "Couldn't find any Orders of type: … Support has been notified." | Contact support only (`order_config`) — Remap of note-text fields will not fix order YAML |


> **PRD footnote:** Saying “all ECW failures are undetectable” is overstated. **Note text** failures remain undetectable; **order-section** failures surface as WARNINGs.

Prototype tweak: `ecw_order_config`.

### Action matrix


| Type                                                       | Remap | Got it | Contact support      |
| ---------------------------------------------------------- | ----- | ------ | -------------------- |
| `mapping_broken` (spot-check / wrong shortcut / Scribe-it) | ✅     | —      | ✅                    |
| `order_config`                                             | —     | —      | ✅                    |
| Note text silent reject                                    | —     | —      | — (no in-app signal) |


### Proactive validation (Layer 2)


| Check                                             | Feasible?            |
| ------------------------------------------------- | -------------------- |
| `ehr_field_name` in known shortcut / section list | ✅ Free — no API call |
| `section_code` in known codes for that section    | ✅ Free               |


Run on mapping save / Validate Mapping / nightly job.

---

## Code


| Location                            | Role                                                        |
| ----------------------------------- | ----------------------------------------------------------- |
| `ehr_layer/section_text_builder.py` | Reads `config` keys including `line_separator` at push time |
| HL7 ORU builder / S3 upload         | Main mode push — 200 from S3 ≠ ECW acceptance               |
| Order push paths                    | WARNING on pattern match failure                            |


---

## My Templates prototype

Branch `cursor/ecw-ehr-f6a6` — visual / UX only. EHR locked to **eCW**. Entry: `index.html`.

PRD is structured as **two ownership flows** — see [MY_TEMPLATES_PRD.md](../MY_TEMPLATES_PRD.md).

### Flow 1 — Ops-operated

Ops owns structure. Doctor remaps Primary / Scribe-it, tunes output + global Character limit / Line separator, **Request New Section**, **Reset to default**. No Add section / Prompt edit.

### Flow 2 — Self-serve

Doctor owns structure. **Create template** (no Connect EHR — Cat 1), **+ Add section**, **Prompt** edit, remap, output settings. No Reset / Request.

### Capability matrix

| Capability | Ops-operated | Self-serve |
|---|---|---|
| List tab / Remap Primary + Scribe-it / output settings | ✅ | ✅ |
| Global Character limit + Line separator | ✅ | ✅ |
| Preview / Save | ✅ | ✅ |
| **Reset to default** | ✅ only | ❌ |
| **Request New Section** | ✅ only | ❌ |
| **+ Add section** / **Prompt** edit | ❌ | ✅ |
| **Create → Connect EHR** | ❌ | ❌ — Cat 1 fixed list; create skips Connect |

### Subtle UI elements

| Element | Behaviour |
|---|---|
| Dual-column picker | **Primary** (shortcut commands with `:`) + **Scribe-it** (optional note-panel fields). Both optional. |
| Scribe-it table column | Shown only when EHR is eCW |
| Field labels | Shortcut commands shown as-is (`HPI:`) — literal eCW commands |
| Shared field (2+ parents → one destination) | Neutral **Shared** chip; push order = Marvix UI section order |
| No Push setting | ECW cannot read existing field content |
| Line separator bar | Template-level; HL7 main only |

### Gaps / open product questions

1. **ECW selective copy — user-level vs. practice-level** — Which fields are owned at user vs practice level? Affects whether remap UI is per-doctor or per-practice. (Owner: Vignesh)
2. **When to surface order WARNINGs in-app** — Today ops-only via logs/email; prototype shows Contact support if we promote them to `push_errors`.
3. **HL7 YAML vs UI colon** — Align ops portal display (no colon + `section_code`) with doctor-facing shortcut colon convention.

### Footnotes

† **ECW FHIR** is a separate Cat 4 integration (`ECW_FHIR.md`) — not this branch.  
†† **Path style** — Primary: `HPI:` / `Assessment:`; Scribe-it: `ScribeIt > Title Case`.
