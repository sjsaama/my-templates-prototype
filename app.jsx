// app.jsx — root: wires templates, sections, modal, tweaks
const { useState: useStateA } = React;

// Reorder sections — enforces same-parent constraint for subsections.
function reorderSections(sections, dragId, targetId, pos) {
  if (dragId === targetId) return sections;

  function getParentRef(list, id, parent) {
    for (const s of list) {
      if (s.id === id) return parent;
      if (s.children) {
        const found = getParentRef(s.children, id, s);
        if (found !== undefined) return found;
      }
    }
    return undefined;
  }

  const dragParent = getParentRef(sections, dragId, null);
  const targetParent = getParentRef(sections, targetId, null);

  // Only allow reorder within the same parent scope
  if ((dragParent && dragParent.id) !== (targetParent && targetParent.id)) return sections;

  const srcList = dragParent ? [...dragParent.children] : [...sections];
  const dragIdx = srcList.findIndex(s => s.id === dragId);
  if (dragIdx === -1) return sections;
  const [item] = srcList.splice(dragIdx, 1);

  let targetIdx = srcList.findIndex(s => s.id === targetId);
  if (pos === 'after') targetIdx = targetIdx + 1;
  srcList.splice(Math.max(0, targetIdx), 0, item);

  if (!dragParent) return srcList;
  return mapSectionTree(sections, dragParent.id, p => ({ ...p, children: srcList }));
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#747AF7",
  "density": "regular",
  "showAdvancedInline": true,
  "monoMapping": true,
  "ehr": "AMD",
  "errorScenario": "none",
  "dualMappingDemo": "none"
}/*EDITMODE-END*/;

// This branch is scoped to AMD only — other EHR systems live on their own branches.
const EHR_OPTIONS = ["AMD"];
const EHR_LOCKED = true;

const ERROR_SCENARIOS = {
  none: [],
  athena_checkin: [
    { id: "pi1", section: "History of Present Illness", error: "Check-in not complete", type: "checkin", msg: "This note couldn't be pushed because the patient's check-in isn't complete in Athena. Finish check-in, then push again.", selfServe: true },
    { id: "pi2", section: "Assessment & Plan", error: "Check-in not complete", type: "checkin", msg: "This note couldn't be pushed because the patient's check-in isn't complete in Athena. Finish check-in, then push again.", selfServe: true },
  ],
  athena_section: [
    { id: "pi1", section: "History of Present Illness", error: "Field mapping broken", type: "mapping_broken", msg: "One or more sections failed to push. Support has been notified.", selfServe: false },
    { id: "pi2", section: "Assessment & Plan", error: "Field mapping broken", type: "mapping_broken", msg: "One or more sections failed to push. Support has been notified.", selfServe: false },
  ],
  athena_transient: [
    { id: "pi1", section: "History of Present Illness", error: "Athena API error", type: "transient", msg: "Something went wrong on Athena's end — we'll retry automatically. If this keeps happening, contact support.", selfServe: false },
  ],
  athena_auth: [
    { id: "pi1", section: "History of Present Illness", error: "Authentication error", type: "auth", msg: "Push failed due to an authentication issue. Contact support.", selfServe: false },
  ],
  amd_template_changed: [
    { id: "pi1", section: "History of Present Illness", error: "AMD template updated", type: "template_changed", msg: "Your AMD template was updated and some field mappings are no longer valid. Support has been notified.", selfServe: false },
    { id: "pi2", section: "Assessment & Plan", error: "AMD template updated", type: "template_changed", msg: "Your AMD template was updated and some field mappings are no longer valid. Support has been notified.", selfServe: false },
  ],
  amd_too_long: [
    { id: "pi1", section: "History of Present Illness", error: "Content too long", type: "too_long", msg: "'History of Present Illness' is too long for this field (max 2,000 chars). Shorten your note and push again.", selfServe: true },
  ],
  amd_no_permission: [
    { id: "pi1", section: "History of Present Illness", error: "Permission denied", type: "permission", msg: "Marvix doesn't have permission to write to AMD. Ask your practice admin to check account permissions.", selfServe: false },
  ],
  amd_invalid_value: [
    { id: "pi1", section: "Chief Complaint Enable", error: "Invalid field value", type: "invalid_value", msg: "'Chief Complaint Enable' contains a value AMD doesn't accept for this checkbox field. Contact support.", selfServe: false },
  ],
  veradigm_chart: [
    { id: "pi1", section: "History of Present Illness", error: "Chart not open", type: "chart_closed", msg: "Veradigm requires the patient's chart to be open before pushing. Open the chart and try again.", selfServe: true },
  ],
  veradigm_locked: [
    { id: "pi1", section: "Assessment & Plan", error: "Encounter locked", type: "locked", msg: "This encounter is locked in Veradigm and can't be edited.", selfServe: false },
  ],
};

