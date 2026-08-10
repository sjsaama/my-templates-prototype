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

### Surface (in-app)

Errors appear at **two levels** at once:

1. **Template banner** — summary of how many sections failed (+ shared message)
2. **Section row strip** — primary action surface (copy + buttons for that section)

| Severity | When | Banner tone | Strip tone |
| -------- | ---- | ----------- | ---------- |
| Doctor-fixable | Doctor can fix outside or inside My Templates without ops | Amber — “Action needed — N section(s) couldn't be pushed” | Amber ⚠ |
| Needs ops / admin | Remap alone won’t fix, or practice/ops must act | Red — “Push failed — N section(s) didn't reach your EHR” | Red ✕ |

**Actions (only show what applies):**

| Action | Meaning |
| ------ | ------- |
| **Remap** | Open field picker for that section → pick a valid AMD field → Save. Clears issue when mapping is fixed (next successful push or optimistic clear). |
| **Got it** | Dismiss awareness only. Doctor still must fix the underlying cause (shorten note, unlock chart, etc.) then **retry push** from the note / consult flow. |
| **Contact support** | Opens support path (ticket / chat). Ops is already emailed for fatal failures; this is the doctor’s explicit escalate. |

> Too-long / check-in-style errors must **not** offer Remap — the mapping is fine.

### Backend (today)

No `push_errors` DB table — failures go to ops email + CloudWatch only. In-app surface needs Lambda → `push_errors` (or equivalent) before production.

| Backend signal | Exception path | Maps to UI type |
| -------------- | -------------- | --------------- |
| `"Control [X] not found"` | `EhrTemplateChangeException` → auto-recovery; fail → `FatalException` | `template_changed` |
| `"Template not found."` | `FatalException` | `template_deleted` |
| `"Value is too long."` | `FatalException` | `too_long` |
| permission / Create Pt Notes | `FatalException` | `permission` |
| `"Provider not found."` | `FatalException` | `provider_not_found` |
| `"Value is not valid"` | `FatalException` | `invalid_value` |
| Note locked / not editable | `FatalException` | `locked` |
| Previous-note fetch fail (read-before-write) | `FatalException` | `prev_note_fetch` |
| Auth / credentials | `FatalException` / auth path | `auth` |

### Error states — copy, actions, resolution flow

#### 1. Content too long — `too_long`

| | |
| --- | --- |
| **Cause** | Pushed text exceeds AMD field `max_character_length` (or template Character limit) |
| **Triggered by** | Doctor note content |
| **Severity** | Doctor-fixable (amber) |
| **Tweaks** | `amd_too_long` |
| **Copy** | `'[Section name]' is too long for this field (max N chars). Shorten your note and push again.` |
| **Actions** | **Got it** only |

**Resolution flow**

1. Doctor sees amber banner + strip on the long section.
2. Doctor dismisses with **Got it** (optional) and opens the note / consult.
3. Shortens that section’s content (or raises AMD field limit in AMD if practice owns the limit — rare).
4. **Retries push** from the normal push path.
5. Issue clears on successful push.

---

#### 2. EHR template changed (field control gone) — `template_changed`

| | |
| --- | --- |
| **Cause** | AMD note template updated; control IDs no longer match mapping |
| **Triggered by** | EHR admin |
| **Backend first** | Lambda auto-recovers (re-fetch template → rebuild mapping → retry). Only surfaces in-app if **auto-recovery fails** |
| **Severity** | Needs ops / doctor remap (red) |
| **Tweaks** | `amd_template_changed` |
| **Copy** | `Your AMD template was updated and some field mappings are no longer valid. Support has been notified.` |
| **Actions** | **Remap** + **Contact support** |

**Resolution flow**

1. Lambda tries auto-recovery silently; ops emailed on success-with-remap or on hard fail.
2. If still broken → red banner + strip on affected sections.
3. **Doctor path (self-serve or ops-managed):** **Remap** → Connect/refresh field list from current AMD template → pick correct field → Save → retry push (or wait for next push).
4. **If Remap isn’t enough** (many fields broken, unclear targets): **Contact support** → ops remaps practice template in ops tooling.
5. Issue clears when mapping matches live AMD controls and a push succeeds.

---

#### 3. EHR template deleted — `template_deleted`

| | |
| --- | --- |
| **Cause** | `ehr_template_id` removed in AMD |
| **Triggered by** | EHR admin |
| **Severity** | Needs ops (red) |
| **Copy** | `Your AMD template was removed. Support has been notified to reconnect your template.` |
| **Actions** | **Contact support** (Remap alone is insufficient — no field list without a template) |

**Resolution flow**

1. Doctor sees red banner (template-level; may list all sections).
2. **Contact support** → ops picks a new AMD note template for the practice / self-serve template.
3. Ops (or doctor on self-serve create/reconnect) reconnects template → all sections remapped against new field list.
4. Retry push.

---

#### 4. Permission insufficient — `permission`

| | |
| --- | --- |
| **Cause** | MA / integration account missing “Create Pt Notes” (or equivalent) |
| **Triggered by** | EHR admin / practice setup |
| **Severity** | Needs admin (red) |
| **Tweaks** | `amd_no_permission` |
| **Copy** | `Marvix doesn't have permission to write to AMD. Ask your practice admin to check account permissions.` |
| **Actions** | **Contact support** |

**Resolution flow**

