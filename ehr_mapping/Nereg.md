# EHR Mapping — Nereg

## Category
**Category 2 — Flexible field list (doctor's template), with locked auto-mapping.**

Nereg connects to a note template in the doctor's EHR (Cat 2), but doctors **cannot** change section→field mapping. Marvix auto-maps each section's `key_name` to the matching Nereg field at push time. Ops/product must keep `key_name`s aligned with the connected template — that is how mapping is “fixed,” not via a doctor picker.

> **Not Category 3:** Cerner/ModMed push one PDF with no field routing. Nereg writes structured fields into a connected EHR template.

See also: [README.md](README.md) Category 2 · [CATEGORY_3.md](CATEGORY_3.md) (Cerner / ModMed only)

---

## Template connection (required)

| Property | Role |
|---|---|
| EHR note template connection | **Required** — same Cat 2 idea as AMD/DrChrono/Charm: Marvix is tied to a destination template in Nereg |
| Marvix section `key_name` | Becomes `ehr_field_name` at push time — the real per-section routing key |
| Doctor remap / field picker | **Not offered** — mapping is locked / auto |

How Connect EHR is shown in self-serve (picker at creation vs ops-provisioned + display-only name) follows Cat 2 template connection; field fetch for a doctor-facing dropdown is **not** used because doctors cannot change mapping.

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
| Section prompts, add/delete sections | ✅ Yes (self-serve), with rename caution |
| Output settings (sliders) | ❌ Hidden — hardcoded in push |

---

## What breaks the push

| What breaks it | How it fails | Visible to doctor? |
|---|---|---|
| Section `key_name` doesn't match a valid Nereg field | Field silently skipped | No |
| Missing / wrong EHR template connection | Note may not land in expected Nereg template context | No — ops/tech |

---

## Push errors

| Error | Exception | Behaviour | Doctor-actionable? |
|---|---|---|---|
| Auth failure | bare `Exception` | Retried | ❌ No — ops reconnects |
| Per-field push failure | `logger.error` only — not raised | Logged, not retried, not surfaced | ❌ No — ops checks CloudWatch |
| `key_name` doesn't match a valid Nereg field | Field silently skipped | No exception raised | ❌ No — ops/product fixes `key_name` (no doctor remap) |

**Key gap**: renaming a section's `key_name` breaks auto-mapping silently. Surface a rename warning for Nereg templates. *(Not yet in prototype.)* Remap button is **not** shown — recovery is ops/`key_name` fix, not doctor field pick.

---

## Where this lives in the code

| Location | Role |
|---|---|
| `ehr_layer/nereg.py:280` | Auto-builds field mapping from `key_name` |
| `ehr_layer/nereg.py:328` | `__construct_note_to_push()` — builds note payload |
| `ehr_layer/nereg.py:344` | Special handling for `Assessment and Plan` split |
