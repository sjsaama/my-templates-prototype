# EHR Mapping — eClinicalWorks (ECW)

ECW has **two independent flows**. A template can be wired to either or both — they use separate
mapping rows and behave completely differently at push time.

| | Flow 1 — Main (HL7 ORU) | Flow 2 — Selective Copy (Scribe-it) |
|---|---|---|
| How it reaches ECW | Marvix builds an HL7 ORU message and uploads it to ECW via S3 — automatic | Doctor manually copies from Marvix, opens ECW, pastes via Ctrl+V + "Scribe It" — manual |
| Server-side push | ✅ Real push — `sync-notes-with-ehr` Lambda | ❌ None — Marvix never sends anything to ECW for this flow |
| Mapping storage | `template.ehr_mapping` (`ehr_mapping_id` FK) | `template.selective_copy_mapping` (`selective_copy_mapping_id` FK) — a **separate** `EHRMapping` row, same table/shape |
| Config keys (separator, bullets, pre/post-literal, etc.) applied? | ✅ Yes — `SectionTextBuilder` runs server-side before push | ❌ No — confirmed zero references to `selective_copy` anywhere in `sync-notes-with-ehr` or `ehr_layer/`. Nothing server-side ever builds combined/formatted text for this flow |
| Errors/failures | Silent at the ECW end, but at least a push happens (see Push Errors below) | Not applicable — there's no push attempt to fail |

> Nothing in the schema hardcodes Selective Copy to ECW specifically — `selective_copy_mapping_id` is
> generic infrastructure on every `Template`. It's simply the only EHR where it's populated/used today.

---

## Flow 1 — Main (HL7 ORU) — Extra Fields YAML keys

| YAML key | Required? | Type | Purpose | Example | Source |
|---|---|---|---|---|---|
| `ehr_field_name` | Yes | Text | ECW section name — written as `ehr_field_name^ehr_field_name` into the OBR-4 field of the HL7 ORU message | `"HPI"` | Lookup table below |
| `section_code` | No | Text | ECW vendor code — written into OBR-5; required to route content to the correct subsection (e.g. HPI > General) | `"GEN"` | Lookup table below |

**Example YAML:**
```yaml
ehr_field_name: "HPI"
section_code: "HPI"
```

**Subsection example:**
```yaml
ehr_field_name: "HPI"
section_code: "GEN"
```

### Section names and codes

| Section | `ehr_field_name` | `section_code` | OBR field |
|---|---|---|---|
| Chief Complaints | `Chief Complaints` | `CC` | OBR-4 |
| HPI | `HPI` | `HPI` | OBR-4 |
| HPI > General subsection | `HPI` | `GEN` | OBR-5 |
| Medical History | `Medical History` | `MHX` | OBR-4 |
| Surgical History | `Surgical History` | `SUR` | OBR-4 |
| Hospitalization | `Hospitalization` | `HOS` | OBR-4 |
| Family History | `Family History` | `FHX` | OBR-4 |
| Social History | `Social History` | `SHX` | OBR-4 |
| ROS | `ROS` | `ROS` | OBR-4 |
| Examination | `Examination` | `EXM` | OBR-4 |
| Examination > General subsection | `Examination` | `GEX` | OBR-5 |
| Physical Examination | `Physical Examination` | `PEX` | OBR-4 |
| Assessment | `Assessment` | `ASM` | OBR-4 |
| Treatment | `Treatment` | `TRT` | OBR-4 |
| Procedure | `Procedure` | `PRO` | OBR-4 |

### Flow 1 — Relevant `config` keys

| Key | Useful? | Notes |
|---|---|---|
| `append` | ❌ No | ECW does not fetch existing note content |
| `prepend` | ❌ No | Same as above |
| `separator` | ✅ Yes | **→ Moving to Template Settings** |
| `char_limit` | ✅ Yes | **→ Moving to Template Settings** |
| `push_subsections` | ✅ Yes | **→ Moving to Template Settings** |
| `retain_headings` | ✅ Yes | **→ Moving to Template Settings** |
| `skip_empty_subsections` | ✅ Yes | **→ Moving to Template Settings** |
| `line_separator` | ✅ Yes — main mode only | **Required** for HL7 ORU formatting. Not needed for Selective Copy. **→ Moving to Template Settings** |

> `separator`, `char_limit`, `push_subsections`, `retain_headings`, `skip_empty_subsections`, and `line_separator` are being promoted to a global **Template Settings** level. Doctors will configure them once per template rather than per mapping row.

`line_separator` (Text) — replaces all `\n` with this string; required for the ECW HL7 ORU pipeline to format correctly.

### Flow 1 — What breaks the mapping

| What breaks it | How it fails | Visible to doctor? |
|---|---|---|
| Wrong `section_code` or `ehr_field_name` | HL7 file written to S3, ECW rejects silently | No — no feedback from ECW |

### Flow 1 — Push errors

**Entirely undetectable:** Lambda uploads the HL7 file to S3 and receives a 200. ECW polls S3 and processes the file asynchronously with no callback to Marvix. Lambda never knows if ECW accepted or rejected the note.

| What can go wrong | How it fails | Visible? |
|---|---|---|
| Wrong `section_code` or `ehr_field_name` | HL7 file uploaded, ECW silently rejects or routes to wrong field | ❌ No |
| ECW system issue | HL7 file uploaded, ECW never processes | ❌ No |

**Mitigation**: ops spot-checks the ECW chart after onboarding and after any mapping change.

---

