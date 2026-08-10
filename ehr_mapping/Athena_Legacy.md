# EHR Mapping — Athena (Legacy)

## Category
**Out of My Templates taxonomy (not Cat 1–3).** Engineering stub only — not a doctor-facing EHR category. Marvix generates the note but cannot push it to Athena legacy. `save_note()` returns `False` immediately.

---

## How note push works

It doesn't. `save_note()` in `athena.py` is a stub that returns `False`. Marvix reads appointment and patient data from Athena legacy (read-only integration) but has never implemented note write-back.

---

## Extra Fields YAML

`ehr_field_name` can be set — it is used only to **format the output string** shown in the Marvix app (labels the section in the generated note). It has no effect on any EHR push.

| YAML key | Required? | Type | Purpose |
|---|---|---|---|
| `ehr_field_name` | No | Text | Display label for the section in the generated note — not used for push | 

---

## Relevant `config` keys

Not applicable — no push occurs.

---

## App UX

Not in the My Templates doctor-facing taxonomy. Do not surface a Cat 4 / "No push" product experience for Athena legacy.

---

## Where this lives in the code

| Location | Role |
|---|---|
| `ehr_layer/athena.py:176` | `save_note()` — returns `False`, no push |
| `ehr_layer/athena.py:91` | Reads existing note sections from Athena (read-only) |
