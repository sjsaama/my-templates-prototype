# EHR Mapping — DrChrono

Backend mapping reference + My Templates prototype notes (`cursor/drchrono-ehr-9d4d`).  
Related: [MY_TEMPLATES_PRD.md](../MY_TEMPLATES_PRD.md), [ERROR_UX.md](ERROR_UX.md), [SHARED_CONFIG.md](SHARED_CONFIG.md).

---

## Extra Fields YAML keys

| YAML key | Required? | Type | Purpose | Example | Source |
| --- | --- | --- | --- | --- | --- |
| `ehr_field_id` | Yes | Number | Clinical note field ID — POST `/clinical_note_field_values` | `84213206` | Template file (tech) |
| `ehr_field_name` | Yes | Text | Display name; also routes special handlers (`icd10_codes`, `cpt_codes`) | `"Past Medical History Freewrite"` | Template file (tech) |

```yaml
ehr_field_id: 84213206
ehr_field_name: "Past Medical History Freewrite"
```

No `ordinal` / `page_name` / per-field `max_character_length` (those are AMD).

---

## Mapping (DrChrono-specific)

Standard section → free-text EHR field mapping applies here like other Cat 2 EHRs.

| DrChrono delta | Detail |
| --- | --- |
| Field ID format | Snake_case (`history_of_present_illness`), shown with human labels in the picker |
| ICD / CPT | **Not** in the mapping picker. Routed by `ehr_field_name` (`icd10_codes` / `cpt_codes`) via `sub_template_ids` — separate mechanism; doctor UI not prototyped |

---

## What doctors can change

| Why | Effect | Needs ops? |
| --- | --- | --- |
| Field archived / template restructured in DrChrono | `ehr_field_id` stale — push fails **silently** | Yes — new IDs from template file |
| Remap to another free-text field | Points at a different `ehr_field_id` | No — if list is current |

No AMD-style auto-remap. Remap in UI (or ops) once someone notices.

---

## Settings — global and local

Same hierarchy as AMD: Global → sections → optional local override. YAML may still store per-row `config.*` until Template Settings lands.

| Scope | Settings |
| --- | --- |
| **Global** | **Character limit** (`char_limit`) — global only, never per-section. Subsection join (`push_subsections`, `retain_headings`, `skip_empty_subsections`, `separator`) → Template Settings |
| **Local** | Additional text, Default negative |
| **Not on DrChrono** | **Push setting** (`append` / `prepend`) — **AMD-only** doctor UI. `line_separator` — ECW only |

---

## Push errors

No `push_errors` DB table. Field-level failures are mostly invisible today.

| Error | Behaviour | Doctor UI |
| --- | --- | --- |
| Free-text field failure | `save_note` returns `False` — Lambda blind | Undetectable (mock: `drchrono_field_gap`) |
| ICD / CPT / special path | `logger.warning` only | Undetectable |
| Auth | `CredentialsException` → retry | Contact support (`drchrono_auth`) |
| Rate limit | `ThrottledException` → retry | Auto |

---

## Code

| Location | Role |
| --- | --- |
| `ehr_layer/drchrono.py` | `ehr_field_id` + `ehr_field_name`; ICD/CPT by name |
| `ehr_layer/section_text_builder.py` | Reads `config` at push time |
| Ops `/update_ehr_mapping_subtemplates` | `sub_template_ids` for ICD/CPT |

---

## My Templates prototype

Branch `cursor/drchrono-ehr-9d4d` — EHR locked to DrChrono. Entry: `index.html`.

| | Ops-managed | Self-serve |
| --- | --- | --- |
| Remap, output settings, global Character limit | ✅ | ✅ |
| Reset / Request New Section | ✅ | ❌ |
| Add section / Prompt edit | ❌ | ✅ |
| Create → Connect EHR | ❌ | ✅ |

**DrChrono deltas vs AMD:** snake_case free-text picker (no ICD/CPT, no checkboxes); Character limit global-only; no Push setting; Connect EHR uses `EHR_TEMPLATES_BY_SYSTEM.DrChrono`.

**Open:** Lambda field-failure visibility; ICD/CPT doctor UX; push live status (Vignesh).
