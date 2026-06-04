## Summary

- Modal uses flex column: header + scrollable body + fixed footer
- `focus-visible` rings on primary interactive controls
- `prefers-reduced-motion` disables non-essential transitions

**Depends on:** PR2 (`design/02-table-hierarchy`)

## Test plan

- [ ] Open Connections modal with long static text — body scrolls, footer stays put
- [ ] Tab through nav, template items, segment buttons — visible focus ring
- [ ] OS reduced motion on — panel/row animations minimized
