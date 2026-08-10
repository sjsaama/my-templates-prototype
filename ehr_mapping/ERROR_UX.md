# EHR Mapping Error UX

## Architecture context

Push is fully async — the app fires an SQS message and returns immediately. The Lambda (`sync-notes-with-ehr`) runs in the background. Errors are surfaced in two layers:

- **Layer 1 — Reactive**: Lambda writes push results to a `push_errors` table. My Templates shows a to-do list of cases where the doctor needs to act.
- **Layer 2 — Proactive**: Validate mappings before push to catch issues early.

Only errors that require action in My Templates are surfaced to the doctor.

---

## What exceptions Lambda actually raises today

The Lambda uses four exception types defined in `helpers.py`:

| Exception | Meaning | Behaviour |
|---|---|---|
| `FatalException` | Unrecoverable — don't retry | Sends email alert to ops; sets consult push status to `pending` |
| `ManagedException` | Transient — retry with backoff | Sends email alert to ops; retries |
| `EhrTemplateChangeException` | AMD only: a field control no longer exists in the EHR template | Auto-recovery attempted (re-fetch template, remap, retry). If second attempt also fails → `FatalException` |
| `FieldPushException` | Veradigm only: a specific field failed to save | Raised per-field; bubbles up to `FatalException` |

Today there is **no `push_errors` DB table** — failures go to email alerts (ops) and CloudWatch logs only. The doctor is not notified in-app.

---

## Actual errors per EHR — what we know from the code

### AMD (`EhrTemplateChangeException` → auto-recovery)

When AMD returns `"Control [X] not found"` → Lambda raises `EhrTemplateChangeException`.

Lambda then auto-recovers:
1. Re-fetches the current AMD template
2. Rebuilds the mapping against the new template (`get_updated_ehr_mapping`)
3. Retries the push
4. If retry succeeds → saves the new mapping, emails ops "push succeeded with updated mapping"
5. If retry also fails → raises `FatalException` → email to ops only

Other AMD `FatalException` cases (no auto-recovery, ops email only):
- `"Template not found."` — `ehr_template_id` deleted from AMD
- `"Value is not valid"` — field value rejected by AMD
- `"permission level does not allow Create Pt Notes"` — MA account missing permissions
- `"Value is too long."` — section text exceeds AMD character limit (error message includes which section and the limit)
- `"Provider not found."` — doctor not found in AMD

### Veradigm (`FieldPushException`)

Raised per field when `SaveXNote` returns an error for a specific field. Bubbles to `FatalException` → ops email.

### CharmHealth

- `"Your account has been locked"` → `FatalException`
- `"Notes can not be edited for signed soap encounter."` → `FatalException`
- `"Notes can not be edited for signed encounter."` → `FatalException`
- `"Template mapping error."` → `FatalException`
- Generic save error → bare `Exception` → retry

### AthenaOne

- `LockedEncounterException` (check-in not complete) → caught locally → `FatalException` with message: *"Can't push the note because the patient's check-in is not yet complete in Athena. Please either a) complete the check-in in Athena, or b) click on 'Go to Exam' or 'Go to Intake' in Athena before trying again."*
- Per-section push failures (`Unable to push HPI`, `Unable to push Assessment`, etc.) → bare `Exception` → logged + email to ops, push continues for remaining sections
- `"Quota Exceeded"` → `ManagedException` → retry

### DrChrono

- `CredentialsException` (auth failed) → not caught at Lambda level → bubbles to generic `Exception` → retry
- `ThrottledException` → not caught at Lambda level → bubbles to generic `Exception` → retry
- `save_note` catches all exceptions internally and returns `False` silently — **Lambda does not know individual field failures**
- ICD/CPT/chief complaint/yellow notepad failures are logged as `logger.warning` only, not raised

### CharmHealth

- `"Your account has been locked"` → `FatalException`
- `"Notes can not be edited for signed soap encounter."` → `FatalException`
- `"Notes can not be edited for signed encounter."` → `FatalException`
- `"Template mapping error."` → `FatalException`
- Generic save failure → bare `Exception` → retry

### Nereg

- Auth failure → `Exception` → retry
- `save_note` silently handles per-field errors via `logger.error` — no exceptions raised per field
- Wrong / renamed `key_name` → field silently skipped
- **Cat 2 locked mapping:** Connect to EHR note template like other Cat 2 EHRs, but **no doctor remap / field picker**. Fix mapping via `key_name` + template alignment ([Nereg.md](Nereg.md)).

### Cerner

- Token refresh failure → `ValueError` → retry
- Note push failure → bare `Exception` (`"Note push failed: ..."`) → retry
- **Cat 3 note:** No section→field remap UX. Destination template/document connection is still required — missing connection is ops-facing today (see [CATEGORY_3.md](CATEGORY_3.md)).

### ModMed

- Binary / S3 / DocumentReference failures → detectable via `response.ok` → ops
- Encounter lookup from appointment can fail silently — push continues without encounter link
- **Cat 3 note:** Same as Cerner — no field remap; template/document connection still required ([CATEGORY_3.md](CATEGORY_3.md)).

