# Category 3 — Auto push, no field mapping (template connection required)

EHRs: **Cerner**, **ModMed**

> **Nereg moved to Category 2** — structured auto-mapping into a connected EHR note template, with doctor remap locked. See [Nereg.md](Nereg.md).

See also: [Cerner.md](Cerner.md) · [ModMed.md](ModMed.md)

---

## Shared model


|                                        |                                                                                     |
| -------------------------------------- | ----------------------------------------------------------------------------------- |
| Per-section field mapping              | **Not needed** — no mapping rows, no field picker, no Extra Fields YAML for routing |
| Output settings (sliders)              | **Hidden** — nothing to configure per field                                         |
| Remap on push error                    | **Not shown** — errors are ops/infra, not doctor remap                              |
| Connect to a template in the final EHR | **Required** — destination template / document target (no section→field mapping)    |


> **Note:** Earlier PRD drafts said Cat 3 skips Connect EHR because there is no field list to fetch. Destination connection is still required; **how it appears in self-serve UI is an open question** — see below.

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
- **`ehr_template_name`** is used as the PDF `file_name` in the chart — cosmetic for routing, but it is the visible document name in Cerner.
- Breaks on FHIR auth / wrong `ehr_doctor_id` or `ehr_patient_id`, not on section mapping.

### ModMed — single PDF, different FHIR path

- Same product outcome as Cerner (one PDF in chart), different upload path: `text_to_pdf` → FHIR `Binary` (pre-signed S3 URL) → `PUT` PDF → create `DocumentReference`.
- If encounter ID is missing, ModMed tries appointment → encounter lookup; failure is **caught silently** and push continues without encounter context — note may be harder to find in chart.
- No section YAML. App label: *“Whole note pushed as PDF.”*
- Template-connection fields beyond document attachment are less documented than Cerner’s `ehr_template_name` — confirm with tech what ops stores today.

---

## Implications for My Templates (deferred)

- Mapping column stays “Whole note pushed as PDF”; sliders hidden.
- ModMed encounter-link gap remains ops-only today.

Self-serve Connect EHR presentation is **not** decided here — see Open questions.

---

## Open questions


| Question                                                                                                                      | Why it matters                                                                            | Owner          |
| ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------- |
| **Cat 3 self-serve Connect EHR UI** — picker (destination only) vs ops-provisioned + display-only name vs ops-only?           | Earlier drafts skipped Connect EHR; connection is required, but presentation is undecided | Product        |
| What exact EHR object do ops connect for Cerner / ModMed today (`ehr_template_id`, name only, document type, something else)? | Defines Connect EHR UI                                                                    | Tech / Vignesh |
| Should Cat 3 self-serve Connect EHR be mandatory, optional, or ops-provisioned only for v1?                                   | Creation-flow scope                                                                       | Product        |
| Does ModMed store / use `ehr_template_name` like Cerner’s PDF filename?                                                       | Parity in template-connection model                                                       | Tech           |
