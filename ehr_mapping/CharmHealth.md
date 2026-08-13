# EHR Mapping — CharmHealth

## What is "SOAP" in CharmHealth?

- **SOAP is a standard clinical note format** — Subjective, Objective, Assessment, Plan — not something Marvix invented.
- **CharmHealth offers SOAP as one of several chart/encounter types** a practice can build a note template as: `Quick`, `Brief`, `Comprehensive`, `SOAP`, `QuickRx` (`charm.py:136,159`).
- **Each chart type is a genuinely different feature inside CharmHealth**, not just a label — SOAP-type encounters get their own API surface (a dedicated `soap/encounters/{id}` endpoint, a template-attachment step, entry-based fields). Non-SOAP types share one general `encounters/{id}` path.
- **Marvix only sniffs the template *name*, not Charm's real `chart_type` field.** `charm.py:238` checks whether `ehr_template_name` starts with `"soap"` (case-insensitive) and routes to `save_note_soap()` or `save_note_default()` on that alone.
- **This makes the routing fragile by naming convention.** If a practice's SOAP-format template happens to be named something that doesn't start with "soap" (e.g. "Progress Note"), Marvix treats it as Default mode and pushes with the wrong field-identification scheme.
- **For Marvix's purposes, only two modes exist**, not five — SOAP (`ehr_field_id`-keyed) and Default (`ehr_field_name` fixed-keyword-keyed). `Quick`, `Brief`, `Comprehensive`, and `QuickRx` templates all fall into the same "Default" bucket as long as their name doesn't start with "soap," regardless of their real CharmHealth chart type.

## Two push modes with different field-identification schemes

CharmHealth has two completely different push paths, selected by whether `ehr_template_name` starts
with `"soap"` (case-insensitive):

| Mode | Field key used | How a field is identified |
|---|---|---|
| **SOAP** (`ehr_template_name` starts with `"soap"`) | `ehr_field_id` | Numeric Charm entry ID within the SOAP template, except Chief Complaint which uses `ehr_field_name: "chief_complaints"` |
| **Default** (anything else) | `ehr_field_name` | A fixed keyword (see list below) — `ehr_field_id` is not read at all in this mode |

## Extra Fields YAML keys

**SOAP mode:**

| YAML key | Required? | Type | Purpose | Example | Source |
|---|---|---|---|---|---|
| `ehr_field_id` | Yes (except Chief Complaint) | Number | Charm entry ID — identifies the specific SOAP template entry to write to | `194780800000679203` | Postman API |
| `ehr_field_name` | Chief Complaint only | Text | Fixed string `"chief_complaints"` — triggers a separate Chief Complaint push path | `"chief_complaints"` | — |

**Default (non-SOAP) mode:**

| YAML key | Required? | Type | Purpose | Example | Source |
|---|---|---|---|---|---|
| `ehr_field_name` | Yes | Text | One of a fixed set of keywords Charm's encounter-notes API recognizes (see below). `ehr_field_id` is ignored in this mode | `"present_illness_history"` | Tech |

Recognized `ehr_field_name` keywords in default mode (`charm.py` `__get_encounter_note_field_name`):
`chief_complaints`, `symptoms`, `present_illness_history`, `past_medical_history`,
`family_social_history`, `review_of_systems`, `physical_examination`, `assessment_notes`,
`self_notes`, `diets`, `lifestyle`, `treatment_notes`, `patient_notes`, `followup_notes`. Any other
value is still sent to Charm but won't match an existing note field for the append/prepend lookup.

**Example YAML (SOAP mode, standard section):**
```yaml
ehr_field_id: 194780800000679203
```

**Example YAML (SOAP mode, Chief Complaint):**
```yaml
ehr_field_name: "chief_complaints"
```

**Example YAML (default mode):**
```yaml
ehr_field_name: "present_illness_history"
```

---

## Relevant `config` keys

| Key | Useful? | Notes |
|---|---|---|
| `append` | ✅ Yes | CharmHealth fetches existing note content before pushing |
| `prepend` | ✅ Yes | Same as above |
| `separator` | ✅ Yes | **→ Moving to Template Settings** |
| `char_limit` | ✅ Yes | **→ Moving to Template Settings** |
| `push_subsections` | ✅ Yes | **→ Moving to Template Settings** |
| `retain_headings` | ✅ Yes | **→ Moving to Template Settings** |
| `skip_empty_subsections` | ✅ Yes | **→ Moving to Template Settings** |
| `line_separator` | ❌ No | ECW HL7 only |

> `separator`, `char_limit`, `push_subsections`, `retain_headings`, and `skip_empty_subsections` are being promoted to a global **Template Settings** level. Doctors will configure them once per template rather than per mapping row.

---

## What doctors can change

| Why doctor does this | Doctor / Admin action | Effect on mapping | Needs ops? |
|---|---|---|---|
| Practice restructured encounter templates; changed specialty | Changes template or removes an entry field | `ehr_field_id` no longer valid — silently skipped or fatal "mapping error" | ❌ Yes — get new field IDs from Postman API |

---

## What breaks the mapping

| What breaks it | How it fails | Visible to doctor? |
|---|---|---|
| Missing `ehr_field_id` (SOAP mode) | Field silently skipped (`ehr_field_id` missing and not the chief-complaint field → `continue`) | No |
| Wrong/stale `ehr_field_id` (SOAP mode) | Charm rejects the entry ID (`"zf.api.inavalid.id.provided"`) → `FatalException`: `"Template mapping error."` | Yes — fatal, ops email |
| Wrong `ehr_field_name` (default mode) | Not in Charm's fixed keyword list — pushed anyway but won't match existing content for append/prepend; Charm may ignore the unrecognized key | No |

---

## Push errors

| Error | Exception | Behaviour | Doctor-actionable? |
|---|---|---|---|
| Account locked | `FatalException`: `"Your account has been locked"` | No retry — ops email | ❌ No — ops/practice admin unlocks |
| Signed SOAP encounter (can't edit) | `FatalException`: `"Notes can not be edited for signed soap encounter."` | No retry — ops email | ❌ No — chart already signed |
| Signed encounter (can't edit) | `FatalException`: `"Notes can not be edited for signed encounter."` | No retry — ops email | ❌ No — chart already signed |
| Wrong `ehr_field_id` (SOAP mode) | `FatalException`: `"Template mapping error."` | No retry — ops email | ❌ No — ops fixes field ID |
| Any field failure in SOAP mode | No exception raised | **Silently skipped** — no error returned by CharmHealth API | ❌ Undetectable |

**SOAP mode is undetectable**: if `ehr_template_name` starts with `"soap"`, CharmHealth returns no per-field errors. Marvix cannot know which sections landed. Ops must spot-check the chart after onboarding.

**No `push_errors` DB table exists today** — all failures go to ops email and CloudWatch only.

---

## Where this lives in the code

| Location | Role |
|---|---|
| `ehr_layer/charm.py:227` | `save_note()` — picks SOAP vs default mode based on `ehr_template_name` |
| `ehr_layer/charm.py:273` | `save_note_soap()` — builds payload keyed by `ehr_field_id` (Charm entry ID), one batch POST |
| `ehr_layer/charm.py:325` | `save_note_default()` — builds payload keyed by `ehr_field_name` (fixed keyword) |
| `ehr_layer/charm.py:208` | `__get_encounter_note_field_name()` — maps `ehr_field_name` to Charm's internal note field key for the default-mode existing-content lookup |
| `ehr_layer/section_text_builder.py` | Reads `config` keys at push time |
