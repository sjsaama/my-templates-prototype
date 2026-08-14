# EHR Mapping — Nereg

## Category
**Category 1 — Fixed field list.** Despite requiring the same explicit per-field `ehr_field_name`
mapping as the Category 2 EHRs (AMD, DrChrono, CharmHealth), Nereg's field list is not fetched from
a doctor-specific EHR template — there is no fetch mechanism in the integration at all. The accepted
`ehr_field_name` keys are a fixed set documented by tech, identical across every practice — mechanically
the same shape as Veradigm, not AMD. There is **no** `key_name`-based auto-mapping — a field with no
`ehr_field_name` configured is silently skipped at push time.

---

## How note push works

For each row in the ops-configured `ehr_mapping`, Nereg reads that row's `ehr_field_name` and uses it
directly as the key in the note payload sent to Nereg's `update_notes` API. If a mapping row has no
`ehr_field_name` set, it is skipped — nothing is auto-derived from the Marvix section's `key_name`.

Two `ehr_field_name` values get special handling instead of being pushed as free text:

| `ehr_field_name` value | What happens |
|---|---|
| `diagnosiscodes` | Section text is scanned with a regex (`[A-Z]\d{2}(?:\.\d{1,4})?`) to extract ICD-10 codes, and the list of codes is sent instead of the raw text |
| `billingcodes` | The last word of the first line of section text is extracted and sent as a single CPT code |

All other `ehr_field_name` values are pushed as-is (raw section text).

The entire note is sent as a **single bulk request** (`update_notes`) — there is no per-field push call.
If the token has expired, `save_note` detects `"token expired"` in the response, refreshes the token via
`_refresh_token()`, and retries the push once automatically.

---

## Extra Fields YAML keys

| YAML key | Required? | Type | Purpose | Example | Source |
|---|---|---|---|---|---|
| `ehr_field_name` | Yes | Text | Nereg field key — sent as-is in the `update_notes` payload (or routed to ICD/CPT extraction for `diagnosiscodes`/`billingcodes`) | `"hpi"` | Tech |

**Example YAML:**
```yaml
ehr_field_name: "hpi"
```

---

## Relevant `config` keys

Not applicable — config is hardcoded in the push logic (`separator: \n`, `retain_headings: true`, `push_subsections: true`, `skip_empty_subsections: false`). Manual config overrides are not used.

---

## What breaks the push

| What breaks it | How it fails | Visible to doctor? |
|---|---|---|
| Mapping row has no `ehr_field_name` set | Field silently skipped — never included in the payload | No |
| `ehr_field_name` doesn't match a field Nereg recognizes | Whole `update_notes` call may be rejected by Nereg (bulk, not per-field) | No |

---

## Push errors

| Error | Exception | Behaviour | Doctor-actionable? |
|---|---|---|---|
| Auth failure (initial token request) | bare `Exception` | Retried | ❌ No — ops reconnects |
| Token expired mid-push | Detected from response (`"token expired"` in error) | Auto-refreshes token and retries the push once. If refresh also fails → bare `Exception` | ❌ No — resolves automatically unless refresh fails |
| `update_notes` call fails (non-2xx or error in response) | bare `Exception`, whole push fails as one unit — **not per-field** | Logged, not surfaced | ❌ No — ops checks CloudWatch |

**Key gap**: push is all-or-nothing — there is no per-field error reporting. If Nereg rejects the whole
`update_notes` call, none of the mapped fields for that push are known to have landed; there is no way
to tell which field(s) caused the failure from the response alone.

---

## Where this lives in the code

| Location | Role |
|---|---|
| `ehr_layer/nereg.py:231` | `save_note()` — builds payload, posts to `update_notes`, handles token-expiry retry |
| `ehr_layer/nereg.py:327` | `__construct_note_to_push()` — builds the field-name-keyed payload from `ehr_mapping`, skips rows with no `ehr_field_name` |
| `ehr_layer/nereg.py:345` | Special-cases `diagnosiscodes` (ICD extraction) and `billingcodes` (CPT extraction) |
