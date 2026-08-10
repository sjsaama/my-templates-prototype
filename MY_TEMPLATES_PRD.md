# My Templates — PRD

---

## Problem

Doctors have no visibility or control over how their clinical notes are structured and pushed to their EHR. Everything — section setup, EHR field mapping, formatting — is configured by ops during onboarding. When something breaks, doctors don't know. When they want something changed, they raise a support ticket.

This creates three problems:

| Problem | Impact |
|---|---|
| Doctors can't see how their template maps to EHR fields | No trust in the push; they check the EHR manually after every note |
| Doctors can't adjust section output settings themselves | Support tickets for minor changes like default text or spacing |
| Push failures are invisible — only ops gets notified | Doctors don't know a section failed to push until a patient record is missing data |

---

## Solution

A self-serve template management surface inside the Marvix app. Doctors can:
- View their assigned templates and how each section maps to their EHR
- Remap sections if a push fails
- Adjust per-section output settings (formatting, default text, static content)
- Request new sections

Ops remains in control of the template structure. Doctors customize within that structure.

---

## Who is this for

Doctors on Marvix who push notes to an EHR. The experience varies significantly by which EHR they use — see EHR behavior section below.

---

## What doctors can do

### View their template

| What they see | Detail |
|---|---|
| All sections in their template | Hierarchical — parent sections with child subsections |
| EHR field each section maps to | Varies by EHR — see EHR behavior section |
| Which sections have macros or summarizers attached | Icon buttons (M / S) on the section row. Clicking opens a popover listing the connected items. Active state shown with a dot indicator when at least one item is connected |
| Whether customizations are set | Dot indicator on the Output & EHR tab |

### Remap a section

If a push fails because the EHR field mapping is wrong, the doctor can pick a different field:

| EHR type | How remap works |
|---|---|
| Cat 1 — AthenaOne, ECW, Veradigm, Centricity (AthenaFlow) | Open mapping picker, select from hardcoded field list. No API call. Field names shown with human-readable labels. |
| Cat 2 — AMD, DrChrono | Open mapping picker, select from the field list fetched at template creation. |
| Cat 2 — CharmHealth | Open mapping picker, select from existing field list. Cannot re-fetch — automation blocked until CharmHealth templates API is available (confirm with KJ). If EHR template changed, doctor uses "Contact support" in picker. |
| Cat 3 — ModMed (PDF), Cerner (PDF), Nereg (auto `key_name`) | No field mapping to remap. Remap button not shown. EHR template/document connection is still required — see Cat 3 section. |
| Cat 4 | No push capability. Remap button not shown. |

### Adjust section output settings

Per-section settings opened via the sliders (⊟) button on each section row. Only shown for Cat 1 and Cat 2 EHRs — hidden for Cat 3 (auto-push, no field config) and Cat 4 (no push).

> **Note:** "How subsections combine" (include headings, skip empty) and subsection spacing (single/double line) are template-level settings that live in the **Settings Portal**, not My Templates. They are out of scope here.

**Content shaping** — Cat 1 and Cat 2 EHRs

| Setting | What it does | Where it appears |
|---|---|---|
| Additional text | Fixed text placed before or after section content on push. Doctor picks Before or After from a dropdown. Replaces old pre-literal / post-literal fields. | Output settings panel |
| Default negative | Text pushed when section has no generated content (e.g. "Not reported") | Output settings panel |
| Character limit | Read-only — set by EHR field, shown for reference | Output settings panel (all EHRs where the field has a limit) |
| Can push (AMD checkbox) | AMD only. A checkbox field in AMD is a **distinct field type** returned separately by the AMD template API — it is not merged into the adjacent text field. Checkbox fields appear in the **same field picker dropdown** as text fields; the doctor selects one as the mapping destination, same as any other field. The pushed value is determined by the section's AI prompt output, which must be written to output one of the checkbox field's allowed values (these come through in the same API fetch as the field names). Both the checkbox field and text field are mapped independently as separate sections, even when they relate to the same logical concept (e.g. chief complaint enable + chief complaint text = two separate mappings). Common case: chief complaint = CC Enable (checkbox) + CC Text (text field), both pushed. | Field picker (AMD — checkbox fields appear alongside text fields in the dropdown) |
| Section separator | Separator character/string inserted between sections on push | Output settings panel (Veradigm) |
| Subsection separator | Separator character/string inserted between subsections on push | Output settings panel (Veradigm) |
| Default line separator | Default separator used for all line breaks in pushed content | Output settings panel (Veradigm) |

