# My Templates: Copy Inventory

Every user-facing string in the prototype, organized by flow. Pulled directly from the code (app.jsx, modal.jsx, rows.jsx, shell.jsx, data.jsx). This is a working draft for copy review, not final language.

`{curly}` = a value filled in at runtime. Bracketed notes explain when/where a string shows up.

**A new file, `copy.jsx`, now holds the copy that's either genuinely duplicated across multiple call sites (Template settings' 6 fields, Content settings' 3 fields, Prompt/Instruction/Derivative copy) or frequently revised (banners, modal chrome, toasts). Future edits to that copy are one small change in one file instead of hunting across app.jsx/modal.jsx/rows.jsx. Low-churn structural strings (column headers, icon tooltips like "Drag to reorder," empty states) stay inline in their component, unchanged.

---

## Nomenclature

One canonical name per concept, so future copy edits check against this instead of drifting. Update this table whenever a name changes.

| Concept | Canonical name | Where it shows |
|---|---|---|
| Row icon that opens the section's settings panel | "Section settings" | Row actions (sliders icon), tooltip + aria-label |
| Panel card: text wrapped around generated content, and its fallback | "Content settings" | Inside the Section settings panel |
| Panel card: the section's content source (prompt / instruction / derivative) | "Prompt" | Inside the Section settings panel, self-serve only |
| Panel card: per-section override of template-wide settings | "Override template settings for this section" | Inside the Section settings panel |
| Panel card: EHR-specific push behavior | "Mapping settings" | Inside the Section settings panel |
| Whole-template push settings (Separator, Retain headings, etc.) | "Template settings" | Gear icon modal, wizard step 4 |
| Fixed text placed before/after a section's generated content | "Pre-literal" / "Post-literal" | Content settings card |
| Fallback text when a section generates nothing | "Default" | Content settings card |
| Internal EHR categorization (Cat 1/2/3/4) | Never shown as "Cat X". Name the EHR(s) or describe the behavior instead | Doc annotations, code comments only |

---

## 1. Left nav / template list

- "My Templates": panel title
- "+ Create template": button
- "Search templates…": search placeholder
- "No templates match "{query}"": empty search state
- "Expand templates" / "Collapse templates": collapse-toggle tooltip, by state
- "Self-serve" / "Managed": group headers
- "No template selected. Choose a template to see its details.": empty main panel

---

## 2. Section editor, main table

**Header** — one toolbar for every template-level action, all direct buttons, no overflow menu
- "+ Add section": button (self-serve templates only)
  - "{ehrLabel}'s field list isn't confirmed yet, check with ops": disabled tooltip
  - "All available {ehrLabel} fields are already used": disabled tooltip
- "Edit template": icon button, tooltip "Edit template" (self-serve templates only)
- "Template settings": icon button, tooltip "Template settings"
- "Version history": icon button, tooltip "Version history"
- "Request new section": icon button, tooltip "Request new section" (Managed templates only)
- "Save changes": button

**No-push EHR banner** (Tebra)
- "{ehrLabel} doesn't push automatically. Notes are copied manually after each visit."

**Push issues banner**
- "Action needed. {n} section{s} couldn't be pushed" (self-serve/fixable)
- "Push failed. {n} section{s} didn't reach your EHR" (not self-fixable)
- "You can fix this yourself. See the affected section{s} below."
- "Support has been notified. See the affected section{s} below for details."
- "Remap" / "Contact support": buttons

**Table header**
- "Section" / "EHR Mapping" / "Scribe-it" (eCW only) / "Enable"

**Row icons/tooltips**
- "Drag to reorder"
- "Hide subsections" / "Show subsections"
- "Restricted list: {allowed values}"
- "Connected macros" / "Connected summarizers"
- "Delete section" (custom sections only)
- Delete confirm: "Delete "{sectionName}"? This can't be undone."
- Toolbox icon tooltip, by state:
  - Panel open: "Hide section settings"
  - Pulls from a derivative: "Section settings, pulling from {derivativeLabel}"
  - No prompt written yet: "Section settings, no prompt written yet"
  - Otherwise: "Section settings"
