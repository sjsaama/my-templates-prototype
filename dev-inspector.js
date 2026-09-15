// dev-inspector.js — dev-only "click to get a reference" tool for this no-build prototype.
//
// Two pieces:
// 1. A Babel plugin that stamps every JSX element with data-src="file.jsx:line" at compile
//    time (source line, not the auto-transformed <script type="text/babel"> path — see below).
// 2. A floating overlay: toggle it on, hover the app, and any element under the cursor shows
//    the file:line it was rendered from. Click to copy — paste straight into a Claude prompt.
//
// Bypasses Babel's automatic <script type="text/babel"> scanning (index.html loads each .jsx
// file itself, in order, via window.__loadBabelScript) because that auto-transform doesn't
// expose a supported hook for adding a custom plugin without also having to replicate its
// default preset config from scratch.

(function () {
  function sourceLocPlugin({ types: t }) {
    return {
      visitor: {
        JSXOpeningElement(path, state) {
          if (!path.node.loc) return;
          if (path.node.attributes.some((a) => a.name && a.name.name === "data-src")) return;
          const file = (state.filename || "unknown").split("/").pop();
          const line = path.node.loc.start.line;
          path.node.attributes.push(
            t.jsxAttribute(t.jsxIdentifier("data-src"), t.stringLiteral(`${file}:${line}`))
          );
        },
      },
    };
  }
  Babel.registerPlugin("source-loc", sourceLocPlugin);

  window.__loadBabelScript = function (src) {
    return fetch(src)
      .then((r) => r.text())
      .then((code) => {
        const filename = src.split("?")[0];
        const out = Babel.transform(code, {
          filename,
          presets: ["react"],
          plugins: ["source-loc"],
        }).code;
        const script = document.createElement("script");
        script.textContent = `${out}\n//# sourceURL=${filename}`;
        document.body.appendChild(script);
      });
  };

  function initInspector() {
    const highlight = document.createElement("div");
    highlight.style.cssText =
      "position:fixed;pointer-events:none;z-index:999998;border:2px solid #FF8888;" +
      "background:rgba(255,136,136,.12);border-radius:4px;display:none;";

    const badge = document.createElement("div");
    badge.style.cssText =
      "position:fixed;pointer-events:none;z-index:999999;background:#2A2D3A;color:#fff;" +
      "font:12px/1.4 'Roboto Mono',monospace;padding:4px 8px;border-radius:6px;display:none;white-space:nowrap;";

    const toggle = document.createElement("button");
    toggle.textContent = "🔍 Inspect";
    toggle.style.cssText =
      "position:fixed;bottom:16px;right:16px;z-index:999999;background:#2A2D3A;color:#fff;" +
      "border:none;border-radius:20px;padding:8px 14px;font:13px/1 -apple-system,sans-serif;" +
      "cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.3);";

    const toast = document.createElement("div");
    toast.style.cssText =
      "position:fixed;bottom:58px;right:16px;z-index:999999;background:#11C9C9;color:#fff;" +
      "font:13px/1 -apple-system,sans-serif;padding:8px 14px;border-radius:8px;display:none;" +
      "box-shadow:0 4px 12px rgba(0,0,0,.3);";

    document.body.appendChild(highlight);
    document.body.appendChild(badge);
    document.body.appendChild(toggle);
    document.body.appendChild(toast);

    let active = false;
    function setActive(v) {
      active = v;
      toggle.style.background = active ? "#FF8888" : "#2A2D3A";
      toggle.textContent = active ? "🔍 Inspecting…" : "🔍 Inspect";
      if (!active) {
        highlight.style.display = "none";
        badge.style.display = "none";
      }
    }
    toggle.addEventListener("click", () => setActive(!active));

    document.addEventListener(
      "mousemove",
      (e) => {
        if (!active) return;
        const el = e.target.closest && e.target.closest("[data-src]");
        if (!el) {
          highlight.style.display = "none";
          badge.style.display = "none";
          return;
        }
        const r = el.getBoundingClientRect();
        highlight.style.display = "block";
        highlight.style.left = `${r.left}px`;
        highlight.style.top = `${r.top}px`;
        highlight.style.width = `${r.width}px`;
        highlight.style.height = `${r.height}px`;
        const src = el.getAttribute("data-src");
        badge.textContent = src;
        badge.style.display = "block";
        badge.style.left = `${Math.min(r.left, window.innerWidth - 220)}px`;
        badge.style.top = `${Math.max(r.top - 26, 4)}px`;
      },
      true
    );

    // mousedown fires before click and is what actually focuses inputs / starts drags —
    // suppressing only "click" left those native behaviors firing underneath inspect mode.
    ["mousedown", "mouseup", "click"].forEach((type) => {
      document.addEventListener(
        type,
        (e) => {
          if (!active) return;
          const el = e.target.closest && e.target.closest("[data-src]");
          if (!el) return;
          e.preventDefault();
          e.stopPropagation();
        },
        true
      );
    });

    document.addEventListener(
      "click",
      (e) => {
        if (!active) return;
        const el = e.target.closest && e.target.closest("[data-src]");
        if (!el) return;
        const src = el.getAttribute("data-src");
        navigator.clipboard.writeText(src).catch(() => {});
        toast.textContent = `Copied: ${src}`;
        toast.style.display = "block";
        setTimeout(() => {
          toast.style.display = "none";
        }, 1200);
      },
      true
    );
  }

  document.addEventListener("DOMContentLoaded", initInspector);
})();
