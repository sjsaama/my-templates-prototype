// shell.jsx — Sidebar nav + Template list panel + Settings nav
const { useState } = React;

function Logo() {
  return (
    <div className="logo-mark" aria-label="App logo">
      <svg viewBox="0 0 44 40" width="28" height="26" fill="none">
        <path d="M6 26c0-9 7.5-16 16.5-16 5.5 0 9 2.5 11.5 6-3-1.5-7-1-9.5 1.5 4 .5 6.5 3 7.5 6.5-5 .5-8.5-1-11-4.5-1 5 2 9 6.5 10.5C30 38 22 38 16 34c-6.5-4-10-8-10-8z" fill="#11C9C9"/>
        <circle cx="27" cy="18.5" r="1.6" fill="#2A2D3A"/>
      </svg>
    </div>
  );
}

function Sidebar({ activeNav, onNavigate }) {
  const I = window.Icons;
  const primary = [
    { id: "home", label: "Home", icon: I.home },
    { id: "macros", label: "Macros", icon: I.bolt, badge: true },
    { id: "refer", label: "Refer", icon: I.refer },
  ];
  const secondary = [
    { id: "faq", label: "FAQ", icon: I.faq },
    { id: "settings", label: "Settings", icon: I.gear },
  ];
  const renderItem = (it) => (
    <button
      key={it.id}
      type="button"
      className={"nav-item" + (activeNav === it.id ? " nav-item--active" : "")}
      onClick={() => onNavigate && onNavigate(it.id)}
    >
      <span className="nav-ico">
        <it.icon />
        {it.badge && <span className="nav-badge" aria-hidden="true" />}
      </span>
      <span className="nav-label">{it.label}</span>
    </button>
  );
  return (
    <nav className="sidebar" aria-label="Primary">
      <div className="sidebar-logo"><Logo /></div>
      <div className="sidebar-items">
        <div className="sidebar-group">{primary.map(renderItem)}</div>
        <div className="sidebar-group sidebar-group--bottom">{secondary.map(renderItem)}</div>
      </div>
    </nav>
  );
}

function LeftNavPanel({
  panelTab,
  onPanelTab,
  settingsTab,
  onSettingsTab,
  groups,
  activeId,
  onSelect,
  onRequest,
  onCreateTemplate,
  collapsed,
  onToggle,
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const filteredGroups = q
    ? groups
        .map((g) => ({
          ...g,
          templates: g.templates.filter(
            (t) =>
              t.name.toLowerCase().includes(q) ||
              (t.derivative && t.derivative.toLowerCase().includes(q))
          ),
        }))
        .filter((g) => g.templates.length > 0)
    : groups;

  const totalFiltered = filteredGroups.reduce((n, g) => n + g.templates.length, 0);

  return (
    <aside className={"tpl-panel" + (collapsed ? " tpl-panel--collapsed" : "")}>
      <button className="tpl-collapse" onClick={onToggle} title={collapsed ? "Expand panel" : "Collapse panel"} aria-label="Toggle left panel">
        <window.Icons.chevron />
      </button>
      <div className="tpl-inner">
        <div className="panel-tabs" role="tablist" aria-label="Left navigation">
          <button
            role="tab"
            aria-selected={panelTab === "templates"}
            className={"panel-tab" + (panelTab === "templates" ? " panel-tab--on" : "")}
            onClick={() => onPanelTab("templates")}
          >
            Templates
          </button>
          <button
            role="tab"
            aria-selected={panelTab === "settings"}
            className={"panel-tab" + (panelTab === "settings" ? " panel-tab--on" : "")}
            onClick={() => onPanelTab("settings")}
          >
            Settings
          </button>
        </div>

        {panelTab === "templates" ? (
          <>
            <h1 className="tpl-title">My Templates</h1>
            <div className="tpl-actions">
              <button className="btn-teal tpl-create" type="button" onClick={onCreateTemplate}>
                <window.Icons.plus />
                <span>Create template</span>
              </button>
              <button className="tpl-request" type="button" onClick={onRequest}>
                Request from ops
              </button>
            </div>
            <div className="tpl-search-wrap">
              <span className="tpl-search-ico" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="6" cy="6" r="4.25" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M9.25 9.25L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
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
                <button className="tpl-search-clear" type="button" onClick={() => setQuery("")} aria-label="Clear search">
                  <window.Icons.close />
                </button>
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
                    <button
                      key={t.id}
                      type="button"
                      className={"tpl-item" + (t.id === activeId ? " tpl-item--active" : "")}
                      onClick={() => onSelect(t.id)}
                    >
                      <span className="tpl-item-text">
                        <span className="tpl-item-name">{t.name}</span>
                        {t.derivative && <span className="tpl-item-derivative">({t.derivative})</span>}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <h1 className="tpl-title">Settings</h1>
            <p className="set-nav-lead">Global practice defaults and local per-template settings from the PRD.</p>
            <div className="set-nav" role="tablist" aria-label="Settings scope">
              <button
                role="tab"
                aria-selected={settingsTab === "global"}
                className={"set-nav-item" + (settingsTab === "global" ? " set-nav-item--on" : "")}
                onClick={() => onSettingsTab("global")}
              >
                <span className="set-nav-item-title">Global</span>
                <span className="set-nav-item-sub">Practice-level · ops-managed</span>
              </button>
              <button
                role="tab"
                aria-selected={settingsTab === "local"}
                className={"set-nav-item" + (settingsTab === "local" ? " set-nav-item--on" : "")}
                onClick={() => onSettingsTab("local")}
              >
                <span className="set-nav-item-title">Local</span>
                <span className="set-nav-item-sub">Template-level · doctor-editable</span>
              </button>
            </div>
            <div className="set-nav-footnote">
              Section output settings (additional text, default negative, AMD push mode) stay on each section row.
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

// Keep TemplateList name as alias for any older references
const TemplateList = LeftNavPanel;

Object.assign(window, { Sidebar, TemplateList, LeftNavPanel });
