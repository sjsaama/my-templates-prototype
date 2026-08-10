# EHR Mapping — Nereg

## Category
**Category 2 — Flexible field list (doctor's template), with locked auto-mapping.**

Nereg connects to a note template in the doctor's EHR (Cat 2), but doctors **cannot** change section→field mapping. Marvix auto-maps each section's `key_name` to the matching Nereg field at push time. Ops/product must keep `key_name`s aligned with the connected template — that is how mapping is “fixed,” not via a doctor picker.

> **Not Category 3:** Cerner/ModMed push one PDF with no field routing. Nereg writes structured fields into a connected EHR template.

---

## How note push works

Nereg automatically maps each Marvix section to an EHR field using the section's `key_name` as the `ehr_field_name`. Ops does not need to enter Extra Fields YAML — the mapping is built dynamically at push time from the template's section structure.

`Assessment and Plan` sections are split into individual diagnosis entries automatically.

---

## Extra Fields YAML

None required. Fields are auto-constructed from the template's `key_name` values.

---

## Relevant `config` keys

Not applicable — config is hardcoded in the push logic (`separator: \n`, `retain_headings: true`, `push_subsections: true`, `skip_empty_subsections: true`). Manual config overrides are not used. Output settings (sliders) are hidden in My Templates.

---

## My Templates behavior

| Behavior | Detail |
|---|---|
| Connect EHR template | Required — like other Cat 2 EHRs |
| Doctor field picker | **No** — mapping is locked |
| Remap on push error | **No** — Contact support only |
| Mapping column label | “Auto-mapped from section names” |
| Rename section | Warn — renaming may break auto-mapping via `key_name` |

---

## What breaks the push

| What breaks it | How it fails | Visible to doctor? |
|---|---|---|
| Section `key_name` in Marvix template doesn't match a valid Nereg field | Field silently skipped | No |

---

## Push errors

| Error | Exception | Behaviour | Doctor-actionable? |
|---|---|---|---|
| Auth failure | bare `Exception` | Retried | ❌ No — ops reconnects |
| Per-field push failure | `logger.error` only — not raised | Logged, not retried, not surfaced | ❌ No — ops checks CloudWatch |
| `key_name` doesn't match a valid Nereg field | Field silently skipped | No exception raised | ❌ No — ops renames section `key_name` to match |

**Key gap**: renaming a section's `key_name` in the ops portal breaks auto-mapping silently — Nereg looks up fields by `key_name` at push time and skips unrecognised ones.

---

## Where this lives in the code

| Location | Role |
|---|---|
| `ehr_layer/nereg.py:280` | Auto-builds field mapping from `key_name` |
| `ehr_layer/nereg.py:328` | `__construct_note_to_push()` — builds note payload |
| `ehr_layer/nereg.py:344` | Special handling for `Assessment and Plan` split |
