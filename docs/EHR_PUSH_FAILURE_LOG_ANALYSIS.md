# EHR Push Failure — Log vs. PRD Synthesis

**Window:** May 6 – Aug 6, 2026  
**Source:** `/aws/lambda/sync-notes-with-ehr`  
**Records scanned:** ~1.6M  

---

## Summary

| Metric | Value |
|---|---|
| Total error-matching records | ~15,900 |
| Dominant failure type | AthenaOne check-in not complete (647 instances) |
| Doctor self-serviceable failures | 1 type — ~7/day |
| PRD gaps found from logs | 3 |

---

## Failure breakdown by EHR

### AthenaOne — 1,254 records

| Failure mode | Log message | 3-mo count | Triggered by | Doctor self-serve? | In PRD? |
|---|---|---|---|---|---|
| Check-in not complete | "Can't push — check-in not complete in Athena" | ~647 | Doctor | ✅ Yes — complete check-in, retry | ✅ Covered |
| Appointment lookup 500 | "AthenaOne appointment lookup failed — status 500: An unexpected error occurred" | ~48 | Athena API | ❌ No — ops | ❌ **New — not in PRD** |
| Auth token empty | "Argument 'access_token' is empty" | ~10 | Auth / creds | ❌ No — ops | ❌ **New — not in PRD** |
| Per-section push failure | "Unable to push [section name]" | ~1 | Ops mapping | ❌ No — ops remap | ✅ Covered |
| 'effective_settings' attr missing | "'Doctor' object has no attribute 'effective_settings'" | 1 | Bug | N/A — test account (doctor_id 381) | N/A — exclude |

**Key finding:** The 48 appointment-lookup 500s all clustered on 2026-07-27 — likely a brief Athena outage, not a chronic issue. PRD has a "Quota exceeded" row but no transient API failure row.

---

### ECW — 2,100 records

| Failure mode | Log message | 3-mo count | Triggered by | Doctor self-serve? | In PRD? |
|---|---|---|---|---|---|
| Order push — pattern match failed | "Couldn't find any Orders of type: [order_type], pattern matching failed or empty field provided" | ~2,100 | Ops / config | ❌ No | ⚠️ **Partial — PRD framing needs update** |

**Breakdown by order type:**

| Order type | Count |
|---|---|
| vaccine_order | 392 |
| procedure_order | 392 |
| imaging_order | 392 |
| referral_order | 374 |
| lab_order | 366 |
| prescription_order | 184 |

**Key finding:** PRD says "all ECW failures undetectable — Lambda gets a 200 regardless." That's true for *note text* pushes. But order-section failures (labs, prescriptions, referrals, etc.) *do* surface as WARNINGs in the Lambda. These aren't note text failures — they're order config mismatches. The PRD needs a footnote clarifying this distinction.

---

### AMD — ~42 records

| Failure mode | 3-mo count | Triggered by | Doctor self-serve? | In PRD? |
|---|---|---|---|---|
| Various (template change, char limit, provider not found, permissions) | ~42 | Various | Depends on scenario | ✅ Covered |

Low volume (~1 error every 2 days). PRD scenarios are accurate.

---

### DrChrono — 0 records

| Failure mode | 3-mo count | In PRD? |
|---|---|---|
| All exceptions swallowed — nothing surfaces | 0 | ✅ Covered — PRD accurately labels this "undetectable" |

Zero log records confirms the blind spot. Failures exist but are invisible without a Lambda change.

---

### CharmHealth — 2 records

| Failure mode | 3-mo count | In PRD? |
|---|---|---|
| Various (negligible volume) | 2 | ✅ Covered |

---

### Veradigm, Cerner, ModMed, Centricity, Nereg — 0 records

No errors found in 3 months. Either very stable or very low push volume. PRD scenarios remain theoretical.

---

## PRD gaps to address

| # | EHR | Gap | Recommended PRD change |
|---|---|---|---|
| 1 | AthenaOne | No row for transient API 500s | Add row: "Athena API outage / transient 500" — triggered by Athena infra, not detectable by doctor, ops investigates |
| 2 | AthenaOne | No row for auth token failure | Add row: "Auth token empty" — ops handles, low frequency |
| 3 | ECW | PRD says "all failures undetectable" — overstated | Add footnote: order-section failures (lab, rx, referral, imaging, procedure, vaccine) do surface as WARNINGs; note *text* failures remain undetectable |

## PRD confirmations

- ✅ AthenaOne check-in error is the #1 self-serve scenario — 647 instances confirms it. Right call to build the in-app nudge here.
- ✅ DrChrono blind spot accurately documented — logs confirm zero visibility.
- ✅ AMD failure modes exist in code but are rare in production — PRD severity is correctly calibrated.
