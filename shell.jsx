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

function Sidebar() {
  const I = window.Icons;
  const items = [
    { id: "home", label: "Home", icon: I.home },
    { id: "macros", label: "Macros", icon: I.bolt, badge: true },
    { id: "refer", label: "Refer", icon: I.refer },
    { id: "faq", label: "FAQ", icon: I.faq },
    { id: "settings", label: "Settings", icon: I.gear, active: true },
  ];
  return (
    <nav className="sidebar">
      <div className="sidebar-logo"><Logo /></div>
      <div className="sidebar-items">
        {items.map((it) => (
          <button key={it.id} className={"nav-item" + (it.active ? " nav-item--active" : "")}>
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

function TemplateList({ groups, activeId, onSelect, onRequest, onCreateTemplate, collapsed, onToggle }) {
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
      <button className="tpl-collapse" onClick={onToggle} title={collapsed ? "Expand templates" : "Collapse templates"} aria-label="Toggle template list">
        <window.Icons.chevron />
      </button>
      <div className="tpl-inner">
        <h1 className="tpl-title">My Templates</h1>
        <button className="btn-teal tpl-create" onClick={onCreateTemplate}>
          + Create template
        </button>
        <button className="btn-ghost tpl-request" onClick={onRequest}>
          Request from ops
        </button>
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
            <button type="button" className="tpl-search-clear" onClick={() => setQuery("")} aria-label="Clear search">×</button>
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
      </div>
    </aside>
  );
}

Object.assign(window, { Sidebar, TemplateList });
