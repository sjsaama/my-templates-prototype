// settings.jsx — Global (practice) + Local (template) settings from the PRD
const { useState: useStateS } = React;

const DEFAULT_PRACTICE_SETTINGS = {
  amdEhrTemplate: "AMD_General_Template",
  ehrCredentialsSet: true,
  veradigmFieldList: "Configured at onboarding",
  veradigmPushMode: "note", // note | document
  charmPushMode: "standard", // soap | standard
};

const DEFAULT_TEMPLATE_SETTINGS = {
  // Veradigm separators (PRD template-level)
  defaultLineSeparator: "\\r\\n",
  sectionSeparator: "\\n\\n",
  subsectionSeparator: "\\n",
  // Character limit — TBD global; optional template default
  charLimit: "",
  // Settings Portal / SHARED_CONFIG → Template Settings
  pushSubsections: true,
  retainHeadings: false,
  skipEmptySubsections: false,
  subsectionSpacing: "single", // single | double
};

function FieldRow({ label, hint, children, opsOnly }) {
  return (
    <div className={"set-field" + (opsOnly ? " set-field--ops" : "")}>
      <div className="set-field-meta">
        <div className="set-field-label-row">
          <label className="set-field-label">{label}</label>
          {opsOnly && <span className="set-ops-badge">Ops</span>}
        </div>
        {hint && <p className="set-field-hint">{hint}</p>}
      </div>
      <div className="set-field-control">{children}</div>
    </div>
  );
}

