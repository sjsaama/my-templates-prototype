# EHR Mapping — AdvancedMD (AMD)

Backend mapping reference + My Templates prototype notes (`cursor/amd-ehr-34b9`).  
Related: [MY_TEMPLATES_PRD.md](../MY_TEMPLATES_PRD.md), [ERROR_UX.md](ERROR_UX.md), [SHARED_CONFIG.md](SHARED_CONFIG.md).

---

## Extra Fields YAML keys

| YAML key               | Required? | Type   | Purpose | Example | Source |
| ---------------------- | --------- | ------ | ------- | ------- | ------ |
| `ehr_field_id`         | Yes       | Number | AMD internal field ID — push payload `@id` | `12345` | Postman API |
| `ehr_field_name`       | Yes       | Text   | Stable match key for auto-remap (finds new `ehr_field_id` by name) | `"History of Present Illness"` | Postman API |
| `ordinal`              | Yes       | Number | Field position — push payload `@ordinal` | `1` | Postman API |
| `page_name`            | Auto      | Text   | AMD page — groups fields in payload + auto-remap | — | Backend (AMD API) |
| `max_character_length` | Auto      | Number | Per-field limit from AMD API — informs global Character limit + too-long errors | — | Backend (AMD API) |

```yaml
ehr_field_id: 12345
ehr_field_name: "History of Present Illness"
ordinal: 1
```

> `page_name` and `max_character_length` are auto-populated on save — do not enter manually.

---

## What doctors can change

| Why | Doctor / Admin action | Effect on mapping | Needs ops? |
| --- | --------------------- | ----------------- | ---------- |
| Layout / add-remove-reorder fields | AMD reassigns `@id` / `@ordinal` | Auto-recovery: re-fetch, rematch by `page_name` + `ehr_field_name` | No |
| Rename page or field | Labels change in AMD | Auto-remap fails — field silently dropped | Yes — update YAML names |
| Switch AMD template entirely | New visit type / standardised template | Mapping points at wrong template | Yes — new `ehr_template_id` + remap |

### Auto-remap

On AMD `"Control not found"` → `EhrTemplateChangeException`:

1. Re-fetch AMD template  
2. Rematch by `page_name` + `ehr_field_name` → new `@id` / `@ordinal`  
3. Update mapping and retry  

Fails if names were renamed — ops updates YAML.

---

## Settings — global and local

Product model: **template defaults**, with **per-section overrides only where noted**.  
YAML today still stores some values per row (`config.*`) until Template Settings migration lands.

**Hierarchy (where override is allowed):** Global (template) → applied to each section → optional local override in output settings.

### Global (template only)

| Setting | YAML today | Notes |
| ------- | ---------- | ----- |
| **Push setting** | `append` / `prepend` / neither (= overwrite) | One control — see below. Global default → applied to sections → **overridable locally** |
| **Character limit** | `char_limit` | **Global only — no per-section value.** Informed by AMD `max_character_length` when fields are mapped; used for truncation / too-long guidance |
| Subsection join | `push_subsections`, `retain_headings`, `skip_empty_subsections` | Whether / how parent + children combine into one EHR field |
| **Section separator** | `separator` (between top-level / sibling sections sharing a field) | Joins content when **two+ parent sections** map to the same EHR field |
| **Subsection separator** | `separator` (between children under one parent) | Joins child subsection text when a parent is pushed as one field |

> Separators for subsection join may be **section separator** or **subsection separator** depending on what is being joined (parents sharing a field vs children under one parent).


### Local (section output settings)

| Setting | Notes |
| ------- | ----- |
| **Push setting** | Override template default for this section only |
| Additional text | Fixed text before/after section body |
| Default negative | Pushed when section has no generated content |

> Character limit is **not** shown or edited per section — template bar only.

### Push setting options

One control (not three toggles). AMD can read existing note content, so all three work.

| UI label | YAML | Behaviour |
| -------- | ---- | --------- |
| Insert before | `prepend: true` | Marvix content before existing field text |
| Insert after | `append: true` | Marvix content after existing field text |
| Overwrite | neither | Replaces field content |

---

## Push errors

### Backend (today)

No `push_errors` DB table — failures go to ops email + CloudWatch only.

| Error | Exception | Doctor-actionable? |
| ----- | --------- | ------------------ |
| Field control gone | `EhrTemplateChangeException` → auto-recovery; else `FatalException` | Yes — remap if recovery fails |
| Template deleted | `FatalException`: `"Template not found."` | Yes — ops picks new template |
| Content too long | `FatalException`: `"Value is too long."` | Yes — doctor shortens note |
| Missing Create Pt Notes | `FatalException`: permission | Yes — practice admin |
| Provider not found | `FatalException` | No — ops/tech |
| Invalid field value | `FatalException`: `"Value is not valid"` | No — ops / prompt fix |

### Doctor UI actions (prototype)

| Type | Tweaks | Remap | Got it | Contact support |
| ---- | ------ | ----- | ------ | --------------- |
| `too_long` | `amd_too_long` | ❌ | ✅ | ❌ |
| `template_changed` / `mapping_broken` | `amd_template_changed` | ✅ | ❌ | ✅ |
| `permission` / `invalid_value` / auth / locked | `amd_no_permission`, `amd_invalid_value` | ❌ | ❌ | ✅ |

