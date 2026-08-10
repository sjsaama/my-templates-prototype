# EHR Mapping — AdvancedMD (AMD)

## Extra Fields YAML keys


| YAML key               | Required? | Type   | Purpose                                                                                                                                             | Example                        | Source                           |
| ---------------------- | --------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | -------------------------------- |
| `ehr_field_id`         | Yes       | Number | AMD's internal field ID — sent in the push payload as `@id` to identify which field to write to                                                     | `12345`                        | Postman API                      |
| `ehr_field_name`       | Yes       | Text   | AMD's field label — used as the stable match key during auto-remap (re-fetches the template and finds the new `ehr_field_id` by this name)          | `"History of Present Illness"` | Postman API                      |
| `ordinal`              | Yes       | Number | Field position within the page — sent in the push payload as `@ordinal`; AMD requires it to locate the field in the note                            | `1`                            | Postman API                      |
| `page_name`            | Auto      | Text   | AMD page the field belongs to — groups fields into the correct page block in the push payload and used during auto-remap                            | —                              | Backend (AMD API) — do not enter |
| `max_character_length` | Auto      | Number | Field character limit fetched from AMD — shown in the character limit indicator in My Templates; used in error messages when push exceeds the limit | —                              | Backend (AMD API) — do not enter |


**Example YAML:**

```yaml
ehr_field_id: 12345
ehr_field_name: "History of Present Illness"
ordinal: 1
```

> `page_name` and `max_character_length` are auto-populated by the backend when you save the mapping — do not enter them manually.

---

## What doctors can change


| Why doctor does this                                                                                  | Doctor / Admin action                                                                         | Effect on mapping                                                                                     | Needs ops?                                                  |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Customising note layout; billing team asked for a new field; cleaning up unused fields                | Adds, removes, or reorders fields within a page (AMD reassigns internal `@id` and `@ordinal`) | Marvix detects "Control not found", re-fetches template, re-matches by `page_name` + `ehr_field_name` | ✅ No — auto-recovery                                        |
| Making field labels clearer for their workflow                                                        | Renames a page or field inside their AMD template                                             | Auto-remap fails — `page_name` or `ehr_field_name` no longer matches, field silently dropped          | ❌ Yes — update `page_name` / `ehr_field_name` in YAML       |
| New visit type (e.g. added telehealth or new specialty); practice switched to a standardised template | Switches to a completely different AMD template                                               | Mapping points at wrong template — pushes to wrong fields or fails entirely                           | ❌ Yes — update `ehr_template_id` + re-enter all YAML fields |


---

## What breaks the mapping


| What breaks it                            | How it fails                                                  | Visible to doctor?                    |
| ----------------------------------------- | ------------------------------------------------------------- | ------------------------------------- |
| Template ID change, field renamed/removed | `EhrTemplateChangeException` raised → auto-recovery attempted | Yes — AMD shows error; Marvix retries |


### Auto-remap (how AMD self-heals)

When AMD returns "Control not found", Marvix automatically:

1. Re-fetches the AMD template
2. Matches each field by `page_name` + `ehr_field_name` to get the new `@id` and `@ordinal`
3. Updates the mapping and retries the push

This survives field reordering and ID reassignment. It **fails** if `page_name` or `ehr_field_name` was renamed — ops must update the YAML manually in that case.

---

## Relevant `config` keys


| Key                      | Useful? | Notes                                                                                                            |
| ------------------------ | ------- | ---------------------------------------------------------------------------------------------------------------- |
| `append`                 | ✅ Yes   | AMD fetches existing note content before pushing — append works                                                  |
| `prepend`                | ✅ Yes   | Same as above                                                                                                    |
| `separator`              | ✅ Yes   | Joins text when multiple sections map to one field. **→ Moving to Template Settings**                            |
| `char_limit`             | ✅ Yes   | AMD enforces `max_character_length` per field — set this to avoid push errors. **→ Moving to Template Settings** |
| `push_subsections`       | ✅ Yes   | **→ Moving to Template Settings**                                                                                |
| `retain_headings`        | ✅ Yes   | **→ Moving to Template Settings**                                                                                |
| `skip_empty_subsections` | ✅ Yes   | **→ Moving to Template Settings**                                                                                |
| `line_separator`         | ❌ No    | ECW HL7 only                                                                                                     |


> `separator`, `char_limit`, `push_subsections`, `retain_headings`, and `skip_empty_subsections` are being promoted to a global **Template Settings** level. Doctors will configure them once per template rather than per mapping row.

---

## Push errors


