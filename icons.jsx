// icons.jsx — inline SVG icon set (stroke = currentColor unless noted)
const Icons = {
  home: (p) => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" {...p}>
      <path d="M12 3 2.5 11h2.2v9h5v-6h4.6v6h5v-9H21.5L12 3z" />
    </svg>
  ),
  bolt: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...p}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  ),
  refer: (p) => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" />
      <path d="M17 8h4M19 6v4" />
    </svg>
  ),
  faq: (p) => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 5h16v11H8l-4 4V5z" />
      <path d="M9.3 9.2a2.7 2.7 0 0 1 5.2 1c0 1.8-2.6 1.9-2.6 3.4" />
      <circle cx="11.9" cy="16.4" r="0.1" />
    </svg>
  ),
  gear: (p) => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v2.6M12 18.9v2.6M21.5 12h-2.6M5.1 12H2.5M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8M18.7 18.7l-1.8-1.8M7.1 7.1 5.3 5.3" />
    </svg>
  ),
  list: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
      <path d="M8 6h12M8 12h12M8 18h12" />
      <circle cx="3.5" cy="6" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="18" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  ),
  grip: (p) => (
    <svg viewBox="0 0 16 24" width="14" height="20" fill="currentColor" {...p}>
      <circle cx="5" cy="5" r="1.6" /><circle cx="11" cy="5" r="1.6" />
      <circle cx="5" cy="12" r="1.6" /><circle cx="11" cy="12" r="1.6" />
      <circle cx="5" cy="19" r="1.6" /><circle cx="11" cy="19" r="1.6" />
    </svg>
  ),
  chevron: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  sliders: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 7h11M19 7h1M4 17h1M9 17h11" />
      <circle cx="17" cy="7" r="2.2" /><circle cx="7" cy="17" r="2.2" />
    </svg>
  ),
  info: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" /><circle cx="12" cy="7.7" r="0.1" />
    </svg>
  ),
  lock: (p) => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  ),
  plus: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  close: (p) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  doc: (p) => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M6 3h8l4 4v14H6V3z" /><path d="M14 3v4h4" />
    </svg>
  ),
  database: (p) => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <ellipse cx="12" cy="5.5" rx="7" ry="2.6" />
      <path d="M5 5.5v13c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-13" />
      <path d="M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6" />
    </svg>
  ),
  trash: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
    </svg>
  ),
};
window.Icons = Icons;