> **Removed:** "Keep bullet points" toggle is out of scope for v1 — stripped from prototype.

**EHR-specific line-break requirements**

| EHR | Requirement |
|---|---|
| ECW | Uses a non-standard line-break character — content must be formatted accordingly before push |
| Veradigm | Requires `\r\n` (CRLF) line endings — plain `\n` will render incorrectly in the EHR |

**Write mode** — AMD only

| Setting | What it does |
|---|---|
| Prepend / Replace / Append | How Marvix content relates to text already in the EHR field |

**Veradigm — push as note vs. push as document**

Setting is **template-level**, not user-level. Whether content is pushed as a note or a document is determined at template configuration time (by ops), not per-user or per-push. Doctor does not see or control this.

**Advanced mapping mechanisms**

| Mechanism | What it is |
|---|---|
| Append other derivative | A section can pull content from a derivative template (e.g. a summary template) and append it to the main note on push. Mechanism TBD — needs clarification from Vignesh. |
| ICD / EM code mapping | Uses template ID in the mapping editor — a **separate mechanism** from append-other-derivative. ICD/CPT fields are not in the standard mapping table. |
| One section → two EHR fields | A single logical section (e.g. chief complaint) may map to two separate EHR destination fields — confirmed for AMD (checkbox field + text field). Both fields are mapped independently. For non-checkbox pairs, ordering may matter for how the EHR renders them — handling TBD. See open questions. |
| Two sections → same EHR field | Multiple Marvix sections can share the same EHR destination field. This is valid and supported. Content from all mapped sections is combined in section order. The UI shows a neutral "Shared" label on the mapping chip (not a warning). |
| First-line heading omit | Whether the first line (section heading) is stripped before push. Configurability unconfirmed — see open questions. |

### Request a new section

### Reset to default

Doctor can discard all their customizations for a template and restore the ops-configured default. Requires a confirmation step (lists what will be cleared: custom EHR mappings, section order, output settings).

### Request a new section

Doctor can submit a request for a section that doesn't exist yet:

| Field | Required? |
|---|---|
| Section name | ✅ |
| Description | ✅ |
| EHR field hint | ✅ |
| Is it a subsection? | ✅ |
| Which templates to add it to | ✅ |

Requests go through ops review (approve / reject with note). Doctor is notified in-app when status changes.

---

## UI decisions (from prototype review)

These decisions were made during prototype review and should be treated as locked unless explicitly revisited.

### Header and template structure

- **Template meta:** EHR system and derivative type shown as chip badges in the editor header — not text labels.
- **Save / Reset buttons:** Live in the header row alongside the template title. No separate toolbar bar.
- **"Request New Section" button:** Header, right side — only shown for user-created (self-serve) templates. Ops-managed templates do not show this button.
- **"+ Add section" button:** Only shown for user-created templates. Hidden for ops-managed templates where the section structure is controlled by ops.
- **"Request from ops" (sidebar):** Simplified to a plain ghost text link — no subtitle, no secondary line.

### Section row

- **Macro / summarizer icons:** Labeled `M` (macros) and `S` (summarizers). Not symbols. Active state shown with a dot indicator when at least one item is connected.
- **Prompt button:** Inline on each row — labeled "Prompt". Shows a `!` indicator if no prompt has been written yet.
- **Output settings button (sliders):** Only shown for Cat 1 and Cat 2 EHRs. Hidden for Cat 3 and Cat 4 — there is nothing to configure.
- **Remap button on push error strip:** Only shown for Cat 1 / Cat 2 EHRs (where remap is possible). Cat 3 / Cat 4 error strips show "Contact support" only.

### Mapping picker

- **Field labels:** Human-readable labels are used everywhere in the picker and on section rows — raw API identifiers (camelCase, snake_case) are not shown to doctors. AthenaOne and Veradigm field names are mapped to readable labels (e.g. `assessment_with_problems` → "Assessment & Problem List").
- **CharmHealth notice:** Amber warning in the picker: "Field list can't be refreshed — remap from the list below, or contact support if your EHR template changed." A "Contact support" button is shown inline. The doctor can still remap to any field in the existing list.
- **eCW Scribe-it:** Separate field list from the primary destination. Primary uses eCW shortcut commands (`HPI:`, `Assessment:`). Scribe-it uses a distinct set of Scribe-it note panel fields (`ScribeIt > HPI`, `ScribeIt > Physical Exam`, etc.).

