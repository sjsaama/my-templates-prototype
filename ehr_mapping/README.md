# EHR Mapping Reference

Per-EHR docs for the Extra Fields YAML used in the ops portal (`/v5/update_ehr_mapping/{id}`).

See [SHARED_CONFIG.md](SHARED_CONFIG.md) for config keys and `append_other_derivatives_v2` that apply to all EHRs.
See [PROPERTY_CHANGE_IMPACT.md](PROPERTY_CHANGE_IMPACT.md) for what breaks when template or section properties change, per EHR.
See [ERROR_UX.md](ERROR_UX.md) for the error detection, popup, and self-service remap UX spec.

---

## Category 1 — Fixed field list
Field names defined by the EHR's API/spec. Dropdown hardcoded in portal. No dependency on doctor's EHR setup.

| EHR | File | YAML keys needed |
|---|---|---|
| AthenaOne | [AthenaOne.md](AthenaOne.md) | `ehr_field_name` (fixed 9-field list; human-readable labels in My Templates) |
| ECW (main + Selective Copy) | [ECW.md](ECW.md) | `ehr_field_name`, `section_code` |
| Veradigm | [Veradigm.md](Veradigm.md) | `ehr_field_name` (from fixed list) |
| Centricity (Athena Flow) | [Centricity.md](Centricity.md) | `ehr_field_name` (from fixed list) — same product as Athena Flow |

## Category 2 — Flexible field list (doctor's template)
Fields come from the doctor's EHR template. Portal needs a "fetch template" / Connect EHR step. Most Cat 2 EHRs expose a doctor field picker; **Nereg is the exception** — connected template + auto `key_name` mapping, doctor cannot remap.

| EHR | File | YAML keys needed | Doctor mapping |
|---|---|---|---|
| AMD | [AMD.md](AMD.md) | `ehr_field_id`, `ehr_field_name`, `ordinal` | Remap from fetched list |
| DrChrono | [DrChrono.md](DrChrono.md) | `ehr_field_id`, `ehr_field_name` | Remap from fetched list |
| CharmHealth | [CharmHealth.md](CharmHealth.md) | `ehr_field_id` | Remap from existing list (no re-fetch) |
| Nereg | [Nereg.md](Nereg.md) | None — auto from section `key_name` | **Locked** — no picker / no remap; fix via `key_name` + connected template |

## Category 3 — Auto push, no field mapping (template connection required)

No per-section field mapping / dropdown. **EHR template connection is still required** (destination document or note template).

| EHR | File | How note is pushed |
|---|---|---|
| Cerner | [Cerner.md](Cerner.md) | Whole note as PDF via FHIR `DocumentReference` |
| ModMed | [ModMed.md](ModMed.md) | Whole note as PDF via FHIR |

> **No Category 4.** Athena legacy, ECW FHIR, Greenway, and Tebra are **not** in the My Templates taxonomy. Backend stub docs may remain under `ehr_mapping/` for engineering reference only — they are not doctor-facing categories.