function mapSectionTree(list, id, fn) {
  return list.map((s) => {
    if (s.id === id) return fn(s);
    if (!s.children) return s;
    return { ...s, children: mapSectionTree(s.children, id, fn) };
  });
}
function mapAllSections(list, fn) {
  return list.map((s) => {
    const next = fn(s);
    if (!s.children) return next;
    return { ...next, children: mapAllSections(s.children, fn) };
  });
}
function findSection(sections, id) {
  for (const s of sections) {
    if (s.id === id) return s;
    if (s.children) {
      const hit = findSection(s.children, id);
      if (hit) return hit;
    }
  }
  return null;
}

function removeSectionFromTree(list, id) {
  return list
    .filter((s) => s.id !== id)
    .map((s) => (s.children ? { ...s, children: removeSectionFromTree(s.children, id) } : s));
}

function collectUsedFields(sections) {
  const used = [];
  const walk = (list) => {
    list.forEach((s) => {
      if (!s.ghost && s.ehr) used.push(s.ehr);
      if (s.children) walk(s.children);
    });
  };
  walk(sections);
  return used;
}

function EditorEmpty() {
  return (
    <div className="ed-empty">
      <p>No template selected. Choose a template to see its details.</p>
    </div>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return <div className="toast">{msg}</div>;
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const ehr = EHR_LOCKED ? "AMD" : t.ehr;
  const [templates, setTemplates] = useStateA(window.TEMPLATES);
  const [createTemplateOpen, setCreateTemplateOpen] = useStateA(false);
  const [activeTpl, setActiveTpl] = useStateA("gen3");
  const [sectionRequestOpen, setSectionRequestOpen] = useStateA(false);
  const [pendingRequests, setPendingRequests] = useStateA(() =>
    window.INITIAL_PENDING_REQUESTS.map((r) => ({ ...r }))
  );
  const [sectionsByTpl, setSectionsByTpl] = useStateA(() => ({ gen3: window.makeSections() }));
  const [pushModeByTpl, setPushModeByTpl] = useStateA({});
  const [charLimitByTpl, setCharLimitByTpl] = useStateA({});
  const [subsectionSpacing, setSubsectionSpacing] = useStateA("\n");
  const [disableTarget, setDisableTarget] = useStateA(null);
  const [toast, setToast] = useStateA("");
  const [navCollapsed, setNavCollapsed] = useStateA(false);
  const [resetConfirm, setResetConfirm] = useStateA(false);
  const pushIssues = ERROR_SCENARIOS[t.errorScenario] || [];
  const [pushIssuesDismissed, setPushIssuesDismissed] = useStateA(false);
  const { useEffect: useEffectA } = React;
  useEffectA(() => { setPushIssuesDismissed(false); }, [t.errorScenario]);
  const [remapTarget, setRemapTarget] = useStateA(null);
  const [previewOpen, setPreviewOpen] = useStateA(false);
  const [addSectionOpen, setAddSectionOpen] = useStateA(null); // { parentId: string|null } | null

  const tpl = activeTpl ? templates.find((x) => x.id === activeTpl) : null;
  const ehrCat = (window.EHR_CATEGORY && window.EHR_CATEGORY[ehr]) || {};
  const unseenCount = pendingRequests.filter(r => !r.seenByDoctor && r.status !== "pending").length;
  const pendingCount = pendingRequests.length;
  const visibleTemplates = EHR_LOCKED
    ? templates.filter((t) => !t.ehrSystem || t.ehrSystem === "AMD")
    : templates;
  const sections = activeTpl
    ? (sectionsByTpl[activeTpl] || (sectionsByTpl[activeTpl] = window.makeSections()))
    : [];
  const templatePushMode = (activeTpl && pushModeByTpl[activeTpl]) || "Prepend";
  const templateCharLimit = (activeTpl && charLimitByTpl[activeTpl]) || 2000;

  const setSections = (fn) => {
    if (!activeTpl) return;
    setSectionsByTpl((m) => ({ ...m, [activeTpl]: fn(m[activeTpl] || window.makeSections()) }));
  };

  const applyTemplatePushMode = (mode) => {
    if (!activeTpl) return;
    setPushModeByTpl((m) => ({ ...m, [activeTpl]: mode }));
    setSections((arr) => mapAllSections(arr, (s) => (s.ghost ? s : { ...s, config: mode })));
    flash("Push setting applied to all sections — change any section to override");
  };

  const applyTemplateCharLimit = (limit) => {
    if (!activeTpl) return;
    const n = Math.max(0, parseInt(limit, 10) || 0);
    setCharLimitByTpl((m) => ({ ...m, [activeTpl]: n }));
    flash("Character limit updated for this template");
  };

  const flash = (msg) => { setToast(msg); clearTimeout(window.__tt); window.__tt = setTimeout(() => setToast(""), 2600); };

  const applyToggle = (id, v) => setSections((arr) => mapSectionTree(arr, id, (s) => ({ ...s, enabled: v })));

  const handlers = {
    onToggle: (id, v) => {
      if (v) { applyToggle(id, true); return; }
      const sec = findSection(sections, id);
      if (!sec) return;
      const impact = window.sectionImpact(sec);
      if (impact.macros > 0 || impact.summarizers > 0) setDisableTarget({ id, section: sec, impact });
      else applyToggle(id, false);
    },
    onExpand: (id) => setSections((arr) => mapSectionTree(arr, id, (s) => ({ ...s, expanded: !s.expanded }))),
    onToggleDetails: (id) =>
      setSections((arr) => mapSectionTree(arr, id, (s) => ({ ...s, detailsExpanded: !s.detailsExpanded }))),
    onReorder: (dragId, targetId, pos) =>
      setSections((arr) => reorderSections(arr, dragId, targetId, pos)),
    onRemap: (id, ehr, scribeIt) =>
      setSections((arr) => mapSectionTree(arr, id, (s) => ({ ...s, ehr, scribeIt: scribeIt !== undefined ? scribeIt : s.scribeIt }))),
    onSetMappingMode: (id, mode) =>
      setSections((arr) => mapSectionTree(arr, id, (s) => ({ ...s, mappingMode: mode }))),
    onUpdate: (id, fields) =>
      setSections((arr) => mapSectionTree(arr, id, (s) => ({ ...s, ...fields }))),
    onTogglePrompt: (id) =>
      setSections((arr) => mapSectionTree(arr, id, (s) => ({ ...s, promptOpen: !s.promptOpen }))),
    onDeleteSection: (id) => {
      setSections((arr) => removeSectionFromTree(arr, id));
      flash("Section deleted");
    },
    onAddSection: (parentId) => setAddSectionOpen({ parentId }),
  };

  const handleCreateSection = (data) => {
    if (!addSectionOpen) return;
    const newSection = {
      id: "custom_" + Date.now().toString(36),
      name: data.name,
      custom: true,
      ehr: data.field || "",
      config: templatePushMode || "Prepend",
      enabled: true,
      macros: [],
      summarizers: [],
      staticStart: "",
      staticEnd: "",
      expanded: false,
      detailsExpanded: false,
      promptOpen: false,
      defaultNegative: "",
      styleDetail: "Standard",
      styleFormat: "Prose",
      stylePrompt: data.prompt,
    };
    const parentId = addSectionOpen.parentId;
    if (parentId) {
      setSections((arr) =>
        mapSectionTree(arr, parentId, (p) => ({
          ...p,
          expanded: true,
          children: [...(p.children || []), newSection],
        }))
      );
    } else {
      setSections((arr) => [...arr, newSection]);
    }
    setAddSectionOpen(null);
    flash("Section added");
  };

  const handleCreateTemplate = (data) => {
    const newId = "user_" + Date.now().toString(36);
    const newTpl = {
      id: newId,
      name: data.name,
      derivative: data.type,
      ehr: data.ehrTemplateName ? (ehr ? ehr.split("_")[0] + "_" + data.ehrTemplateName.replace(/\s+/g, "_") : data.ehrTemplateName) : "",
      ehrSystem: ehr || "AMD",
      group: "My Templates",
      userCreated: true,
    };
    setTemplates(arr => [...arr, newTpl]);
    // Cat 2 (fetch-based EHRs) starts blank — a generic default section may not correspond to
    // anything in the doctor's real EHR template. Cat 1/3/4 start from Marvix's defaults.
    const baseSections = data.copyFromId && sectionsByTpl[data.copyFromId]
      ? JSON.parse(JSON.stringify(sectionsByTpl[data.copyFromId]))
      : (ehrCat.cat === 2 ? [] : window.makeSections());
    setSectionsByTpl(m => ({ ...m, [newId]: baseSections }));
    setActiveTpl(newId);
    setCreateTemplateOpen(false);
    flash("Template created — configure your sections and EHR mapping below");
  };

  const selectTpl = (id) => {
    if (activeTpl === id) { setActiveTpl(null); return; }
    if (!sectionsByTpl[id]) setSectionsByTpl((m) => ({ ...m, [id]: window.makeSections() }));
    setActiveTpl(id);
  };

  const submitSectionRequest = (data) => {
    setPendingRequests((arr) => [
      ...arr,
      {
        id: "req_" + Date.now().toString(36),
        name: data.name,
        description: data.description || "No description provided.",
        tplIds: data.tplIds,
        daysAgo: 0,
        ehr: data.ehr,
        isSubsection: data.isSubsection,
        parentName: data.parentName,
        status: "pending",
        ops_note: "",
        seenByDoctor: true,
      },
    ]);
    setSectionRequestOpen(false);
    flash("Section request sent — ops will review");
  };

  const densityVars = window.densityStyle(t.density, t.accent);
  const isLocalDev =
    typeof location !== 'undefined' &&
    (location.hostname === 'localhost' ||
      location.hostname === '127.0.0.1' ||
      location.protocol === 'file:');

  return (
    <div className="app" style={densityVars}>
      {isLocalDev && (
        <div className="dev-ribbon" role="status">
          Local preview — use <strong>Tweaks</strong> (bottom-right) → Row density &amp; Accent. Hard-refresh if styles look stale (⌘⇧R).
        </div>
      )}
      <window.Sidebar />
      <window.TemplateList
        templates={visibleTemplates}
        activeId={activeTpl}
        onSelect={selectTpl}
        onRequest={() => flash("Request from ops → Style Transfer")}
        onCreateTemplate={() => setCreateTemplateOpen(true)}
        collapsed={navCollapsed}
        onToggle={() => setNavCollapsed((c) => !c)}
      />

      <main className="editor">
        <div className="editor-inner">
          {!tpl ? (
            <EditorEmpty />
          ) : (
            <>
              <header className="ed-head">
                <div className="ed-head-left">
                  <h2 className="ed-title">
                    {tpl.name}
                    {tpl.userCreated
                      ? <span className="ed-ownership ed-ownership--self">Self-serve</span>
                      : <span className="ed-ownership ed-ownership--ops">Ops-managed</span>}
                  </h2>
                  <div className="ed-meta">
                    {tpl.derivative && <span className="ed-meta-tag">{tpl.derivative}</span>}
                    {tpl.ehr && <span className="ed-meta-tag ed-meta-tag--mono">{tpl.ehr}</span>}
                  </div>
                  {tpl.userCreated ? (
                    <p className="ed-ownership-hint">You manage this template’s structure and EHR mappings — add sections, edit prompts, and remap fields.</p>
                  ) : (
                    <p className="ed-ownership-hint">Ops manages the section structure. Remap fields, adjust output settings, or request a new section from ops.</p>
                  )}
                </div>
                <div className="ed-head-right">
                  <button className="btn-ghost btn-sm" onClick={() => setPreviewOpen(true)}>Preview output</button>
                  <button className="btn-ghost btn-sm" onClick={() => setResetConfirm(true)}>Reset to default</button>
                  <button className="btn-teal btn-sm" onClick={() => flash("Changes saved")}>Save changes</button>
                  {!tpl.userCreated && (
                    <button className="btn-outline btn-outline--req" onClick={() => {
                      setSectionRequestOpen(true);
                      setPendingRequests(arr => arr.map(r => ({ ...r, seenByDoctor: true })));
                    }}>
                      {unseenCount > 0 && (
                        <span className="btn-outline-badge" aria-label={unseenCount + " updates"}>{unseenCount}</span>
                      )}
                      <span className="btn-outline-main">Request New Section</span>
                      {unseenCount > 0
                        ? <span className="btn-outline-sub btn-outline-sub--coral">{unseenCount} update{unseenCount === 1 ? "" : "s"}</span>
                        : pendingCount > 0
                        ? <span className="btn-outline-sub">{pendingCount} request{pendingCount === 1 ? "" : "s"}</span>
                        : <span className="btn-outline-sub">Ask ops to add a section</span>}
                    </button>
                  )}
                </div>
              </header>
              {/* AMD global settings — Push setting + Character limit */}
              {ehr === "AMD" && ehrCat.cat <= 2 && (
                <div className="tpl-settings-stack">
                  <div className="tpl-settings-bar">
                    <span className="tpl-settings-label">Push setting</span>
                    <div className="tpl-settings-seg" role="group" aria-label="Template push setting">
                      {["Prepend", "Append", "Replace"].map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          className={"tpl-settings-seg-btn" + (templatePushMode === mode ? " tpl-settings-seg-btn--on" : "")}
                          onClick={() => applyTemplatePushMode(mode)}
                        >
                          {{ Prepend: "Insert before", Append: "Insert after", Replace: "Overwrite" }[mode]}
                        </button>
                      ))}
                    </div>
                    <span className="tpl-settings-hint">
                      Template default — applies to every section. Override per section in output settings.
                    </span>
                  </div>
                  <div className="tpl-settings-bar">
                    <span className="tpl-settings-label">Character limit</span>
                    <input
                      className="tpl-settings-input"
                      type="number"
                      min="0"
                      step="100"
                      value={templateCharLimit}
                      onChange={(e) => applyTemplateCharLimit(e.target.value)}
                      aria-label="Template character limit"
                    />
                    <span className="tpl-settings-hint">
                      Global only — applies to the whole template (no per-section override). AMD field max still informs too-long errors when mapped.
                    </span>
                  </div>
                </div>
              )}

              {/* Cat 4 — no push integration notice */}
              {ehrCat.cat === 4 && (
                <div className="cat4-notice">
                  <span className="cat4-notice-icon">ℹ</span>
                  <span className="cat4-notice-text">
                    <strong>{ehrCat.label}</strong> doesn't have a push integration — notes are copied manually after each visit. Section mapping isn't needed, but you can still configure content and style.
                  </span>
                </div>
              )}

              {/* Push issues to-do list */}
              {!pushIssuesDismissed && pushIssues.length > 0 && (
                <div className={"push-issues-banner" + (pushIssues[0].selfServe ? " push-issues-banner--selfserve" : "")}>
                  <div className="push-issues-head">
                    <span className="push-issues-icon">{pushIssues[0].selfServe ? "⚠" : "🔴"}</span>
                    <strong>
                      {pushIssues[0].selfServe
                        ? "Action needed — " + pushIssues.length + " section" + (pushIssues.length > 1 ? "s" : "") + " couldn't be pushed"
                        : "Push failed — " + pushIssues.length + " section" + (pushIssues.length > 1 ? "s" : "") + " didn't reach your EHR"
                      }
                    </strong>
                    <button className="push-issues-dismiss" onClick={() => setPushIssuesDismissed(true)}>✕</button>
                  </div>
                  <div className="push-issues-msg">{pushIssues[0].msg}</div>
                  <div className="push-issues-list">
                    {pushIssues.map(issue => {
                      const actions = (window.pushIssueActions || (() => ({})))(issue);
                      return (
                        <div key={issue.id} className="push-issues-item">
                          <span className="push-issues-section">• {issue.section}</span>
                          {actions.remap && (
                            <button className="push-issues-remap" onClick={() => setRemapTarget(issue.section)}>Remap</button>
                          )}
                          {actions.gotIt && (
                            <button className="push-issues-remap" onClick={() => setPushIssuesDismissed(true)}>Got it</button>
                          )}
                          {actions.support && (
                            <button className="push-issues-support">Contact support</button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <window.SectionTable
                sections={sections}
                ehr={ehr}
                templatePushMode={templatePushMode}
                pushIssues={pushIssues}
                dualMappingDemo={t.dualMappingDemo}
                remapTarget={remapTarget}
                onRemapTargetHandled={() => setRemapTarget(null)}
                onToggle={handlers.onToggle}
                onExpand={handlers.onExpand}
                onToggleDetails={handlers.onToggleDetails}
                onTogglePrompt={handlers.onTogglePrompt}
                onDeleteSection={handlers.onDeleteSection}
                onReorder={handlers.onReorder}
                onRemap={handlers.onRemap}
                onSetMappingMode={handlers.onSetMappingMode}
                onUpdate={handlers.onUpdate}
                onAddSection={tpl.userCreated ? handlers.onAddSection : null}
                canEditPrompt={!!tpl.userCreated}
              />
            </>
          )}
        </div>
      </main>

      {resetConfirm && (
        <window.ConfirmModal
          title="Reset to Marvix Default"
          subtitle={tpl ? tpl.name : ""}
          confirmLabel="Yes, Reset"
          danger
          onClose={() => setResetConfirm(false)}
          onConfirm={() => {
            setSections(() => window.makeSections());
            setResetConfirm(false);
            flash("Reset to Marvix default");
          }}
        >
          <p className="confirm-lead">All your customizations to this template will be discarded.</p>
          <ul className="confirm-list confirm-list--warn">
            <li>Custom EHR mappings will be cleared</li>
            <li>Section order will be restored to default</li>
          </ul>
        </window.ConfirmModal>
      )}

      {disableTarget && (
        <window.DisableConfirmModal
          section={disableTarget.section}
          impact={disableTarget.impact}
          onClose={() => setDisableTarget(null)}
          onConfirm={() => { applyToggle(disableTarget.id, false); setDisableTarget(null); }}
        />
      )}

      {previewOpen && (
        <window.PreviewModal
          sections={sections}
          tpl={tpl}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {createTemplateOpen && (
        <window.CreateTemplateModal
          ehr={ehr}
          templates={visibleTemplates}
          sectionsByTpl={sectionsByTpl}
          onClose={() => setCreateTemplateOpen(false)}
          onCreate={handleCreateTemplate}
        />
      )}

      {sectionRequestOpen && (
        <window.RequestNewSectionModal
          templates={visibleTemplates}
          activeTplId={activeTpl}
          pending={pendingRequests}
          onClose={() => setSectionRequestOpen(false)}
          onSubmit={submitSectionRequest}
        />
      )}

      {addSectionOpen && (
        <window.AddSectionModal
          ehr={ehr}
          ehrCat={ehrCat}
          parentName={addSectionOpen.parentId ? (findSection(sections, addSectionOpen.parentId) || {}).name : null}
          usedFields={collectUsedFields(sections)}
          onClose={() => setAddSectionOpen(null)}
          onCreate={handleCreateSection}
        />
      )}

      <Toast msg={toast} />

      <TweaksPanel>
        <TweakSection label="Theme" />
        <TweakColor label="Accent" value={t.accent}
          options={["#747AF7", "#4F46E5", "#11C9C9", "#0EA5A6", "#E0723C"]}
          onChange={(v) => setTweak("accent", v)} />
        <TweakSection label="Layout" />
        <TweakRadio label="Row density" value={t.density}
          options={["compact", "regular", "comfy"]}
          onChange={(v) => setTweak("density", v)} />
        <TweakSection label="EHR" />
        {EHR_LOCKED ? (
          <TweakRadio
            label="EHR system (AMD branch)"
            value="AMD"
            options={["AMD"]}
            onChange={() => setTweak("ehr", "AMD")}
          />
        ) : (
          <TweakSelect label="EHR system" value={t.ehr}
            options={EHR_OPTIONS}
            onChange={(v) => setTweak("ehr", v)} />
        )}
        <TweakSection label="Simulate push error" />
        <TweakSelect label="Error scenario" value={t.errorScenario}
          options={["none","amd_template_changed","amd_too_long","amd_no_permission","amd_invalid_value"]}
          onChange={(v) => setTweak("errorScenario", v)} />
        <TweakSection label="Advanced mapping demos" />
        <TweakSelect label="Dual field mapping" value={t.dualMappingDemo}
          options={["none","one_to_two","amd_checkbox"]}
          onChange={(v) => setTweak("dualMappingDemo", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
