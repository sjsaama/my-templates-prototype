// modal.jsx
const { useState: useStateM, useEffect: useEffectM } = React;

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
  const CVH = window.COPY.versionHistory;
  const [expanded, setExpanded] = useStateM({}); // { [versionId]: true } — which rows show all changes
  useEffectM(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const CHANGE_PREVIEW_COUNT = 3;

  return (
    <div className="modal-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal--confirm" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>{CVH.title}</h2>
          <span className="modal-sub">{CVH.subtitle(templateName)}</span>
          <button className="modal-x" onClick={onClose} aria-label="Close"><I.close /></button>
        </div>
        <div className="modal-body">
          {versions.length === 0 ? (
            <div className="mapping-picker-empty">No versions saved yet.</div>
          ) : (
            <div className="version-list">
              {versions.map((v, i) => {
                const changes = v.changes || [];
                const isExpanded = !!expanded[v.id];
                const shown = isExpanded ? changes : changes.slice(0, CHANGE_PREVIEW_COUNT);
                const hiddenCount = changes.length - shown.length;
                return (
                  <div key={v.id} className="version-row">
                    <div className="version-row-top">
                      <div className="version-row-info">
                        <span className="version-row-date">{window.formatVersionDate(v.timestamp)}</span>
                        {v.label && <span className="version-row-tag">{v.label}</span>}
                        {i === 0 && !v.label && <span className="version-row-tag version-row-tag--current">Most recent save</span>}
                      </div>
                      <button className="btn-ghost btn-sm" onClick={() => onRestore(v)}>Restore</button>
                    </div>
                    {v.label === "Original" ? (
                      <div className="version-row-changes-empty">Template created</div>
                    ) : changes.length === 0 ? (
                      <div className="version-row-changes-empty">No changes detected since the previous save</div>
                    ) : (
                      <ul className="version-row-changes">
                        {shown.map((c, ci) => <li key={ci}>{c}</li>)}
                        {hiddenCount > 0 && (
                          <li>
                            <button
                              type="button"
                              className="version-row-more-btn"
                              onClick={() => setExpanded(e => ({ ...e, [v.id]: true }))}
                            >
                              +{hiddenCount} more
                            </button>
                          </li>
                        )}
                        {isExpanded && changes.length > CHANGE_PREVIEW_COUNT && (
                          <li>
                            <button
                              type="button"
                              className="version-row-more-btn"
                              onClick={() => setExpanded(e => ({ ...e, [v.id]: false }))}
                            >
                              Show less
                            </button>
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                );
              })}
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
  const [tplPickerOpen, setTplPickerOpen] = useStateM(false);
  const [tplQuery, setTplQuery] = useStateM("");

  useEffectM(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleTpl = (id) =>
    setTplIds((arr) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]));
  const tplQueryTrimmed = tplQuery.trim().toLowerCase();
  const filteredTemplates = tplQueryTrimmed
    ? templates.filter((t) => t.name.toLowerCase().includes(tplQueryTrimmed))
    : templates;

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
            <div className="tpl-multiselect">
              <button type="button" className="tpl-multiselect-trigger" onClick={() => setTplPickerOpen((o) => !o)}>
                <span className="tpl-multiselect-summary">
                  {tplIds.length === 0 ? "Select templates…" : tplIds.length + " template" + (tplIds.length === 1 ? "" : "s") + " selected"}
                </span>
                <span className="tpl-multiselect-caret">{tplPickerOpen ? "▲" : "▼"}</span>
              </button>
              {tplPickerOpen && (
                <>
                  <div className="tpl-multiselect-scrim" onClick={() => setTplPickerOpen(false)} />
                  <div className="tpl-multiselect-menu">
                    <div className="tpl-search-wrap" style={{ margin: "8px" }}>
                      <span className="tpl-search-ico">
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.4"/>
                          <path d="M8.5 8.5L11.5 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                        </svg>
                      </span>
                      <input
                        className="tpl-search"
                        type="search"
                        placeholder="Search templates…"
                        value={tplQuery}
                        onChange={(e) => setTplQuery(e.target.value)}
                        aria-label="Search templates"
                      />
                      {tplQueryTrimmed && (
                        <button className="tpl-search-clear" onClick={() => setTplQuery("")} aria-label="Clear search">✕</button>
                      )}
                    </div>
                    <div className="tpl-multiselect-list">
                      {filteredTemplates.length === 0 ? (
                        <div className="tpl-no-results" style={{ padding: "12px 16px" }}>No templates match "{tplQuery}"</div>
                      ) : (
                        filteredTemplates.map((t) => (
                          <label className="tpl-multiselect-item" key={t.id}>
                            <input type="checkbox" checked={tplIds.includes(t.id)} onChange={() => toggleTpl(t.id)} />
                            {t.name}
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            {tplIds.length > 0 && (
              <div className="tpl-multiselect-chips">
                {tplIds.map((id) => {
                  const t = templates.find((x) => x.id === id);
                  if (!t) return null;
                  return (
                    <span className="tpl-chip" key={id}>
                      {t.name}
                      <button type="button" onClick={() => toggleTpl(id)} aria-label={"Remove " + t.name}>✕</button>
                    </span>
                  );
                })}
              </div>
            )}
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

const DERIVATIVE_OPTIONS = ["Clinical Note", "Letter"];

// ── Template Gallery Step ─────────────────────────────────────────────────
function TemplateGalleryStep({ selected, onSelect, onPreviewOpenChange, doctorSpecialty }) {
  const [previewId, setPreviewId] = useStateM(null);
  const allStarters = window.STARTER_TEMPLATES || [];
  // Only surface stencils relevant to this doctor: their own specialty, plus the
  // specialty-agnostic ones (no `specialty`, or "General") — not every specialty's starter.
  const starters = doctorSpecialty
    ? allStarters.filter(t => !t.specialty || t.specialty === "General" || t.specialty === doctorSpecialty)
    : allStarters;

  useEffectM(() => { onPreviewOpenChange && onPreviewOpenChange(!!previewId); }, [previewId]);

  useEffectM(() => {
    if (!previewId) return;
    const onKey = (e) => { if (e.key === "Escape") setPreviewId(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewId]);

  const getPreviewData = (id) => {
    const starter = starters.find(t => t.id === id);
    if (starter) return { name: starter.name, specialty: starter.specialty, sections: starter.sections, sampleOutput: starter.sampleOutput };
    return null;
  };

  const preview = previewId ? getPreviewData(previewId) : null;

  // Flatten (with depth) so the assembled note reads as one continuous document,
  // sections in order, subsections nested — no per-section prompt/output split.
  const flattenWithDepth = (list, depth) => {
    let out = [];
    (list || []).forEach(s => {
      out.push({ ...s, depth });
      if (s.children && s.children.length) out = out.concat(flattenWithDepth(s.children, depth + 1));
    });
    return out;
  };

  if (preview) {
    const flat = flattenWithDepth(preview.sections, 0);
    return (
      <div className="stencil-preview-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) setPreviewId(null); }}>
      <div className="stencil-preview-page ql-preview" role="dialog" aria-modal="true">
        <button className="gallery-preview-back" onClick={() => setPreviewId(null)}>← Back to templates</button>
        <div className="gallery-preview-meta">
          <span className="gallery-preview-title">{preview.name}</span>
          {preview.specialty && <span className="gallery-card-tag">{preview.specialty}</span>}
        </div>
        <div className="ql-column-scroll edit-template-doc">
          {flat.map(s => (
            <div key={s.id} className="preview-section">
              <div className="preview-section-name">{s.depth ? "↳ " : ""}{s.name}</div>
              <div className="preview-section-text">{preview.sampleOutput[s.id] || "(no sample output configured for this section)"}</div>
            </div>
          ))}
        </div>
        <div className="gallery-preview-foot">
          <button className="btn-teal" onClick={() => { onSelect(previewId); setPreviewId(null); }}>
            {selected === previewId ? "✓ Selected" : "Use this template"}
          </button>
        </div>
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
              <div className="gallery-card-name">{t.name}</div>
              <div className="gallery-card-desc">{t.description || "No description available."}</div>
            </div>
            <div className="gallery-card-footer">
              <button className="gallery-preview-btn" onClick={e => { e.stopPropagation(); setPreviewId(t.id); }}>Preview</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreateTemplateModal({ ehr, doctorSpecialty, onClose, onCreate }) {
  const I = window.Icons;
  const CW = window.COPY.wizard;
  const CT = window.COPY.templateSettings;
  const [step, setStep] = useStateM(1);
  const [gallerySelection, setGallerySelection] = useStateM("__blank__");
  const [name, setName] = useStateM("");
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
    const onKey = (e) => { if (e.key === "Escape" && !galleryPreviewOpen) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [galleryPreviewOpen]);

  // Pre-fill name/type when a starter is selected
  useEffectM(() => {
    const starter = (window.STARTER_TEMPLATES || []).find(t => t.id === gallerySelection);
    if (starter) {
      if (!name) setName(starter.name);
    }
  }, [gallerySelection]);

  const ehrCat = (window.EHR_CATEGORY || {})[ehr];
  const ehrLabel = (ehrCat && ehrCat.label) || ehr || "your EHR";
  // Cat 2 only — doctor must pick which of their EHR's note templates this maps to before
  // fields can be fetched. Cat 1 (fixed list) and Cat 3/4 (no doctor-facing mapping) skip this.
  const needsEhrTemplate = ehrCat && ehrCat.cat === 2;
  // Cat 1/2 EHRs already let a doctor choose "As one" vs "Each separately" per section — Push
  // subsections would be a second, silently-overriding control for the same decision there.
  // Only meaningful where no such per-section choice exists but content still auto-routes
  // per section under the hood (Centricity today).
  const pushSubsectionsApplies = !!(ehrCat && ehrCat.autoRoutedPerSection);
  const ehrTemplateOptions = (window.EHR_TEMPLATES_BY_SYSTEM || {})[ehr] || [];
  const [ehrTplQuery, setEhrTplQuery] = useStateM("");
  const ehrTplQueryTrimmed = ehrTplQuery.trim().toLowerCase();
  const filteredEhrTemplateOptions = ehrTplQueryTrimmed
    ? ehrTemplateOptions.filter(t => t.name.toLowerCase().includes(ehrTplQueryTrimmed))
    : ehrTemplateOptions;
  const steps = needsEhrTemplate
    ? ["gallery", "describe", "ehrTemplate", "templateSettings"]
    : ["gallery", "describe", "templateSettings"];
  const totalSteps = steps.length;
  const stepKey = steps[step - 1];
  const stepLabel = (n) => ({ gallery: "Starting point", describe: "Describe", ehrTemplate: "EHR template", templateSettings: "Template settings" }[steps[n - 1]]);

  const step1Valid = true; // gallery always has a selection (blank by default)
  const step2Valid = !!name.trim(); // "What is this template for?" is optional
  const ehrTemplateStepValid = !needsEhrTemplate || !!ehrTemplateId;
  const selectedEhrTemplate = ehrTemplateOptions.find(t => t.id === ehrTemplateId);

  const copyFromId = gallerySelection === "__blank__" ? null : gallerySelection;

  const handleCreate = () => {
    onCreate({
      name: name.trim(),
      type,
      copyFromId,
      ehrTemplateName: selectedEhrTemplate ? selectedEhrTemplate.name : undefined,
      templateSettings: { separator, pushSubsections, retainHeadings, skipEmptySubsections, keepBulletPoints, charLimit },
    });
  };

  return (
    <div className="modal-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal--create-tpl" role="dialog" aria-modal="true">

        <div className="modal-head">
          <h2>{CW.title}</h2>
          <span className="modal-sub">{CW.subtitle}</span>
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
              selected={gallerySelection}
              onSelect={setGallerySelection}
              onPreviewOpenChange={setGalleryPreviewOpen}
              doctorSpecialty={doctorSpecialty}
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
                  {CW.ehrTemplateStepHint(ehrLabel)}
                </div>
                {ehrTemplateOptions.length === 0 ? (
                  <div className="mapping-picker-empty">No {ehrLabel} templates are set up for this practice yet — ask ops to add one.</div>
                ) : (
                  <>
                    <div className="tpl-search-wrap" style={{ margin: "0 0 12px" }}>
                      <span className="tpl-search-ico">
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.4"/>
                          <path d="M8.5 8.5L11.5 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                        </svg>
                      </span>
                      <input
                        className="tpl-search"
                        type="search"
                        placeholder={`Search ${ehrLabel} templates…`}
                        value={ehrTplQuery}
                        onChange={(e) => setEhrTplQuery(e.target.value)}
                        aria-label={`Search ${ehrLabel} templates`}
                      />
                      {ehrTplQueryTrimmed && (
                        <button className="tpl-search-clear" onClick={() => setEhrTplQuery("")} aria-label="Clear search">✕</button>
                      )}
                    </div>
                    {filteredEhrTemplateOptions.length === 0 ? (
                      <div className="tpl-no-results" style={{ padding: "12px 0" }}>No {ehrLabel} templates match "{ehrTplQuery}"</div>
                    ) : (
                      <div className="ehr-tpl-list">
                        {filteredEhrTemplateOptions.map(t => (
                          <button key={t.id} type="button"
                            className={"ehr-tpl-option" + (ehrTemplateId === t.id ? " ehr-tpl-option--selected" : "")}
                            onClick={() => setEhrTemplateId(t.id)}>
                            <span className="ehr-tpl-option-name">{t.name}</span>
                            {ehrTemplateId === t.id && <span className="ehr-tpl-option-check"><I.check /></span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── Template settings ── */}
          {stepKey === "templateSettings" && (
            <div className="create-step-body">
              <div className="adv-field-hint" style={{ marginBottom: 14 }}>
                {CT.wizardIntro}
              </div>
              <div className="req-field">
                <div className="field-label-row">
                  <label>{CT.separator.label}</label>
                  <window.InfoTip text={CT.separator.info} />
                </div>
                <input className="req-input" value={separator}
                  onChange={e => setSeparator(e.target.value)}
                  placeholder={CT.separator.placeholder} />
              </div>
              <div className="req-field">
                <div className="field-label-row">
                  <label>{CT.charLimit.label}</label>
                  <window.InfoTip text={CT.charLimit.info} />
                </div>
                <input className="req-input" type="number" min="0" value={charLimit}
                  onChange={e => setCharLimit(e.target.value)}
                  placeholder={CT.charLimit.placeholder} />
              </div>
              {pushSubsectionsApplies && (
                <div className="tpl-setting-toggle-row">
                  <div className="tpl-setting-toggle-name">
                    {CT.pushSubsections.label}
                    <window.InfoTip text={CT.pushSubsections.info(ehrLabel)} />
                  </div>
                  <window.Toggle on={pushSubsections} onChange={setPushSubsections} />
                </div>
              )}
              <div className="tpl-setting-toggle-row">
                <div className="tpl-setting-toggle-name">
                  {CT.retainHeadings.label}
                  <window.InfoTip text={CT.retainHeadings.info} />
                </div>
                <window.Toggle on={retainHeadings} onChange={setRetainHeadings} />
              </div>
              <div className="tpl-setting-toggle-row">
                <div className="tpl-setting-toggle-name">
                  {CT.skipEmptySubsections.label}
                  <window.InfoTip text={CT.skipEmptySubsections.info} />
                </div>
                <window.Toggle on={skipEmptySubsections} onChange={setSkipEmptySubsections} />
              </div>
              <div className="tpl-setting-toggle-row">
                <div className="tpl-setting-toggle-name">
                  {CT.keepBulletPoints.label}
                  <window.InfoTip text={CT.keepBulletPoints.info} />
                </div>
                <window.Toggle on={keepBulletPoints} onChange={setKeepBulletPoints} />
              </div>
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
  const CC = window.COPY.contentFields;
  const CS = window.COPY.contentSource;
  const [sectionType, setSectionType] = useStateM("open"); // "open" | "restricted" | "derivative" | "fillup"
  const [name, setName] = useStateM("");
  const [prompt, setPrompt] = useStateM("");
  const [allowedValues, setAllowedValues] = useStateM([]);
  const [derivativeKey, setDerivativeKey] = useStateM(OTHER_DERIVATIVE_OPTIONS[0]?.key || "");
  const [fillSegments, setFillSegments] = useStateM([{ type: "text", value: "" }]);
  const flatInit = flattenSectionsWithDepth(sections, 0);
  const [addAs, setAddAs] = useStateM(initialParentId ? "sub" : "top"); // "top" | "sub"
  const [parentId, setParentId] = useStateM(initialParentId || flatInit[0]?.id || "");
  const [position, setPosition] = useStateM(0); // 0 = first, N = after sibling N-1
  const [settingsOpen, setSettingsOpen] = useStateM(false);
  const [additionalTextBefore, setAdditionalTextBefore] = useStateM("");
  const [additionalTextAfter, setAdditionalTextAfter] = useStateM("");
  const [defaultNegative, setDefaultNegative] = useStateM("");

  useEffectM(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const flat = flattenSectionsWithDepth(sections, 0);
  const isSub = addAs === "sub";
  const parentNode = isSub && parentId ? flat.find((n) => n.id === parentId) : null;
  const siblings = (isSub ? (parentNode ? parentNode.children : []) : sections) || [];
  const isRestricted = sectionType === "restricted";
  const isDerivative = sectionType === "derivative";
  const isFillup = sectionType === "fillup";

  const canSubmit = name.trim() && (
    isDerivative ? !!derivativeKey
    : isRestricted ? prompt.trim() && allowedValues.length >= 2
    : isFillup ? fillSegments.some(seg => seg.type === "blank" && seg.label.trim())
    : prompt.trim()
  );

  const submit = () => {
    if (!canSubmit) return;
    onCreate({
      name: name.trim(),
      prompt: isDerivative || isFillup ? "" : prompt.trim(),
      sectionType,
      allowedValues: isRestricted ? allowedValues : undefined,
      otherDerivative: isDerivative ? derivativeKey : undefined,
      fillSegments: isFillup ? fillSegments : undefined,
      parentId: isSub ? (parentId || null) : null,
      position,
      additionalTextBefore: additionalTextBefore.trim(),
      additionalTextAfter: additionalTextAfter.trim(),
      defaultNegative: defaultNegative.trim(),
    });
  };

  return (
    <div className="modal-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal--add-section" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>Add section</h2>
          <button className="modal-x" onClick={onClose} aria-label="Close"><I.close /></button>
        </div>

        <div className="modal-body">
          <div className="adv-settings-group">
          <div className="adv-group-label">Content</div>
          <div className="req-field">
            <label>Section name</label>
            <input className="req-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Allergy History" autoFocus />
          </div>

          <div className="req-field">
            <label>Section type</label>
            <div className="section-type-choice">
              <button type="button"
                className={"section-type-card" + (sectionType === "open" ? " section-type-card--on" : "")}
                onClick={() => setSectionType("open")}>
                <div className="section-type-card-title">Open-text</div>
                <div className="section-type-card-desc">AI writes this section in its own words, from your prompt.</div>
              </button>
              <button type="button"
                className={"section-type-card" + (isRestricted ? " section-type-card--on" : "")}
                onClick={() => setSectionType("restricted")}>
                <div className="section-type-card-title">Restricted list</div>
                <div className="section-type-card-desc">AI picks one of a few fixed answers you define, like Y / N / NA.</div>
              </button>
              <button type="button"
                className={"section-type-card" + (isDerivative ? " section-type-card--on" : "")}
                onClick={() => setSectionType("derivative")}>
                <div className="section-type-card-title">Pull from another derivative</div>
                <div className="section-type-card-desc">Copies content straight from another note type, no AI writing.</div>
              </button>
              <button type="button"
                className={"section-type-card" + (isFillup ? " section-type-card--on" : "")}
                onClick={() => setSectionType("fillup")}>
                <div className="section-type-card-title">Fill-in-the-blank</div>
                <div className="section-type-card-desc">Fixed text with blanks the AI fills in from the transcript.</div>
              </button>
            </div>
          </div>

          {isDerivative ? (
            <div className="req-field">
              <div className="field-label-row">
                <label>{CS.derivativeLabel}</label>
                <window.InfoTip text={CS.derivativeInfo} />
              </div>
              <select className="req-input" value={derivativeKey} onChange={(e) => setDerivativeKey(e.target.value)}>
                {OTHER_DERIVATIVE_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>
            </div>
          ) : isFillup ? (
            <div className="req-field">
              <div className="field-label-row">
                <label>{CS.fillupLabel}</label>
                <window.InfoTip text={CS.fillupInfo} />
              </div>
              <window.FillSegmentsEditor segments={fillSegments} onChange={setFillSegments} />
            </div>
          ) : (
            <>
              <div className="req-field">
                <div className="field-label-row">
                  <label>{isRestricted ? CS.instructionLabel : CS.promptLabel}</label>
                  <window.InfoTip text={isRestricted ? CS.instructionInfo : CS.promptInfo} />
                </div>
                <textarea className="req-input req-textarea" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)}
                  placeholder={isRestricted ? CS.instructionPlaceholder : CS.promptPlaceholder} />
              </div>

              {isRestricted && (
                <div className="req-field">
                  <div className="field-label-row">
                    <label>{CS.allowedValuesLabel}</label>
                    <window.InfoTip text={CS.allowedValuesInfo} />
                  </div>
                  <window.ChipListInput values={allowedValues} onChange={setAllowedValues} placeholder={CS.allowedValuesPlaceholder} />
                </div>
              )}
            </>
          )}
          </div>

          <div className="adv-settings-group">
          <div className="adv-group-label">Position</div>
          <div className="req-field">
            <label>Add as</label>
            <div className="seg-btns">
              <button type="button" className={"seg-btn" + (!isSub ? " seg-btn--on" : "")}
                onClick={() => { setAddAs("top"); setPosition(0); }}>New section</button>
              <button type="button" className={"seg-btn" + (isSub ? " seg-btn--on" : "")}
                disabled={flat.length === 0}
                title={flat.length === 0 ? "No existing sections to nest under yet." : undefined}
                onClick={() => { setAddAs("sub"); setPosition(0); }}>Subsection</button>
            </div>
          </div>

          <div className={isSub ? "req-row2" : undefined}>
            {isSub && (
              <div className="req-field">
                <label>Parent section</label>
                <select className="req-input" value={parentId}
                  onChange={(e) => { setParentId(e.target.value); setPosition(0); }}>
                  {flat.map((n) => (
                    <option key={n.id} value={n.id}>{"—".repeat(n.depth) + (n.depth ? " " : "")}{n.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="req-field">
              <label>Placement{isSub && parentNode ? " within “" + parentNode.name + "”" : ""}</label>
              <select className="req-input" value={position} onChange={(e) => setPosition(Number(e.target.value))}>
                <option value={0}>{isSub ? "First child" : "First section"}</option>
                {siblings.filter(s => !s.ghost).map((s, i) => (
                  <option key={s.id} value={i + 1}>After "{s.name}"</option>
                ))}
              </select>
            </div>
          </div>
          </div>

          <button type="button" className="add-section-settings-toggle" onClick={() => setSettingsOpen(o => !o)}>
            {settingsOpen ? "▾" : "▸"} Section-level settings <span className="req-optional">optional — can skip and add later</span>
          </button>
          {settingsOpen && (
            <div className="add-section-settings-body">
              <div className="req-row2">
                <div className="req-field">
                  <div className="field-label-row">
                    <label>{CC.preLiteral.label}</label>
                    <window.InfoTip text={CC.preLiteral.info} />
                  </div>
                  <input className="req-input" value={additionalTextBefore}
                    placeholder={CC.preLiteral.placeholder}
                    onChange={(e) => setAdditionalTextBefore(e.target.value)} />
                </div>
                <div className="req-field">
                  <div className="field-label-row">
                    <label>{CC.postLiteral.label}</label>
                    <window.InfoTip text={CC.postLiteral.info} />
                  </div>
                  <input className="req-input" value={additionalTextAfter}
                    placeholder={CC.postLiteral.placeholder}
                    onChange={(e) => setAdditionalTextAfter(e.target.value)} />
                </div>
              </div>
              <div className="req-field">
                <div className="field-label-row">
                  <label>{CC.defaultText.label}</label>
                  <window.InfoTip text={CC.defaultText.info} />
                </div>
                <input className="req-input" value={defaultNegative}
                  placeholder={CC.defaultText.placeholder}
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
function PreviewModal({ sections, tpl, ehr, templateSettings, onUpdateSection, canEditPrompt, onClose }) {
  const CS = window.COPY.contentSource;
  const CE = window.COPY.editTemplate;
  const [generating, setGenerating] = useStateM(false);
  const [notes, setNotes] = useStateM([]); // [{ id, number, sections: [{id,name,text}] | null }] — null while generating
  const [activeTab, setActiveTab] = useStateM("prompt"); // "prompt" | note.id
  const enabledFlat = window.collectEnabledSections(sections);
  const SAMPLE = window.SAMPLE_OUTPUT;
  const ts = templateSettings || window.DEFAULT_TEMPLATE_SETTINGS;

  useEffectM(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Resolves one setting for a section — its own override wins, else the template default.
  const resolveSetting = (s, key) => {
    const overrides = s.settingOverrides || {};
    return overrides[key] !== undefined ? overrides[key] : ts[key];
  };

  // Assembles one top-level section's pushed text from the sample output, applying the
  // settings that actually change note *content* (Retain headings, Skip empty subsections,
  // Separator, Character limit, Text before/after, Keep bullet points). isRoot suppresses the
  // inline heading on the outermost call since the UI already labels it via preview-section-name
  // — everything below the root still embeds its own heading when Retain headings is on, since
  // that's genuinely part of the pushed text once subsections are joined into their parent.
  const assembleSectionText = (s, isRoot) => {
    if (!s.enabled) return null;
    const retainHeadings = resolveSetting(s, "retainHeadings");
    const skipEmpty = resolveSetting(s, "skipEmptySubsections");
    const separator = String(resolveSetting(s, "separator") ?? "\\n").replace(/\\n/g, "\n");
    const charLimit = resolveSetting(s, "charLimit");
    const keepBullets = resolveSetting(s, "keepBulletPoints");

    let own = SAMPLE[s.id] || s.defaultNegative || "";
    if (!keepBullets) own = own.split("\n").map(l => l.replace(/^[-•]\s*/, "")).join(" ").trim();
    if (s.additionalTextBefore) own = s.additionalTextBefore + (own ? "\n" + own : "");
    if (s.additionalTextAfter) own = (own ? own + "\n" : "") + s.additionalTextAfter;
    own = own.trim();

    const pieces = [];
    if (own || !skipEmpty) {
      pieces.push(retainHeadings && !isRoot ? s.name.toUpperCase() + (own ? "\n" + own : "") : own);
    }
    (s.children || []).forEach(c => {
      const childText = assembleSectionText(c, false);
      if (childText !== null) pieces.push(childText);
    });

    let result = pieces.filter(p => p !== "").join(separator);
    if (charLimit && result.length > Number(charLimit)) result = result.slice(0, Number(charLimit)) + "…";
    return result || (skipEmpty ? null : "");
  };

  // Content-source editor for one section's Prompt view — mirrors the row's own Prompt
  // card so this is a genuine alternate way to reach the same fields, not a narrower one.
  const renderPromptField = (s) => {
    if (s.otherDerivative) {
      return (
        <div className="ql-doc-field">
          <div className="ql-doc-field-label">{CS.derivativeLabel}</div>
          {canEditPrompt ? (
            <select className="adv-field-input" value={s.otherDerivative}
              onChange={(e) => onUpdateSection(s.id, { otherDerivative: e.target.value })}>
              {(window.OTHER_DERIVATIVE_OPTIONS || []).map((opt) => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <div className="ql-doc-text">
              {(((window.OTHER_DERIVATIVE_OPTIONS || []).find(o => o.key === s.otherDerivative) || {}).label) || s.otherDerivative}
            </div>
          )}
        </div>
      );
    }
    if (s.sectionType === "fillup") {
      return (
        <div className="ql-doc-field">
          <div className="ql-doc-field-label">{CS.fillupLabel}</div>
          {canEditPrompt ? (
            <window.FillSegmentsEditor segments={s.fillSegments || []}
              onChange={(segs) => onUpdateSection(s.id, { fillSegments: segs })} />
          ) : (
            <div className="ql-doc-text">{window.fillSegmentsPreview(s.fillSegments) || "No instruction written yet…"}</div>
          )}
        </div>
      );
    }
    if (s.sectionType === "restricted") {
      return (
        <div className="ql-doc-field">
          <div className="ql-doc-field-label">{CS.instructionLabel}</div>
          {canEditPrompt ? (
            <textarea
              className="ql-doc-textarea"
              value={s.stylePrompt || ""}
              placeholder={CS.instructionPlaceholder}
              onChange={(e) => onUpdateSection(s.id, { stylePrompt: e.target.value })}
            />
          ) : (
            <div className="ql-doc-text">{s.stylePrompt || "No instruction written yet…"}</div>
          )}
          <div className="ql-doc-field-label" style={{ marginTop: 10 }}>{CS.allowedValuesLabel}</div>
          {canEditPrompt ? (
            <window.ChipListInput values={s.allowedValues || []}
              onChange={(vals) => onUpdateSection(s.id, { allowedValues: vals })}
              placeholder={CS.allowedValuesPlaceholder} />
          ) : (
            <div className="ql-doc-text">{(s.allowedValues || []).join(" / ") || "None set"}</div>
          )}
        </div>
      );
    }
    return (
      <div className="ql-doc-field">
        <div className="ql-doc-field-label">{CS.promptLabel}</div>
        {canEditPrompt ? (
          <textarea
            className="ql-doc-textarea"
            value={s.stylePrompt || ""}
            onChange={(e) => onUpdateSection(s.id, { stylePrompt: e.target.value })}
            placeholder="No prompt written yet…"
          />
        ) : (
          <div className="ql-doc-text">{s.stylePrompt || "No prompt written yet…"}</div>
        )}
      </div>
    );
  };

  const flattenAll = (list) => (list || []).flatMap(s => [s, ...flattenAll(s.children)]);

  const runGenerate = () => {
    const number = notes.length + 1;
    const noteId = "note_" + number;
    const promptSnapshot = flattenAll(sections).map(s => ({
      id: s.id, stylePrompt: s.stylePrompt, allowedValues: s.allowedValues, otherDerivative: s.otherDerivative,
    }));
    setNotes(prev => [...prev, { id: noteId, number, sections: null, promptSnapshot }]);
    setActiveTab(noteId);
    setGenerating(true);
    clearTimeout(window.__genT);
    window.__genT = setTimeout(() => {
      const snapshot = sections.filter(s => s.enabled).map(s => ({ id: s.id, name: s.name, text: assembleSectionText(s, true) }));
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, sections: snapshot } : n));
      setGenerating(false);
    }, 700);
  };

  const deleteNote = (noteId) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
    if (activeTab === noteId) setActiveTab("prompt");
  };

  const restorePrompts = (note) => {
    (note.promptSnapshot || []).forEach(p => {
      onUpdateSection(p.id, { stylePrompt: p.stylePrompt, allowedValues: p.allowedValues, otherDerivative: p.otherDerivative });
    });
    setActiveTab("prompt");
  };

  return (
    <div className="stencil-preview-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="stencil-preview-page edit-template-page" role="dialog" aria-modal="true">
        <button className="gallery-preview-back" onClick={onClose}>← Back to editor</button>
        <div className="gallery-preview-meta">
          <span className="gallery-preview-title">{CE.title}</span>
          {tpl && <span className="gallery-card-tag">{tpl.name}</span>}
        </div>

        <div className="edit-template-tabsbar">
          <div className="edit-template-tabs">
            <div className={"edit-template-tab" + (activeTab === "prompt" ? " edit-template-tab--on" : "")}>
              <button type="button" className="edit-template-tab-select" onClick={() => setActiveTab("prompt")}>Prompt</button>
            </div>
            {notes.map(n => (
              <div key={n.id} className={"edit-template-tab" + (activeTab === n.id ? " edit-template-tab--on" : "")}>
                <button type="button" className="edit-template-tab-select" onClick={() => setActiveTab(n.id)}>Note {n.number}</button>
                <button type="button" className="edit-template-tab-close" aria-label={"Delete Note " + n.number}
                  onClick={() => deleteNote(n.id)}>✕</button>
              </div>
            ))}
          </div>
          <button type="button" className="btn-teal btn-sm edit-template-generate-btn" onClick={runGenerate} disabled={generating}>
            {generating ? "Generating…" : "Generate"}
          </button>
        </div>

        <div className="edit-template-body">
          <div className="edit-template-main">
            {activeTab === "prompt" ? (
              enabledFlat.length === 0 ? (
                <div className="preview-empty">All sections are disabled — enable at least one to see output.</div>
              ) : (
                <div className="ql-column-scroll edit-template-doc">
                  {sections.filter(s => s.enabled).map(s => (
                    <div key={s.id} className="preview-section">
                      <div className="preview-section-name">{s.name}</div>
                      {renderPromptField(s)}
                    </div>
                  ))}
                </div>
              )
            ) : (() => {
              const note = notes.find(n => n.id === activeTab);
              if (!note) return null;
              if (note.sections === null) {
                return <div className="preview-empty">Generating note…</div>;
              }
              return (
                <>
                  <div className="edit-template-note-actions">
                    <button type="button" className="btn-ghost btn-sm" onClick={() => restorePrompts(note)}>Use this note's prompts</button>
                  </div>
                  <div className="ql-column-scroll edit-template-doc">
                    {note.sections.map(sec => (
                      <div key={sec.id} className="preview-section">
                        <div className="preview-section-name">{sec.name}</div>
                        <div className="preview-section-text">
                          {sec.text || "(no content — Skip empty subsections is off)"}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Template Settings Modal — per-template, opened via the gear icon next to a template name ──
function TemplateSettingsModal({ template, onUpdate, onClose }) {
  const I = window.Icons;
  const CT = window.COPY.templateSettings;
  const CTM = window.COPY.templateSettingsModal;
  useEffectM(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const ehrSystem = (template && template.ehrSystem) || "";
  const ehrCat = (window.EHR_CATEGORY || {})[ehrSystem];
  // See CreateTemplateModal's pushSubsectionsApplies — same reasoning, same scope.
  const pushSubsectionsApplies = !!(ehrCat && ehrCat.autoRoutedPerSection);
  const ts = (template && template.templateSettings) || window.DEFAULT_TEMPLATE_SETTINGS;
  const set = (fields) => template && onUpdate && onUpdate(template.id, fields);

  return (
    <div className="modal-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal--request" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>{CTM.title}</h2>
          <span className="modal-sub">{CTM.subtitle(template ? template.name : "Template")}</span>
          <button className="modal-x" onClick={onClose} aria-label="Close"><I.close /></button>
        </div>
        <div className="modal-body">
          <div className="req-field">
            <div className="field-label-row">
              <label>{CT.separator.label}</label>
              <window.InfoTip text={CT.separator.info} />
            </div>
            <input className="req-input" value={ts.separator}
              onChange={e => set({ separator: e.target.value })}
              placeholder={CT.separator.placeholder} />
          </div>
          <div className="req-field">
            <div className="field-label-row">
              <label>{CT.charLimit.label}</label>
              <window.InfoTip text={CT.charLimit.info} />
            </div>
            <input className="req-input" type="number" min="0" value={ts.charLimit || ""}
              onChange={e => set({ charLimit: e.target.value })}
              placeholder={CT.charLimit.placeholder} />
          </div>
          {pushSubsectionsApplies && (
            <div className="tpl-setting-toggle-row">
              <div className="tpl-setting-toggle-name">
                {CT.pushSubsections.label}
                <window.InfoTip text={CT.pushSubsections.info((ehrCat && ehrCat.label) || ehrSystem)} />
              </div>
              <window.Toggle on={ts.pushSubsections} onChange={(v) => set({ pushSubsections: v })} />
            </div>
          )}
          <div className="tpl-setting-toggle-row">
            <div className="tpl-setting-toggle-name">
              {CT.retainHeadings.label}
              <window.InfoTip text={CT.retainHeadings.info} />
            </div>
            <window.Toggle on={ts.retainHeadings} onChange={(v) => set({ retainHeadings: v })} />
          </div>
          <div className="tpl-setting-toggle-row">
            <div className="tpl-setting-toggle-name">
              {CT.skipEmptySubsections.label}
              <window.InfoTip text={CT.skipEmptySubsections.info} />
            </div>
            <window.Toggle on={ts.skipEmptySubsections} onChange={(v) => set({ skipEmptySubsections: v })} />
          </div>
          <div className="tpl-setting-toggle-row">
            <div className="tpl-setting-toggle-name">
              {CT.keepBulletPoints.label}
              <window.InfoTip text={CT.keepBulletPoints.info} />
            </div>
            <window.Toggle on={ts.keepBulletPoints} onChange={(v) => set({ keepBulletPoints: v })} />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ConfirmModal, VersionHistoryModal, RequestNewSectionModal, CreateTemplateModal, AddSectionModal, PreviewModal, TemplateSettingsModal, OTHER_DERIVATIVE_OPTIONS });
