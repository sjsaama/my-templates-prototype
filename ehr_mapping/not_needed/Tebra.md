# EHR Mapping — Tebra

## Category
**Category 4 — No push capability.** `save_note()` is an empty stub (`pass`). Not implemented.

---

## Status

Tebra exists in the codebase as a placeholder. Note push has not been built.

---

## Extra Fields YAML

None — not implemented.

---

## App UX

Since no push happens, the app should show a prominent **"Copy Note"** prompt after the note is generated:
> *"Your EHR doesn't support auto-push — copy and paste into Tebra."*

---

## Where this lives in the code

| Location | Role |
|---|---|
| `ehr_layer/tebra.py` | Stub — `save_note()` is `pass` |
