# Jumping straight to a UI state

The prototype reads a few URL query params on load and applies them before the
first render, so a specific state (a certain EHR, a forced duplicate mapping,
an auto-opened settings panel) is reachable in one navigation instead of
several manual clicks through the Tweaks panel.

Serve with `devserver.py` (not bare `python -m http.server`) — it disables
caching entirely, so edits always show up on reload without a `?v=` bump or
cache-bypass query string:

```
python3 devserver.py 8765 "/Users/shilpi/Downloads/My templates"
```

## Params

| Param | Effect | Example |
|---|---|---|
| `tpl` | Sets the active template on load (any id from `TEMPLATES` in `data.jsx`, e.g. `gen3`, `neuro`, `athena1`) | `?tpl=gen3` |
| `ehr` | Overrides the Tweaks "EHR system" value | `?ehr=Nereg` |
| `errorScenario` | Overrides the Tweaks "Simulate push error" value (see `ERROR_SCENARIOS` in `app.jsx`) | `?errorScenario=athena_checkin` |
| `dualMapping` | Overrides the Tweaks "Dual field mapping" demo (`one_to_two` \| `amd_checkbox`) | `?dualMapping=amd_checkbox` |
| `forceSharedMapping` | Forces two sections (by exact name, comma-separated) in the active template onto the same EHR field, so the "Shared · order" push-order popover appears | `?forceSharedMapping=Chief Complaint,History of Present Illness` |
| `openSettings` | Auto-expands a section's settings panel (by exact name) on load | `?openSettings=History of Present Illness` |

Params combine — e.g. `?tpl=gen3&openSettings=History of Present Illness&forceSharedMapping=Chief Complaint,History of Present Illness` lands directly on General 3 with both the settings panel open and the shared-mapping badge visible.

**Note:** `ehr` is overridden right back to a template's own `ehrSystem` on
mount if that template has one set (see the `useEffect` syncing Tweaks EHR to
`tpl.ehrSystem` in `app.jsx`) — this is existing app behavior, not something
these params fight. To demo a specific EHR, pick a `tpl` whose `ehrSystem`
already matches, or a template with no fixed `ehrSystem`.

## Recipes

- **Shared push-order popover**: `?tpl=gen3&forceSharedMapping=Chief Complaint,History of Present Illness`
- **AMD checkbox-push demo**: `?tpl=gen3&dualMapping=amd_checkbox&openSettings=Assessment & Plan`
- **A push-error banner**: `?tpl=gen3&errorScenario=athena_checkin`
- **Land straight on a section's settings panel**: `?tpl=<id>&openSettings=<Section Name>`

Add a row here whenever a new repro state is worth reusing.
