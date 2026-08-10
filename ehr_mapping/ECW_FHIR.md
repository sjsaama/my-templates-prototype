# EHR Mapping — ECW FHIR

## Category
**Not Category 4.** `save_note()` is an empty stub (`pass`) — push is not implemented yet, but ECW FHIR is **not** classified as a no-push (Cat 4) EHR. Auth and note-read are implemented; treat push as pending engineering work, not as an intentional copy-only product category.

---

## How it differs from ECW (main)

ECW FHIR and ECW main are two separate integrations for the same vendor (eClinicalWorks):

| | ECW main (HL7 ORU) | ECW FHIR |
|---|---|---|
| Protocol | HL7 ORU message uploaded to S3 | FHIR standard API (OAuth2 + JWT) |
| Note push | ✅ Works | ❌ Not implemented — `save_note()` is `pass` |
| Note read | ❌ No | ✅ Implemented — reads existing notes via `DocumentReference` |
| Auth | S3/SFTP bucket credentials | JWT client credentials (RS384), scoped FHIR tokens |
| Field mapping | Yes — `ehr_field_name` + `section_code` → HL7 OBR segments | N/A |
| Lambda `ehr_name` | `"ecw_hl7"` | ECW FHIR (separate) |

---

## What's actually implemented

**Auth (`refresh_token`)** — fully implemented. Uses RS384 JWT with `private_key`, `client_id`, `kid`, and `token_url` from Secrets Manager. Scopes: `system/Patient.read`, `system/DocumentReference.read`, `system/Encounter.read`.

**Note read (`get_notes`)** — implemented. Fetches existing notes for a patient via `GET /DocumentReference?patient={fhir_patient_id}&category=clinical-note`. Returns raw FHIR entries.

Note parsing (`__extract_note_from_response`) is commented out — it parsed CDA/XML notes into section data but was disabled pending a library update (`xml.etree.ElementTree`).

**`save_note()`** — empty `pass`. Not implemented.

**`get_appointments()`** — empty `pass`. Not implemented.

---

## Extra Fields YAML

None — push not implemented.

---

## App UX

Push is not implemented. Until write-back ships, doctors may still need to copy manually — but **do not treat this as Cat 4** (no dedicated "No push" category UX). Product placement TBD.

---

## Push errors

Not applicable — push is not implemented.

---

## Where this lives in the code

| Location | Role |
|---|---|
| `ehr_layer/ecw_fhir.py:21` | `EcwFhir` class — extends `AuthorizedEHR` |
| `ehr_layer/ecw_fhir.py:32` | `refresh_token()` — JWT client credentials auth |
| `ehr_layer/ecw_fhir.py:130` | `get_notes()` — reads existing notes via FHIR `DocumentReference` |
| `ehr_layer/ecw_fhir.py:173` | `save_note()` — empty stub |
