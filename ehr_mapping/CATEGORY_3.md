# Category 3 — Auto push, no field mapping (template connection required)

EHRs: **Cerner**, **ModMed**

> **Nereg moved to Category 2** — structured auto-mapping into a connected EHR note template, with doctor remap locked. See [Nereg.md](Nereg.md).

See also: [Cerner.md](Cerner.md) · [ModMed.md](ModMed.md)

---

## Shared model


|                                        |                                                                                                                                                       |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Per-section field mapping              | **Not needed** — no mapping rows, no field picker, no Extra Fields YAML for routing                                                                   |
| Output settings (sliders)              | **Hidden** — nothing to configure per field                                                                                                           |
| Remap on push error                    | **Not shown** — errors are ops/infra, not doctor remap                                                                                                |
| Connect to a template in the final EHR | **Required** — Marvix still ties the note to an EHR-side destination (template / document target), even though sections are not mapped field-by-field |


### Correction vs earlier PRD wording

The PRD previously said Cat 3 skips **Connect EHR** entirely because there is no field list to fetch. That understates the real requirement:

> Cat 3 does **not** need section→field mapping, but it **does** need the Marvix template connected to a destination template (or document target) in the EHR.

How that connection is shown in self-serve My Templates (picker vs ops-only vs display-only name) is **TBD** — document the nuances below first, then design UX.

**Do not equate** “no field mapping” with “no Connect EHR.” Skipping the field picker is correct; skipping destination-template connection is not.

---

## How the two differ


|                                 | Cerner                                                                                       | ModMed                                                                                |
| ------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| What lands in the EHR           | One **PDF** attached to the chart                                                            | One **PDF** attached to the chart                                                     |
| Push mechanism                  | FHIR `DocumentReference` (PDF base64)                                                        | FHIR `Binary` → S3 → `DocumentReference`                                              |
| Section-level routing           | None — whole note is one doc                                                                 | None — whole note is one doc                                                          |
| Extra Fields YAML               | None                                                                                         | None                                                                                  |
| What “connect template” means   | Destination document identity; `ehr_template_name` becomes the **PDF filename** in the chart | Destination document / encounter attachment for the PDF                               |
| Doctor-visible mapping column   | “Whole note pushed as PDF”                                                                   | “Whole note pushed as PDF”                                                            |
| Silent failure mode             | Wrong doctor/patient ID → wrong chart or fail                                                | Encounter lookup from appointment can fail; push continues **without** encounter link |
| Per-section formatting `config` | N/A (single PDF)                                                                             | N/A (single PDF)                                                                      |


---

## Per-EHR nuances (detail)

### Cerner — single PDF document

- Full note → PDF → `POST /DocumentReference`.
- No section structure impact; doctor can reshape the Marvix note template freely without breaking field routing.
- `**ehr_template_name`** is used as the PDF `file_name` in the chart — cosmetic for routing, but it is the visible document name in Cerner.
- Breaks on FHIR auth / wrong `ehr_doctor_id` or `ehr_patient_id`, not on section mapping.

### ModMed — single PDF, different FHIR path

- Same product outcome as Cerner (one PDF in chart), different upload path: `text_to_pdf` → FHIR `Binary` (pre-signed S3 URL) → `PUT` PDF → create `DocumentReference`.
- If encounter ID is missing, ModMed tries appointment → encounter lookup; failure is **caught silently** and push continues without encounter context — note may be harder to find in chart.
- No section YAML. App label: *“Whole note pushed as PDF.”*
- Template-connection fields beyond document attachment are less documented than Cerner’s `ehr_template_name` — confirm with tech what ops stores today.

---

## Implications for My Templates (open — do not implement yet)

1. **Connect EHR for Cat 3** — Should self-serve creation include a template/document picker (like Cat 2) that only selects the destination, with no field fetch? Or is connection ops-only with a read-only label in the editor?
2. **Editor chrome** — Keep mapping column as “Whole note pushed as PDF,” not pickers; keep sliders hidden.
3. **ModMed encounter gap** — If notes land without encounter link, is that doctor-visible? Today it is ops-only.

---

## Open questions


| Question                                                                                                                      | Why it matters                      | Owner          |
| ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | -------------- |
| What exact EHR object do ops connect for Cerner / ModMed today (`ehr_template_id`, name only, document type, something else)? | Defines Connect EHR UI              | Tech / Vignesh |
| Should Cat 3 self-serve “Connect EHR” be mandatory, optional, or ops-provisioned only for v1?                                 | Creation-flow scope                 | Product        |
| Does ModMed store / use `ehr_template_name` like Cerner’s PDF filename?                                                       | Parity in template-connection model | Tech           |
