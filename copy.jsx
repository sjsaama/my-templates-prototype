// copy.jsx — Centralized UI copy. Edit strings here, not in the component files.
//
// Scoped to copy that's either (a) genuinely duplicated across multiple call sites, where a
// wording change used to mean hunting down 2-3 places, or (b) copy we've iterated on repeatedly
// this session (banners, modal chrome, tutorial steps, toasts). One-off structural strings that
// rarely change (column headers, icon tooltips like "Drag to reorder", empty states) are left
// inline in their component — centralizing those would bloat this file for little future benefit.
//
// Mirrors the section numbering in MY_TEMPLATES_COPY_INVENTORY.md so the two stay easy to cross-check.

const COPY = {

  // Shared across CreateTemplateModal (wizard step 4), TemplateSettingsModal (header button), and
  // TEMPLATE_OVERRIDE_FIELDS (per-section overrides) — the one set of fields that used to require
  // editing in three places for a single wording change.
  templateSettings: {
    separator: {
      label: "Separator",
      info: "Joins text when multiple sections map to one EHR field.",
      placeholder: "e.g. \\n",
    },
    charLimit: {
      label: "Character limit",
      info: "Shortens a section if it runs longer than this, so the push isn't rejected — leave blank for no limit.",
      placeholder: "No limit",
    },
    pushSubsections: {
      label: "Push subsections",
      info: (ehrLabel) => `Include subsection content when pushing the parent section. Only relevant here, since ${ehrLabel} has no "As one"/"Each separately" choice.`,
    },
    retainHeadings: {
      label: "Retain headings",
      info: "Keep section/subsection headings in the pushed content.",
    },
    skipEmptySubsections: {
      label: "Skip empty subsections",
      info: "Omit subsections with no generated content instead of pushing an empty heading.",
    },
    keepBulletPoints: {
      label: "Keep bullet points",
      info: "Preserve bullet formatting on push to Assessment/Plan.",
    },
    wizardIntro: "These apply once, to the whole template, not per section. You can change them later from the Template settings button in the header.",
  },

  // Shared across InlineAdvPanel's Content settings card (rows.jsx) and AddSectionModal's
  // "Section-level settings" collapsible (modal.jsx) — same three fields, two call sites.
  contentFields: {
    preLiteral: {
      label: "Pre-literal",
      info: "Fixed text added before the section's generated content every time it pushes.",
      placeholder: "Fixed text added before section content on push…",
    },
    postLiteral: {
      label: "Post-literal",
      info: "Fixed text added after the section's generated content every time it pushes.",
      placeholder: "Fixed text added after section content on push…",
    },
    defaultText: {
      label: "Default value",
      info: "Shown instead of the section's usual content when nothing relevant was found in the transcript.",
      placeholder: 'e.g. "Not reported" or "None"',
    },
  },

  // Shared across InlineAdvPanel's Prompt card (rows.jsx), AddSectionModal (modal.jsx), and
  // PreviewModal's Prompt view in Edit Template (modal.jsx) — the section's content source.
  contentSource: {
    derivativeLabel: "Derivative to pull from",
    derivativeInfo: "Pushes straight to the mapped field, as-is. No prompt, no merging.",
    promptLabel: "Prompt",
    promptInfo: "Tells the AI what to write in this section.",
    promptPlaceholder: "e.g. Summarize the patient's chief complaint in their own words.",
    instructionLabel: "Instruction / question",
    instructionInfo: "The AI answers using only one of the allowed values below.",
    instructionPlaceholder: "e.g. Is the patient a smoker?",
    allowedValuesLabel: "Allowed output values",
    allowedValuesInfo: "At least two values. The AI's output for this section will always be exactly one of these.",
    allowedValuesPlaceholder: "Type a value and press Enter",
    fillupLabel: "Fill-in-the-blank instruction",
    fillupInfo: "The AI fills in each blank from the transcript; everything else pushes exactly as written.",
  },

  // Section editor banners (app.jsx). noPushSuffix follows a bolded EHR label in JSX,
  // e.g. <strong>{ehrLabel}</strong> {noPushSuffix} — kept separate so the label stays bold.
  banners: {
    noPushSuffix: "doesn't push automatically. Notes are copied manually after each visit.",
  },

  // Shared/duplicate field mapping (rows.jsx)
  sharedMapping: {
    orderExplanation: (fieldLabel) => `Order these sections combine in when pushed to ${fieldLabel}, independent of their order in this note.`,
  },

  // Create Template wizard (modal.jsx)
  wizard: {
    title: "Create a template",
    subtitle: "You'll configure sections and EHR mapping after creation",
    ehrTemplateStepHint: (ehrLabel) => `You can only map to templates ops has already set up in ${ehrLabel}. Picking one fetches its field list for the next step.`,
    reviewClosingLine: "After creation, you'll land in the template editor to configure sections and mappings.",
  },

  // Template Settings modal, opened from the header button (modal.jsx)
  templateSettingsModal: {
    title: "Template settings",
    subtitle: (templateName) => `${templateName}, applies to the whole template, not per section`,
  },

  // Version History modal (modal.jsx, app.jsx)
  versionHistory: {
    title: "Version history",
    subtitle: (templateName) => `${templateName}, restore to any saved version`,
    restoreConfirmBody: "Your unsaved changes will be replaced. No version is ever deleted, save first if you want to keep this one.",
    restoreWarnings: ["EHR mappings will match this version", "Section order will match this version", "Section settings will match this version"],
  },

  // Edit Template full-page view (modal.jsx)
  editTemplate: {
    title: "Edit template",
  },

  // Toasts (app.jsx)
  toasts: {
    sectionDeleted: "Section deleted",
    templateCreated: "Template created, configure your sections and EHR mapping below",
    sectionAdded: "Section added",
    sectionRequestSent: "Section request sent, ops will review",
    changesSaved: "Changes saved, version recorded",
    versionRestored: (date) => `Restored version from ${date}`,
  },
};

Object.assign(window, { COPY });
