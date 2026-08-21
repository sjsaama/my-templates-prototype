// rows.jsx — simplified edit-mode section table
// User controls: reorder (drag-and-drop) + EHR mapping. Everything else is soft-hidden / read-only.
const { useState: useStateR, useState: useStateAdv } = React;

// ── Local utility ──────────────────────────────────────────────────────────
function findSecR(sections, id) {
  for (const s of sections) {
    if (s.id === id) return s;
    if (s.children) { const h = findSecR(s.children, id); if (h) return h; }
  }
  return null;
}

// ── Toggle ─────────────────────────────────────────────────────────────────
function Toggle({ on, onChange, disabled }) {
  return (
    <button
      className={"toggle" + (on ? " toggle--on" : "") + (disabled ? " toggle--disabled" : "")}
      onClick={() => !disabled && onChange(!on)}
      role="switch"
      aria-checked={on}
    >
      <span className="toggle-knob" />
    </button>
  );
}

// ── Info tip — small "i" button next to a setting's heading; click to reveal its
// explanation in a popover instead of showing it as always-visible body text. ──
function InfoTip({ text }) {
  const [open, setOpen] = useStateR(false);
  return (
    <span className="info-tip">
      <button type="button" className="info-tip-btn" onClick={() => setOpen(o => !o)} aria-label="More info">i</button>
      {open && <div className="info-tip-popover">{text}</div>}
    </span>
  );
}

// ── Chip list input — type a value, press Enter/comma to add, click × to remove ──
// Shared by restricted-list section creation (AddSectionModal) and editing the same
// list later (InlineAdvPanel's Section settings).
function ChipListInput({ values, onChange, placeholder }) {
  const [draft, setDraft] = useStateR("");
  const commit = () => {
    const v = draft.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft("");
  };
  const remove = (v) => onChange(values.filter((x) => x !== v));
  return (
    <div className="chip-list-input">
      <div className="chip-list-input-chips">
        {values.map((v) => (
          <span className="chip-list-chip" key={v}>
            {v}
            <button type="button" onClick={() => remove(v)} aria-label={"Remove " + v}>✕</button>
          </span>
        ))}
        <input
          className="chip-list-input-field"
          value={draft}
          placeholder={values.length === 0 ? placeholder : ""}
          onChange={(e) => {
            if (e.target.value.endsWith(",")) { setDraft(e.target.value.slice(0, -1)); commit(); }
            else setDraft(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); commit(); }
            else if (e.key === "Backspace" && !draft && values.length) remove(values[values.length - 1]);
          }}
          onBlur={commit}
        />
      </div>
    </div>
  );
}

// Renders fill-in-the-blank segments as one plain string, blanks shown as [Label] — used for
// the row badge tooltip and anywhere else a compact, read-only preview of the instruction is needed.
function fillSegmentsPreview(segments) {
  return (segments || []).map(seg => seg.type === "blank" ? "[" + ((seg.label || "").trim() || "blank") + "]" : seg.value).join("");
}

// ── Fill-in-the-blank instruction editor ──────────────────────────────────
// A sequence of text segments and named blanks, e.g. "Patient reports [duration] of [symptom]." —
// the AI fills in each blank from the transcript; everything else pushes exactly as written.
// Shared by section creation (AddSectionModal), editing (InlineAdvPanel's Prompt card), and the
// Edit Template page's Prompt view (modal.jsx).
function FillSegmentsEditor({ segments, onChange }) {
  const segs = segments || [];
  const update = (i, patch) => onChange(segs.map((seg, idx) => (idx === i ? { ...seg, ...patch } : seg)));
  const remove = (i) => onChange(segs.filter((_, idx) => idx !== i));
  const addText = () => onChange([...segs, { type: "text", value: "" }]);
  const addBlank = () => onChange([...segs, { type: "blank", label: "", instruction: "" }]);
  const preview = fillSegmentsPreview(segs);

  return (
    <div className="fill-editor">
      <div className="fill-preview">{preview || "Nothing written yet…"}</div>
      <div className="fill-segments">
        {segs.map((seg, i) => (
          <div className={"fill-segment fill-segment--" + seg.type} key={i}>
            {seg.type === "blank" ? (
              <div className="fill-segment-blank">
                <input className="fill-blank-label" value={seg.label}
                  placeholder="Blank name, e.g. duration"
                  onChange={(e) => update(i, { label: e.target.value })} />
                <input className="fill-blank-instruction" value={seg.instruction}
                  placeholder="What should fill this in? e.g. how long the symptom has lasted"
                  onChange={(e) => update(i, { instruction: e.target.value })} />
              </div>
            ) : (
              <textarea className="fill-segment-text" rows={2} value={seg.value}
                placeholder="Instruction text…"
                onChange={(e) => update(i, { value: e.target.value })} />
            )}
            <button type="button" className="fill-segment-remove" onClick={() => remove(i)} aria-label="Remove">✕</button>
          </div>
        ))}
      </div>
      <div className="fill-add-row">
        <button type="button" className="fill-add-btn" onClick={addText}>+ Add text</button>
        <button type="button" className="fill-add-btn fill-add-btn--blank" onClick={addBlank}>+ Add blank</button>
      </div>
    </div>
  );
}

// ── Mode tag helper ────────────────────────────────────────────────────────
function modeTagClass(mode) {
  if (mode === "Y/N Logic" || mode === "Replace") return "tag--amber";
  if (mode === "Inform" || mode === "Append") return "tag--teal";
  if (mode === "Prepend") return "tag--purple";
  return "tag--slate";
}

// ── Mapping picker (right-side drawer) ────────────────────────────────────

function fieldLabel(f) {
  const labels = window.EHR_FIELD_LABELS || {};
  const raw = f.split(" > ").pop();
  return labels[raw] || labels[f] || raw;
}

function fieldHint(f) {
  const hints = window.EHR_FIELD_HINTS || {};
  const raw = f.split(" > ").pop();
  return hints[raw] || hints[f] || "";
}

