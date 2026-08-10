# EHR Mapping — DrChrono

Backend mapping reference + My Templates prototype notes (`cursor/drchrono-ehr-9d4d`).  
Related: [MY_TEMPLATES_PRD.md](../MY_TEMPLATES_PRD.md), [ERROR_UX.md](ERROR_UX.md), [SHARED_CONFIG.md](SHARED_CONFIG.md).  
Forked from AMD Cat 2 (`cursor/amd-ehr-34b9`) — AMD-only UI removed; Character limit kept as **global only**.

---

## Extra Fields YAML keys


| YAML key         | Required? | Type   | Purpose                                                                 | Example                            | Source               |
| ---------------- | --------- | ------ | ----------------------------------------------------------------------- | ---------------------------------- | -------------------- |
| `ehr_field_id`   | Yes       | Number | DrChrono clinical note field ID — POST `/clinical_note_field_values`    | `84213206`                         | Template file (tech) |
| `ehr_field_name` | Yes       | Text   | Display / routing key — free-text path unless name is a special handler | `"Past Medical History Freewrite"` | Template file (tech) |


```yaml
ehr_field_id: 84213206
ehr_field_name: "Past Medical History Freewrite"
```

> No `ordinal`, `page_name`, or AMD-style `max_character_length` auto-fetch. Character limit is a **global template** `char_limit`, not per-field metadata from the API.

---

## Mapping table vs special fields (ICD / CPT)

Three different concepts — do not mix them in the doctor UI.

### 1) Mapping table (standard section → EHR field)

The My Templates **mapping picker / mapping chip column**.

- Doctor (or ops) maps each Marvix **section** to one DrChrono **clinical note field**.
- Payload uses `ehr_field_id` + free-text body built from the section.
- Prototype shows **snake_case** identifiers with human labels (`history_of_present_illness` → "History of Present Illness").
- These are normal text destinations: HPI, ROS, exam, A&P, etc.

### 2) “Naked” / free-text clinical note fields

Informal name for the **ordinary text fields** in that mapping table.

- Not checkboxes (AMD-only).
- Not diagnosis/billing code destinations.
- Content is prose from the AI note (plus additional text / default negative).
- If `ehr_field_id` is archived or wrong, push fails **silently** today (`save_note` returns `False`).

### 3) ICD / CPT (special — **not** in the mapping table)


| `ehr_field_name` | Handler        | What it pushes             |
| ---------------- | -------------- | -------------------------- |
| `icd10_codes`    | ICD-10 handler | Structured diagnosis codes |
| `cpt_codes`      | CPT handler    | Structured procedure codes |


- Routed by **name**, not by putting them in the section mapping picker.
- Backed by `**sub_template_ids`** on `EHRMapping` (JSONB) — ops endpoint `/update_ehr_mapping_subtemplates` — not Extra Fields YAML.
- Doctor-facing intent (SHARED_CONFIG): pick from available **templates**, not raw IDs — **not built in this prototype**.
- Failures today: `logger.warning` only — not raised to Lambda / doctor.

**Product rule:** ICD/CPT must **not** appear as rows in the standard mapping field list. Mixing them with free-text fields confuses “map HPI → text box” with “attach diagnosis/procedure code templates.”

---

## What doctors can change


| Why                                 | Doctor / Admin action         | Effect on mapping                            | Needs ops?                                    |
| ----------------------------------- | ----------------------------- | -------------------------------------------- | --------------------------------------------- |
| Archive unused clinical note fields | Field archived in DrChrono    | `ehr_field_id` invalid — push silently fails | Yes — new field ID from updated template file |
| Restructure note / new visit type   | Template or fields change     | Existing IDs may no longer match             | Yes — obtain new field IDs                    |
| Remap section to another text field | Doctor remaps in My Templates | Points at a different `ehr_field_id`         | No — if field list is current                 |


### No AMD-style auto-remap

DrChrono does **not** raise `EhrTemplateChangeException` / re-fetch / rematch by name today. Stale IDs fail quietly. Remap in the UI is the recovery path once someone notices.

---

## Settings — global and local

Product model: **template defaults**, with **per-section overrides only where noted**.  
YAML today still stores some values per row (`config.`*) until Template Settings migration lands.

**Hierarchy (where override is allowed):** Global (template) → applied to each section → optional local override in output settings.

### Global (template only)


| Setting             | YAML today                                                                   | Notes                                                                    |
| ------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Character limit** | `char_limit`                                                                 | **Global only — no per-section value.** Truncates / guides pushed length |
| Subsection join     | `push_subsections`, `retain_headings`, `skip_empty_subsections`, `separator` | How parent + children combine into one EHR field → Template Settings     |


### Local (section output settings)


| Setting          | Notes                                        |
| ---------------- | -------------------------------------------- |
| Additional text  | Fixed text before/after section body         |
| Default negative | Pushed when section has no generated content |


> Character limit is **not** shown or edited per section — template bar only.  
> **Push setting** (`append` / `prepend` / overwrite) is **AMD-only** in My Templates — not shown for DrChrono. Backend may still store `append`/`prepend` in YAML for ops; doctors do not configure it here.  
> `line_separator` is **not** used for DrChrono (ECW HL7 only).

### Config key → settings map


