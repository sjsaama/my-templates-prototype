# EHR Mapping — Greenway

## Category
**Category 4 — No push capability.** `save_note()` delegates to the base class which has no push implementation. Not implemented.

> ⚠️ **Unconfirmed** — Cat 4 classification needs verification with Vignesh before My Templates launch.

---

## Status

Greenway exists in the codebase but note push has not been implemented. The base class `save_note()` is a no-op.

---

## Extra Fields YAML

None — not implemented.

---

## App UX

Since no push happens, the app should show a prominent **"Copy Note"** prompt after the note is generated:
> *"Your EHR doesn't support auto-push — copy and paste into Greenway."*

---

## Where this lives in the code

| Location | Role |
|---|---|
| `ehr_layer/greenway.py:159` | `save_note()` — delegates to base class (no-op) |