| Error                                          | Exception                                                             | Behaviour                                                                                                                                                       | Doctor-actionable?                                      |
| ---------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Field control no longer exists in EHR template | `EhrTemplateChangeException`                                          | Lambda auto-recovers: re-fetches template, rebuilds mapping by `page_name` + `ehr_field_name`, retries push. If retry also fails → `FatalException` → ops email | ✅ Yes — if auto-recovery fails, ops must remap          |
| `ehr_template_id` deleted from AMD             | `FatalException`: `"Template not found."`                             | No retry — ops email only                                                                                                                                       | ✅ Yes — ops picks new EHR template, remaps all sections |
| Section text exceeds AMD character limit       | `FatalException`: `"Value is too long."`                              | Error message includes section name and the character limit                                                                                                     | ✅ Yes — doctor shortens the note                        |
| MA account missing Create Pt Notes permission  | `FatalException`: `"permission level does not allow Create Pt Notes"` | No retry — ops email only                                                                                                                                       | ✅ Yes — practice admin fixes MA account in AMD          |
| Provider not found                             | `FatalException`: `"Provider not found."`                             | No retry — ops email only                                                                                                                                       | ❌ No — ops/tech fixes setup                             |
| Field value rejected                           | `FatalException`: `"Value is not valid"`                              | No retry — ops email only                                                                                                                                       | ❌ No — ops fixes YAML                                   |


**No `push_errors` DB table exists today** — all failures go to ops email and CloudWatch only. Doctor is not notified in-app.

---

## Where this lives in the code


| Location                            | Role                                               |
| ----------------------------------- | -------------------------------------------------- |
| `internal_endpoints.py:3797`        | Auto-populates `max_character_length` from AMD API |
| `ehr_layer/advancedmd.py:1629`      | `get_updated_ehr_mapping()` — auto-remap logic     |
| `ehr_layer/section_text_builder.py` | Reads `config` keys at push time                   |


---

## My Templates prototype (AMD branch)

Living notes for branch `cursor/amd-ehr-34b9`. Visual / UX prototype — not production wiring.

**Keep this section updated whenever AMD prototype decisions or UI change.**

Related: [MY_TEMPLATES_PRD.md](../MY_TEMPLATES_PRD.md), [ERROR_UX.md](ERROR_UX.md).

### Repo layout (this branch)

```
index.html              # app entry (GitHub Pages)
*.jsx / design-tokens.js
MY_TEMPLATES_PRD.md     # product PRD
BACKEND.md
EHR_PUSH_FAILURE_LOG_ANALYSIS.md
ehr_mapping/            # per-EHR docs — AMD notes live in THIS file
design/                 # Figma + screenshots (not runtime)
.github/                # historical design-PR bodies
```

### Prototype scope

- Tweaks EHR switcher fixed to `AMD`; runtime `ehr` always `AMD`
- Template list filtered to AMD templates only
- Mapping display: **`Office Visit > Field Name`** (Title Case) on chips, picker, and char limits
- Ownership tabs: **Ops-managed** / **Self-serve** (with counts)
- AMD **checkbox** fields appear in the same field picker as text fields (tagged + allowed-values hint)
- Push-error actions vary by error type (Remap / Got it / Contact support) — see matrix below

### Ownership matrix (current)


| Capability                                | Ops-managed                                                   | Self-serve                                  |
| ----------------------------------------- | ------------------------------------------------------------- | ------------------------------------------- |
| Listed under Ops-managed / Self-serve tab | ✅                                                             | ✅                                           |
| Remap EHR fields + Output settings        | ✅                                                             | ✅                                           |
| Preview / Save / Reset                    | ✅                                                             | ✅                                           |
| **Request New Section**                   | ✅ only                                                        | ❌                                           |
| **+ Add section** (incl. subsections)     | ❌                                                             | ✅                                           |
| **Prompt** edit on row                    | ❌                                                             | ✅                                           |
| Seeded examples                           | General 1–3, First Visit, Follow Up, Neuro, AVS, Letters, DDx | `General 3 — Custom`, `Follow Up — My Push` |


Header shows an ownership badge + short hint for the active template.

### Confirmed decisions


| Topic                             | Decision                                                 |
| --------------------------------- | -------------------------------------------------------- |
| Configuration column              | **Not needed for AMD**                                   |
| EHR path style                    | **`Office Visit > Title Case`** everywhere               |
| Template types                    | **Self-serve** and **Ops-managed** (list tabs)           |
| Request New Section               | **Ops-managed only** — self-serve uses + Add section ††† |
| STATIC section badge              | **Dropped** †                                            |
| EHR Pull / File Upload ghost rows | **Dropped** †                                            |
| AMD checkbox fields               | Same picker as text; distinct control type + allowed values |
| Push-error Remap                  | Only when mapping is wrong/stale — not for too-long / permission |


### Subtle cases (prototype)

#### Checkbox fields (same picker, different push rules)

AMD returns checkbox controls as **separate fields** in the template API — not merged into the adjacent text field. Doctors pick them from the **same** field list as text fields.

| Detail | Behavior |
| --- | --- |
| Examples in mock | `Office Visit > Chief Complaint Enable` (Yes/No), `Office Visit > ROS Complete` (Y/N) |
| Seeded dual mapping | `Chief Complaint` (text) + `Chief Complaint Enable` (checkbox) as **two sections** |
| Chip / picker UX | Checkbox rows show a `checkbox` tag; picker foot shows allowed values when selected |
| Prompt rule | Section prompt must output **exactly one** of the field's allowed values |
| Allowed values | Come from the AMD template fetch; values differ per field (`Yes`/`No` vs `Y`/`N`) |
| Tweaks dual demo | `amd_checkbox` still shows the CC Text + CC Enable pair as a visual one-to-two chip |
| Open (PRD) | Who authors checkbox prompts (ops vs doctor); whether UI surfaces allowed values in the prompt editor; relationship to YAML `extract_boolean_value` (see SHARED_CONFIG) |

