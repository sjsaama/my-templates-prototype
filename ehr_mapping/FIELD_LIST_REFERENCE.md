# EHR Field List — Complete Reference

Every field a section can map to, for every EHR integration, with what each field actually does on push
— verified against the real integration code in `aws_lambda/layers/ehr_layer/v1/python/ehr_layer/`, not
just the display label shown in a picker.

> **Applies equally to self-serve and ops-managed templates.** The field list a template can map to is a
> property of the **EHR integration**, not of who created the template. A doctor picking fields in a
> self-serve template and ops picking fields in the portal for an ops-managed template are choosing from
> the exact same list, with the exact same push behavior. Nothing below is self-serve-specific.

---

## Category overview

| Cat | Meaning | EHRs | Field list source |
|---|---|---|---|
| 1 | Fixed field list | AthenaOne, ECW, Veradigm, Nereg, Centricity (AthenaFlow) | Hardcoded by the EHR's API/spec — same list for every practice |
| 2 | Flexible field list | AMD, DrChrono, CharmHealth | Comes from the doctor's own EHR note template — practice-specific, not one universal list |
| 3 | Auto push, no field mapping | Cerner, ModMed | Whole note pushed as one PDF — no section-level fields at all |
| 4 | No push capability | Tebra | Read-only integration — no `save_note()` path exists |

---

## Cat 1 — AthenaOne

Fixed, hardcoded `ehr_field_name` values. Snake_case, must be exact — any deviation is silently rejected by Athena (push attempted, fails, ops-only email).

| Field | `ehr_field_name` | Notes |
|---|---|---|
| Chief Complaint | `encounterreasonnote` | |
| History of Present Illness | `hpi` | Fetches existing content first — write mode (prepend/append/replace) is functional |
| Review of Systems | `reviewofsystems` | Same fetch-first behavior as HPI |
| Physical Exam | `physicalexam` | Same fetch-first behavior as HPI |
| Assessment & Problem List | `assessment_with_problems` | Append/replace only — no fetch-and-prepend |
| Order Sets | `ordersets` | |
| **Billing Notes** | `billingnotes` | • Free-text push to the encounter's billing/services note (`__save_billing_note`)<br>• **Not related to diagnosis codes** despite the similar-sounding name — previously mislabeled in docs as "ICD-10-CM codes" |
| **ICD-10/SNOMED Diagnoses** | `diagnoses` | • The actual diagnosis-code field<br>• Extracts diagnoses from the section text, resolves SNOMED codes, pushes each via a separate diagnoses API (`__save_diagnoses`)<br>• Distinct field from `billingnotes`; was missing from earlier field-list docs entirely |
| Discussion Notes | `discussion_notes` | |
| Patient Instructions | `patient_instructions` | |

| Aspect | Detail |
|---|---|
| Write mode (append/prepend/replace) | • Functional (not cosmetic) for **HPI, Physical Exam, ROS** — Marvix does a GET before the PUT and genuinely combines with existing content<br>• **No-op for Assessment & Chief Complaint** — no fetch step; append/prepend there just toggle the EHR API's own replace flag server-side |
| `keep_bullet_points` (top-level YAML key) | • Preserves bullets on push<br>• Without it, bullets are stripped before pushing to Assessment/Plan |

---

## Cat 1 — ECW (eClinicalWorks)

ECW has **two independent push flows**. A template can use either, both, or neither — they use separate mapping rows and behave completely differently.

### Flow 1 — Main (HL7 ORU) — real server-side push

Section name + optional vendor code, written into an HL7 ORU message uploaded to ECW via S3. Entirely undetectable on failure — Lambda uploads to S3, gets a 200, and ECW processes/rejects asynchronously with zero callback.

