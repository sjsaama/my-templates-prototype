# EHR Mapping Reference

Per-EHR docs for the Extra Fields YAML used in the ops portal (`/v5/update_ehr_mapping/{id}`).

See [SHARED_CONFIG.md](SHARED_CONFIG.md) for config keys and `append_other_derivatives_v2` that apply to all EHRs.
See [PROPERTY_CHANGE_IMPACT.md](PROPERTY_CHANGE_IMPACT.md) for what breaks when template or section properties change, per EHR.
See [ERROR_UX.md](ERROR_UX.md) for the error detection, popup, and self-service remap UX spec.

Active EHRs below match the systems covered by My Templates (prototype + PRD). Docs for EHRs outside that set live in [`not_needed/`](not_needed/).

---

## Category 1 — Fixed field list
Field names defined by the EHR's API/spec. Dropdown hardcoded in portal. No dependency on doctor's EHR setup.

| EHR | File | YAML keys needed |
|---|---|---|
| AthenaOne | [AthenaOne.md](AthenaOne.md) | `ehr_field_name` (from fixed list) |
| ECW (main + Selective Copy) | [ECW.md](ECW.md) | `ehr_field_name`, `section_code` |
| Veradigm | [Veradigm.md](Veradigm.md) | `ehr_field_name` (from fixed list) |

## Category 2 — Flexible field list (doctor's template)
Fields come from the doctor's EHR template. Portal needs a "fetch template" step before dropdown can be populated.

| EHR | File | YAML keys needed |
|---|---|---|
| AMD | [AMD.md](AMD.md) | `ehr_field_id`, `ehr_field_name`, `ordinal` |
| DrChrono | [DrChrono.md](DrChrono.md) | `ehr_field_id`, `ehr_field_name` |
| CharmHealth | [CharmHealth.md](CharmHealth.md) | `ehr_field_id` |

## Category 3 — Auto push, no field mapping
Note pushed automatically. No mapping rows or dropdown. Ops may define section names in YAML but no template fetch is needed.

| EHR | File | How note is pushed |
|---|---|---|
| Cerner | [Cerner.md](Cerner.md) | Whole note as PDF via FHIR `DocumentReference` |
| ModMed | [ModMed.md](ModMed.md) | Whole note as PDF via FHIR `DocumentReference` |
| Nereg | [Nereg.md](Nereg.md) | Auto-mapped from section `key_name` at push time |
| Centricity (Athena Flow) | [Centricity.md](Centricity.md) | Ops defines `ehr_field_name` per section; Centricity routes content |

## Not needed (out of My Templates scope)

Archived under [`not_needed/`](not_needed/) — kept for reference, not part of the active My Templates EHR set:

| EHR | File | Why archived |
|---|---|---|
| Athena (legacy) | [not_needed/Athena_Legacy.md](not_needed/Athena_Legacy.md) | Legacy API — replaced by AthenaOne; no push |
| ECW FHIR | [not_needed/ECW_FHIR.md](not_needed/ECW_FHIR.md) | Separate integration; push not implemented |
| Greenway (Prime Suites) | [not_needed/Greenway.md](not_needed/Greenway.md) | On-prem — no cloud API |
| Tebra | [not_needed/Tebra.md](not_needed/Tebra.md) | Push stub only — not implemented |
