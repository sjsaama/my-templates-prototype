# AMD EHR branch

This branch is scoped to **AdvancedMD (AMD)** only.

## What’s locked in

- Tweaks EHR switcher is fixed to `AMD`
- Runtime `ehr` is always `AMD` (ignores other stored tweak values)
- AMD-specific UI stays enabled: field char limits, push mode (Insert before / after / Overwrite), `Page > Field` mapping format

## AMD flow to walk through

1. Template list — AMD clinical notes + other documents
2. Section editor — enable/disable, expand, reorder
3. EHR field mapping — Office Visit / Vitals / Administrative pickers
4. Output & EHR — char limits + push mode + static start/end + default negatives
5. Parent vs per-subsection mapping modes
6. Save / reset / section request modal

Use this branch for AMD-only review and changes. Other EHRs (eCW, Athena, Charm, etc.) stay on `main` or their own branches.