| Field | `ehr_field_name` | `section_code` | OBR field |
|---|---|---|---|
| Chief Complaints | `Chief Complaints` | `CC` | OBR-4 |
| HPI | `HPI` | `HPI` | OBR-4 |
| HPI > General (subsection) | `HPI` | `GEN` | OBR-5 |
| Medical History | `Medical History` | `MHX` | OBR-4 |
| Surgical History | `Surgical History` | `SUR` | OBR-4 |
| Hospitalization | `Hospitalization` | `HOS` | OBR-4 |
| Family History | `Family History` | `FHX` | OBR-4 |
| Social History | `Social History` | `SHX` | OBR-4 |
| ROS | `ROS` | `ROS` | OBR-4 |
| Examination | `Examination` | `EXM` | OBR-4 |
| Examination > General (subsection) | `Examination` | `GEX` | OBR-5 |
| Physical Examination | `Physical Examination` | `PEX` | OBR-4 |
| Assessment | `Assessment` | `ASM` | OBR-4 |
| Treatment | `Treatment` | `TRT` | OBR-4 |
| Procedure | `Procedure` | `PRO` | OBR-4 |

### Flow 2 — Selective Copy ("Scribe-it") — manual copy aid, no server push

- **Completely separate, parallel mapping** — `template.selective_copy_mapping`, its own `EHRMapping` row; not a variant of Flow 1's field list.
- **No Lambda ever touches it** — nothing server-side ever formats the text.
- **Config keys don't apply here** — `separator`/`retain_headings`/etc. are Flow 1 only; whatever formatting the doctor sees is built entirely client-side, outside this repo.
- **Doctor's manual steps** — copy the note from Marvix, open ECW, paste via the shortcut command.
- **The shortcut command is an exact string including the colon** (e.g. `"HPI:"`) — ECW auto-inserts the colon when the command is invoked, so the mapping's `ehr_field_name` must match that exact text or the paste lands in the wrong field.

