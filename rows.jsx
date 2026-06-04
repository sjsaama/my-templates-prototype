function MappingCell({ s }) {
  return (
    <span className="info-wrap mapping-ro">
      <span className="chip chip--mono chip--ehr" title={s.ehr}>{s.ehr}</span>
      <span className="tooltip">EHR mapping is managed by Marvix.</span>
    </span>
  );
}

// rows.jsx — section table, rows, badges, inline advanced panel
const { useState: useStateR } = React;

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

function ConfigDropdown({ value, onChange }) {
  const [open, setOpen] = useStateR(false);
  const opts = window.CONFIG_OPTIONS;
  return (
    <div className="dd">
      <button className="chip chip--mono dd-trigger" onClick={() => setOpen((o) => !o)}>
        {value}
        <span className="dd-caret">{window.Icons.chevron({ width: 14, height: 14 })}</span>
      </button>
      {open && (
        <>
          <div className="dd-scrim" onClick={() => setOpen(false)} />
          <div className="dd-menu">
            {opts.map((o) => (
              <button key={o} className={"dd-opt" + (o === value ? " dd-opt--sel" : "")}
                onClick={() => { onChange(o); setOpen(false); }}>{o}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function EntityControls({ entities, onEntity }) {
  if (!entities || !entities.length) return null;
  const segments = entities.filter((e) => e.type === "segment");
  const checks = entities.filter((e) => e.type === "checkbox");
  return (
    <div className="entity-panel">
      <div className="entity-segments">
        {segments.map((e) => (
          <div className="entity-group" key={e.id}>
            <span className="entity-label">{e.label}</span>
            <div className="seg-btns">
              {e.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={"seg-btn" + (e.value === opt ? " seg-btn--on" : "")}
                  onClick={() => onEntity(e.id, opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {checks.length > 0 && (
        <div className="entity-checks">
          {checks.map((e) => (
            <label className="entity-check" key={e.id}>
              <input type="checkbox" checked={!!e.value} onChange={(ev) => onEntity(e.id, ev.target.checked)} />
              <span className="entity-check-text">
                <span className="entity-check-label">{e.label}</span>
                {e.hint && <span className="entity-check-hint">{e.hint}</span>}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function DefaultNegativeField({ s, onDefaultNegative }) {
  if (s.ghost) return null;
  if (s.children && s.children.length > 0) return null;
  const val = s.defaultNegative != null ? s.defaultNegative : "";
  return (
    <div className="def-neg">
      <label className="def-neg-label">Default negative</label>
      <input
        className="def-neg-input"
        value={val}
        placeholder="e.g. Denies headaches."
        onChange={(e) => onDefaultNegative(s.id, e.target.value)}
      />
    </div>
  );
}

function modeTagClass(mode) {
  if (mode === "Y/N Logic" || mode === "Replace") return "tag--amber";
  if (mode === "Inform" || mode === "Append") return "tag--teal";
  if (mode === "Prepend") return "tag--purple";
  return "tag--slate";
}

function InlineAdvPanel({ s, onOpenModal }) {
  const I = window.Icons;
  const macros = s.macros || [];
  const sums = s.summarizers || [];
  const hasStatic = !!(s.staticStart || s.staticEnd);
  return (
    <div className="adv">
      <div className="adv-cols">
        <div className="adv-col">
          <div className="adv-head">
            <span className="adv-head-ico adv-head-ico--purple"><I.bolt /></span>
            Connected Macros
            <span className="adv-count">{macros.length}</span>
          </div>
          {macros.length === 0
            ? <div className="adv-empty">No macros connected.</div>
            : macros.map((m, i) => (
              <div className="adv-item" key={i}>
                <span className="adv-item-name">{m.name}</span>
                <span className={"mode-tag " + modeTagClass(m.mode)}>{m.mode}</span>
              </div>
            ))}
        </div>
        <div className="adv-col">
          <div className="adv-head">
            <span className="adv-head-ico adv-head-ico--teal"><I.list /></span>
            Connected Summarizers
            <span className="adv-count adv-count--teal">{sums.length}</span>
          </div>
          {sums.length === 0
            ? <div className="adv-empty">No summarizers connected.</div>
            : sums.map((m, i) => (
              <div className="adv-item" key={i}>
                <span className="adv-item-name">{m.name}</span>
                <span className={"mode-tag " + modeTagClass(m.mode)}>{m.mode}</span>
              </div>
            ))}
        </div>
      </div>
      {hasStatic && (
        <div className="adv-static">
          <div className="adv-static-head">Static text</div>
          {s.staticStart && (
            <div className="adv-static-row">
              <span className="adv-static-pos">Start</span>
              <span className="adv-static-txt">{s.staticStart}</span>
            </div>
          )}
          {s.staticEnd && (
            <div className="adv-static-row">
              <span className="adv-static-pos">End</span>
              <span className="adv-static-txt">{s.staticEnd}</span>
            </div>
          )}
        </div>
      )}
      <div className="adv-foot">
        <button type="button" className="btn-text" onClick={() => onOpenModal(s.id)}>
          <I.sliders /> Edit connections &amp; static text
        </button>
      </div>
    </div>
  );
}

function InlineExpandPanel({ s, onEntity, onDefaultNegative }) {
  const hasEntities = s.entities && s.entities.length > 0;
  const showNeg = !(s.children && s.children.length > 0);
  if (!hasEntities && !showNeg) return null;
  return (
    <div className="row-inline">
      {hasEntities && <EntityControls entities={s.entities} onEntity={(eid, v) => onEntity(s.id, eid, v)} />}
      {showNeg && <DefaultNegativeField s={s} onDefaultNegative={onDefaultNegative} />}
    </div>
  );
}

function GhostRow({ s, onToggle }) {
  const I = window.Icons;
  const isEhr = s.ghost === "ehr";
  return (
    <div className="row row--ghost" data-screen-label={"section:" + s.name}>
      <div className="row-head">
        <div className="row-name">
          <span className="grip grip--ghost"><I.grip /></span>
          <div className="namecell">
            <span className="sname sname--ghost">{s.name}</span>
            <span className={"ghost-badge " + (isEhr ? "ghost-badge--teal" : "ghost-badge--blue")}>
              {isEhr ? <I.database /> : <I.doc />}
              {isEhr ? "Inserted by EHR Pull" : "Inserted by File Upload"}
            </span>
            <span className="info-wrap">
              <span className="info-ico"><I.info /></span>
              <span className="tooltip">
                {isEhr
                  ? "This section is pulled directly from the EHR and is not generated by the template."
                  : "This section was inserted from an uploaded file and is not generated by the template."}
              </span>
            </span>
          </div>
        </div>
        <div className="row-enable">
          <Toggle on={s.enabled} onChange={(v) => onToggle(s.id, v)} />
        </div>
      </div>
    </div>
  );
}

function AmdDetailCell({ s }) {
  const detail = window.amdPushDetail(s);
  return (
    <span className="chip chip--mono chip--amd-detail" title={detail}>{detail}</span>
  );
}

function SectionRow({ s, depth, treePos, onToggle, onConfig, onExpand, onToggleDetails, onOpenModal, onEntity, onDefaultNegative, showAmdDetail }) {
  const I = window.Icons;
  if (s.ghost) return <GhostRow s={s} onToggle={onToggle} />;
  const macros = s.macros || [];
  const sums = s.summarizers || [];
  const hasConn = macros.length + sums.length > 0 || s.staticStart || s.staticEnd;
  const hasConnDetails = hasConn;
  const hasKids = s.children && s.children.length > 0;
  const treeOpen = !!s.expanded;
  const detailsOpen = !!s.detailsExpanded;
  const rowCls = [
    "row",
    treeOpen ? "row--open" : "",
    detailsOpen ? "row--details-open" : "",
    depth ? "row--child row--depth-" + depth : "",
    !s.enabled ? "row--disabled" : "",
    treePos === "last" ? "row--tree-last" : "",
  ].filter(Boolean).join(" ");

  const inner = (
    <div className={rowCls} data-screen-label={"section:" + s.name}>
      <div className="row-head">
        <div className="row-name">
          <span className="grip" title="Drag to reorder"><I.grip /></span>
          <button
            type="button"
            className={"expander expander--tree" + (treeOpen ? " expander--open" : "") + (!hasKids ? " expander--hidden" : "")}
            onClick={() => onExpand(s.id)}
            aria-expanded={treeOpen}
            aria-label={treeOpen ? "Hide subsections" : "Show subsections"}
            title={treeOpen ? "Hide subsections" : "Show subsections"}
          >
            <I.chevron />
          </button>
          <div className="namecell">
            <span className="sname">{s.name}</span>
            {s.static && (
              <span className="info-wrap">
                <span className="static-badge"><I.lock /> Static</span>
                <span className="tooltip">Static section — fixed text only. Its content is not generated by AI.</span>
              </span>
            )}
          </div>
        </div>
        <div className="row-ehr">
          <MappingCell s={s} />
        </div>
        {showAmdDetail && (
          <div className="row-amd-detail">
            <AmdDetailCell s={s} />
          </div>
        )}
        <div className="row-config">
          <ConfigDropdown value={s.config} onChange={(v) => onConfig(s.id, v)} />
        </div>
        <div className="row-enable">
          <button
            type="button"
            className={"toolbox" + (detailsOpen ? " toolbox--open" : "")}
            onClick={() => (hasConn ? onToggleDetails(s.id) : onOpenModal(s.id))}
            aria-expanded={hasConn ? detailsOpen : undefined}
            title={hasConn
              ? (detailsOpen ? "Hide connection details" : "Show connection details")
              : "Connections & static text"}
            aria-label={hasConn
              ? (detailsOpen ? "Hide connection details for " + s.name : "Show connection details for " + s.name)
              : "Edit connections and static text for " + s.name}
          >
            <I.sliders />
            {hasConn && <span className="toolbox-dot" />}
          </button>
          <Toggle on={s.enabled} onChange={(v) => onToggle(s.id, v)} />
        </div>
      </div>
      {detailsOpen && hasConnDetails && (
        <InlineAdvPanel s={s} onOpenModal={onOpenModal} />
      )}
      <InlineExpandPanel s={s} onEntity={onEntity} onDefaultNegative={onDefaultNegative} />
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

function renderSectionTree(s, depth, index, siblings, showAmdDetail, handlers) {
  const isLast = index === siblings.length - 1;
  const nodes = [
    <SectionRow
      key={s.id}
      s={s}
      depth={depth}
      treePos={isLast ? "last" : ""}
      showAmdDetail={showAmdDetail}
      {...handlers}
    />,
  ];
  if (s.expanded && s.children) {
    s.children.forEach((c, i) => {
      nodes.push(...renderSectionTree(c, depth + 1, i, s.children, showAmdDetail, handlers));
    });
  }
  return nodes;
}

function SectionTable({ sections, showAmdDetail, ...handlers }) {
  const tableClass = "table" + (showAmdDetail ? " table--amd" : "");
  return (
    <div className={tableClass}>
      <div className="thead">
        <div className="th th-name">Section Name</div>
        <div className="th th-ehr">EHR Mapping</div>
        {showAmdDetail && <div className="th th-amd-detail">Push behavior</div>}
        <div className="th th-config">Configuration</div>
        <div className="th th-enable">Enable</div>
      </div>
      <div className="tbody">
        {sections.map((s, i) => renderSectionTree(s, 0, i, sections, showAmdDetail, handlers))}
      </div>
    </div>
  );
}

Object.assign(window, { SectionTable, Toggle });
