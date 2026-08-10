# EHR Mapping — Nereg

## Category
**Category 2 — Flexible field list (doctor's template), with locked auto-mapping.**

Nereg connects to a note template in the doctor's EHR (Cat 2), but doctors **cannot** change section→field mapping. Marvix auto-maps each section's `key_name` to the matching Nereg field at push time. Ops/product must keep `key_name`s aligned with the connected template — that is how mapping is “fixed,” not via a doctor picker.

> **Not Category 3:** Cerner/ModMed push one PDF with no field routing. Nereg writes structured fields into a connected EHR template.

See also: [README.md](README.md) Category 2 · [CATEGORY_3.md](CATEGORY_3.md) (Cerner / ModMed only)

---

## My Templates UI (Nereg-specific)

This is the product surface for Nereg in the doctor app. Prototype: Tweaks → EHR → **Nereg**, open **Progress Note**.

### Principles

| Principle | UI consequence |
|---|---|
| Connect EHR template | Required — show connected template at template level |
| No doctor field mapping | No mapping picker; no Remap on push errors |
| Auto from section `key_name` | Mapping column: *“Auto-mapped from section names”* |
| Push formatting hardcoded | Output settings (sliders) hidden |
| Rename breaks routing | Warn when doctor renames a section |

### Editor chrome

1. **Info notice** (persistent while EHR = Nereg)  
   Copy: *Nereg maps each section to an EHR field by section name. You can’t change field mapping here — connect the right Nereg note template, and keep section names aligned with Nereg fields.*

2. **Connected EHR template banner**  
   - Label: `Connected Nereg template`  
   - Value: selected template name (e.g. Progress Note), or unset state  
   - Action: **Change** / **Connect** opens template picker (list from `EHR_TEMPLATES_BY_SYSTEM.Nereg`)  
   - No “Fetch fields” — connection only

3. **Section rows**  
   - Mapping cell: locked auto label (*Auto-mapped from section names*) — not clickable  
   - No sliders / output settings  
   - No Remap on row push-error strip (Contact support only)

4. **Rename warning**  
   When the doctor changes a section header, show an amber inline warning:  
   *Renaming this section may break Nereg auto-mapping. Field mapping can’t be changed in the app — keep the name matched to the Nereg field, or contact support.*

### Create template flow

| Step | Nereg behavior |
|---|---|
| 1 — Starting point | Same as other EHRs (gallery / copy) |
| 2 — Describe | Name, purpose, document type |
| 3 — Connect EHR | **Required.** Pick a Nereg note template. Explain: *No field mapping step — sections auto-map by name into the connected template.* |
| 4 — Review | Show connected template name; hint that mapping is locked |

Review hint: *After creation, section mapping is automatic. You won’t pick EHR fields — only edit content and keep section names aligned.*

### What we do **not** show for Nereg

- Per-section field picker (Add section or remap)
- Remap button on push-issues banner / row error strip
- Output settings sliders
- “Fetch fields from Nereg” in the editor

### Prototype flags (`data.jsx`)

```js
Nereg: {
  cat: 2,
  label: "Nereg",
  fieldSource: "auto",
  canRemap: false,
  autoMsg: "Auto-mapped from section names",
  requiresEhrTemplateConnection: true,
}
```

---

## Template connection (required)

| Property | Role |
|---|---|
| EHR note template connection | **Required** — Marvix is tied to a destination template in Nereg |
| Marvix section `key_name` | Becomes `ehr_field_name` at push time — the real per-section routing key |
| Doctor remap / field picker | **Not offered** — mapping is locked / auto |

---

## How note push works

Nereg automatically maps each Marvix section to an EHR field using the section's `key_name` as the `ehr_field_name`. Ops does not enter Extra Fields YAML rows — the mapping is built dynamically at push time from the template's section structure.

`Assessment and Plan` sections are split into individual diagnosis entries automatically.

**Product rule:** Fix mapping by aligning section `key_name`s (and the connected EHR template), not by giving doctors a remap UI.

---

## Extra Fields YAML

None required for routing. Fields are auto-constructed from the template's `key_name` values.

---

## Relevant `config` keys

Not doctor-configurable — config is hardcoded in the push logic (`separator: \n`, `retain_headings: true`, `push_subsections: true`, `skip_empty_subsections: true`). Manual config overrides are not used. Output-settings sliders stay hidden for Nereg.

---

## What doctors can change

| | |
|---|---|
| EHR field mapping | ❌ No — locked / auto from `key_name` |
| Connected Nereg template | ✅ Connect / change at template level |
| Section prompts, add/delete sections | ✅ Yes (self-serve), with rename caution |
| Output settings (sliders) | ❌ Hidden — hardcoded in push |

---

## What breaks the push

| What breaks it | How it fails | Visible to doctor? |
|---|---|---|
| Section `key_name` doesn't match a valid Nereg field | Field silently skipped | No — rename warning only |
| Missing / wrong EHR template connection | Note may not land in expected Nereg template context | Banner shows unset / wrong template |

---

## Push errors

| Error | Exception | Behaviour | Doctor-actionable? |
|---|---|---|---|
| Auth failure | bare `Exception` | Retried | ❌ No — ops reconnects |
| Per-field push failure | `logger.error` only — not raised | Logged, not retried, not surfaced | ❌ No — ops checks CloudWatch |
| `key_name` doesn't match a valid Nereg field | Field silently skipped | No exception raised | ❌ No — ops/product fixes `key_name` (no doctor remap) |

**Key gap**: renaming a section's `key_name` breaks auto-mapping silently. UI surfaces a rename warning. Remap button is **not** shown — recovery is ops/`key_name` fix, not doctor field pick.

---

## Where this lives in the code

| Location | Role |
|---|---|
| `ehr_layer/nereg.py:280` | Auto-builds field mapping from `key_name` |
| `ehr_layer/nereg.py:328` | `__construct_note_to_push()` — builds note payload |
| `ehr_layer/nereg.py:344` | Special handling for `Assessment and Plan` split |
| Prototype: `data.jsx` `EHR_CATEGORY.Nereg` | Cat 2 locked flags |
| Prototype: `app.jsx` | Nereg notice + connected-template banner |
| Prototype: `modal.jsx` | Connect EHR step (template only) + picker |
| Prototype: `rows.jsx` | Auto mapping label, no sliders/remap, rename warn |