function MappingPickerPanel({ sectionId, sectionName, currentEhr, ehr, ehrTemplateName, onSelect, onClose }) {
  const [query, setQuery] = useStateR("");
  const [pendingEhr, setPendingEhr] = useStateR(currentEhr);
  const I = window.Icons;
  const isEcw = ehr === "eCW";

  const confirm = () => {
    onSelect(sectionId, pendingEhr);
  };

  return (
    <>
      <div className="mapping-picker-scrim" onClick={onClose} />
      <div className="mapping-picker" role="dialog" aria-label="Choose EHR mapping">
        <div className="mapping-picker-head">
          <div className="mapping-picker-title-row">
            <span className="mapping-picker-title">EHR Field Mapping</span>
            <button className="mapping-picker-close" onClick={onClose} aria-label="Close"><I.close /></button>
          </div>
          <div className="mapping-picker-sub">Section: <strong>{sectionName}</strong></div>
        </div>

        <div className="mapping-picker-search">
          <input className="mapping-picker-input" placeholder="Search EHR fields…"
            value={query} onChange={e => setQuery(e.target.value)} autoFocus />
        </div>
        <div className="mapping-picker-body">
          {(() => {
            const groups = (window.EHR_FIELDS_BY_SYSTEM && (window.EHR_FIELDS_BY_SYSTEM[ehr] || window.EHR_FIELDS_BY_SYSTEM.default)) || window.EHR_FIELDS || [];
            const filtered = groups.map(g => ({
              ...g,
              fields: g.fields.filter(f => {
                const label = f.split(" > ").pop();
                return label.toLowerCase().includes(query.toLowerCase()) || g.group.toLowerCase().includes(query.toLowerCase());
              }),
            })).filter(g => g.fields.length > 0);
            return filtered.length === 0
              ? <div className="mapping-picker-empty">No fields match "{query}"</div>
              : filtered.map(g => (
                <div key={g.group}>
                  <div className="mapping-picker-group-label">{g.group}</div>
                  {g.fields.map(f => {
                    const isSelected = f === pendingEhr;
                    const hint = fieldHint(f);
                    return (
                      <div key={f}>
                        <button
                          className={"mapping-picker-field" + (isSelected ? " mapping-picker-field--selected" : "")}
                          onClick={() => setPendingEhr(f)}
                        >
                          <span>{fieldLabel(f)}</span>
                          {isSelected && <span className="mapping-picker-check"><I.check /></span>}
                        </button>
                        {hint && <div className="mapping-picker-field-hint">{hint}</div>}
                      </div>
                    );
                  })}
                </div>
              ));
          })()}
        </div>
        <div className="mapping-picker-foot">
          <button className="mapping-picker-clear" onClick={() => setPendingEhr("")}>Clear mapping — remove EHR destination</button>
        </div>

        <div className="mapping-picker-confirm-bar">
          <button className="btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn-teal btn-sm" onClick={confirm}>Save mapping</button>
        </div>
      </div>
    </>
  );
}

// ── Scribe-it picker (separate drawer, eCW only) ────────────────────────────
// Independent from the primary EHR Field Mapping drawer above — a section's Scribe-it
// destination is a second, optional copy target, not part of the main HL7 push. Most sections
// auto-attach (see ecwScribeItAutoMatch) and never need this drawer opened at all; it only
// matters for sections whose Scribe-it category has no equivalent Main Push field.
function ScribeItPickerPanel({ sectionId, sectionName, primaryField, currentScribeIt, isManual, onSelect, onReset, onClose }) {
  const [query, setQuery] = useStateR("");
  const [pending, setPending] = useStateR(currentScribeIt || "");
  const [overriding, setOverriding] = useStateR(isManual);
  const I = window.Icons;
  const autoMatch = window.ecwScribeItAutoMatch(primaryField);

  const confirm = () => onSelect(sectionId, pending);
  const useAuto = () => { onReset(sectionId); onClose(); };

  return (
    <>
      <div className="mapping-picker-scrim" onClick={onClose} />
      <div className="mapping-picker" role="dialog" aria-label="Choose Scribe-it destination">
        <div className="mapping-picker-head">
          <div className="mapping-picker-title-row">
            <span className="mapping-picker-title">Scribe-it Destination</span>
            <button className="mapping-picker-close" onClick={onClose} aria-label="Close"><I.close /></button>
          </div>
          <div className="mapping-picker-sub">Section: <strong>{sectionName}</strong></div>
        </div>

        {autoMatch && !overriding ? (
          <div className="mapping-picker-body">
            <div className="scribeit-auto-box">
              <div className="scribeit-auto-label">Auto-attached</div>
              <div className="scribeit-auto-val">{autoMatch}</div>
              <p>Matches this section's primary field ({fieldLabel(primaryField)}) — no setup needed.</p>
              <button type="button" className="mapping-picker-clear" onClick={() => setOverriding(true)}>
                Choose a different destination instead
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mapping-picker-search">
              <input className="mapping-picker-input" placeholder="Search Scribe-it fields…"
                value={query} onChange={e => setQuery(e.target.value)} autoFocus />
            </div>
            <div className="mapping-picker-body">
              {(() => {
                const groups = window.ECW_SCRIBEIT_FIELDS || [];
                const filtered = groups.map(g => ({
                  ...g,
                  fields: g.fields.filter(f => f.toLowerCase().includes(query.toLowerCase())),
                })).filter(g => g.fields.length > 0);
                return filtered.length === 0
                  ? <div className="mapping-picker-empty">No fields match "{query}"</div>
                  : filtered.map(g => (
                    <div key={g.group}>
                      <div className="mapping-picker-group-label">{g.group}</div>
                      {g.fields.map(f => {
                        const isSelected = f === pending;
                        return (
                          <button key={f}
                            className={"mapping-picker-field" + (isSelected ? " mapping-picker-field--selected" : "")}
                            onClick={() => setPending(f)}
                          >
                            <span>{f.replace(/:$/, "")}</span>
                            {isSelected && <span className="mapping-picker-check"><I.check /></span>}
                          </button>
                        );
                      })}
                    </div>
                  ));
              })()}
            </div>
            <div className="mapping-picker-foot">
              <button className="mapping-picker-clear" onClick={() => setPending("")}>Clear Scribe-it destination</button>
              {autoMatch && (
                <button className="mapping-picker-clear" onClick={useAuto}>Use automatic matching instead</button>
              )}
            </div>
          </>
        )}

        <div className="mapping-picker-confirm-bar">
          <button className="btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          {(!autoMatch || overriding) && (
            <button className="btn-teal btn-sm" onClick={confirm}>Save destination</button>
          )}
        </div>
      </div>
    </>
  );
}

