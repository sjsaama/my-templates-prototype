# Property Change Impact — by EHR

What breaks when a template or section property changes, broken down per EHR.

There are two separate sets of properties: **Marvix-side** (our DB) and **EHR-side** (the doctor's EHR system). Both can affect whether the push works.

---

## Marvix-side properties (affect all EHRs equally)

These live in the `templates` table and `json_template` JSON.

| Property | Changed by | Impact on all EHRs |
|---|---|---|
| `template_id` | Ops — new row created on every save | ❌ Orphans doctor customizations (My Templates) and any reference that stores `template_id`. Core problem being solved in the My Templates PRD |
| `template_name` | Ops | ✅ No push impact — display only |
| Section `id` (inside `json_template`) | Auto — regenerated from 1 on every ops save | ✅ No push impact — mapping uses `key_name`, not `id` |
| Section `key_name` | Ops (rename) | ❌ Breaks macros (`Macro.section_list`), summarizers (`UploadFileTemplateMapping.anchor_section_name`), and Nereg push (auto-maps from `key_name`) — all store `key_name` as a string with no rename tracking |

---

## EHR-side properties — per EHR

### AMD

| Property | Changed by | Impact |
|---|---|---|
| `ehr_template_id` | Ops (manual) | ❌ Critical — all `ehr_field_id` and `ordinal` values in the mapping are tied to this template. Changing it means every field must be re-mapped from scratch |
| `ehr_template_name` | Auto-updated by AMD on template change | ✅ Display only — used as fallback name in push payload; no routing impact |
| `ehr_field_id` | Doctor adds/removes/reorders fields (AMD reassigns IDs) | ⚠️ Auto-recovery — Marvix catches `EhrTemplateChangeException`, re-fetches template, remaps by `ehr_field_name` + `page_name` |
| `ehr_field_name` | Doctor renames a field in AMD | ❌ Auto-recovery fails — `ehr_field_name` is the stable match key; if it changes, field is silently dropped |
| `ordinal` | Doctor reorders fields (AMD reassigns ordinals) | ⚠️ Auto-recovery — same flow as `ehr_field_id` above |
| `page_name` | Doctor renames a page in AMD | ❌ Auto-recovery fails — `page_name` is used during remap to group fields; if renamed, fields on that page are dropped |

---

### AthenaOne

| Property | Changed by | Impact |
|---|---|---|
| `ehr_template_id` | Not used for AthenaOne field routing | ✅ No impact on push — field names are fixed by Athena's API, not by a template ID |
| `ehr_template_name` | Ops | ✅ Used as document description in Centricity XML — no impact on AthenaOne section push |
| `ehr_field_name` | Fixed by Athena's embedded app API — ops picks from known list | ❌ If entered incorrectly — push fails with generic error, alert email to ops. Field names never change unless Athena updates their API |

---

### CharmHealth

| Property | Changed by | Impact |
|---|---|---|
| `ehr_template_id` | Doctor changes SOAP template | ❌ Old `ehr_field_id` values point to entries in the old template — push fails or writes to wrong fields. `ehr_template_id` is sent to Charm to attach the template to the encounter |
| `ehr_template_name` | Ops | ⚠️ Charm uses `ehr_template_name` to detect SOAP mode (checks if name starts with `"soap"`) — if renamed incorrectly, Charm switches push mode (SOAP vs default), changing failure behavior |
| `ehr_field_id` | Doctor restructures template or removes an entry | ❌ Field silently skipped (SOAP mode) or fatal error (default mode) |

---

### DrChrono

| Property | Changed by | Impact |
|---|---|---|
| `ehr_template_id` | Doctor changes note template | ❌ Some fields use `ehr_template_id` to target a specific sub-template — wrong ID sends content to wrong template |
| `ehr_template_name` | Ops | ✅ No push impact |
| `ehr_field_id` | Doctor archives or restructures a field | ❌ Push returns `False`, logged only — silently dropped |
| `ehr_field_name` | Ops (display name, also routes special fields) | ❌ If set to `icd10_codes` or `cpt_codes`, routes to special handlers — any other value uses free-text path. Wrong value silently mismaps |

---

### ECW (main — HL7 ORU)

| Property | Changed by | Impact |
|---|---|---|
| `ehr_template_id` | Not used for ECW HL7 routing | ✅ No impact |
| `ehr_template_name` | Ops | ✅ No push impact |
| `ehr_field_name` | Fixed by ECW's HL7 spec — cannot be customised by doctor | ❌ If entered incorrectly — HL7 file uploaded but ECW silently rejects the section |
| `section_code` | Fixed by ECW's HL7 spec — can break if practice IT changes ECW section config | ❌ Same — ECW silently rejects mismatched codes |

---

### ECW (Selective Copy — Scribe-it)

| Property | Changed by | Impact |
|---|---|---|
| `ehr_template_id` | Not used | ✅ No impact |
| `ehr_template_name` | Ops | ✅ No push impact |
| `ehr_field_name` | Must exactly match ECW shortcut command name including colon | ❌ If wrong — paste lands in wrong field or does nothing. Doctor may or may not notice |

---

### Centricity (Athena Flow)

| Property | Changed by | Impact |
|---|---|---|
| `ehr_template_id` | Not used | ✅ No impact |
| `ehr_template_name` | Ops | ⚠️ Used as the document title and description in the Centricity XML payload — affects how the note appears in the chart, not whether it gets there |
| `ehr_field_name` | Provided by tech — limited set | ❌ Wrong value → push fails or content goes to wrong field |

---

### Veradigm

| Property | Changed by | Impact |
|---|---|---|
| `ehr_template_id` | Not used — no template ID needed for Veradigm | ✅ No impact |
| `ehr_template_name` | Ops | ✅ No push impact — Veradigm routing is by `ehr_field_name` only |
| `ehr_field_name` | Fixed list from Veradigm's Unity API (7 sections) | ❌ Wrong value → exception raised, section not saved, no doctor feedback |

---

## Category 3 — Cerner, ModMed, Nereg

> **Correction:** Earlier wording treated “no field list to fetch” as “skip Connect EHR entirely.” Cat 3 does **not** need section→field mapping, but it **does** need the Marvix template connected to a destination template (or document target) in the EHR. See [CATEGORY_3.md](CATEGORY_3.md).

### Cerner

| Property | Changed by | Impact |
|---|---|---|
| `ehr_template_id` | Not used for field routing | ✅ No field-routing impact — template **connection** still required for destination document |
| `ehr_template_name` | Ops | ⚠️ Used as the PDF filename attached to the chart (`file_name` param) — affects the document name visible in Cerner, not section routing |
| Section structure | N/A — whole note pushed as one PDF | ✅ No per-section impact |

---

### ModMed

| Property | Changed by | Impact |
|---|---|---|
| EHR template / document connection | Ops | ⚠️ Required so the PDF attaches to the right chart destination — exact id/name fields **confirm with tech** |
| `ehr_template_name` / `ehr_template_id` | Ops | ⚠️ Usage less documented than Cerner — may affect document identity; not used for section field routing |
| Section structure | N/A — whole note pushed as one PDF | ✅ No per-section impact |
| Encounter lookup from appointment | Runtime | ⚠️ Failure is caught silently — PDF may land without encounter link |

---

### Nereg

| Property | Changed by | Impact |
|---|---|---|
| `ehr_template_id` / `ehr_template_name` | Ops | ⚠️ Not used for *field* routing historically; EHR template **connection** still required for note context — confirm exact fields with tech |
| Marvix section `key_name` | Ops (rename) / doctor | ❌ Nereg auto-maps using `key_name` as `ehr_field_name` — rename silently breaks the field mapping for that section |

---

### Category 4 EHRs (Athena legacy, ECW FHIR, Greenway, Tebra)

No push — property changes have no mapping impact. Doctor copies note manually.

---

## Quick reference — most dangerous changes

| Change | EHRs affected | Risk |
|---|---|---|
| Ops renames a section `key_name` | All EHRs (macros/summarizers) + Nereg (push) | ❌ Silent failure |
| Doctor renames a field/page in AMD | AMD | ❌ Silent field drop (auto-remap fails) |
| Doctor switches AMD template entirely | AMD | ❌ Full remap needed |
| Doctor archives a DrChrono field | DrChrono | ❌ Silent drop |
| Doctor restructures Charm SOAP template | CharmHealth | ❌ Silent skip or fatal |
| Wrong `ehr_field_name` entered | AthenaOne, ECW, Veradigm, Centricity | ❌ Silent or generic error |
| `ehr_template_name` starts with `"soap"` (case insensitive) | CharmHealth | ⚠️ Changes push mode — affects failure behavior |
