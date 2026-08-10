# AMD EHR — prototype design discrepancies

Prototype scope: **visual / UX fidelity only** — not wiring, persistence, or real EHR push.

**Sources:** design screens in `png_files/`, `01-v2.png`, `02-v2.png`, `shot.png` vs live AMD-locked prototype.

---

## What looks off vs design

### 1. Table columns
| Design | Prototype |
|---|---|
| Section · EHR Mapping · **Configuration** · Enable | Section · EHR Mapping · Enable |

Push/config (`Prepend` / `Append` / `Replace`) is only inside the advanced panel, not as a visible column chip.

### 2. EHR field language (two competing looks)
- Design / seeded chips: `Clinical Notes > chief_complaint`
- Picker list: `Office Visit > Chief Complaint`

Same screen shows two different AMD vocabularies — looks inconsistent even as a mock.

### 3. Missing visual affordances from design
- **STATIC** badge on HPI / Labs
- **Inserted by EHR Pull** (Vitals) ghost row
- **Marvix-Managed / Self-Managed** tabs on the template list
- Self-managed helper line under the title

### 4. Connections UI
Design has a dedicated **Connections & Static Text** modal. Prototype shows macros/summarizers only as read-only lists inside the inline panel — different pattern than the screens.

### 5. Template list extras
Prototype adds **Neurology Consultation**; older design frames don’t show it.

---

## What already matches the AMD mock

- AMD lock + `AMD_*_Template` in the header
- Clinical Notes / Other Documents grouping
- Mapping chips + field picker drawer
- Parent **As one / Each separately**
- Nested ROS / Exam children
- Request New Section modal + pending requests
- Disable-section confirm copy
- Output & EHR push mode labels in the advanced panel

---

## Suggested next prototype polish (visual only)

1. Put **Configuration** chips back in the table row
2. Pick one AMD path style and use it everywhere (chips + picker)
3. Re-show **STATIC** + **EHR Pull** rows for the AMD story
4. Optional: Marvix / Self-managed tabs if that split is still part of the AMD pitch

No need to wire save, push, or real field validation for this.