| Key                      | Becomes             | Scope                                              |
| ------------------------ | ------------------- | -------------------------------------------------- |
| `char_limit`             | **Character limit** | Global only                                        |
| `separator`              | Subsection join     | Global (Template Settings)                         |
| `push_subsections`       | Subsection join     | Global (Template Settings)                         |
| `retain_headings`        | Subsection join     | Global (Template Settings)                         |
| `skip_empty_subsections` | Subsection join     | Global (Template Settings)                         |
| `append` / `prepend`     | **Push setting**    | ❌ **AMD-only** doctor UI — not exposed on DrChrono |
| `line_separator`         | —                   | ❌ Not used (ECW only)                              |


---

## Push errors

### Backend (today)

No `push_errors` DB table — failures go to ops email + CloudWatch only (when anything is logged at all).


| Error                                    | Exception / behaviour                                                      | Doctor-actionable? |
| ---------------------------------------- | -------------------------------------------------------------------------- | ------------------ |
| Any free-text field failure              | Caught inside `save_note` → returns `False` — **Lambda has no visibility** | ❌ Undetectable     |
| ICD / CPT / chief-complaint special path | `logger.warning` only                                                      | ❌ Ops / CloudWatch |
| Auth / credentials                       | `CredentialsException` → generic retry                                     | ❌ Ops reconnects   |
| Rate limit                               | `ThrottledException` → generic retry                                       | ❌ Auto-resolves    |


**Known gap:** Push issues banner cannot work for field-level DrChrono failures until Lambda surfaces them.

### Doctor UI actions (prototype)


| Type                        | Tweaks               | Remap | Got it | Contact support |
| --------------------------- | -------------------- | ----- | ------ | --------------- |
| `auth`                      | `drchrono_auth`      | ❌     | ❌      | ✅               |
| Future field failure (mock) | `drchrono_field_gap` | ✅     | ❌      | ✅               |


---

## Code


| Location                               | Role                                                                  |
| -------------------------------------- | --------------------------------------------------------------------- |
| `ehr_layer/drchrono.py`                | Uses `ehr_field_id` + `ehr_field_name`; special-cases ICD/CPT by name |
| `ehr_layer/section_text_builder.py`    | Reads `config` at push time                                           |
| Ops `/update_ehr_mapping_subtemplates` | `sub_template_ids` for ICD/CPT template picks                         |


---

## My Templates prototype

Branch `cursor/drchrono-ehr-9d4d` — visual / UX only. EHR locked to DrChrono. Entry: `index.html`.

### Ownership


| Capability                                           | Ops-managed | Self-serve                                |
| ---------------------------------------------------- | ----------- | ----------------------------------------- |
| List tab                                             | ✅           | ✅                                         |
| Remap + output settings + **global Character limit** | ✅           | ✅                                         |
| Preview / Save                                       | ✅           | ✅                                         |
| **Reset to default**                                 | ✅ only      | ❌ — no ops default to restore             |
| **Request New Section**                              | ✅ only      | ❌                                         |
| **+ Add section** / **Prompt** edit                  | ❌           | ✅                                         |
| **Create → Connect EHR** (Cat 2)                     | ❌           | ✅ — pick DrChrono note template (or skip) |


### Subtle UI elements

DrChrono-specific only. Cross-EHR rules (Shared chip, parent whole/individual mapping, Character limit scope) live in the PRD / Settings sections — not repeated here.


| Element               | Behaviour                                                                         |
| --------------------- | --------------------------------------------------------------------------------- |
| Field format          | Snake_case with human labels in picker/chips                                      |
| Mapping table         | Free-text clinical fields only                                                    |
| ICD / CPT             | **Excluded** from picker — separate `sub_template_ids` mechanism (not prototyped) |
| No checkbox fields    | AMD-only control type — not in DrChrono picker                                    |
| No Push setting       | AMD-only — not in DrChrono doctor UI                                              |
| Connect EHR at create | Self-serve + Cat 2 — `EHR_TEMPLATES_BY_SYSTEM.DrChrono`                           |


### Gaps / open product questions


| Gap                             | Why it matters                                                  | Status                                  |
| ------------------------------- | --------------------------------------------------------------- | --------------------------------------- |
| **Field-level push visibility** | `save_note` swallows exceptions → no real push-issues banner    | Needs Lambda change                     |
| **ICD / CPT doctor UX**         | Supported in backend via `sub_template_ids`; no My Templates UI | Needs design + template API access      |
| **DrChrono push activation**    | Is push live for any practices?                                 | Confirm with Vignesh                    |
| **Stale field detection**       | No auto-remap; silent drop                                      | Remap + ops until API surfaces failures |


### Changelog


| Date       | Change                                                              |
| ---------- | ------------------------------------------------------------------- |
| 2026-08-10 | Branch from AMD Cat 2; lock EHR to DrChrono                         |
| 2026-08-10 | Snake_case fields; drop ICD/CPT from mapping picker                 |
| 2026-08-10 | Remove AMD checkbox UI from doctor UI                               |
| 2026-08-10 | Character limit = **global only** (never local)                     |
| 2026-08-10 | Push setting confirmed **AMD-only** — removed from DrChrono UI/docs |
| 2026-08-10 | Config keys → global/local map; `append`/`prepend` marked AMD-only  |
| 2026-08-10 | Doc: mapping table vs naked free-text vs ICD/CPT; gaps table        |
| 2026-08-10 | Subtle UI trimmed to DrChrono-only deltas                           |
| 2026-08-10 | Push-error tweaks: auth + field-gap mock only                       |


