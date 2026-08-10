# AMD EHR branch

Living notes for the AdvancedMD-only prototype branch (`cursor/amd-ehr-34b9`).  
Visual / UX prototype — not production wiring.

Companion detail log: **[AMD_DISCREPANCIES.md](./AMD_DISCREPANCIES.md)**

---

## Scope

- Tweaks EHR switcher fixed to `AMD`
- Runtime `ehr` always `AMD`
- AMD mapping format: **`Office Visit > Field Name`** (Title Case) — chips, picker, and char limits all use this style

## Confirmed decisions

| Topic | Decision |
|---|---|
| Configuration column | **Not needed for AMD** |
| EHR path style | **`Office Visit > Title Case`** everywhere |
| Template types | **Self-serve** and **Ops-managed** |
| STATIC section badge | **Dropped** † |
| EHR Pull / File Upload ghost rows | **Dropped** † |

## Current AMD flow (what’s in the mock)

1. Template list — Clinical Notes + Other Documents
2. Section editor — enable/disable, expand, reorder
3. EHR field mapping — `Office Visit > …` picker + parent As one / Each separately
4. Output & EHR — push mode (Insert before / after / Overwrite), static start/end, default negatives, char limits
5. Request New Section modal + pending requests
6. Save / reset

## Changelog

| Date | Change |
|---|---|
| 2026-08-10 | Branch created; EHR locked to AMD |
| 2026-08-10 | Walked design screens vs prototype; logged gaps |
| 2026-08-10 | Confirmed: no Configuration column; one path style; Self-serve / Ops-managed |
| 2026-08-10 | **Dropped STATIC badge + EHR Pull/File Upload ghost rows** † |
| 2026-08-10 | **Unified path style** to `Office Visit > Title Case` on seeded chips + picker (+ Example Notes demo field). Subsections under As-one parents left unmapped (inherit parent). |
| 2026-08-10 | **Merged `main`** — pulled in `MY_TEMPLATES_PRD.md`, `ehr_mapping/` (incl. AMD.md), error-scenario + dual-mapping prototype updates. Kept AMD lock; template list filtered to AMD; STATIC/ghost stay dropped. |

## Product docs (from main)

- [MY_TEMPLATES_PRD.md](./MY_TEMPLATES_PRD.md) — full PRD
- [ehr_mapping/AMD.md](./ehr_mapping/AMD.md) — AMD field IDs, auto-remap, char limits
- [ehr_mapping/ERROR_UX.md](./ehr_mapping/ERROR_UX.md) — push failure UX
- [AMD_DISCREPANCIES.md](./AMD_DISCREPANCIES.md) — gap log for this branch

## Still to align

1. Template list tabs: **Self-serve** vs **Ops-managed** (PRD: doctors customize within ops-owned structure)

---

## Footnotes — dropped concepts

† **STATIC (dropped)**  
Was a section-level badge meaning content is not AI-generated (fixed/locked). Old mock: lock + “Static” on HPI / Labs.  
*Still in the mock (different concept):* **Static Start / Static End** — fixed boilerplate around a section body; model never rewrites those strings.

† **EHR Pull / File Upload ghost rows (dropped)**  
Were non-generated “ghost” rows pulled into the note from the EHR (e.g. Vitals — “Inserted by EHR Pull”) or from an upload (“Inserted by File Upload”). Enable toggle only; no mapping chip. Removed from AMD prototype data and UI.

†† **Path style not chosen (superseded)**  
Earlier mocks used `Clinical Notes > snake_case` on chips while the picker used `Office Visit > Title Case`. Settled on Office Visit Title Case for the AMD prototype.
