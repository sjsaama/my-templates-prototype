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
          <span className="modal-sub">{section.name}</span>
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

const REQ_STATUS_META = {
  pending:  { label: "Pending review", cls: "req-status--pending" },
  approved: { label: "Approved",       cls: "req-status--approved" },
  rejected: { label: "Not approved",   cls: "req-status--rejected" },
};

function RequestNewSectionModal({ templates, activeTplId, pending, onClose, onSubmit }) {
  const I = window.Icons;
  const [name, setName] = useStateM("");
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
    if (!name.trim() || !desc.trim() || !ehr.trim()) return;
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
          <h2>Request a new section</h2>
          <span className="modal-sub">Ops team will review and add it to your template</span>
          <button className="modal-x" onClick={onClose} aria-label="Close"><I.close /></button>
        </div>
        <div className="modal-body">

          <div className="req-row2">
            <div className="req-field">
              <label>Section name</label>
              <input className="req-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Allergy History" />
            </div>
            <div className="req-field">
              <label>Map to EHR field</label>
              <input className="req-input" value={ehr} onChange={(e) => setEhr(e.target.value)}
                placeholder="Which EHR field should this map to?" />
            </div>
          </div>

          <div className="req-field">
            <label>What should AI capture in this section?</label>
            <textarea className="req-input req-textarea" value={desc} onChange={(e) => setDesc(e.target.value)}
              placeholder="e.g. Document all known allergies, reactions, and severity…" rows={3} />
          </div>

          <div className="req-sub-row">
            <label className="req-check">
              <input type="checkbox" checked={isSub} onChange={(e) => setIsSub(e.target.checked)} />
              This is a subsection of
            </label>
            <input className="req-input req-input--inline" value={parentName} onChange={(e) => setParentName(e.target.value)}
              placeholder="Parent section name" disabled={!isSub} />
          </div>

          <div className="req-apply">
            <div className="req-apply-title">Add to templates</div>
            <div className="req-apply-cols">
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
          </div>

          <div className="req-foot-row">
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-teal" onClick={send}>Send request</button>
          </div>

          {pending.length > 0 && (
            <div className="req-pending">
              <div className="req-pending-title">Your requests</div>
              {pending.map((r) => {
                const meta = REQ_STATUS_META[r.status] || REQ_STATUS_META.pending;
                return (
                  <div className={"req-pending-item" + (r.status === "rejected" ? " req-pending-item--rejected" : "")} key={r.id}>
                    <div className="req-pending-head">
                      <span className="req-pending-name">{r.name}</span>
                      <span className={"req-status-pill " + meta.cls}>{meta.label}</span>
                    </div>
                    <p className="req-pending-desc">{r.description}</p>
                    {r.status === "rejected" && r.ops_note && (
                      <div className="req-rejected-note">{r.ops_note}</div>
                    )}
                    <div className="req-pending-tpls">
                      {r.tplIds.map((id) => {
                        const t = templates.find((x) => x.id === id);
                        return t ? <span className="req-pending-tag" key={id}>{t.name}</span> : null;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const DERIVATIVE_OPTIONS = ["Clinical Note", "After Visit Summary", "Letter", "Other"];

// ── Template Gallery Step ─────────────────────────────────────────────────
function TemplateGalleryStep({ templates, sectionsByTpl, selected, onSelect }) {
  const [previewId, setPreviewId] = useStateM(null);
  const starters = window.STARTER_TEMPLATES || [];

  const getPreviewData = (id) => {
    const starter = starters.find(t => t.id === id);
    if (starter) return { name: starter.name, specialty: starter.specialty, sections: starter.sections, sampleOutput: starter.sampleOutput };
    const myTpl = (templates || []).find(t => t.id === id);
    if (myTpl) {
      const secs = (sectionsByTpl || {})[id] || [];
      const flat = [];
      const walk = (list) => list.forEach(s => { flat.push(s); if (s.children) walk(s.children); });
      walk(secs);
      return { name: myTpl.name, specialty: myTpl.derivative || "", sections: flat.map(s => ({ id: s.id, name: s.name, prompt: s.prompt || "" })), sampleOutput: window.SAMPLE_OUTPUT || {} };
    }
    return null;
  };

  const preview = previewId ? getPreviewData(previewId) : null;

  if (preview) {
    return (
      <div className="gallery-preview-full">
        <button className="gallery-preview-back" onClick={() => setPreviewId(null)}>← Back to templates</button>
        <div className="gallery-preview-meta">
          <span className="gallery-preview-title">{preview.name}</span>
          {preview.specialty && <span className="gallery-card-tag">{preview.specialty}</span>}
        </div>
        <div className="gallery-preview-note">
          {preview.sections.map(s => (
            <div key={s.id} className="gallery-preview-section">
              <div className="gallery-preview-section-name">{s.name.toUpperCase()}</div>
              <div className="gallery-preview-section-text">{preview.sampleOutput[s.id] || s.prompt || "—"}</div>
            </div>
          ))}
        </div>
        <div className="gallery-preview-foot">
          <button className="btn-teal" onClick={() => { onSelect(previewId); setPreviewId(null); }}>
            {selected === previewId ? "✓ Selected" : "Use this template"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-wrap">
      <div className="gallery-grid">
        {/* Blank */}
        <div className={"gallery-card gallery-card--blank" + (selected === "__blank__" ? " gallery-card--on" : "")}
          onClick={() => onSelect("__blank__")}>
          <div className="gallery-card-blank-body">
            <span className="gallery-blank-plus">+</span>
            <span className="gallery-blank-label">Start blank</span>
          </div>
        </div>
        {/* Starter templates */}
        {starters.map(t => (
          <div key={t.id} className={"gallery-card" + (selected === t.id ? " gallery-card--on" : "")}
            onClick={() => onSelect(t.id)}>
            <div className="gallery-card-body">
              {t.sections.slice(0, 4).map(s => (
                <div key={s.id} className="gallery-mini-section">
                  <div className="gallery-mini-heading">{s.name}</div>
                  <div className="gallery-mini-text">{(t.sampleOutput[s.id] || s.prompt || "").slice(0, 80)}{(t.sampleOutput[s.id] || "").length > 80 ? "…" : ""}</div>
                </div>
              ))}
              {t.sections.length > 4 && <div className="gallery-mini-more">+{t.sections.length - 4} more</div>}
            </div>
            <div className="gallery-card-footer">
              <span className="gallery-card-name">{t.name}</span>
              {t.specialty && <span className="gallery-card-tag">{t.specialty}</span>}
              <button className="gallery-preview-btn" onClick={e => { e.stopPropagation(); setPreviewId(t.id); }}>Preview</button>
            </div>
          </div>
        ))}
      </div>

      {templates && templates.length > 0 && (
        <div className="gallery-mytpls">
          <div className="gallery-section-label">Or copy from my templates</div>
          <div className="gallery-my-list">
            {templates.map(t => (
              <div key={t.id} className={"gallery-my-item" + (selected === t.id ? " gallery-my-item--on" : "")}
                onClick={() => onSelect(t.id)}>
                <span className="gallery-my-name">{t.name}</span>
                <span className="gallery-my-tag">{t.derivative}</span>
                <button className="gallery-preview-btn" onClick={e => { e.stopPropagation(); setPreviewId(t.id); }}>Preview</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CreateTemplateModal({ ehr, templates, sectionsByTpl, onClose, onCreate }) {
  const I = window.Icons;
  const [step, setStep] = useStateM(1);
  const [gallerySelection, setGallerySelection] = useStateM("__blank__");
  const [name, setName] = useStateM("");
  const [desc, setDesc] = useStateM("");
  const [type, setType] = useStateM("Clinical Note");
  const [ehrTplId, setEhrTplId] = useStateM("");
  const [connectSkipped, setConnectSkipped] = useStateM(false);

  useEffectM(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Pre-fill name/desc/type when a starter is selected
  useEffectM(() => {
    const starter = (window.STARTER_TEMPLATES || []).find(t => t.id === gallerySelection);
    if (starter) {
      if (!name) setName(starter.name);
      if (!desc) setDesc(starter.description);
    }
  }, [gallerySelection]);

  const ehrCat = (window.EHR_CATEGORY || {})[ehr];
  const ehrLabel = (ehrCat && ehrCat.label) || ehr || "your EHR";
  // Connect EHR is Cat 2 only — and create-template is self-serve only.
  const needsConnectEhr = !!(ehrCat && ehrCat.cat === 2);
  const totalSteps = needsConnectEhr ? 4 : 3;
  const reviewStep = totalSteps;
  const connectStep = needsConnectEhr ? 3 : null;
  const stepLabel = (n) => {
    if (needsConnectEhr) {
      return { 1: "Starting point", 2: "Describe", 3: "Connect EHR", 4: "Review" }[n];
    }
    return { 1: "Starting point", 2: "Describe", 3: "Review" }[n];
  };

  const ehrTemplates = ((window.EHR_TEMPLATES_BY_SYSTEM || {})[ehr]) || [];
  const selectedEhrTpl = ehrTemplates.find((t) => t.id === ehrTplId) || null;

  const step1Valid = true;
  const step2Valid = name.trim() && desc.trim();
  const step3Valid = !needsConnectEhr || connectSkipped || !!ehrTplId;

  const copyFromId = gallerySelection === "__blank__" ? null : gallerySelection;

  const canGoNext = () => {
    if (step === 2) return step2Valid;
    if (needsConnectEhr && step === connectStep) return step3Valid;
    return true;
  };

  const handleCreate = () => {
    onCreate({
      name: name.trim(),
      description: desc.trim(),
      type,
      copyFromId,
      ehrTemplateId: (!connectSkipped && selectedEhrTpl) ? selectedEhrTpl.id : "",
      ehrTemplateName: (!connectSkipped && selectedEhrTpl) ? selectedEhrTpl.name : "",
    });
  };

  return (
    <div className="modal-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal--create-tpl" role="dialog" aria-modal="true">

        <div className="modal-head">
          <h2>Create a template</h2>
          <span className="modal-sub">
            {needsConnectEhr
              ? "Self-serve — pick an AMD note template so field mapping uses your EHR fields"
              : "You'll configure sections and EHR mapping after creation"}
          </span>
          <button className="modal-x" onClick={onClose} aria-label="Close"><I.close /></button>
        </div>

        {/* Step indicator */}
        <div className="create-steps">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map(n => (
            <div key={n} className={"create-step" + (n === step ? " create-step--active" : "") + (n < step ? " create-step--done" : "")}>
              <span className="create-step-num">{n < step ? "✓" : n}</span>
              <span className="create-step-label">{stepLabel(n)}</span>
            </div>
          ))}
        </div>

        <div className={"modal-body" + (step === 1 ? " modal-body--gallery" : "")}>

          {/* ── Step 1: Gallery ── */}
          {step === 1 && (
            <TemplateGalleryStep
              templates={templates}
              sectionsByTpl={sectionsByTpl}
              selected={gallerySelection}
              onSelect={setGallerySelection}
            />
          )}

          {/* ── Step 2: Describe ── */}
          {step === 2 && (
            <div className="create-step-body">
              <div className="req-field">
                <label>Template name</label>
                <input className="req-input" value={name} autoFocus
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Cardiology Follow-up" />
              </div>
              <div className="req-field">
                <label>What is this template for?</label>
                <textarea className="req-input req-textarea" value={desc} rows={3}
                  onChange={e => setDesc(e.target.value)}
                  placeholder="Describe the visit type, specialty, or patient population this template should cover…" />
                <div className="adv-field-hint">This helps you remember the purpose of this template. No AI is used.</div>
              </div>
              <div className="req-field">
                <label>Document type</label>
                <div className="create-type-row">
                  {DERIVATIVE_OPTIONS.map(opt => (
                    <button key={opt}
                      className={"create-type-btn" + (type === opt ? " create-type-btn--on" : "")}
                      onClick={() => setType(opt)}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3 (Cat 2 / self-serve): Connect EHR ── */}
          {needsConnectEhr && step === connectStep && (
            <div className="create-step-body">
              <p className="create-connect-lead">
                Choose which <strong>{ehrLabel}</strong> note template to connect. Field mappings will use fields from this template.
              </p>
              <div className="ehr-tpl-list">
                {ehrTemplates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    className={"ehr-tpl-option" + (ehrTplId === tpl.id && !connectSkipped ? " ehr-tpl-option--selected" : "")}
                    onClick={() => { setEhrTplId(tpl.id); setConnectSkipped(false); }}
                  >
                    <span className="ehr-tpl-option-name">{tpl.name}</span>
                    <span className="ehr-tpl-option-id">{tpl.id}</span>
                    {ehrTplId === tpl.id && !connectSkipped && (
                      <span className="ehr-tpl-option-check"><I.check /></span>
                    )}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={"create-connect-skip" + (connectSkipped ? " create-connect-skip--on" : "")}
                onClick={() => { setConnectSkipped(true); setEhrTplId(""); }}
              >
                Skip for now — map fields manually later
              </button>
            </div>
          )}

          {/* ── Review ── */}
          {step === reviewStep && (
            <div className="create-step-body">
              <div className="create-review-notice">
                <p className="create-review-lead">Review your template before creating.</p>
              </div>
              <table className="create-review-table">
                <tbody>
                  <tr><td>Name</td><td><strong>{name}</strong></td></tr>
                  <tr><td>Type</td><td>{type}</td></tr>
                  <tr><td>Purpose</td><td>{desc}</td></tr>
                  <tr><td>EHR</td><td>{ehrLabel}</td></tr>
                  {needsConnectEhr && (
                    <tr>
                      <td>Connected note template</td>
                      <td>{
                        connectSkipped || !selectedEhrTpl
                          ? <em>Skipped — map manually later</em>
                          : <strong>{selectedEhrTpl.name}</strong>
                      }</td>
                    </tr>
                  )}
                  <tr><td>Starting point</td><td>{
                    gallerySelection === "__blank__" ? "Blank template" :
                    ((window.STARTER_TEMPLATES || []).find(t => t.id === gallerySelection) || (templates || []).find(t => t.id === gallerySelection) || {}).name || "Unknown"
                  }</td></tr>
                </tbody>
              </table>
              <p className="create-review-hint">
                After creation you'll be taken to the template editor where you can configure sections and EHR field mappings.
              </p>
            </div>
          )}

        </div>

        <div className="modal-foot">
          {step > 1
            ? <button className="btn-ghost" onClick={() => setStep(s => s - 1)}>Back</button>
            : <button className="btn-ghost" onClick={onClose}>Cancel</button>}
          {step < totalSteps
            ? <button className="btn-teal" onClick={() => setStep(s => s + 1)} disabled={!canGoNext()}>
                Next
              </button>
            : <button className="btn-teal" onClick={handleCreate}>Create template</button>}
        </div>

      </div>
    </div>
  );
}

// ── Add Section / Add Subsection ──────────────────────────────────────────
// Header + Prompt, written by the doctor — no AI drafting. For Cat 1 (fixed field list) and
// Cat 2 (fetch-based, once fetched) EHRs, the section must be tied to an available field first.
// Cat 3 (auto push) and Cat 4 (no push) skip the field picker entirely — nothing to map to.
function AddSectionModal({ ehr, ehrCat, parentName, usedFields, onClose, onCreate }) {
  const I = window.Icons;
  const [name, setName] = useStateM("");
  const [prompt, setPrompt] = useStateM("");
  const [field, setField] = useStateM("");
  const [query, setQuery] = useStateM("");

  useEffectM(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const cat = ehrCat || {};
  const needsFieldPick = (cat.cat === 1 || cat.cat === 2) && cat.fieldSource !== "none";
  const groups = (window.EHR_FIELDS_BY_SYSTEM && (window.EHR_FIELDS_BY_SYSTEM[ehr] || window.EHR_FIELDS_BY_SYSTEM.default)) || [];
  const used = usedFields || [];
  const filteredGroups = needsFieldPick
    ? groups
        .map((g) => ({
          ...g,
          fields: g.fields.filter((f) => {
            if (used.includes(f)) return false;
            const label = f.split(" > ").pop();
            return label.toLowerCase().includes(query.toLowerCase()) || g.group.toLowerCase().includes(query.toLowerCase());
          }),
        }))
        .filter((g) => g.fields.length > 0)
    : [];

  const canSubmit = name.trim() && prompt.trim() && (!needsFieldPick || field);

  const submit = () => {
    if (!canSubmit) return;
    onCreate({ name: name.trim(), prompt: prompt.trim(), field: field || "" });
  };

  return (
    <div className="modal-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal--add-section" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>{parentName ? "Add subsection" : "Add section"}</h2>
          <span className="modal-sub">{parentName ? "Under " + parentName : "Header and prompt — you write both, no AI drafting"}</span>
          <button className="modal-x" onClick={onClose} aria-label="Close"><I.close /></button>
        </div>

        <div className="modal-body">
          {needsFieldPick && (
            <div className="req-field">
              <label>Map to {cat.label || ehr} field</label>
              <input className="req-input" placeholder="Search fields…" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
              <div className="add-section-field-list">
                {filteredGroups.length === 0 ? (
                  <div className="mapping-picker-empty">No unused fields match{query ? ` "${query}"` : ""}.</div>
                ) : (
                  filteredGroups.map((g) => (
                    <div key={g.group}>
                      <div className="mapping-picker-group-label">{g.group}</div>
                      {g.fields.map((f) => (
                        <button
                          key={f}
                          type="button"
                          className={"mapping-picker-field" + (f === field ? " mapping-picker-field--selected" : "")}
                          onClick={() => { setField(f); if (!name.trim()) setName(f.split(" > ").pop()); }}
                        >
                          <span>{f.split(" > ").pop()}</span>
                          {f === field && <span className="mapping-picker-check"><I.check /></span>}
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="req-field">
            <label>Header</label>
            <input className="req-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Allergy History" autoFocus={!needsFieldPick} />
          </div>

          <div className="req-field">
            <label>Prompt</label>
            <textarea className="req-input req-textarea" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)}
              placeholder="Tell the AI what to write in this section…" />
            <div className="adv-field-hint">This is the actual instruction the AI follows — write it the way you'd want this section described.</div>
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-teal" disabled={!canSubmit} onClick={submit}>
            {parentName ? "Add subsection" : "Add section"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Preview Output Modal ───────────────────────────────────────────────────
function PreviewModal({ sections, tpl, onClose }) {
  const [transcriptOpen, setTranscriptOpen] = useStateM(false);
  const enabled = window.collectEnabledSections(sections);
  const SAMPLE = window.SAMPLE_OUTPUT;

  useEffectM(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="modal-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal--preview" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>Output preview</h2>
          <span className="modal-sub">Based on your current section settings</span>
          <button className="modal-x" onClick={onClose} aria-label="Close"><window.Icons.close /></button>
        </div>

        <div className="modal-body preview-body">
          {/* Collapsible transcript */}
          <div className="preview-transcript-wrap">
            <button className="preview-transcript-toggle" onClick={() => setTranscriptOpen(o => !o)}>
              <span>Sample transcript</span>
              <span className="preview-chevron">{transcriptOpen ? "▲" : "▼"}</span>
            </button>
            {transcriptOpen && (
              <pre className="preview-transcript-text">{window.SAMPLE_TRANSCRIPT}</pre>
            )}
          </div>

          {/* Note output */}
          <div className="preview-note-wrap">
            <div className="preview-note-meta">
              {tpl && <span className="preview-note-tpl">{tpl.name}</span>}
              {tpl && tpl.ehr && <span className="preview-note-ehr">→ {tpl.ehr}</span>}
            </div>
            {enabled.length === 0 && (
              <div className="preview-empty">All sections are disabled — enable at least one to see output.</div>
            )}
            {enabled.map(s => (
              <div key={s.id} className="preview-section">
                <div className="preview-section-name">{s.name}</div>
                <div className="preview-section-text">
                  {SAMPLE[s.id]
                    ? SAMPLE[s.id]
                    : (s.defaultNegative || "No content available for this section in the sample.")}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ConnectionsModal, ConfirmModal, DisableConfirmModal, RequestNewSectionModal, CreateTemplateModal, AddSectionModal, PreviewModal });
