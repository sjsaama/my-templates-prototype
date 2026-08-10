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
| Subsection join | `push_subsections`, `retain_headings`, `skip_empty_subsections`, `separator` | How parent + children combine into one EHR field |

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
| **+ Add section** / **Prompt** edit | ❌ | ✅ |

### Subtle UI elements

#### Checkbox fields

Distinct AMD control type in the **same** field picker as text.

| Detail | Behaviour |
| ------ | --------- |
| Tag | `checkbox` on picker rows + mapping chips |
| Allowed values | Shown in picker foot / under chip (`Yes`/`No` vs `Y`/`N` — per field from AMD) |
| Dual mapping | e.g. `Chief Complaint` (text) + `Chief Complaint Enable` (checkbox) = two sections |
| Prompt | Must output exactly one allowed value — else `"Value is not valid"` |

Open: surface allowed values in prompt editor; vs YAML `extract_boolean_value` (SHARED_CONFIG). Tweaks: `amd_checkbox`, `amd_invalid_value`.

#### Other

| Element | Subtlety |
| ------- | -------- |
| No Configuration column | Push setting: template bar + section override. Character limit: **template bar only** (global) |
| Reset to default | **Ops-managed only** — restores ops default; absent on self-serve |
| Shared field | Neutral **Shared** chip when 2+ sections map to one field — content joins in list order |
| Parent mapping | Whole vs map subsections individually |
| Dropped chrome | No STATIC badge; no EHR Pull / File Upload ghost rows † |

*(Push setting + push-error actions — see Settings and Push errors. Character limit is global-only.)*

### Gaps

1. Cat 2 **Connect EHR** at create (`EHR_TEMPLATES_BY_SYSTEM.AMD` unused)
2. Prompt editor: surface checkbox allowed values
3. More fatal mocks if needed (`Template not found`, provider not found)

### Changelog

| Date | Change |
| ---- | ------ |
| 2026-08-10 | AMD branch; no Config column; `Office Visit > Title Case`; Self-serve / Ops-managed tabs |
| 2026-08-10 | Dropped STATIC + EHR Pull ghosts; Request New Section = ops-managed only ††† |
| 2026-08-10 | Checkbox picker + CC Enable; push-error action matrix |
| 2026-08-10 | Settings → global/local; Push setting + Character limit; Subtle UI section; doc cleanup |
| 2026-08-10 | Character limit = **global only** (no per-section override) |
| 2026-08-10 | **Reset to default = ops-managed only** (not on self-serve) |

### Footnotes

† **STATIC (dropped)** — old non-AI section badge. *Still in mock (different):* Static Start / End / Additional text.  
† **EHR Pull / File Upload ghosts (dropped)** — inbound-only rows with no mapping chip.  
†† **`Clinical Notes > snake_case` (superseded)** — prototype uses `Office Visit > Title Case` only.  
††† **Request New Section** — ops-managed only; self-serve uses + Add section. Overrides earlier PRD line that gated it to self-serve.
