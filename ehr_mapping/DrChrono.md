# EHR Mapping — DrChrono

Backend mapping reference + My Templates prototype notes (`cursor/drchrono-ehr-9d4d`).  
Related: [MY_TEMPLATES_PRD.md](../MY_TEMPLATES_PRD.md), [ERROR_UX.md](ERROR_UX.md), [SHARED_CONFIG.md](SHARED_CONFIG.md).

---

## Extra Fields YAML keys

| YAML key | Required? | Type | Purpose | Example | Source |
| --- | --- | --- | --- | --- | --- |
| `ehr_field_id` | Yes | Number | Clinical note field ID — POST `/clinical_note_field_values` | `84213206` | Template file (tech) |
| `ehr_field_name` | Yes | Text | Display name; routes special handlers (`icd10_codes`, `cpt_codes`) | `"Past Medical History Freewrite"` | Template file (tech) |

```yaml
ehr_field_id: 84213206
ehr_field_name: "Past Medical History Freewrite"
```

No `ordinal` / `page_name` / per-field `max_character_length` (those are AMD).

---

## Mapping

Standard section → free-text EHR field mapping (general Cat 2). DrChrono field IDs are snake_case with human labels in the picker.

### Sub-templates — ICD / CPT only (for now)

Backend names: `icd10_codes`, `cpt_codes` (via `sub_template_ids`). **Only these two** sub-templates for now.

| Who | What they can do |
| --- | --- |
| **Self-serve** | **+ Add section** → content type **Nothing / ICD (`icd10_codes`) / CPT (`cpt_codes`)** → Header → Prompt → Map. Codes are absorbed into that section. |
| **Ops-managed** | Section already exists. Doctor **remaps only** (no add section, no prompt edit). |

**Working assumption:** ICD/CPT sections can map to **any** field on this template.  
**Open with ops:** Confirm whether mapping must be limited to specific destinations, or anywhere is fine.

DrChrono push is **live** (product to double-check).

---

## What doctors can change

| Why | Effect | Needs ops? |
| --- | --- | --- |
| Remap to another field on this template | Points at a different `ehr_field_id` | No — if list is current |
| Field archived / template restructured | Stale mapping — see Push errors | Yes if remap can’t recover |

No AMD-style auto-remap.

---

## Settings — global and local

Same hierarchy as AMD: Global → sections → optional local override.

| Scope | Settings |
| --- | --- |
| **Global** | **Character limit** (`char_limit`) — global only. Subsection join → Template Settings |
| **Local** | Additional text, Default negative |
| **Not on DrChrono** | **Push setting** (`append` / `prepend`) — **AMD-only**. `line_separator` — ECW only |

---

## Push errors

Field-level failures are often invisible to Lambda today (`save_note` swallows them) — **not fixable for now**. Still treat as errors and show copy when surfaced / in mocks.

| Error | Behaviour today | Doctor sees |
| --- | --- | --- |
| Free-text field push failed | `save_note` → `False`; Lambda may not see it | "One or more sections failed to push to DrChrono. Contact support." |
| ICD / CPT push failed | `logger.warning` only | "ICD/CPT codes for '[Section]' failed to push to DrChrono. Contact support." |
| Stale / archived field mapping | Invalid `ehr_field_id`; silent fail | "A mapped field is no longer available in DrChrono. Remap the section or contact support." |
| Auth / credentials | `CredentialsException` | "Push failed due to a DrChrono authentication issue. Contact support." |
| Rate limit | `ThrottledException` | Auto-retry — no doctor action |

Prototype tweaks: `drchrono_auth`, `drchrono_field_failed`, `drchrono_stale_mapping`, `drchrono_icd_cpt_failed`.

---

## Code

| Location | Role |
| --- | --- |
| `ehr_layer/drchrono.py` | `ehr_field_id` + `ehr_field_name`; `icd10_codes` / `cpt_codes` by name |
| `ehr_layer/section_text_builder.py` | Reads `config` at push time |
| Ops `/update_ehr_mapping_subtemplates` | `sub_template_ids` for ICD/CPT |

---

## My Templates prototype

Branch `cursor/drchrono-ehr-9d4d` — EHR locked to DrChrono. Entry: `index.html`.

| | Ops-managed | Self-serve |
| --- | --- | --- |
| Remap, output settings, global Character limit | ✅ | ✅ |
| Reset / Request New Section | ✅ | ❌ |
| Add section (Nothing / ICD / CPT) + Prompt | ❌ | ✅ |
| Create → Connect EHR | ❌ | ✅ |

**DrChrono deltas vs AMD:** snake_case picker (no checkboxes); Character limit global-only; no Push setting; Connect EHR uses `EHR_TEMPLATES_BY_SYSTEM.DrChrono`.

**Open (ops):** Can ICD/CPT map to any section/field on the template, or only specific destinations?
