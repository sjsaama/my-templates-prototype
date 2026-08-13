# My Templates — PRD

---

## Problem

Doctors have no visibility or control over how their clinical notes are structured and pushed to their EHR. Everything — section setup, EHR field mapping, formatting — is configured by ops during onboarding. When something breaks, doctors don't know. When they want something changed, they raise a support ticket.

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

Doctors on Marvix who push notes to an EHR. The experience varies by EHR — see EHR behavior section.

---

## What doctors can do

| What they see | Detail |
|---|---|
| All sections in their template | Hierarchical — parent sections with child subsections |
| EHR field each section maps to | Varies by EHR — see EHR behavior section |
| Macros / summarizers attached | Icon buttons (M / S) on each row. Dot indicator when at least one item is connected. Clicking opens a popover listing connected items. |

Doctors can view, remap, configure, restore, and request sections themselves — ops no longer has to touch any of it by hand. Every action is a step-by-step flow in **UI Flows** below; this section is just the capability list.

- View their template and how each section maps to their EHR
- Remap a section if a push fails
- Configure template-, mapping-, and section-level settings
- Restore a template to any previously saved version
- Request a new section that doesn't exist yet

Ops remains in control of the base template structure for ops-managed templates. Doctors customize within — and beyond — that structure, on both self-serve and ops-managed templates alike.

---

## UI Flows

Every way a doctor (or ops, on the same screens) interacts with a template — step by step, plain language.

The left nav's template list is searchable — matches by name and by EHR system, not just name, since practices can have 50+ templates across several EHRs.

### 1. Creating a new template (self-serve)

1. Click **"+ Create template"**.
2. **Pick a starting point** — start blank, or pick a pre-built stencil (e.g. Cardiology Follow-up). Each stencil has a **Preview** button — a read-only, side-by-side view of every section's prompt and sample output, so you can check it before choosing. Picking a stencil pre-fills sections and prompts.
3. **Describe it** — name, optional purpose note (for ops, not the AI), document type (Note or Letter).
4. **Pick your EHR template** — Cat 2 only (AMD, DrChrono, CharmHealth). Everyone else skips this — their field list is fixed, not fetched from a live template.
5. **Set template-level settings** — separator, character limit, push subsections, retain headings, skip empty subsections, keep bullet points (AthenaOne). All optional, sensible defaults pre-filled — change them anytime later too.
6. **Review and create.** You land in the editor with your sections already there. Mapping and per-section settings happen after creation, not in this wizard.

### 2. Adding a new section

1. Click **"+ Add section"** (top of the list) or **"+ Add subsection"** under an existing section.
2. Fill in **Header** and **Prompt**.
3. Set **Position** — pick a parent (top level, or any existing section/subsection — picking a subsection makes the new one a grandchild) and where it lands among its siblings.
4. Optionally expand **Section-level settings** to set Additional text or Default negative now — or skip and add them later.
5. Click **Add section**. No EHR field is chosen here — that's the next flow.

### 3. Mapping a section to an EHR field

1. Click the **EHR Mapping** cell on a section row (pencil icon if already mapped).
2. Pick a field — grouped, human-readable labels, no raw API identifiers.
3. Save. The field now shows on the row.

Cat 3 (Cerner, ModMed) shows an auto-push label instead — nothing to map. Cat 4 (Tebra) shows "No push" — nothing ever gets mapped.

### 4. Configuring template-level settings

Two ways in — same fields either way, changes save immediately:
- **During creation** — the Template settings step in flow 1.
- **Anytime after** — the gear icon next to the template's name in the left nav.

Fields: Separator, Character limit, Push subsections, Retain headings, Skip empty subsections, Keep bullet points (AthenaOne only).

### 5. Configuring mapping-level settings

1. Click the **sliders icon** on a *mapped* section row (hidden for Cat 3/4 — nothing to map, so nothing to configure).
2. Under **Mapping settings — for [field name]**, set whichever of these apply to that field's EHR: Write mode (AMD, AthenaOne, DrChrono, CharmHealth, Veradigm), "Also push as a checkbox to another field" (AMD), Pull from another derivative instead of a prompt (any EHR), and AMD's own field character limit (reference only, not editable).

This group only appears once the section is mapped — there's nothing EHR-specific to set before that.

