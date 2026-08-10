# EHR Mapping — Nereg

## Category
**Category 3 — Auto push, no field mapping (template connection required).** No manual Extra Fields YAML. Marvix auto-constructs field targets from section `key_name`s at push time.

> **Correction:** “No field mapping” does **not** mean skip Connect EHR. Cat 3 does not need section→field mapping, but it **does** need the Marvix template connected to a destination template (or document target) in the EHR. Self-serve presentation (picker vs ops-only vs display-only name) is TBD.

See [CATEGORY_3.md](CATEGORY_3.md) for shared Cat 3 model and how Nereg differs from Cerner / ModMed (Nereg is **not** a single-PDF push).

---

## Template connection (required)

No doctor-facing field picker and no YAML mapping rows, but the Marvix template still must be **connected to a Nereg destination template** so the auto-routed sections land in the right note context.

| Property | Role |
|---|---|
| EHR template connection | Required for destination note context (exact `ehr_template_id` / name usage — **confirm with tech**; historically documented as unused for *field routing*) |
| Marvix section `key_name` | Becomes `ehr_field_name` at push time — this is the real per-section routing key |

Unlike Cerner/ModMed, “connected” is not enough by itself: section `key_name`s must still match valid Nereg fields.

How Connect EHR appears in My Templates self-serve is TBD — see CATEGORY_3.md.

---

## How note push works

Nereg automatically maps each Marvix section to an EHR field using the section's `key_name` as the `ehr_field_name`. Ops does not need to enter any YAML — the mapping is built dynamically at push time from the template's section structure.

`Assessment and Plan` sections are split into individual diagnosis entries automatically.

**Nuance vs Cerner/ModMed:** Structured multi-field push, not one PDF document.

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
| Missing / wrong EHR template connection | Note may not land in expected Nereg template context | No — ops/tech |

---

## Push errors

| Error | Exception | Behaviour | Doctor-actionable? |
|---|---|---|---|
| Auth failure | bare `Exception` | Retried | ❌ No — ops reconnects |
| Per-field push failure | `logger.error` only — not raised | Logged, not retried, not surfaced | ❌ No — ops checks CloudWatch |
| `key_name` doesn't match a valid Nereg field | Field silently skipped | No exception raised | ❌ No — ops renames section `key_name` to match |

**Key gap**: renaming a section's `key_name` in the ops portal (or doctor self-serve rename) breaks auto-mapping silently — Nereg looks up fields by `key_name` at push time and skips unrecognised ones. PRD calls for a rename warning in Cat 3 templates (not yet in prototype).

---

## Where this lives in the code

| Location | Role |
|---|---|
| `ehr_layer/nereg.py:280` | Auto-builds field mapping from `key_name` |
| `ehr_layer/nereg.py:328` | `__construct_note_to_push()` — builds note payload |
| `ehr_layer/nereg.py:344` | Special handling for `Assessment and Plan` split |
