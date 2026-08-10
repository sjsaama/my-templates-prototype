# My Templates — PRD (ECW)

Branch: `cursor/ecw-ehr-f6a6` · EHR: **eClinicalWorks (Cat 1 — fixed field list)**  
Related: [ehr_mapping/ECW.md](ehr_mapping/ECW.md), [ehr_mapping/ERROR_UX.md](ehr_mapping/ERROR_UX.md)

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

My Templates is organized around **two ownership flows**. Every template is one or the other — never both.

| Flow | Who owns structure | Who uses My Templates for |
|---|---|---|
| **Ops-operated** | Ops (onboarding + ongoing) | Doctor remaps, tunes output, requests changes from ops, resets to ops default |
| **Self-serve** | Doctor | Doctor creates the template, adds/deletes sections, edits prompts, remaps, tunes output |

Both flows share: view template, remap Primary / Scribe-it, output settings, global Character limit + Line separator, Preview, Save.

---

## Who is this for

Doctors on Marvix who push notes to **eClinicalWorks**. (Other EHRs live on their own branches.)

---

## Flow map — capability matrix

| Capability | Ops-operated | Self-serve |
|---|---|---|
| List tab (Ops-managed / Self-serve) | ✅ Ops-managed tab | ✅ Self-serve tab |
| View sections + Primary / Scribe-it mappings | ✅ | ✅ |
| Remap Primary + Scribe-it (fixed list) | ✅ | ✅ |
| Output settings (Additional text, Default negative) | ✅ | ✅ |
| Global Character limit + Line separator | ✅ | ✅ |
| Preview output / Save | ✅ | ✅ |
| **Reset to default** | ✅ | ❌ — no ops default to restore |
| **Request New Section** | ✅ | ❌ — use **+ Add section** |
| **+ Add section** / delete custom section | ❌ | ✅ |
| **Prompt** edit | ❌ | ✅ |
| **Create template** | ❌ | ✅ — no Connect EHR (Cat 1) |

---

## Flow 1 — Ops-operated

Ops builds and owns the template structure during onboarding. The doctor customizes within that structure.

### Doctor journey

1. Open **Ops-managed** tab → select template (e.g. General 3).
2. Header shows **Ops-managed** badge + hint: *Ops manages the section structure. Remap fields, adjust output settings, or request a new section from ops.*
3. Review section rows: Primary shortcut (`HPI:`, `Assessment:`, …) and optional **Scribe-it** column.
4. Remap any section via the dual-column picker (fixed list — no API call).
5. Open output settings (sliders) for Additional text / Default negative.
6. Adjust template bars: Character limit (global), Line separator (HL7 main).
7. If a section is missing → **Request New Section** (ops review).
8. If customizations went wrong → **Reset to default** (restore ops config).
9. **Preview** / **Save**.

### What the doctor cannot do (ops owns it)

- Add or delete sections
- Edit section prompts
- Change the overall section tree ops authored

### Request New Section (ops-operated only)

| Field | Required? |
|---|---|
| Section name | ✅ |
| Description | ✅ |
| EHR field hint | ✅ |
| Is it a subsection? | ✅ |
| Which templates to add it to | ✅ |

Ops approves / rejects with a note. Doctor is notified in-app when status changes.

### Reset to default (ops-operated only)

Discards the doctor's customizations and restores the ops-configured default. Confirmation lists what clears: custom EHR mappings, section order, output settings.

---

## Flow 2 — Self-serve

The doctor creates and owns the template. Ops does not control structure on these templates.

### Create journey

1. Click **+ Create template**.
2. **Describe** — name, description, document type; optionally copy sections from an existing template.
3. **Connect EHR** — **skipped for ECW (Cat 1)**. Fixed field list; no fetch. Brief notice that mapping uses eCW's hardcoded shortcuts.
4. **Review** → create.
5. Editor opens with Marvix default sections (or the copied tree). Doctor maps each section to Primary / Scribe-it from the fixed lists.

**Copy from existing (optional):** Deep-copies section tree — order, enabled state, EHR mappings. Blank start → Marvix defaults (not an empty Cat 2-style list).

### Doctor journey (after create)

1. Open **Self-serve** tab → select template.
2. Header shows **Self-serve** badge + hint: *You manage this template’s structure and eCW mappings — add sections, edit prompts, and remap Primary / Scribe-it destinations.*
3. **+ Add section** — Header + Prompt + map to an unused Primary field (up to field-count cap).
4. Edit **Prompt** on any row.
5. Remap Primary / Scribe-it; tune output settings; Character limit + Line separator.
6. Delete custom sections if needed.
7. **Preview** / **Save**.

