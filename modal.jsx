// modal.jsx — Connections & Static Text editor
const { useState: useStateM, useEffect: useEffectM } = React;

function ConnList({ title, icon, items, modes, onChangeMode, onRemove, accent }) {
  const I = window.Icons;
  const Ico = icon === "bolt" ? I.bolt : I.list;
  return (
    <div className="cl">
      <div className="cl-head">
        <span className={"cl-ico cl-ico--" + accent}><Ico /></span>
        {title}
        <span className={"cl-count cl-count--" + accent}>{items.length}</span>
      </div>
      <div className="cl-box">
        {items.length === 0 && <div className="cl-empty">Nothing connected yet.</div>}
        {items.map((it, i) => (
          <div className="cl-item" key={i}>
            <span className="cl-name">{it.name}</span>
            <div className="cl-right">
              <select className="cl-mode" value={it.mode} onChange={(e) => onChangeMode(i, e.target.value)}>
                {modes.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <button className="cl-x" onClick={() => onRemove(i)} title="Remove">{I.trash({ width: 15, height: 15 })}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConnectionsModal({ section, onClose, onSave }) {
  const I = window.Icons;
  const [macros, setMacros] = useStateM(() => section.macros.map((m) => ({ ...m })));
  const [sums, setSums] = useStateM(() => section.summarizers.map((m) => ({ ...m })));
  const [startTxt, setStartTxt] = useStateM(section.staticStart || "");
  const [endTxt, setEndTxt] = useStateM(section.staticEnd || "");

  useEffectM(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const upd = (setter) => (i, mode) => setter((arr) => arr.map((x, j) => (j === i ? { ...x, mode } : x)));
  const rm = (setter) => (i) => setter((arr) => arr.filter((_, j) => j !== i));

  return (
    <div className="modal-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>Connections &amp; Static Text</h2>
          <span className="modal-sub">{section.name}{section.static ? " · Static section" : ""}</span>
          <button className="modal-x" onClick={onClose} aria-label="Close"><I.close /></button>
        </div>

        <div className="modal-body">
          <div className="modal-grid">
            <ConnList title="Connected Macros" icon="bolt" accent="purple"
              items={macros} modes={window.MACRO_MODES}
              onChangeMode={upd(setMacros)} onRemove={rm(setMacros)} />
            <ConnList title="Connected Summarizers" icon="list" accent="teal"
              items={sums} modes={window.SUMMARIZER_MODES}
              onChangeMode={upd(setSums)} onRemove={rm(setSums)} />
          </div>

          <div className="static-block">
            <div className="static-title">Static Text</div>
            <p className="static-hint">Fixed text inserted around this section. The model never rewrites it.</p>
            <div className="static-field">
              <label>At the beginning of section</label>
              <textarea value={startTxt} onChange={(e) => setStartTxt(e.target.value)}
                placeholder="Starting static text (pre-literal)…" rows={3} />
            </div>
            <div className="static-field">
              <label>At the end of section</label>
              <textarea value={endTxt} onChange={(e) => setEndTxt(e.target.value)}
                placeholder="Ending static text (post-literal)…" rows={3} />
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-teal" onClick={() => onSave({ macros, summarizers: sums, staticStart: startTxt, staticEnd: endTxt })}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ title, subtitle, children, confirmLabel, onConfirm, onClose, danger }) {
  const I = window.Icons;
  useEffectM(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <div className="modal-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal--confirm" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>{title}</h2>
          {subtitle && <span className="modal-sub">{subtitle}</span>}
          <button className="modal-x" onClick={onClose} aria-label="Close"><I.close /></button>
        </div>
        <div className="modal-body confirm-body">{children}</div>
        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className={"btn-teal" + (danger ? " btn-teal--warn" : "")} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function DisableConfirmModal({ section, impact, onConfirm, onClose }) {
  const I = window.Icons;
  let msg = "This section will be hidden from generated notes for this template. Do you want to continue?";
  if (impact.macros > 0) {
    msg = "Disabling this section will also disable the " + impact.macros + " macro" + (impact.macros === 1 ? "" : "s") + " linked to it. Do you want to continue?";
  } else if (impact.summarizers > 0) {
    msg = "This section is affected by " + impact.summarizers + " summarizer" + (impact.summarizers === 1 ? "" : "s") + " — that content will no longer appear. Do you want to continue?";
  }
  useEffectM(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <div className="modal-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal--disable" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>Disable Section</h2>
          <button className="modal-x" onClick={onClose} aria-label="Close"><I.close /></button>
        </div>
        <div className="modal-body confirm-body">
          <p className="confirm-lead">{msg}</p>
        </div>
        <div className="modal-foot modal-foot--split">
          <button className="btn-outline-danger" onClick={onClose}>No, Cancel</button>
          <button className="btn-teal btn-teal--warn" onClick={onConfirm}>Yes, Disable</button>
        </div>
      </div>
    </div>
  );
}

function RequestNewSectionModal({ templates, activeTplId, pending, onClose, onSubmit }) {
  const I = window.Icons;
  const [name, setName] = useStateM("History of Present Illness");
  const [desc, setDesc] = useStateM("");
  const [ehr, setEhr] = useStateM("");
  const [isSub, setIsSub] = useStateM(false);
  const [parentName, setParentName] = useStateM("");
  const [tplIds, setTplIds] = useStateM(() => {
    const ids = templates.map((t) => t.id);
    return activeTplId && ids.includes(activeTplId) ? [activeTplId] : ids.slice(0, 1);
  });

  useEffectM(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const groups = window.groupsFor(templates);
  const toggleTpl = (id) =>
    setTplIds((arr) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]));

  const send = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      description: desc.trim(),
      ehr: ehr.trim(),
      isSubsection: isSub,
      parentName: parentName.trim(),
      tplIds,
    });
  };

  return (
    <div className="modal-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal--request" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>Request New Section</h2>
          <button className="modal-x" onClick={onClose} aria-label="Close"><I.close /></button>
        </div>
        <div className="modal-body">
          <div className="req-grid">
            <div className="req-field">
              <label>New Section / Subsection Name</label>
              <input className="req-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="History of Present Illness" />
            </div>
            <div className="req-field">
              <label>Brief Description</label>
              <textarea className="req-input req-textarea" value={desc} onChange={(e) => setDesc(e.target.value)}
                placeholder="Describe what you want AI to capture in this new section" rows={4} />
            </div>
          </div>
          <div className="req-sub-row">
            <label className="req-check">
              <input type="checkbox" checked={isSub} onChange={(e) => setIsSub(e.target.checked)} />
              This is a subsection of
            </label>
            <input className="req-input req-input--inline" value={parentName} onChange={(e) => setParentName(e.target.value)}
              placeholder="Name of Parent Section" disabled={!isSub} />
          </div>
          <div className="req-field">
            <label>Map to EHR Field <span className="req-optional">Optional</span></label>
            <input className="req-input" value={ehr} onChange={(e) => setEhr(e.target.value)}
              placeholder="Should this new section push to an EHR field? Which one?" />
          </div>
          <div className="req-apply">
            <div className="req-apply-title">Apply to Templates</div>
            {groups.map((g) => (
              <div className="req-apply-group" key={g.label}>
                <div className="req-apply-label">{g.label}</div>
                <div className="req-checks">
                  {g.templates.map((t) => (
                    <label className="req-check" key={t.id}>
                      <input type="checkbox" checked={tplIds.includes(t.id)} onChange={() => toggleTpl(t.id)} />
                      {t.name}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button className="btn-teal btn-teal--full" onClick={send}>Send Request</button>
          {pending.length > 0 && (
            <div className="req-pending">
              <div className="req-pending-title">Pending Requests</div>
              {pending.map((r) => (
                <div className="req-pending-item" key={r.id}>
                  <div className="req-pending-head">
                    <span className="req-pending-name">{r.name}</span>
                    <span className="req-pending-when">Requested {r.daysAgo} day{r.daysAgo === 1 ? "" : "s"} ago</span>
                  </div>
                  <p className="req-pending-desc">{r.description}</p>
                  <div className="req-pending-tpls">
                    {r.tplIds.map((id) => {
                      const t = templates.find((x) => x.id === id);
                      return t ? <span className="req-pending-tag" key={id}>{t.name}</span> : null;
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ConnectionsModal, DisableConfirmModal, RequestNewSectionModal });
