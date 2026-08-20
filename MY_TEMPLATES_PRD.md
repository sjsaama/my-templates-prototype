# My Templates — PRD

---

## Problem

Doctors have no visibility or control over how their notes are structured and pushed to their EHR. Ops configures everything at onboarding; when something breaks or needs a change, it's a support ticket.

| Problem | Impact |
|---|---|
| Doctors can't see how their template maps to EHR fields | No trust in the push; they check the EHR manually after every note |
| Doctors can't adjust section output settings themselves | Support tickets for minor changes like default text or spacing |
| Push failures are invisible — only ops gets notified | Doctors don't know a section failed until a patient record is missing data |

---

## Solution

A self-serve template management surface inside the Marvix app. Doctors can:
- View templates and how each section maps to their EHR
- Remap sections if a push fails
- Adjust per-section output settings (formatting, default text, static content)
- Request new sections

Ops controls the base structure on managed templates; doctors customize within — and beyond — that structure on self-serve and managed templates alike.

---

## Who is this for

Doctors on Marvix who push notes to an EHR. Experience varies by EHR — see **EHR behavior by category**.

---

## What doctors can do

| What they see | Detail |
|---|---|
| All sections in their template | Hierarchical — parent sections with child subsections |
| EHR field each section maps to | Varies by EHR |
| Macros / summarizers attached | M / S icon buttons per row, each carrying a small count badge (e.g. "M 2") for how many are connected — no badge, no connections. Same on self-serve and managed templates. Popover lists connections, view-only — macro names link to the Macros page; summarizers show mode (Replace/Append/etc.) inline, no dedicated page yet. Adding a macro or requesting a summarizer isn't part of this popover — handled elsewhere |

- View template + EHR mapping
- Remap a section on push failure
- Configure template-, mapping-, and section-level settings
- Restore any previously saved version
- Request a new section that doesn't exist yet

---

## UI Flows

Left nav's template list is searchable by name and EHR system.

### 1. Creating a new template (self-serve)

1. **"+ Create template"**
2. **Pick a starting point** — blank or a stencil (e.g. Cardiology Follow-up). Stencils have a **Preview** — just the assembled sample note, read-only, nothing else — and pre-fill sections/prompts.
3. **Describe it** — name, purpose note (ops-only), document type (Note/Letter).
4. **Pick EHR template** — Cat 2 only (AMD, DrChrono, CharmHealth). Others skip — fixed field list.
5. **Template-level settings** — separator, character limit, push subsections, retain headings, skip empty subsections, keep bullet points (AthenaOne). Optional, defaults pre-filled, editable later.
6. **Create template** → lands in editor with sections in place, no separate review step. Mapping/section settings happen after, not in this wizard.

### 2. Adding a new section

1. **"+ Add section"** — one button in the template header, not repeated per row.
2. **Header**
3. **Section type** — fixed at creation, mutually exclusive:
   - **Open-text** — normal case. **Prompt** → AI writes freeform text.
   - **Restricted list** — **Instruction / question** + **Allowed output values** (≥2, e.g. `Y`/`N`/`NA`). Output always exactly one value, never prose.
   - **Pull from another derivative** — no prompt. Direct pass-through from another derivative's output (e.g. ICD-10 Codes, E/M Coding).
   - **Fill-in-the-blank** — a mix of fixed instruction text and named blanks, e.g. *"Patient reports [duration] of [symptom]."* Each blank has its own short label and its own instruction for what the AI should put there; the AI fills in every blank from the transcript and everything outside the blanks pushes exactly as written. Requires at least one blank.
4. **Add as** — New section or Subsection. If Subsection: pick **Parent section** (picking a subsection makes it a grandchild), then **Placement** (first / after a sibling).
5. Optional: **Section-level settings** (text before/after, Default negative) — can skip and add later.
6. **Add section**. No EHR field chosen here — see flow 3.

Section type is fixed forever. Editable after creation, from the sliders icon's Mapping settings: the prompt (Open-text), instruction/values (Restricted list), which derivative (Pull-from-derivative), or the text/blanks (Fill-in-the-blank). See flow 5.

### 3. Mapping a section to an EHR field

1. Click **EHR Mapping** cell (pencil if already mapped).
2. Pick a field — grouped, human-readable, no raw API IDs.
3. Save.

