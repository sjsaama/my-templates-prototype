# EHR Mapping — Nereg

## Category
**Category 3 — No field mapping.** Marvix auto-constructs the field mapping from section names. No manual YAML needed.

---

## How note push works

Nereg automatically maps each Marvix section to an EHR field using the section's `key_name` as the `ehr_field_name`. Ops does not need to enter any YAML — the mapping is built dynamically at push time from the template's section structure.

`Assessment and Plan` sections are split into individual diagnosis entries automatically.

---

## Extra Fields YAML

None required. Fields are auto-constructed from the template's `key_name` values.

---

## Relevant `config` keys

Not applicable — config is hardcoded in the push logic (`separator: \n`, `retain_headings: true`, `push_subsections: true`, `skip_empty_subsections: true`). Manual config overrides are not used.

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
