# Shared Config & Property Change Impact — All EHRs

Two related references, combined: what each config key does (Part 1), and what breaks when a
template/section/EHR-side property changes (Part 2). Per-EHR field-mapping formats, push errors, and
code locations live in each EHR's own file (see [README.md](README.md)) — this doc only covers behavior
that's shared across EHRs or spans more than one EHR's mapping.

---

# Part 1 — Config Keys Reference

Per-section config options. Every key here lives in the Extra Fields YAML for a mapping row — one row = one section. Some keys go inside the `config:` sub-object; the rest are top-level in the YAML. Both are read by `section_text_builder.py` at push time.

## Common — applies to all push EHRs

> **Planned — Template Settings:** The keys `separator`, `char_limit`, `push_subsections`, `retain_headings`, `skip_empty_subsections`, and `line_separator` are being promoted from per-section YAML to a global **Template Settings** level. Doctors will set them once per template rather than per mapping row. The per-section YAML path remains the source of truth until migration is complete.

### How subsections are combined into one EHR field
These three work together: first decide whether to include subsections, then whether to label them, then what to put between them.

| Key | Where in YAML | Type | Default | What it does | Doctor-facing? |
|---|---|---|---|---|---|
| `push_subsections` | `config.push_subsections` | Boolean | true | Include child subsections in the pushed text. If false, only the parent section's own text is pushed — subsections are ignored. | Yes — Cat 1 + Cat 2, parent sections. **→ Moving to Template Settings** |
| `retain_headings` | `config.retain_headings` | Boolean | false | Prefix each subsection's content with its name (e.g. "Onset: …"). Only applies when `push_subsections` is true. | Yes — Cat 1 + Cat 2. **→ Moving to Template Settings** |
| `separator` | `config.separator` | Text | `\n` | Text inserted between subsections when joined into one block. Only applies when `push_subsections` is true. | Yes — Cat 1 + Cat 2, parent sections. **→ Moving to Template Settings** |
| `skip_separator_between_children` | top-level | Boolean | false | Forces a single newline (`\n`) between child subsections instead of the configured `separator` — not literally "no separator". | Yes — Cat 1 + Cat 2, parent sections |
| `skip_empty_subsections` | `config.skip_empty_subsections` | Boolean | false | Exclude subsections that have no generated content from the joined output. | Yes — Cat 1 + Cat 2. **→ Moving to Template Settings** |

### Content shaping
| Key | Where in YAML | Type | Default | What it does | Doctor-facing? |
|---|---|---|---|---|---|
| `keep_bullet_points` | top-level | Boolean | false | Keep bullet characters in pushed text. By default bullets are stripped before push. | Yes — all push EHRs |
| `pre_literal` | top-level | Text | — | Fixed text prepended to the new content (supports unicode escapes e.g. `•` for `•`) — but **only** when the EHR field already has existing content fetched from the EHR (i.e. append/prepend scenarios); it has no effect when pushing into an empty field. For AMD/DrChrono/CharmHealth/Veradigm this goes through the generic `SectionTextBuilder`/`VeradigmSectionTextBuilder`, which has no de-dup check. AthenaOne's assessment-with-problems diagnosis-combining path (`athenaone.py` ~684-702, ~823-841, ~1458-1476) is a separate, EHR-specific implementation that *does* skip re-adding `pre_literal` if it's already present in the existing diagnosis text — that "skipped if already present" behavior is not part of the generic mechanism. | Yes — AMD, DrChrono, CharmHealth, Veradigm, AthenaOne |
| `post_literal` | top-level | Text | — | Fixed text appended after section content on push. Planned — not yet in codebase. | Yes — all push EHRs |
| `default_negative` | top-level | Text | — | ❓ Not found in codebase — no reference in `section_text_builder.py`, `helpers.py`, or elsewhere in `ehr_layer`/`app`. Likely planned, not implemented. | Unconfirmed |
| `char_limit` | `config.char_limit` | Number | — | Truncates pushed text to N characters. Limit is set by the EHR field, not the doctor. **→ Moving to Template Settings** | Read-only display only |

