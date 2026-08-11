# EHR Mapping — AthenaOne

Backend mapping reference + My Templates prototype notes (`cursor/athenaone-ehr-b63b`).  
Related: [MY_TEMPLATES_PRD.md](../MY_TEMPLATES_PRD.md), [ERROR_UX.md](ERROR_UX.md), [SHARED_CONFIG.md](SHARED_CONFIG.md), [EHR_PUSH_FAILURE_LOG_ANALYSIS.md](../EHR_PUSH_FAILURE_LOG_ANALYSIS.md).

AthenaOne is **Category 1** — fixed field list (9 snake_case encounter sections). No API fetch to populate the mapping picker. No Connect EHR step on create.

Doctors see **human-readable labels** in the picker and on section rows. Raw identifiers (`hpi`, `assessment_with_problems`) are stored on the mapping and used at push time — they are not shown in the UI.

---

## Extra Fields YAML keys

| YAML key | Required? | Type | Purpose | Example | Source |
|---|---|---|---|---|---|
| `ehr_field_name` | Yes | Text | Athena's snake_case section identifier — mapped to hardcoded push logic per section type | `"hpi"` | Lookup table below |

**Example YAML:**
```yaml
ehr_field_name: "hpi"
```

---

## Available `ehr_field_name` values

| Section (UI label) | `ehr_field_name` |
|---|---|
| Encounter Reason / CC | `encounterreasonnote` |
| History of Present Illness | `hpi` |
| Review of Systems | `reviewofsystems` |
| Physical Exam | `physicalexam` |
| Assessment & Problem List | `assessment_with_problems` |
| Order Sets | `ordersets` |
| Billing Notes | `billingnotes` |
| Discussion Notes | `discussion_notes` |
| Patient Instructions | `patient_instructions` |

> Must be exact snake_case. Any deviation silently fails — the push is attempted but Athena rejects the field.

---

## Advanced YAML options

| YAML key | Type | Example | What it does |
|---|---|---|---|
| `keep_bullet_points` | Boolean | `true` | Preserves bullet formatting when pushing to Assessment/Plan — without it bullets are stripped |

---

## What doctors can change

| Why | Doctor / Admin action | Effect on mapping | Needs ops? |
|---|---|---|---|
| Wrong encounter field | Remap from fixed list in My Templates | Points at a different `ehr_field_name` | No |
| Practice IT customised the encounter template; Athena pushed an update that changed section names | Renames or removes a section in Athena | `ehr_field_name` no longer matches — push fails with generic error | Yes — update `ehr_field_name` in YAML / doctor Remap if still in list |

No AMD-style auto-remap. Remap is **Flow A** — reopen fixed dropdown, no API call.

---

## Settings — global and local

Product model: **template defaults**, with **per-section overrides only where noted**.  
YAML today still stores some values per row (`config.*`) until Template Settings migration lands.

| Scope | Settings |
|---|---|
| **Global** | **Character limit** (`char_limit`) — global only. Subsection join → Template Settings |
| **Local** | Additional text, Default negative, `keep_bullet_points` (Assessment/Plan) |
| **Not on AthenaOne** | **Push setting** (`append` / `prepend`) — AthenaOne does not fetch existing note content, so append/prepend have no effect. **Line separator** — ECW HL7 only |

### Relevant `config` keys (moving to Template Settings)

| Key | Useful? | Notes |
|---|---|---|
| `append` / `prepend` | ❌ No | AthenaOne does not fetch existing note content |
| `separator` | ✅ Yes | → Template Settings |
| `char_limit` | ✅ Yes | → Template Settings (global) |
| `push_subsections` / `retain_headings` / `skip_empty_subsections` | ✅ Yes | → Template Settings |
| `line_separator` | ❌ No | ECW HL7 only |

---

## Push errors

### Surface (in-app)

Errors appear at **two levels** at once when detectable:

1. **Template banner** — summary
2. **Section row strip** — primary action surface

| Action | Meaning |
|---|---|
| **Remap** | Open fixed-list picker → choose another encounter field → Save |
| **Got it** | Doctor fixes outside My Templates (complete check-in), then retries push |
| **Contact support** | Ops / practice admin must act (auth, persistent transient, broken mapping needing YAML) |

### Detectable failures

