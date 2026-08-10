# Category 3 — Auto push, no field mapping (template connection required)

EHRs: **Cerner**, **ModMed**, **Nereg**

See also: [Cerner.md](Cerner.md) · [ModMed.md](ModMed.md) · [Nereg.md](Nereg.md)

---

## Shared model

| | |
|---|---|
| Per-section field mapping | **Not needed** — no mapping rows, no field picker, no Extra Fields YAML for routing |
| Output settings (sliders) | **Hidden** — nothing to configure per field |
| Remap on push error | **Not shown** — errors are ops/infra, not doctor remap |
| Connect to a template in the final EHR | **Required** — Marvix still ties the note to an EHR-side destination (template / document target), even though sections are not mapped field-by-field |

### Correction vs earlier PRD wording

The PRD previously said Cat 3 skips **Connect EHR** entirely because there is no field list to fetch. That understates the real requirement:

> Cat 3 does **not** need section→field mapping, but it **does** need the Marvix template connected to a destination template (or document target) in the EHR.

How that connection is shown in self-serve My Templates (picker vs ops-only vs display-only name) is **TBD** — document the nuances below first, then design UX.

**Do not equate** “no field mapping” with “no Connect EHR.” Skipping the field picker is correct; skipping destination-template connection is not.

---

## How the three differ

| | Cerner | ModMed | Nereg |
|---|---|---|---|
| What lands in the EHR | One **PDF** attached to the chart | One **PDF** attached to the chart | **Structured section content** into Nereg fields |
| Push mechanism | FHIR `DocumentReference` (PDF base64) | FHIR `Binary` → S3 → `DocumentReference` | Auto-map Marvix `key_name` → Nereg field |
| Section-level routing | None — whole note is one doc | None — whole note is one doc | Implicit — by section `key_name` |
| Extra Fields YAML | None | None | None (mapping built at push time) |
| What “connect template” means | Destination document identity; `ehr_template_name` becomes the **PDF filename** in the chart | Destination document / encounter attachment for the PDF | EHR note template context for auto-routed sections (exact ID/name usage needs confirm — see open questions) |
| Doctor-visible mapping column | “Whole note pushed as PDF” | “Whole note pushed as PDF” | “Auto-mapped from section names” |
| Silent failure mode | Wrong doctor/patient ID → wrong chart or fail | Encounter lookup from appointment can fail; push continues **without** encounter link | Wrong / renamed `key_name` → field **silently skipped** |
| Per-section formatting `config` | N/A (single PDF) | N/A (single PDF) | Hardcoded in push (`separator`, `retain_headings`, etc.) — not doctor-configurable |

---

## Per-EHR nuances (detail)

### Cerner — single PDF document

- Full note → PDF → `POST /DocumentReference`.
- No section structure impact; doctor can reshape the Marvix template freely without breaking field routing.
- **`ehr_template_name`** is used as the PDF `file_name` in the chart — cosmetic for routing, but it is the visible document name in Cerner.
- Breaks on FHIR auth / wrong `ehr_doctor_id` or `ehr_patient_id`, not on section mapping.

### ModMed — single PDF, different FHIR path

- Same product outcome as Cerner (one PDF in chart), different upload path: `text_to_pdf` → FHIR `Binary` (pre-signed S3 URL) → `PUT` PDF → create `DocumentReference`.
- If encounter ID is missing, ModMed tries appointment → encounter lookup; failure is **caught silently** and push continues without encounter context — note may be harder to find in chart.
- No section YAML. App label: *“Whole note pushed as PDF.”*
- Template-connection fields beyond document attachment are less documented than Cerner’s `ehr_template_name` — confirm with tech what ops stores today.

### Nereg — auto field routing (not a PDF)

- **Not** a single-document push. Closest Cat 3 sibling to Cat 1/2 behavior, but without a manual mapping UI.
- At push time, each Marvix section’s `key_name` becomes `ehr_field_name`. Ops does not enter YAML rows.
- **`Assessment and Plan`** is split into individual diagnosis entries automatically.
- Renaming a section `key_name` (ops or doctor) **silently breaks** that section’s push — Nereg skips unrecognized names.
- Docs previously said `ehr_template_id` / `ehr_template_name` are unused for routing. That may still be true for *field* routing while an EHR template connection is still required for *where* the note is written — **needs confirmation**.

---

## Implications for My Templates (open — do not implement yet)

Capture for a later UX pass:

1. **Connect EHR for Cat 3** — Should self-serve creation include a template/document picker (like Cat 2) that only selects the destination, with no field fetch? Or is connection ops-only with a read-only label in the editor?
2. **Shared vs different pickers** — Cerner/ModMed may only need a document/template name; Nereg may need a real EHR note template even though fields auto-map.
3. **Nereg rename warning** — PRD already flags: renaming a section can break auto-mapping; surface a warning (not yet in prototype).
4. **Editor chrome** — Keep mapping column as status labels (PDF / auto-mapped), not pickers; keep sliders hidden.
5. **ModMed encounter gap** — If notes land without encounter link, is that doctor-visible? Today it is ops-only.

---

## Open questions

| Question | Why it matters | Owner |
|---|---|---|
| What exact EHR object do ops connect for Cerner / ModMed / Nereg today (`ehr_template_id`, name only, document type, something else)? | Defines Connect EHR UI | Tech / Vignesh |
| Is Nereg’s EHR template required at connection time, or only correct `key_name`s on the Marvix side? | Whether Nereg gets a picker or only a rename warning | Tech |
| Should Cat 3 self-serve “Connect EHR” be mandatory, optional, or ops-provisioned only for v1? | Creation-flow scope | Product |
| Does ModMed store / use `ehr_template_name` like Cerner’s PDF filename? | Parity in template-connection model | Tech |
