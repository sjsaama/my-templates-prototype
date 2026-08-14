# EHR Mapping — ModMed

## Category
**Category 3 — Auto push (PDF).** Marvix converts the full note to a PDF and pushes it to ModMed via FHIR. No section-level field mapping / Remap. **EHR template / destination document connection is still required.**

---

## Status

Active. Note push is implemented via FHIR `DocumentReference`.

---

## How Push Works

1. Note text is converted to a PDF using `fpdf` (`text_to_pdf()`)
2. A pre-signed S3 upload URL is obtained via a `POST` to the FHIR `Binary` endpoint
3. PDF is uploaded to S3 via `PUT` to the pre-signed URL
4. A FHIR `DocumentReference` is created linking the S3 PDF, attached to the patient and encounter

If an encounter ID is not provided directly, Marvix attempts to look it up from the appointment ID first.

---

## Extra Fields YAML

None — no section mapping needed. The whole note is pushed as a single PDF.

---

## App UX

Mapping column shows the auto-push label *"Whole note pushed as PDF"* on every section row (no Remap / no field picker). Output settings (sliders) are hidden.

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
| Binary URL fetch fails | ⚠️ Only `print()`s the error — does not raise or stop the push. Execution continues and a `DocumentReference` is still created, pointing at whatever (possibly empty) `s3_url` came back | Not surfaced to ops automatically; note may look "pushed" but link to a missing/broken PDF |
| S3 upload fails | ⚠️ Same as above — `print()` only, no raise. `create_note` continues and creates the `DocumentReference` regardless | Not surfaced to ops automatically |
| DocumentReference creation fails | ✅ Yes — raises `Exception(f"Note push failed: ...")` if `response.ok` is false | Ops |
| Encounter lookup from appointment fails | ⚠️ Silently caught — push continues without encounter context | Note created without encounter link; ops investigates if note not visible in chart |