### Write mode (where EHR supports read-before-write)
| Key | Where in YAML | Type | Default | What it does | Doctor-facing? |
|---|---|---|---|---|---|
| `append` | `config.append` | Boolean | false | Append Marvix content after existing content already in the EHR field | Yes — AMD, AthenaOne, DrChrono, CharmHealth, Veradigm |
| `prepend` | `config.prepend` | Boolean | false | Prepend Marvix content before existing content already in the EHR field | Yes — AMD, DrChrono, CharmHealth, Veradigm. AthenaOne: only for HPI/Physical Exam/ROS (Assessment/Chief Complaint have no separate prepend flag) |

> AthenaOne doesn't go through the generic `SectionTextBuilder` append/prepend path at all — HPI/Physical
> Exam/ROS do their own GET-before-PUT combine, and Assessment/Chief Complaint just toggle the EHR API's
> own replace flag. See [AthenaOne.md](AthenaOne.md).

## EHR-specific

| Key | Where in YAML | Type | EHR | What it does | Doctor-facing? |
|---|---|---|---|---|---|
| `line_separator` | `config.line_separator` | Text | ECW HL7 only | Replaces all `\n` with this string before writing — required for HL7 ORU formatting. **→ Moving to Template Settings** | No — formatting detail, ops sets during onboarding |
| `extract_boolean_value` | top-level | Text | AMD | If section has content, pushes this value to an AMD checkbox field; empty string if no content | No — today this is an ops-portal YAML key like any other mapping field; there's no doctor-facing UI for it. Whether it should become doctor-settable in a self-serve model is open — see My Templates PRD open questions |

> **Veradigm**: uses `\r\n` as line separator, hardcoded in the Lambda (`veradigm.py:807`) — not a configurable key.

## Sub-template IDs

`sub_template_ids` is a JSONB column on `EHRMapping` — not a YAML key. Updated via ops endpoint `/update_ehr_mapping_subtemplates`. Used for template-driven fields like ICD / CPT codes where the doctor selects from available templates rather than pushing free text.

- **AMD**: templates are practice-level. Ops fetches field IDs from 2–3 templates per onboarding.
- **DrChrono**: ICD/CPT fields supported; template API access needed.
- **CharmHealth**: no templates API. Workaround — create a dummy note, pull it via API, extract field IDs manually. API access shared with Shrutesh; pricing is extra cost, outcome unknown.
- **Doctor-facing**: picker UI (select from templates), not raw ID entry.

## Derivative append

| YAML key | Type | What it does |
|---|---|---|
| `append_other_derivatives_v2` | List | Pull content from another derivative note (e.g. AVS) and append into this EHR field after the main section content |

```yaml
append_other_derivatives_v2:
  - derivative_key: AVS        # which derivative to pull from
    template_name: AVS Note    # optional — targets a specific template name within that derivative
```

> Spacing between main content and appended derivative is controlled by `config.separator`. `separator` is **not** valid inside this list.

## Unresolved / planned

| Key | Status | Notes |
|---|---|---|
| `prevent` | ❓ Not in codebase | Described as "prevents content from being pushed in specific cases" — may be planned, or may refer to `push_subsections: false` |

## Where config keys live in the code

| Location | Role |
|---|---|
| `ehr_layer/section_text_builder.py` | Reads all config and top-level YAML keys at push time |
| `ehr_layer/athenaone.py:1688` | `pre_literal` passed into AthenaOne's diagnosis-combining section push; actual apply/skip logic at ~684-702, ~823-841, ~1458-1476 |
| `ehr_layer/veradigm.py:808` | Hardcoded `special_separator="\r\n"` |
| `app/routers/internal_endpoints.py:3118` | Serialises extra_fields → YAML on read (`yaml.dump`) |
| `app/routers/internal_endpoints.py:4270` | Deserialises YAML → flat dict on save (`yaml.safe_load`) |
| `app/routers/internal_endpoints.py:4373` | `/update_ehr_mapping_subtemplates` — sub_template_ids ops endpoint |

