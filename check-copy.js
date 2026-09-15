#!/usr/bin/env node
// check-copy.js — verifies every window.COPY.<path> reference used across the *.jsx files
// actually resolves against the real COPY object in copy.jsx. Catches typos in copy keys
// (e.g. `CT.seperator` for `CT.separator`) without needing a browser.
//
// Usage: node check-copy.js

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = __dirname;

// copy.jsx is plain JS (no JSX syntax) — safe to eval directly to get the real COPY object.
const copySource = fs.readFileSync(path.join(ROOT, "copy.jsx"), "utf8");
const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(copySource, sandbox, { filename: "copy.jsx" });
const COPY = sandbox.window.COPY;
if (!COPY) {
  console.error("Could not load COPY from copy.jsx — did its shape change?");
  process.exit(1);
}

// Resolves a dotted path against COPY, stopping cleanly at the first function value
// (call args like `.info(ehrLabel)` aren't part of the COPY tree).
function resolves(dottedPath) {
  const parts = dottedPath.split(".");
  let node = COPY;
  for (const part of parts) {
    if (node == null) return false;
    if (typeof node === "function") return true; // reached a leaf fn; trailing parts are its call
    if (!(part in node)) return false;
    node = node[part];
  }
  return true;
}

const jsxFiles = fs.readdirSync(ROOT).filter((f) => f.endsWith(".jsx"));

// Pass 1: collect `const <Alias> = window.COPY.<path>;` bindings across all files.
// This codebase reuses a handful of short alias names (CT, CS, CC, ...) consistently for the
// same COPY subtree everywhere they appear, so a single global alias table is accurate here —
// see CLAUDE.md. If that stops being true, this check needs to go scope-aware.
const aliasPattern = /const\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*window\.COPY\.([A-Za-z0-9_.]+)/g;
const aliases = {}; // name -> path

for (const file of jsxFiles) {
  const src = fs.readFileSync(path.join(ROOT, file), "utf8");
  let m;
  while ((m = aliasPattern.exec(src))) {
    const [, name, target] = m;
    if (aliases[name] && aliases[name] !== target) {
      console.warn(`Warning: alias "${name}" maps to both "${aliases[name]}" and "${target}" — global alias table may be inaccurate for this file's usages.`);
    }
    aliases[name] = target;
  }
}

// Pass 2: find every `window.COPY.<path>` and `<alias>.<path>` usage and check it resolves.
const directPattern = /window\.COPY\.([A-Za-z0-9_.]+)/g;
const aliasNames = Object.keys(aliases);
const aliasUsagePattern = aliasNames.length
  ? new RegExp(`\\b(${aliasNames.join("|")})\\.([A-Za-z0-9_.]+)`, "g")
  : null;

let failures = 0;
let checked = 0;

for (const file of jsxFiles) {
  const src = fs.readFileSync(path.join(ROOT, file), "utf8");
  const lines = src.split("\n");

  const check = (dottedPath, lineNo, display) => {
    checked++;
    if (!resolves(dottedPath)) {
      failures++;
      console.error(`${file}:${lineNo}: "${display}" does not resolve on COPY (resolved prefix stops at "${dottedPath}")`);
    }
  };

  lines.forEach((line, i) => {
    let m;
    directPattern.lastIndex = 0;
    while ((m = directPattern.exec(line))) {
      check(m[1], i + 1, `window.COPY.${m[1]}`);
    }
    if (aliasUsagePattern) {
      aliasUsagePattern.lastIndex = 0;
      while ((m = aliasUsagePattern.exec(line))) {
        // Skip the alias declaration line itself (`const CT = window.COPY.templateSettings`).
        if (line.includes(`window.COPY.${aliases[m[1]]}`) && line.trim().startsWith("const")) continue;
        check(`${aliases[m[1]]}.${m[2]}`, i + 1, `${m[1]}.${m[2]}`);
      }
    }
  });
}

console.log(`Checked ${checked} COPY reference(s) across ${jsxFiles.length} files.`);
if (failures) {
  console.error(`${failures} broken reference(s) found.`);
  process.exit(1);
}
console.log("All COPY references resolve.");
