# EHR Mapping — Tebra

## Category
**Category 4 — No push capability.** Not implemented — `TebraApi` (`ehr_layer/tebra.py`) has no
`save_note()` method at all (it doesn't subclass the `EHR`/`AuthorizedEHR` base classes either); the
class only implements `get_appointments()` and `get_patient()`. There is no stub method to call for
note push.

---

## Status

Tebra exists in the codebase as a read-only integration (appointments + patient lookup via SOAP). Note push has not been built.

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
| `ehr_layer/tebra.py` | `TebraApi` class — no `save_note()` method exists |