---

# Part 2 — Property Change Impact

What breaks when a template or section property changes, broken down per EHR.

There are two separate sets of properties: **Marvix-side** (our DB) and **EHR-side** (the doctor's EHR system). Both can affect whether the push works.

## Marvix-side properties (affect all EHRs equally)

These live in the `templates` table and `json_template` JSON.

| Property | Changed by | Impact on all EHRs |
|---|---|---|
| `template_id` | Ops — new row created on every save | ❌ Orphans doctor customizations (My Templates) and any reference that stores `template_id`. Core problem being solved in the My Templates PRD |
| `template_name` | Ops | ✅ No push impact — display only |
| Section `id` (inside `json_template`) | Auto — regenerated from 1 on every ops save | ✅ No push impact — mapping uses `key_name`, not `id` |
| Section `key_name` | Ops (rename) | ❌ Breaks macros (`Macro.section_list`), summarizers (`UploadFileTemplateMapping.anchor_section_name`), and section-content lookup for **every** push EHR — each `ehr_mapping` row's `input_fields` reference the section by `key_name` (read via `SectionTextBuilder`/`get_section_text`), so a rename silently drops that section's content from the push regardless of EHR. All of these store `key_name` as a plain string with no rename tracking. (Nereg does **not** auto-map `ehr_field_name` from `key_name` — see [Nereg.md](Nereg.md) — but it's still subject to this same `input_fields` lookup issue like any other EHR.) |

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

### AthenaOne

| Property | Changed by | Impact |
|---|---|---|
| `ehr_template_id` | Not used for AthenaOne field routing | ✅ No impact on push — field names are fixed by Athena's API, not by a template ID |
| `ehr_template_name` | Ops | ✅ Not referenced anywhere in `athenaone.py` — no impact on AthenaOne section push. (The "document description in Centricity XML" behavior belongs to `athenaflow.py`'s unused `save_note()` method — a different EHR entirely; see [Centricity.md](Centricity.md).) |
| `ehr_field_name` | Fixed by Athena's embedded app API — ops picks from known list | ❌ If entered incorrectly — push fails with generic error, alert email to ops. Field names never change unless Athena updates their API |

### CharmHealth

| Property | Changed by | Impact |
|---|---|---|
| `ehr_template_id` | Doctor changes SOAP template | ❌ Old `ehr_field_id` values point to entries in the old template — push fails or writes to wrong fields. `ehr_template_id` is sent to Charm to attach the template to the encounter |
| `ehr_template_name` | Ops | ⚠️ Charm uses `ehr_template_name` to detect SOAP mode (checks if name starts with `"soap"`) — if renamed incorrectly, Charm switches push mode (SOAP vs default), changing failure behavior |
| `ehr_field_id` | Doctor restructures template or removes an entry | ❌ Field silently skipped (SOAP mode) or fatal error (default mode) |

### DrChrono

| Property | Changed by | Impact |
|---|---|---|
| `ehr_template_id` | Doctor changes note template | ❌ Some fields use `ehr_template_id` to target a specific sub-template — wrong ID sends content to wrong template |
| `ehr_template_name` | Ops | ✅ No push impact |
| `ehr_field_id` | Doctor archives or restructures a field | ❌ Push returns `False`, logged only — silently dropped |
| `ehr_field_name` | Ops (display name, also routes special fields) | ❌ If set to `icd10_codes` or `cpt_codes`, routes to special handlers — any other value uses free-text path. Wrong value silently mismaps |

### ECW (main — HL7 ORU)

| Property | Changed by | Impact |
|---|---|---|
| `ehr_template_id` | Not used for ECW HL7 routing | ✅ No impact |
| `ehr_template_name` | Ops | ✅ No push impact |
| `ehr_field_name` | Fixed by ECW's HL7 spec — cannot be customised by doctor | ❌ If entered incorrectly — HL7 file uploaded but ECW silently rejects the section |
| `section_code` | Fixed by ECW's HL7 spec — can break if practice IT changes ECW section config | ❌ Same — ECW silently rejects mismatched codes |

### ECW (Selective Copy — Scribe-it)

| Property | Changed by | Impact |
|---|---|---|
| `ehr_template_id` | Not used | ✅ No impact |
| `ehr_template_name` | Ops | ✅ No push impact |
| `ehr_field_name` | Must exactly match ECW shortcut command name including colon | ❌ If wrong — paste lands in wrong field or does nothing. Doctor may or may not notice |

### Centricity (Athena Flow)

| Property | Changed by | Impact |
|---|---|---|
| `ehr_template_id` | Not used | ✅ No impact |
| `ehr_template_name` | Ops | ✅ Not used by the actual production push path (`save_note_smart_launch()`/`__construct_note_to_push()` don't take it at all). It only appears in `athenaflow.py`'s plain `save_note()` method (as the XML document title/description) — that method is not called anywhere in the Lambda functions or app, so this has no real-world push impact today |
| `ehr_field_name` | Provided by tech — limited set | ❌ Wrong value → push fails or content goes to wrong field |

### Veradigm

| Property | Changed by | Impact |
|---|---|---|
| `ehr_template_id` | Not used — no template ID needed for Veradigm | ✅ No impact |
| `ehr_template_name` | Ops | ✅ No push impact — Veradigm routing is by `ehr_field_name` only |
| `ehr_field_name` | Fixed list from Veradigm's Unity API (7 sections) | ❌ Wrong value → exception raised, section not saved, no doctor feedback |

### Cerner

| Property | Changed by | Impact |
|---|---|---|
| `ehr_template_id` | Not used — no field mapping | ✅ No impact |
| `ehr_template_name` | Ops | ⚠️ Used as the PDF filename attached to the chart (`file_name` param) — affects the document name visible in Cerner, not routing |
| Section structure | N/A — whole note pushed as one PDF | ✅ No per-section impact |

### Nereg

| Property | Changed by | Impact |
|---|---|---|
| `ehr_template_id` | Not used | ✅ No impact |
| `ehr_template_name` | Not used | ✅ No impact |
| Marvix section `key_name` | Ops (rename) | ⚠️ Nereg does **not** auto-map `ehr_field_name` from `key_name` (each mapping row sets `ehr_field_name` explicitly — see [Nereg.md](Nereg.md)). But like every push EHR, the mapping row's `input_fields` still reference the section by `key_name` to pull its text; renaming breaks that lookup the same way it would for any other EHR, silently dropping the section's content |

### Category 4 EHRs (Tebra)

No push — property changes have no mapping impact. Doctor copies note manually.

> Note: ModMed is **not** Category 4 — it's Category 3 (auto push, no field mapping). It pushes the whole
> note as a PDF via FHIR `DocumentReference`; there's no section-level mapping for a property change to
> break. See [ModMed.md](ModMed.md).

## Quick reference — most dangerous changes

| Change | EHRs affected | Risk |
|---|---|---|
| Ops renames a section `key_name` | All EHRs (macros/summarizers, and every push EHR's `input_fields` content lookup — not Nereg-specific) | ❌ Silent failure |
| Doctor renames a field/page in AMD | AMD | ❌ Silent field drop (auto-remap fails) |
| Doctor switches AMD template entirely | AMD | ❌ Full remap needed |
| Doctor archives a DrChrono field | DrChrono | ❌ Silent drop |
| Doctor restructures Charm SOAP template | CharmHealth | ❌ Silent skip or fatal |
| Wrong `ehr_field_name` entered | AthenaOne, ECW, Veradigm, Centricity | ❌ Silent or generic error |
| `ehr_template_name` starts with `"soap"` (case insensitive) | CharmHealth | ⚠️ Changes push mode — affects failure behavior |
