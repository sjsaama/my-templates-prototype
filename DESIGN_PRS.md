# Design uplift — incremental PR stack

Merge in order. Each branch stacks on the previous.

| PR | Branch | Scope |
|----|--------|--------|
| 1 | `design/01-foundation` | Spacing tokens, density → CSS vars, table gutter alignment, uniform tree indent |
| 2 | `design/02-table-hierarchy` | Sticky table header, editor header alignment, list active state |
| 3 | `design/03-modals-a11y` | Modal body scroll + sticky footer, focus-visible, reduced-motion |
| 4 | `design/04-responsive` | Narrow viewport: default collapsed list, table min-width (optional, not started) |

Branches are **stacked**: each PR targets the previous branch until merged to `main`.

## Publish (after adding GitHub remote)

```bash
git remote add origin <your-repo-url>
git push -u origin main
git push -u origin design/01-foundation design/02-table-hierarchy design/03-modals-a11y

gh pr create --base main --head design/01-foundation \
  --title "design: spacing tokens and density scale" \
  --body-file .github/pr-01-body.md

# After PR1 merges to main, rebase PR2 onto main (or merge PR1 first):
gh pr create --base design/01-foundation --head design/02-table-hierarchy \
  --title "design: sticky table header and list polish" \
  --body-file .github/pr-02-body.md

gh pr create --base design/02-table-hierarchy --head design/03-modals-a11y \
  --title "design: modal layout and accessibility" \
  --body-file .github/pr-03-body.md
```

## Verify locally

Open `My Templates.html` in a browser. Use **Tweaks → Row density** and confirm template list, editor padding, row height, and column header alignment change together.
