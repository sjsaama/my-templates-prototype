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

## Settings — global (template) and local (section)

Doctor-facing settings for AMD push. Today these still live as per-row YAML `config` keys; the product model is **global template defaults** with **optional per-section overrides**.

### Push setting (combined write mode)

`append` / `prepend` / overwrite are **one control**, not three separate toggles:

| UI label | YAML today | Behaviour |
| -------- | ---------- | --------- |
| **Insert before** | `prepend: true` | Marvix content before existing EHR field text |
| **Insert after** | `append: true` | Marvix content after existing EHR field text |
| **Overwrite** | neither (replace) | Marvix content replaces the field |

AMD can read existing note content before writing, so all three modes work.

**Hierarchy**

1. **Global (template)** — doctor sets Push setting once on the template
2. **Applied to each section** — that value becomes the default for every section on the template
3. **Local override** — any section can change Push setting in its output settings (sliders) without affecting other sections

Prototype: template bar sets/applies the mode to all sections; section panel can diverge afterward.

### Global — template settings

Set once per template. Apply as defaults across sections.


| Setting | YAML today | AMD notes |
| ------- | ---------- | --------- |
| **Push setting** | `append` / `prepend` (or neither = overwrite) | Combined control above. Global default → applied to each section → overridable locally. |
| Subsection join / headings | `push_subsections`, `retain_headings`, `skip_empty_subsections`, `separator` | How parent + child text is combined into one EHR field. **Template Settings** (not per mapping row). |
| Character limit display | `char_limit` / AMD `max_character_length` | Limit comes from the AMD field. Shown for reference; not doctor-authored. |


`line_separator` — ❌ not used for AMD (ECW HL7 only).

### Local — section output settings

Opened via the sliders button on a section row (Cat 1 / Cat 2).


| Setting | Scope | Notes |
| ------- | ----- | ----- |
| **Push setting** | Section override | Same Insert before / Insert after / Overwrite control. Overrides the template default for this section only. |
| Additional text | Section | Fixed text before/after section body on push |
| Default negative | Section | Text pushed when the section has no generated content |
| AMD field limit | Read-only | From `max_character_length` on the mapped field |

> YAML migration: keep writing `config.append` / `config.prepend` per row until Template Settings lands; the UI presents one Push setting with global → local inheritance.

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
| Push setting (append/prepend/overwrite) | **One control** — set globally on the template, applied to each section, overridable per section |


### Subtle UI elements

AMD-specific UI details that are easy to miss. Keep this list current as the prototype evolves.

#### 1. Checkbox fields

AMD checkbox controls are **real fields** from the template API — not a Marvix toggle bolted onto a text field.

| UI detail | What to notice |
| --- | --- |
| Same picker as text | Checkbox destinations appear in the **same** field list; doctor picks one like any other field |
| `checkbox` tag | Picker rows and mapping chips show a `checkbox` type tag (and ☑ affordance) |
| Allowed values | Selecting a checkbox field shows allowed values in the picker foot (`Yes`/`No`, `Y`/`N`, …) — values come from AMD and **differ per field** |
| Dual mapping | Common pattern: **two sections** for one clinical idea — e.g. `Chief Complaint` (text) + `Chief Complaint Enable` (checkbox) |
| Prompt constraint | Section prompt must output **exactly one** allowed value, or AMD rejects with `"Value is not valid"` |
| Chip under mapping | Mapped checkbox chips also surface allowed values under the chip |

Open: whether the prompt editor surfaces allowed values; relationship to YAML `extract_boolean_value` (see SHARED_CONFIG). Tweaks: `amd_checkbox`, `amd_invalid_value`.

#### 2. Push setting — Insert before / Insert after / Overwrite

Former `append` / `prepend` / replace are **one control**, not three toggles.

| UI detail | What to notice |
| --- | --- |
| Labels | **Insert before** · **Insert after** · **Overwrite** (not raw Prepend/Append/Replace in the doctor UI) |
| Global bar | Template **Push setting** bar at the top of the editor — AMD only |
| Apply-all | Changing the template bar **applies that mode to every section** |
| Local override | Section output settings (sliders) can diverge; shows “template default” vs “section override” |
| Reset | Overridden sections can “Use template default” |
| Why AMD | AMD can read existing note content before write — all three modes are valid |

#### 3. Other AMD-specific UI subtleties

| Element | Subtlety |
| --- | --- |
| **No Configuration column** | AMD does not show a Config/Prepend-Append column in the section table — Push setting lives in the template bar + output settings |
| **Path style** | Mapping chips, picker, and limits use **`Office Visit > Title Case`** only (not `Clinical Notes > snake_case`) |
| **AMD field limit** | Read-only amber callout in output settings from `max_character_length` — doctor cannot edit the limit |
| **Shared field** | Two+ sections mapped to the same EHR field get a neutral **Shared** chip label (valid, not a warning); content combines in section list order |
| **Push-error actions** | Buttons depend on error type — too-long → **Got it** only (no Remap); template changed → **Remap** + Contact support; permission / invalid value → Contact support only |
| **Too-long copy** | Message includes section name + AMD char limit (e.g. HPI max 2,000) — mapping is fine; content is the problem |
| **Self-serve vs ops styling** | Doctor-fixable errors use amber; ops-needed failures use red — driven by `selfServe` on the issue |
| **Ownership chrome** | Ops-managed: Request New Section. Self-serve: + Add section + Prompt. Remap / output settings / Push setting on both |
| **Parent mapping modes** | Whole section vs map subsections individually — Shared / remap still apply to the active mapping target |
| **Dropped chrome** | No STATIC section badge; no EHR Pull / File Upload ghost rows † |

#### Push-error action matrix (reference)

Banner + row strip share `pushIssueActions(type)`:


| Error type | Example Tweaks scenario | Remap | Got it | Contact support | Who fixes |
| --- | --- | --- | --- | --- | --- |
| `too_long` | `amd_too_long` | ❌ | ✅ | ❌ | Doctor shortens note (limit from `max_character_length`) |
| `checkin` / `chart_closed` | (other EHRs) | ❌ | ✅ | ❌ | Doctor acts in EHR, then re-push |
| `template_changed` / `mapping_broken` | `amd_template_changed` | ✅ | ❌ | ✅ | Doctor remaps; ops if auto-recovery failed |
| `permission` / `auth` / `locked` / `transient` / `invalid_value` | `amd_no_permission`, `amd_invalid_value` | ❌ | ❌ | ✅ | Ops / practice admin |

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
| Output settings (push setting, additional text, default negative, char limit) | **Present** | Global Push setting bar + per-section override; no Configuration column |
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
| 2026-08-10 | Config keys → **Global / Local settings**; Push setting = append+prepend+overwrite (global default, per-section override) |
| 2026-08-10 | Added **Subtle UI elements** section (checkbox, Push setting, other AMD UI subtleties) |


### Footnotes — dropped / superseded / product calls

† **STATIC (dropped)** — section-level badge for non-AI / fixed content (old mock: lock on HPI / Labs).  
*Still in the mock (different concept):* **Static Start / Static End** / Additional text — fixed boilerplate around a section body.

† **EHR Pull / File Upload ghost rows (dropped)** — inbound rows like Vitals (“Inserted by EHR Pull”) or file upload; enable only, no mapping chip.

†† **`Clinical Notes > snake_case` path style (superseded)** — older design chips; prototype uses **`Office Visit > Title Case`** only.

††† **Request New Section ownership (product call)**  
Shown on **ops-managed** templates only — doctors ask ops to add structure. Self-serve templates use **+ Add section** instead. Overrides an earlier PRD line that gated Request New Section to user-created / self-serve templates.