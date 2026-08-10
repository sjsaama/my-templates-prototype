# AMD EHR — PRD vs prototype discrepancies

**Sources compared**
- Design / PRD screens: `png_files/Your Templates Page*.jpg`, `01-v2.png`, `02-v2.png`, `shot.png`
- Live prototype on this branch (`cursor/amd-ehr-34b9`), walked in browser

**Note:** Notion / Granola / Slack were not authenticated in this environment, so there is no separate written PRD doc available here — the screenshots above are treated as the product source of truth.

---

## Critical (breaks the AMD mapping story)

### 1. Seeded EHR paths ≠ AMD picker catalog
| Layer | Format |
|---|---|
| Design chips + seeded sections | `Clinical Notes > chief_complaint` (snake_case) |
| AMD field picker in code | `Office Visit > Chief Complaint` (Title Case) |
| Char-limit keys | `Office Visit > …` only |

**Result:** All 13 seeded section mappings are **not in the picker**. Char limits never show until a user remaps. Current chip and picker selection never line up as a coherent AMD destination.

This is the biggest AMD flow bug.

### 2. Configuration / Push column removed from the table
| Design PRD | Prototype |
|---|---|
| Columns: Section · EHR Mapping · **Configuration** · Enable | Columns: Section · EHR Mapping · Enable |
| Push mode (`Prepend` / `Append` / `Replace`) visible per row | Push mode buried in Output & EHR advanced panel only |

`amdPushDetail()` and AMD 5-column CSS still exist but are unused / overridden.

---

## High (visible product gaps vs design)

### 3. No Marvix-Managed / Self-Managed split
Design (`01-v2`, `02-v2`) has tabs **Marvix-Managed (9)** / **Self-Managed (2)**, with self-managed copy: *“You manage this template’s EHR mappings…”*.

Prototype: flat template list only. Reset still says “Reset to Marvix Default,” but there is no managed vs self-managed model.

### 4. Ghost / EHR-Pull rows missing
Design shows **Vitals — Inserted by EHR Pull** (and sometimes File Upload ghosts).

Prototype: ghost sections removed from data; no pull/push-direction affordance in the table.

### 5. Static badge missing
Design marks HPI / Labs as **STATIC**.

Prototype: `static: true` is still on HPI + Labs in data, but **no badge / lock UI** is rendered.

### 6. Connections & Static Text modal unwired
Design (`Page-12`) opens a **Connections & Static Text** modal (edit macros/summarizers/modes + static text).

Prototype: `ConnectionsModal` exists in `modal.jsx` but is never opened. Macros/summarizers are **read-only** in the inline advanced panel.

---

## Medium (flow / data fidelity)

### 7. Template set drift
| Design list | Prototype |
|---|---|
| General 1–3, First Visit, Follow Up | Same + **Neurology Consultation** |
| Other Docs: AVS, Referral, Leave, DDx | Same |

Extra Neurology template is fine if intentional; not in the older PRD screens.

### 8. All templates share one section tree
Switching templates only changes the header `AMD_*_Template` id. Section structure/mappings do not vary by template (First Visit / Neuro / AVS all look like General 3). Design implies per-template structure.

### 9. Request New Section EHR field is free text
Modal asks “Map to EHR field?” as plain text / loose input — not the AMD Office Visit picker. Easy to create mappings that still won’t match the catalog or char limits.

### 10. Disable confirmation under-reports impact
If a section has macros **and** summarizers, the modal only mentions macros (`else if`). HPI/ROS/A&P under-state impact vs design copy that called out linked macros.

### 11. Request New Template is a toast stub
Design: “Redirects to Style Transfer.” Prototype: flash toast only — no navigation.

---

## Aligned (working as designed)

- AMD locked as the EHR on this branch
- Template groups: Clinical Notes / Other Documents
- Header shows `AMD_General_Template` (etc.)
- Editable EHR mapping chips + search picker grouped by page
- Parent mapping modes: As one / Each separately
- Nested ROS / Physical Exam children
- Pending section requests list (approved / rejected / pending)
- Disable-section guard when macros are attached
- Save / Reset toolbar
- Output & EHR: push mode labels (Insert before / after / Overwrite), default negative, static start/end

---

## Recommended fix order (for next iteration)

1. **Pick one AMD field vocabulary and stick to it**
   - Either migrate seeded data + design language to `Office Visit > Chief Complaint`, **or**
   - Change picker + char limits back to `Clinical Notes > chief_complaint`
2. Restore **Configuration** (or Push) visibility in the table for AMD
3. Re-add **Static** badge + **EHR Pull** ghost row(s) if still in product scope
4. Decide **Marvix-managed vs Self-managed** — implement tabs or drop the Marvix reset copy
5. Wire **Connections modal** or make inline macros/summarizers editable
6. Point Request-section EHR field at the real AMD picker

---

## Open question for product

Which AMD field schema is correct?

- **A.** Design / older builds: `Clinical Notes > hpi_freetext`
- **B.** Current picker / char limits: `Office Visit > History of Present Illness`

Everything else in the AMD flow hangs off that answer.
