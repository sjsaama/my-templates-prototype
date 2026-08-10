# EHR Mapping — Cerner

## Category
**Category 3 — No field mapping.** Marvix pushes the entire note as a single PDF. No section-level routing, no YAML, no mapping rows needed.

---

## How note push works

Marvix converts the full generated note to a PDF and uploads it to Cerner as a **FHIR `DocumentReference`** resource. The note lands in the patient's chart as an attached document — not in individual structured fields.

```
Note text → PDF (base64) → POST /DocumentReference → Cerner patient chart
```

---

## Extra Fields YAML

None required.

---

## Relevant `config` keys

Not applicable — the note is pushed as a single PDF. Config keys that control per-section text formatting have no effect.

---

## What doctors can change

No mapping to break. As long as the FHIR integration is active and the doctor/patient IDs are correct, the PDF will land in the chart regardless of how the doctor structures their note template.

---

## What breaks the push

| What breaks it | How it fails | Visible to doctor? |
|---|---|---|
| FHIR access token expired or revoked | Push fails with auth error | No — ops/tech notified |
| Wrong `ehr_doctor_id` or `ehr_patient_id` | PDF attached to wrong chart or fails | No — silent |

---

## Push errors

| Error | Exception | Behaviour | Doctor-actionable? |
|---|---|---|---|
| FHIR token expired | `ValueError` | Retried | ❌ No — ops reconnects integration |
| Note push rejected by FHIR endpoint | bare `Exception`: `"Note push failed: ..."` | Retried | ❌ No — ops investigates |

No field-level mapping errors possible — note is pushed as a single PDF. If the push succeeds, the full note is in the chart.

---

## Where this lives in the code

| Location | Role |
|---|---|
| `ehr_layer/cerner.py:293` | `save_note()` — converts note to PDF and posts as FHIR `DocumentReference` |
