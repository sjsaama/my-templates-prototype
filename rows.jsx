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

function MappingPickerPanel({ sectionId, sectionName, currentEhr, currentScribeIt, ehr, onSelect, onClose }) {
  const [query, setQuery] = useStateR("");
  const [scribeQuery, setScribeQuery] = useStateR("");
  const [pendingEhr, setPendingEhr] = useStateR(currentEhr);
  const [pendingScribeIt, setPendingScribeIt] = useStateR(currentScribeIt || "");
  const I = window.Icons;
  const isEcw = ehr === "eCW";

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
          {pendingEhr && (
            <div className="mapping-picker-current">
              Primary: <span className="mapping-picker-current-val">{isEcw ? pendingEhr : pendingEhr.split(" > ").pop()}</span>
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
                          return (
                            <button key={f}
                              className={"mapping-picker-field" + (isSelected ? " mapping-picker-field--selected" : "")}
                              onClick={() => setPendingEhr(f)}
                            >
                              <span>{f.split(" > ").pop()}</span>
                              {isSelected && <span className="mapping-picker-check"><I.check /></span>}
                            </button>
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
              <div className="mapping-picker-search">
                <input className="mapping-picker-input" placeholder="Search Scribe-it fields…"
                  value={scribeQuery} onChange={e => setScribeQuery(e.target.value)} />
              </div>
              <div className="mapping-picker-body">
                {(() => {
                  const groups = (window.EHR_FIELDS_BY_SYSTEM && (window.EHR_FIELDS_BY_SYSTEM[ehr] || window.EHR_FIELDS_BY_SYSTEM.default)) || window.EHR_FIELDS || [];
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
                              <span>{f.split(" > ").pop()}</span>
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
                        return (
                          <button key={f}
                            className={"mapping-picker-field" + (isSelected ? " mapping-picker-field--selected" : "")}
                            onClick={() => setPendingEhr(f)}
                          >
                            <span>{f.split(" > ").pop()}</span>
                            {isSelected && <span className="mapping-picker-check"><I.check /></span>}
                          </button>
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
function EditableMappingCell({ s, onOpenMapping, isDuplicate, ehr }) {
  const I = window.Icons;
  const isEmpty = !s.ehr;
  // AMD and eCW show full "X > Y" format; all other EHRs show just the field name.
  const showFullFormat = ehr === "AMD" || ehr === "eCW" || ehr === "Charm";
  const label = isEmpty ? "Not mapped" : (showFullFormat ? s.ehr : s.ehr.split(" > ").pop());
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
        <span className="mapping-warn" title={"Two sections map to this field — last in order wins at push time"}>
          <I.warn />
        </span>
      )}
    </div>
  );
}

// ── Parent mapping cell (mode toggle + chip or label) ─────────────────────
function ParentMappingCell({ s, onOpenMapping, onSetMappingMode, isDuplicate, ehr }) {
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
        <EditableMappingCell s={s} onOpenMapping={onOpenMapping} isDuplicate={isDuplicate} ehr={ehr} />
      ) : (
        <span className="mapping-individual-note">Subsections mapped individually</span>
      )}
    </div>
  );
}

// ── Soft-hidden details panel — 4 tabs ────────────────────────────────────
function InlineAdvPanel({ s, onUpdate, ehr }) {
  const I = window.Icons;
  const [tab, setTab] = useStateAdv("macros");
  const macros = s.macros || [];
  const sums = s.summarizers || [];

  const tabs = [
    { id: "macros",      label: "Macros",      dot: macros.length > 0 },
    { id: "summarizers", label: "Summarizers",  dot: sums.length > 0   },
    { id: "push",        label: "Output & EHR", dot: !!(s.defaultNegative || s.staticStart || s.staticEnd) },
  ];

  return (
    <div className="adv">

      {/* ── Tab strip ── */}
      <div className="adv-tabs">
        {tabs.map(t => (
          <button key={t.id}
            className={"adv-tab" + (tab === t.id ? " adv-tab--active" : "")}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.dot && <span className="adv-tab-dot" />}
          </button>
        ))}
      </div>

      {/* ── Tab: Macros ── */}
      {tab === "macros" && (
        <div className="adv-tab-body">
          <div className="adv-tab-heading">Connected Macros</div>
          {macros.length === 0
            ? <div className="adv-empty">No macros connected to this section.</div>
            : macros.map((m, i) => (
              <div className="adv-item" key={i}>
                <span className="adv-item-name">{m.name}</span>
                <span className={"mode-tag " + modeTagClass(m.mode)}>{m.mode}</span>
              </div>
            ))}
        </div>
      )}

      {/* ── Tab: Summarizers ── */}
      {tab === "summarizers" && (
        <div className="adv-tab-body">
          <div className="adv-tab-heading">Connected Summarizers</div>
          {sums.length === 0
            ? <div className="adv-empty">No summarizers connected to this section.</div>
            : sums.map((m, i) => (
              <div className="adv-item" key={i}>
                <span className="adv-item-name">{m.name}</span>
                <span className={"mode-tag " + modeTagClass(m.mode)}>{m.mode}</span>
              </div>
            ))}
        </div>
      )}

      {/* ── Tab: Output & EHR ── */}
      {tab === "push" && (
        <div className="adv-tab-body">
          <div className="adv-tab-heading">Output &amp; EHR</div>
          {ehr === "AMD" && s.ehr && (() => {
            const limit = (window.AMD_CHAR_LIMITS || {})[s.ehr];
            if (!limit) return null;
            return (
              <div className="adv-char-limit">
                <span className="adv-char-limit-label">AMD field limit</span>
                <span className="adv-char-limit-val">{limit.toLocaleString()} characters</span>
                <span className="adv-char-limit-hint">This EHR field truncates content beyond this length</span>
              </div>
            );
          })()}
          {ehr === "AMD" && (
            <div className="adv-field">
              <label className="adv-field-label">Push mode</label>
              <div className="adv-seg-row">
                {["Prepend", "Append", "Replace"].map(mode => (
                  <button
                    key={mode}
                    className={"seg-btn" + ((s.config || "Prepend") === mode ? " seg-btn--on" : "")}
                    onClick={() => onUpdate(s.id, { config: mode })}
                  >
                    {{ Prepend: "Insert before", Append: "Insert after", Replace: "Overwrite" }[mode]}
                  </button>
                ))}
              </div>
              <div className="adv-field-hint">Controls how this section's content is written to the AMD EHR field.</div>
            </div>
          )}
          <div className="adv-field">
            <label className="adv-field-label">Default Negative</label>
            <textarea className="adv-field-textarea" value={s.defaultNegative || ""}
              placeholder="Fallback text when nothing was captured for this section…"
              rows={2} onChange={e => onUpdate(s.id, { defaultNegative: e.target.value })} />
            <div className="adv-field-hint">Shown when no content was captured for this section during the visit.</div>
          </div>
          <div className="adv-field">
            <label className="adv-field-label">Static Start</label>
            <textarea className="adv-field-textarea" value={s.staticStart || ""}
              placeholder="Fixed text prepended to this section…"
              rows={2} onChange={e => onUpdate(s.id, { staticStart: e.target.value })} />
            <div className="adv-field-hint">Fixed text added before the section. The model never rewrites it.</div>
          </div>
          <div className="adv-field">
            <label className="adv-field-label">Static End</label>
            <textarea className="adv-field-textarea" value={s.staticEnd || ""}
              placeholder="Fixed text appended to this section…"
              rows={2} onChange={e => onUpdate(s.id, { staticEnd: e.target.value })} />
            <div className="adv-field-hint">Fixed text added after the section. The model never rewrites it.</div>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Section row ────────────────────────────────────────────────────────────
function SectionRow({
  s, depth, treePos,
  onToggle, onExpand, onToggleDetails,
  onOpenMapping, onSetMappingMode, onUpdate,
  onDragStart, onDragEnd, onDragOver, onDrop,
  isDragging, dropBefore, dropAfter, isDuplicate,
  parentMappingMode, ehr,
}) {
  const I = window.Icons;
  if (s.ghost) return null;
  
  const hasKids = !!(s.children && s.children.length);
  const treeOpen = !!s.expanded;
  const detailsOpen = !!s.detailsExpanded;

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
            <span className="sname">{s.name}</span>
          </div>
        </div>
        {/* EHR Mapping */}
        <div className="row-mapping">
          {parentMappingMode === 'whole' ? (
            <span className="mapping-inherited">Mapped with parent</span>
          ) : hasKids ? (
            <ParentMappingCell
              s={s}
              onOpenMapping={onOpenMapping}
              onSetMappingMode={onSetMappingMode}
              isDuplicate={isDuplicate}
              ehr={ehr}
            />
          ) : (
            <EditableMappingCell s={s} onOpenMapping={onOpenMapping} isDuplicate={isDuplicate} ehr={ehr} />
          )}
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
          <button
            type="button"
            className={"toolbox" + (detailsOpen ? " toolbox--open" : "")}
            onClick={() => onToggleDetails(s.id)}
            title={detailsOpen ? "Hide Marvix configuration" : "View Marvix configuration"}
            aria-expanded={detailsOpen}
            aria-label={"Marvix configuration for " + s.name}
          >
            <I.sliders />
          </button>
          <Toggle on={s.enabled} onChange={(v) => onToggle(s.id, v)} />
        </div>
      </div>
      {detailsOpen && <InlineAdvPanel s={s} onUpdate={onUpdate} ehr={ehr} />}
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
  const { handlers, dragId, dropTarget, ehrCounts, ehr } = ctx;
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
      parentMappingMode={parentMappingMode}
      ehr={ehr}
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
function SectionTable({ sections, ehr, onToggle, onExpand, onToggleDetails, onReorder, onRemap, onSetMappingMode, onUpdate }) {
  const [dragState, setDragState] = useStateR(null);   // { id }
  const [dropTarget, setDropTarget] = useStateR(null); // { id, pos }
  const [mappingPanel, setMappingPanel] = useStateR(null);

  // Compute duplicate EHR destinations across all sections
  const ehrCounts = {};
  const walkEhr = (list) => {
    for (const s of list) {
      if (!s.ghost && s.ehr) ehrCounts[s.ehr] = (ehrCounts[s.ehr] || 0) + 1;
      if (s.children) walkEhr(s.children);
    }
  };
  walkEhr(sections);

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

  const ctx = { handlers, dragId: dragState ? dragState.id : null, dropTarget, ehrCounts, ehr };

  return (
    <div className={"table table-edit" + (ehr ? " table--" + ehr.toLowerCase() : "")}>
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
          onSelect={pickEhr}
          onClose={() => setMappingPanel(null)}
        />
      )}
    </div>
  );
}

Object.assign(window, { SectionTable, Toggle });
