# Shared Config — All EHRs

Per-section config options. Every key here lives in the Extra Fields YAML for a mapping row — one row = one section. Some keys go inside the `config:` sub-object; the rest are top-level in the YAML. Both are read by `section_text_builder.py` at push time.

---

## Common — applies to all push EHRs

> **Planned — Template Settings:** The keys `separator` (section + subsection), `char_limit`, `push_subsections`, `retain_headings`, `skip_empty_subsections`, `line_separator` (ECW HL7; Veradigm uses hardcoded `\r\n`), and `keep_bullet_points` are **global template settings** — doctors set them once per template, not in the per-section content-shaping panel. See [MY_TEMPLATES_PRD.md](../MY_TEMPLATES_PRD.md) → Template-level settings. The per-section YAML path remains the source of truth until migration is complete.

### How subsections are combined into one EHR field
These three work together: first decide whether to include subsections, then whether to label them, then what to put between them.

| Key | Where in YAML | Type | Default | What it does | Doctor-facing? |
|---|---|---|---|---|---|
| `push_subsections` | `config.push_subsections` | Boolean | true | Include child subsections in the pushed text. If false, only the parent section's own text is pushed — subsections are ignored. | Yes — Cat 1 + Cat 2, parent sections. **→ Moving to Template Settings** |
| `retain_headings` | `config.retain_headings` | Boolean | false | When joining sections/subsections into one EHR field, prefix each block with its name (e.g. "Onset: …"). Off = omit headings (same intent as “first-line heading omit”). Only applies when `push_subsections` is true. | Yes — Cat 1 + Cat 2. **→ Moving to Template Settings (global)** |
| `separator` | `config.separator` | Text | `\n` | Text inserted between subsections when joined into one block. Only applies when `push_subsections` is true. | Yes — Cat 1 + Cat 2, parent sections. **→ Moving to Template Settings** |
| `skip_separator_between_children` | top-level | Boolean | false | Use no separator between child subsections — tighter spacing. Overrides `separator` at the child level. | Yes — Cat 1 + Cat 2, parent sections |
| `skip_empty_subsections` | `config.skip_empty_subsections` | Boolean | false | Exclude subsections that have no generated content from the joined output. | Yes — Cat 1 + Cat 2. **→ Moving to Template Settings** |

### Content shaping
| Key | Where in YAML | Type | Default | What it does | Doctor-facing? |
|---|---|---|---|---|---|
| `keep_bullet_points` | top-level | Boolean | false | Keep bullet characters in pushed text. By default bullets are stripped before push. | Yes — all push EHRs. **→ Moving to Template Settings (global)** |
| `pre_literal` | top-level | Text | — | Fixed text prepended before section content on push (supports unicode escapes e.g. `•` for `•`). Skipped if already present in target field. | Yes — all push EHRs |
| `post_literal` | top-level | Text | — | Fixed text appended after section content on push. Planned — not yet in codebase. | Yes — all push EHRs |
| `default_negative` | top-level | Text | — | Text pushed when the section has no generated content (e.g. "Not reported"). Without this, empty sections push nothing. | Yes — all push EHRs |
| `char_limit` | `config.char_limit` | Number | — | Truncates pushed text to N characters. Limit is set by the EHR field, not the doctor. **→ Moving to Template Settings** | Read-only display only |

### Write mode (where EHR supports read-before-write)
| Key | Where in YAML | Type | Default | What it does | Doctor-facing? |
|---|---|---|---|---|---|
| `append` | `config.append` | Boolean | false | Append Marvix content after existing content already in the EHR field | Yes — AMD, AthenaOne, DrChrono only |
| `prepend` | `config.prepend` | Boolean | false | Prepend Marvix content before existing content already in the EHR field | Yes — AMD, AthenaOne, DrChrono only |

---

## EHR-specific

| Key | Where in YAML | Type | EHR | What it does | Doctor-facing? |
|---|---|---|---|---|---|
| `line_separator` | `config.line_separator` | Text | ECW HL7 only | Replaces all `\n` with this string before writing — required for HL7 ORU formatting. **→ Moving to Template Settings** | No — formatting detail, ops sets during onboarding |
| `extract_boolean_value` | top-level | Text | AMD | If section has content, pushes this value to an AMD checkbox field; empty string if no content | Yes — doctor sets which value maps to "checked" |

> **Veradigm**: uses `\r\n` as line separator, hardcoded in the Lambda (`veradigm.py:807`) — not a configurable key.

---

## Pull from another template

Same product idea, two backend paths today — treat as one doctor-facing model: **content from another Marvix template is attached to a section on this template and mapped to an EHR destination.**

### Sub-template IDs (ICD / CPT / EM, etc.)

`sub_template_ids` is a JSONB column on `EHRMapping` — not a YAML key. Updated via ops endpoint `/update_ehr_mapping_subtemplates`. Used when the source is a code/sub-template rather than free text.

- **AMD**: templates are practice-level. Ops fetches field IDs from 2–3 templates per onboarding.
- **DrChrono**: ICD/CPT fields supported; template API access needed.
- **CharmHealth**: no templates API. Workaround — create a dummy note, pull it via API, extract field IDs manually. API access shared with Shrutesh; pricing is extra cost, outcome unknown.
- **Doctor-facing**: picker UI (select from templates), not raw ID entry.

### Derivative append

| YAML key | Type | What it does |
|---|---|---|
| `append_other_derivatives_v2` | List | Pull content from another derivative note (e.g. AVS) and append into this EHR field after the main section content |

```yaml
append_other_derivatives_v2:
  - derivative_key: AVS        # which derivative to pull from
    template_name: AVS Note    # optional — targets a specific template name within that derivative
```

> Spacing between main content and appended derivative is controlled by `config.separator`. `separator` is **not** valid inside this list.

> **PRD:** Do not present derivative append and ICD/CPT/EM as unrelated features — both are “pull from another template into this section.” Unify UX pending Vignesh + Nandini.

---

## Unresolved / planned

| Key | Status | Notes |
|---|---|---|
| `prevent` | ❓ Not in codebase | Described as "prevents content from being pushed in specific cases" — may be planned, or may refer to `push_subsections: false` |

---

## Where this lives in the code

| Location | Role |
|---|---|
| `ehr_layer/section_text_builder.py` | Reads all config and top-level YAML keys at push time |
| `ehr_layer/athenaone.py:517` | `pre_literal` applied in AthenaOne section push |
| `ehr_layer/veradigm.py:807` | Hardcoded `special_separator="\r\n"` |
| `internal_endpoints.py:2807` | Serialises extra_fields → YAML on read |
| `internal_endpoints.py:3764` | Deserialises YAML → flat dict on save |
| `internal_endpoints.py:4067` | `/update_ehr_mapping_subtemplates` — sub_template_ids ops endpoint |