// ── Editable mapping chip (leaf sections) ─────────────────────────────────
function EditableMappingCell({ s, onOpenMapping, isDuplicate, sharedGroup, onReorderShared, ehr, demoOverride }) {
  const I = window.Icons;
  const [orderOpen, setOrderOpen] = useStateR(false);

  const chipBase = {
    display:"flex", alignItems:"center", gap:6, alignSelf:"flex-start",
    background:"#F9FAFB", border:"1px solid #E7E7E9", borderRadius:5,
    padding:"3px 8px", fontSize:12, color:"#444", marginBottom:3,
  };
  const typeTag = {
    fontSize:10, color:"#888", background:"#fff", border:"1px solid #E7E7E9",
    borderRadius:3, padding:"0 4px", marginLeft:2,
  };

  // Item 48: one Marvix section → two EHR fields
  if (demoOverride === "one_to_two") {
    return (
      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        <div style={chipBase}>
          <span style={{fontSize:11,fontWeight:700,color:"#747AF7"}}>①</span>
          <span style={{fontWeight:500}}>Assessment &gt; Clinical Notes</span>
        </div>
        <div style={chipBase}>
          <span style={{fontSize:11,fontWeight:700,color:"#747AF7"}}>②</span>
          <span style={{fontWeight:500}}>Assessment &gt; Free Text</span>
        </div>
        <div style={{fontSize:11.5,color:"#92400e",background:"#fffbeb",border:"1px solid #fde68a",borderRadius:4,padding:"3px 8px",marginTop:2}}>
          ⚠ Push order follows section order in the list — drag to change
        </div>
      </div>
    );
  }

  // Item 49: AMD checkbox + text dual-field
  if (demoOverride === "amd_checkbox") {
    return (
      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        <div style={chipBase}>
          <span style={{fontWeight:500}}>CC Text</span>
          <span style={typeTag}>text</span>
        </div>
        <div style={{...chipBase,background:"#fefce8",border:"1px solid #fde68a",color:"#78350f",marginBottom:0}}>
          <span>☑</span>
          <span style={{fontWeight:500}}>CC Enable</span>
          <span style={{...typeTag,border:"1px solid #fde68a",color:"#92400e"}}>checkbox</span>
        </div>
        <div style={{fontSize:11.5,color:"#888",marginTop:2}}>
          Selected from the same field picker. CC Enable pushes a fixed configured value (e.g. "Yes") whenever this section has any generated content, and an empty string when it doesn't — driven by content presence, not by matching the prompt's output text against allowed values.
        </div>
      </div>
    );
  }

  const isEmpty = !s.ehr;
  const label = isEmpty ? "Not mapped" : fieldLabel(s.ehr);
  return (
    <div className="mapping-cell-wrap">
      <button
        className={"mapping-edit-btn" + (isEmpty ? " mapping-edit-btn--empty" : "")}
        onClick={() => onOpenMapping(s.id)}
        title={isEmpty ? "Click to assign an EHR field" : "Change EHR mapping: " + s.ehr}
      >
        <span className="mapping-edit-label">{label}</span>
        <span className="mapping-edit-ico"><I.pencil /></span>
      </button>
      {isDuplicate && (
        <div className="mapping-shared-wrap">
          <button
            type="button"
            className={"mapping-shared" + (orderOpen ? " mapping-shared--open" : "")}
            onClick={() => setOrderOpen(o => !o)}
            title="Multiple sections push to this field — click to set push order"
          >
            Shared · order {(sharedGroup || []).findIndex(g => g.id === s.id) + 1}/{(sharedGroup || []).length}
          </button>
          {orderOpen && (
            <div className="row-popover mapping-order-popover">
              <div className="row-popover-title">Push order into this field</div>
              <div className="mapping-order-hint">
                {window.COPY.sharedMapping.orderExplanation(fieldLabel(s.ehr))}
              </div>
              {(sharedGroup || []).map((g, i) => (
                <div key={g.id} className={"mapping-order-item" + (g.id === s.id ? " mapping-order-item--self" : "")}>
                  <span className="mapping-order-num">{i + 1}</span>
                  <span className="mapping-order-name">{g.name}</span>
                  <div className="mapping-order-btns">
                    <button type="button" disabled={i === 0} onClick={() => onReorderShared(s.ehr, g.id, -1)} aria-label={"Move " + g.name + " up"}>▲</button>
                    <button type="button" disabled={i === sharedGroup.length - 1} onClick={() => onReorderShared(s.ehr, g.id, 1)} aria-label={"Move " + g.name + " down"}>▼</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Parent mapping cell (mode toggle + chip or label) ─────────────────────
function ParentMappingCell({ s, onOpenMapping, onSetMappingMode, isDuplicate, sharedGroup, onReorderShared, ehr }) {
  const I = window.Icons;
  const mode = s.mappingMode || 'whole';
  const isIndividual = mode === 'individual';
  return (
    <div className="mapping-mode-inline">
      {mode === 'whole' ? (
        <EditableMappingCell s={s} onOpenMapping={onOpenMapping} isDuplicate={isDuplicate} sharedGroup={sharedGroup} onReorderShared={onReorderShared} ehr={ehr} />
      ) : (
        <span className="mapping-individual-note">Subsections mapped individually</span>
      )}
      <button
        type="button"
        className={"mapping-mode-toggle" + (isIndividual ? " mapping-mode-toggle--split" : "")}
        onClick={() => onSetMappingMode(s.id, isIndividual ? 'whole' : 'individual')}
        title={isIndividual
          ? "Each subsection pushes to its own EHR field. Click to combine into one field instead."
          : "Subsections combine into one EHR field. Click to push each one separately instead."}
        aria-label={isIndividual ? "Subsections map separately — click to combine as one" : "Subsections combined as one — click to map each separately"}
      >
        {isIndividual ? <I.unlink /> : <I.link />}
        {isIndividual ? "Split" : "Combined"}
      </button>
    </div>
  );
}

// Template-level settings a section can override. `type: "bool"` renders a toggle,
// everything else a text/number input. Labels/info pulled from window.COPY.templateSettings —
// the single source shared with the Create Template wizard and the Template Settings modal.
function getTemplateOverrideFields(ehrLabel) {
  const C = window.COPY.templateSettings;
  return [
    { key: "separator", type: "text", label: C.separator.label, placeholder: C.separator.placeholder, info: C.separator.info },
    { key: "charLimit", type: "number", label: C.charLimit.label, placeholder: C.charLimit.placeholder, info: C.charLimit.info },
    { key: "pushSubsections", type: "bool", label: C.pushSubsections.label, info: C.pushSubsections.info(ehrLabel) },
    { key: "retainHeadings", type: "bool", label: C.retainHeadings.label, info: C.retainHeadings.info },
    { key: "skipEmptySubsections", type: "bool", label: C.skipEmptySubsections.label, info: C.skipEmptySubsections.info },
    { key: "keepBulletPoints", type: "bool", label: C.keepBulletPoints.label, info: C.keepBulletPoints.info },
  ];
}

function TemplateSettingOverrideRow({ label, type, value, defaultValue, onChange, placeholder, info }) {
  const overridden = value !== undefined;
  const defaultLabel = type === "bool" ? (defaultValue ? "On" : "Off") : (defaultValue || (type === "number" ? "No limit" : "—"));
  return (
    <div className="adv-override-row">
      <div className="adv-override-row-label">
        <span className="adv-field-label">{label}</span>
        {info && <window.InfoTip text={info} />}
      </div>
      <div className="adv-override-row-control">
        {!overridden && <span className="adv-override-default-inline">Template default: {defaultLabel}</span>}
        {type === "bool" ? (
          <div className="adv-seg-row">
            <button type="button" className={"seg-btn" + ((overridden ? value : defaultValue) ? " seg-btn--on" : "")}
              onClick={() => onChange(true)}>On</button>
            <button type="button" className={"seg-btn" + (!(overridden ? value : defaultValue) ? " seg-btn--on" : "")}
              onClick={() => onChange(false)}>Off</button>
          </div>
        ) : (
          <input className="adv-field-input adv-field-input--compact" type={type === "number" ? "number" : "text"}
            min={type === "number" ? "0" : undefined}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value)}
            placeholder={placeholder} />
        )}
      </div>
    </div>
  );
}

// ── Soft-hidden details panel ─────────────────────────────────────────────
// Split into the two tiers from Settings hierarchy — Section settings (the section's own
// content, independent of any EHR mapping) vs. Mapping settings (this mapping row's push
// behavior) — instead of one undifferentiated list. Mapping-specific things like write mode
// and checkbox push don't belong mixed in with section content settings.
function InlineAdvPanel({ s, onUpdate, onDeleteSection, ehr, templateSettings, canEditPrompt }) {
  const I = window.Icons;
  const CC = window.COPY.contentFields;
  const CS = window.COPY.contentSource;
  const ts = templateSettings || window.DEFAULT_TEMPLATE_SETTINGS || {};
  const overrides = s.settingOverrides || {};
  const [overridesOpen, setOverridesOpen] = useStateR(false);
  const ehrCatForOverrides = (window.EHR_CATEGORY || {})[ehr];
  const allOverrideFields = getTemplateOverrideFields((ehrCatForOverrides && ehrCatForOverrides.label) || ehr);
  // Push subsections only means anything where there's no "As one" / "Each separately" choice
  // to begin with (Centricity today) — see CreateTemplateModal's pushSubsectionsApplies.
  const overrideFields = (ehrCatForOverrides && ehrCatForOverrides.autoRoutedPerSection)
    ? allOverrideFields
    : allOverrideFields.filter(f => f.key !== "pushSubsections");
  const overrideCount = Object.keys(overrides).length;
  const setOverride = (key, value) => {
    const next = { ...overrides };
    if (value === undefined) delete next[key];
    else next[key] = value;
    onUpdate(s.id, { settingOverrides: next });
  };
  const hasEhrSpecificMappingSettings = !!s.ehr && (ehr === "AMD" || ehr === "AthenaOne");
  const hasMappingGroup = hasEhrSpecificMappingSettings || (s.sectionType === "restricted" && s.ehr);

  return (
    <div className="adv">
      <div className="adv-tab-body">
        {canEditPrompt && (
        <div className="adv-settings-group">
          <div className="adv-group-label">Prompt</div>
          {s.otherDerivative ? (
            <div className="adv-field">
              <div className="field-label-row">
                <label className="adv-field-label">{CS.derivativeLabel}</label>
                <window.InfoTip text={CS.derivativeInfo} />
              </div>
              <select className="adv-field-input" value={s.otherDerivative}
                onChange={(e) => onUpdate(s.id, { otherDerivative: e.target.value })}>
                {(window.OTHER_DERIVATIVE_OPTIONS || []).map((opt) => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>
            </div>
          ) : s.sectionType === "fillup" ? (
            <div className="adv-field">
              <div className="field-label-row">
                <label className="adv-field-label">{CS.fillupLabel}</label>
                <window.InfoTip text={CS.fillupInfo} />
              </div>
              <window.FillSegmentsEditor segments={s.fillSegments || []}
                onChange={(segs) => onUpdate(s.id, { fillSegments: segs })} />
            </div>
          ) : (
            <div className="adv-field">
              <div className="field-label-row">
                <label className="adv-field-label">
                  {s.sectionType === "restricted" ? CS.instructionLabel : CS.promptLabel}
                </label>
                <window.InfoTip text={s.sectionType === "restricted" ? CS.instructionInfo : CS.promptInfo} />
              </div>
              <textarea
                className="adv-field-textarea"
                rows={3}
                value={s.stylePrompt || ""}
                placeholder={s.sectionType === "restricted" ? CS.instructionPlaceholder : CS.promptPlaceholder}
                onChange={(e) => onUpdate(s.id, { stylePrompt: e.target.value })}
              />
              {s.sectionType === "restricted" && (
                <div style={{ marginTop: 10 }}>
                  <div className="field-label-row">
                    <label className="adv-field-label">{CS.allowedValuesLabel}</label>
                    <window.InfoTip text={CS.allowedValuesInfo} />
                  </div>
                  <window.ChipListInput values={s.allowedValues || []}
                    onChange={(vals) => onUpdate(s.id, { allowedValues: vals })}
                    placeholder={CS.allowedValuesPlaceholder} />
                </div>
              )}
            </div>
          )}
        </div>
        )}

        <div className="adv-settings-group">
        <div className="adv-group-label">Content settings</div>
        <div className="adv-field">
          <div className="field-label-row">
            <label className="adv-field-label">{CC.preLiteral.label}</label>
            <window.InfoTip text={CC.preLiteral.info} />
          </div>
          <input className="adv-field-input" value={s.additionalTextBefore || ""}
            placeholder={CC.preLiteral.placeholder}
            onChange={e => onUpdate(s.id, { additionalTextBefore: e.target.value })} />
        </div>
        <div className="adv-field">
          <div className="field-label-row">
            <label className="adv-field-label">{CC.postLiteral.label}</label>
            <window.InfoTip text={CC.postLiteral.info} />
          </div>
          <input className="adv-field-input" value={s.additionalTextAfter || ""}
            placeholder={CC.postLiteral.placeholder}
            onChange={e => onUpdate(s.id, { additionalTextAfter: e.target.value })} />
        </div>
        <div className="adv-field">
          <div className="field-label-row">
            <label className="adv-field-label">{CC.defaultText.label}</label>
            <window.InfoTip text={CC.defaultText.info} />
          </div>
          <input className="adv-field-input" value={s.defaultNegative || ""}
            placeholder={CC.defaultText.placeholder}
            onChange={e => onUpdate(s.id, { defaultNegative: e.target.value })} />
        </div>
        </div>

        {hasMappingGroup && (
        <div className="adv-settings-group">
        <div className="adv-group-label">Mapping settings</div>

          {s.sectionType === "restricted" && s.ehr && (
            <div className="adv-field">
              <div className="field-label-row">
                <label className="adv-field-label">EHR value mapping</label>
                <window.InfoTip text={`This section's output is always one of ${(s.allowedValues || []).join(" / ")}. Set what gets pushed to ${fieldLabel(s.ehr)} for each.`} />
              </div>
              {(s.allowedValues || []).map((val) => (
                <div className="ehr-value-map-row" key={val}>
                  <span className="ehr-value-map-label">{val}</span>
                  <input className="adv-field-input" value={(s.ehrValueMap || {})[val] || ""}
                    placeholder={"e.g. 1"}
                    onChange={(e) => onUpdate(s.id, { ehrValueMap: { ...(s.ehrValueMap || {}), [val]: e.target.value } })} />
                </div>
              ))}
            </div>
          )}

          {hasEhrSpecificMappingSettings && (
            <>
            {(() => {
              // AthenaOne only fetches-and-prepends for HPI / Physical Exam / ROS — Assessment
              // and Chief Complaint just toggle the EHR API's own append/replace flag, no prepend.
              const athenaFullSupport = ["History of Present Illness", "Physical Exam", "Review of Systems"].includes(s.name);
              const modes = ehr === "AthenaOne" && !athenaFullSupport
                ? ["Append", "Replace"]
                : ["Prepend", "Append", "Replace"];
              const writeModeInfo = "Insert before adds new text ahead of existing content, Insert after adds it below, Overwrite replaces the field entirely."
                + (ehr === "AthenaOne"
                  ? (athenaFullSupport
                    ? " Athena fetches existing content for this section, so Insert before genuinely combines with what's already there."
                    : " Athena doesn't fetch existing content for this section, so there's no Insert before option here. Insert after and Overwrite both just set the EHR's own flag.")
                  : "");
              return (
                <div className="adv-field">
                  <div className="field-label-row">
                    <label className="adv-field-label">Write mode</label>
                    <window.InfoTip text={writeModeInfo} />
                  </div>
                  <div className="adv-seg-row">
                    {modes.map(mode => (
                      <button key={mode}
                        className={"seg-btn" + ((s.config || "Prepend") === mode ? " seg-btn--on" : "")}
                        onClick={() => onUpdate(s.id, { config: mode })}>
                        {{ Prepend: "Insert before", Append: "Insert after", Replace: "Overwrite" }[mode]}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
            </>
          )}
        </div>
        )}

        <div className="adv-settings-group">
          <button type="button" className="adv-override-toggle" onClick={() => setOverridesOpen(o => !o)}>
            {overridesOpen ? "▾" : "▸"} Override template settings for this section
            {overrideCount > 0 && <span className="adv-override-count">{overrideCount}</span>}
          </button>
          {overridesOpen && (
            <div className="adv-override-body">
              {overrideFields.map((f) => (
                <TemplateSettingOverrideRow
                  key={f.key}
                  label={f.label}
                  type={f.type}
                  placeholder={f.placeholder}
                  info={f.info}
                  value={overrides[f.key]}
                  defaultValue={ts[f.key]}
                  onChange={(v) => setOverride(f.key, v)}
                />
              ))}
            </div>
          )}
        </div>

        {canEditPrompt && (
          <button
            type="button"
            className="adv-delete-link"
            onClick={() => {
              const withChildren = s.children && s.children.length
                ? " and all its subsections" : "";
              if (window.confirm('Delete "' + s.name + '"' + withChildren + "? This can't be undone.")) onDeleteSection(s.id);
            }}
          >
            <I.trash /> Delete section
          </button>
        )}
      </div>
    </div>
  );
}

// ── Section row ────────────────────────────────────────────────────────────
function SectionRow({
  s, depth, treePos,
  onToggle, onExpand, onToggleDetails, onDeleteSection,
  onOpenMapping, onOpenScribeMapping, onSetMappingMode, onUpdate,
  onDragStart, onDragEnd, onDragOver, onDrop,
  isDragging, dropBefore, dropAfter, isDuplicate, sharedGroup, onReorderShared,
  parentMappingMode, ehr, templateSettings, onNavigateToMacro, pushIssue, canEditPrompt, dualMappingDemo,
}) {
  const I = window.Icons;
  if (s.ghost) return null;
  const [popover, setPopover] = useStateR(null);

  const hasMacros = !!(s.macros && s.macros.length);
  const hasSums = !!(s.summarizers && s.summarizers.length);

  const togglePopover = (key) => setPopover(p => p === key ? null : key);

  const hasKids = !!(s.children && s.children.length);
  const treeOpen = !!s.expanded;
  const detailsOpen = !!s.detailsExpanded;
  const ehrRowCatObj = (window.EHR_CATEGORY && window.EHR_CATEGORY[ehr]) || {};
  const ehrRowCat = ehrRowCatObj.cat;
  // Centricity is cat 3 (no doctor-facing field picker) but still routes each section to its
  // own ehr_field_name under the hood — autoRoutedPerSection keeps output settings meaningful
  // for it, unlike Cerner/ModMed's true whole-note push.
  const hasOutputSettings = ehrRowCat === 1 || ehrRowCat === 2 || !!ehrRowCatObj.autoRoutedPerSection;
  // Cat 3 EHRs (Centricity, Cerner, ModMed) auto-push the whole note — there's no field for a
  // doctor to pick, so the EHR Mapping column itself is dropped, not just left showing a label.
  const hideMappingCell = ehrRowCat === 3;

  // Dual-mapping demo override — applies to "Assessment & Plan" only
  const demoOverride =
    dualMappingDemo === "one_to_two" && s.name === "Assessment & Plan" ? "one_to_two" :
    dualMappingDemo === "amd_checkbox" && s.name === "Assessment & Plan" ? "amd_checkbox" :
    null;

  const rowCls = [
    "row",
    treeOpen ? "row--open" : "",
    detailsOpen ? "row--details-open" : "",
    depth ? ("row--child row--depth-" + depth) : "",
    !s.enabled ? "row--disabled" : "",
    treePos === "last" ? "row--tree-last" : "",
    isDragging ? "row--dragging" : "",
    dropBefore ? "row--drop-before" : "",
    dropAfter ? "row--drop-after" : "",
  ].filter(Boolean).join(" ");

  const getPos = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
  };

  const inner = (
    <div
      className={rowCls}
      data-screen-label={"section:" + s.name}
      draggable
      onDragStart={() => onDragStart(s.id)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => { e.preventDefault(); onDragOver(s.id, getPos(e)); }}
      onDrop={(e) => { e.preventDefault(); onDrop(s.id, getPos(e)); }}
    >
      <div className="row-head">
        {/* Name */}
        <div className="row-name">
          <span className="grip" title="Drag to reorder"><I.grip /></span>
          <button
            type="button"
            className={"expander expander--tree" + (treeOpen ? " expander--open" : "") + (!hasKids ? " expander--hidden" : "")}
            onClick={() => onExpand(s.id)}
            aria-expanded={treeOpen}
            aria-label={treeOpen ? "Hide subsections" : "Show subsections"}
          >
            <I.chevron />
          </button>
          <div className="namecell">
            <input
              className="sname-input"
              value={s.name}
              onChange={(e) => onUpdate(s.id, { name: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              aria-label="Section header"
            />
            {s.sectionType === "restricted" && (
              <span className="section-type-badge" title={"Restricted list — " + (s.allowedValues || []).join(" / ")}>Restricted list</span>
            )}
            {s.sectionType === "fillup" && (
              <span className="section-type-badge section-type-badge--fillup" title={"Fill-in-the-blank — " + fillSegmentsPreview(s.fillSegments)}>Fill-in-the-blank</span>
            )}
            <div className="name-icons" style={{position:"relative"}}>
              {/* Macros icon */}
              <button type="button"
                className={"row-icon-btn" + (hasMacros ? " row-icon-btn--active" : "") + (popover === "macros" ? " row-icon-btn--open" : "")}
                onClick={() => togglePopover("macros")}
                title={"Connected macros" + (hasMacros ? " (" + s.macros.length + ")" : "")}>
                M{hasMacros && <span className="row-icon-count">{s.macros.length}</span>}
              </button>
              {/* Summarizers icon */}
              <button type="button"
                className={"row-icon-btn" + (hasSums ? " row-icon-btn--active" : "") + (popover === "sums" ? " row-icon-btn--open" : "")}
                onClick={() => togglePopover("sums")}
                title={"Connected summarizers" + (hasSums ? " (" + s.summarizers.length + ")" : "")}>
                S{hasSums && <span className="row-icon-count">{s.summarizers.length}</span>}
              </button>
              {/* Macros popover */}
              {popover === "macros" && (
                <div className="row-popover">
                  <div className="row-popover-title">Macros</div>
                  {(s.macros || []).length === 0
                    ? <div className="row-popover-empty">No macros connected</div>
                    : (s.macros || []).map((m, i) => (
                      <div key={i} className="row-popover-item">
                        {onNavigateToMacro ? (
                          <button type="button" className="row-popover-link"
                            onClick={() => { setPopover(null); onNavigateToMacro(m.name); }}>
                            {m.name}
                          </button>
                        ) : (
                          <span>{m.name}</span>
                        )}
                      </div>
                    ))}
                </div>
              )}
              {/* Summarizers popover */}
              {popover === "sums" && (
                <div className="row-popover">
                  <div className="row-popover-title">Summarizers</div>
                  {(s.summarizers || []).length === 0
                    ? <div className="row-popover-empty">No summarizers connected</div>
                    : (s.summarizers || []).map((m, i) => (
                      <div key={i} className="row-popover-item">
                        <span>{m.name}</span>
                        <span className={"mode-tag " + modeTagClass(m.mode)}>{m.mode}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* EHR Mapping — omitted entirely for cat-3 EHRs (Centricity, Cerner, ModMed): the whole
            note auto-pushes, so there's no field for a doctor to pick, not even a label to show. */}
        {!hideMappingCell && (
        <div className="row-mapping">
          {(() => {
            const cat = window.EHR_CATEGORY && window.EHR_CATEGORY[ehr];
            if (cat && cat.cat === 4) return (
              <span className="mapping-no-push-label">No push</span>
            );
            if (cat && cat.fieldsPending) return (
              <span className="mapping-pending-label" title="Field list not yet confirmed — ops will configure this">Field list pending</span>
            );
            // cat 1 or 2 — normal mapping cell
            return parentMappingMode === 'whole' ? (
              <span className="mapping-inherited">Mapped with parent</span>
            ) : hasKids ? (
              <ParentMappingCell
                s={s}
                onOpenMapping={onOpenMapping}
                onSetMappingMode={onSetMappingMode}
                isDuplicate={isDuplicate}
                sharedGroup={sharedGroup}
                onReorderShared={onReorderShared}
                ehr={ehr}
              />
            ) : (
              <EditableMappingCell s={s} onOpenMapping={onOpenMapping} isDuplicate={isDuplicate} sharedGroup={sharedGroup} onReorderShared={onReorderShared} ehr={ehr} demoOverride={demoOverride} />
            );
          })()}
        </div>
        )}
        {/* eCW secondary column — Scribe-it destination, its own separate drawer */}
        {ehr === "eCW" && (
          <div className="row-ehr-secondary">
            <button className="ehr-scribeit-btn" onClick={() => onOpenScribeMapping(s.id)} title="Edit Scribe-it destination">
              {s.scribeIt
                ? (
                  <span className="ehr-scribeit-chip">
                    {s.scribeIt.replace(/:$/, "")}
                    {!s.scribeItManual && <span className="ehr-scribeit-auto-tag">auto</span>}
                  </span>
                )
                : <span className="ehr-scribeit-empty">Not mapped</span>}
            </button>
          </div>
        )}
        {/* Actions */}
        <div className="row-actions">
          {(hasOutputSettings || canEditPrompt) && (() => {
            const derivativeLabel = s.otherDerivative
              ? (((window.OTHER_DERIVATIVE_OPTIONS || []).find(o => o.key === s.otherDerivative) || {}).label || s.otherDerivative)
              : null;
            const hasFillupContent = (s.fillSegments || []).some(seg => seg.type === "blank" && (seg.label || "").trim());
            const promptMissing = canEditPrompt && !s.otherDerivative
              && (s.sectionType === "fillup" ? !hasFillupContent : !s.stylePrompt);
            const toolboxTitle = detailsOpen
              ? "Hide section settings"
              : derivativeLabel
                ? "Section settings, pulling from " + derivativeLabel
                : promptMissing
                  ? "Section settings, no prompt written yet"
                  : "Section settings";
            return (
              <button
                type="button"
                className={"toolbox" + (detailsOpen ? " toolbox--open" : "")}
                onClick={() => onToggleDetails(s.id)}
                title={toolboxTitle}
                aria-expanded={detailsOpen}
                aria-label={"Section settings for " + s.name}
              >
                <I.sliders />
                {promptMissing && <span className="row-prompt-missing" title="No prompt written yet">!</span>}
              </button>
            );
          })()}
          <Toggle on={s.enabled} onChange={(v) => onToggle(s.id, v)} />
        </div>
      </div>
      {pushIssue && (
        <div className={"row-push-error" + (pushIssue.selfServe ? " row-push-error--selfserve" : "")}>
          <div className="row-push-error-body">
            <span className="row-push-error-icon">{pushIssue.selfServe ? "⚠" : "✕"}</span>
            <span className="row-push-error-msg">{pushIssue.msg}</span>
          </div>
          <div className="row-push-error-actions">
            {(pushIssue.type === "mapping_broken") && hasOutputSettings && (
              <button className="row-push-error-remap" onClick={() => onOpenMapping(s.id)}>Remap</button>
            )}
            {pushIssue.selfServe
              ? <button className="row-push-error-dismiss">Got it</button>
              : <button className="row-push-error-support">Contact support</button>
            }
          </div>
        </div>
      )}
      {detailsOpen && (hasOutputSettings || canEditPrompt) && <InlineAdvPanel s={s} onUpdate={onUpdate} onDeleteSection={onDeleteSection} ehr={ehr} templateSettings={templateSettings} canEditPrompt={canEditPrompt} />}
    </div>
  );

  if (!depth) return inner;
  return (
    <div className={"tree-branch tree-branch--d" + depth}>
      <span className="tree-connector" aria-hidden="true" />
      {inner}
    </div>
  );
}

// ── Render tree recursively ────────────────────────────────────────────────
function renderSectionTree(s, depth, index, siblings, ctx, parentMappingMode) {
  const { handlers, dragId, dropTarget, ehrCounts, ehrGroups, reorderPushGroup, ehr, templateSettings, onNavigateToMacro, pushIssuesByName, canEditPrompt, dualMappingDemo } = ctx;
  const isDragging = dragId === s.id;
  const dropBefore = !!(dropTarget && dropTarget.id === s.id && dropTarget.pos === 'before');
  const dropAfter = !!(dropTarget && dropTarget.id === s.id && dropTarget.pos === 'after');
  const isDuplicate = !s.ghost && !!s.ehr && (ehrCounts[s.ehr] || 0) > 1;
  const isLast = index === siblings.length - 1;

  const nodes = [
    <SectionRow
      key={s.id}
      s={s}
      depth={depth}
      treePos={isLast ? "last" : ""}
      isDragging={isDragging}
      dropBefore={dropBefore}
      dropAfter={dropAfter}
      isDuplicate={isDuplicate}
      sharedGroup={isDuplicate ? (ehrGroups[s.ehr] || []) : null}
      onReorderShared={reorderPushGroup}
      parentMappingMode={parentMappingMode}
      ehr={ehr}
      templateSettings={templateSettings}
      onNavigateToMacro={onNavigateToMacro}
      pushIssue={pushIssuesByName ? pushIssuesByName[s.name] : null}
      canEditPrompt={canEditPrompt}
      dualMappingDemo={dualMappingDemo}
      {...handlers}
    />,
  ];
  if (s.expanded && s.children) {
    s.children.forEach((c, i) => {
      nodes.push(...renderSectionTree(c, depth + 1, i, s.children, ctx, s.mappingMode || 'whole'));
    });
  }
  return nodes;
}

// ── Section table (manages drag state + mapping panel) ────────────────────
function SectionTable({
  sections, ehr, templateSettings, onNavigateToMacro, ehrTemplateName, pushIssues,
  onToggle, onExpand, onToggleDetails, onDeleteSection,
  onReorder, onRemap, onSetScribeIt, onResetScribeItAuto, onSetMappingMode, onUpdate, remapTarget, onRemapTargetHandled,
  canEditPrompt, dualMappingDemo,
}) {
  const { useEffect: useEffectR } = React;
  const [dragState, setDragState] = useStateR(null);   // { id }
  const [dropTarget, setDropTarget] = useStateR(null); // { id, pos }
  const [mappingPanel, setMappingPanel] = useStateR(null);
  const [scribePanel, setScribePanel] = useStateR(null);

  useEffectR(() => {
    if (!remapTarget) return;
    const findByName = (list) => {
      for (const s of list) {
        if (s.name === remapTarget) return s;
        if (s.children) { const hit = findByName(s.children); if (hit) return hit; }
      }
      return null;
    };
    const sec = findByName(sections);
    if (sec) setMappingPanel({ sectionId: sec.id, sectionName: sec.name, currentEhr: sec.ehr || "" });
    onRemapTargetHandled && onRemapTargetHandled();
  }, [remapTarget]);

  // Compute duplicate EHR destinations across all sections — a field with 2+ sections mapped
  // to it needs an explicit push order (which section's text comes first when combined into
  // that one EHR field). ehrGroups holds every section mapped to each field, in their *current*
  // push order — independent of, and not necessarily matching, their order in this note.
  const ehrCounts = {};
  const ehrGroups = {};
  const walkEhr = (list) => {
    for (const s of list) {
      if (!s.ghost && s.ehr) {
        ehrCounts[s.ehr] = (ehrCounts[s.ehr] || 0) + 1;
        (ehrGroups[s.ehr] = ehrGroups[s.ehr] || []).push(s);
      }
      if (s.children) walkEhr(s.children);
    }
  };
  walkEhr(sections);
  Object.keys(ehrGroups).forEach((k) => {
    ehrGroups[k] = ehrGroups[k].slice().sort((a, b) => {
      if (a.pushOrder == null && b.pushOrder == null) return 0;
      if (a.pushOrder == null) return 1;
      if (b.pushOrder == null) return -1;
      return a.pushOrder - b.pushOrder;
    });
  });

  const reorderPushGroup = (fieldVal, id, dir) => {
    const group = ehrGroups[fieldVal] || [];
    const idx = group.findIndex((s) => s.id === id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= group.length) return;
    const reordered = group.slice();
    const tmp = reordered[idx]; reordered[idx] = reordered[j]; reordered[j] = tmp;
    reordered.forEach((s, i) => onUpdate(s.id, { pushOrder: i }));
  };

  const openMapping = (sectionId) => {
    const sec = findSecR(sections, sectionId);
    if (!sec) return;
    setMappingPanel({ sectionId, sectionName: sec.name, currentEhr: sec.ehr || "" });
  };

  const pickEhr = (sectionId, ehrVal) => {
    onRemap(sectionId, ehrVal);
    setMappingPanel(null);
  };

  const openScribeMapping = (sectionId) => {
    const sec = findSecR(sections, sectionId);
    if (!sec) return;
    setScribePanel({
      sectionId, sectionName: sec.name, primaryField: sec.ehr || "",
      currentScribeIt: sec.scribeIt || "", isManual: !!sec.scribeItManual,
    });
  };

  const pickScribeIt = (sectionId, value) => {
    onSetScribeIt(sectionId, value);
    setScribePanel(null);
  };

  const resetScribeItAuto = (sectionId) => {
    onResetScribeItAuto(sectionId);
  };

  const handlers = {
    onToggle,
    onExpand,
    onToggleDetails,
    onDeleteSection,
    onOpenMapping: openMapping,
    onOpenScribeMapping: openScribeMapping,
    onSetMappingMode,
    onUpdate,
    onDragStart: (id) => setTimeout(() => setDragState({ id }), 0),
    onDragEnd: () => { setDragState(null); setDropTarget(null); },
    onDragOver: (id, pos) => {
      if (!dragState || dragState.id === id) return;
      setDropTarget({ id, pos });
    },
    onDrop: (id, pos) => {
      if (dragState) onReorder(dragState.id, id, pos);
      setDragState(null);
      setDropTarget(null);
    },
  };

  const pushIssuesByName = {};
  (pushIssues || []).forEach(pi => { pushIssuesByName[pi.section] = pi; });
  const ctx = { handlers, dragId: dragState ? dragState.id : null, dropTarget, ehrCounts, ehrGroups, reorderPushGroup, ehr, templateSettings, onNavigateToMacro, pushIssuesByName, canEditPrompt, dualMappingDemo };

  const hideMappingCol = ((window.EHR_CATEGORY || {})[ehr] || {}).cat === 3;

  return (
    <div className={"table table-edit" + (ehr ? " table--" + ehr.toLowerCase() : "") + (hideMappingCol ? " table--no-mapping" : "")}>
      <div className="thead">
        <div className="th">Section</div>
        {!hideMappingCol && (
        <div className="th">
          EHR Mapping
          {ehr && <span className="th-ehr-badge">{ehr}</span>}
        </div>
        )}
        {ehr === "eCW" && <div className="th">Scribe-it</div>}
        <div className="th th-enable">Enable</div>
      </div>
      <div className="tbody">
        {sections.map((s, i) => renderSectionTree(s, 0, i, sections, ctx))}
      </div>
      {mappingPanel && (
        <MappingPickerPanel
          sectionId={mappingPanel.sectionId}
          sectionName={mappingPanel.sectionName}
          currentEhr={mappingPanel.currentEhr}
          ehr={ehr}
          ehrTemplateName={ehrTemplateName}
          onSelect={pickEhr}
          onClose={() => setMappingPanel(null)}
        />
      )}
      {scribePanel && (
        <ScribeItPickerPanel
          sectionId={scribePanel.sectionId}
          sectionName={scribePanel.sectionName}
          primaryField={scribePanel.primaryField}
          currentScribeIt={scribePanel.currentScribeIt}
          isManual={scribePanel.isManual}
          onSelect={pickScribeIt}
          onReset={resetScribeItAuto}
          onClose={() => setScribePanel(null)}
        />
      )}
    </div>
  );
}

Object.assign(window, { SectionTable, Toggle, ChipListInput, InfoTip, FillSegmentsEditor, fillSegmentsPreview });