Too-long must not offer Remap — mapping is fine. Amber = doctor-fixable (`selfServe`); red = ops-needed.

---

## Code

| Location | Role |
| -------- | ---- |
| `internal_endpoints.py:3797` | Auto-populates `max_character_length` |
| `ehr_layer/advancedmd.py:1629` | `get_updated_ehr_mapping()` auto-remap |
| `ehr_layer/section_text_builder.py` | Reads `config` at push time |

---

## My Templates prototype

Branch `cursor/amd-ehr-34b9` — visual / UX only. EHR locked to AMD. Entry: `index.html`.

### Ownership

| Capability | Ops-managed | Self-serve |
| ---------- | ----------- | ---------- |
| List tab | ✅ | ✅ |
| Remap + output settings + global Push setting / Character limit | ✅ | ✅ |
| Preview / Save | ✅ | ✅ |
| **Reset to default** | ✅ only | ❌ — no ops default to restore |
| **Request New Section** | ✅ only ††† | ❌ |
| **+ Add section** / **Prompt** edit | ❌ | ✅ — Prompt editable on self-serve only |
| **Create → Connect EHR** (Cat 2) | ❌ | ✅ — pick AMD note template (or skip) |
| **2+ parents → one EHR field** | ✅ | ✅ — **Shared** chip; **Marvix UI section order = push order** |

### Subtle UI elements

#### Checkbox fields

Distinct AMD control type in the **same** field picker as text. Mapping a Marvix section to a checkbox EHR field is allowed on **both** ops-managed and self-serve (remap is available on both).

**What we know today**

| Detail | Behaviour |
| ------ | --------- |
| Same picker | Checkbox destinations appear alongside text fields |
| Tag / values | `checkbox` tag; allowed values on picker + chip (`Yes`/`No` vs `Y`/`N` — per field from AMD) |
| Dual mapping | Common: `Chief Complaint` (text) + `Chief Complaint Enable` (checkbox) = **two sections** |
| Invalid push | Wrong value → AMD `"Value is not valid"` → Contact support |

**How is the pushed value chosen?** — **open**

Two mechanisms exist in docs/code; product has not chosen:

| Mechanism | Source | Idea |
| --------- | ------ | ---- |
| A. Prompt output | PRD | Section AI prompt must emit exactly one allowed value |
| B. `extract_boolean_value` | SHARED_CONFIG / YAML | If section has content → push configured “checked” value; if empty → `""` |

Until decided: treat value selection as an open question for both ownership modes.

**Cases — ops-managed**

| Case | What happens today / risk | Open |
| ---- | ------------------------- | ---- |
| Ops maps section → checkbox at onboarding | Ops can author a checkbox-aware prompt (or YAML). Doctor remaps + output settings only — **no Prompt edit** | Who owns the checkbox prompt long-term — ops only? |
| Doctor remaps a **text** section → checkbox field | Mapping chip shows `checkbox` + allowed values, but the section prompt is still prose → likely `"Value is not valid"` | Block remap? Force ops? Auto-switch to `extract_boolean_value`? |
| Dual CC Text + CC Enable | Two independent mappings | Does Enable derive from Text having content, or is it a separate AI judgment? |
| Default negative on checkbox section | Default negative is free text today | Must it be an allowed value? What does empty mean (unchecked vs invalid)? |

**Cases — self-serve**

| Case | What happens today / risk | Open |
| ---- | ------------------------- | ---- |
| Doctor maps section → checkbox | Same picker; doctor **can** edit Prompt | Should prompt editor **surface allowed values** (and validate)? |
| Doctor writes wrong prompt | Invalid value on push | Inline validation vs only push-error Contact support? |
| Doctor adds a new section mapped to checkbox | Prompt authored at add-section time | Show allowed values in Add section / Prompt UI? |
| Uses `extract_boolean_value`-style rule instead of AI | Not in prototype UI | Expose as output setting (“If section has content, push: Yes”)? |

**Prototype**

Tweaks: `amd_checkbox` (dual chip), `amd_invalid_value` (push error). Seeded `Chief Complaint Enable` with a Yes/No prompt. Picker shows allowed values; **prompt editor does not**.

#### Other

| Element | Subtlety |
| ------- | -------- |
| No Configuration column | Push setting: template bar + section override. Character limit: **template bar only** (global) |
| Prompt edit | **Self-serve only** — ops-managed templates do not expose Prompt on the row |
| Shared field (2+ parents → one EHR) | Neutral **Shared** chip. Content is combined in **Marvix UI section list order** (drag to reorder parents → changes push order) |
| Section vs subsection separator | Subsection join can use a **section separator** (between parents sharing a field) or **subsection separator** (between children under one parent) |
| Reset to default | **Ops-managed only** — restores ops default; absent on self-serve |

*(Push setting + push-error actions — see Settings and Push errors. Character limit is global-only.)*

### Gaps / open product questions

1. **AMD checkbox value selection** — prompt output vs `extract_boolean_value` (and UI for both ownership modes). See Subtle UI → Checkbox fields.

### Footnotes

† **STATIC / EHR Pull ghosts (dropped)** — not in UI. Static Start / End / Additional text (boilerplate around section body) still exists and is a different concept.  
†† **Path style** — `Office Visit > Title Case` only (not `Clinical Notes > snake_case`).  
††† **Request New Section** — ops-managed only; self-serve uses + Add section.
