// app.jsx — root: wires templates, sections, modal, tweaks
const { useState: useStateA } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#747AF7",
  "density": "regular",
  "showAdvancedInline": true,
  "monoMapping": true
}/*EDITMODE-END*/;

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
  const [modalId, setModalId] = useStateA(null);
  const [disableTarget, setDisableTarget] = useStateA(null);
  const [toast, setToast] = useStateA("");
  const [navCollapsed, setNavCollapsed] = useStateA(false);

  const tpl = activeTpl ? templates.find((x) => x.id === activeTpl) : null;
  const showAmdDetail = tpl && tpl.ehrSystem === "AMD";
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
    onConfig: (id, v) => setSections((arr) => mapSectionTree(arr, id, (s) => ({ ...s, config: v }))),
    onExpand: (id) => setSections((arr) => mapSectionTree(arr, id, (s) => ({ ...s, expanded: !s.expanded }))),
    onToggleDetails: (id) =>
      setSections((arr) => mapSectionTree(arr, id, (s) => ({ ...s, detailsExpanded: !s.detailsExpanded }))),
    onOpenModal: (id) => setModalId(id),
    onEntity: (id, entityId, value) =>
      setSections((arr) => mapSectionTree(arr, id, (s) => ({
        ...s,
        entities: s.entities.map((e) => (e.id === entityId ? { ...e, value } : e)),
      }))),
    onDefaultNegative: (id, value) =>
      setSections((arr) => mapSectionTree(arr, id, (s) => ({ ...s, defaultNegative: value }))),
  };

  const selectTpl = (id) => {
    if (activeTpl === id) { setActiveTpl(null); return; }
    if (!sectionsByTpl[id]) setSectionsByTpl((m) => ({ ...m, [id]: window.makeSections() }));
    setActiveTpl(id);
  };

  const modalSection = modalId ? findSection(sections, modalId) : null;

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
      },
    ]);
    setSectionRequestOpen(false);
    flash("Section request sent — ops will review");
  };

  const saveModal = (data) => {
    setSections((arr) => mapSectionTree(arr, modalId, (s) => ({ ...s, ...data })));
    setModalId(null);
    flash("Connections & static text saved");
  };

  const densPad = { compact: 14, regular: 20, comfy: 28 }[t.density];

  return (
    <div className="app" style={{ "--accent": t.accent, "--row-pad": densPad + "px" }}>
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
                    Mapped EHR Template: <span className="ed-mono">{tpl.ehr}</span>
                  </div>
                  {showAmdDetail && <div className="ed-amd-hint">AMD: mappings use <span className="ed-mono">Page &gt; Field</span> format. Push behavior column shows append/prepend/replace and static text.</div>}
                </div>
                <button className="btn-outline btn-outline--req" onClick={() => setSectionRequestOpen(true)}>
                  <span className="btn-outline-main">Request New Section</span>
                  {pendingCount > 0
                    ? <span className="btn-outline-sub btn-outline-sub--coral">{pendingCount} Pending Request{pendingCount === 1 ? "" : "s"}</span>
                    : <span className="btn-outline-sub">Add a section to any template</span>}
                </button>
              </header>
              <window.SectionTable sections={sections} showAmdDetail={showAmdDetail} {...handlers} />
            </>
          )}
        </div>
      </main>

      {modalSection && (
        <window.ConnectionsModal section={modalSection} onClose={() => setModalId(null)} onSave={saveModal} />
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
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