- "No prompt written yet": missing-prompt badge tooltip
- "Edit Scribe-it mapping" (eCW)

**Macro/Summarizer popovers** (shown on self-serve and managed templates alike, view-only — no add/request action here)
- "Macros" / "No macros connected"
- "Summarizers" / "No summarizers connected"

**EHR mapping cell states**, by case
- Not yet mapped: "Not mapped" / "Click to assign an EHR field"
- Already mapped: "Change EHR mapping: {ehr}"
- Auto-routed per section (Centricity): "Auto-mapped from section names"
- Whole note pushed as one file (Cerner, ModMed): "Whole note pushed as PDF"
- No push integration (Tebra): "No push"
- Field list not yet confirmed: "Field list pending" / "Field list not yet confirmed, ops will configure this"
- Parent section mapped as a whole: "Mapped with parent" / "Subsections mapped individually"
- Mapping-mode toggle, with tooltips:
  - "As one": "Push entire section (with all subsections) to one EHR field"
  - "Each separately": "Each subsection maps to its own EHR field independently"

**Shared/duplicate field mapping**
- "Shared · order {n}/{total}"
- "Multiple sections push to this field, click to set push order"
- "Push order into this field"
- "Order these sections combine in when pushed to {fieldLabel}, independent of their order in this note."

Per-section push-error messages: see **Errors** at the end of this doc.

---

## 3. Section row inline settings panel

Opened via the row's toolbox icon, tooltip "Section settings" (renamed from "Output settings" to match the Template/Mapping/Section settings hierarchy). Four cards: **Content settings**, **Prompt** (self-serve only), **Override template settings**, **Mapping settings**.

