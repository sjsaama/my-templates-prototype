## Summary

- Add a 4px-based spacing token layer and layout CSS variables (`--page-pad-*`, `--table-gap`, `--table-gutter`, etc.).
- Introduce `design-tokens.js` so **compact / regular / comfy** density updates the template list, editor, table, and rows together.
- Align table header padding with row content via computed `--table-gutter` (66px).
- Normalize nested section indent to a constant `--tree-step`.

## Test plan

- [ ] Open `My Templates.html` in a browser
- [ ] Toggle **Tweaks → Row density** — list items, editor top padding, row height, and table gap all change
- [ ] Confirm "Section Name" header lines up with row titles
- [ ] Expand nested sections — tree indent is even at each depth
