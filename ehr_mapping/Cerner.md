# EHR Mapping — Cerner

## Category
**Category 3 — Auto push, no field mapping (template connection required).** Whole note → one PDF. No section-level routing or Extra Fields YAML.

Destination template / document connection is still required; self-serve Connect EHR UI is an **open question** — see [CATEGORY_3.md](CATEGORY_3.md)#open-questions.

See [CATEGORY_3.md](CATEGORY_3.md) for shared Cat 3 model and how Cerner differs from ModMed.

---

## Template connection (required)

No per-section field mapping, but the Marvix template still must be **connected to a destination in Cerner**.

| Property | Role |
|---|---|
| `ehr_template_name` | Used as the PDF **filename** attached to the chart (`file_name`). Affects the document name doctors see in Cerner, not field routing. |
| `ehr_template_id` | Not used for field routing |

How this connection is exposed in My Templates self-serve is an **open question** — see [CATEGORY_3.md](CATEGORY_3.md)#open-questions.

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

No section→field mapping to break. Reshaping the Marvix note template does not change Cerner field routing. Push still depends on FHIR auth, correct doctor/patient IDs, and a valid template/document connection for the PDF name/destination.

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
