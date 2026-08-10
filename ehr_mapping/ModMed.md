# EHR Mapping — ModMed

## Category
**Category 3 — Auto push, no field mapping (template connection required).** Full note → one PDF via FHIR. No section-level mapping.

Destination template / document connection is still required; self-serve Connect EHR UI is an **open question** — see [CATEGORY_3.md](CATEGORY_3.md)#open-questions.

See [CATEGORY_3.md](CATEGORY_3.md) for shared Cat 3 model and how ModMed differs from Cerner.

---

## Status

Active. Note push is implemented via FHIR `DocumentReference`.

---

## Template connection (required)

No per-section field mapping, but the Marvix template still must be **connected to a destination in ModMed** (document / encounter attachment target).

| Property | Role |
|---|---|
| Destination template / document target | Required so the PDF lands on the right chart artifact |
| `ehr_template_name` / `ehr_template_id` | Exact usage less documented than Cerner — **confirm with tech** whether ModMed mirrors Cerner’s PDF filename behavior |

How this connection is exposed in My Templates self-serve is an **open question** — see [CATEGORY_3.md](CATEGORY_3.md)#open-questions.

---

## How Push Works

1. Note text is converted to a PDF using `fpdf` (`text_to_pdf()`)
2. A pre-signed S3 upload URL is obtained via a `POST` to the FHIR `Binary` endpoint
3. PDF is uploaded to S3 via `PUT` to the pre-signed URL
4. A FHIR `DocumentReference` is created linking the S3 PDF, attached to the patient and encounter

If an encounter ID is not provided directly, Marvix attempts to look it up from the appointment ID first.

**Nuance vs Cerner:** Same outcome (one PDF in chart), different FHIR path (`Binary` + S3 vs inline base64 `DocumentReference`).

---

## Extra Fields YAML

None — no section mapping needed. The whole note is pushed as a single PDF.

---

## App UX

No mapping column picker in My Templates. The template page shows: *"Whole note pushed as PDF."*

---

## Where this lives in the code

| Location | Role |
|---|---|
| `ehr_layer/modmed.py:14` | `text_to_pdf()` — converts note string to PDF bytes using fpdf |
| `ehr_layer/modmed.py:337` | `POST Binary` — gets S3 pre-signed URL from ModMed FHIR endpoint |
| `ehr_layer/modmed.py:344` | `PUT` PDF to S3 pre-signed URL |
| `ehr_layer/modmed.py:349` | Creates FHIR `DocumentReference` with PDF attachment |

---

## Push Errors

| Scenario | Detectable? | Resolution |
|---|---|---|
| Binary URL fetch fails | ✅ Yes — `response.ok` check | Ops |
| S3 upload fails | ✅ Yes — `response.ok` check | Ops |
| DocumentReference creation fails | ✅ Yes (assumed) | Ops |
| Encounter lookup from appointment fails | ⚠️ Silently caught — push continues without encounter context | Note created without encounter link; ops investigates if note not visible in chart |