function SegControl({ value, options, onChange, disabled }) {
  return (
    <div className={"set-seg" + (disabled ? " set-seg--disabled" : "")} role="group">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={"set-seg-btn" + (value === opt.value ? " set-seg-btn--on" : "")}
          onClick={() => !disabled && onChange(opt.value)}
          disabled={disabled}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function ToggleRow({ checked, onChange, disabled, label }) {
  return (
    <label className={"set-toggle" + (disabled ? " set-toggle--disabled" : "")}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={"set-switch" + (checked ? " set-switch--on" : "")}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
      >
        <span className="set-switch-knob" />
      </button>
      <span className="set-toggle-label">{checked ? "On" : "Off"}</span>
    </label>
  );
}

function GlobalSettingsPanel({ practice }) {
  return (
    <div className="set-panel">
      <header className="set-panel-head">
        <h2 className="set-panel-title">Global settings</h2>
        <p className="set-panel-sub">
          Practice-level defaults set by ops during onboarding. Doctors can view these but cannot change them.
        </p>
      </header>

      <div className="set-notice set-notice--ops">
        Configured by ops / practice admin — not editable here.
      </div>

      <section className="set-section">
        <h3 className="set-section-title">Practice / EHR</h3>
        <div className="set-fields">
          <FieldRow
            label="EHR template selection"
            hint="AMD — which note template is connected for this practice. Determines the field list for all doctors."
            opsOnly
          >
            <input className="set-input" value={practice.amdEhrTemplate} disabled readOnly />
          </FieldRow>

          <FieldRow
            label="EHR credentials"
            hint="API keys, OAuth tokens, and practice ID for all push EHRs. Set at onboarding."
            opsOnly
          >
            <SegControl
              value={practice.ehrCredentialsSet ? "set" : "missing"}
              options={[
                { value: "set", label: "Configured" },
                { value: "missing", label: "Missing" },
              ]}
              onChange={() => {}}
              disabled
            />
          </FieldRow>

          <FieldRow
            label="Veradigm field list"
            hint="Veradigm — field names configured by tech at onboarding — not app-hardcoded."
            opsOnly
          >
            <input className="set-input" value={practice.veradigmFieldList} disabled readOnly />
          </FieldRow>

          <FieldRow
            label="Push as note vs. document"
            hint="Veradigm — set at template configuration time by ops. Doctor does not control this."
            opsOnly
          >
            <SegControl
              value={practice.veradigmPushMode}
              options={[
                { value: "note", label: "Push as note" },
                { value: "document", label: "Push as document" },
              ]}
              onChange={() => {}}
              disabled
            />
          </FieldRow>

          <FieldRow
            label="CharmHealth push mode"
            hint="CharmHealth — SOAP vs. standard, determined by whether the template name has a soap prefix. Ops controls this."
            opsOnly
          >
            <SegControl
              value={practice.charmPushMode}
              options={[
                { value: "standard", label: "Standard" },
                { value: "soap", label: "SOAP" },
              ]}
              onChange={() => {}}
              disabled
            />
          </FieldRow>
        </div>
      </section>
    </div>
  );
}

function LocalSettingsPanel({
  tpl,
  templates,
  settings,
  onChange,
  onSelectTemplate,
  ehr,
}) {
  if (!tpl) {
    return (
      <div className="set-panel">
        <header className="set-panel-head">
          <h2 className="set-panel-title">Local settings</h2>
          <p className="set-panel-sub">
            Template-level settings apply to one template. Select a template to configure them.
          </p>
        </header>
        <div className="set-empty">
          <p>No template selected.</p>
          <div className="set-tpl-picker">
            {(templates || []).slice(0, 8).map((t) => (
              <button key={t.id} type="button" className="set-tpl-pick" onClick={() => onSelectTemplate(t.id)}>
                {t.name}
                {t.derivative && <span className="set-tpl-pick-sub">{t.derivative}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const set = (patch) => onChange({ ...settings, ...patch });

  return (
    <div className="set-panel">
      <header className="set-panel-head">
        <h2 className="set-panel-title">Local settings</h2>
        <p className="set-panel-sub">
          Template-level settings for <strong>{tpl.name}</strong>. Section-level output settings stay on each section row.
        </p>
        <div className="set-tpl-switch">
          <label className="set-field-label" htmlFor="set-tpl-select">Template</label>
          <select
            id="set-tpl-select"
            className="set-select"
            value={tpl.id}
            onChange={(e) => onSelectTemplate(e.target.value)}
          >
            {(templates || []).map((t) => (
              <option key={t.id} value={t.id}>{t.name}{t.derivative ? ` (${t.derivative})` : ""}</option>
            ))}
          </select>
        </div>
      </header>

      <section className="set-section">
        <h3 className="set-section-title">How subsections combine</h3>
        <p className="set-section-lead">
          Settings Portal items — apply once per template when subsections are joined into one EHR field.
        </p>
        <div className="set-fields">
          <FieldRow
            label="Include subsections"
            hint="If off, only the parent section’s own text is pushed — child subsections are ignored."
          >
            <ToggleRow
              label="Include subsections"
              checked={!!settings.pushSubsections}
              onChange={(v) => set({ pushSubsections: v })}
            />
          </FieldRow>
          <FieldRow
            label="Include headings"
            hint="Prefix each subsection with its name (e.g. “Onset: …”). Only applies when subsections are included."
          >
            <ToggleRow
              label="Include headings"
              checked={!!settings.retainHeadings}
              onChange={(v) => set({ retainHeadings: v })}
              disabled={!settings.pushSubsections}
            />
          </FieldRow>
          <FieldRow
            label="Skip empty subsections"
            hint="Exclude subsections with no generated content from the joined output."
          >
            <ToggleRow
              label="Skip empty subsections"
              checked={!!settings.skipEmptySubsections}
              onChange={(v) => set({ skipEmptySubsections: v })}
              disabled={!settings.pushSubsections}
            />
          </FieldRow>
          <FieldRow
            label="Subsection spacing"
            hint="Single or double line between subsections when joined."
          >
            <SegControl
              value={settings.subsectionSpacing}
              options={[
                { value: "single", label: "Single line" },
                { value: "double", label: "Double line" },
              ]}
              onChange={(v) => set({ subsectionSpacing: v })}
              disabled={!settings.pushSubsections}
            />
          </FieldRow>
        </div>
      </section>

      <section className="set-section">
        <h3 className="set-section-title">Separators</h3>
        <p className="set-section-lead">
          Doctor-settable template-level separators (PRD: Veradigm). Defaults use CRLF-safe values.
        </p>
        <div className="set-fields">
          <FieldRow
            label="Default line separator"
            hint="Separator used for all line breaks in pushed content. Veradigm requires \\r\\n (CRLF)."
          >
            <input
              className="set-input set-input--mono"
              value={settings.defaultLineSeparator}
              onChange={(e) => set({ defaultLineSeparator: e.target.value })}
              placeholder="\\r\\n"
            />
          </FieldRow>
          <FieldRow
            label="Section separator"
            hint="Inserted between top-level sections on push."
          >
            <input
              className="set-input set-input--mono"
              value={settings.sectionSeparator}
              onChange={(e) => set({ sectionSeparator: e.target.value })}
              placeholder="\\n\\n"
            />
          </FieldRow>
          <FieldRow
            label="Subsection separator"
            hint="Inserted between child subsections on push."
          >
            <input
              className="set-input set-input--mono"
              value={settings.subsectionSeparator}
              onChange={(e) => set({ subsectionSeparator: e.target.value })}
              placeholder="\\n"
            />
          </FieldRow>
        </div>
      </section>

      <section className="set-section">
        <h3 className="set-section-title">Limits</h3>
        <div className="set-fields">
          <FieldRow
            label="Character limit"
            hint="TBD — currently shown per section. Optional template-level default if the EHR enforces a single limit."
          >
            <input
              className="set-input"
              type="number"
              min="0"
              value={settings.charLimit}
              onChange={(e) => set({ charLimit: e.target.value })}
              placeholder="Leave blank to use per-field limits"
            />
          </FieldRow>
        </div>
      </section>

      <div className="set-panel-foot">
        <button type="button" className="btn-teal btn-sm" onClick={() => window.__flashSettings && window.__flashSettings("Template settings saved")}>
          Save template settings
        </button>
      </div>
    </div>
  );
}

function SettingsView({
  settingsTab,
  practice,
  onPracticeChange,
  tpl,
  templates,
  templateSettings,
  onTemplateSettingsChange,
  onSelectTemplate,
  ehr,
}) {
  return (
    <div className="set-view">
      {settingsTab === "global" ? (
        <GlobalSettingsPanel practice={practice} onChange={onPracticeChange} ehr={ehr} />
      ) : (
        <LocalSettingsPanel
          tpl={tpl}
          templates={templates}
          settings={templateSettings}
          onChange={onTemplateSettingsChange}
          onSelectTemplate={onSelectTemplate}
          ehr={ehr}
        />
      )}
    </div>
  );
}

Object.assign(window, {
  SettingsView,
  DEFAULT_PRACTICE_SETTINGS,
  DEFAULT_TEMPLATE_SETTINGS,
});