## Flow 2 — Selective Copy (Scribe-it)

### How it's wired up (backend mechanics)

1. **Enablement is a separate switch from the mapping.** `template.extra_settings["selective_copy"]` (Boolean) turns the feature on for a template. This gets stamped onto every note created from that template as `note.extras["selective_copy"]` (`app/routers/endpoints.py:2511`) — that's how the client app knows to show copy UI at all. A template could have this flag on with no mapping configured yet.
2. **The mapping itself lives in a second, parallel `EHRMapping` row** — `template.selective_copy_mapping`, linked via `selective_copy_mapping_id` (`app/dependencies/models.py:811-857`), completely separate from the real push mapping (`ehr_mapping_id`). Same table, same JSON shape (`ehr_field_name`, `config`, `input_fields`, ...) — just a different row storing ECW shortcut command names instead of push identifiers.
3. **Ops configures it through the identical mapping editor**, not a separate UI: `/update_ehr_mapping/{doctor_id}/{template_id}?selective_copy=true` (`app/routers/internal_endpoints.py:3017-3053`). The `selective_copy` query param just decides which `EHRMapping` the page reads/writes.
4. **On every note fetch, the API attaches the selective-copy mapping to the note as-is.** `NoteModelWithNote.ehr_mapping` is populated straight from `template.selective_copy_mapping.ehr_push_mapping` (`app/dependencies/api_utils.py:1988-1991`) — raw, unprocessed mapping metadata (field names, config, input_fields).
5. **No server-side text building happens for this flow at all.** Confirmed by grepping every file in `sync-notes-with-ehr` and `ehr_layer/` for `selective_copy` — zero hits outside the shared ORM model. `SectionTextBuilder` (which applies separators, bullets, pre/post-literal, subsection joining for every real push EHR) never touches Selective Copy mappings. Whatever "ready to paste" formatting the doctor sees is built entirely in the mobile/web client app (outside this repo) — **it's unverified from the backend whether the client actually honors config keys like `separator`/`retain_headings`/`append`/`prepend` for these fields, or just shows raw section text next to a label.**

### Extra Fields YAML keys

| YAML key | Required? | Type | Purpose | Example | Source |
|---|---|---|---|---|---|
| `ehr_field_name` | Yes | Text | Exact ECW shortcut command name including colon — used as the paste target in Scribe-it | `"HPI:"` | ECW shortcut list |
| `field_label` | No | Text | ⚠️ Confirmed dead — not found anywhere in the Python codebase (app or Lambda), not just Lambda. Legacy/unused. | `"HPI:"` | — |
| `replace_colon_with_dash` | No | Boolean | ⚠️ Confirmed dead — same as above, zero references repo-wide. | `true` | — |

**Example YAML:**
```yaml
ehr_field_name: "HPI:"
```

> **Tooltip text (for the mapping UI):** ECW auto-inserts the shortcut name with a colon (e.g. `HPI:`) as the paste target — the mapping must match this exact text, including the colon, or the paste lands in the wrong section (or silently fails).

### Selective Copy — available shortcut commands

These are the ECW shortcut commands available for Scribe-it paste targets:

Chief Complaints · HPI · ROS · ROS Note · Examination · Procedures · Preventive Medicine · Allergies · Social History · Medical History · Hospitalization · Surgical History · Family History · Physical Therapy Assessment · Vitals · Assessment Notes · Treatment Notes · Clinical Notes · Assessment · Next Appointment · OB History · GYN History

> ECW's own command palette also has "Merge", "Order", and "Other" groups (merging previous notes, ordering labs/imaging, adding billing codes, locking/printing the note) — these are ECW UI actions, not places to paste note content, so they're not valid `ehr_field_name` values and are excluded from the list above and from the Marvix field picker.

> The template must have **Selective Copy** checked in the V2/V1 Template Editor for Scribe-it push to work.

### Flow 2 — What breaks it

| What breaks it | How it fails | Visible to doctor? |
|---|---|---|
| `ehr_field_name` doesn't exactly match ECW shortcut command | Scribe-it paste lands in wrong field or does nothing | Sometimes — doctor may notice wrong field |

### Flow 2 — Push errors

**Entirely manual, nothing to detect server-side:** Marvix has no push mechanism for this flow — there's no request to ECW to fail. If content is wrong, it's because the mapping (`ehr_field_name`) points at the wrong shortcut, or the client-side formatting doesn't match what the doctor expects.

---

## Where this lives in the code

| Location | Role |
|---|---|
| `ehr_layer/section_text_builder.py` | Reads `config` keys including `line_separator` at push time — **Flow 1 only** |
| `app/dependencies/models.py:811-857` | `Template.ehr_mapping_id`/`selective_copy_mapping_id` — the two parallel `EHRMapping` FKs |
| `app/routers/internal_endpoints.py:3017-3053` | `/update_ehr_mapping/{doctor_id}/{template_id}` — shared ops editor for both flows, keyed by `?selective_copy=` |
| `app/routers/internal_endpoints.py:4310-4353` | Mapping save — writes to `selective_copy_mapping_id` or `ehr_mapping_id` depending on `data.selective_copy` |
| `app/dependencies/api_utils.py:1988-1991` | `NoteModelWithNote.ehr_mapping` — pulls `selective_copy_mapping.ehr_push_mapping` verbatim into the note API response |
| `app/routers/endpoints.py:2511` | `note.extras["selective_copy"]` — the per-note flag the client uses to show/hide Scribe-it UI |
