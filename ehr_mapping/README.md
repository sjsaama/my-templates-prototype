# EHR Mapping Reference

Per-EHR docs for the Extra Fields YAML used in the ops portal (`/v5/update_ehr_mapping/{id}`).

See [SHARED_CONFIG.md](SHARED_CONFIG.md) for config keys and `append_other_derivatives_v2` that apply to all EHRs.
See [PROPERTY_CHANGE_IMPACT.md](PROPERTY_CHANGE_IMPACT.md) for what breaks when template or section properties change, per EHR.
See [ERROR_UX.md](ERROR_UX.md) for the error detection, popup, and self-service remap UX spec.
See [CATEGORY_3.md](CATEGORY_3.md) for Cat 3 shared model (Cerner / ModMed — no field mapping, template connection required).

---

## Category 1 — Fixed field list
Field names defined by the EHR's API/spec. Dropdown hardcoded in portal. No dependency on doctor's EHR setup.

| EHR | File | YAML keys needed |
|---|---|---|
| AthenaOne | [AthenaOne.md](AthenaOne.md) | `ehr_field_name` (from fixed list) |
| ECW (main + Selective Copy) | [ECW.md](ECW.md) | `ehr_field_name`, `section_code` |
| Veradigm | [Veradigm.md](Veradigm.md) | `ehr_field_name` (from fixed list) |
| Centricity (Athena Flow) | [Centricity.md](Centricity.md) | `ehr_field_name` (from fixed list) |

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

> **Correction:** Earlier wording treated “no field list to fetch” as “skip Connect EHR entirely.” That understates the requirement. Cat 3 does **not** need section→field mapping, but it **does** need the Marvix template connected to a destination template (or document target) in the EHR. How that connection is shown in self-serve My Templates (picker vs ops-only vs display-only name) is TBD.

See [CATEGORY_3.md](CATEGORY_3.md) for shared model and per-EHR nuances.

| EHR | File | How note is pushed | Subtle difference |
|---|---|---|---|
| Cerner | [Cerner.md](Cerner.md) | Whole note as PDF via FHIR `DocumentReference` | `ehr_template_name` → PDF filename in chart |
| ModMed | [ModMed.md](ModMed.md) | Whole note as PDF via FHIR `Binary` + S3 + `DocumentReference` | Same PDF outcome as Cerner; encounter lookup can silently omit encounter link |

## Category 4 — No push capability
Marvix generates the note but cannot push it. Doctor copies manually. App should show "Copy Note" prompt.

| EHR | File | Status |
|---|---|---|
| Athena (legacy) | [Athena_Legacy.md](Athena_Legacy.md) | `save_note` returns `False` — read-only |
| ECW FHIR | [ECW_FHIR.md](ECW_FHIR.md) | `save_note` stub — auth and note-read implemented, push not |
| Greenway (Prime Suites) | [Greenway.md](Greenway.md) | On-prem — no cloud API; stub not implemented. ⚠️ Unconfirmed — verify with Vignesh. |
| Tebra | [Tebra.md](Tebra.md) | `save_note` is empty stub — not implemented. Moved from Cat 3. |