Centricity, Cerner, ModMed: no **EHR Mapping** column at all — the whole note auto-pushes, so there's nothing for a doctor to pick, not even a read-only label. Cat 4 (Tebra) still shows the column with a "No push" label.

### 4. Configuring template-level settings

Same fields either way, saves immediately:
- **During creation** — flow 1 step 5
- **Anytime after** — **Template settings** button, template header

Fields: Separator, Character limit, Push subsections, Retain headings, Skip empty subsections, Keep bullet points (AthenaOne only).

### 5. Configuring mapping-level settings

1. Click **sliders icon** on a section row — hidden for Cat 3/4 unless the section still needs a prompt.
2. Under **Mapping settings**: content source first (Prompt / Instruction+values / derivative pick), then EHR-specific fields — Write mode (AMD, AthenaOne, DrChrono, CharmHealth, Veradigm) and, for Restricted-list only, EHR value mapping (e.g. `Y → 1`). AMD field character limit shown for reference only.

Content-source fields always show (a section needs a prompt before it has anywhere to push). Everything else needs the section mapped first.

### 6. Configuring section-level settings

1. Same **sliders icon**, any row — mapped or not.
2. **Content settings** — text before content, text after content (independent), Default negative.
3. Optional: **Override template settings for this section** — override any of the six template settings just for this section. Text/number fields show "Template default: X" until you type a value; boolean fields are an On/Off toggle that starts on the template default and commits to an explicit override the moment you click either side. Whatever's set wins.

Always available, unlike Mapping settings.

### 7. Viewing version history and restoring a version

1. **Version history** button, template header.
2. A version is recorded on **Save changes**, not per keystroke — everything since the last save (sections, mapping, template settings) lands in one version.
3. List shows newest first, with a **what changed** summary (e.g. *Added "Follow-up Plan", Edited "Assessment", Changed Separator*). Newest = **Most recent save**; first entry = **Original** (no separate "revert to default" — same restore flow).
4. **Restore** any version — confirm step lists what changes; unsaved edits are discarded. Restoring never deletes other versions.
5. Restore sets the new draft — nothing auto-pushes to the EHR.

**What counts as a change** (diff vs. previous version):
- **Section-level edits** — rename, enable/disable, remap/unmap, write mode, mapping mode, content source (prompt/instruction/values/derivative/fill-in-the-blank), additional text, default negative, macro/summarizer connections. Any of these collapses to one line naming the section — `Edited "Section Name"` — not one line per field, and not repeated if several of these change on the same section in the same save.
- **Section structure** — added/removed sections, reordering. Each keeps its own line: `Added "X"`, `Removed "X"`, `Reordered sections`.
- **Template identity & settings** — template name, EHR template selection (Cat 2), document type, and the six template-level settings each get their own descriptive line (e.g. `Changed Separator`) since they aren't tied to one section.

Not tracked: who made the change (no author identity needed yet — single-doctor scope).

**Example.** Four unrelated edits (disable a section, remap a different field, connect a macro to a third section, flip a template setting), one **Save changes** → one version with all four listed:

> **Aug 18, 2026, 6:42 PM · Most recent save**
> - Edited "Chief Complaint"
> - Edited "Assessment & Plan"
> - Edited "History of Present Illness"
> - Changed Skip empty subsections

Restoring undoes all four at once — no partial restore. Version boundary = the save action.

### Other flows

