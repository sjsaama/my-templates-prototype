## Summary

- Sticky section table header while scrolling the editor
- Sticky template group labels in the list panel
- Editor header aligns to top; active template item gets rounded right edge
- Toolbox button fades in on row hover (stays visible when row is open or has connections)
- Pending section requests show as a coral badge on **Request New Section**

**Depends on:** PR1 (`design/01-foundation`)

## Test plan

- [ ] Scroll long section list — thead stays visible
- [ ] Scroll template list — group labels stick
- [ ] Hover rows — toolbox appears; connections dot still visible when set
- [ ] Template with pending requests — badge on CTA