| Error | Exception | Behaviour today | Doctor sees | Actions |
|---|---|---|---|---|
| Patient check-in not complete | `LockedEncounterException` → `FatalException` | No retry — ops email only | "This note couldn't be pushed because the patient's check-in isn't complete in Athena. Finish check-in, then push again." | **Got it** (`checkin`) — complete check-in / Go to Exam, retry |
| Per-section push failure (e.g. Unable to push HPI) | bare `Exception` | Logged + ops email; push continues for remaining sections | "One or more sections failed to push. Support has been notified." | **Remap** + Contact support (`mapping_broken`) |
| API quota exceeded | `ManagedException` | Retried with backoff | "Push is temporarily unavailable — we'll retry automatically…" | Contact support if persistent (`transient` / quota) |
| Transient API 500 | Athena infra | Retried; observed as burst (~48 on 2026-07-27) | "Something went wrong on Athena's end — we'll retry automatically." | Contact support if persistent (`transient`) |
| Auth token empty | Auth / creds | Ops | "Push failed due to an authentication issue. Contact support." | Contact support (`auth`) |
| Wrong `ehr_field_name` | bare `Exception` | Athena rejects silently — logged + ops email | Same as per-section failure when surfaced | Remap / ops YAML |

**No `push_errors` DB table exists today** — all failures go to ops email and CloudWatch only. Doctor is not notified in-app until that lands. Prototype Tweaks simulate the intended UX.

### Action matrix

| Type | Remap | Got it | Contact support |
|---|---|---|---|
| `checkin` | — | ✅ | — |
| `mapping_broken` (wrong / broken field) | ✅ | — | ✅ |
| `transient` / `auth` | — | — | ✅ |

### Proactive validation (Layer 2)

| Check | Feasible? |
|---|---|
| `ehr_field_name` in the hardcoded 9-item list | ✅ Free — no API call |

Run on mapping save / Validate Mapping / nightly job.

---

## MA account permissions required

For the practice's MA account in Athena:
- View and select any departments
- View appointments (Calendar view)
- Create appointment
- Ability to Start check-in within appointment
- Delete appointment (optional — for test cleanup)
- View patient chart
- Upload document to patient (for imaging result summarization)
- View Exam Note Sections
- Edit fields in Exam
- Open Marvix Smart launch (iframe) from Exam sections
- Role: **Clinical Staff + Clinical Admin**

Marvix appears as **Marvix AI Scribe** in the Athena Embedded App Access list. Enabled app spaces:
- Encounter: Reason for Visit
- Encounter: History of Present Illness
- Encounter: Review of Systems
- Encounter: Physical Exam
- Encounter: Assessment & Plan
- Apps Tab
- App Dock

---

## Code

| Location | Role |
|---|---|
| `ehr_layer/athenaone.py` | AthenaOne section push; `pre_literal` at ~517 |
| `ehr_layer/section_text_builder.py` | Reads `config` keys and `keep_bullet_points` at push time |

> Older notes sometimes cite `ehr_layer/athenaflow.py` for AthenaOne — that path is **Centricity (Athena Flow)**. AthenaOne push lives in `athenaone.py`.

---

## My Templates prototype

Branch `cursor/athenaone-ehr-b63b` — visual / UX only. EHR locked to **AthenaOne**. Entry: `index.html`.

### Ownership

| Capability | Ops-managed | Self-serve |
|---|---|---|
| List tab / Remap fixed fields / output settings | ✅ | ✅ |
| Global Character limit | ✅ | ✅ |
| Preview / Save | ✅ | ✅ |
| **Reset to default** | ✅ only | ❌ |
| **Request New Section** | ✅ only | ❌ |
| **+ Add section** / **Prompt** edit | ❌ | ✅ |
| **Create → Connect EHR** | ❌ | ❌ — Cat 1 fixed list; create skips Connect |

### Subtle UI elements

| Element | Behaviour |
|---|---|
| Mapping picker | Single column — 9 encounter fields shown as **human-readable labels**. Search matches label or raw id. Fixed-list notice: "Fixed list — defined by AthenaOne's API" |
| Section row chip | Shows label (e.g. "History of Present Illness"), not `hpi` |
| Dual-field demo (`one_to_two`) | Assessment & Problem List + Discussion Notes — push order follows section list order |
| Error Tweaks | `athena_checkin`, `athena_section`, `athena_transient`, `athena_auth` |
| No Push setting bar | Append/prepend have no effect |
| No line separator | ECW-only |
| No Scribe-it column | ECW-only |

### Cap

Self-serve **+ Add section** is capped by the fixed list size (9). Subsections may share a parent mapping or remain unmapped (`ehr: ""`) — AthenaOne has no nested field IDs in the API list.

### Open questions

1. **Rate-limit / quota copy** — Confirm Athena rate-limit scope before finalizing "temporarily unavailable" wording (see PRD).
2. **Per-section vs whole-note check-in** — Check-in failure currently blocks the note; prototype shows it on every failed section strip.
3. **`keep_bullet_points` in UI** — Still YAML/ops today; decide whether Assessment/Plan output settings expose it for self-serve.

### Footnotes

† **Athena (legacy)** is a separate Cat 4 integration (`Athena_Legacy.md`) — not this branch.  
†† **Centricity / Athena Flow** is a separate integration (`Centricity.md`) — not AthenaOne.