### 6. Configuring section-level settings

1. Click the same **sliders icon** on any section row — mapped or not.
2. Under **Section settings**, set Additional text (before/after content) and Default negative.

Unlike Mapping settings, this group is always there, on every EHR, mapped or not.

### Other flows

- **Remap a section** — a push failure shows an inline error strip with a "Remap" button (Cat 1/2 only; Cat 3 shows "Contact support" instead).
- **Reorder sections** — drag by the grip handle on the left of a row.
- **Set push order for a shared field** — when 2+ sections map to the same field, a "Shared · order N/M" badge appears on the mapping cell; click it to reorder whose text comes first.
- **Request a new section** — "Request from ops" submits a request (name, description, EHR field hint, subsection or not, which templates) for ops review; doctor is notified in-app when it's actioned.
- **Version history** — restore a template to any previously saved version, identified by date/time, not just the original ops-configured default.
- **Preview output** — "Preview output" in the header runs a dry run on a sample transcript. Transcript and each section's prompt are editable right there to try a different scenario; the output shown is a static sample and won't regenerate.
- **Enable / disable a section** — toggle switch on the row; disabling one that feeds a macro or summarizer warns first.

### Nuanced flows

- **Setting a section to pull from another derivative** — sliders icon → Mapping settings → toggle "Pull from another derivative instead of a prompt," then pick which one. Replaces the prompt entirely for that section: whatever the derivative generates is pushed as-is to wherever the section is mapped. Works on every template, self-serve or ops-managed — no ops permission needed.
- **Putting fixed content around a mapped field, not generated by AI** — Additional text (Section settings) adds fixed text before or after the AI-generated content on push; it doesn't replace the AI content.
- **Pushing a fixed value instead of text (AMD checkbox fields)** — Mapping settings → "Also push as a checkbox to another field." One section can drive two fields at once: its own text field, plus a checkbox field that gets a fixed value (e.g. "Yes") whenever the section has any content, and stays empty otherwise.
- **Mapping a derivative-pull section to a special-extraction field** (e.g. Nereg's `diagnosiscodes`) — the extraction still runs on whatever text the derivative produced. If that text doesn't actually look like ICD-10 codes, the extraction comes back empty or wrong — nothing warns you about this at mapping time.
- **A subsection's content, pushed with its parent vs. on its own** — the "As one / Each separately" toggle on a parent row controls whether subsections combine into the parent's field or map to their own fields individually.

---

## EHR behavior by category

Setting definitions (write mode, checkbox push, Selective Copy, special code extraction, etc.) live in **Settings hierarchy** below and aren't repeated here — this section is about field-name *format* and fetch mechanics per category, not settings.

### Cat 1 — Fixed field list

EHRs: AthenaOne, ECW, Veradigm, Nereg, Centricity (AthenaFlow)

- Field names are hardcoded — no API call, no per-practice template fetch.

| EHR | Field name format | Display to doctor |
|---|---|---|
| AthenaOne | Snake_case (`hpi`, `assessment_with_problems`) | Human-readable labels ("History of Present Illness") |
| ECW | Plain section names (`HPI`, `Assessment`) + optional `section_code` for subsection routing | Same names shown as-is |
| Veradigm | camelCase (`historySections`, `assessmentPlanHP`) | Human-readable labels ("History Sections") |
| Nereg | Lowercase keys (`hpi`, `chiefcomplaint`) | Same keys shown as-is — mechanically grouped with Veradigm, not the other Cat 2 EHRs, despite the explicit per-field mapping matching AMD/DrChrono/CharmHealth |

- ECW also has a secondary Scribe-it destination — a separate two-column picker (Primary field names vs. Scribe-it shortcut commands), optional, limited to ECW's own "Shortcut Commands" group. Setup/config: Settings hierarchy → Practice-level ("Selective Copy destination setup"), Template-level ("Selective Copy enabled"), Mapping-level ("Selective Copy shortcut command").
- Nereg's `diagnosiscodes`/`billingcodes` special extraction, and where a derivative-pull section fits into it, is covered in Settings hierarchy → Mapping-level — not repeated here.

### Cat 1 (auto-routed) — Centricity (AthenaFlow)

- Mechanically Cat 1 — ops sets a fixed `ehr_field_name` per section, same as AthenaOne/ECW/Veradigm.
- Presentation differs, not mechanism: the doctor never sees a field picker — the UI just shows "Auto-mapped from section names."
- Unlike Cat 3 (Cerner/ModMed), there genuinely is per-section field routing underneath — it's just not doctor-facing.

### Cat 2 — Flexible field list

EHRs: AMD, DrChrono, CharmHealth

- Fields come from the doctor's own EHR note template, fetched when the doctor picks their EHR template at template creation (Step 2 of the creation flow).
- No separate "Fetch fields" action exists — if fields go stale after an EHR template change, the remap flow is the recovery path.

| EHR | Field name format | Notes |
|---|---|---|
| AMD | `Page Name > Field Name` | Doctor can remap freely |
| DrChrono | Snake_case field names | ICD/CPT fields handled separately (Settings hierarchy → Mapping-level) |
| CharmHealth | `ehr_field_id` (Charm entry ID) | Field list cannot be re-fetched — doctor remaps from the existing list; if it's gone stale, "Contact support" → ops refreshes it |

- CharmHealth's Chief Complaint carve-out and SOAP-vs-default field keying: Settings hierarchy → Mapping-level.

### Cat 3 — Auto push

EHRs: Cerner, ModMed

- Note is pushed automatically — no mapping rows, no doctor action needed after onboarding, sliders button hidden.

| EHR | How it pushes | Label shown |
|---|---|---|
| Cerner | Whole note as PDF via FHIR | "Whole note pushed as PDF" |
| ModMed | Whole note as PDF | "Whole note pushed as PDF" |

---

## Settings hierarchy

```
Practice level (ops-only)
  └── Template level (global per template)
        ├── Mapping level (per EHR-field mapping row)
        └── Section level (per section, independent of any EHR mapping)
```

Four tiers, not three — mapping-specific behavior (write mode, checkbox push, push order, special code extraction) was previously mixed loosely into template/section settings and needed its own conceptual bucket, per the mapping-portal redesign decision. Practice-level stays out of the template screen entirely; if practice-level constraints need editing, that's a separate practice settings area, not this one.

**Legend:** ✅ functional · ⚠️ partial (works, with a caveat) · ◻️ no-op (accepted, does nothing) · 🚧 not implemented · — not applicable to that EHR

Columns: **Athena** = AthenaOne · **Verad** = Veradigm · **Centr** = Centricity · **DrChr** = DrChrono · **Charm** = CharmHealth

### Practice-level

Configured by ops or practice admin. Doctors do not see or control these.

| Setting | Athena | ECW | Verad | Nereg | Centr | AMD | DrChr | Charm | Cerner | ModMed | Tebra |
|---|---|---|---|---|---|---|---|---|---|---|---|
| EHR credentials | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| EHR template selection | — | — | — | — | — | ✅ | ✅ | ✅ | — | — | — |
| Fixed field list source | — | — | ✅ | ✅ | — | — | — | — | — | — | — |
| CharmHealth push mode (SOAP vs. standard) | — | — | — | — | — | — | — | ✅ | — | — | — |
| Push-as-note vs. push-as-document | — | — | 🚧 | — | — | — | — | — | — | — | — |
| Selective Copy destination setup | — | ✅ | — | — | — | — | — | — | — | — | — |

- **EHR credentials** — API keys, OAuth tokens, practice ID. Set at onboarding.
- **EHR template selection** — which note template in the EHR is connected to this practice; determines the field list every doctor's mapping picker fetches from.
- **Fixed field list source** — field names configured by tech at onboarding, not fetched from a live EHR template — mechanically closer to Cat 1 despite requiring the same explicit per-field mapping as AMD/DrChrono/CharmHealth.
- **CharmHealth push mode** — determined by whether the connected template's name has a `soap` prefix; ops controls this by which template they pick/name, not a separate toggle.
- **Push-as-note vs. push-as-document** — no document-push mode exists in the Veradigm integration today. See open question in `marvix-api/engineering_docs/ehr_mapping/Veradigm.md`.
- **Selective Copy destination setup** — which ECW shortcut commands the practice's Scribe-it destinations map to; configured by ops through the same mapping editor, keyed by a separate query param.

### Template-level

Apply once to the whole template — not per section or mapping row. Doctor can set these.

| Setting | Athena | ECW | Verad | Nereg | Centr | AMD | DrChr | Charm | Cerner | ModMed | Tebra |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Separator | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ | — | — | — |
| Push subsections | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ | — | — | — |
| Retain headings | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ | — | — | — |
| Skip empty subsections | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ | — | — | — |
| Character limit | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ | — | — | — |
| Keep bullet points | ✅ | — | — | — | — | — | — | — | — | — | — |
| Document type | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Selective Copy enabled | — | ✅ | — | — | — | — | — | — | — | — | — |
| AMD field limit (reference) | — | — | — | — | — | ✅ | — | — | — | — | — |
| Line separator | — | ✅ | 🚧 | — | — | — | — | — | — | — | — |

- **Separator** — joins text when multiple sections map to one EHR field. Today a real per-mapping-row config key; being promoted to one template-wide setting. Nereg hardcodes its separator in the push logic — no config override exists there, unlike every other Cat 1/Cat 2 EHR.
- **Push subsections** — whether subsection content is included when pushing the parent section. Also hardcoded (always on) for Nereg.
- **Retain headings** — whether section/subsection headings are kept in the pushed content. Also hardcoded (always on) for Nereg.
- **Skip empty subsections** — omit subsections with no generated content instead of pushing an empty heading. Also hardcoded for Nereg — set to off, no override.
- **Character limit** — a real, enforced `char_limit` config value: Marvix truncates the section's outgoing text to this length *before* pushing, specifically to avoid the EHR rejecting an over-length push. This is genuinely doctor/ops-settable today (per mapping row); being promoted to the same template-wide level as the settings above. Don't confuse this with AMD field limit below — this one is enforced by Marvix, that one is just informational.
- **Keep bullet points** — preserve bullet formatting on push to Assessment/Plan — stripped by default otherwise.
- **Document type** — Note vs. Letter, set explicitly at creation — kept as its own field rather than inferred, to preserve room for future document types. The only template-level setting that's truly universal, since it has nothing to do with push mechanics.
- **Selective Copy enabled** — per-template boolean (`extra_settings["selective_copy"]`) that turns on the Scribe-it copy UI for notes created from this template — independent of whether a Selective Copy mapping is actually configured yet.
- **AMD field limit** — a *different* value from Character limit above: AMD's own `max_character_length`, fetched from AMD's API and meant to be auto-populated only. Shown for reference so a doctor can see the constraint before pushing — editing it wouldn't change what AMD actually enforces. (In the real code this "meant to be auto-only" is a policy, not a hard block — a manually-entered value can silently survive if the AMD fetch/field-lookup fails, e.g. after a field rename. Worth tightening, but not something to design a doctor-facing control around.)
- **Line separator** — ECW has this as a real, doctor/ops-settable config key (HL7 formatting). Veradigm's is hardcoded (`\r\n`, `veradigm.py:807`) with no config key at all — not the same situation as ECW despite living in the same conceptual bucket as the settings above.
- **First-line heading omit** *(not in the matrix — configurability unconfirmed)* — whether the section heading is stripped before push. See open questions.

Template-level settings apply only to EHRs with field-level mapping (Cat 1 + Cat 2, including Centricity, which genuinely routes per-section under the hood) — Cerner and ModMed push the whole note as one PDF, and Tebra doesn't push at all, so none of these have anything to act on.

### Mapping-level

Set per EHR-field mapping row — the destination's own push behavior, not the section's content.

| Setting | Athena | ECW | Verad | Nereg | Centr | AMD | DrChr | Charm | Cerner | ModMed | Tebra |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Write mode (Prepend / Append / Replace) | ⚠️ | ◻️ | ✅ | ◻️ | ◻️ | ✅ | ✅ | ✅ | — | — | — |
| Checkbox / boolean push (`extract_boolean_value`) | — | — | — | — | — | ✅ | — | — | — | — | — |
| One section → two EHR fields | — | — | — | — | — | ✅ | — | — | — | — | — |
| Push order for shared fields | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — |
| Section code (subsection routing) | — | ✅ | — | — | — | — | — | — | — | — | — |
| Field identification scheme (SOAP vs. default) | — | — | — | — | — | — | — | ✅ | — | — | — |
| Special code extraction | ✅ | — | ✅ | ✅ | — | — | ✅ | — | — | — | — |
| Selective Copy shortcut command | — | ✅ | — | — | — | — | — | — | — | — | — |

- **Write mode** — functional only where the EHR genuinely fetches existing field content first. AthenaOne (⚠️) is functional, not cosmetic, but only for HPI/Physical Exam/ROS: Prepend inserts new text ahead of existing content, Replace overwrites it, Append is the default — should be shown as a real control, not read-only. Assessment/Chief Complaint are append/replace only, no real prepend. ECW, Centricity, and Nereg (◻️) accept the setting but it's a no-op — they never fetch existing content at all.
- **Checkbox / boolean push** — pushes a fixed configured value (e.g. "Yes") when the section has any generated content, empty string otherwise — content-presence-driven, not a match against the prompt's output text.
- **One section → two EHR fields** — a section can drive a plain text field and a separate checkbox field at the same time, via two independent mapping rows sharing one section. Ordering for non-checkbox dual-field pairs is still TBD — see open questions.
- **Push order for shared fields** — when 2+ sections map to the same field, sets the order their text is combined in — independent of, and can differ from, the note's own section order. Prototype: the "Shared · order N/M" control on the mapping cell, shown only when a field has 2+ sections mapped to it.
- **Section code** — routes content to a chart subsection (e.g. HPI > General) via the OBR-5 field, separately from the main section name written to OBR-4.
- **Field identification scheme** — whether this row is keyed by `ehr_field_id` (numeric) or `ehr_field_name` (fixed keyword) — determined by the practice's connected template name, not set per row directly. Exception is SOAP mode only: Chief Complaint there always routes through a separate fixed push path (`chief_complaints`) instead of the numeric `ehr_field_id` every other SOAP field uses — remap behavior for it may differ from the standard picker. In default mode there's no special case at all; `chief_complaints` is just one of the ordinary fixed keywords.
- **Special code extraction** — a field with one of these names processes the text instead of pushing it raw:
  - AthenaOne's `diagnoses` — resolves SNOMED codes via a separate diagnoses API
  - Veradigm's `ICD` field — sent through a separate diagnosis API, not the normal `SaveXNote` path
  - Nereg's `diagnosiscodes` / `billingcodes` — regex-extracts ICD codes, or grabs a CPT code heuristically
  - DrChrono's `icd10_codes` / `cpt_codes` — routed to dedicated code-push handlers
  - Map the wrong section to one of these and it silently extracts garbage or nothing — no error shown.
- **Selective Copy shortcut command** — the exact `ehr_field_name` string (including the colon) this section's Scribe-it destination matches — a completely separate mapping row from the main HL7 push, with no server-side formatting applied.

### Section-level

The section's own content — independent of which EHR field, if any, it maps to. Universal by definition: these exist whether or not the section is mapped to anything, so every EHR (including Tebra, which never pushes at all) gets a full row.

| Setting | Athena | ECW | Verad | Nereg | Centr | AMD | DrChr | Charm | Cerner | ModMed | Tebra |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Section name & prompt | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Enable / disable | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Additional text (before / after) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Default negative | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Pull from another derivative | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

- **Section name & prompt** — the section's own header and the instruction the AI follows to generate its content.
- **Enable / disable** — whether this section is included in the note and push at all.
- **Additional text** — fixed text placed around the section's generated content on push.
- **Default negative** — text pushed when the section has no generated content.
- **Pull from another derivative** — a direct pass-through, not a merge: the section is set to pull whatever content is already generated in another derivative (e.g. an ICD or E/M coding template) and push that content straight to whichever field this section is mapped to. No separate prompt, no combining logic — just catch the other derivative's output and push it.

---

## Push errors

Today all push failures go to ops email only. Doctors are not notified in-app.

**In-app error surface:** Errors appear at two levels:
1. Summary banner at the top of My Templates listing which sections failed, with a Remap shortcut
2. Inline on the broken section row — a strip with the error message + Remap + Contact support buttons

"Contact support" is shown when the error is not doctor-recoverable. Pull 3 months of note-push failure logs before implementation to verify copy strings.

### Cat 1 — AthenaOne, ECW, Veradigm, Nereg

**AthenaOne**

| Scenario | Triggered by | Detectable? | Doctor sees | Resolution |
|---|---|---|---|---|
| Encounter check-in not complete | Doctor | ✅ | "This note couldn't be pushed because the patient's check-in isn't complete in Athena. Finish check-in, then push again." | Self-serve — retry after check-in |
| Per-section push failure | Ops mapping / EHR | ✅ | "One or more sections failed to push. Support has been notified." + Remap | Ops reviews mapping; doctor can remap |
| Quota exceeded / token refresh | EHR rate limit / auth | ✅ | "Push is temporarily unavailable — we'll retry automatically. If this keeps happening, contact support." | Auto-retry; ops if persistent |
| Transient API 500 | Athena infra | ✅ | "Something went wrong on Athena's end — we'll retry automatically." | Auto-retry; ops if persistent. Observed as burst (48 errors on 2026-07-27 — likely outage) |
| Auth token empty | Auth / creds | ✅ | "Push failed due to an authentication issue. Contact support." | Ops refreshes credentials |
| Order push — pattern match failed | Ops config | ⚠️ Partial — WARNING in Lambda logs only, note push still succeeds | Nothing | Ops fixes order type config |

**ECW**

| Scenario | Triggered by | Detectable? | Doctor sees | Resolution |
|---|---|---|---|---|
| Note text push failure | Any | ❌ Undetectable | Nothing — Lambda gets a 200 regardless | Ops investigates manually |

**Veradigm**

| Scenario | Triggered by | Detectable? | Doctor sees | Resolution |
|---|---|---|---|---|
| Field push failed | Ops mapping / EHR | ✅ | "One or more sections failed to push to Veradigm. Support has been notified." | Ops remap |
| Chart not open | Doctor | ✅ | "Veradigm requires the patient's chart to be open before pushing. Open the chart and try again." | Self-serve |
| Silent field mismatch | Ops mapping | ❌ Undetectable | Nothing | Ops investigates if doctor reports wrong data |
| Which encounter to push into (open question) | EHR state | ❓ Unresolved | — | One appointment can have two encounters in Veradigm. Marvix's encounter lookup doesn't disambiguate between them today — a push could land in the wrong encounter with no error, since a valid field save still reports success. Not a "duplicate encounter" rejection as previously assumed; see open question in `Veradigm.md`. |
| Note locked by another user | EHR state | ✅ | "Note cannot be pushed because the patient's chart is currently being edited in Veradigm by [user]. Please exit from History, Physical Exam, Vitals, ROS, and Reason for Visit sections and try again." | Self-serve — doctor (or the other user) exits the chart and retries |

**Nereg**

| Scenario | Triggered by | Detectable? | Doctor sees | Resolution |
|---|---|---|---|---|
| Field left unmapped (no `ehr_field_name` set) | Ops mapping | ❌ Silent — field pushes empty | Nothing | Ops maps the field |
| Auth failure | Infra | ✅ | — | Ops |

### Cat 2 — AMD, DrChrono, CharmHealth

**AMD**

| Scenario | Triggered by | Detectable? | Doctor sees | Resolution |
|---|---|---|---|---|
| EHR template changed / archived / replaced | EHR admin | ✅ | "Your AMD template was updated and some field mappings are no longer valid. Support has been notified." | Ops remaps |
| EHR template deleted | EHR admin | ✅ | "Your AMD template was removed. Support has been notified to reconnect your template." | Ops picks new template, remaps |
| EHR field or page renamed | EHR admin | ✅ | "Some field mappings are no longer valid. Support has been notified." | Ops remaps — auto-recovery only works for reorder/add/delete, not renames |
| Previous-note fetch failure | AMD / infra | ✅ | "Couldn't retrieve your previous note from AMD. Push was stopped — contact support." | Ops |
| Invalid field value | Content / mapping | ✅ | "'[Section name]' contains a value AMD doesn't accept for this field. Contact support." | Ops reviews field constraints |
| Section text too long | Doctor | ✅ | "'[Section name]' is too long for this field (max N chars). Shorten your note and push again." | Self-serve |
| Note locked | Doctor / EHR state | ✅ | "This note is locked in AMD and can't be edited. Contact support if this is unexpected." | Ops or doctor unlocks |
| Provider not found | EHR config / ops | ✅ | "Your provider account wasn't found in AMD. Contact support." | Ops |
| Permission level insufficient | EHR admin | ✅ | "Marvix doesn't have permission to write to AMD. Ask your practice admin to check account permissions." | Practice admin |

**DrChrono**

| Scenario | Triggered by | Detectable? | Doctor sees | Resolution |
|---|---|---|---|---|
| EHR template changed | EHR admin | ❌ Undetectable | Nothing | Ops; Lambda change required to surface failures |
| Any field-level failure | Any | ❌ Undetectable | Nothing — `save_note` swallows all exceptions | Ops |
| Auth / credentials expired | Any | ✅ | — | Ops |

**CharmHealth**

| Scenario | Triggered by | Detectable? | Doctor sees | Resolution |
|---|---|---|---|---|
| Template name changed to/from `soap` prefix | EHR admin / ops | ✅ | — | Ops updates template name |
| Encounter already signed | Doctor | ✅ | "This encounter is already signed in CharmHealth. Push is not possible." | No fix — encounter locked |
| Account locked | EHR | ✅ | — | Ops unlocks |
| SOAP mode failures | Any | ❌ Undetectable | Nothing | Ops investigates |

### Cat 3 — Cerner, ModMed

| Scenario | Triggered by | Detectable? | Doctor sees | Resolution |
|---|---|---|---|---|
| Cerner — token refresh failure / push rejection | Infra / auth | ✅ | — | Ops |
| ModMed — push errors | Infra | ✅ (assumed) | — | Ops |

### Summary — doctor self-serve vs. ops

| Scenario | EHR | Doctor can self-serve? |
|---|---|---|
| Encounter check-in not complete | AthenaOne | ✅ Complete check-in, retry |
| Section text too long | AMD | ✅ Shorten note, retry |
| Chart not open | Veradigm | ✅ Open chart, retry |
| Note locked by another user | Veradigm | ✅ Exit chart, retry |
| Encounter already signed | CharmHealth | ✅ Awareness only — no fix possible |
| Everything else | All | ❌ Ops handles |

### Undetectable gaps

| EHR | What's undetectable |
|---|---|
| ECW | All note text failures — Lambda gets a 200 regardless |
| DrChrono | All field-level failures — `save_note` swallows all exceptions |
| CharmHealth | SOAP mode failures — no per-field errors returned |
| Nereg | An unmapped field (no `ehr_field_name` set) pushes empty with no error — push appears to succeed |
| Centricity (AthenaFlow) | Silently accepts mismatched field names — push appears to succeed even when content goes to the wrong field |

---

## Open questions

| Question | Context | Owner |
|---|---|---|
| Doctor customizations — per-doctor or per-practice? | If two doctors share a template, do they share settings or have independent ones? | Vignesh |
| Write mode restrictions per EHR | AMD and AthenaOne both implement functional prepend/append/replace (Athena is NOT append-only — confirmed in code). Confirm behavior for Veradigm, ECW, CharmHealth, DrChrono, Nereg before exposing write mode broadly; only AMD exposes it in the prototype. | Vignesh |
| Derivatives | Definition and scope unclear. Needs a session before adding to PRD. | Vignesh + Nandini |
| ECW field ownership — user vs. practice level | Affects whether remap UI is per-doctor or per-practice. | Vignesh |
| First-line heading omit — configurable? | Whether the section heading is stripped before push. Unconfirmed. | Vignesh |
| AMD checkbox — who sets `extract_boolean_value` | The checked-value string (e.g. "Yes") is a config field on the mapping, not something the prompt has to produce — confirm whether ops or doctor sets this value, and whether it needs to be exposed in the section output settings UI or stays ops-only. | TBD |
| One section → two EHR fields — ordering conflict | For non-checkbox dual-field cases: does order matter at push time? | Vignesh |
| One section → two EHR fields — in use beyond AMD checkbox? | Confirm with ops before designing a general solution. | Ops |
| CharmHealth push activation status | Is push currently live? Timeline for templates API? | KJ |
| DrChrono push activation status | Is push currently active for any practices? | Vignesh |
| Athena rate-limit scope | Per-practice, per-doctor, or per-API-key? Affects error copy wording. | Vignesh |

---

## Future: AI-assisted creation (Phase 2)

Doctor describes what they want → AI drafts sections and mappings → doctor reviews and saves. Later phase — flow 1 in UI Flows above is what's built now.