### What the doctor cannot do (no ops default)

- **Reset to default** — there is no ops baseline
- **Request New Section** — they add sections themselves

---

## Shared — what both flows do the same way

### View

| What they see | Detail |
|---|---|
| Sections | Hierarchical parents + children |
| Primary destination | eCW shortcut with colon (`HPI:`, `Assessment:`) — shown as-is |
| Scribe-it destination | Optional second column (`ScribeIt > HPI`, …) |
| Macros / summarizers | `M` / `S` icons with active dot |
| Shared field | Neutral **Shared** chip when 2+ parents map to one destination; push order = UI section order |

### Remap (Cat 1 — Flow A)

Open dual-column picker → pick from **hardcoded** Primary shortcuts and optional Scribe-it fields. No API call. Both destinations optional.

### Output settings (per section)

| Setting | Notes |
|---|---|
| Additional text | Before / After section body |
| Default negative | Pushed when section has no generated content |

**Not on ECW:** Push setting (Insert before / after / Overwrite) — ECW does not fetch existing note content. That control is AMD-only.

### Template settings (global)

| Setting | Notes |
|---|---|
| Character limit | Global only — not per section |
| Line separator | ECW HL7 main — replaces `\n` before S3 upload (e.g. `\X0A\`). Not used for Selective Copy (Scribe-it) |

Subsection join (headings, skip empty, spacing) lives in the **Settings Portal** — out of scope here.

### Preview

Hardcoded sample transcript → sample section output (or default negative). UI-only dry run — not an LLM call. Available on both flows.

---

## ECW mapping specifics

| Mode | How it works | Doctor UI |
|---|---|---|
| **Main (HL7 ORU)** | HL7 uploaded to ECW via S3 | Primary column — shortcut commands |
| **Selective Copy (Scribe-it)** | Doctor pastes via Ctrl+V + "Scribe It" | Scribe-it column — separate note-panel fields |

Template must have **Selective Copy** checked in V2/V1 Template Editor for Scribe-it to work.

YAML (ops portal) still uses `ehr_field_name` + optional `section_code` for HL7; doctor-facing Primary list uses colon form (`HPI:`). See [ECW.md](ehr_mapping/ECW.md).

---

## Push errors (both flows)

In-app surface (when detectable / ops-flagged):

1. Template banner — summary
2. Section row strip — Remap / Got it / Contact support (only actions that apply)

| Scenario | Detectable? | Doctor sees | Actions |
|---|---|---|---|
| Note text HL7 failure | ❌ Undetectable (S3 200 ≠ ECW accept) | Nothing unless ops spot-checks | Remap after spot-check / ops YAML |
| Order config mismatch (lab, rx, referral, imaging, procedure, vaccine) | ⚠️ Lambda WARNING | Contact support copy if promoted to `push_errors` | Contact support only — Remap won't fix order YAML |
| Wrong Scribe-it paste target | Manual | Doctor may notice | Remap Scribe-it |

> “All ECW failures undetectable” is overstated — **note text** is undetectable; **order-section** WARNINGs surface in Lambda (~2,100 / 3 mo). See `EHR_PUSH_FAILURE_LOG_ANALYSIS.md`.

Same error UX on ops-operated and self-serve. Difference: on self-serve the doctor can also fix a bad prompt; on ops-operated they Remap or Contact support / Request.

---

## UI conventions

- **Ownership tabs** in the template list: Ops-managed / Self-serve
- **Ownership badge + hint** in the editor header
- **Template meta:** EHR + derivative as chips
- **Save** always; **Reset** and **Request New Section** only on ops-operated; **+ Add section** and **Prompt** only on self-serve
- **Scribe-it** table column only when EHR is eCW
- Field labels: shortcut commands as-is; no raw API ids

---

## Open questions

| Question | Owner |
|---|---|
| ECW selective copy — user-level vs practice-level ownership of fields? Affects per-doctor vs per-practice remap | Vignesh |
| Promote order-section WARNINGs into in-app `push_errors`? | Product + BE |
| Align HL7 YAML (no colon + `section_code`) with doctor-facing colon shortcuts in one mental model | Ops + Product |

---

## Out of scope — v1

| Area | Notes |
|---|---|
| Doctor picks their EHR note template | N/A for Cat 1 ECW — fixed list; Cat 2 Connect EHR is other branches |
| Derivatives | Needs scoping with Vignesh + Nandini |
| AI-assisted template creation | Phase 2 |
