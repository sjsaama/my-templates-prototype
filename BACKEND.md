# My Templates — Backend

## What We're Building

A doctor-facing screen that lets doctors view and customize their templates. This is a **read + override** model — ops owns and edits the template structure; doctors set personal preferences on top and cannot change the underlying structure.

Per-section settings the doctor can save:
- `ehr_field` — which EHR field this section maps to
- `scribe_it_field` — ECW secondary destination
- `default_negative` — fallback text when section has no content
- `pre_literal` / `post_literal` — fixed text before/after section on push
- `push_mode` — prepend / append / replace (AMD only)

---

## New Tables

**`doctor_section_customizations`** — keyed by `(doctor_id, template_id, section_uuid)`. Stores the doctor's per-section overrides. At read time, the API merges these on top of the ops defaults from `json_template`.

**`template_section_requests`** — doctor submits a request for a new section (name, description, target EHR field, which templates). Ops reviews in a portal page and approves or rejects with a note. Status: `pending → approved / rejected`. Doctor sees a badge when status changes.

---

## The Core Blocker: Template ID and Section ID Instability

Every time ops saves a template, the system creates a **new `Template` row** with a new `template_id`. Section IDs inside `json_template` are regenerated from 1 on every save. This breaks My Templates in two ways:

1. `doctor_section_customizations` is keyed by `template_id` — orphaned after every ops edit
2. Macro and summarizer links (`Macro.section_list`, `UploadFileTemplateMapping.anchor_section_name`) detach silently

It also causes a separate but related bug: notes generated before a template edit display blank or scrambled sections when opened afterward, because the section IDs the parser stored no longer match.

### Why it hasn't caused widespread failures yet

- Most templates are set up once and rarely edited structurally
- When edits preserve section order (e.g., label-only changes), IDs happen to match by coincidence
- Silent failures return `{}` — sections appear blank rather than crashing

### What ops does that triggers this

Every "Save" in the Template V2 Portal creates a new template record: rename a section, add or remove a section, reorder, change instructions — any edit.

---

## Affected Code

| File | Lines | Role |
|---|---|---|
| `app/utils/template_handler_new.py` | 118–189 | `convert_to_standard_dict_new()` — assigns IDs 1, 2, 3… on every call |
| `app/routers/internal_endpoints.py` | 2972–3177 | Template save endpoint — creates new row, deactivates old |
| `aws_lambda/.../parser_utils.py` | 317 | Stores parsed LLM output under `extracted_data[section_id]` |
| `aws_lambda/.../parser_utils.py` | 440–529 | `note_for_frontend()` retrieves section content by `parsed_data.get(section_id)` |

---

## Fix — Migration Phases

### Phase 1 (Required before launch): Stable `template_id` + version log

Stop creating a new Template row on every save. Update in-place.

Schema changes to `templates`:
- Add `version INTEGER DEFAULT 1` — bump on every save
- Add `updated_at TIMESTAMP`

New table:

```sql
CREATE TABLE template_version_logs (
    id          SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES templates(template_id),
    version     INTEGER NOT NULL,
    json_template JSON,
    saved_by    VARCHAR,
    created_at  TIMESTAMP DEFAULT now()
);
```

Before deploying: one-time script to write every active template into `template_version_logs` as `version=1`.

Updated save flow in `internal_endpoints.py`:
1. Write current `(template_id, version, json_template)` → `template_version_logs`
2. `UPDATE templates SET json_template=..., version=version+1, updated_at=now() WHERE template_id=...`

### Phase 2 (Required before launch): `section_uuid` per section

Add a stable UUID to every section in `json_template`. Assigned once on creation, preserved across all future saves.

```python
# In convert_to_standard_dict_new()
new_dict = {
    "id": current_id,
    "section_uuid": value.get("section_uuid") or str(uuid4()),
    "key_name": key,
    ...
}
```

The ops portal save request must round-trip `section_uuid` values so they reach this function.

One-time backfill script: assign UUIDs to all active templates' sections. Inactive rows don't need backfilling.

### Phase 3 (Medium term): Migrate `Macro.section_list` → `section_uuid[]`

Currently stores `key_name` strings — breaks silently on section rename.

1. For each active template, build `key_name → section_uuid` map
2. For each linked macro, replace `section_list` entries with UUIDs (log and drop orphans)
3. Update `validate_section_list_v2()` in `app/macros/utils.py` and Lambda's `macro_utils.py` to look up by `section_uuid`

Zero-downtime: deploy lookup with fallback (UUID-like → direct; otherwise → `key_name`), run migration, remove fallback.

### Phase 4 (Medium term): Migrate `UploadFileTemplateMapping.anchor_section_name` → `section_uuid`

Currently stores `"Parent > Child"` path strings — breaks on rename.

1. Resolve each `anchor_section_name` path against its template's `json_template`
2. Write `section_uuid` into new `anchor_section_uuid` column (Alembic migration)
3. Update Lambda's `summarizer_utils.py` to use `anchor_section_uuid` with fallback to `anchor_section_name`
4. Drop `anchor_section_name` once all rows migrated

### Phase 5 (Medium term): Parser — switch from integer `id` to `key_name`

`key_name` is already stable. Switching `extracted_data` from `{int_id: content}` to `{key_name: content}` eliminates the ID fragility entirely.

- `note_for_frontend()` lookup changes from `parsed_data.get(d.get("id"))` to `parsed_data.get(d.get("key_name"))`
- Notes already generated with integer-ID keys need a fallback read path during transition

---

## Phase Summary

| Phase | What | Risk if skipped |
|---|---|---|
| 1 | Switch save to update-in-place + version log | Doctor customizations orphaned on every ops edit |
| 2 | Backfill `section_uuid` on active templates | My Templates cannot store customizations |
| 3 | Migrate `Macro.section_list` → `section_uuid` | Macro links silently break on any section rename |
| 4 | Migrate `UploadFileTemplateMapping` → `section_uuid` | Summarizer links silently break on any section rename |
| 5 | Parser: switch integer id → `key_name` | Section content mismatched after template edits |

---

## Open Question

When a doctor remaps a section to a different EHR field, where does that override live and how does the Lambda pick it up at note generation time? The Lambda currently reads exclusively from `EHRMapping.ehr_push_mapping`. Decision needed: does the Lambda merge doctor overrides at runtime, or do we write a per-doctor mapping row?
