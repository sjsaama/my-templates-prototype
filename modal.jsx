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

const REQ_STATUS_META = {
  pending:  { label: "Pending review", cls: "req-status--pending" },
  approved: { label: "Approved",       cls: "req-status--approved" },
  rejected: { label: "Not approved",   cls: "req-status--rejected" },
};

function RequestNewSectionModal({ templates, activeTplId, pending, onClose, onSubmit }) {
  const I = window.Icons;
  const sources = window.CODE_CONTENT_SOURCES || [];
  const [name, setName] = useStateM("");
  const [desc, setDesc] = useStateM("");
  const [ehr, setEhr] = useStateM("");
  const [contentSource, setContentSource] = useStateM("prompt");
  const [codeTemplateId, setCodeTemplateId] = useStateM("");
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

  useEffectM(() => {
    setCodeTemplateId("");
    if (contentSource === "icd" && !name.trim()) setName("ICD Codes");
    if (contentSource === "em" && !name.trim()) setName("EM Codes");
  }, [contentSource]);

  const groups = window.groupsFor(templates);
  const toggleTpl = (id) =>
    setTplIds((arr) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]));
  const isCodeSource = contentSource === "icd" || contentSource === "em";
  const codeTemplates = ((window.CODE_GENERATOR_TEMPLATES || {})[contentSource]) || [];
  const sourceMeta = sources.find((s) => s.id === contentSource);

  const canSend = name.trim() && ehr.trim() && (isCodeSource ? !!codeTemplateId : !!desc.trim());

  const send = () => {
    if (!canSend) return;
    const gen = codeTemplates.find((t) => t.id === codeTemplateId);
    onSubmit({
      name: name.trim(),
      description: isCodeSource
        ? ((gen && gen.description) || (contentSource === "icd" ? "ICD code section" : "EM code section"))
        : desc.trim(),
      ehr: ehr.trim(),
      contentSource,
      codeTemplateId: isCodeSource ? codeTemplateId : "",
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

          <div className="req-field">
            <label>Content source</label>
            <div className="content-source-row" role="radiogroup" aria-label="Content source">
              {sources.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={contentSource === s.id}
                  className={"content-source-btn" + (contentSource === s.id ? " content-source-btn--on" : "")}
                  onClick={() => setContentSource(s.id)}
                >
                  <span className="content-source-btn-label">{s.label}</span>
                </button>
              ))}
            </div>
            {sourceMeta && <div className="adv-field-hint">{sourceMeta.hint}</div>}
          </div>

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

          {isCodeSource ? (
            <div className="req-field">
              <label>{contentSource === "icd" ? "ICD" : "EM"} generator</label>
              <div className="code-template-list">
                {codeTemplates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={"code-template-btn" + (codeTemplateId === t.id ? " code-template-btn--on" : "")}
                    onClick={() => setCodeTemplateId(t.id)}
                  >
                    <span className="code-template-name">{t.name}</span>
                    <span className="code-template-desc">{t.description}</span>
                    {codeTemplateId === t.id && <span className="mapping-picker-check"><I.check /></span>}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="req-field">
              <label>What should AI capture in this section?</label>
              <textarea className="req-input req-textarea" value={desc} onChange={(e) => setDesc(e.target.value)}
                placeholder="e.g. Document all known allergies, reactions, and severity…" rows={3} />
            </div>
          )}

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
            <button className="btn-teal" disabled={!canSend} onClick={send}>Send request</button>
          </div>

          {pending.length > 0 && (
            <div className="req-pending">
              <div className="req-pending-title">Your requests</div>
              {pending.map((r) => {
                const meta = REQ_STATUS_META[r.status] || REQ_STATUS_META.pending;
                const src = r.contentSource || "prompt";
                return (
                  <div className={"req-pending-item" + (r.status === "rejected" ? " req-pending-item--rejected" : "")} key={r.id}>
                    <div className="req-pending-head">
                      <span className="req-pending-name">
                        {r.name}
                        {(src === "icd" || src === "em") && (
                          <span className={"content-source-chip content-source-chip--" + src} style={{marginLeft:6}}>{src === "icd" ? "ICD" : "EM"}</span>
                        )}
                      </span>
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
function TemplateGalleryStep({ selected, onSelect }) {
  const [previewId, setPreviewId] = useStateM(null);
  const starters = window.STARTER_TEMPLATES || [];

  const getPreviewData = (id) => {
    const starter = starters.find(t => t.id === id);
    if (starter) return { name: starter.name, specialty: starter.specialty, sections: starter.sections, sampleOutput: starter.sampleOutput };
    return null;
  };

  const preview = previewId ? getPreviewData(previewId) : null;

  if (preview) {
    return (
      <div className="gallery-preview-full">
        <button className="gallery-preview-back" onClick={() => setPreviewId(null)}>← Back to stencils</button>
        <div className="gallery-preview-meta">
          <span className="gallery-preview-title">{preview.name}</span>
          {preview.specialty && <span className="gallery-card-tag">{preview.specialty}</span>}
        </div>
        <div className="gallery-preview-note">
          {preview.sections.map(s => (
            <div key={s.id} className="gallery-preview-section">
              <div className="gallery-preview-section-name">
                {s.name.toUpperCase()}
                {(s.contentSource === "icd" || s.contentSource === "em") && (
                  <span className={"content-source-chip content-source-chip--" + s.contentSource} style={{marginLeft:8}}>{s.contentSource === "icd" ? "ICD" : "EM"}</span>
                )}
              </div>
              <div className="gallery-preview-section-text">
                {preview.sampleOutput[s.id]
                  || ((window.SAMPLE_CODE_OUTPUT || {})[s.contentSource])
                  || s.prompt
                  || "—"}
              </div>
            </div>
          ))}
        </div>
        <div className="gallery-preview-foot">
          <button className="btn-teal" onClick={() => { onSelect(previewId); setPreviewId(null); }}>
            {selected === previewId ? "✓ Selected" : "Use this stencil"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-wrap">
      <p className="gallery-lead">Pick a stencil to get started — you can edit sections after creating.</p>
      <div className="gallery-grid">
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
    </div>
  );
}

function CreateTemplateModal({ ehr, onClose, onCreate }) {
  const I = window.Icons;
  const starters = window.STARTER_TEMPLATES || [];
  const defaultStencilId = (starters[0] && starters[0].id) || null;
  const [step, setStep] = useStateM(1);
  const [gallerySelection, setGallerySelection] = useStateM(defaultStencilId);
  const [name, setName] = useStateM((starters[0] && starters[0].name) || "");
  const [desc, setDesc] = useStateM((starters[0] && starters[0].description) || "");
  const [type, setType] = useStateM("Clinical Note");

  useEffectM(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Keep name/desc in sync when the doctor picks a different stencil
  useEffectM(() => {
    const starter = starters.find(t => t.id === gallerySelection);
    if (starter) {
      setName(starter.name);
      setDesc(starter.description);
    }
  }, [gallerySelection]);

  const ehrCat = (window.EHR_CATEGORY || {})[ehr];
  const ehrLabel = (ehrCat && ehrCat.label) || ehr || "your EHR";
  const selectedStencil = starters.find(t => t.id === gallerySelection) || null;
  const totalSteps = 3;
  const stepLabel = (n) => ({ 1: "Choose stencil", 2: "Describe", 3: "Review" }[n]);

  const step1Valid = !!selectedStencil;
  const step2Valid = name.trim() && desc.trim();

  const handleCreate = () => {
    onCreate({
      name: name.trim(),
      description: desc.trim(),
      type,
      starterId: gallerySelection,
    });
  };

  return (
    <div className="modal-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal--create-tpl" role="dialog" aria-modal="true">

        <div className="modal-head">
          <h2>Create a template</h2>
          <span className="modal-sub">Start from a stencil, then configure sections and EHR mapping</span>
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

          {/* ── Step 1: Stencil gallery ── */}
          {step === 1 && (
            <TemplateGalleryStep
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
                <div className="adv-field-hint">This helps ops review and onboard the template correctly. No AI is used.</div>
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

          {/* ── Step 3: Review ── */}
          {step === 3 && (
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
                  <tr><td>Stencil</td><td>{(selectedStencil && selectedStencil.name) || "Unknown"}</td></tr>
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
            ? <button className="btn-teal" onClick={() => setStep(s => s + 1)}
                disabled={step === 1 ? !step1Valid : !step2Valid}>
                Next
              </button>
            : <button className="btn-teal" onClick={handleCreate} disabled={!step1Valid || !step2Valid}>Create template</button>}
        </div>

      </div>
    </div>
  );
}

// ── Add Section / Add Subsection ──────────────────────────────────────────
// Content source: AI prompt (free text), ICD codes, or EM codes — available for every EHR.
// For Cat 1 / Cat 2, the section must map to an EHR field. Cat 3 / Cat 4 skip the field picker.
function AddSectionModal({ ehr, ehrCat, parentName, usedFields, onClose, onCreate }) {
  const I = window.Icons;
  const sources = window.CODE_CONTENT_SOURCES || [];
  const [name, setName] = useStateM("");
  const [prompt, setPrompt] = useStateM("");
  const [contentSource, setContentSource] = useStateM("prompt");
  const [codeTemplateId, setCodeTemplateId] = useStateM("");
  const [field, setField] = useStateM("");
  const [query, setQuery] = useStateM("");

  useEffectM(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Reset generator pick when switching ICD ↔ EM; clear when returning to prompt.
  useEffectM(() => {
    setCodeTemplateId("");
    if (contentSource === "prompt") return;
    const preferred = ((window.CODE_PREFERRED_FIELDS || {})[contentSource] || {});
    const hints = preferred[ehr] || preferred.default || [];
    if (!field && hints.length) {
      const used = usedFields || [];
      const firstFree = hints.find((h) => !used.includes(h));
      if (firstFree) setField(firstFree);
    }
  }, [contentSource]);

  const cat = ehrCat || {};
  const needsFieldPick = (cat.cat === 1 || cat.cat === 2) && cat.fieldSource !== "none";
  const isCodeSource = contentSource === "icd" || contentSource === "em";
  const codeTemplates = ((window.CODE_GENERATOR_TEMPLATES || {})[contentSource]) || [];
  const preferredMap = ((window.CODE_PREFERRED_FIELDS || {})[contentSource]) || {};
  const preferredFields = preferredMap[ehr] || preferredMap.default || [];
  const groups = (window.EHR_FIELDS_BY_SYSTEM && (window.EHR_FIELDS_BY_SYSTEM[ehr] || window.EHR_FIELDS_BY_SYSTEM.default)) || [];
  const used = usedFields || [];
  const labels = window.EHR_FIELD_LABELS || {};
  const fieldDisplay = (f) => labels[f] || labels[f.split(" > ").pop()] || f.split(" > ").pop();

  const filteredGroups = needsFieldPick
    ? groups
        .map((g) => ({
          ...g,
          fields: g.fields.filter((f) => {
            if (used.includes(f)) return false;
            const label = fieldDisplay(f);
            return label.toLowerCase().includes(query.toLowerCase()) || g.group.toLowerCase().includes(query.toLowerCase());
          }),
        }))
        .filter((g) => g.fields.length > 0)
    : [];

  // Preferred code destinations first when deriving from ICD / EM.
  const orderedGroups = (() => {
    if (!isCodeSource || !preferredFields.length || !filteredGroups.length) return filteredGroups;
    const preferredSet = new Set(preferredFields);
    const preferred = [];
    const rest = [];
    filteredGroups.forEach((g) => {
      const prefFields = g.fields.filter((f) => preferredSet.has(f));
      const otherFields = g.fields.filter((f) => !preferredSet.has(f));
      if (prefFields.length) preferred.push({ group: g.group + " · suggested", fields: prefFields });
      if (otherFields.length) rest.push({ ...g, fields: otherFields });
    });
    return [...preferred, ...rest];
  })();

  const sourceMeta = sources.find((s) => s.id === contentSource) || sources[0];
  const canSubmit =
    name.trim() &&
    (!needsFieldPick || field) &&
    (isCodeSource ? !!codeTemplateId : !!prompt.trim());

  const submit = () => {
    if (!canSubmit) return;
    onCreate({
      name: name.trim(),
      prompt: isCodeSource ? "" : prompt.trim(),
      field: field || "",
      contentSource,
      codeTemplateId: isCodeSource ? codeTemplateId : "",
    });
  };

  const pickSource = (id) => {
    setContentSource(id);
    if (id === "icd" && !name.trim()) setName("ICD Codes");
    if (id === "em" && !name.trim()) setName("EM Codes");
  };

  return (
    <div className="modal-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal--add-section" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>{parentName ? "Add subsection" : "Add section"}</h2>
          <span className="modal-sub">
            {parentName
              ? "Under " + parentName
              : "Derive from a prompt, ICD codes, or EM codes — then map to your EHR"}
          </span>
          <button className="modal-x" onClick={onClose} aria-label="Close"><I.close /></button>
        </div>

        <div className="modal-body">
          <div className="req-field">
            <label>Content source</label>
            <div className="content-source-row" role="radiogroup" aria-label="Content source">
              {sources.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={contentSource === s.id}
                  className={"content-source-btn" + (contentSource === s.id ? " content-source-btn--on" : "")}
                  onClick={() => pickSource(s.id)}
                >
                  <span className="content-source-btn-label">{s.label}</span>
                </button>
              ))}
            </div>
            {sourceMeta && <div className="adv-field-hint">{sourceMeta.hint}</div>}
          </div>

          <div className="req-field">
            <label>Header</label>
            <input
              className="req-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isCodeSource ? (contentSource === "icd" ? "e.g. ICD Codes" : "e.g. EM Codes") : "e.g. Allergy History"}
              autoFocus={!needsFieldPick}
            />
          </div>

          {isCodeSource ? (
            <div className="req-field">
              <label>{contentSource === "icd" ? "ICD" : "EM"} generator</label>
              <div className="code-template-list">
                {codeTemplates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={"code-template-btn" + (codeTemplateId === t.id ? " code-template-btn--on" : "")}
                    onClick={() => setCodeTemplateId(t.id)}
                  >
                    <span className="code-template-name">{t.name}</span>
                    <span className="code-template-desc">{t.description}</span>
                    {codeTemplateId === t.id && <span className="mapping-picker-check"><I.check /></span>}
                  </button>
                ))}
              </div>
              <div className="adv-field-hint">
                Generated codes are pushed to the EHR field you map below — same flow for every EHR.
              </div>
            </div>
          ) : (
            <div className="req-field">
              <label>Prompt</label>
              <textarea
                className="req-input req-textarea"
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Tell the AI what to write in this section…"
              />
              <div className="adv-field-hint">This is the actual instruction the AI follows — write it the way you'd want this section described.</div>
            </div>
          )}

          {needsFieldPick && (
            <div className="req-field">
              <label>Map to {cat.label || ehr} field</label>
              <input
                className="req-input"
                placeholder="Search fields…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus={contentSource === "prompt"}
              />
              <div className="add-section-field-list">
                {orderedGroups.length === 0 ? (
                  <div className="mapping-picker-empty">No unused fields match{query ? ` "${query}"` : ""}.</div>
                ) : (
                  orderedGroups.map((g) => (
                    <div key={g.group}>
                      <div className="mapping-picker-group-label">{g.group}</div>
                      {g.fields.map((f) => (
                        <button
                          key={f}
                          type="button"
                          className={"mapping-picker-field" + (f === field ? " mapping-picker-field--selected" : "") + (preferredFields.includes(f) ? " mapping-picker-field--preferred" : "")}
                          onClick={() => { setField(f); if (!name.trim()) setName(fieldDisplay(f)); }}
                        >
                          <span>{fieldDisplay(f)}</span>
                          {preferredFields.includes(f) && <span className="mapping-preferred-chip">Suggested</span>}
                          {f === field && <span className="mapping-picker-check"><I.check /></span>}
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {!needsFieldPick && (
            <div className="add-section-nopush-hint">
              {cat.cat === 3
                ? "This EHR auto-maps by section name — no field picker needed."
                : "This EHR has no push integration — content is still generated for copy/paste."}
            </div>
          )}
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
            {enabled.map(s => {
              const src = s.contentSource || "prompt";
              const isCode = src === "icd" || src === "em";
              const codeSample = (window.SAMPLE_CODE_OUTPUT || {})[src];
              return (
                <div key={s.id} className="preview-section">
                  <div className="preview-section-name">
                    {s.name}
                    {isCode && <span className={"content-source-chip content-source-chip--" + src}>{src === "icd" ? "ICD" : "EM"}</span>}
                  </div>
                  <div className="preview-section-text">
                    {isCode
                      ? (codeSample || "No sample code output available.")
                      : (SAMPLE[s.id]
                        ? SAMPLE[s.id]
                        : (s.defaultNegative || "No content available for this section in the sample."))}
                  </div>
                </div>
              );
            })}
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
