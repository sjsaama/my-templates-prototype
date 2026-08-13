# EHR Mapping — Centricity (Athena Flow)

## Category

**Category 1 (auto-routed) — Fixed field list.** Mechanically identical to AthenaOne/ECW/Veradigm: ops defines a fixed `ehr_field_name` per section in the YAML, no template fetch needed. The difference from a typical Cat 1 EHR is presentation, not mechanism — there's no doctor-facing field picker; the doctor's UI just shows "Auto-mapped from section names," even though real per-section routing exists underneath. This is genuinely different from Cat 3 (Cerner/ModMed), which has no per-section routing of any kind — don't conflate the two just because both are non-doctor-facing.

---

## Extra Fields YAML keys

| YAML key | Required? | Type | Purpose | Example | Source |
|---|---|---|---|---|---|
| `ehr_field_name` | Yes | Text | Section name passed to the Centricity push — Centricity routes content based on this value | `"hpi"` | Tech |

**Example YAML:**
```yaml
ehr_field_name: "hpi"
```

> Special case: if `ehr_field_name` is exactly `"Assessment and Plan"`, the section text is split on
> numbered headings (e.g. `"1. "`, `"2. "`) and sent as separate `AandP-1`, `AandP-2`, ... entries
> instead of one field. See `__split_assessment()` / `__construct_note_to_push()` in `athenaflow.py`.

> Centricity is also referred to as "Athena Flow" in some parts of the codebase. It is a separate integration from AthenaOne.

> **Note:** `athenaflow.py` has two note-push methods. The one actually used in production is
> `save_note_smart_launch()` (called from `sync-notes-with-ehr/lambda_function.py`), which does the
> `ehr_field_name` routing described here. There is also a plain `save_note()` method in the same file
> that is not called anywhere in the Lambda functions or app — it posts a hardcoded, effectively empty
> note body and always returns `True` regardless of the response. Don't confuse the two when reading the code.

---

## Relevant `config` keys

| Key | Useful? | Notes |
|---|---|---|
| `append` | ❌ No | Centricity does not fetch existing note content |
| `prepend` | ❌ No | Same as above |
| `separator` | ✅ Yes | |
| `char_limit` | ✅ Yes | |
| `push_subsections` | ✅ Yes | |
| `retain_headings` | ✅ Yes | |
| `skip_empty_subsections` | ✅ Yes | |
| `line_separator` | ❌ No | ECW HL7 only |

---

## What doctors can change

No doctor-side changes are known to affect the mapping for Centricity — the integration is simpler than AMD or Athena. Any structural change to the encounter template should be escalated to tech.

---

## What breaks the mapping

| What breaks it | How it fails | Visible to doctor? |
|---|---|---|
| Wrong `ehr_field_name` | Push fails or content goes to wrong field | No — doctor sees nothing |

---

## Where this lives in the code

| Location | Role |
|---|---|
| `ehr_layer/athenaflow.py:319` | `save_note_smart_launch()` — actual production push entry point |
| `ehr_layer/athenaflow.py:291` | `__construct_note_to_push()` — builds the `ehr_field_name`-keyed payload, splits `"Assessment and Plan"` into `AandP-N` entries |
| `ehr_layer/section_text_builder.py` | Reads `config` keys at push time |
