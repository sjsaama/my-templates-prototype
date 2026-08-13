# EHR Mapping Reference

Per-EHR docs for the Extra Fields YAML used in the ops portal (`/v5/update_ehr_mapping/{id}`).

See [FIELD_LIST_REFERENCE.md](FIELD_LIST_REFERENCE.md) for the complete field list per EHR in one place — every mappable field, its real push semantics, and cross-EHR notes. Applies equally to self-serve and ops-managed templates; the field list is a property of the EHR, not of who created the template.
See [CONFIG_AND_PROPERTY_IMPACT.md](CONFIG_AND_PROPERTY_IMPACT.md) for config keys shared across EHRs (`append_other_derivatives_v2`, write mode, etc.) and what breaks when template or section properties change, per EHR.
See [ERROR_UX.md](ERROR_UX.md) for the error detection, popup, and self-service remap UX spec.

**Out of scope for this version:** Athena (legacy), Greenway, and ECW FHIR are not push-capable integrations in active use and are excluded from this reference set.

---

## Category 1 — Fixed field list
Field names defined by the EHR's API/spec. Dropdown hardcoded in portal. No dependency on doctor's EHR setup.

| EHR | File | YAML keys needed |
|---|---|---|
| AthenaOne | [AthenaOne.md](AthenaOne.md) | `ehr_field_name` (from fixed list) |
| ECW (main + Selective Copy) | [ECW.md](ECW.md) | `ehr_field_name`, `section_code` |
| Veradigm | [Veradigm.md](Veradigm.md) | `ehr_field_name` (from fixed list) |
| Nereg | [Nereg.md](Nereg.md) | `ehr_field_name` (from fixed list — explicit per field, no `key_name` auto-mapping) |
| Centricity (Athena Flow), auto-routed | [Centricity.md](Centricity.md) | `ehr_field_name` (from fixed list) — mechanically Cat 1, but there's no doctor-facing field picker; ops sets it directly and the doctor's UI just shows "Auto-mapped from section names" |

## Category 2 — Flexible field list (doctor's template)
Fields come from the doctor's EHR template. Portal needs a "fetch template" step before dropdown can be populated.

| EHR | File | YAML keys needed |
|---|---|---|
| AMD | [AMD.md](AMD.md) | `ehr_field_id`, `ehr_field_name`, `ordinal` |
| DrChrono | [DrChrono.md](DrChrono.md) | `ehr_field_id`, `ehr_field_name` |
| CharmHealth | [CharmHealth.md](CharmHealth.md) | `ehr_field_id` (SOAP mode) or `ehr_field_name` (default mode) |

## Category 3 — Auto push, no field mapping
Note pushed automatically. No mapping rows or dropdown, no per-section routing of any kind — either the whole note lands, or the push fails outright. Genuinely different from Centricity above: Centricity has real per-section field routing under the hood, it's just not doctor-facing.

| EHR | File | How note is pushed |
|---|---|---|
| Cerner | [Cerner.md](Cerner.md) | Whole note as PDF via FHIR `DocumentReference` |
| ModMed | [ModMed.md](ModMed.md) | Whole note as PDF via FHIR `DocumentReference` |

## Category 4 — No push capability
Marvix generates the note but cannot push it. Doctor copies manually. App should show "Copy Note" prompt.

| EHR | File | Status |
|---|---|---|
| Tebra | [Tebra.md](Tebra.md) | No `save_note()` method exists — class doesn't subclass `EHR`/`AuthorizedEHR`. Moved from Cat 3. |