### ECW (main / HL7)

No error detection — Lambda uploads the HL7 file to S3 and gets a 200. ECW processes it asynchronously with no callback. Lambda never knows if ECW rejected the note.

---

## What My Templates needs to surface (doctor-actionable only)

Based on the above, the errors that require the doctor (or ops on behalf of the doctor) to act in My Templates are:

| Error | EHR | What needs to happen | Who acts |
|---|---|---|---|
| Field control no longer exists in EHR template (auto-recovery failed) | AMD | Re-fetch template and remap | Ops / doctor |
| `ehr_template_id` deleted from EHR | AMD | Pick a new EHR template, remap all sections | Ops |
| Section text too long for EHR field | AMD | Shorten the note or raise the AMD character limit | Doctor edits note |
| MA account missing "Create Pt Notes" permission | AMD | Fix permissions in AMD | Practice admin |
| Field failed to save | Veradigm | Remap the field | Ops |
| Check-in not complete in Athena | AthenaOne | Complete check-in in Athena (or click "Go to Exam") then push again | Doctor |

All other errors (auth, account locked, signed encounter, quota, DrChrono/Cerner/ModMed/Nereg failures) are ops-only — they don't require anything in My Templates today.

**Cat 3 (Cerner / ModMed):** No section→field remap. Destination template / document connection is still required; self-serve Connect EHR UI is an **open question** — see [CATEGORY_3.md](CATEGORY_3.md)#open-questions.

**Nereg (Cat 2, locked mapping):** Remap button is not shown. Wrong `key_name` / template alignment is ops-facing — doctors are not given a mapping picker.

**Note on DrChrono**: `save_note` swallows all field-level exceptions and returns `False` silently. Lambda currently has no visibility into which DrChrono fields failed. This is a gap — if we want push issues for DrChrono, Lambda needs to be updated to surface field failures.

---

## Push issues banner — when it shows

The banner only appears for errors the doctor can act on:

```
🔴  Push issues — 2 sections didn't reach your EHR

  • History of Present Illness   [ Remap ]
  • Assessment & Plan            [ Remap ]
```

**Currently this requires new BE work** — there is no `push_errors` table today. Lambda would need to:
1. Catch `EhrTemplateChangeException` (auto-recovery failed) and `FieldPushException` at the field level
2. Write a row to `push_errors` with `failed_sections` and `error_type`
3. API exposes these rows to My Templates

**"Note too long" case** — this is a doctor-actionable error but the action is to edit the note, not remap. It should surface differently:

```
⚠️  Section too long for AMD

  "Assessment & Plan" exceeds the 4000-character limit for this AMD field.
  Edit your note to shorten it, then push again.
```

---

## Layer 2 — Proactive validation

Catch broken mappings before push — feasible for fixed-list EHRs without an API call.

| EHR | Feasible? | How |
|---|---|---|
| AthenaOne | ✅ Free | Check `ehr_field_name` is in the hardcoded 9-item list |
| ECW (main) | ✅ Free | Check `ehr_field_name` is in the known shortcut list |
| Veradigm | ✅ Free | Check `ehr_field_name` is in the known 7-item list |
| AMD | ✅ Feasible | Re-fetch AMD template, flag any `ehr_field_id` that no longer exists |
| DrChrono | ⚠️ Partial | Needs DrChrono API call |
| CharmHealth | ❌ Hard | No live fetch available |

### When to run
- On mapping save in ops portal
- On-demand "Validate Mapping" button
- Nightly job

---

## Known gaps (undetectable)

| EHR | Scenario | Why |
|---|---|---|
| ECW (main) | ECW rejects HL7 silently after S3 upload | Lambda gets 200 from S3 — never knows if ECW rejected |
| ECW (Scribe-it) | Doctor pastes into wrong field | Entirely manual |
| CharmHealth (SOAP) | Field silently skipped | SOAP mode returns no per-field errors |

---

## Remap flows

### Flow A — Fixed list (AthenaOne, ECW, Veradigm)
Re-open the dropdown. Hardcoded known list, no API call needed.

### Flow B — Flexible list (AMD, DrChrono)
Re-fetch current fields from EHR live, pick correct field.
If `ehr_template_id` deleted: go back to the template-level picker first.

### Flow C — CharmHealth
Can't re-fetch automatically. Escalate to tech.

---

## Open questions for BE

1. Confirming scope: Lambda currently writes no `push_errors` rows — all failures go to email/CloudWatch only. Is that correct?
2. For the push issues banner, Lambda would need to write per-section failure rows. Is there appetite to add this?
3. AMD "Value is too long" already includes the section name and character limit in the error message — can Lambda parse and forward this to the doctor rather than just emailing ops?
4. Does Lambda know at push time whether CharmHealth is in SOAP mode? If so, it could tag the row as undetectable and alert ops to spot-check.
