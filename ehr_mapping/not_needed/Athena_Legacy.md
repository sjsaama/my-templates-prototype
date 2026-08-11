# EHR Mapping — Athena (Legacy)

## Category
**Category 4 — No push capability.** Marvix generates the note but cannot push it to Athena legacy. `save_note()` returns `False` immediately. The doctor must copy the note manually.

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

Since no push happens, the app should show a prominent **"Copy Note"** prompt after the note is generated:
> *"Your EHR doesn't support auto-push — copy and paste into Athena."*

Without this, the doctor sees the note generate and then nothing happens — no confirmation, no next step.

---

## Where this lives in the code

| Location | Role |
|---|---|
| `ehr_layer/athena.py:176` | `save_note()` — returns `False`, no push |
| `ehr_layer/athena.py:91` | Reads existing note sections from Athena (read-only) |
