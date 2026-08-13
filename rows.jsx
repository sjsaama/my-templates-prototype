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

function MappingPickerPanel({ sectionId, sectionName, currentEhr, currentScribeIt, ehr, ehrTemplateName, onSelect, onClose }) {
  const [query, setQuery] = useStateR("");
  const [scribeQuery, setScribeQuery] = useStateR("");
  const [pendingEhr, setPendingEhr] = useStateR(currentEhr);
  const [pendingScribeIt, setPendingScribeIt] = useStateR(currentScribeIt || "");
  const I = window.Icons;
  const isEcw = ehr === "eCW";
  const ehrCat = window.EHR_CATEGORY && window.EHR_CATEGORY[ehr];
  const isFixedList = ehrCat && ehrCat.fieldSource === "fixed";
  const isCharm = ehr === "Charm";
  const isNereg = ehr === "Nereg";
  // Real check is on the backend ehr_template_name prefix — the mock's synthetic template name
  // just needs to contain "soap" to simulate it. See FIELD_LIST_REFERENCE.md — Cat 2 — CharmHealth.
  const isSoapMode = isCharm && (ehrTemplateName || "").toLowerCase().includes("soap");

  const confirm = () => {
    onSelect(sectionId, pendingEhr, isEcw ? pendingScribeIt : undefined);
  };

  return (
    <>
      <div className="mapping-picker-scrim" onClick={onClose} />
      <div className={"mapping-picker" + (isEcw ? " mapping-picker--ecw" : "")} role="dialog" aria-label="Choose EHR mapping">
        <div className="mapping-picker-head">
          <div className="mapping-picker-title-row">
            <span className="mapping-picker-title">EHR Field Mapping</span>
            <button className="mapping-picker-close" onClick={onClose} aria-label="Close"><I.close /></button>
          </div>
          <div className="mapping-picker-sub">Section: <strong>{sectionName}</strong></div>
          {isFixedList && !isEcw && (
            <div className="mapping-picker-fixed-notice">
              Fixed list — defined by {ehr}'s API
            </div>
          )}
          {isEcw && (
            <div className="mapping-picker-fixed-notice">
              Two independent push paths. Main pushes via HL7 ORU and can fail silently after
              upload — ECW processes it asynchronously with no callback. Scribe-it (right) is a
              manual copy aid — nothing is pushed automatically.
            </div>
          )}
          {isCharm && (
            <div className="mapping-picker-fixed-notice">
              {isSoapMode
                ? "SOAP mode — every field except Chief Complaint is identified by a numeric ID from your practice's Charm SOAP template; the names below stand in for those. Chief Complaint always uses the fixed \"chief_complaints\" field."
                : "Default mode — pick from Charm's fixed keyword list below. Any other value still pushes but won't match existing content for append/prepend."}
            </div>
          )}
          {isCharm && (
            <div className="mapping-picker-charm-notice">
              <span>Field list can't be refreshed — remap from the list below, or contact support if your EHR template changed.</span>
              <button className="mapping-picker-support-btn" onClick={() => {}}>Contact support</button>
            </div>
          )}
          {isNereg && (
            <div className="mapping-picker-fixed-notice">
              No auto-mapping — a field left blank here is skipped entirely; nothing is inferred
              from the section name. Push is all-or-nothing, so a rejection from Nereg won't say
              which field caused it.
            </div>
          )}
          {pendingEhr && (
            <div className="mapping-picker-current">
              Primary: <span className="mapping-picker-current-val">{isEcw ? pendingEhr : fieldLabel(pendingEhr)}</span>
            </div>
          )}
        </div>

        {isEcw ? (
          <div className="mapping-picker-ecw-body">
            <div className="mapping-picker-ecw-col">
              <div className="mapping-picker-ecw-col-label">Primary destination</div>
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
                <button className="mapping-picker-clear" onClick={() => setPendingEhr("")}>Clear primary mapping</button>
              </div>
            </div>

            <div className="mapping-picker-ecw-col mapping-picker-ecw-col--scribe">
              <div className="mapping-picker-ecw-col-label">
                Also push to Scribe-it
                <span className="mapping-picker-optional">optional</span>
              </div>
              <div className="adv-field-hint" style={{ padding: "0 14px 8px" }}>
                Must match the shortcut command's exact text, colon included.
              </div>
              <div className="mapping-picker-search">
                <input className="mapping-picker-input" placeholder="Search Scribe-it fields…"
                  value={scribeQuery} onChange={e => setScribeQuery(e.target.value)} />
              </div>
              <div className="mapping-picker-body">
                {(() => {
                  const groups = window.ECW_SCRIBEIT_FIELDS || [];
                  const filtered = groups.map(g => ({
                    ...g,
                    fields: g.fields.filter(f => {
                      const label = f.split(" > ").pop();
                      return label.toLowerCase().includes(scribeQuery.toLowerCase()) || g.group.toLowerCase().includes(scribeQuery.toLowerCase());
                    }),
                  })).filter(g => g.fields.length > 0);
                  return filtered.length === 0
                    ? <div className="mapping-picker-empty">No fields match "{scribeQuery}"</div>
                    : filtered.map(g => (
                      <div key={g.group}>
                        <div className="mapping-picker-group-label">{g.group}</div>
                        {g.fields.map(f => {
                          const isSelected = f === pendingScribeIt;
                          return (
                            <button key={f}
                              className={"mapping-picker-field" + (isSelected ? " mapping-picker-field--selected" : "")}
                              onClick={() => setPendingScribeIt(f)}
                            >
                              <span>{f}</span>
                              {isSelected && <span className="mapping-picker-check"><I.check /></span>}
                            </button>
                          );
                        })}
                      </div>
                    ));
                })()}
              </div>
              <div className="mapping-picker-foot">
                <button className="mapping-picker-clear" onClick={() => setPendingScribeIt("")}>Clear Scribe-it destination</button>
              </div>
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}

        <div className="mapping-picker-confirm-bar">
          <button className="btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn-teal btn-sm" onClick={confirm}>Save mapping</button>
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
                This is the order these sections' text is combined when pushed to {fieldLabel(s.ehr)} — independent of where they appear in this note; the two orders can be different.
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
  const mode = s.mappingMode || 'whole';
  return (
    <div className="mapping-mode-wrap">
      <div className="mapping-mode-seg">
        <button
          className={"mapping-mode-btn" + (mode === 'whole' ? " mapping-mode-btn--on" : "")}
          onClick={() => onSetMappingMode(s.id, 'whole')}
          title="Push entire section (with all subsections) to one EHR field"
        >As one</button>
        <button
          className={"mapping-mode-btn" + (mode === 'individual' ? " mapping-mode-btn--on" : "")}
          onClick={() => onSetMappingMode(s.id, 'individual')}
          title="Each subsection maps to its own EHR field independently"
        >Each separately</button>
      </div>
      {mode === 'whole' ? (
        <EditableMappingCell s={s} onOpenMapping={onOpenMapping} isDuplicate={isDuplicate} sharedGroup={sharedGroup} onReorderShared={onReorderShared} ehr={ehr} />
      ) : (
        <span className="mapping-individual-note">Subsections mapped individually</span>
      )}
    </div>
  );
}

// ── Soft-hidden details panel ─────────────────────────────────────────────
// Split into the two tiers from Settings hierarchy — Section settings (the section's own
// content, independent of any EHR mapping) vs. Mapping settings (this mapping row's push
// behavior) — instead of one undifferentiated list. Mapping-specific things like write mode
// and checkbox push don't belong mixed in with section content settings.
function InlineAdvPanel({ s, onUpdate, ehr }) {
  const I = window.Icons;
  const hasEhrSpecificMappingSettings = !!s.ehr && (ehr === "AMD" || ehr === "AthenaOne");
  const amdCharLimit = ehr === "AMD" && s.ehr ? (window.AMD_CHAR_LIMITS || {})[s.ehr] : null;
  const amdFields = ehr === "AMD"
    ? (((window.EHR_FIELDS_BY_SYSTEM || {}).AMD || []).flatMap((g) => g.fields).filter((f) => f !== s.ehr))
    : [];

  return (
    <div className="adv">
      <div className="adv-tab-body">
        <div className="adv-group-label">Section settings</div>
        <div className="adv-field">
          <label className="adv-field-label">Additional text</label>
          <div className="adv-additional-row">
            <select className="adv-additional-placement"
              value={s.additionalPlacement || "before"}
              onChange={e => onUpdate(s.id, { additionalPlacement: e.target.value })}>
              <option value="before">Before content</option>
              <option value="after">After content</option>
            </select>
            <input className="adv-field-input adv-field-input--grow" value={s.additionalText || ""}
              placeholder="Fixed text added around section content on push…"
              onChange={e => onUpdate(s.id, { additionalText: e.target.value })} />
          </div>
        </div>
        <div className="adv-field">
          <label className="adv-field-label">Default negative</label>
          <input className="adv-field-input" value={s.defaultNegative || ""}
            placeholder='e.g. "Not reported" or "None"'
            onChange={e => onUpdate(s.id, { defaultNegative: e.target.value })} />
        </div>

        <div className="adv-group-label adv-group-label--mapping">Mapping settings{s.ehr ? " — for " + fieldLabel(s.ehr) : ""}</div>

          <div className="adv-field adv-checkbox-field" style={{ marginTop: 0 }}>
            <label className="adv-checkbox-toggle-label">
              <Toggle on={!!s.otherDerivative} onChange={(v) => onUpdate(s.id, {
                otherDerivative: v ? ((window.OTHER_DERIVATIVE_OPTIONS || [])[0]?.key || "") : null,
                stylePrompt: v ? "" : s.stylePrompt,
              })} />
              <span>Pull from another derivative instead of a prompt</span>
            </label>
            <div className="adv-field-hint">
              A direct pass-through, not a merge: whatever this derivative generates is pushed straight to this section's mapped field, as-is — no prompt, no combining logic.
            </div>
            {s.otherDerivative && (
              <select className="adv-field-input" style={{ marginTop: 8 }} value={s.otherDerivative} onChange={(e) => onUpdate(s.id, { otherDerivative: e.target.value })}>
                {(window.OTHER_DERIVATIVE_OPTIONS || []).map((opt) => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>
            )}
          </div>

          {hasEhrSpecificMappingSettings && (
            <>
            {amdCharLimit && (
              <div className="adv-char-limit">
                <span className="adv-char-limit-label">AMD field limit (reference)</span>
                <span className="adv-char-limit-val">{amdCharLimit.toLocaleString()} characters</span>
              </div>
            )}

            {(() => {
              // AthenaOne only fetches-and-prepends for HPI / Physical Exam / ROS — Assessment
              // and Chief Complaint just toggle the EHR API's own append/replace flag, no prepend.
              const athenaFullSupport = ["History of Present Illness", "Physical Exam", "Review of Systems"].includes(s.name);
              const modes = ehr === "AthenaOne" && !athenaFullSupport
                ? ["Append", "Replace"]
                : ["Prepend", "Append", "Replace"];
              return (
                <div className="adv-field adv-field--push-mode">
                  <label className="adv-field-label">Write mode</label>
                  <div className="adv-seg-row">
                    {modes.map(mode => (
                      <button key={mode}
                        className={"seg-btn" + ((s.config || "Prepend") === mode ? " seg-btn--on" : "")}
                        onClick={() => onUpdate(s.id, { config: mode })}>
                        {{ Prepend: "Insert before", Append: "Insert after", Replace: "Overwrite" }[mode]}
                      </button>
                    ))}
                  </div>
                  {ehr === "AthenaOne" && (
                    <div className="adv-field-hint">
                      {athenaFullSupport
                        ? "Athena fetches existing content for this section, so Insert before genuinely combines with what's already there."
                        : "Athena doesn't fetch existing content for this section — no Insert before option, Insert after / Overwrite toggle the EHR's own flag."}
                    </div>
                  )}
                </div>
              );
            })()}

            {ehr === "AMD" && (
              <div className="adv-field adv-checkbox-field">
                <label className="adv-checkbox-toggle-label">
                  <Toggle on={!!s.checkboxField} onChange={(v) => onUpdate(s.id, { checkboxField: v ? (amdFields[0] || "") : "" })} />
                  <span>Also push as a checkbox to another field</span>
                </label>
                <div className="adv-field-hint">
                  Pushes a fixed value when this section has any generated content, empty otherwise — content-presence-driven, not a match against the prompt's output text. One section, two independent mapping rows.
                </div>
                {s.checkboxField && (
                  <div className="adv-checkbox-config">
                    <select className="adv-field-input" value={s.checkboxField} onChange={(e) => onUpdate(s.id, { checkboxField: e.target.value })}>
                      {amdFields.map((f) => <option key={f} value={f}>{fieldLabel(f)}</option>)}
                    </select>
                    <input className="adv-field-input" value={s.checkboxValue || "Yes"}
                      placeholder='Value to push, e.g. "Yes"'
                      onChange={(e) => onUpdate(s.id, { checkboxValue: e.target.value })} />
                  </div>
                )}
              </div>
            )}
            </>
          )}
      </div>
    </div>
  );
}

// ── Section row ────────────────────────────────────────────────────────────
function SectionRow({
  s, depth, treePos,
  onToggle, onExpand, onToggleDetails, onTogglePrompt, onDeleteSection,
  onOpenMapping, onSetMappingMode, onUpdate,
  onDragStart, onDragEnd, onDragOver, onDrop,
  isDragging, dropBefore, dropAfter, isDuplicate, sharedGroup, onReorderShared,
  parentMappingMode, ehr, pushIssue, canEditPrompt, dualMappingDemo,
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
  const promptOpen = !!s.promptOpen;

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
            <div className="name-icons" style={{position:"relative"}}>
              {/* Macros icon */}
              <button type="button"
                className={"row-icon-btn" + (hasMacros ? " row-icon-btn--active" : "") + (popover === "macros" ? " row-icon-btn--open" : "")}
                onClick={() => togglePopover("macros")}
                title="Connected macros">
                M{hasMacros && <span className="row-icon-dot" />}
              </button>
              {/* Summarizers icon */}
              <button type="button"
                className={"row-icon-btn" + (hasSums ? " row-icon-btn--active" : "") + (popover === "sums" ? " row-icon-btn--open" : "")}
                onClick={() => togglePopover("sums")}
                title="Connected summarizers">
                S{hasSums && <span className="row-icon-dot" />}
              </button>
              {/* Macros popover */}
              {popover === "macros" && (
                <div className="row-popover">
                  <div className="row-popover-title">Macros</div>
                  {(s.macros || []).length === 0
                    ? <div className="row-popover-empty">No macros connected</div>
                    : (s.macros || []).map((m, i) => (
                      <div key={i} className="row-popover-item">
                        <span>{m.name}</span>
                        <span className={"mode-tag " + modeTagClass(m.mode)}>{m.mode}</span>
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
        {/* EHR Mapping */}
        <div className="row-mapping">
          {(() => {
            const cat = window.EHR_CATEGORY && window.EHR_CATEGORY[ehr];
            if (cat && cat.cat === 3) return (
              <span className="mapping-auto-label" title={cat.autoMsg}>{cat.autoMsg}</span>
            );
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
        {/* eCW secondary column — Scribe-it destination */}
        {ehr === "eCW" && (
          <div className="row-ehr-secondary">
            <button className="ehr-scribeit-btn" onClick={() => onOpenMapping(s.id)} title="Edit Scribe-it mapping">
              {s.scribeIt
                ? <span className="ehr-scribeit-chip">{s.scribeIt}</span>
                : <span className="ehr-scribeit-empty">Not mapped</span>}
            </button>
          </div>
        )}
        {/* Actions */}
        <div className="row-actions">
          {canEditPrompt && (
            <button
              type="button"
              className={"row-icon-btn row-icon-btn--prompt" + ((s.stylePrompt || s.otherDerivative) ? " row-icon-btn--active" : "") + (promptOpen ? " row-icon-btn--open" : "")}
              onClick={() => onTogglePrompt(s.id)}
              title={promptOpen ? "Hide" : (s.otherDerivative ? "Change derivative source" : "Edit prompt")}
              aria-expanded={promptOpen}
            >
              {s.otherDerivative
                ? "📎 " + (((window.OTHER_DERIVATIVE_OPTIONS || []).find(o => o.key === s.otherDerivative) || {}).label || s.otherDerivative)
                : "Prompt"}
              {!s.stylePrompt && !s.otherDerivative && <span className="row-prompt-missing" title="No prompt written yet">!</span>}
            </button>
          )}
          {s.custom && (
            <button
              type="button"
              className="row-icon-btn row-icon-btn--danger"
              onClick={() => {
                if (window.confirm('Delete "' + s.name + '"? This can\'t be undone.')) onDeleteSection(s.id);
              }}
              title="Delete section"
              aria-label={"Delete " + s.name}
            >
              <I.trash />
            </button>
          )}
          {hasOutputSettings && (
            <button
              type="button"
              className={"toolbox" + (detailsOpen ? " toolbox--open" : "")}
              onClick={() => onToggleDetails(s.id)}
              title={detailsOpen ? "Hide output settings" : "Output settings"}
              aria-expanded={detailsOpen}
              aria-label={"Output settings for " + s.name}
            >
              <I.sliders />
            </button>
          )}
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
      {promptOpen && !s.otherDerivative && (
        <div className="row-prompt-panel">
          <label className="row-prompt-label">
            Prompt
            <span className="row-prompt-label-hint">— tells the AI what to write in this section</span>
          </label>
          <textarea
            className="row-prompt-textarea"
            rows={3}
            value={s.stylePrompt || ""}
            placeholder="e.g. Summarize the patient's chief complaint in one or two sentences, in their own words where possible."
            onChange={(e) => onUpdate(s.id, { stylePrompt: e.target.value })}
          />
        </div>
      )}
      {promptOpen && s.otherDerivative && (
        <div className="row-prompt-panel">
          <div className="adv-field-hint">
            This section pulls from a derivative instead of a prompt — set which one under Output settings <I.sliders />, in Mapping settings. Switch it back to a written prompt from there too.
          </div>
        </div>
      )}
      {detailsOpen && hasOutputSettings && <InlineAdvPanel s={s} onUpdate={onUpdate} ehr={ehr} />}
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

// ── "Add Subsection" ghost row ─────────────────────────────────────────────
function AddSubsectionGhostRow({ depth, onClick }) {
  const I = window.Icons;
  return (
    <div className={"tree-branch tree-branch--d" + depth}>
      <span className="tree-connector" aria-hidden="true" />
      <button type="button" className="add-subsection-btn" onClick={onClick}>
        <I.plus /> Add subsection
      </button>
    </div>
  );
}

// ── Render tree recursively ────────────────────────────────────────────────
function renderSectionTree(s, depth, index, siblings, ctx, parentMappingMode) {
  const { handlers, dragId, dropTarget, ehrCounts, ehrGroups, reorderPushGroup, ehr, pushIssuesByName, onAddSection, canEditPrompt, dualMappingDemo } = ctx;
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
    if (onAddSection && !s.ghost) {
      nodes.push(
        <AddSubsectionGhostRow key={s.id + "_addsub"} depth={depth + 1} onClick={() => onAddSection(s.id)} />
      );
    }
  }
  return nodes;
}

// ── Section table (manages drag state + mapping panel) ────────────────────
function SectionTable({
  sections, ehr, ehrTemplateName, pushIssues,
  onToggle, onExpand, onToggleDetails, onTogglePrompt, onDeleteSection,
  onReorder, onRemap, onSetMappingMode, onUpdate, remapTarget, onRemapTargetHandled,
  onAddSection, canEditPrompt, dualMappingDemo,
}) {
  const { useEffect: useEffectR } = React;
  const [dragState, setDragState] = useStateR(null);   // { id }
  const [dropTarget, setDropTarget] = useStateR(null); // { id, pos }
  const [mappingPanel, setMappingPanel] = useStateR(null);

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
    if (sec) setMappingPanel({ sectionId: sec.id, sectionName: sec.name, currentEhr: sec.ehr || "", currentScribeIt: sec.scribeIt || "" });
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
    setMappingPanel({ sectionId, sectionName: sec.name, currentEhr: sec.ehr || "", currentScribeIt: sec.scribeIt || "" });
  };

  const pickEhr = (sectionId, ehrVal, scribeIt) => {
    onRemap(sectionId, ehrVal, scribeIt);
    setMappingPanel(null);
  };

  const handlers = {
    onToggle,
    onExpand,
    onToggleDetails,
    onTogglePrompt,
    onDeleteSection,
    onOpenMapping: openMapping,
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
  const ctx = { handlers, dragId: dragState ? dragState.id : null, dropTarget, ehrCounts, ehrGroups, reorderPushGroup, ehr, pushIssuesByName, onAddSection, canEditPrompt, dualMappingDemo };

  // ── Add Section availability — varies by EHR category ──
  const ehrCat = (window.EHR_CATEGORY && window.EHR_CATEGORY[ehr]) || {};
  const isCat1 = ehrCat.cat === 1;
  const isCat2 = ehrCat.cat === 2;
  // Only count fields actually in *this* EHR's field list — sections mapped under a
  // previously-selected EHR (or seeded demo data) shouldn't count against a different EHR's cap.
  const validFieldSet = new Set(
    ((window.EHR_FIELDS_BY_SYSTEM && window.EHR_FIELDS_BY_SYSTEM[ehr]) || []).flatMap((g) => g.fields)
  );
  const usedFieldCount = Object.keys(ehrCounts).filter((f) => validFieldSet.has(f)).length;
  const totalFieldCount = window.ehrFieldTotalCount ? window.ehrFieldTotalCount(ehr) : 0;
  const capReached = (isCat1 || isCat2) && (totalFieldCount === 0 || usedFieldCount >= totalFieldCount);

  let addDisabledReason = "";
  if (capReached && ehrCat.fieldsPending) addDisabledReason = (ehrCat.label || ehr) + "'s field list isn't confirmed yet — check with ops";
  else if (capReached) addDisabledReason = "All available " + (ehrCat.label || ehr) + " fields are already used";

  return (
    <div className={"table table-edit" + (ehr ? " table--" + ehr.toLowerCase() : "")}>
      {isCat2 && canEditPrompt && (
        <div className="ehr-tpl-banner">
          <div className="ehr-tpl-banner-left">
            <span className="ehr-tpl-banner-label">{ehrCat.label || ehr} template</span>
            {ehrTemplateName
              ? <span className="ehr-tpl-banner-value">{ehrTemplateName} — fields below are fetched from this template</span>
              : <span className="ehr-tpl-banner-unset">Not set — this template was created before EHR template selection existed</span>}
          </div>
        </div>
      )}
      <div className="section-toolbar">
        {onAddSection && (
          <button
            type="button"
            className="btn-outline btn-sm add-section-btn"
            disabled={!!addDisabledReason}
            title={addDisabledReason || undefined}
            onClick={() => onAddSection(null)}
          >
            + Add section
          </button>
        )}
        <span className="section-toolbar-legend">M = macro connected · S = summarizer connected</span>
        {isCat1 && totalFieldCount > 0 && (
          <span className="section-toolbar-hint">{usedFieldCount}/{totalFieldCount} {ehrCat.label || ehr} fields used</span>
        )}
      </div>
      <div className="thead">
        <div className="th">Section</div>
        <div className="th">
          EHR Mapping
          {ehr && <span className="th-ehr-badge">{ehr}</span>}
        </div>
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
          currentScribeIt={mappingPanel.currentScribeIt}
          ehr={ehr}
          ehrTemplateName={ehrTemplateName}
          onSelect={pickEhr}
          onClose={() => setMappingPanel(null)}
        />
      )}
    </div>
  );
}

Object.assign(window, { SectionTable, Toggle });
