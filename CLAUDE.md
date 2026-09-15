# My Templates prototype — working notes for Claude

Doctor-facing template editor prototype: plain JSX files compiled in-browser via Babel
standalone. No build step, no bundler, no tests, no typecheck — the only way to verify a
change is to run it in a browser.

- **`node check-copy.js`** — run this after any edit that touches `copy.jsx` or a
  `window.COPY.*`/alias usage in the other files. It resolves every COPY reference against
  the real object and flags typos in copy keys (e.g. `CT.seperator`) without opening a
  browser. Cheap — run it before doing a full click-through verification.
- **`python3 .claude/session-stats.py`** — per-message tool-call/token breakdown for the
  current (or a named) session transcript. A message with a high tool-call count and a
  narrow tool spread (e.g. `javascript_tool×19` on one message) is a retry-loop signal, not
  real work — that's what caught this repo's Browser-pane click-not-registering incident.

## Running / previewing

- **Don't touch the Browser pane unless extremely necessary.** Locate copy/text by `grep`/Read on
  source files, not by clicking through the running app or driving `dev-inspector.js`. Verify
  copy edits with `node check-copy.js`, not a click-through. Reserve actual browser interaction
  (preview_start, navigate, click, screenshot) for changes that touch logic, layout, or behavior —
  and even then, only once per rendering pattern per session, not on every repeat edit of the
  same kind.
- Dev server config is in `.claude/launch.json` → `python3 devserver.py 8877 <repo path>`.
  Always use `devserver.py`, not bare `python -m http.server` — it disables caching so edits
  show up on reload without a `?v=` cache-bust bump.
- To jump straight to a UI state instead of clicking through the sidebar, use the query params
  documented in [DEV_STATE_URLS.md](DEV_STATE_URLS.md) — e.g. `?tpl=gen1` opens the Cardiology
  Visit template directly, `?openSettings=<Section Name>` auto-expands a section's panel,
  `?openTemplateSettings=1` auto-opens the Template EHR mapping settings modal (the gear icon).
- When verifying in the Browser pane, prefer `read_page` → click by `ref` (or drive React
  directly via `javascript_tool`) over raw screenshot coordinates. The preview pane's screenshot
  can be rendered at a different scale than the actual viewport, so coordinate clicks can land
  on the wrong element without erroring.

## File map — landmines

- `index.html` is the live, canonical entry point. Script load order matters: `tweaks-panel.jsx`,
  `icons.jsx`, `data.jsx`, `copy.jsx`, `shell.jsx`, `rows.jsx`, `modal.jsx`, `design-tokens.js`,
  `app.jsx`.
- `My Templates.html` (a second entry point the README also lists as runnable) has drifted out
  of sync — it doesn't load `copy.jsx` at all and is pinned to a stale `?v=9` cache-bust. Don't
  treat it as authoritative; verify against `index.html` instead, and flag to the user before
  relying on it for anything.
- `settings.jsx` (a legacy "Settings Portal" page) was deleted — it was never referenced by
  `index.html`, and its copy of the template-level settings had drifted out of sync with the
  real modal in `modal.jsx`. If something references it, that's stale, not a signal to restore it.
- `copy.jsx` is the actual source of UI copy. `MY_TEMPLATES_COPY_INVENTORY.md` is a hand-maintained
  mirror of the same strings for human review — **a copy change in `copy.jsx` needs the matching
  line updated in the inventory doc too**; neither generates the other.
- `MY_TEMPLATES_PRD.md` is the canonical product-decisions doc, but its prose can lag behind the
  actual UI copy/behavior — cross-check against the running app or `copy.jsx`/`data.jsx` rather
  than assuming the PRD text is current.
- `dev-inspector.js` adds a dev-only "click an element, get its file:line" overlay (toggle
  bottom-right, "🔍 Inspect") by stamping `data-src` onto every JSX element at Babel-transform
  time. **Known blind spot:** shared/reusable components (e.g. `InfoTip`'s popover in `rows.jsx`)
  report the line where that JSX is *written* once, not where the specific prop value came from —
  every info-tooltip in the app points to the same `rows.jsx:35`. When a reference lands on a
  generic wrapper like that, trace up to the real call site (e.g. `<window.InfoTip text={CT.x.info}
  />` in `modal.jsx`) to find the actual copy source in `copy.jsx`.

## Data model quick reference

- Template-level push settings live in `DEFAULT_TEMPLATE_SETTINGS` (`data.jsx`) and are edited via
  the gear-icon "Template EHR mapping settings" modal and step 4 of the Create Template wizard (both
  in `modal.jsx`) — both pull field labels/placeholders/info text from `window.COPY.templateSettings`
  in `copy.jsx`, so a field only needs adding in one place there.
- `charLimit`, `pushSubsections`, `retainHeadings`, `removeBulletPoints`, `paragraphSeparator`,
  `subsectionSeparator` are per-section overridable — see `getTemplateOverrideFields` in `rows.jsx`.
  `sectionSeparator` is template-wide only (joining sections that share one EHR field only makes
  sense consistently across the whole template, not toggled per section).
- A section's `pushOrder` (number, optional, on the section object itself) controls which order
  2+ sections combine in when they map to the same EHR field. It's written the same way as every
  other field, via the generic `onUpdate(id, fields)` patcher — no special-casing. `rows.jsx`'s
  `computeEhrGroups(sections)` is the one place that groups sections by `s.ehr` and sorts each
  group by `pushOrder`; both `SectionTable` (template view, needs only the counts, to flag a row
  "Shared") and `EhrMappingView` (needs the full sorted groups, to render + let the doctor
  drag-reorder them) call it. Push order is only manageable from `EhrMappingView` — the template
  view's "Shared" badge is a plain, non-interactive label now.
- **Two views of the same template**, toggled in `app.jsx` (`templateViewMode` state, header
  segmented control): `SectionTable` (`rows.jsx`) is the full editable "Marvix template view";
  `EhrMappingView` (`rows.jsx`) is a read-only view of the same `sections`, grouped by EHR field
  instead of by note structure — the only thing it can mutate is `pushOrder`, via drag-and-drop.
