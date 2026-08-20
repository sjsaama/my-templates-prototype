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
  "errorScenario": "none",
  "dualMappingDemo": "none",
  "doctorSpecialty": "Neurology"
}/*EDITMODE-END*/;

// Doctor's own specialty — narrows the "Create a template" starting-point gallery to the
// stencil(s) relevant to them plus the specialty-agnostic ones, instead of showing every
// specialty's starter to every doctor.
const DOCTOR_SPECIALTY_OPTIONS = ["Cardiology", "Primary Care", "Neurology"];

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
    { id: "pi1", section: "History of Present Illness", error: "Content too long", type: "too_long", msg: "'History of Present Illness' is too long for this field (max 1,000 chars). Shorten your note and push again.", selfServe: true },
  ],
  amd_no_permission: [
    { id: "pi1", section: "History of Present Illness", error: "Permission denied", type: "permission", msg: "Marvix doesn't have permission to write to AMD. Ask your practice admin to check account permissions.", selfServe: false },
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
function removeSectionFromTree(list, id) {
  return list
    .filter((s) => s.id !== id)
    .map((s) => (s.children ? { ...s, children: removeSectionFromTree(s.children, id) } : s));
}
function findSectionByName(list, name) {
  for (const s of list) {
    if (s.name === name) return s;
    if (s.children) {
      const hit = findSectionByName(s.children, name);
      if (hit) return hit;
    }
  }
  return null;
}

// Dev-only: reads state overrides from the URL so a specific UI state (active template,
// error scenario, a forced duplicate-field mapping, an auto-opened settings panel) can be
// reached in one navigation instead of several manual steps.
// See devserver.py / README for the param list. Never touched by the real app flow.
function getUrlOverrides() {
  if (typeof window === "undefined" || !window.location) return {};
  return Object.fromEntries(new URLSearchParams(window.location.search).entries());
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
  const [urlOverrides] = useStateA(getUrlOverrides);
  const [t] = useTweaks({
    ...TWEAK_DEFAULTS,
    ...(urlOverrides.errorScenario && { errorScenario: urlOverrides.errorScenario }),
    ...(urlOverrides.dualMapping && { dualMappingDemo: urlOverrides.dualMapping }),
  });
  const [templates, setTemplates] = useStateA(window.TEMPLATES);
  const [activeView, setActiveView] = useStateA("templates"); // "templates" | "macros"
  const [macroDeepLink, setMacroDeepLink] = useStateA(null); // macro name to scroll to + highlight on the Macros view
  const [createTemplateOpen, setCreateTemplateOpen] = useStateA(false);
  const [activeTpl, setActiveTpl] = useStateA(() => urlOverrides.tpl || "gen3");
  const [sectionRequestOpen, setSectionRequestOpen] = useStateA(false);
  const [pendingRequests, setPendingRequests] = useStateA(() =>
    window.INITIAL_PENDING_REQUESTS.map((r) => ({ ...r }))
  );
  const [sectionsByTpl, setSectionsByTpl] = useStateA(() => ({ gen3: window.makeSections() }));
  const [versionsByTpl, setVersionsByTpl] = useStateA({}); // { [tplId]: [{id, timestamp, sections, label?}] }, newest first
  const [subsectionSpacing, setSubsectionSpacing] = useStateA("\n");
  const [toast, setToast] = useStateA("");
  const [navCollapsed, setNavCollapsed] = useStateA(false);
  const [versionHistoryOpen, setVersionHistoryOpen] = useStateA(false);
  const [restoreTarget, setRestoreTarget] = useStateA(null); // version object pending confirm | null
  const pushIssues = ERROR_SCENARIOS[t.errorScenario] || [];
  const [pushIssuesDismissed, setPushIssuesDismissed] = useStateA(false);
  const { useEffect: useEffectA } = React;
  useEffectA(() => { setPushIssuesDismissed(false); }, [t.errorScenario]);
  const [remapTarget, setRemapTarget] = useStateA(null);
  const [previewOpen, setPreviewOpen] = useStateA(false);
  const [addSectionOpen, setAddSectionOpen] = useStateA(null); // { parentId: string|null } | null
  const [templateSettingsFor, setTemplateSettingsFor] = useStateA(null); // template id | null

  const tpl = activeTpl ? templates.find((x) => x.id === activeTpl) : null;
  // Every EHR has its own dedicated self-serve + managed template now, so the active
  // template's own ehrSystem *is* the current EHR — no separate override needed.
  const currentEhr = tpl ? tpl.ehrSystem : "AMD";
  const ehrCat = (window.EHR_CATEGORY && window.EHR_CATEGORY[currentEhr]) || {};
  const unseenCount = pendingRequests.filter(r => !r.seenByDoctor && r.status !== "pending").length;
  const groups = window.groupsFor(templates);
  const sections = activeTpl
    ? (sectionsByTpl[activeTpl] || (sectionsByTpl[activeTpl] = window.makeSections()))
    : [];
  // Seed the very first version the moment a template's sections are established — for
  // ops-managed templates that's the ops-configured default, for a freshly created self-serve
  // template it's whatever it looked like right after creation. Either way, "restore to any
  // version" doesn't need a special-cased "default" concept — version 1 already is that.
  if (activeTpl && !versionsByTpl[activeTpl]) {
    versionsByTpl[activeTpl] = [{
      id: "v_" + Date.now().toString(36),
      timestamp: new Date(),
      sections: JSON.parse(JSON.stringify(sections)),
      templateSettings: JSON.parse(JSON.stringify(tpl.templateSettings || window.DEFAULT_TEMPLATE_SETTINGS)),
      label: "Original",
      changes: [],
    }];
  }
  const versions = activeTpl ? (versionsByTpl[activeTpl] || []) : [];

  const setSections = (fn) => {
    if (!activeTpl) return;
    setSectionsByTpl((m) => ({ ...m, [activeTpl]: fn(m[activeTpl] || window.makeSections()) }));
  };

  const flash = (msg) => { setToast(msg); clearTimeout(window.__tt); window.__tt = setTimeout(() => setToast(""), 2600); };

  const applyToggle = (id, v) => setSections((arr) => mapSectionTree(arr, id, (s) => ({ ...s, enabled: v })));

  const handlers = {
    onToggle: (id, v) => applyToggle(id, v),
    onExpand: (id) => setSections((arr) => mapSectionTree(arr, id, (s) => ({ ...s, expanded: !s.expanded }))),
    onToggleDetails: (id) =>
      setSections((arr) => mapSectionTree(arr, id, (s) => ({ ...s, detailsExpanded: !s.detailsExpanded }))),
    onReorder: (dragId, targetId, pos) =>
      setSections((arr) => reorderSections(arr, dragId, targetId, pos)),
    // Scribe-it (eCW only) auto-attaches to the matching shortcut command whenever the
    // primary field changes, unless the doctor already picked one explicitly (scribeItManual).
    onRemap: (id, ehrVal) =>
      setSections((arr) => mapSectionTree(arr, id, (s) => {
        const next = { ...s, ehr: ehrVal };
        if (currentEhr === "eCW" && !s.scribeItManual) next.scribeIt = window.ecwScribeItAutoMatch(ehrVal);
        return next;
      })),
    onSetScribeIt: (id, value) =>
      setSections((arr) => mapSectionTree(arr, id, (s) => ({ ...s, scribeIt: value, scribeItManual: true }))),
    onResetScribeItAuto: (id) =>
      setSections((arr) => mapSectionTree(arr, id, (s) => ({ ...s, scribeIt: window.ecwScribeItAutoMatch(s.ehr), scribeItManual: false }))),
    onSetMappingMode: (id, mode) =>
      setSections((arr) => mapSectionTree(arr, id, (s) => ({ ...s, mappingMode: mode }))),
    onUpdate: (id, fields) =>
      setSections((arr) => mapSectionTree(arr, id, (s) => ({ ...s, ...fields }))),
    onDeleteSection: (id) => {
      setSections((arr) => removeSectionFromTree(arr, id));
      flash(window.COPY.toasts.sectionDeleted);
    },
    onAddSection: (parentId) => setAddSectionOpen({ parentId }),
  };

  // Dev-only: apply forceSharedMapping / openSettings URL overrides once, after this
  // template's sections have been seeded above. Lets a specific mapping/settings state
  // be reached by URL instead of manually remapping fields or clicking through panels.
  useEffectA(() => {
    if (urlOverrides.forceSharedMapping) {
      const [nameA, nameB] = urlOverrides.forceSharedMapping.split(",").map((s) => s.trim());
      const secA = findSectionByName(sections, nameA);
      const secB = nameB ? findSectionByName(sections, nameB) : null;
      if (secA && secB && secA.ehr) {
        setSections((arr) => mapSectionTree(arr, secB.id, (s) => ({ ...s, ehr: secA.ehr })));
      }
    }
    if (urlOverrides.openSettings) {
      const sec = findSectionByName(sections, urlOverrides.openSettings);
      if (sec) setSections((arr) => mapSectionTree(arr, sec.id, (s) => ({ ...s, detailsExpanded: true })));
    }
  }, []);

  const handleCreateSection = (data) => {
    if (!addSectionOpen) return;
    const newSection = {
      id: "custom_" + Date.now().toString(36),
      name: data.name,
      custom: true,
      ehr: "",
      config: "Prepend",
      enabled: true,
      macros: [],
      summarizers: [],
      staticStart: "",
      staticEnd: "",
      expanded: false,
      detailsExpanded: false,
      additionalTextBefore: data.additionalTextBefore || "",
      additionalTextAfter: data.additionalTextAfter || "",
      defaultNegative: data.defaultNegative || "",
      styleDetail: "Standard",
      styleFormat: "Prose",
      stylePrompt: data.prompt,
      otherDerivative: data.sectionType === "derivative" ? data.otherDerivative : null,
      sectionType: data.sectionType || "open",
      allowedValues: data.sectionType === "restricted" ? (data.allowedValues || []) : undefined,
      fillSegments: data.sectionType === "fillup" ? (data.fillSegments || []) : undefined,
      ehrValueMap: {},
    };
    const insertAt = (list) => {
      const arr = list || [];
      const idx = data.position < 0 || data.position > arr.length ? arr.length : data.position;
      return [...arr.slice(0, idx), newSection, ...arr.slice(idx)];
    };
    if (data.parentId) {
      setSections((arr) =>
        mapSectionTree(arr, data.parentId, (p) => ({
          ...p,
          expanded: true,
          children: insertAt(p.children),
        }))
      );
    } else {
      setSections((arr) => insertAt(arr));
    }
    setAddSectionOpen(null);
    flash(window.COPY.toasts.sectionAdded);
  };

  const handleCreateTemplate = (data) => {
    const newId = "user_" + Date.now().toString(36);
    const newTpl = {
      id: newId,
      name: data.name,
      derivative: data.type,
      ehr: data.ehrTemplateName || "",
      ehrSystem: currentEhr,
      group: "Self-serve",
      selfServe: true,
      userCreated: true,
      templateSettings: data.templateSettings || window.DEFAULT_TEMPLATE_SETTINGS,
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
    flash(window.COPY.toasts.templateCreated);
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
    flash(window.COPY.toasts.sectionRequestSent);
  };

  const densityVars = window.densityStyle(t.density, t.accent);

  // ── Add Section availability — varies by EHR category ──
  const isCat1 = ehrCat.cat === 1;
  const isCat2 = ehrCat.cat === 2;
  // Only count fields actually in *this* EHR's field list — sections mapped under a
  // previously-selected EHR (or seeded demo data) shouldn't count against a different EHR's cap.
  const ehrCounts = {};
  const walkEhrCounts = (list) => {
    for (const s of list) {
      if (!s.ghost && s.ehr) ehrCounts[s.ehr] = (ehrCounts[s.ehr] || 0) + 1;
      if (s.children) walkEhrCounts(s.children);
    }
  };
  walkEhrCounts(sections);
  const validFieldSet = new Set(
    ((window.EHR_FIELDS_BY_SYSTEM && window.EHR_FIELDS_BY_SYSTEM[currentEhr]) || []).flatMap((g) => g.fields)
  );
  const usedFieldCount = Object.keys(ehrCounts).filter((f) => validFieldSet.has(f)).length;
  const totalFieldCount = window.ehrFieldTotalCount ? window.ehrFieldTotalCount(currentEhr) : 0;
  const capReached = (isCat1 || isCat2) && (totalFieldCount === 0 || usedFieldCount >= totalFieldCount);

  let addDisabledReason = "";
  if (capReached && ehrCat.fieldsPending) addDisabledReason = (ehrCat.label || currentEhr) + "'s field list isn't confirmed yet — check with ops";
  else if (capReached) addDisabledReason = "All available " + (ehrCat.label || currentEhr) + " fields are already used";

  return (
    <div className="app" style={densityVars}>
      <window.Sidebar activeView={activeView} onNavigate={setActiveView} />
      {activeView === "macros" ? (
        <window.MacrosView
          sections={sections}
          templateName={tpl ? tpl.name : ""}
          deepLinkMacro={macroDeepLink}
          onDeepLinkHandled={() => setMacroDeepLink(null)}
        />
      ) : (
      <>
      <window.TemplateList
        groups={groups}
        activeId={activeTpl}
        onSelect={selectTpl}
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
                  <h2 className="ed-title">{tpl.name}</h2>
                </div>
                <div className="ed-head-right">
                  {tpl.userCreated && (
                    <button
                      type="button"
                      className="btn-outline btn-sm add-section-btn"
                      disabled={!!addDisabledReason}
                      title={addDisabledReason || undefined}
                      onClick={() => handlers.onAddSection(null)}
                    >
                      + Add section
                    </button>
                  )}
                  {tpl.userCreated && (
                    <button type="button" className="btn-ghost btn-sm btn-icon" onClick={() => setPreviewOpen(true)} title="Edit template" aria-label="Edit template">
                      <window.Icons.pencil />
                    </button>
                  )}
                  <button type="button" className="btn-ghost btn-sm btn-icon" onClick={() => setTemplateSettingsFor(activeTpl)} title="Template settings" aria-label="Template settings">
                    <window.Icons.gear width={15} height={15} />
                  </button>
                  <button type="button" className="btn-ghost btn-sm btn-icon" onClick={() => setVersionHistoryOpen(true)} title="Version history" aria-label="Version history">
                    <window.Icons.history />
                  </button>
                  {tpl.group === "Managed" && (
                    <button type="button" className="btn-ghost btn-sm btn-icon" onClick={() => {
                      setSectionRequestOpen(true);
                      setPendingRequests(arr => arr.map(r => ({ ...r, seenByDoctor: true })));
                    }} title="Request new section" aria-label="Request new section">
                      <window.Icons.send />
                      {unseenCount > 0 && (
                        <span className="btn-badge-count" aria-label={unseenCount + " updates"}>{unseenCount}</span>
                      )}
                    </button>
                  )}
                  <button className="btn-teal btn-sm" onClick={() => {
                    const nextSnapshot = {
                      sections: JSON.parse(JSON.stringify(sections)),
                      templateSettings: JSON.parse(JSON.stringify(tpl.templateSettings || window.DEFAULT_TEMPLATE_SETTINGS)),
                    };
                    const prevSnapshot = versions[0] || { sections: [], templateSettings: {} };
                    const changes = window.summarizeVersionChanges(prevSnapshot, nextSnapshot);
                    setVersionsByTpl(m => ({
                      ...m,
                      [activeTpl]: [
                        { id: "v_" + Date.now().toString(36), timestamp: new Date(), ...nextSnapshot, changes },
                        ...(m[activeTpl] || []),
                      ],
                    }));
                    flash(window.COPY.toasts.changesSaved);
                  }}>Save changes</button>
                </div>
              </header>
              {/* Cat 4 — no push integration notice */}
              {ehrCat.cat === 4 && (
                <div className="cat4-notice">
                  <span className="cat4-notice-icon">ℹ</span>
                  <span className="cat4-notice-text">
                    <strong>{ehrCat.label}</strong> {window.COPY.banners.noPushSuffix}
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
                  <div className="push-issues-msg">
                    {pushIssues[0].selfServe
                      ? "You can fix this yourself — see the affected section" + (pushIssues.length > 1 ? "s" : "") + " below."
                      : "Support has been notified. See the affected section" + (pushIssues.length > 1 ? "s" : "") + " below for details."}
                  </div>
                  <div className="push-issues-list">
                    {pushIssues.map(issue => (
                      <div key={issue.id} className="push-issues-item">
                        <span className="push-issues-section">• {issue.section}</span>
                        {(issue.type === "mapping_broken" || issue.selfServe) && (
                          <button className="push-issues-remap" onClick={() => setRemapTarget(issue.section)}>Remap</button>
                        )}
                        {!issue.selfServe && (
                          <button className="push-issues-support">Contact support</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <window.SectionTable
                sections={sections}
                ehr={currentEhr}
                templateSettings={tpl.templateSettings || window.DEFAULT_TEMPLATE_SETTINGS}
                onNavigateToMacro={(name) => { setActiveView("macros"); setMacroDeepLink(name); }}
                ehrTemplateName={tpl.ehr}
                pushIssues={pushIssues}
                dualMappingDemo={t.dualMappingDemo}
                remapTarget={remapTarget}
                onRemapTargetHandled={() => setRemapTarget(null)}
                onToggle={handlers.onToggle}
                onExpand={handlers.onExpand}
                onToggleDetails={handlers.onToggleDetails}
                onDeleteSection={handlers.onDeleteSection}
                onReorder={handlers.onReorder}
                onRemap={handlers.onRemap}
                onSetScribeIt={handlers.onSetScribeIt}
                onResetScribeItAuto={handlers.onResetScribeItAuto}
                onSetMappingMode={handlers.onSetMappingMode}
                onUpdate={handlers.onUpdate}
                canEditPrompt={!!tpl.userCreated}
              />
            </>
          )}
        </div>
      </main>
      </>
      )}

      {versionHistoryOpen && (
        <window.VersionHistoryModal
          versions={versions}
          templateName={tpl ? tpl.name : ""}
          onClose={() => setVersionHistoryOpen(false)}
          onRestore={(v) => { setVersionHistoryOpen(false); setRestoreTarget(v); }}
        />
      )}

      {restoreTarget && (
        <window.ConfirmModal
          title="Restore this version?"
          subtitle={(tpl ? tpl.name : "") + " — " + window.formatVersionDate(restoreTarget.timestamp)}
          confirmLabel="Yes, Restore"
          danger
          onClose={() => setRestoreTarget(null)}
          onConfirm={() => {
            const snapshot = restoreTarget;
            setSections(() => JSON.parse(JSON.stringify(snapshot.sections)));
            if (snapshot.templateSettings) {
              setTemplates(arr => arr.map(x => x.id === activeTpl
                ? { ...x, templateSettings: JSON.parse(JSON.stringify(snapshot.templateSettings)) }
                : x));
            }
            setRestoreTarget(null);
            flash(window.COPY.toasts.versionRestored(window.formatVersionDate(snapshot.timestamp)));
          }}
        >
          <p className="confirm-lead">{window.COPY.versionHistory.restoreConfirmBody}</p>
          <ul className="confirm-list confirm-list--warn">
            {window.COPY.versionHistory.restoreWarnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </window.ConfirmModal>
      )}

      {previewOpen && (
        <window.PreviewModal
          sections={sections}
          tpl={tpl}
          ehr={currentEhr}
          templateSettings={tpl.templateSettings || window.DEFAULT_TEMPLATE_SETTINGS}
          onUpdateSection={handlers.onUpdate}
          canEditPrompt={!!tpl.userCreated}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {createTemplateOpen && (
        <window.CreateTemplateModal
          ehr={currentEhr}
          doctorSpecialty={t.doctorSpecialty}
          onClose={() => setCreateTemplateOpen(false)}
          onCreate={handleCreateTemplate}
        />
      )}

      {sectionRequestOpen && (
        <window.RequestNewSectionModal
          templates={templates.filter((t) => t.group === "Managed")}
          activeTplId={activeTpl}
          pending={pendingRequests}
          onClose={() => setSectionRequestOpen(false)}
          onSubmit={submitSectionRequest}
        />
      )}

      {addSectionOpen && (
        <window.AddSectionModal
          sections={sections}
          initialParentId={addSectionOpen.parentId}
          onClose={() => setAddSectionOpen(null)}
          onCreate={handleCreateSection}
        />
      )}

      {templateSettingsFor && (
        <window.TemplateSettingsModal
          template={templates.find((x) => x.id === templateSettingsFor)}
          onUpdate={(id, fields) =>
            setTemplates(arr => arr.map(x => x.id === id
              ? { ...x, templateSettings: { ...(x.templateSettings || window.DEFAULT_TEMPLATE_SETTINGS), ...fields } }
              : x))
          }
          onClose={() => setTemplateSettingsFor(null)}
        />
      )}

      <Toast msg={toast} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
