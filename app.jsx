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
  "ehr": "AMD"
}/*EDITMODE-END*/;

const EHR_OPTIONS = ["AMD", "AthenaOne", "Athena", "eCW", "Charm", "DrChrono"];

function mapSectionTree(list, id, fn) {
  return list.map((s) => {
    if (s.id === id) return fn(s);
    if (!s.children) return s;
    return { ...s, children: mapSectionTree(s.children, id, fn) };
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
  const templates = window.TEMPLATES;
  const [activeTpl, setActiveTpl] = useStateA("gen3");
  const [sectionRequestOpen, setSectionRequestOpen] = useStateA(false);
  const [pendingRequests, setPendingRequests] = useStateA(() =>
    window.INITIAL_PENDING_REQUESTS.map((r) => ({ ...r }))
  );
  const [sectionsByTpl, setSectionsByTpl] = useStateA(() => ({ gen3: window.makeSections() }));
  const [disableTarget, setDisableTarget] = useStateA(null);
  const [toast, setToast] = useStateA("");
  const [navCollapsed, setNavCollapsed] = useStateA(false);
  const [resetConfirm, setResetConfirm] = useStateA(false);

  const tpl = activeTpl ? templates.find((x) => x.id === activeTpl) : null;
  const unseenCount = pendingRequests.filter(r => !r.seenByDoctor && r.status !== "pending").length;
  const pendingCount = pendingRequests.length;
  const groups = window.groupsFor(templates);
  const sections = activeTpl
    ? (sectionsByTpl[activeTpl] || (sectionsByTpl[activeTpl] = window.makeSections()))
    : [];

  const setSections = (fn) => {
    if (!activeTpl) return;
    setSectionsByTpl((m) => ({ ...m, [activeTpl]: fn(m[activeTpl] || window.makeSections()) }));
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
        groups={groups}
        activeId={activeTpl}
        onSelect={selectTpl}
        onRequest={() => flash("Request New Template → Style Transfer")}
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
                  <div className="ed-meta">
                    {tpl.derivative && <span>{tpl.derivative} · </span>}
                    EHR Template: <span className="ed-mono">{tpl.ehr}</span>
                  </div>
                </div>
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
                    : <span className="btn-outline-sub">Add a section to any template</span>}
                </button>
              </header>
              <div className="ed-toolbar">
                <span className="ed-toolbar-hint">
                  Changes apply to your live template immediately on save
                </span>
                <div className="ed-toolbar-actions">
                  <button className="btn-ghost btn-sm" onClick={() => setResetConfirm(true)}>Reset to default</button>
                  <button className="btn-teal btn-sm" onClick={() => flash("Changes saved")}>Save changes</button>
                </div>
              </div>
              <window.SectionTable
                sections={sections}
                ehr={t.ehr}
                onToggle={handlers.onToggle}
                onExpand={handlers.onExpand}
                onToggleDetails={handlers.onToggleDetails}
                onReorder={handlers.onReorder}
                onRemap={handlers.onRemap}
                onSetMappingMode={handlers.onSetMappingMode}
                onUpdate={handlers.onUpdate}
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

      {sectionRequestOpen && (
        <window.RequestNewSectionModal
          templates={templates}
          activeTplId={activeTpl}
          pending={pendingRequests}
          onClose={() => setSectionRequestOpen(false)}
          onSubmit={submitSectionRequest}
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
        <TweakSelect label="EHR system" value={t.ehr}
          options={EHR_OPTIONS}
          onChange={(v) => setTweak("ehr", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