**Content settings** (renamed from "Section settings" to avoid clashing with the icon's own new name)
- Pre-literal: *"Fixed text added before the section's generated content every time it pushes."* Placeholder: "Fixed text added before section content on push…"
- Post-literal: *"Fixed text added after the section's generated content every time it pushes."* Placeholder: "Fixed text added after section content on push…"
- Default: *"Shown instead of the section's usual content when nothing relevant was found in the transcript."* Placeholder: `e.g. "Not reported" or "None"`

**Prompt** (self-serve templates only)
- Derivative to pull from: *"Pushes straight to the mapped field, as-is. No prompt, no merging."*
- Prompt (open-text): *"Tells the AI what to write in this section."* Placeholder: "e.g. Summarize the patient's chief complaint in their own words."
- Instruction / question (restricted-list): *"The AI answers using only one of the allowed values below."* Placeholder: "e.g. Is the patient a smoker?"
- Allowed output values: *"At least two values. The AI's output for this section will always be exactly one of these."* Placeholder: "Type a value and press Enter"

**Override template settings for this section** (collapsible, count badge)
- Same six fields/InfoTips as Template Settings (see Section 5). Shows "Template default: {value}" per field until overridden. Segmented control: "On / Off" (starts on whichever matches the template default; clicking either sets an explicit override)

**Mapping settings**
- EHR value mapping: *"This section's output is always one of {allowed values}. Set what gets pushed to {fieldLabel} for each."* Per-value placeholder: "e.g. 1"
- Write mode: *"Insert before adds text above existing content, Insert after adds it below, Overwrite replaces it entirely."* Plus an AthenaOne-specific addendum about fetch behavior, varies by section.

---

## 4. Create Template wizard

- "Create a template": title
- "You'll configure sections and EHR mapping after creation": subtitle
- Step labels: "Starting point", "Describe", "EHR template" (AMD, DrChrono, CharmHealth only), "Template settings" — last step, its Next button reads "Create template" (no separate Review step)

**Step 1: Starting point**
- "Start blank"
- Stencil names (data.jsx): "Cardiology Follow-up", "Primary Care Visit", "Neurology Consultation", "General SOAP Note" (each also has a one-line description shown on its card)
- "Preview": button. Preview overlay — just the assembled sample note, one continuous document, nothing else (no per-section prompt view):
  - "← Back to templates": back link
  - "✓ Selected" / "Use this template": confirm button, by state

**Step 2: Describe**
- "Template name": placeholder "e.g. Cardiology Follow-up"
- "Document type": "Clinical Note" / "Letter"

**Step 3: EHR template** (AMD, DrChrono, CharmHealth only)
- "Which {ehrLabel} template does this map to?"
- "You can only map to templates ops has already set up in {ehrLabel}. Picking one fetches its field list for the next step."
- "No {ehrLabel} templates are set up for this practice yet, ask ops to add one."
- "Search {ehrLabel} templates…"

**Step 4: Template settings** (last step)
- "These apply once, to the whole template, not per section. You can change them later from the Template settings button in the header."
- Same six fields as Section 5 below.
- "Create template": final button (replaces "Next" on the last step)

---

## 5. Template Settings modal (header button), the 6 fields reused across Sections 3, 4, and here

- **Separator**: *"Joins text when multiple sections map to one EHR field."* Placeholder: "e.g. \n"
- **Character limit**: *"Shortens a section if it runs longer than this, so the push isn't rejected — leave blank for no limit."* Placeholder: "No limit"
- **Push subsections** (only shown where the EHR auto-routes per section with no "As one"/"Each separately" choice, Centricity today): *"Include subsection content when pushing the parent section. Only relevant here, since {ehrLabel} has no "As one"/"Each separately" choice."*
- **Retain headings**: *"Keep section/subsection headings in the pushed content."*
- **Skip empty subsections**: *"Omit subsections with no generated content instead of pushing an empty heading."*
- **Keep bullet points**: *"Preserve bullet formatting on push to Assessment/Plan."*

Modal chrome: "Template settings" / "{templateName}, applies to the whole template, not per section" / "Close"

---

## 6. Add Section modal

- "Add section": title
- Two grouped cards, "Content" and "Position" (same bordered-card style as Section 3's settings panel)

**Content**
- "Section name": placeholder "e.g. Allergy History"
- "Section type", three choice cards:
  - "Open-text": "AI writes this section in its own words, from your prompt."
  - "Restricted list": "AI picks one of a few fixed answers you define, like Y / N / NA."
  - "Pull from another derivative": "Copies content straight from another note type, no AI writing."
- Derivative to pull from: *"A direct pass-through. Whatever this derivative generates is pushed straight to wherever this section is mapped, as-is. No prompt, no merging."* Options: "ICD-10 Codes", "E/M Coding"
- Prompt/Instruction + Allowed output values: same copy as Section 3's Prompt card

**Position**
- "Add as", two-option toggle: "New section" / "Subsection" (Subsection disabled with tooltip "No existing sections to nest under yet." if none exist)
- "Parent section" (Subsection only) and "Placement" sit side by side:
  - Top-level: "Placement", options "First section" / "After "{siblingName}""
  - Subsection: "Placement within "{parentName}"", options "First child" / "After "{siblingName}""

- "▾ Section-level settings" (collapsible, "optional, can skip and add later"): same Pre-literal/Post-literal/Default as Section 3, Pre-literal and Post-literal paired side by side
- "Cancel" / "Add section"

---

## 7. Request New Section modal

- "Request a new section": title
- "Ops team will review and add it to your template": subtitle
- "Section name": placeholder "e.g. Allergy History"
- "Map to EHR field": placeholder "Which EHR field should this map to?"
- "What should AI capture in this section?": placeholder "e.g. Document all known allergies, reactions, and severity…"
- "This is a subsection of": placeholder "Parent section name"
- "Add to templates": "Select templates…" / "{n} template{s} selected"
- "Search templates…" / "No templates match "{query}""
- "Cancel" / "Send request"
- "No description provided.": fallback
- "Your requests": pending list title
- Status pills: "Pending review", "Approved", "Not approved"

---

## 8. Mapping Picker panel

- "EHR Field Mapping": title
- "Section: {sectionName}"
- "Search EHR fields…" / "No fields match "{query}""
- "Primary: {value}"
- "Clear mapping. Remove EHR destination"
- "Cancel" / "Save mapping"

---

## 9. Version History modal

- "Version history": title
- "{templateName}, restore to any saved version": subtitle
- "No versions saved yet."
- "Most recent save" / "Original": tags
- "Restore": button
- "Template created" / "No changes detected since the previous save"
- "+{n} more" / "Show less"
- Restore confirm dialog:
  - Title: "Restore this version?"
  - Subtitle: "{templateName}, {date}"
  - Body: "Your unsaved changes will be replaced. No version is ever deleted, save first if you want to keep this one."
  - Warning list: "EHR mappings will match this version" / "Section order will match this version" / "Section settings will match this version"
  - Confirm button: "Yes, Restore"
- Changelog lines, one per change type, e.g. `Added "{name}"`, `Renamed "{old}" to "{new}"`, `Remapped "{name}" to {field}`, `Edited prompt for "{name}"`, `Changed {settingLabel}` (11 more variants covering enable/disable, unmap, write mode, subsection push mode, additional text, default negative, macro/summarizer connections, removal, and reordering)

---

## 10. Edit Template (live prompt testing view)

No guide panel and no separate section-view/full-note toggle — the tab bar and the Generate button are the whole interface, and the note is always shown fully assembled.

- "← Back to editor" / "Edit template": header
- Tabs: "Prompt" (permanent) + one "Note {n}" per generated note, in order generated
  - Each "Note {n}" tab has its own "✕" close button (aria-label "Delete Note {n}")
- "Generate" / "Generating…": button, by state — creates the next "Note {n}" tab and switches to it
- "Generating note…": placeholder shown in a new note tab until its 700ms generation completes
- "Use this note's prompts": button shown above a note's content — copies that note's prompt snapshot back onto the Prompt tab and switches to it
- "All sections are disabled, enable at least one to see output.": Prompt tab empty state
- "(no content, Skip empty subsections is off)": per-section fallback in a note
- Prompt fields (Prompt tab only) mirror Section 3's Prompt card, with fallback text "No instruction written yet…" / "None set" / "No prompt written yet…"

---

## 11. Macros page

- "Macros": title
- "Connected across {templateName}" / "Connected across the current template"
- "No macros connected in this template yet."

---

## 12. Toasts

- "Section deleted"
- "Template created, configure your sections and EHR mapping below"
- "Section added"
- "Section request sent, ops will review"
- "Changes saved, version recorded"
- "Restored version from {date}"

---

## Errors

Per-section push-error messages, shown in the row's error banner (Section 2). One per failure scenario, three tones:

| Tone | Example message | Action |
|---|---|---|
| Self-serve fixable | "This note couldn't be pushed because the patient's check-in isn't complete in Athena. Finish check-in, then push again." | "Got it" |
| Needs ops | "One or more sections failed to push. Support has been notified." | "Contact support" |
| Needs remapping | "Your AMD template was updated and some field mappings are no longer valid. Support has been notified." | "Remap" |

Plus 6 more scenario-specific variants (Athena transient error, Athena auth, AMD too-long content, AMD permissions, Veradigm chart-closed, Veradigm locked-encounter), each using one of the three tones above.

---

## Not included here

The starter templates' full clinical prompts (data.jsx `STARTER_TEMPLATES`) are AI instructions a doctor writes/edits, not fixed UI copy. They're long (the Cardiology HPI prompt alone runs about 5 paragraphs). Say the word if you want those transcribed into this doc too; left them out for now since they're content, not interface text.