Invalid checkbox output → AMD `"Value is not valid"` → Contact support (ops reviews constraints / prompt). Tweaks: `amd_invalid_value`.

#### Push-error action matrix

Banner + row strip share `pushIssueActions(type)`:


| Error type | Example Tweaks scenario | Remap | Got it | Contact support | Who fixes |
| --- | --- | --- | --- | --- | --- |
| `too_long` | `amd_too_long` | ❌ | ✅ | ❌ | Doctor shortens note (limit from `max_character_length`) |
| `checkin` / `chart_closed` | (other EHRs) | ❌ | ✅ | ❌ | Doctor acts in EHR, then re-push |
| `template_changed` / `mapping_broken` | `amd_template_changed` | ✅ | ❌ | ✅ | Doctor remaps; ops if auto-recovery failed |
| `permission` / `auth` / `locked` / `transient` / `invalid_value` | `amd_no_permission`, `amd_invalid_value` | ❌ | ❌ | ✅ | Ops / practice admin |


Subtle: **too-long must not offer Remap** — the mapping is fine; the content is over the AMD char limit (HPI mock uses max **2,000**). Self-serve styling (amber) vs ops-needed (red) still follows `selfServe` on the issue.

### Still to align

1. Cat 2 create: **Connect EHR** step (pick AMD note template / field list) — `EHR_TEMPLATES_BY_SYSTEM.AMD` exists but unused
2. Prompt-editor surfacing of checkbox allowed values (open PRD question)
3. More AMD fatal mocks if needed (`Template not found`, provider not found)

### PRD vs prototype (AMD)


| Area                                                                       | Status      | Notes                                                  |
| -------------------------------------------------------------------------- | ----------- | ------------------------------------------------------ |
| Ownership tabs + matrix above                                              | **Present** | Matches product call (Request = ops-managed)           |
| `Office Visit > Title Case` mapping + picker                               | **Present** | Chips, picker, char limits aligned                     |
| Cat 2 Connect EHR / fetch at create                                        | **Missing** | Create is Starting point → Describe → Review           |
| Remap from field list                                                      | **Present** | Mocked static AMD field list (no live fetch)           |
| Output settings (push mode, additional text, default negative, char limit) | **Present** | Sliders panel; no Configuration column                 |
| AMD checkbox fields in picker                                              | **Present** | Tagged in picker + chip; CC Enable seeded; allowed-values hint |
| Push errors: template changed / too long / permission / invalid value      | **Present** | Action matrix by type; too-long → Got it only          |
| Preview / M·S / parent modes / Shared field                                | **Present** |                                                        |


### Changelog


| Date       | Change                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------ |
| 2026-08-10 | Branch created; EHR locked to AMD                                                          |
| 2026-08-10 | Confirmed: no Configuration column; one path style; Self-serve / Ops-managed               |
| 2026-08-10 | Dropped STATIC badge + EHR Pull/File Upload ghost rows †                                   |
| 2026-08-10 | Unified path style to `Office Visit > Title Case` on seeded chips + picker                 |
| 2026-08-10 | Merged `main` (PRD, `ehr_mapping/`, error-scenario + dual-mapping demos)                   |
| 2026-08-10 | Consolidated prototype notes into this file; removed standalone AMD branch docs            |
| 2026-08-10 | Cleaned branch layout → `design/`; removed stale `My Templates.html`                       |
| 2026-08-10 | PRD vs prototype scoreboard                                                                |
| 2026-08-10 | Ops-managed / Self-serve list tabs + ownership badge/hint; seeded two self-serve templates |
| 2026-08-10 | **Request New Section = ops-managed only** †††; refreshed ownership matrix in this doc     |
| 2026-08-10 | Checkbox fields in picker + seeded CC Enable; push-error action matrix; subtle-cases notes |


### Footnotes — dropped / superseded / product calls

† **STATIC (dropped)** — section-level badge for non-AI / fixed content (old mock: lock on HPI / Labs).  
*Still in the mock (different concept):* **Static Start / Static End** / Additional text — fixed boilerplate around a section body.

† **EHR Pull / File Upload ghost rows (dropped)** — inbound rows like Vitals (“Inserted by EHR Pull”) or file upload; enable only, no mapping chip.

†† **`Clinical Notes > snake_case` path style (superseded)** — older design chips; prototype uses **`Office Visit > Title Case`** only.

††† **Request New Section ownership (product call)**  
Shown on **ops-managed** templates only — doctors ask ops to add structure. Self-serve templates use **+ Add section** instead. Overrides an earlier PRD line that gated Request New Section to user-created / self-serve templates.