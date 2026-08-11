# EHR Mapping — Greenway

## Category
**Out of My Templates taxonomy (not Cat 1–3).** Engineering stub only — not a doctor-facing EHR category. `save_note()` delegates to the base class which has no push implementation. Not implemented.

---

## Status

Greenway exists in the codebase but note push has not been implemented. The base class `save_note()` is a no-op.

---

## Extra Fields YAML

None — not implemented.

---

## App UX

Not in the My Templates doctor-facing taxonomy. Do not surface a Cat 4 / "No push" product experience for Greenway.

---

## Where this lives in the code

| Location | Role |
|---|---|
| `ehr_layer/greenway.py:159` | `save_note()` — delegates to base class (no-op) |
