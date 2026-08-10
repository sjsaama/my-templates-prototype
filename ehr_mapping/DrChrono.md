# EHR Mapping — DrChrono

Backend mapping reference + My Templates prototype notes (`cursor/drchrono-ehr-9d4d`).  
Related: [MY_TEMPLATES_PRD.md](../MY_TEMPLATES_PRD.md), [ERROR_UX.md](ERROR_UX.md), [SHARED_CONFIG.md](SHARED_CONFIG.md).  
Forked from AMD Cat 2 branch — AMD-only doctor UI removed per PRD.

---

## Extra Fields YAML keys

| YAML key | Required? | Type | Purpose | Example | Source |
|---|---|---|---|---|---|
| `ehr_field_id` | Yes | Number | DrChrono clinical note field ID — sent in the POST to `/clinical_note_field_values` | `84213206` | Template file (tech) |
| `ehr_field_name` | Yes | Text | Field display name — routes special fields (`icd10_codes`, `cpt_codes`) to separate handlers | `"Past Medical History Freewrite"` | Template file (tech) |

```yaml
ehr_field_id: 84213206
ehr_field_name: "Past Medical History Freewrite"
```

**Special fields routed by `ehr_field_name` (not in doctor mapping table):**

| `ehr_field_name` | What happens |
|---|---|
| `icd10_codes` | ICD-10 code push handler |
| `cpt_codes` | CPT code push handler |

---

## What doctors can change

| Why | Doctor / Admin action | Effect on mapping | Needs ops? |
| --- | --------------------- | ----------------- | ---------- |
| Archive unused clinical note fields | Field archived in DrChrono | `ehr_field_id` invalid — push silently fails | Yes — new field ID from updated template |
| Restructure note / new visit type | Template or fields change | Existing IDs may not match | Yes — obtain new field IDs |

No AMD-style auto-recovery — DrChrono does not raise per-field template-change exceptions today.

---

## Settings — doctor-facing My Templates

Per PRD: **Push setting** and **Character limit** are **AMD-only** in the doctor UI.  
DrChrono still supports `append` / `prepend` / `char_limit` in backend YAML / future Template Settings — not exposed here.

### Local (section output settings) — shown

| Setting | Notes |
| ------- | ----- |
| Additional text | Fixed text before/after section body |
| Default negative | Pushed when section has no generated content |

### Not shown (AMD-only in My Templates)

| Setting | Why |
| ------- | --- |
| Push setting (Insert before / after / Overwrite) | PRD: doctor-configurable on AMD only |
| Character limit | PRD: doctor-configurable on AMD only |
| Checkbox field type | AMD-only control type |

---

## Relevant `config` keys (backend)

| Key | Useful? | Notes |
|---|---|---|
| `append` | ✅ Yes | DrChrono fetches existing note content before pushing |
| `prepend` | ✅ Yes | Same as above |
| `separator` | ✅ Yes | **→ Moving to Template Settings** |
| `char_limit` | ✅ Yes | **→ Moving to Template Settings** |
| `push_subsections` | ✅ Yes | **→ Moving to Template Settings** |
| `retain_headings` | ✅ Yes | **→ Moving to Template Settings** |
| `skip_empty_subsections` | ✅ Yes | **→ Moving to Template Settings** |
| `line_separator` | ❌ No | ECW HL7 only |

---

## Push errors

### Backend (today)

| Error | Exception | Behaviour | Doctor-actionable? |
|---|---|---|---|
| Any field-level failure | Caught inside `save_note` — returns `False` | **Lambda has no visibility** | ❌ Undetectable |
| ICD/CPT/chief complaint failure | `logger.warning` only | Not raised | ❌ Ops / CloudWatch |
| Auth failure | `CredentialsException` | Bubbles to generic retry | ❌ Ops reconnects |
| Rate limit | `ThrottledException` | Bubbles to generic retry | ❌ Auto-resolves |

**Known gap:** Push issues banner cannot work for field-level DrChrono failures until Lambda surfaces them.

### Doctor UI actions (prototype)

| Type | Tweaks | Remap | Got it | Contact support |
| ---- | ------ | ----- | ------ | --------------- |
| `auth` | `drchrono_auth` | ❌ | ❌ | ✅ |
| Future field failure (mock) | `drchrono_field_gap` | ✅ | ❌ | ✅ |

---

## Code

| Location | Role |
| -------- | ---- |
| `ehr_layer/drchrono.py` | Uses `ehr_field_id` + `ehr_field_name` |
| `ehr_layer/section_text_builder.py` | Reads `config` keys at push time |

---

## My Templates prototype

Branch `cursor/drchrono-ehr-9d4d` — visual / UX only. EHR locked to DrChrono. Entry: `index.html`.  
Copied from `cursor/amd-ehr-34b9`, then stripped of AMD-only features.

### Ownership

| Capability | Ops-managed | Self-serve |
| ---------- | ----------- | ---------- |
| List tab | ✅ | ✅ |
| Remap + output settings (additional text, default negative) | ✅ | ✅ |
| Preview / Save | ✅ | ✅ |
| **Reset to default** | ✅ only | ❌ |
| **Request New Section** | ✅ only | ❌ |
| **+ Add section** / **Prompt** edit | ❌ | ✅ |
| **Create → Connect EHR** (Cat 2) | ❌ | ✅ — pick DrChrono note template (or skip) |

### Subtle UI elements

| Element | Behaviour |
| ------- | --------- |
| Field format | Snake_case (`history_of_present_illness`) with human labels in picker/chips |
| ICD / CPT | **Excluded** from mapping field list — separate mechanism |
| No checkbox fields | AMD-only — not in DrChrono picker |
| No Push setting / Character limit bars | AMD-only doctor UI — removed |
| Connect EHR at create | Self-serve + Cat 2 — uses `EHR_TEMPLATES_BY_SYSTEM.DrChrono` |
| Shared field | Neutral **Shared** chip when 2+ sections map to one field |
| Parent mapping | Whole vs map subsections individually |

### Gaps / open product questions

1. **Field-level push visibility** — Lambda must stop swallowing `save_note` failures before a real push-issues banner works.
2. **DrChrono push activation** — confirm with Vignesh whether push is live for any practices.
3. Whether append/prepend should ever appear in doctor Template Settings for DrChrono (backend supports it; PRD keeps doctor UI AMD-only for now).

### Changelog

| Date | Change |
| ---- | ------ |
| 2026-08-10 | Branch from AMD Cat 2; lock EHR to DrChrono |
| 2026-08-10 | Snake_case fields; drop ICD/CPT from mapping picker |
| 2026-08-10 | Remove AMD checkbox UI, Push setting, Character limit from doctor UI |
| 2026-08-10 | Push-error tweaks: auth + field-gap mock only |
