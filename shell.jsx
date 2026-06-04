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

function TemplateList({ groups, activeId, onSelect, onRequest, collapsed, onToggle }) {
  return (
    <aside className={"tpl-panel" + (collapsed ? " tpl-panel--collapsed" : "")}>
      <button className="tpl-collapse" onClick={onToggle} title={collapsed ? "Expand templates" : "Collapse templates"} aria-label="Toggle template list">
        <window.Icons.chevron />
      </button>
      <div className="tpl-inner">
        <h1 className="tpl-title">My Templates</h1>
        <button className="btn-outline tpl-request" onClick={onRequest}>
          <span className="btn-outline-main">Request New Template</span>
          <span className="btn-outline-sub">Redirects to Style Transfer</span>
        </button>
        <div className="tpl-scroll">
          {groups.map((g) => (
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
