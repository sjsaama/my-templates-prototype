# EHR Mapping Reference

Per-EHR docs for My Templates — YAML keys, what doctors can change, what breaks the mapping, and push errors.

Canonical product decisions (categories, doctor UX, push error copy) live in [`MY_TEMPLATES_PRD.md`](../MY_TEMPLATES_PRD.md). Docs for EHRs / shared notes outside that scope live in [`not_needed/`](not_needed/).

---

## Category 1 — Fixed field list

Field names defined by the EHR's API/spec. Dropdown hardcoded — no dependency on doctor's EHR setup.

| EHR | File | YAML keys needed |
|---|---|---|
| AthenaOne | [AthenaOne.md](AthenaOne.md) | `ehr_field_name` (from fixed list) |
| ECW (main + Selective Copy) | [ECW.md](ECW.md) | `ehr_field_name`, `section_code` |
| Veradigm | [Veradigm.md](Veradigm.md) | `ehr_field_name` (from fixed list) |

## Category 2 — Flexible field list (doctor's template)

Fields come from the doctor's EHR template.

| EHR | File | YAML keys needed |
|---|---|---|
| AMD | [AMD.md](AMD.md) | `ehr_field_id`, `ehr_field_name`, `ordinal` |
| DrChrono | [DrChrono.md](DrChrono.md) | `ehr_field_id`, `ehr_field_name` |
| CharmHealth | [CharmHealth.md](CharmHealth.md) | `ehr_field_id` |

## Category 3 — Auto push, no field mapping

Note pushed automatically. No mapping rows or doctor field picker.

| EHR | File | How note is pushed |
|---|---|---|
| Cerner | [Cerner.md](Cerner.md) | Whole note as PDF via FHIR `DocumentReference` |
| ModMed | [ModMed.md](ModMed.md) | Whole note as PDF via FHIR `DocumentReference` |
| Nereg | [Nereg.md](Nereg.md) | Auto-mapped from section `key_name` at push time |
| Centricity (Athena Flow) | [Centricity.md](Centricity.md) | Ops defines `ehr_field_name` per section; Centricity routes content |

## Not needed

Archived under [`not_needed/`](not_needed/) — out-of-scope EHRs and superseded shared drafts. See that folder's README.
