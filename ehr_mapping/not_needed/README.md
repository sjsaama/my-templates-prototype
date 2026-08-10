# Not needed — archived from active `ehr_mapping/`

Kept for reference instead of deleting. Do not treat as in-scope for My Templates unless product reopens them.

## Out-of-scope EHRs

| EHR | File | Notes |
|---|---|---|
| Athena (legacy) | [Athena_Legacy.md](Athena_Legacy.md) | Replaced by AthenaOne; `save_note` returns `False` |
| ECW FHIR | [ECW_FHIR.md](ECW_FHIR.md) | Distinct from ECW main (HL7); push not implemented |
| Greenway (Prime Suites) | [Greenway.md](Greenway.md) | On-prem; no cloud push API |
| Tebra | [Tebra.md](Tebra.md) | Empty `save_note` stub |

## Superseded shared docs

These were cross-cutting drafts. Product truth is now in `MY_TEMPLATES_PRD.md` + the per-EHR files at `ehr_mapping/*.md`.

| Doc | Why archived |
|---|---|
| [ERROR_UX.md](ERROR_UX.md) | Doctor error UX + copy live in the PRD "Push errors" section. Per-EHR files already list exceptions. This draft was incomplete (missing several PRD scenarios) and had a duplicated CharmHealth block. |
| [SHARED_CONFIG.md](SHARED_CONFIG.md) | Ops YAML key dump. Stale vs PRD (e.g. keep-bullets out of v1; subsection combine → Settings Portal; write mode AMD-only). Each per-EHR file already lists which `config` keys apply. |
| [PROPERTY_CHANGE_IMPACT.md](PROPERTY_CHANGE_IMPACT.md) | Cross-EHR "what breaks" matrix. Duplicates the "What breaks the mapping" tables already in each per-EHR file; Marvix-side `template_id` / `key_name` notes are covered in `docs/BACKEND.md` + the PRD. |
