// shell.jsx — Sidebar nav + Template list panel
const { useState } = React;

function Logo() {
  return (
    <div className="logo-mark" aria-label="App logo">
      <svg viewBox="0 0 44 40" width="40" height="36" fill="none">
        <path d="M6 26c0-9 7.5-16 16.5-16 5.5 0 9 2.5 11.5 6-3-1.5-7-1-9.5 1.5 4 .5 6.5 3 7.5 6.5-5 .5-8.5-1-11-4.5-1 5 2 9 6.5 10.5C30 38 22 38 16 34c-6.5-4-10-8-10-8z" fill="#11C9C9"/>
        <circle cx="27" cy="18.5" r="1.6" fill="#444"/>
      </svg>
    </div>
  );
}

function Sidebar({ activeView, onNavigate }) {
  const I = window.Icons;
  const items = [
    { id: "home", label: "Home", icon: I.home, view: "templates" },
    { id: "macros", label: "Macros", icon: I.bolt, badge: true, view: "macros" },
    { id: "refer", label: "Refer", icon: I.refer },
    { id: "faq", label: "FAQ", icon: I.faq },
    { id: "settings", label: "Settings", icon: I.gear },
  ];
  return (
    <nav className="sidebar">
      <div className="sidebar-logo"><Logo /></div>
      <div className="sidebar-items">
        {items.map((it) => (
          <button key={it.id}
            className={"nav-item" + (it.view && it.view === activeView ? " nav-item--active" : "")}
            onClick={it.view ? () => onNavigate(it.view) : undefined}
          >
            <span className={"nav-ico" + (it.badge ? " nav-ico--badge" : "")}>
              <it.icon />
            </span>
            <span className="nav-label">{it.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

function TemplateList({ groups, activeId, onSelect, onCreateTemplate, collapsed, onToggle }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const filteredGroups = q
    ? groups
        .map((g) => ({
          ...g,
          templates: g.templates.filter(
            (t) =>
              t.name.toLowerCase().includes(q) ||
              (t.derivative && t.derivative.toLowerCase().includes(q)) ||
              (t.ehrSystem && t.ehrSystem.toLowerCase().includes(q))
          ),
        }))
        .filter((g) => g.templates.length > 0)
    : groups;

  const totalFiltered = filteredGroups.reduce((n, g) => n + g.templates.length, 0);

  return (
    <aside className={"tpl-panel" + (collapsed ? " tpl-panel--collapsed" : "")}>
      <button className="tpl-collapse" onClick={onToggle} title={collapsed ? "Expand templates" : "Collapse templates"} aria-label="Toggle template list">
        <window.Icons.chevron />
      </button>
      <div className="tpl-inner">
        <h1 className="tpl-title">My Templates</h1>
        <button className="btn-teal tpl-create" onClick={onCreateTemplate}>
          + Create template
        </button>
        <div className="tpl-search-wrap">
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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search templates"
          />
          {q && (
            <button className="tpl-search-clear" onClick={() => setQuery("")} aria-label="Clear search">✕</button>
          )}
        </div>
        <div className="tpl-scroll">
          {q && totalFiltered === 0 && (
            <div className="tpl-no-results">No templates match "{query}"</div>
          )}
          {filteredGroups.map((g) => (
            <div className="tpl-group" key={g.label}>
              <div className="tpl-group-label">{g.label}</div>
              {g.templates.map((t) => (
                <div
                  key={t.id}
                  role="button"
                  tabIndex={0}
                  className={"tpl-item" + (t.id === activeId ? " tpl-item--active" : "")}
                  onClick={() => onSelect(t.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(t.id); } }}
                >
                  <span className="tpl-item-text">
                    <span className="tpl-item-name-row">
                      <span className="tpl-item-name">{t.name}</span>
                    </span>
                    <span className="tpl-item-meta">
                      {t.derivative && <span className="tpl-item-derivative">({t.derivative})</span>}
                      {t.ehrSystem && <span className="tpl-item-ehr-tag">{t.ehrSystem}</span>}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

// ── Macros view — flat list of every macro used anywhere in the current
// template, aggregated by name across sections. Supports a deep-link: set
// deepLinkMacro to a macro name to scroll to and briefly highlight that row.
function collectMacroUsages(sections, list) {
  (sections || []).forEach((s) => {
    (s.macros || []).forEach((m) => {
      list.push({ macroName: m.name, sectionName: s.name });
    });
    if (s.children) collectMacroUsages(s.children, list);
  });
  return list;
}

function slugifyMacroName(name) {
  return (name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function MacrosView({ sections, templateName, deepLinkMacro, onDeepLinkHandled }) {
  const { useEffect } = React;
  const [highlighted, setHighlighted] = useState(null);

  const usages = collectMacroUsages(sections, []);
  const byName = {};
  usages.forEach((u) => {
    if (!byName[u.macroName]) byName[u.macroName] = { name: u.macroName, usages: [] };
    byName[u.macroName].usages.push({ sectionName: u.sectionName });
  });
  const macros = Object.values(byName).sort((a, b) => a.name.localeCompare(b.name));

  // Split in two: this effect only reacts to an incoming deep link. Calling
  // onDeepLinkHandled() clears the parent's deepLinkMacro prop, which would
  // re-run this same effect if the fade-out timeout lived here too — the
  // cleanup from that re-run would cancel the timeout before it ever fires,
  // leaving the highlight stuck forever. The fade-out lives in its own
  // effect below, keyed on `highlighted` instead, so it's unaffected.
  useEffect(() => {
    if (!deepLinkMacro) return;
    const el = document.getElementById("macro-" + slugifyMacroName(deepLinkMacro));
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlighted(deepLinkMacro);
    onDeepLinkHandled && onDeepLinkHandled();
  }, [deepLinkMacro]);

  useEffect(() => {
    if (!highlighted) return;
    const t = setTimeout(() => setHighlighted(null), 2000);
    return () => clearTimeout(t);
  }, [highlighted]);

  return (
    <main className="macros-view">
      <div className="macros-view-inner">
        <h1 className="macros-view-title">Macros</h1>
        <p className="macros-view-sub">
          {templateName ? "Connected across " + templateName : "Connected across the current template"}
        </p>
        {macros.length === 0 ? (
          <div className="macros-view-empty">No macros connected in this template yet.</div>
        ) : (
          <div className="macros-view-list">
            {macros.map((m) => (
              <div key={m.name} id={"macro-" + slugifyMacroName(m.name)}
                className={"macros-view-card" + (highlighted === m.name ? " macros-view-card--highlight" : "")}>
                <div className="macros-view-card-name">{m.name}</div>
                <div className="macros-view-card-usages">
                  {m.usages.map((u, i) => (
                    <div key={i} className="macros-view-usage-row">
                      <span>{u.sectionName}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

Object.assign(window, { Sidebar, TemplateList, MacrosView });