---

## EHR behavior by category

### Cat 1 — Fixed field list

EHRs: AthenaOne, ECW, Veradigm, Centricity (AthenaFlow)

Field names are hardcoded — no API call needed to populate the dropdown. What the doctor sees in the mapping column:

| EHR | Format | Display |
|---|---|---|
| AthenaOne | Snake_case identifiers (`hpi`, `assessment_with_problems`) | Shown as human-readable labels: "History of Present Illness", "Assessment & Problem List" |
| ECW | Shortcut command names (`HPI:`, `Assessment:`, `Chief Complaints:`) | Shown as-is — these are the literal commands eCW recognizes |
| Veradigm | camelCase (`historySections`, `reviewOfSystem`, `assessmentPlanHP`) | Shown as human-readable labels: "History Sections", "Review of Systems", "Assessment & Plan" |
| Centricity | Snake_case identifiers (`hpi`, `assessment_plan`) | Shown as human-readable labels: "History of Present Illness", "Assessment & Plan" |

**ECW — Scribe-it secondary destination:** ECW is the only Cat 1 EHR with a secondary push destination. The mapping picker has two columns: Primary (shortcut commands like `HPI:`, `Assessment:`) and Scribe-it (a separate destination in eCW's Scribe-it note panel — different field set, e.g. `ScribeIt > HPI`, `ScribeIt > Physical Exam`). Both are optional; Scribe-it is surfaced as "optional" in the picker.

### Cat 2 — Flexible field list

EHRs: AMD, DrChrono, CharmHealth

Fields come from the doctor's EHR note template. The field list is populated at template creation time when the doctor selects their EHR note template — **there is no separate "Fetch fields" step** in the template editor. If fields need to be refreshed after the initial setup, the flows below apply.

| EHR | Format | Remap / refresh behavior |
|---|---|---|
| AMD | `Page Name > Field Name` | Push mode (prepend/append/replace) and character limit shown in output settings. Doctor can remap freely from the field list. |
| DrChrono | Snake_case field names | ICD/CPT fields handled separately — not in mapping table. Doctor can remap. |
| CharmHealth | `entry_chart_section` value if set, otherwise field name | Field list cannot be re-fetched. Doctor can remap from the existing list. If the EHR template changed and the field list itself is stale, doctor uses "Contact support" — ops handles the refresh. |

> **Design decision:** EHR field fetching is not part of the creation flow. After a Cat 2 template is created, the doctor opens it in the editor and fetches fields there — a "Fetch fields from [EHR]" action inside the template editor, not a creation step. The creation flow is identical for all EHR categories. CharmHealth cannot re-fetch — the editor shows an amber notice explaining this, with a "Contact support" button.

### Cat 3 — Auto push (no field mapping; template connection required)

EHRs: Cerner, ModMed, Nereg

**Shared:** No mapping rows / field picker. Output settings (sliders) hidden. Remap button not shown on push errors.

**Also shared (corrected):** Marvix must still be **connected to a template / document target in the final EHR**. Earlier drafts said Cat 3 skips Connect EHR entirely — that was wrong. There is no section→field mapping, but there is still an EHR-side destination to attach.

Per-EHR push behavior and subtle differences are documented in [`ehr_mapping/CATEGORY_3.md`](ehr_mapping/CATEGORY_3.md). Summary:

| EHR | How it pushes | Label shown in mapping column | Subtle difference |
|---|---|---|---|
| Cerner | Whole note as PDF via FHIR | "Whole note pushed as PDF" | `ehr_template_name` → PDF filename in chart |
| ModMed | Whole note as PDF (Binary → S3 → DocumentReference) | "Whole note pushed as PDF" | Same PDF outcome as Cerner; encounter lookup can silently omit encounter link |
| Nereg | Section content matched by `key_name` | "Auto-mapped from section names" | **Not** a PDF — structured auto-routing; renaming `key_name` silently drops content |

**UX incorporation TBD:** Whether self-serve creation shows a Connect EHR picker for Cat 3 (destination only, no field fetch), or connection stays ops-provisioned with a read-only label in the editor.

### Cat 4 — No push

EHRs: Athena (legacy), ECW FHIR, Greenway Prime Suites, Tebra

No push capability. Doctor copies the note and pastes into EHR manually. The output settings panel (sliders button) is hidden — there is no mapping to configure.

**Upfront notice:** When a doctor views or creates a template with a Cat 4 EHR, a blue info banner appears at the top of the section table: *"[EHR name] doesn't have a push integration — notes are copied manually after each visit. Section mapping isn't needed, but you can still configure content and style."* This sets expectations before they see "No push" across all section rows.

| EHR | Why no push |
|---|---|
| Athena (legacy) | Legacy API — replaced by AthenaOne |
| ECW FHIR | Push not yet implemented |
| Greenway Prime Suites | On-prem — no cloud API. ⚠️ *Unconfirmed — verify with Vignesh before freeze.* |
| Tebra | No active push integration — moved from Cat 3 |

---

## Settings hierarchy

Settings live at three levels. Higher levels provide defaults; lower levels override.

```
Practice level
  └── Template level (global per template)
        └── Section level (per section row)
```

### Practice-level settings

Configured by ops or practice admin. Doctors do not see or control these.

| Setting | EHR | What it controls |
|---|---|---|
| EHR template selection | AMD | Which AMD note template is connected to this practice. Determines the field list for all doctors in the practice. |
| EHR credentials | All push EHRs | API keys, OAuth tokens, practice ID. Set at onboarding. |
| Veradigm field list | Veradigm | Field names configured by tech (Vignesh) at onboarding — not app-hardcoded. |
| Push-as-note vs. push-as-document | Veradigm | Template-level (set at onboarding by ops), not user-level. Doctor does not control this. |
| CharmHealth push mode (SOAP vs. standard) | CharmHealth | Determined by whether the template name has a `soap` prefix. Ops controls this. |

### Template-level settings (global per template)

Apply to the whole template — not per section. Doctor can set these.

| Setting | EHR | What it controls |
|---|---|---|
| Default line separator | Veradigm | Separator used for all line breaks in pushed content. |
| Section separator | Veradigm | Separator inserted between top-level sections on push. |
| Subsection separator | Veradigm | Separator inserted between child subsections on push. |
| Character limit (if EHR applies globally) | All applicable | ⚠️ TBD — currently shown per section. May need to become a template-level default if the EHR enforces a single limit across all fields. |

### Section-level settings

Per-section, configured in the output settings panel (sliders button). See "Adjust section output settings" above for the full list.

---

## Push errors

Today all push failures go to ops email only. Doctors are not notified in-app. Below is the full picture of what can fail, who caused it, and what the resolution is.

**In-app error surface (decided):** Errors appear at two levels simultaneously:
1. A summary banner at the top of My Templates listing which sections failed, with a Remap shortcut
2. Inline on the broken section row — a red strip with the error message + Remap + Contact support buttons

The section-level inline strip is the primary action surface — the banner is a summary for awareness. "Contact support" is shown when the error is not doctor-recoverable (mapping broken by EHR template change, etc.). To enumerate what real error messages should say, pull 3 months of note-push failure logs before implementation.

### Cat 1 — AthenaOne, ECW, Veradigm, Centricity

**AthenaOne**

| Scenario | Triggered by | Detectable? | Doctor sees | Resolution |
|---|---|---|---|---|
| Encounter check-in not complete | Doctor | ✅ Yes | "This note couldn't be pushed because the patient's check-in isn't complete in Athena. Finish check-in, then push again." | Self-serve — retry after check-in |
| Per-section push failure | Ops mapping / EHR | ✅ Yes | "One or more sections failed to push. Support has been notified." + Remap button | Ops reviews field mapping; doctor can remap |
| Quota exceeded / token refresh | EHR rate limit / auth | ✅ Yes | "Push is temporarily unavailable — we'll retry automatically. If this keeps happening, contact support." | Auto-retry; ops if persistent. ⚠️ Confirm Athena rate-limit scope before finalizing copy. |
| Transient API 500 | Athena infra | ✅ Yes | "Something went wrong on Athena's end — we'll retry automatically." | Auto-retry; ops if persistent. Observed as burst (48 errors on 2026-07-27 — likely outage) |
| Auth token empty | Auth / creds | ✅ Yes | "Push failed due to an authentication issue. Contact support." | Ops refreshes credentials |

**ECW**

| Scenario | Triggered by | Detectable? | Doctor sees | Resolution |
|---|---|---|---|---|
| Note text push failure | Any | ❌ Undetectable | Nothing — Lambda gets a 200 regardless; ECW processes silently | Ops investigates manually |
| Order section push failure (lab, rx, referral, imaging, procedure, vaccine) | Ops config | ⚠️ Partial — surfaces as WARNING in Lambda logs, not visible to doctor | Nothing | Ops fixes order type config |

**Veradigm**

| Scenario | Triggered by | Detectable? | Doctor sees | Resolution |
|---|---|---|---|---|
| Field push failed | Ops mapping / EHR | ✅ Yes | "One or more sections failed to push to Veradigm. Support has been notified." | Ops remap |
| Chart not open / patient not selected | Doctor | ✅ Yes | "Veradigm requires the patient's chart to be open before pushing. Open the chart and try again." | Self-serve — open chart, retry |
| Silent field mismatch | Ops mapping | ❌ Undetectable | Nothing — Veradigm accepts mismatched content without error | Ops investigates if doctor reports wrong data in chart |
| Duplicate encounter | EHR state | ✅ Yes | "A note for this encounter already exists in Veradigm. Contact support." | Ops |
| Note locked | EHR state | ✅ Yes | "This encounter is locked in Veradigm and can't be edited." | Ops or doctor unlocks |

**Centricity**

| Scenario | Triggered by | Detectable? | Doctor sees | Resolution |
|---|---|---|---|---|
| Wrong `ehr_field_name` in YAML | Ops mapping | ❌ Silent wrong field | Nothing | Doctor remaps from fixed list, or ops updates field name |
| Push failure | Infra | ✅ Yes | — | Ops |

### Cat 2 — AMD, DrChrono, CharmHealth

**AMD**

| Scenario | Triggered by | Detectable? | Doctor sees | Resolution |
|---|---|---|---|---|
| EHR template changed / archived / replaced (field IDs invalidated) | EHR admin | ✅ Yes — Lambda auto-recovers; ops email if recovery fails | "Your AMD template was updated and some field mappings are no longer valid. Support has been notified." | Ops remaps against updated template |
| EHR template deleted | EHR admin | ✅ Yes | "Your AMD template was removed. Support has been notified to reconnect your template." | Ops picks new template, remaps all sections |
| Previous-note fetch failure | AMD / infra | ✅ Yes | "Couldn't retrieve your previous note from AMD. Push was stopped — contact support." | Ops |
| Invalid field value | Content / mapping | ✅ Yes | "'[Section name]' contains a value AMD doesn't accept for this field. Contact support." | Ops reviews field constraints |
| Section text too long | Doctor (note content) | ✅ Yes | "'[Section name]' is too long for this field (max N chars). Shorten your note and push again." | Self-serve — edit note, retry |
| Note locked | Doctor / EHR state | ✅ Yes | "This note is locked in AMD and can't be edited. Contact support if this is unexpected." | Ops or doctor unlocks in AMD |
| Provider not found | EHR config / ops | ✅ Yes | "Your provider account wasn't found in AMD. Contact support." | Ops |
| Permission level insufficient | EHR admin | ✅ Yes | "Marvix doesn't have permission to write to AMD. Ask your practice admin to check account permissions." | Practice admin fixes MA account permissions in AMD |

**DrChrono**

| Scenario | Triggered by | Detectable? | Doctor sees | Resolution |
|---|---|---|---|---|
| EHR template changed | EHR admin | ❌ Undetectable | Nothing | Ops investigates; Lambda change required to surface failures |
| Any field-level failure | Any | ❌ Undetectable | Nothing — `save_note` swallows all exceptions | Ops investigates |
| Auth / credentials expired | Any | ✅ Yes | — | Ops |

**CharmHealth**

| Scenario | Triggered by | Detectable? | Doctor sees | Resolution |
|---|---|---|---|---|
| Template name changed to/from `soap` prefix | EHR admin / ops | ✅ Yes — push mode switches | — | Ops updates template name, verifies push mode |
| Encounter already signed | Doctor | ✅ Yes | "This encounter is already signed in CharmHealth. Push is not possible." | No fix — encounter locked |
| Account locked | EHR | ✅ Yes | — | Ops unlocks |
| SOAP mode failures | Any | ❌ Undetectable | Nothing — no per-field errors returned | Ops investigates |

### Cat 3 — Cerner, Nereg, ModMed

No field-level remap. Template/document connection failures and push infra errors are ops-facing today. See [`ehr_mapping/CATEGORY_3.md`](ehr_mapping/CATEGORY_3.md).

**Cerner**

| Scenario | Triggered by | Detectable? | Doctor sees | Resolution |
|---|---|---|---|---|
| Token refresh failure / push rejection | Infra / auth | ✅ Yes | — | Ops |
| Wrong / missing template connection (`ehr_template_name` for PDF name) | Ops config | ⚠️ Partial — wrong name is cosmetic; missing destination may fail push | — | Ops reconnects template |

**Nereg**

| Scenario | Triggered by | Detectable? | Doctor sees | Resolution |
|---|---|---|---|---|
| Wrong `key_name` (auto-map miss) | Ops / doctor rename | ❌ Silent skip | Nothing | Ops updates `key_name`; future: rename warning in editor |
| Missing EHR template connection | Ops config | ⚠️ Needs confirm | — | Ops |
| Auth failure | Infra | ✅ Yes | — | Ops |

**ModMed**

| Scenario | Triggered by | Detectable? | Doctor sees | Resolution |
|---|---|---|---|---|
| Push errors (Binary / S3 / DocumentReference) | Infra | ✅ Yes (assumed) | — | Ops |
| Encounter lookup from appointment fails | Runtime | ⚠️ Silent — push continues without encounter link | Nothing | Ops if note missing from chart |
| Missing EHR template / document connection | Ops config | ⚠️ Needs confirm | — | Ops |

### Summary — doctor self-serve vs. ops

| Scenario | EHR | Doctor can self-serve? |
|---|---|---|
| Encounter check-in not complete | AthenaOne | ✅ Yes — complete check-in, retry |
| Section text too long | AMD | ✅ Yes — shorten note, retry |
| Encounter already signed | CharmHealth | ✅ Awareness only — no fix possible |
| Everything else | All | ❌ No — ops handles |

### Undetectable gaps — no in-app experience possible without Lambda changes

| EHR | What's undetectable |
|---|---|
| ECW | All note text failures — Lambda gets a 200 regardless |
| DrChrono | All field-level failures — `save_note` swallows all exceptions |
| CharmHealth | SOAP mode failures — no per-field errors returned |
| Centricity (AthenaFlow) | ⚠️ Silently accepts mismatched field names — push appears to succeed even when content goes to the wrong field. Unresolved gap. |

---

## Open questions

| Question | Context | Owner |
|---|---|---|
| Do doctor customizations apply per-doctor or per-practice? | If two doctors share a template, do they share settings or have independent ones? | Vignesh |
| Write mode restrictions per EHR | Athena is append-only; most others may be append-only too. Needs Vignesh to confirm which EHRs support each mode. Currently only AMD exposes push mode in the prototype. | Vignesh |
| Derivatives | Definition and scope unclear. Needs a session with Vignesh + Nandini before this can be added to the PRD. Known gap. | Vignesh + Nandini |
| ECW selective copy — user-level vs. practice-level | Which fields in ECW are owned at the user level vs. practice level? Affects whether remap UI is per-doctor or per-practice. | Vignesh |
| First-line heading omit — is it configurable? | Whether the section heading is stripped before push. Currently unconfirmed. | Vignesh |
| AMD checkbox — prompt authoring for allowed values | Checkbox fields have predefined allowed values (from the AMD template fetch). The section prompt must be written to output one of those values. Who authors this prompt (ops vs. doctor) and whether allowed values are surfaced in the prompt editor is unresolved. | TBD |
| One section → two EHR fields — ordering conflict | For non-checkbox dual-field cases: if one Marvix section maps to two EHR text fields, does order matter? How is conflict handled at push time? | Vignesh |
| One section → two EHR fields — is it actually used beyond AMD checkbox? | Confirm with ops whether non-checkbox dual-field mapping is in use before designing a general solution. | Ops |
| CharmHealth push activation status | Is CharmHealth push currently live? Automation blocked until templates API available — confirm timeline with KJ. | KJ |
| DrChrono push activation status | Is DrChrono push currently active for any practices? | Vignesh |
| Athena rate-limit scope | Is the quota per-practice, per-doctor, or per-API-key? Affects how the error copy is worded. | Vignesh |
| Cat 3 — what object is connected today? | For Cerner / ModMed / Nereg: exact ops fields (`ehr_template_id`, name, document type, other). Needed before Connect EHR UX. | Tech / Vignesh |
| Cat 3 — self-serve Connect EHR? | Destination-only picker in creation flow vs ops-provisioned + read-only label. No field fetch either way. | Product |
| ModMed `ehr_template_name` parity with Cerner | Does ModMed use template name as PDF/document identity like Cerner’s `file_name`? | Tech |
| Nereg template id vs key_name only | Is an EHR note template required at connection time, or only matching `key_name`s? | Tech |

---

## Out of scope — v1

| Area | Notes |
|---|---|
| Doctor picks their EHR template | Ops sets this during onboarding for most EHRs. Doctor-facing template picker is future scope for Cat 2. **Cat 3 exception to revisit:** destination template/document connection is required even without field mapping — self-serve Connect EHR TBD ([`ehr_mapping/CATEGORY_3.md`](ehr_mapping/CATEGORY_3.md)). |
| Derivatives | Customization of derivative templates is a known gap. Needs a scoping session with Vignesh + Nandini before it can be planned. |

## Preview output (dry run)

Available in the editor header for every template — both ops-managed and self-serve. Doctor clicks "Preview output" to see what a note would look like based on their current enabled sections, without submitting a real recording.

**How it works:**
- A hardcoded sample transcript (cardiology doctor-patient dialogue) is used as the input
- Each enabled section is rendered with pre-written sample content
- Sections with no sample content fall back to the section's default negative text
- The sample transcript is collapsible — shown/hidden via a toggle in the modal
- Disabled sections are excluded from the preview

**What it is not:** This is not an LLM call. It does not use the doctor's actual prompt or EHR mapping. It is a UI-only dry run to help doctors understand which sections will appear and what they'll roughly look like.

---

## Self-serve template creation

This is separate from template management (the core v1 feature). Doctors who want a template beyond what ops provides can create one themselves. The creation flow is a 3-step modal.

**Template selector — search bar required.** Practices can have 50+ templates. The template selector (left nav) must include a search/filter bar so doctors can find templates without scrolling. This applies to both the main template list and any template-picker dropdown (e.g. "copy from existing" in the creation flow).

### Creation flow — all EHRs

| Step | What happens |
|---|---|
| 1 — Describe | Doctor enters template name, description, and document type (Clinical Note / Letter / Other). Optionally copies sections from an existing template. |
| 2 — Connect EHR | **Cat 2** (AMD, DrChrono, CharmHealth): doctor picks EHR note template and fields are fetched. **Cat 3** (Cerner, ModMed, Nereg): no field fetch / mapping, but an EHR template or document destination connection is still required — exact self-serve UX TBD (see [`ehr_mapping/CATEGORY_3.md`](ehr_mapping/CATEGORY_3.md)). Cat 1 and Cat 4 skip this step (Cat 1 uses a fixed field list; Cat 4 has no push). |
| 3 — Review | Summary of name, type, EHR system, and whether sections were copied. Doctor confirms to create. |

**Copy from existing template (step 1, optional):** Doctor selects any of their existing templates from a dropdown. The new template inherits a deep copy of the source section tree — including order, enabled/disabled state, and EHR mappings. If no template is selected, the new template starts from Marvix defaults (Cat 1/3/4) or an empty section list (Cat 2).

> **EHR field fetching happens at creation, not in the editor.** Once created, the template editor does not expose a "Fetch fields" action. If Cat 2 fields become stale after the EHR template changes, the remap flow inside the editor is the recovery path (see Cat 2 remap behavior above).

---

### Self-serve flow by EHR category

#### Cat 1 — AthenaOne, eCW, Veradigm, Centricity

**What the doctor does:**
1. Click "+ Create template"
2. Enter name, description, document type. Optionally copy sections from an existing template.
3. Step 2 (Connect EHR) is skipped — a brief info notice confirms the EHR and explains that field mapping uses a fixed list set by the EHR. Doctor clicks through to Review.
4. Template is created with the default Marvix section set (or copied sections).
5. In the editor, each section row shows the fixed field list in the mapping picker. Doctor maps each section to the appropriate field.

**What's different from ops-managed templates:**
- Doctor can remap any section freely from the hardcoded list
- Doctor can edit per-section prompts
- Doctor can add or delete sections (up to the EHR's field count cap)
- Doctor can request new sections from ops

---

#### Cat 2 — AMD, DrChrono, CharmHealth

**What the doctor does:**
1. Click "+ Create template"
2. Enter name, description, document type. Optionally copy sections.
3. Step 2 (Connect EHR): Doctor sees a list of their EHR note templates fetched from the EHR system. Doctor picks one. This fetch is live — it pulls actual templates from their EHR account. If the fetch fails, they can retry or skip and map manually later.
4. Template is created. Sections start empty (no default set) because section relevance depends on the chosen EHR template.
5. In the editor, each section row's mapping picker shows the fields fetched from the chosen EHR template. Doctor maps each section.

**What's different from ops-managed templates:**
- Doctor can remap any section from the fetched field list
- Doctor can edit per-section prompts
- Doctor can add or delete sections
- Doctor can request new sections from ops

**CharmHealth exception:** Field list cannot be re-fetched after creation. Doctor can remap to any field in the existing list. If the EHR template changed and the field list itself is stale, doctor uses "Contact support" — ops handles the refresh.

**AMD-specific:** Push mode (Prepend / Append / Replace) and character limit are shown in the output settings per section. AMD is the only EHR where these are configurable by the doctor.

---

#### Cat 3 — Cerner, ModMed, Nereg

**What the doctor does:**
1. Click "+ Create template"
2. Enter name, description, document type. Optionally copy sections.
3. Step 2 (Connect EHR): **Not a field-mapping step.** Destination template / document connection in the EHR is still required. Whether the doctor picks it here or ops provisions it is **TBD** (see [`ehr_mapping/CATEGORY_3.md`](ehr_mapping/CATEGORY_3.md)). Until UX is decided, treat connection as required and do not imply “skip Connect EHR = no EHR attachment.”
4. Template is created with the default Marvix section set (or copied sections).
5. In the editor, mapping column shows the auto-push label for every section ("Auto-mapped from section names" or "Whole note pushed as PDF" depending on the EHR). No per-section field picker.

**What's different from ops-managed templates:**
- Doctor can edit per-section prompts
- Doctor can add or delete sections
- Output settings panel (sliders) is hidden — nothing to configure for auto-push

**Subtle differences (do not collapse these three in UX copy):**
- **Cerner / ModMed** — whole note as one PDF; Cerner uses `ehr_template_name` as the PDF filename; ModMed’s encounter lookup can silently drop encounter context
- **Nereg** — structured auto-routing by `key_name`, not a PDF

**Key constraint (Nereg):** Section `key_name`s must match Nereg fields. If the doctor renames a section, it may break the push mapping. Surface a warning on rename in Cat 3 Nereg templates. *(Not yet implemented in prototype.)*

---

#### Cat 4 — Athena (legacy), ECW FHIR, Greenway, Tebra

**What the doctor does:**
1. Click "+ Create template"
2. Enter name, description, document type. Optionally copy sections.
3. Step 2 (Connect EHR) is skipped — a blue info banner explains that this EHR has no push integration and notes will be copied manually. Doctor clicks through to Review.
4. Template is created with the default Marvix section set (or copied sections).
5. In the editor, a persistent blue info banner at the top of the section table reminds the doctor that no push exists. Mapping column shows "No push" on every section row. No mapping action needed.

**What's different from ops-managed templates:**
- Doctor can edit per-section prompts
- Doctor can add or delete sections
- Output settings panel (sliders) is hidden — no push to configure
- Remap button is never shown on push error strips (no push = no remap)

**Value for Cat 4 doctors:** Even without push, the template still controls which sections are generated and in what order — the note is copied manually but its shape is fully controlled here.

---

### Phase 2 — AI-assisted creation (later)

- Doctor describes what they want ("a cardiology follow-up note with HPI, ROS, A&P")
- AI drafts a template structure with suggested sections and EHR mappings
- Doctor reviews and edits before saving
- Timeline and spec TBD
