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

// ── Version History Modal — restore to any saved version, not just an ops default ─────────
function VersionHistoryModal({ versions, templateName, onClose, onRestore }) {
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
          <h2>Version history</h2>
          <span className="modal-sub">{templateName} — restore to any saved version, not just the original</span>
          <button className="modal-x" onClick={onClose} aria-label="Close"><I.close /></button>
        </div>
        <div className="modal-body">
          {versions.length === 0 ? (
            <div className="mapping-picker-empty">No versions saved yet.</div>
          ) : (
            <div className="version-list">
              {versions.map((v, i) => (
                <div key={v.id} className="version-row">
                  <div className="version-row-info">
                    <span className="version-row-date">{window.formatVersionDate(v.timestamp)}</span>
                    {v.label && <span className="version-row-tag">{v.label}</span>}
                    {i === 0 && !v.label && <span className="version-row-tag version-row-tag--current">Most recent save</span>}
                  </div>
                  <button className="btn-ghost btn-sm" onClick={() => onRestore(v)}>Restore</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose}>Close</button>
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
function TemplateGalleryStep({ templates, sectionsByTpl, selected, onSelect, onPreviewOpenChange }) {
  const [previewId, setPreviewId] = useStateM(null);
  const starters = window.STARTER_TEMPLATES || [];

  useEffectM(() => { onPreviewOpenChange && onPreviewOpenChange(!!previewId); }, [previewId]);

  const getPreviewData = (id) => {
    const starter = starters.find(t => t.id === id);
    if (starter) return { name: starter.name, specialty: starter.specialty, sections: starter.sections, sampleOutput: starter.sampleOutput };
    const myTpl = (templates || []).find(t => t.id === id);
    if (myTpl) {
      const secs = (sectionsByTpl || {})[id] || [];
      return { name: myTpl.name, specialty: myTpl.derivative || "", sections: secs, sampleOutput: window.SAMPLE_OUTPUT || {} };
    }
    return null;
  };

  const preview = previewId ? getPreviewData(previewId) : null;

  // Flatten (with depth) for the "Full note view" — one continuous assembled document.
  const flattenWithDepth = (list, depth) => {
    let out = [];
    (list || []).forEach(s => {
      out.push({ ...s, depth });
      if (s.children && s.children.length) out = out.concat(flattenWithDepth(s.children, depth + 1));
    });
    return out;
  };

  // Renders one column of the doc — either every prompt or every sample output, mirrored
  // section-for-section so the two sides can be read side by side like Quick Look.
  const renderDocColumn = (mode) => (list, depth = 0) =>
    (list || []).map(s => (
      <div key={s.id} className={"ql-doc-node" + (depth ? " ql-doc-node--sub" : "")}>
        <div className="ql-doc-heading">{depth ? "↳ " : ""}{s.name.toUpperCase()}</div>
        <div className="ql-doc-text">
          {mode === "prompt"
            ? (s.prompt || "(no prompt set)")
            : (preview.sampleOutput[s.id] || "(no sample output configured for this section)")}
        </div>
        {s.children && s.children.length > 0 && renderDocColumn(mode)(s.children, depth + 1)}
      </div>
    ));

  if (preview) {
    const flat = flattenWithDepth(preview.sections, 0);
    return (
      <div className="gallery-preview-full ql-preview">
        <button className="gallery-preview-back" onClick={() => setPreviewId(null)}>← Back to templates</button>
        <div className="gallery-preview-meta">
          <span className="gallery-preview-title">{preview.name}</span>
          {preview.specialty && <span className="gallery-card-tag">{preview.specialty}</span>}
        </div>
        <div className="ql-columns">
          <div className="ql-column">
            <div className="ql-column-label">Output (sample)</div>
            <div className="ql-column-scroll">
              {renderDocColumn("output")(preview.sections)}
              <div className="ql-fullnote">
                <div className="ql-fullnote-label">Full note view</div>
                {flat.map(s => (
                  <div key={s.id} className="preview-section">
                    <div className="preview-section-name">{s.name}</div>
                    <div className="preview-section-text">{preview.sampleOutput[s.id] || "(no sample output configured for this section)"}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="ql-column">
            <div className="ql-column-label">Prompt</div>
            <div className="ql-column-scroll">
              {renderDocColumn("prompt")(preview.sections)}
            </div>
          </div>
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
  const [ehrTemplateId, setEhrTemplateId] = useStateM("");
  const [separator, setSeparator] = useStateM("\\n");
  const [pushSubsections, setPushSubsections] = useStateM(true);
  const [retainHeadings, setRetainHeadings] = useStateM(true);
  const [skipEmptySubsections, setSkipEmptySubsections] = useStateM(false);
  const [keepBulletPoints, setKeepBulletPoints] = useStateM(true);
  const [charLimit, setCharLimit] = useStateM("");
  const [galleryPreviewOpen, setGalleryPreviewOpen] = useStateM(false);

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
  // Cat 2 only — doctor must pick which of their EHR's note templates this maps to before
  // fields can be fetched. Cat 1 (fixed list) and Cat 3/4 (no doctor-facing mapping) skip this.
  const needsEhrTemplate = ehrCat && ehrCat.cat === 2;
  const ehrTemplateOptions = (window.EHR_TEMPLATES_BY_SYSTEM || {})[ehr] || [];
  const steps = needsEhrTemplate
    ? ["gallery", "describe", "ehrTemplate", "templateSettings", "review"]
    : ["gallery", "describe", "templateSettings", "review"];
  const totalSteps = steps.length;
  const stepKey = steps[step - 1];
  const stepLabel = (n) => ({ gallery: "Starting point", describe: "Describe", ehrTemplate: "EHR template", templateSettings: "Template settings", review: "Review" }[steps[n - 1]]);

  const step1Valid = true; // gallery always has a selection (blank by default)
  const step2Valid = !!name.trim(); // "What is this template for?" is optional
  const ehrTemplateStepValid = !needsEhrTemplate || !!ehrTemplateId;
  const selectedEhrTemplate = ehrTemplateOptions.find(t => t.id === ehrTemplateId);

  const copyFromId = gallerySelection === "__blank__" ? null : gallerySelection;

  const handleCreate = () => {
    onCreate({
      name: name.trim(),
      description: desc.trim(),
      type,
      copyFromId,
      ehrTemplateName: selectedEhrTemplate ? selectedEhrTemplate.name : undefined,
      templateSettings: { separator, pushSubsections, retainHeadings, skipEmptySubsections, keepBulletPoints, charLimit },
    });
  };

  return (
    <div className="modal-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={"modal modal--create-tpl" + (galleryPreviewOpen ? " modal--create-tpl-wide" : "")} role="dialog" aria-modal="true">

        <div className="modal-head">
          <h2>Create a template</h2>
          <span className="modal-sub">You'll configure sections and EHR mapping after creation</span>
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

        <div className={"modal-body" + (stepKey === "gallery" ? " modal-body--gallery" : "")}>

          {/* ── Gallery ── */}
          {stepKey === "gallery" && (
            <TemplateGalleryStep
              templates={templates}
              sectionsByTpl={sectionsByTpl}
              selected={gallerySelection}
              onSelect={setGallerySelection}
              onPreviewOpenChange={setGalleryPreviewOpen}
            />
          )}

          {/* ── Describe ── */}
          {stepKey === "describe" && (
            <div className="create-step-body">
              <div className="req-field">
                <label>Template name</label>
                <input className="req-input" value={name} autoFocus
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Cardiology Follow-up" />
              </div>
              <div className="req-field">
                <label>What is this template for? <span className="req-optional">optional</span></label>
                <textarea className="req-input req-textarea" value={desc} rows={3}
                  onChange={e => setDesc(e.target.value)}
                  placeholder="Describe the visit type, specialty, or patient population this template should cover…" />
                <div className="adv-field-hint">Helps ops review and onboard the template correctly — for internal clarity only, no AI is used.</div>
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

          {/* ── EHR template (Cat 2 only) ── */}
          {stepKey === "ehrTemplate" && (
            <div className="create-step-body">
              <div className="req-field">
                <label>Which {ehrLabel} template does this map to?</label>
                <div className="adv-field-hint" style={{ marginBottom: 10 }}>
                  You can only map to templates ops has already set up in {ehrLabel} — Marvix fetches this template's field list once you pick one, and you'll map sections to those fields next.
                </div>
                {ehrTemplateOptions.length === 0 ? (
                  <div className="mapping-picker-empty">No {ehrLabel} templates are set up for this practice yet — ask ops to add one.</div>
                ) : (
                  <div className="ehr-tpl-list">
                    {ehrTemplateOptions.map(t => (
                      <button key={t.id} type="button"
                        className={"ehr-tpl-option" + (ehrTemplateId === t.id ? " ehr-tpl-option--selected" : "")}
                        onClick={() => setEhrTemplateId(t.id)}>
                        <span className="ehr-tpl-option-name">{t.name}</span>
                        {ehrTemplateId === t.id && <span className="ehr-tpl-option-check"><I.check /></span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Template settings ── */}
          {stepKey === "templateSettings" && (
            <div className="create-step-body">
              <div className="adv-field-hint" style={{ marginBottom: 14 }}>
                These apply once, to the whole template — not per section. You can change them later from the gear icon next to this template in the left nav.
              </div>
              <div className="req-field">
                <label>Separator</label>
                <input className="req-input" value={separator}
                  onChange={e => setSeparator(e.target.value)}
                  placeholder="e.g. \n" />
                <div className="adv-field-hint">Joins text when multiple sections map to one EHR field.</div>
              </div>
              <div className="req-field">
                <label>Character limit</label>
                <input className="req-input" type="number" min="0" value={charLimit}
                  onChange={e => setCharLimit(e.target.value)}
                  placeholder="No limit" />
                <div className="adv-field-hint">Truncates a section's text to this length before pushing, to avoid the EHR rejecting an over-length push. Leave blank for no limit.</div>
              </div>
              <div className="tpl-setting-toggle-row">
                <div>
                  <div className="tpl-setting-toggle-name">Push subsections</div>
                  <div className="adv-field-hint">Include subsection content when pushing the parent section.</div>
                </div>
                <window.Toggle on={pushSubsections} onChange={setPushSubsections} />
              </div>
              <div className="tpl-setting-toggle-row">
                <div>
                  <div className="tpl-setting-toggle-name">Retain headings</div>
                  <div className="adv-field-hint">Keep section/subsection headings in the pushed content.</div>
                </div>
                <window.Toggle on={retainHeadings} onChange={setRetainHeadings} />
              </div>
              <div className="tpl-setting-toggle-row">
                <div>
                  <div className="tpl-setting-toggle-name">Skip empty subsections</div>
                  <div className="adv-field-hint">Omit subsections with no generated content instead of pushing an empty heading.</div>
                </div>
                <window.Toggle on={skipEmptySubsections} onChange={setSkipEmptySubsections} />
              </div>
              {ehr === "AthenaOne" && (
                <div className="tpl-setting-toggle-row">
                  <div>
                    <div className="tpl-setting-toggle-name">Keep bullet points</div>
                    <div className="adv-field-hint">AthenaOne-only — preserve bullet formatting on push to Assessment/Plan.</div>
                  </div>
                  <window.Toggle on={keepBulletPoints} onChange={setKeepBulletPoints} />
                </div>
              )}
            </div>
          )}

          {/* ── Review ── */}
          {stepKey === "review" && (
            <div className="create-step-body">
              <div className="create-review-notice">
                <p className="create-review-lead">Review your template before creating.</p>
              </div>
              <table className="create-review-table">
                <tbody>
                  <tr><td>Name</td><td><strong>{name}</strong></td></tr>
                  <tr><td>Type</td><td>{type}</td></tr>
                  {desc && <tr><td>Purpose</td><td>{desc}</td></tr>}
                  <tr><td>EHR</td><td>{ehrLabel}</td></tr>
                  {needsEhrTemplate && (
                    <tr><td>EHR template</td><td>{selectedEhrTemplate ? selectedEhrTemplate.name : "—"}</td></tr>
                  )}
                  <tr><td>Starting point</td><td>{
                    gallerySelection === "__blank__" ? "Blank template" :
                    ((window.STARTER_TEMPLATES || []).find(t => t.id === gallerySelection) || (templates || []).find(t => t.id === gallerySelection) || {}).name || "Unknown"
                  }</td></tr>
                  <tr><td>Template settings</td><td>
                    Separator {JSON.stringify(separator)} · Character limit {charLimit || "none"} · Push subsections {pushSubsections ? "on" : "off"} · Retain headings {retainHeadings ? "on" : "off"} · Skip empty subsections {skipEmptySubsections ? "on" : "off"}{ehr === "AthenaOne" ? ` · Keep bullet points ${keepBulletPoints ? "on" : "off"}` : ""}
                  </td></tr>
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
                disabled={stepKey === "describe" ? !step2Valid : stepKey === "ehrTemplate" ? !ehrTemplateStepValid : false}>
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
// "Pull from another derivative" is not part of creation — it's a content-source choice made
// afterward, per section, in the row's own expand panel (see SectionRow in rows.jsx). It's a
// direct pass-through, not something layered onto a prompt: pick a derivative, pick where it's
// mapped, that's the whole configuration — no prompt involved for that section.
const OTHER_DERIVATIVE_OPTIONS = [
  { key: "icd_codes", label: "ICD-10 Codes" },
  { key: "em_coding", label: "E/M Coding" },
];

// Flattens the section tree into a depth-aware list for the parent picker — any existing
// section or subsection can be chosen as the parent, so "child" vs "grandchild" is just a
// consequence of which node gets picked, not a separate choice.
function flattenSectionsWithDepth(list, depth) {
  let out = [];
  (list || []).forEach((s) => {
    if (s.ghost) return;
    out.push({ id: s.id, name: s.name, depth, children: s.children });
    if (s.children && s.children.length) out = out.concat(flattenSectionsWithDepth(s.children, depth + 1));
  });
  return out;
}

function AddSectionModal({ sections, initialParentId, onClose, onCreate }) {
  const I = window.Icons;
  const [name, setName] = useStateM("");
  const [prompt, setPrompt] = useStateM("");
  const [parentId, setParentId] = useStateM(initialParentId || "");
  const [position, setPosition] = useStateM(-1); // -1 = at the end
  const [settingsOpen, setSettingsOpen] = useStateM(false);
  const [additionalPlacement, setAdditionalPlacement] = useStateM("before");
  const [additionalText, setAdditionalText] = useStateM("");
  const [defaultNegative, setDefaultNegative] = useStateM("");

  useEffectM(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const flat = flattenSectionsWithDepth(sections, 0);
  const parentNode = parentId ? flat.find((n) => n.id === parentId) : null;
  const siblings = (parentNode ? parentNode.children : sections) || [];
  const depthWord = !parentNode ? "New top-level section" : parentNode.depth === 0 ? "Child (subsection)" : "Grandchild (sub-subsection)";

  const canSubmit = name.trim() && prompt.trim();

  const submit = () => {
    if (!canSubmit) return;
    onCreate({
      name: name.trim(),
      prompt: prompt.trim(),
      parentId: parentId || null,
      position,
      additionalPlacement,
      additionalText: additionalText.trim(),
      defaultNegative: defaultNegative.trim(),
    });
  };

  return (
    <div className="modal-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal--add-section" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>Add section</h2>
          <span className="modal-sub">Header and prompt — you write both, no AI drafting</span>
          <button className="modal-x" onClick={onClose} aria-label="Close"><I.close /></button>
        </div>

        <div className="modal-body">
          <div className="req-field">
            <label>Header</label>
            <input className="req-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Allergy History" autoFocus />
          </div>

          <div className="req-field">
            <label>Prompt</label>
            <textarea className="req-input req-textarea" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)}
              placeholder="Tell the AI what to write in this section…" />
            <div className="adv-field-hint">This is the actual instruction the AI follows — write it the way you'd want this section described.</div>
          </div>

          <div className="req-field">
            <label>Position</label>
            <div className="add-section-position-row">
              <select className="req-input" value={parentId}
                onChange={(e) => { setParentId(e.target.value); setPosition(-1); }}>
                <option value="">— Top level (new parent section) —</option>
                {flat.map((n) => (
                  <option key={n.id} value={n.id}>{"—".repeat(n.depth) + (n.depth ? " " : "")}{n.name}</option>
                ))}
              </select>
              <select className="req-input" value={position} onChange={(e) => setPosition(Number(e.target.value))}>
                <option value={-1}>At the end</option>
                <option value={0}>At the beginning</option>
                {siblings.filter(s => !s.ghost).map((s, i) => (
                  <option key={s.id} value={i + 1}>After "{s.name}"</option>
                ))}
              </select>
            </div>
            <div className="adv-field-hint">{depthWord}{parentNode ? " of “" + parentNode.name + "”" : ""}.</div>
          </div>

          <button type="button" className="add-section-settings-toggle" onClick={() => setSettingsOpen(o => !o)}>
            {settingsOpen ? "▾" : "▸"} Section-level settings <span className="req-optional">optional — can skip and add later</span>
          </button>
          {settingsOpen && (
            <div className="add-section-settings-body">
              <div className="req-field">
                <label>Additional text</label>
                <div className="adv-additional-row">
                  <select className="adv-additional-placement" value={additionalPlacement} onChange={(e) => setAdditionalPlacement(e.target.value)}>
                    <option value="before">Before content</option>
                    <option value="after">After content</option>
                  </select>
                  <input className="adv-field-input adv-field-input--grow" value={additionalText}
                    placeholder="Fixed text added around section content on push…"
                    onChange={(e) => setAdditionalText(e.target.value)} />
                </div>
              </div>
              <div className="req-field">
                <label>Default negative</label>
                <input className="req-input" value={defaultNegative}
                  placeholder='e.g. "Not reported" or "None"'
                  onChange={(e) => setDefaultNegative(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-teal" disabled={!canSubmit} onClick={submit}>Add section</button>
        </div>
      </div>
    </div>
  );
}

// ── Preview Output Modal ───────────────────────────────────────────────────
function PreviewModal({ sections, tpl, onUpdatePrompt, onClose }) {
  const [transcriptOpen, setTranscriptOpen] = useStateM(true);
  const [transcript, setTranscript] = useStateM(window.SAMPLE_TRANSCRIPT);
  const enabledFlat = window.collectEnabledSections(sections);
  const SAMPLE = window.SAMPLE_OUTPUT;

  useEffectM(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Walks the real section tree, keeping depth for indentation, but only renders a node
  // if it's individually enabled — matching collectEnabledSections' flatten semantics
  // (an enabled child still shows even if its parent is disabled).
  const renderEnabledDoc = (mode) => (list, depth) =>
    (list || []).flatMap(s => {
      const nodes = [];
      if (s.enabled) {
        nodes.push(
          <div key={s.id} className={"ql-doc-node" + (depth ? " ql-doc-node--sub" : "")}>
            <div className="ql-doc-heading">{depth ? "↳ " : ""}{s.name.toUpperCase()}</div>
            {mode === "prompt" ? (
              <textarea
                className="ql-doc-textarea"
                value={s.stylePrompt || ""}
                onChange={(e) => onUpdatePrompt && onUpdatePrompt(s.id, e.target.value)}
                placeholder="No prompt written yet…"
              />
            ) : (
              <div className="ql-doc-text">
                {SAMPLE[s.id] || s.defaultNegative || "No content available for this section in the sample."}
              </div>
            )}
          </div>
        );
      }
      if (s.children && s.children.length) nodes.push(...renderEnabledDoc(mode)(s.children, depth + 1));
      return nodes;
    });

  return (
    <div className="modal-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal--preview" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>Output preview</h2>
          <span className="modal-sub">Edit the transcript or a prompt to try a different scenario — output shown is a static sample, it won't regenerate</span>
          <button className="modal-x" onClick={onClose} aria-label="Close"><window.Icons.close /></button>
        </div>

        <div className="modal-body preview-body">
          {/* Editable transcript */}
          <div className="preview-transcript-wrap">
            <button className="preview-transcript-toggle" onClick={() => setTranscriptOpen(o => !o)}>
              <span>Transcript (editable)</span>
              <span className="preview-chevron">{transcriptOpen ? "▲" : "▼"}</span>
            </button>
            {transcriptOpen && (
              <textarea
                className="preview-transcript-text preview-transcript-textarea"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
              />
            )}
          </div>

          <div className="preview-note-meta">
            {tpl && <span className="preview-note-tpl">{tpl.name}</span>}
            {tpl && tpl.ehr && <span className="preview-note-ehr">→ {tpl.ehr}</span>}
          </div>

          {enabledFlat.length === 0 ? (
            <div className="preview-empty">All sections are disabled — enable at least one to see output.</div>
          ) : (
            <div className="ql-columns ql-columns--inline">
              <div className="ql-column">
                <div className="ql-column-label">Output (sample — read-only)</div>
                <div className="ql-column-scroll">{renderEnabledDoc("output")(sections, 0)}</div>
              </div>
              <div className="ql-column">
                <div className="ql-column-label">Prompt (editable)</div>
                <div className="ql-column-scroll">{renderEnabledDoc("prompt")(sections, 0)}</div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Settings Modal — practice / template / mapping / section hierarchy ─────
// Four tiers, per the mapping-portal redesign decision: settings must be split into section,
// template, and mapping layers (practice-level stays separate — the template screen shouldn't
// deal with practice settings directly). Mapping-level exists because mapping-specific behaviors
// (write mode, checkbox push, push order, special code extraction) were previously mixed loosely
// into template/section editing and need their own conceptual bucket.
//
// Rendered as a matrix — settings down the side, EHRs across the top — rather than a linear list,
// so coverage/gaps across EHRs are visible at a glance instead of buried in per-item prose.
const SETTINGS_EHRS = ["AthenaOne", "ECW", "Veradigm", "Nereg", "Centricity", "AMD", "DrChrono", "CharmHealth", "Cerner", "ModMed", "Tebra"];
const SETTINGS_MARK = { full: "✅", partial: "⚠️", noop: "◻️", notimpl: "🚧" }; // anything absent from an item's status renders as "—" (not applicable)

const SETTINGS_TIERS = [
  {
    tier: "Practice-level",
    owner: "Ops / practice admin — doctors do not see or control these",
    items: [
      { name: "EHR credentials", what: "API keys, OAuth tokens, practice ID. Set at onboarding.",
        status: { AthenaOne: "full", ECW: "full", Veradigm: "full", Nereg: "full", Centricity: "full", AMD: "full", DrChrono: "full", CharmHealth: "full", Cerner: "full", ModMed: "full", Tebra: "full" } },
      { name: "EHR template selection", what: "Which note template in the EHR is connected to this practice — determines the field list every doctor's mapping picker fetches from.",
        status: { AMD: "full", DrChrono: "full", CharmHealth: "full" } },
      { name: "Fixed field list source", what: "Field names configured by tech at onboarding, not fetched from a live EHR template — mechanically closer to Cat 1 despite requiring the same explicit per-field mapping as AMD/DrChrono/CharmHealth.",
        status: { Veradigm: "full", Nereg: "full" } },
      { name: "CharmHealth push mode (SOAP vs. standard)", what: "Determined by whether the connected template's name has a \"soap\" prefix — ops controls this by which template they pick/name, not a separate toggle.",
        status: { CharmHealth: "full" } },
      { name: "Push-as-note vs. push-as-document", what: "No document-push mode exists in the Veradigm integration today.",
        status: { Veradigm: "notimpl" } },
      { name: "Selective Copy destination setup", what: "Which ECW shortcut commands the practice's Scribe-it destinations map to — configured by ops through the same mapping editor, keyed by a separate query param.",
        status: { ECW: "full" } },
    ],
  },
  {
    tier: "Template-level",
    owner: "Doctor can set these — apply once to the whole template, not per section or mapping row",
    items: [
      { name: "Separator", what: "Joins text when multiple sections map to one EHR field. Today a real per-mapping-row config key; being promoted to one template-wide setting. Nereg hardcodes its separator in the push logic — no config override exists there.",
        status: { AthenaOne: "full", ECW: "full", Veradigm: "full", Centricity: "full", AMD: "full", DrChrono: "full", CharmHealth: "full" } },
      { name: "Push subsections", what: "Whether subsection content is included when pushing the parent section. Hardcoded (always on) for Nereg.",
        status: { AthenaOne: "full", ECW: "full", Veradigm: "full", Centricity: "full", AMD: "full", DrChrono: "full", CharmHealth: "full" } },
      { name: "Retain headings", what: "Whether section/subsection headings are kept in the pushed content. Hardcoded (always on) for Nereg.",
        status: { AthenaOne: "full", ECW: "full", Veradigm: "full", Centricity: "full", AMD: "full", DrChrono: "full", CharmHealth: "full" } },
      { name: "Skip empty subsections", what: "Omit subsections with no generated content instead of pushing an empty heading. Hardcoded off for Nereg, no override.",
        status: { AthenaOne: "full", ECW: "full", Veradigm: "full", Centricity: "full", AMD: "full", DrChrono: "full", CharmHealth: "full" } },
      { name: "Character limit", what: "A real, enforced `char_limit` config value — Marvix truncates the section's outgoing text to this length before pushing, to avoid the EHR rejecting an over-length push. Genuinely settable today (per mapping row); being promoted to this template-wide level. Not the same thing as AMD field limit below.",
        status: { AthenaOne: "full", ECW: "full", Veradigm: "full", Centricity: "full", AMD: "full", DrChrono: "full", CharmHealth: "full" } },
      { name: "Keep bullet points", what: "Preserve bullet formatting on push to Assessment/Plan — stripped by default otherwise.",
        status: { AthenaOne: "full" } },
      { name: "Document type", what: "Note vs. Letter, set explicitly at creation — the only template-level setting that's truly universal, since it has nothing to do with push mechanics.",
        status: { AthenaOne: "full", ECW: "full", Veradigm: "full", Nereg: "full", Centricity: "full", AMD: "full", DrChrono: "full", CharmHealth: "full", Cerner: "full", ModMed: "full", Tebra: "full" } },
      { name: "Selective Copy enabled", what: "Per-template boolean (`extra_settings[\"selective_copy\"]`) that turns on the Scribe-it copy UI for notes created from this template.",
        status: { ECW: "full" } },
      { name: "AMD field limit (reference)", what: "AMD's own `max_character_length`, fetched from AMD's API — meant to be auto-populated only, shown so a doctor can see the constraint before pushing. Editing it wouldn't change what AMD actually enforces. (In the real code this is a policy, not a hard block — a manually-entered value can silently survive if the AMD fetch/field-lookup fails, e.g. after a field rename.)",
        status: { AMD: "full" } },
      { name: "Line separator", what: "Hardcoded (`\\r\\n` / HL7 formatting) — a real push-time value, but not configurable today despite living in the same config bucket as the settings above.",
        status: { ECW: "full", Veradigm: "full" } },
    ],
  },
  {
    tier: "Mapping-level",
    owner: "Set per EHR-field mapping row — the destination's own push behavior, not the section's content",
    items: [
      { name: "Write mode (Prepend / Append / Replace)", what: "Functional only where the EHR genuinely fetches existing field content first. AthenaOne only fetches-and-combines for HPI/Physical Exam/ROS — Assessment/Chief Complaint are append/replace only. ECW, Centricity, and Nereg accept the setting but it's a no-op — they never fetch existing content at all.",
        status: { AthenaOne: "partial", ECW: "noop", Veradigm: "full", Nereg: "noop", Centricity: "noop", AMD: "full", DrChrono: "full", CharmHealth: "full" } },
      { name: "Checkbox / boolean push (`extract_boolean_value`)", what: "Pushes a fixed configured value (e.g. \"Yes\") when the section has any generated content, empty string otherwise — content-presence-driven, not a match against the prompt's output text.",
        status: { AMD: "full" } },
      { name: "One section → two EHR fields", what: "A section can drive a plain text field and a separate checkbox field at the same time, via two independent mapping rows sharing one section.",
        status: { AMD: "full" } },
      { name: "Push order for shared fields", what: "When 2+ sections map to the same field, sets the order their text is combined in — independent of, and can differ from, the note's own section order. Prototype: the \"Shared · order N/M\" control on the mapping cell, shown only when a field has 2+ sections mapped to it.",
        status: { AthenaOne: "full", ECW: "full", Veradigm: "full", Nereg: "full", Centricity: "full", AMD: "full", DrChrono: "full", CharmHealth: "full" } },
      { name: "Section code (subsection routing)", what: "Routes content to a chart subsection (e.g. HPI > General) via the OBR-5 field, separately from the main section name written to OBR-4.",
        status: { ECW: "full" } },
      { name: "Field identification scheme (SOAP vs. default)", what: "Whether this row is keyed by `ehr_field_id` (numeric) or `ehr_field_name` (fixed keyword) — determined by the practice's connected template name, not set per row directly.",
        status: { CharmHealth: "full" } },
      { name: "Special code extraction", what: "A field with one of these names processes the text instead of pushing it raw:\n• AthenaOne's `diagnoses` — resolves SNOMED codes via a separate diagnoses API\n• Veradigm's `ICD` field — sent through a separate diagnosis API, not the normal SaveXNote path\n• Nereg's `diagnosiscodes` / `billingcodes` — regex-extracts ICD codes, or grabs a CPT code heuristically\n• DrChrono's `icd10_codes` / `cpt_codes` — routed to dedicated code-push handlers\nMap the wrong section to one of these and it silently extracts garbage or nothing — no error shown.",
        status: { AthenaOne: "full", Veradigm: "full", Nereg: "full", DrChrono: "full" } },
      { name: "Selective Copy shortcut command", what: "The exact `ehr_field_name` string (including the colon) this section's Scribe-it destination matches — a completely separate mapping row from the main HL7 push, with no server-side formatting applied.",
        status: { ECW: "full" } },
    ],
  },
  {
    tier: "Section-level",
    owner: "Doctor sets these per section — the section's own content, independent of which EHR field (if any) it maps to",
    items: [
      { name: "Section name & prompt", what: "The section's own header and the instruction the AI follows to generate its content.",
        status: { AthenaOne: "full", ECW: "full", Veradigm: "full", Nereg: "full", Centricity: "full", AMD: "full", DrChrono: "full", CharmHealth: "full", Cerner: "full", ModMed: "full", Tebra: "full" } },
      { name: "Enable / disable", what: "Whether this section is included in the note and push at all.",
        status: { AthenaOne: "full", ECW: "full", Veradigm: "full", Nereg: "full", Centricity: "full", AMD: "full", DrChrono: "full", CharmHealth: "full", Cerner: "full", ModMed: "full", Tebra: "full" } },
      { name: "Additional text (before / after)", what: "Fixed text placed around the section's generated content on push.",
        status: { AthenaOne: "full", ECW: "full", Veradigm: "full", Nereg: "full", Centricity: "full", AMD: "full", DrChrono: "full", CharmHealth: "full", Cerner: "full", ModMed: "full", Tebra: "full" } },
      { name: "Default negative", what: "Text pushed when the section has no generated content.",
        status: { AthenaOne: "full", ECW: "full", Veradigm: "full", Nereg: "full", Centricity: "full", AMD: "full", DrChrono: "full", CharmHealth: "full", Cerner: "full", ModMed: "full", Tebra: "full" } },
      { name: "Parent / child structure", what: "Subsection nesting — exists independently of any EHR mapping; a subsection can be pushed as one with its parent or mapped to its own field.",
        status: { AthenaOne: "full", ECW: "full", Veradigm: "full", Nereg: "full", Centricity: "full", AMD: "full", DrChrono: "full", CharmHealth: "full", Cerner: "full", ModMed: "full", Tebra: "full" } },
      { name: "Pull from another derivative", what: "A direct pass-through, not a merge: the section pulls whatever content is already generated in another derivative (e.g. ICD-10 codes or E/M coding) and pushes it straight to wherever this section is mapped. No prompt, no combining logic — just catch the data and push it.",
        status: { AthenaOne: "full", ECW: "full", Veradigm: "full", Nereg: "full", Centricity: "full", AMD: "full", DrChrono: "full", CharmHealth: "full", Cerner: "full", ModMed: "full", Tebra: "full" } },
    ],
  },
];

function SettingsModal({ onClose }) {
  const I = window.Icons;
  useEffectM(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="modal-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal--request modal--settings-wide" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>Push settings</h2>
          <span className="modal-sub">Where each push setting lives, and who controls it</span>
          <button className="modal-x" onClick={onClose} aria-label="Close"><I.close /></button>
        </div>
        <div className="modal-body">
          <div className="settings-legend">
            <span><span className="settings-mark">{SETTINGS_MARK.full}</span> functional</span>
            <span><span className="settings-mark">{SETTINGS_MARK.partial}</span> partial</span>
            <span><span className="settings-mark">{SETTINGS_MARK.noop}</span> no-op</span>
            <span><span className="settings-mark">{SETTINGS_MARK.notimpl}</span> not implemented</span>
            <span><span className="settings-mark">—</span> not applicable</span>
          </div>
          {SETTINGS_TIERS.map((tier) => (
            <div key={tier.tier} style={{ marginBottom: 26 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{tier.tier}</div>
              <div style={{ fontSize: 12, color: "var(--gray)", marginBottom: 10 }}>{tier.owner}</div>
              <div className="settings-matrix-scroll">
                <table className="settings-matrix">
                  <thead>
                    <tr>
                      <th>Setting</th>
                      {SETTINGS_EHRS.map((e) => <th key={e}>{e}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {tier.items.map((it, i) => (
                      <tr key={i}>
                        <td className="settings-matrix-name" title={it.what}>{it.name}</td>
                        {SETTINGS_EHRS.map((e) => (
                          <td key={e} className="settings-matrix-cell">{SETTINGS_MARK[it.status[e]] || "—"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="settings-matrix-desc">
                {tier.items.map((it, i) => (
                  <div key={i} className="settings-matrix-desc-item">
                    <strong>{it.name}</strong> — {it.what}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Template Settings Modal — per-template, opened via the gear icon next to a template name ──
function TemplateSettingsModal({ template, onUpdate, onClose }) {
  const I = window.Icons;
  useEffectM(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const ehrSystem = (template && template.ehrSystem) || "";
  const ts = (template && template.templateSettings) || window.DEFAULT_TEMPLATE_SETTINGS;
  const set = (fields) => template && onUpdate && onUpdate(template.id, fields);

  return (
    <div className="modal-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal--request" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>Template settings</h2>
          <span className="modal-sub">{template ? template.name : "Template"} — applies to the whole template, not per section</span>
          <button className="modal-x" onClick={onClose} aria-label="Close"><I.close /></button>
        </div>
        <div className="modal-body">
          <div className="req-field">
            <label>Separator</label>
            <input className="req-input" value={ts.separator}
              onChange={e => set({ separator: e.target.value })}
              placeholder="e.g. \n" />
            <div className="adv-field-hint">Joins text when multiple sections map to one EHR field.</div>
          </div>
          <div className="req-field">
            <label>Character limit</label>
            <input className="req-input" type="number" min="0" value={ts.charLimit || ""}
              onChange={e => set({ charLimit: e.target.value })}
              placeholder="No limit" />
            <div className="adv-field-hint">Truncates a section's text to this length before pushing, to avoid the EHR rejecting an over-length push. Leave blank for no limit. (Not the same as AMD's own field limit, which is fetched from AMD and shown read-only in each section's output settings.)</div>
          </div>
          <div className="tpl-setting-toggle-row">
            <div>
              <div className="tpl-setting-toggle-name">Push subsections</div>
              <div className="adv-field-hint">Include subsection content when pushing the parent section.</div>
            </div>
            <window.Toggle on={ts.pushSubsections} onChange={(v) => set({ pushSubsections: v })} />
          </div>
          <div className="tpl-setting-toggle-row">
            <div>
              <div className="tpl-setting-toggle-name">Retain headings</div>
              <div className="adv-field-hint">Keep section/subsection headings in the pushed content.</div>
            </div>
            <window.Toggle on={ts.retainHeadings} onChange={(v) => set({ retainHeadings: v })} />
          </div>
          <div className="tpl-setting-toggle-row">
            <div>
              <div className="tpl-setting-toggle-name">Skip empty subsections</div>
              <div className="adv-field-hint">Omit subsections with no generated content instead of pushing an empty heading.</div>
            </div>
            <window.Toggle on={ts.skipEmptySubsections} onChange={(v) => set({ skipEmptySubsections: v })} />
          </div>
          {ehrSystem === "AthenaOne" && (
            <div className="tpl-setting-toggle-row">
              <div>
                <div className="tpl-setting-toggle-name">Keep bullet points</div>
                <div className="adv-field-hint">AthenaOne-only — preserve bullet formatting on push to Assessment/Plan.</div>
              </div>
              <window.Toggle on={ts.keepBulletPoints} onChange={(v) => set({ keepBulletPoints: v })} />
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ConnectionsModal, ConfirmModal, VersionHistoryModal, DisableConfirmModal, RequestNewSectionModal, CreateTemplateModal, AddSectionModal, PreviewModal, SettingsModal, TemplateSettingsModal, OTHER_DERIVATIVE_OPTIONS });
