# Design uplift — incremental PR stack

Merge in order. Each branch stacks on the previous.

| PR | Branch | Scope |
|----|--------|--------|
| 1 | `design/01-foundation` | Spacing tokens, density → CSS vars, table gutter alignment, uniform tree indent |
| 2 | `design/02-table-hierarchy` | Sticky table header, editor header alignment, list active state |
| 3 | `design/03-modals-a11y` | Modal scroll layout, focus rings, reduced-motion |
| 4 | `design/04-responsive` | Narrow viewport: default collapsed list, table min-width (optional) |

## Publish (after adding GitHub remote)

```bash
git remote add origin <your-repo-url>
git push -u origin main
git push -u origin design/01-foundation
gh pr create --base main --head design/01-foundation --title "design: spacing tokens and density scale" --body-file .github/pr-01-body.md
# After PR1 merges:
git checkout main && git pull
git push -u origin design/02-table-hierarchy
gh pr create --base main --head design/02-table-hierarchy ...
```

## Verify locally

Open `My Templates.html` in a browser. Use **Tweaks → Row density** and confirm template list, editor padding, row height, and column header alignment change together.