- **Remap a section** — push failure shows an inline error strip with "Remap" (Cat 1/2) or "Contact support" (Cat 3).
- **Reorder sections** — drag by the grip handle.
- **Push order for a shared field** — "Shared · order N/M" badge when 2+ sections map to one field; click to reorder.
- **Request a new section** — **Managed templates only**, via the **Request new section** button in the template header (not the left nav's unrelated "Request from ops" stub). Self-serve doctors just add sections themselves. Request: name, description, EHR field hint, subsection Y/N, which templates (searchable multi-select, chips). Doctor notified in-app when actioned.
- **Edit template (live prompt testing)** — **Self-serve only.** A "Prompt" tab lists every enabled section with its prompt editable inline — no separate guide panel; the tabs and the **Generate** button are the whole interface. **Generate** runs the current prompts + settings against a fixed sample transcript and opens the result as a new "Note N" tab (Note 1, Note 2, …) — one continuous assembled document, not split into section-view vs. full-note modes. Each note tab can be closed (✕), or its prompts restored back into the Prompt tab via **"Use this note's prompts"**, so a doctor can generate a few variations and settle on whichever one reads best. See Nuanced flows for why it's excluded from managed templates.
- **Enable / disable a section** — row toggle, instant, no confirm.
- **Delete a section** — inside **Section settings** (sliders icon → bottom of the panel), **self-serve templates only** (same gate as "+ Add section"). Confirm dialog; deleting a parent deletes all its subsections too. Not available on managed templates — structure stays ops-controlled there.
- **Jump to a macro** — sidebar Macros icon → flat list of every macro in the template, grouped by name with sections using it. Clicking from a section's popover navigates + highlights.

### Nuanced flows

- **Derivative pull is a section type, not a mapping toggle** — set at creation, never converted later; only which derivative it pulls from stays editable. Works on any template; managed templates restrict which section-type fields a doctor can edit (see Settings hierarchy → Mapping-level).
- **Fixed content around a mapped field** — Additional text (before/after) wraps the AI-generated content on push; independent fields, doesn't replace AI content.
- **The four section types are mutually exclusive** — one section, one type. A Restricted list can't also pull from a derivative or carry fill-in-the-blank blanks, and so on — no combined case.
- **Fill-in-the-blank vs. Restricted list** — both constrain part of the output, but differently: Restricted list constrains the *entire* section to one of a few fixed values; Fill-in-the-blank keeps the surrounding text fixed and only constrains what goes into each blank. Use Restricted list for a single Y/N/NA-style answer, Fill-in-the-blank for a templated sentence with a few variable parts.
- **Fixed value instead of text (e.g. AMD checkboxes)** — model as Restricted list (`Y`/`N`) + EHR value mapping (`Y→1`, `N→0`). Replaces the old AMD-only "one section, two mapping rows" mechanism.
- **Derivative-pull section mapped to a special-extraction field** (e.g. Nereg `diagnosiscodes`) — extraction runs on whatever text the derivative produced; if it doesn't look like ICD-10, extraction silently comes back empty/wrong.
- **Subsection push: with parent vs. standalone** — a labeled toggle pill on the parent row, to the right of its mapping field: a chain-link icon + "Combined" (all subsection content pushes as one into the parent's field) or a struck-through link icon + "Split" (each subsection maps to its own field independently). One click flips it; no separate confirm step.
- **Why Edit template is self-serve only** — the whole point is testing prompt changes against generated output; a managed-template doctor can't edit prompts, so there's nothing to test. Cut entirely rather than shown as a read-only example.
- **Macros/summarizers popover is view-only** — self-serve doctors can add macros themselves and request a summarizer from ops, but not from this row popover; that flow lives outside this surface. The popover here just shows what's connected, on both self-serve and managed templates.

---

## EHR behavior by category

Setting definitions live in **Settings hierarchy** below. This section covers field-name *format* and fetch mechanics only.

### Cat 1 — Fixed field list

AthenaOne, ECW, Veradigm, Nereg, Centricity (AthenaFlow). Field names hardcoded — no API call, no template fetch.

| EHR | Field name format | Display to doctor |
|---|---|---|
| AthenaOne | Snake_case (`hpi`) | Human-readable ("History of Present Illness") |
| ECW | Plain names (`HPI`) + optional `section_code` for subsection routing | As-is |
| Veradigm | camelCase (`historySections`) | Human-readable ("History Sections") |
| Nereg | Lowercase keys (`hpi`) | As-is — grouped with Veradigm mechanically, though its per-field mapping matches AMD/DrChrono/CharmHealth |

- ECW also has a secondary Scribe-it destination (separate picker, ECW "Shortcut Commands" only). Setup: Practice-level ("Selective Copy destination setup"), Template-level ("enabled"), Mapping-level ("shortcut command").
- Nereg's `diagnosiscodes`/`billingcodes` extraction: see Settings hierarchy → Mapping-level.

### Cat 1 (auto-routed) — Centricity (AthenaFlow)

- Mechanically Cat 1 — fixed `ehr_field_name` per section.
- No **EHR Mapping** column at all — same as Cat 3, below. There's still no field for a doctor to pick, so even the read-only "Auto-mapped from section names" label was cut rather than kept as a placeholder.
- Unlike Cat 3, real per-section routing exists underneath, just not doctor-facing — which is why output settings (additional text, bullets, etc.) stay meaningful per section even with the column gone.

### Cat 2 — Flexible field list

AMD, DrChrono, CharmHealth. Fields fetched from the doctor's own EHR template at creation (flow 1 step 4). No re-fetch action — remap flow is the recovery path if fields go stale.

| EHR | Field name format | Notes |
|---|---|---|
| AMD | `Page Name > Field Name` | Doctor remaps freely |
| DrChrono | Snake_case | ICD/CPT handled separately (Mapping-level) |
| CharmHealth | `ehr_field_id` | List can't be re-fetched — stale list → "Contact support" |

- CharmHealth's Chief Complaint carve-out + SOAP-vs-default keying: Mapping-level.

### Cat 3 — Auto push

Cerner, ModMed. No mapping rows, sliders hidden, and — same as Centricity above — no **EHR Mapping** column in the table at all.

| EHR | How it pushes | Label shown |
|---|---|---|
| Cerner | Whole note as PDF via FHIR | *(no column — nothing to show)* |
| ModMed | Whole note as PDF | *(no column — nothing to show)* |

---

## Settings hierarchy

```
Practice level (ops-only)
  └── Template level (global per template)
        ├── Mapping level (per EHR-field mapping row)
        └── Section level (per section, independent of any EHR mapping)
```

Four tiers, not three — mapping-specific behavior (write mode, EHR value mapping, push order, special extraction) gets its own bucket instead of blending into template/section settings. Practice-level is out of scope for this screen entirely.

**Legend:** ✅ functional · ⚠️ partial · ◻️ no-op · 🚧 not implemented · — n/a

Columns: Athena=AthenaOne, Verad=Veradigm, Centr=Centricity, DrChr=DrChrono, Charm=CharmHealth

### Practice-level

Ops/practice admin only — doctors don't see these.

| Setting | Athena | ECW | Verad | Nereg | Centr | AMD | DrChr | Charm | Cerner | ModMed | Tebra |
|---|---|---|---|---|---|---|---|---|---|---|---|
| EHR credentials | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| EHR template selection | — | — | — | — | — | ✅ | ✅ | ✅ | — | — | — |
| Fixed field list source | — | — | ✅ | ✅ | — | — | — | — | — | — | — |
| CharmHealth push mode | — | — | — | — | — | — | — | ✅ | — | — | — |
| Push-as-note vs. document | — | — | 🚧 | — | — | — | — | — | — | — | — |
| Selective Copy destination setup | — | ✅ | — | — | — | — | — | — | — | — | — |

- **EHR credentials** — API keys, OAuth, practice ID. Onboarding-time.
- **EHR template selection** — the note template every doctor's field list is fetched from.
- **Fixed field list source** — onboarding-configured, not live-fetched; closer to Cat 1 despite AMD-style explicit mapping.
- **CharmHealth push mode** — driven by a `soap` prefix on the template name, not a separate toggle.
- **Push-as-note vs. document** — no document-push mode exists in Veradigm today (open question, `Veradigm.md`).
- **Selective Copy destination setup** — maps practice's Scribe-it destinations to ECW shortcut commands.

### Template-level

Whole-template, not per section/row. Doctor-settable.

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
| Line separator | — | 🚧 | 🚧 | — | — | — | — | — | — | — | — |

- **Separator** — joins text when 2+ sections map to one field. Per-mapping-row today, being promoted template-wide. Nereg hardcodes it (no override).
- **Push subsections** — include subsection content when pushing the parent. Redundant with the section's own "Combined"/"Split" toggle everywhere that exists; only load-bearing for Centricity (auto-routes under the hood, no per-section choice). Hidden from self-serve UI elsewhere. Hardcoded on for Nereg.
- **Retain headings** — includes the section's own first-line heading. Doesn't affect subsection `key_name:` prefixes (always shown). Hardcoded on for Nereg.
- **Skip empty subsections** — omit empty subsections instead of an empty heading. Hardcoded off for Nereg.
- **Character limit** — Marvix truncates outgoing text before push, to avoid EHR rejection. Currently per-mapping-row, promoted template-wide. For AMD, should be capped at/reconciled with AMD field limit (below), not independent.
- **Keep bullet points** — preserve bullets on push to Assessment/Plan; stripped by default otherwise.
- **Document type** — Note vs. Letter, set at creation. Only setting truly universal (no push-mechanics tie).
- **Selective Copy enabled** — per-template flag (`extra_settings["selective_copy"]`) turning on the Scribe-it UI, independent of whether a mapping is configured.
- **AMD field limit** — AMD's real `max_character_length`, fetched from its API. Auto-populated, reference-only (editing it doesn't change AMD's enforcement). In code this is a policy not a hard block — a stale manual value can survive if the fetch fails after a field rename; worth tightening later.
- **Line separator** — no real ops-facing path for either ECW or Veradigm. Veradigm hardcodes `\r\n` (`veradigm.py:807`); `section_text_builder.py` would honor a `line_separator` key generically but it's not in `internal_endpoints.py`'s `allowed_field_configs` for either EHR.

Applies only where field-level mapping exists (Cat 1 + Cat 2, including Centricity). Cerner/ModMed push one PDF; Tebra doesn't push — nothing for these settings to act on.

### Mapping-level

Per EHR-field mapping row — destination push behavior, not section content. Exception: **Section type / content source** lives here too, even though it isn't EHR-specific — see note below.

| Setting | Athena | ECW | Verad | Nereg | Centr | AMD | DrChr | Charm | Cerner | ModMed | Tebra |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Section type / content source | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Write mode (Prepend/Append/Replace) | ⚠️ | ◻️ | ✅ | ◻️ | ◻️ | ✅ | ✅ | ✅ | — | — | — |
| EHR value mapping (Restricted-list) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — |
| Push order for shared fields | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — |
| Selective Copy shortcut command | — | ✅ | — | — | — | — | — | — | — | — | — |

- **Section type / content source** — set once at creation (UI Flows → 2), fixed after:
  - **Open-text** — Prompt, AI writes freely.
  - **Restricted list** — Instruction/question + allowed values (≥2). Values stay editable after creation.
  - **Pull from another derivative** — direct pass-through from another derivative's output. Which derivative stays editable; the type itself doesn't switch.
  - **Fill-in-the-blank** — fixed instruction text with named blanks in between (e.g. *"Patient reports [duration] of [symptom]."*); each blank carries its own instruction for what the AI should put there. The text and blanks stay editable after creation; requires at least one blank.

  Mutually exclusive — one section, one type.

  Lives in Mapping settings (sliders icon) because "pull from another derivative" is really a content-source choice for the destination field. Shows regardless of mapping status — content-source fields matter before a field is even picked.

  **On managed templates**: doctor can change EHR mapping, write mode, EHR value mapping, push order — same as self-serve. Cannot edit the instruction/question, allowed values, prompt, fill-in-the-blank text/blanks, or which derivative — those stay as ops set them.
- **Write mode** — real only where the EHR fetches existing content first. AthenaOne (⚠️) works for HPI/Physical Exam/ROS only (Assessment/Chief Complaint are append/replace-only). ECW, Centricity, Nereg (◻️) accept the setting but never fetch existing content — no-op.
- **EHR value mapping** — shown only for Restricted-list sections. One row per allowed value → destination representation (e.g. `Y→1`). Replaces the old AMD-only `extract_boolean_value` dual-row mechanism; works for any EHR.
- **Push order for shared fields** — order of combination when 2+ sections map to one field, independent of note order. UI: "Shared · order N/M" badge.
- **Selective Copy shortcut command** — exact `ehr_field_name` string (with colon) the Scribe-it destination matches — separate row from the main HL7 push, no server formatting.

### Automatic behaviors (not configurable)

Consequences of the field a section maps to — not a separate setting.

| Behavior | Athena | ECW | Verad | Nereg | Centr | AMD | DrChr | Charm | Cerner | ModMed | Tebra |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Section code (subsection routing) | — | ✅ | — | — | — | — | — | — | — | — | — |
| Field ID scheme (SOAP vs. default) | — | — | — | — | — | — | — | ✅ | — | — | — |
| Special code extraction | ✅ | — | ✅ | ✅ | — | — | ✅ | — | — | — | — |

- **Section code** — ECW's OBR-5, routes to a chart subsection separately from OBR-4's main section name. Bundled into the field's fixed definition, not chosen per mapping.
- **Field ID scheme** — `ehr_field_id` (numeric) vs. `ehr_field_name` (keyword), determined by the connected template name. Exception: CharmHealth SOAP mode's Chief Complaint always routes via fixed `chief_complaints`, not the numeric ID every other SOAP field uses.
- **Special code extraction** — these fields process text instead of pushing it raw:
  - AthenaOne `diagnoses` — SNOMED via a separate API
  - Veradigm `ICD` — separate diagnosis API, not `SaveXNote`
  - Nereg `diagnosiscodes`/`billingcodes` — regex ICD extraction / heuristic CPT
  - DrChrono `icd10_codes`/`cpt_codes` — dedicated code-push handlers
  - Wrong section mapped here → silent garbage/empty extraction, no error. Worth a UI warning.

### Section-level

Section's own content, independent of EHR mapping. Universal — every EHR gets a full row, mapped or not.

| Setting | Athena | ECW | Verad | Nereg | Centr | AMD | DrChr | Charm | Cerner | ModMed | Tebra |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Section name | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Enable / disable | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Additional text (before/after) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Default negative | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Template setting overrides | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

- **Section name** — the header.
- **Enable / disable** — whether the section's included at all.
- **Additional text** — fixed text before/and or after generated content, independent fields.
- **Default negative** — text pushed when there's no generated content.
- **Template setting overrides** — override any of the six template-wide settings just for this section. Text/number fields default to "Template default: X" until typed into; booleans are an On/Off toggle, starting on the template default, that becomes an explicit override on the first click — there's no way back to "inherit" for that field afterward. Collapsed by default so a fully-inheriting section stays uncluttered.

---

## Push errors

Today all push failures go to ops email only — nothing in-app.

**Proposed in-app surface:**
1. Summary banner on My Templates listing failed sections, with Remap shortcut
2. Inline strip on the broken row — error message + Remap + Contact support

"Contact support" = not doctor-recoverable. Pull 3 months of push-failure logs before implementation to verify copy.

### Cat 1 — AthenaOne, ECW, Veradigm, Nereg

**AthenaOne**

| Scenario | Triggered by | Detectable? | Doctor sees | Resolution |
|---|---|---|---|---|
| Check-in not complete | Doctor | ✅ | "Finish check-in in Athena, then push again." | Self-serve retry |
| Per-section push failure | Ops mapping / EHR | ✅ | "One or more sections failed to push. Support notified." + Remap | Ops reviews; doctor can remap |
| Quota exceeded / token refresh | Rate limit / auth | ✅ | "Push temporarily unavailable — retrying automatically." | Auto-retry; ops if persistent |
| Transient API 500 | Athena infra | ✅ | "Something went wrong on Athena's end — retrying." | Auto-retry; ops if persistent (burst of 48 on 2026-07-27 — likely outage) |
| Auth token empty | Auth/creds | ✅ | "Authentication issue. Contact support." | Ops refreshes creds |
| Order push pattern-match failed | Ops config | ⚠️ Logs-only, push still succeeds | Nothing | Ops fixes config |

**ECW**

| Scenario | Triggered by | Detectable? | Doctor sees | Resolution |
|---|---|---|---|---|
| Note text push failure | Any | ❌ Undetectable — Lambda gets 200 regardless | Nothing | Ops investigates manually |

**Veradigm**

| Scenario | Triggered by | Detectable? | Doctor sees | Resolution |
|---|---|---|---|---|
| Field push failed | Ops mapping / EHR | ✅ | "One or more sections failed to push. Support notified." | Ops remap |
| Chart not open | Doctor | ✅ | "Open the patient's chart and try again." | Self-serve |
| Silent field mismatch | Ops mapping | ❌ Undetectable | Nothing | Ops if doctor reports wrong data |
| Which encounter to push into | EHR state | ❓ Open | — | One appointment can have 2 encounters; lookup doesn't disambiguate — wrong-encounter push reports success. See `Veradigm.md`. |
| Note locked by another user | EHR state | ✅ | "Chart is being edited by [user]. Exit and try again." | Self-serve retry |

**Nereg**

| Scenario | Triggered by | Detectable? | Doctor sees | Resolution |
|---|---|---|---|---|
| Field unmapped (`ehr_field_name` unset) | Ops mapping | ❌ Silent — pushes empty | Nothing | Ops maps it |
| Auth failure | Infra | ✅ | — | Ops |

### Cat 2 — AMD, DrChrono, CharmHealth

**AMD**

| Scenario | Triggered by | Detectable? | Doctor sees | Resolution |
|---|---|---|---|---|
| EHR template changed/archived/replaced | EHR admin | ✅ | "Some mappings are no longer valid. Support notified." | Ops remaps |
| EHR template deleted | EHR admin | ✅ | "Template removed. Support notified to reconnect." | Ops picks new template |
| Field/page renamed | EHR admin | ✅ | "Some mappings are no longer valid." | Ops remaps — auto-recovery covers reorder/add/delete only, not renames |
| Previous-note fetch failure | AMD/infra | ✅ | "Couldn't retrieve previous note. Push stopped — contact support." | Ops |
| Invalid field value | Content/mapping | ✅ | "'[Section]' has a value AMD doesn't accept. Contact support." | Ops reviews |
| Section text too long | Doctor | ✅ | "'[Section]' too long (max N chars). Shorten and push again." | Self-serve |
| Note locked | Doctor/EHR | ✅ | "Note locked in AMD. Contact support if unexpected." | Ops or doctor unlocks |
| Provider not found | EHR config | ✅ | "Provider account not found in AMD. Contact support." | Ops |
| Permission insufficient | EHR admin | ✅ | "Marvix lacks permission to write to AMD. Check account permissions." | Practice admin |

**DrChrono**

| Scenario | Triggered by | Detectable? | Doctor sees | Resolution |
|---|---|---|---|---|
| EHR template changed | EHR admin | ❌ Undetectable | Nothing | Ops; needs Lambda change |
| Any field-level failure | Any | ❌ Undetectable — `save_note` swallows exceptions | Nothing | Ops |
| Auth/creds expired | Any | ✅ | — | Ops |

**CharmHealth**

| Scenario | Triggered by | Detectable? | Doctor sees | Resolution |
|---|---|---|---|---|
| Template name changed to/from `soap` | EHR admin/ops | ✅ | — | Ops updates name |
| Encounter already signed | Doctor | ✅ | "Encounter already signed in CharmHealth. Push not possible." | No fix — locked |
| Account locked | EHR | ✅ | — | Ops unlocks |
| SOAP mode failures | Any | ❌ Undetectable | Nothing | Ops investigates |

### Cat 3 — Cerner, ModMed

| Scenario | Triggered by | Detectable? | Doctor sees | Resolution |
|---|---|---|---|---|
| Cerner — token refresh / push rejection | Infra/auth | ✅ | — | Ops |
| ModMed — push errors | Infra | ✅ (assumed) | — | Ops |

### Summary — doctor self-serve vs. ops

| Scenario | EHR | Self-serve? |
|---|---|---|
| Check-in not complete | AthenaOne | ✅ Complete check-in, retry |
| Section text too long | AMD | ✅ Shorten, retry |
| Chart not open | Veradigm | ✅ Open chart, retry |
| Note locked by another user | Veradigm | ✅ Exit chart, retry |
| Encounter already signed | CharmHealth | ✅ Awareness only, no fix |
| Everything else | All | ❌ Ops handles |

### Undetectable gaps

| EHR | Gap |
|---|---|
| ECW | All note text failures — Lambda gets 200 regardless |
| DrChrono | All field-level failures — `save_note` swallows exceptions |
| CharmHealth | SOAP mode failures — no per-field errors |
| Nereg | Unmapped field pushes empty, no error |
| Centricity | Mismatched field names silently accepted |

---

## Open questions

| Question | Context | Owner |
|---|---|---|
| Doctor customizations — per-doctor or per-practice? | If two doctors share a template, shared or independent settings? | Vignesh |
| Write mode restrictions per EHR | AMD + AthenaOne confirmed functional (Athena isn't append-only). Confirm Veradigm/ECW/CharmHealth/DrChrono/Nereg before broad rollout — only AMD exposed in prototype. | Vignesh |
| ECW field ownership — user vs. practice level | Affects whether remap UI is per-doctor or per-practice. | Vignesh |
| Restricted-list / derivative-pull — production migration | Resolved in design; not built server-side. Before replacing anything: audit `extract_boolean_value` usage, backward-compat need, and who sets allowed values/EHR mappings on managed templates. | Ops + Vignesh |
| CharmHealth push activation status | Is push live? Timeline for templates API? | KJ |
| DrChrono push activation status | Active for any practices today? | Vignesh |
| Athena rate-limit scope | Per-practice, per-doctor, or per-API-key? Affects error copy. | Vignesh |

---

## Future: AI-assisted creation (Phase 2)

Doctor describes what they want → AI drafts sections and mappings → doctor reviews and saves. Later phase — flow 1 above is what's built now.