1. Doctor sees red strip (often all sections failing the same way).
2. Doctor asks practice admin **or** uses **Contact support**.
3. Admin grants Create Pt Notes (or correct role) in AMD for the Marvix integration user.
4. Ops confirms → doctor **retries push**.

---

#### 5. Invalid field value — `invalid_value`

| | |
| --- | --- |
| **Cause** | AMD rejects value (common for **checkbox** fields: not in allowed Yes/No / Y/N set) |
| **Triggered by** | Prompt / content / wrong field type mapping |
| **Severity** | Needs ops or self-serve prompt fix (red) |
| **Tweaks** | `amd_invalid_value` |
| **Copy** | `'[Section name]' contains a value AMD doesn't accept for this field. Contact support.` |
| **Actions** | **Contact support** — on **self-serve**, doctor may also fix via **Prompt** edit (no Remap unless field type was wrong) |

**Resolution flow**

1. Doctor sees red strip on the section (e.g. checkbox Enable).
2. **Ops-managed:** **Contact support** → ops fixes prompt / YAML (`extract_boolean_value` TBD) / mapping type → retry.
3. **Self-serve:** Doctor edits **Prompt** so output is exactly an allowed value (picker shows allowed values) → Save → **retry push**. If field type is wrong, **Remap** to a text field or correct checkbox.
4. Optional later: prompt-editor validation of allowed values (open question).

---

#### 6. Note locked — `locked`

| | |
| --- | --- |
| **Cause** | Note not editable in AMD |
| **Triggered by** | Doctor / EHR state |
| **Severity** | Needs unlock (red; may be doctor-actionable outside My Templates) |
| **Copy** | `This note is locked in AMD and can't be edited. Contact support if this is unexpected.` |
| **Actions** | **Contact support** (and/or **Got it** if we treat unlock as doctor-owned — prefer Contact support when unexpected) |

**Resolution flow**

1. Doctor unlocks / opens the note in AMD (if they can), **or** Contact support.
2. **Retry push**.

---

#### 7. Provider not found — `provider_not_found`

| | |
| --- | --- |
| **Cause** | Doctor not found in AMD provider directory for this practice |
| **Triggered by** | EHR config / ops onboarding |
| **Severity** | Needs ops (red) |
| **Copy** | `Your provider account wasn't found in AMD. Contact support.` |
| **Actions** | **Contact support** |

**Resolution flow**

1. Doctor → **Contact support**.
2. Ops / tech links provider ID in AMD integration config.
3. Retry push.

---

#### 8. Previous-note fetch failure — `prev_note_fetch`

| | |
| --- | --- |
| **Cause** | Read-before-write (Insert before/after) couldn’t load existing AMD note text |
| **Triggered by** | AMD / infra |
| **Severity** | Needs ops (red) |
| **Copy** | `Couldn't retrieve your previous note from AMD. Push was stopped — contact support.` |
| **Actions** | **Contact support** |

**Resolution flow**

1. Push aborted intentionally (avoid overwrite/corrupt merge).
2. Doctor → **Contact support**.
3. Ops checks AMD API / credentials / note ID.
4. Optional interim: doctor sets Push setting to **Overwrite** only if clinically safe (product may disallow this as self-serve escape hatch — TBD).
5. Retry push when fetch works again.

---

#### 9. Auth / credentials — `auth`

| | |
| --- | --- |
| **Cause** | Integration auth failed |
| **Triggered by** | Creds / token expiry |
| **Severity** | Needs ops (red) |
| **Copy** | `Push failed due to an authentication issue. Contact support.` |
| **Actions** | **Contact support** |

**Resolution flow**

1. Doctor → **Contact support**.
2. Ops refreshes AMD credentials / OAuth.
3. Retry push (may auto-recover for later consults).

---

### Action matrix (prototype + product)

| Type | Remap | Got it | Contact support | Who resolves |
| ---- | ----- | ------ | --------------- | ------------ |
| `too_long` | ❌ | ✅ | ❌ | Doctor (edit note → retry push) |
| `template_changed` | ✅ | ❌ | ✅ | Doctor remap **or** ops |
| `template_deleted` | ❌ | ❌ | ✅ | Ops reconnect template |
| `permission` | ❌ | ❌ | ✅ | Practice admin (+ support) |
| `invalid_value` | ❌* | ❌ | ✅ | Ops / self-serve Prompt |
| `locked` | ❌ | ❌ | ✅ | Doctor unlock in AMD / ops |
| `provider_not_found` | ❌ | ❌ | ✅ | Ops / tech |
| `prev_note_fetch` | ❌ | ❌ | ✅ | Ops |
| `auth` | ❌ | ❌ | ✅ | Ops |

\* Remap only if the section was mapped to the wrong control type (e.g. text↔checkbox); not the default action for bad prompt output.

**Tweaks (prototype):** `amd_too_long`, `amd_template_changed`, `amd_template_deleted`, `amd_no_permission`, `amd_invalid_value`, `amd_locked`, `amd_provider_not_found`, `amd_prev_note_fetch`, `amd_auth`.

### End-to-end resolve loop (all types)

```
Push fails (async Lambda)
    → write push_errors (planned) + email ops if fatal
    → My Templates: banner + section strip
    → Doctor takes action:
         Remap → save mapping → retry push
         Got it → fix outside My Templates → retry push
         Contact support → ops/admin fixes → doctor retries push
    → Successful push clears push_errors for those sections
```

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