**Available destinations (ECW's "Shortcut Commands" group — the only valid `ehr_field_name` values):**
Chief Complaints, HPI, ROS, ROS Note, Examination, Procedures, Preventive Medicine, Allergies, Social History, Medical History, Hospitalization, Surgical History, Family History, Physical Therapy Assessment, Vitals, Assessment Notes, Treatment Notes, Clinical Notes, Assessment, Next Appointment, OB History, GYN History

> ECW's own command palette also has "Merge", "Order", and "Other" groups (merging previous notes, ordering labs/imaging, adding billing codes, locking/printing the note) — these are ECW UI actions, not places to paste note content, so they're excluded from the picker.

Two YAML keys sometimes seen alongside Scribe-it mappings (`field_label`, `replace_colon_with_dash`) are **confirmed dead code** — zero references anywhere in the Python codebase.

---

## Cat 1 — Veradigm

Fixed 7-item list. `ehr_field_name` determines which `SaveXNote` Unity API action gets called — no template ID needed, just the field name (list provided by tech). Line separator is hardcoded `\r\n` in the Lambda — not a configurable key, unlike every other EHR's `line_separator`.

| Field | `ehr_field_name` | Veradigm API action |
|---|---|---|
| History (HPI, Medical/Social/Family/Surgical Hx — combined) | `historySections` | `SaveHistoryNote` |
| Physical Exam | `physicalExams` | `SavePENote` |
| Review of Systems | `reviewOfSystem` | `SaveROSNote` |
| Assessment & Plan | `assessmentPlanHP` | `SaveAPNote` |
| Reason for Visit | `reasonsForVisit` | `SaveRFVNote` |
| Vitals | `vitals` | `SaveVitalNote` |
| ICD-10 codes | `ICD` | Separate diagnosis API, not `SaveXNote` |

---

## Cat 1 — Nereg

Fixed field list, same shape as Veradigm — no per-template fetch, no `ehr_template_id` used anywhere in the push code. The accepted `ehr_field_name` keys are a fixed set documented by tech, identical across every practice. Despite that, ops still sets `ehr_field_name` explicitly per row — there's **no auto-mapping**, despite older docs describing one; a field left unset is silently skipped, nothing is auto-derived from the Marvix section's internal `key_name`.

| `ehr_field_name` value | What happens |
|---|---|
| `chiefcomplaint`, `hpi`, `ros`, `physicalexam`, `assessmentplan`, `pastmedicalhistory` | Pushed as-is (raw section text) |
| `diagnosiscodes` | Section text scanned with regex (`[A-Z]\d{2}(?:\.\d{1,4})?`) to extract ICD-10 codes; the code list is sent instead of raw text |
| `billingcodes` | Last word of the first line of section text extracted and sent as a single CPT code |
| *(anything else)* | Still pushed as-is, but won't match a field Nereg recognizes |

**Push is all-or-nothing** — the entire note goes as one bulk `update_notes` request, not per-field. If Nereg rejects the call, there's no way to tell which field(s) caused it.

---

## Cat 1 (auto-routed) — Centricity (AthenaFlow)

- **Mechanically Cat 1** — ops sets a fixed `ehr_field_name` per section, same as AthenaOne/ECW/Veradigm.
- **But no doctor-facing field picker at all** — the doctor's UI just shows "Auto-mapped from section names."
- **Genuinely different from Cat 3 (Cerner/ModMed)** — there IS real per-section routing underneath.
- It's just not surfaced to the doctor.

| Field example | `ehr_field_name` |
|---|---|
| (representative — actual list is whatever ops enters) | `hpi`, etc. |

| Note | Detail |
|---|---|
| Special case | • If `ehr_field_name` is exactly `"Assessment and Plan"`, the section text is split on numbered headings (`"1. "`, `"2. "`, ...)<br>• Sent as separate `AandP-1`, `AandP-2`, ... entries instead of one field |
| Code note | • File is `athenaflow.py` (Centricity is also called "Athena Flow" in the codebase — a completely separate integration from AthenaOne, easy to confuse by name)<br>• Has two `save_note` methods; only `save_note_smart_launch()` is used in production<br>• The plain `save_note()` is dead code — posts an empty body and always returns success |

---

## Cat 2 — AMD (AdvancedMD)

Fields come from the specific EHR template the doctor's practice has set up in AMD — practice-specific, not a universal list. Format: `Page Name > Field Name`.

| Aspect | Detail |
|---|---|
| Field identity | • `ehr_field_id` — AMD's internal numeric ID<br>• `ehr_field_name` — stable match key for auto-remap<br>• `ordinal` — position<br>• `page_name` / `max_character_length` — auto-populated |
| Template structure | • Two levels only, no grandchildren: `Page` (parent — grouping/namespace) → `Field` (child — the actual mapping target)<br>• Mapping always targets a Field; a Page is never a mapping target itself |
| Self-serve | • Doctors can only choose among EHR templates ops has already configured for the practice (e.g. "Office Visit," "SOAP Note") — not any arbitrary AMD template<br>• Once chosen, AMD's own field list for that specific template is what gets mapped against |
| Checkbox fields (`extract_boolean_value`) | • Pushes a fixed configured value (e.g. `"Yes"`) when the section has any generated content, empty string otherwise<br>• Content-presence-driven, **not** a match against the prompt's output text<br>• Lets one section drive two AMD fields — a plain text field plus a checkbox field |
| Auto-remap | • If AMD returns "Control not found" (fields reordered/re-IDed), Marvix re-fetches the template and re-matches by `page_name` + `ehr_field_name` automatically<br>• Fails only if the page or field itself was renamed |

---

## Cat 2 — DrChrono

Fields come from the doctor's specific DrChrono clinical note template — `ehr_field_id` (numeric) is the real identifier; `ehr_field_name` is a display name that also routes two special fields:

| `ehr_field_name` value | Routed to |
|---|---|
| `icd10_codes` | ICD-10 code push handler (not free text) |
| `cpt_codes` | CPT code push handler |
| *(anything else)* | Free-text push to that field |

**Known gap:** `save_note`'s single top-level `try/except` swallows every failure — auth errors, rate limits, per-field failures — into one generic log line with zero visibility into which field(s) actually failed.

---

## Cat 2 — CharmHealth

Two completely different field-identification schemes, selected by whether `ehr_template_name` starts with `"soap"` (case-insensitive). See [CharmHealth.md](CharmHealth.md#what-is-soap-in-charmhealth) for what "SOAP" actually means here and why the routing is name-based rather than tied to Charm's real chart type.

| Mode | Field identifier | Notes |
|---|---|---|
| SOAP | • `ehr_field_id` (numeric Charm entry ID within the SOAP template) identifies every field<br>• **Except** Chief Complaint — always routes through the fixed string `ehr_field_name: "chief_complaints"` (a separate push path from every other section) | **Undetectable on failure** — Charm returns no per-field errors in SOAP mode; a field can silently fail with no exception raised at all |
| Default (non-SOAP) | • `ehr_field_name` must be one of Charm's fixed keywords (`ehr_field_id` isn't read in this mode at all)<br>• Keywords: `chief_complaints`, `symptoms`, `present_illness_history`, `past_medical_history`, `family_social_history`, `review_of_systems`, `physical_examination`, `assessment_notes`, `self_notes`, `diets`, `lifestyle`, `treatment_notes`, `patient_notes`, `followup_notes` | Any other value still gets sent to Charm but won't match existing content for append/prepend |

---

## Cat 3 — Auto push, no field mapping

| EHR | Push mechanism | Notes |
|---|---|---|
| Cerner | Whole note → PDF → FHIR `DocumentReference`, attached to the patient's chart | • No YAML, no section-level routing of any kind<br>• Either the whole note lands, or the push fails outright (auth/token errors) |
| ModMed | Same shape — whole note converted to PDF (`fpdf`) and pushed via FHIR `DocumentReference` | • Error-handling gap: if the S3 upload or pre-signed-URL fetch fails, the code only `print()`s and continues anyway<br>• Still creates a `DocumentReference` that may point at a broken/missing PDF |

---

## Cat 4 — Tebra

No field list — there is no `save_note()` method in the codebase at all (the class doesn't even subclass the shared EHR base). Read-only: appointments and patient lookup only. Doctor copies the note manually; nothing to map.

---

## Cross-EHR notes

| Topic | Detail |
|---|---|
| Write mode (append/prepend/replace) | • Works differently per EHR<br>• AMD, DrChrono, CharmHealth, Veradigm genuinely fetch existing content before combining<br>• AthenaOne only does this for HPI/Physical Exam/ROS<br>• ECW, Centricity, and Nereg never fetch existing content at all, so `append`/`prepend` are no-ops there |
| Two sections → one field | • Valid everywhere content gets combined via `SectionTextBuilder`<br>• Content order is controlled by that mapping row's own `input_fields` array, **independent of the note's own visual section order — the two can differ**<br>• Already exists server-side; My Templates prototype now has a doctor-facing "Shared" control (appears only when 2+ sections map to the same field) to set this push order explicitly, separate from note order. Real `input_fields` UI/API wiring is still needed to make it functional beyond the prototype |
| Push errors | • No EHR has a `push_errors` database table today<br>• Every failure goes to ops email and CloudWatch only<br>• None of it is visible in-app to the doctor without new backend work |

## Where this lives

Per-EHR mechanics, exact code line references, and push-error tables: see the individual files in this
directory (`AMD.md`, `AthenaOne.md`, `CharmHealth.md`, `DrChrono.md`, `ECW.md`, `Nereg.md`, `Veradigm.md`,
`Centricity.md`, `Cerner.md`, `ModMed.md`, `Tebra.md`). Config-key behavior and property-change impact:
`CONFIG_AND_PROPERTY_IMPACT.md`.
