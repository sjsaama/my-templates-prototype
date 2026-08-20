// data.jsx — template + section data for the My Templates editor
// Exposed on window for the Babel-transpiled component scripts.

// One self-serve + one managed template per EHR — enough to demo every EHR category's
// behavior without maintaining a pile of near-duplicate templates per EHR.
const TEMPLATES = [
  { id: "gen1", name: "Cardiology Visit", derivative: "Clinical Note", ehr: "AMD_General_Template", ehrSystem: "AMD", group: "Self-serve", selfServe: true, userCreated: true },
  { id: "gen3", name: "General 3", derivative: "Clinical Note", ehr: "AMD_General_Template", ehrSystem: "AMD", group: "Managed" },
  { id: "athenaSS", name: "Wellness Visit", derivative: "Clinical Note", ehr: "AthenaOne_OV", ehrSystem: "AthenaOne", group: "Self-serve", selfServe: true, userCreated: true },
  { id: "athena1", name: "Office Visit", derivative: "Clinical Note", ehr: "AthenaOne_OV", ehrSystem: "AthenaOne", group: "Managed" },
  { id: "ecwSS", name: "Follow-up Visit", derivative: "Clinical Note", ehr: "ECW_Progress", ehrSystem: "eCW", group: "Self-serve", selfServe: true, userCreated: true },
  { id: "ecw1", name: "Progress Note", derivative: "Clinical Note", ehr: "ECW_Progress", ehrSystem: "eCW", group: "Managed" },
  { id: "charmSS", name: "Initial Evaluation", derivative: "Clinical Note", ehr: "SOAP Note", ehrSystem: "Charm", group: "Self-serve", selfServe: true, userCreated: true },
  { id: "charm1", name: "SOAP Note", derivative: "Clinical Note", ehr: "SOAP Note", ehrSystem: "Charm", group: "Managed" },
  { id: "drchronoSS", name: "New Patient Visit", derivative: "Clinical Note", ehr: "DrChrono_OV", ehrSystem: "DrChrono", group: "Self-serve", selfServe: true, userCreated: true },
  { id: "drchrono1", name: "Office Visit", derivative: "Clinical Note", ehr: "DrChrono_OV", ehrSystem: "DrChrono", group: "Managed" },
  { id: "veradigmSS", name: "Annual Physical", derivative: "Clinical Note", ehr: "Veradigm_Progress", ehrSystem: "Veradigm", group: "Self-serve", selfServe: true, userCreated: true },
  { id: "veradigm1", name: "Progress Note", derivative: "Clinical Note", ehr: "Veradigm_Progress", ehrSystem: "Veradigm", group: "Managed" },
  { id: "centricitySS", name: "Consultation Note", derivative: "Clinical Note", ehr: "Centricity_OV", ehrSystem: "Centricity", group: "Self-serve", selfServe: true, userCreated: true },
  { id: "centricity1", name: "Office Visit", derivative: "Clinical Note", ehr: "Centricity_OV", ehrSystem: "Centricity", group: "Managed" },
  { id: "cernerSS", name: "Follow-up Note", derivative: "Clinical Note", ehr: "Cerner_OV", ehrSystem: "Cerner", group: "Self-serve", selfServe: true, userCreated: true },
  { id: "cerner1", name: "Office Visit", derivative: "Clinical Note", ehr: "Cerner_OV", ehrSystem: "Cerner", group: "Managed" },
  { id: "neregSS", name: "Visit Note", derivative: "Clinical Note", ehr: "Nereg_Progress", ehrSystem: "Nereg", group: "Self-serve", selfServe: true, userCreated: true },
  { id: "nereg1", name: "Progress Note", derivative: "Clinical Note", ehr: "Nereg_Progress", ehrSystem: "Nereg", group: "Managed" },
  { id: "modmedSS", name: "Office Visit", derivative: "Clinical Note", ehr: "ModMed_OV", ehrSystem: "ModMed", group: "Self-serve", selfServe: true, userCreated: true },
  { id: "modmed1", name: "Progress Note", derivative: "Clinical Note", ehr: "ModMed_OV", ehrSystem: "ModMed", group: "Managed" },
];

const GROUP_ORDER = ["Self-serve", "Managed"];

function groupsFor(templates) {
  const list = templates || TEMPLATES;
  return GROUP_ORDER
    .map((label) => ({ label, templates: list.filter((t) => t.group === label) }))
    .filter((g) => g.templates.length > 0);
}

// Macro / summarizer connection modes
// macro modes: "Y/N Logic", "Free Text", "Lorem Ipsum"
// summarizer modes: "Replace", "Append", "Prepend", "Inform"

const makeSections = () => withDefaultPrompts(withDefaultNegatives([
  {
    id: "s_cc",
    name: "Chief Complaint",
    ehr: "Office Visit > Chief Complaint",
    config: "Prepend",
    enabled: true,
    macros: [{ name: "Onset Macro", mode: "Y/N Logic" }],
    summarizers: [],
    staticStart: "",
    staticEnd: "",
    expanded: false,
    defaultNegative: "Patient reports primary concern as documented in transcript.",
  },
  {
    id: "s_hpi",
    name: "History of Present Illness",
    static: true,
    ehr: "Office Visit > History of Present Illness",
    config: "Prepend",
    enabled: true,
    macros: [
      { name: "Pain Assessment Macro", mode: "Y/N Logic" },
      { name: "Symptom Duration Macro", mode: "Y/N Logic" },
    ],
    summarizers: [
      { name: "Previous note", mode: "Inform" },
      { name: "Lab reports", mode: "Append" },
    ],
    staticStart: "Patient presents today with the following complaint:",
    staticEnd: "All findings reviewed with the patient.",
    expanded: true,
    entities: [
      { id: "detail", label: "Detail", type: "segment", options: ["Concise", "Descriptive"], value: "Descriptive" },
      { id: "format", label: "Format", type: "segment", options: ["Ordered", "Paragraph"], value: "Paragraph" },
      { id: "timeline", label: "Include symptom timeline", type: "checkbox", value: true, hint: "Chronological onset, progression, and relieving factors" },
      { id: "negatives", label: "Include pertinent negatives", type: "checkbox", value: true, hint: "Documents relevant denials for this complaint" },
    ],
  },
  {
    id: "s_example_parent",
    name: "Example Parent",
    ehr: "",
    config: "Prepend",
    enabled: true,
    macros: [{ name: "Example Macro", mode: "Y/N Logic" }],
    summarizers: [{ name: "Lab reports", mode: "Append" }],
    staticStart: "",
    staticEnd: "",
    expanded: true,
    entities: [
      { id: "detail", label: "Detail", type: "segment", options: ["Concise", "Descriptive"], value: "Concise" },
      { id: "format", label: "Format", type: "segment", options: ["Ordered", "Paragraph"], value: "Paragraph" },
      { id: "negatives", label: "Include pertinent negatives", type: "checkbox", value: true, hint: "Adds standard negatives when not mentioned in visit" },
      { id: "quotes", label: "Use patient quotes", type: "checkbox", value: false, hint: "Pull short quotes from transcript when available" },
    ],
    defaultNegative: "No acute distress. Patient appears comfortable.",
  },
  {
    id: "s_ros",
    name: "Review of Systems",
    ehr: "Office Visit > Review of Systems",
    config: "Append",
    enabled: true,
    macros: [{ name: "ROS Negatives Macro", mode: "Free Text" }],
    summarizers: [{ name: "Lab reports", mode: "Append" }],
    staticStart: "",
    staticEnd: "",
    expanded: true,
    entities: [
      { id: "detail", label: "Detail", type: "segment", options: ["Concise", "Descriptive"], value: "Concise" },
      { id: "format", label: "Format", type: "segment", options: ["Ordered", "Paragraph"], value: "Ordered" },
      { id: "bySystem", label: "Group by organ system", type: "checkbox", value: true, hint: "Lists cardiovascular, respiratory, etc. as separate lines" },
      { id: "negatives", label: "Document ROS negatives", type: "checkbox", value: true, hint: "Includes denies / no complaints when not discussed" },
    ],
    defaultNegative: "All other systems reviewed and negative unless noted below.",
    children: [
      {
        id: "s_ros_general",
        name: "General",
        ehr: "",
        config: "Append",
        enabled: true,
        macros: [],
        summarizers: [],
        staticStart: "",
        staticEnd: "",
        expanded: false,
        defaultNegative: "No complaints.",
      },
      {
        id: "s_ros_child2",
        name: "Child 2",
        ehr: "",
        config: "Append",
        enabled: true,
        macros: [],
        summarizers: [],
        staticStart: "",
        staticEnd: "",
        expanded: true,
        entities: [
          { id: "detail", label: "Detail", type: "segment", options: ["Concise", "Descriptive"], value: "Descriptive" },
          { id: "format", label: "Format", type: "segment", options: ["Ordered", "Paragraph"], value: "Ordered" },
        ],
        defaultNegative: "Musculoskeletal: no joint swelling, redness, or stiffness.",
        children: [
          {
            id: "s_ros_gc1",
            name: "Grand Child 1",
            ehr: "",
            config: "Prepend",
            enabled: true,
            macros: [],
            summarizers: [],
            staticStart: "",
            staticEnd: "",
            expanded: false,
            defaultNegative: "Denies headaches.",
          },
          {
            id: "s_ros_gc2",
            name: "Grand Child 2",
            ehr: "",
            config: "Append",
            enabled: true,
            macros: [],
            summarizers: [],
            staticStart: "",
            staticEnd: "",
            expanded: false,
            defaultNegative: "Neurological: denies weakness, numbness, or vision changes.",
          },
          {
            id: "s_ros_gc3",
            name: "Grand Child 3",
            ehr: "",
            config: "Replace",
            enabled: true,
            macros: [],
            summarizers: [],
            staticStart: "",
            staticEnd: "",
            expanded: false,
            defaultNegative: "Psychiatric: denies depression, anxiety, or suicidal ideation.",
          },
        ],
      },
    ],
  },
  {
    id: "s_pmh",
    name: "Past Medical History",
    ehr: "Office Visit > Past Medical History",
    config: "Prepend",
    enabled: false,
    macros: [],
    summarizers: [],
    staticStart: "",
    staticEnd: "",
    expanded: false,
    defaultNegative: "No known chronic medical conditions. No prior surgeries.",
  },
  {
    id: "s_exam",
    name: "Physical Exam",
    ehr: "Office Visit > Physical Exam",
    config: "Replace",
    enabled: true,
    macros: [{ name: "Normal Exam Macro", mode: "Free Text" }],
    summarizers: [],
    staticStart: "",
    staticEnd: "",
    expanded: false,
    defaultNegative: "General: well-appearing, no acute distress.",
    children: [
      {
        id: "s_exam_c1",
        name: "Cardiovascular",
        ehr: "",
        config: "Append",
        enabled: true,
        macros: [],
        summarizers: [],
        staticStart: "",
        staticEnd: "",
        expanded: false,
        defaultNegative: "Regular rate and rhythm, no murmurs.",
      },
      {
        id: "s_exam_c2",
        name: "Respiratory",
        ehr: "",
        config: "Append",
        enabled: true,
        macros: [],
        summarizers: [],
        staticStart: "",
        staticEnd: "",
        expanded: false,
        defaultNegative: "Clear to auscultation bilaterally.",
      },
    ],
  },
  {
    id: "s_labs",
    name: "Labs and Imaging",
    static: true,
    ehr: "Office Visit > Labs & Imaging",
    config: "Prepend",
    enabled: true,
    macros: [],
    summarizers: [],
    staticStart: "Outside records reviewed. Results as below:",
    staticEnd: "",
    expanded: false,
    defaultNegative: "No new outside labs or imaging reviewed at this visit.",
  },
  {
    id: "s_ap",
    name: "Assessment & Plan",
    ehr: "Office Visit > Assessment & Plan",
    config: "Prepend",
    enabled: true,
    macros: [{ name: "Follow-up Macro", mode: "Y/N Logic" }],
    summarizers: [{ name: "Previous note", mode: "Inform" }],
    staticStart: "",
    staticEnd: "Return to clinic as scheduled or sooner if symptoms worsen.",
    expanded: false,
    defaultNegative: "Patient understands diagnosis, plan, and when to seek urgent care.",
  },
]));

// Ensure every template section has a defaultNegative field (ghost sections excluded).
function withDefaultNegatives(sections) {
  return sections.map((s) => {
    const out = { ...s, detailsExpanded: !!s.detailsExpanded };
    if (!s.ghost) {
      out.defaultNegative = s.defaultNegative != null ? s.defaultNegative : "";
      out.styleDetail   = s.styleDetail   || 'Standard';
      out.styleFormat   = s.styleFormat   || 'Prose';
      out.stylePrompt   = s.stylePrompt   || '';
    }
    if (s.children) {
      out.mappingMode = s.mappingMode || 'whole';
      out.children = withDefaultNegatives(s.children);
    }
    return out;
  });
}

// Default section prompts — this is Marvix's authored "instructions" text.
// Self-serve doctors can see and edit this per section, and write their own for any section they add.
const DEFAULT_PROMPTS = {
  s_cc: "State the patient's primary reason for today's visit, in their own words where possible.",
  s_hpi: "Describe the history of the present illness chronologically: onset, progression, aggravating/relieving factors, and prior treatment tried.",
  s_ros: "Summarize systems reviewed during the visit. Group by organ system. Note only what was actually discussed.",
  s_ros_general: "Note general/constitutional symptoms (fatigue, fever, weight change) if discussed.",
  s_pmh: "List chronic conditions and prior surgeries relevant to today's visit.",
  s_exam: "Summarize physical exam findings by system, in the order examined.",
  s_exam_c1: "Cardiovascular exam findings: rate, rhythm, murmurs, edema.",
  s_exam_c2: "Respiratory exam findings: breath sounds, effort, use of accessory muscles.",
  s_labs: "List any labs or imaging reviewed at this visit, with relevant values or findings.",
  s_ap: "State the assessment (diagnosis or clinical impression) and the plan (treatment, follow-up, referrals).",
};

function withDefaultPrompts(sections) {
  return sections.map((s) => {
    const out = { ...s };
    if (!s.ghost && !out.stylePrompt && DEFAULT_PROMPTS[s.id]) out.stylePrompt = DEFAULT_PROMPTS[s.id];
    if (s.children) out.children = withDefaultPrompts(s.children);
    return out;
  });
}

// Total number of fixed/fetchable EHR fields available for a given EHR system —
// used to cap section creation for Category 1 (fixed-list) and inform Category 2 (fetch-based) EHRs.
function ehrFieldTotalCount(ehrSystem) {
  const groups = (EHR_FIELDS_BY_SYSTEM && EHR_FIELDS_BY_SYSTEM[ehrSystem]) || null;
  if (!groups) return 0;
  return groups.reduce((sum, g) => sum + (g.fields ? g.fields.length : 0), 0);
}

// AMD push detail: how content is inserted + static text position.
function amdPushDetail(s) {
  const parts = [s.config || "—"];
  if (s.staticStart) parts.push("static at start");
  if (s.staticEnd) parts.push("static at end");
  return parts.join(" · ");
}

// Global pending section requests (visible from any template).
const INITIAL_PENDING_REQUESTS = [
  {
    id: "req_social",
    name: "Social History",
    description: "Capture tobacco, alcohol, occupation, and living situation for every visit.",
    tplIds: ["gen1", "gen3"],
    daysAgo: 2,
    status: "approved",
    ops_note: "",
    seenByDoctor: false,
  },
  {
    id: "req_family",
    name: "Family History",
    description: "Document hereditary conditions and relevant family medical background.",
    tplIds: ["gen1", "gen3"],
    daysAgo: 1,
    status: "pending",
    ops_note: "",
    seenByDoctor: true,
  },
];

const CONFIG_OPTIONS = ["Prepend", "Append", "Replace"];

// EHR field lists per system. AMD uses "Page > Field Name", eCW uses shortcut command names,
// others use plain snake_case or display field names.
const EHR_FIELDS_BY_SYSTEM = {
  AMD: [
    { group: "Office Visit", fields: [
      "Office Visit > Chief Complaint",
      "Office Visit > History of Present Illness",
      "Office Visit > Review of Systems",
      "Office Visit > Physical Exam",
      "Office Visit > Assessment & Plan",
      "Office Visit > Past Medical History",
      "Office Visit > Labs & Imaging",
      "Office Visit > Medications",
      "Office Visit > Allergies",
    ]},
    { group: "Vitals", fields: [
      "Vitals > Blood Pressure",
      "Vitals > Heart Rate",
      "Vitals > Temperature",
      "Vitals > Weight",
      "Vitals > Height",
      "Vitals > BMI",
      "Vitals > O2 Saturation",
    ]},
    { group: "Administrative", fields: [
      "Administrative > Visit Reason",
      "Administrative > Follow-up Instructions",
      "Administrative > Diagnosis Codes",
      "Administrative > Referring Provider",
      "Administrative > Patient Instructions",
      "Administrative > Billing Notes",
    ]},
  ],
  AthenaOne: [
    { group: "Encounter Sections", fields: [
      "encounterreasonnote",
      "hpi",
      "reviewofsystems",
      "physicalexam",
      "assessment_with_problems",
      "ordersets",
      "billingnotes",
      "diagnoses",
      "discussion_notes",
      "patient_instructions",
    ]}
  ],
  Veradigm: [
    { group: "Note Sections", fields: [
      "historySections",
      "physicalExams",
      "reviewOfSystem",
      "assessmentPlanHP",
      "reasonsForVisit",
      "vitals",
      "ICD",
    ]}
  ],
  // Flow 1 — Main (HL7 ORU), the real server-side push. Plain section names, not shortcut
  // commands — those are Flow 2 (Scribe-it), a completely separate mapping in ECW_SCRIBEIT_FIELDS
  // below. "> General" entries are subsections written to OBR-5 instead of OBR-4.
  // See FIELD_LIST_REFERENCE.md — Cat 1 — ECW.
  eCW: [
    { group: "Main Push (HL7 ORU)", fields: [
      "Chief Complaints",
      "HPI",
      "HPI > General",
      "Medical History",
      "Surgical History",
      "Hospitalization",
      "Family History",
      "Social History",
      "ROS",
      "Examination",
      "Examination > General",
      "Physical Examination",
      "Assessment",
      "Treatment",
      "Procedure",
    ]},
  ],
  // Default (non-SOAP) mode's fixed keyword list — used when ehr_template_name doesn't start
  // with "soap". In SOAP mode, every field except Chief Complaint is instead identified by a
  // numeric Charm entry ID from the practice's own SOAP template (shown here as a stand-in);
  // Chief Complaint always routes through this same fixed "chief_complaints" key either way.
  // Any value outside this list still pushes but won't match existing content for append/prepend.
  // See FIELD_LIST_REFERENCE.md — Cat 2 — CharmHealth.
  Charm: [
    { group: "Fixed Keywords", fields: [
      "chief_complaints",
      "symptoms",
      "present_illness_history",
      "past_medical_history",
      "family_social_history",
      "review_of_systems",
      "physical_examination",
      "assessment_notes",
      "self_notes",
      "diets",
      "lifestyle",
      "treatment_notes",
      "patient_notes",
      "followup_notes",
    ]},
  ],
  DrChrono: [
    { group: "Clinical Note Fields", fields: [
      "Chief Complaint",
      "History of Present Illness",
      "Review of Systems",
      "Physical Exam",
      "Assessment & Plan",
      "Past Medical History",
      "Medications",
      "Allergies",
      "icd10_codes",
      "cpt_codes",
    ]}
  ],
  Centricity: [
    { group: "Note Sections", fields: [
      "chief_complaint",
      "hpi",
      "ros",
      "physical_exam",
      "assessment_plan",
      "past_medical_history",
    ]}
  ],
  Cerner: [],
  Nereg: [
    { group: "Note Sections", fields: [
      "chiefcomplaint",
      "hpi",
      "ros",
      "physicalexam",
      "assessmentplan",
      "pastmedicalhistory",
      "diagnosiscodes",
      "billingcodes",
    ]},
  ],
  default: [
    { group: "Clinical Notes", fields: [
      "chief_complaint",
      "history_of_present_illness",
      "review_of_systems",
      "physical_exam",
      "assessment_plan",
      "past_medical_history",
      "labs_imaging",
      "medications",
      "allergies",
    ]},
    { group: "Vitals", fields: [
      "blood_pressure",
      "heart_rate",
      "temperature",
      "weight",
      "height",
      "bmi",
      "o2_saturation",
    ]},
    { group: "Administrative", fields: [
      "visit_reason",
      "follow_up_instructions",
      "diagnosis_codes",
      "referring_provider",
      "patient_instructions",
      "billing_notes",
    ]},
  ],
};

const EHR_CATEGORY = {
  AMD:        { cat: 2, label: "AdvancedMD",             fieldSource: "fetch" },
  AthenaOne:  { cat: 1, label: "AthenaOne",              fieldSource: "fixed" },
  eCW:        { cat: 1, label: "eClinicalWorks",          fieldSource: "fixed" },
  Veradigm:   { cat: 1, label: "Veradigm",               fieldSource: "fixed" },
  Charm:      { cat: 2, label: "CharmHealth",             fieldSource: "fetch", canReFetch: false },
  DrChrono:   { cat: 2, label: "DrChrono",                fieldSource: "fetch" },
  // cat: 3 keeps the "Auto-mapped from section names" label (no doctor-facing field picker),
  // but autoRoutedPerSection marks that — unlike Cerner/ModMed's whole-note push — Centricity
  // genuinely routes each section to its own ehr_field_name under the hood, so output settings
  // (additional text, bullets, etc.) are still meaningful per section. See PRD "Cat 1 (auto-routed)".
  Centricity: { cat: 3, label: "Centricity",              fieldSource: "none",  autoMsg: "Auto-mapped from section names", autoRoutedPerSection: true },
  Cerner:     { cat: 3, label: "Cerner",                  fieldSource: "none",  autoMsg: "Whole note pushed as PDF" },
  Nereg:      { cat: 1, label: "Nereg",                   fieldSource: "fixed" },
  ModMed:     { cat: 3, label: "ModMed",                  fieldSource: "none",  autoMsg: "Whole note pushed as PDF" },
  Tebra:      { cat: 4, label: "Tebra",                   fieldSource: "none",  noPushMsg: "Tebra" },
  // Athena (legacy), ECW FHIR, and Greenway removed — out of scope for this version.
  // See engineering_docs/ehr_mapping/README.md.
};

// Mock EHR templates per Cat 2 system — shown in the template-level picker.
const EHR_TEMPLATES_BY_SYSTEM = {
  AMD: [
    { id: "amd_t1", name: "Office Visit" },
    { id: "amd_t2", name: "SOAP Note" },
    { id: "amd_t3", name: "Annual Wellness Visit" },
    { id: "amd_t4", name: "Follow-up" },
    { id: "amd_t5", name: "New Patient Intake" },
  ],
  DrChrono: [
    { id: "dc_t1", name: "Office Visit" },
    { id: "dc_t2", name: "SOAP Note" },
    { id: "dc_t3", name: "Procedure Note" },
  ],
  Charm: [
    { id: "charm_t1", name: "SOAP Note" },
    { id: "charm_t2", name: "Progress Note" },
    { id: "charm_t3", name: "Initial Evaluation" },
  ],
  Centricity: [
    { id: "cen_t1", name: "Office Visit" },
    { id: "cen_t2", name: "Follow-up" },
  ],
};

// Human-readable display labels for EHR field identifiers that use camelCase or snake_case.
// Keyed by the raw field string stored on sections.
const EHR_FIELD_LABELS = {
  // AthenaOne
  "encounterreasonnote":      "Encounter Reason / CC",
  "hpi":                      "History of Present Illness",
  "reviewofsystems":          "Review of Systems",
  "physicalexam":             "Physical Exam",
  "assessment_with_problems": "Assessment & Problem List",
  "ordersets":                "Order Sets",
  "billingnotes":             "Billing Notes",
  "diagnoses":                "ICD-10 / SNOMED Diagnoses",
  "discussion_notes":         "Discussion Notes",
  "patient_instructions":     "Patient Instructions",
  // Veradigm
  "historySections":          "History Sections",
  "physicalExams":            "Physical Exam",
  "reviewOfSystem":           "Review of Systems",
  "assessmentPlanHP":         "Assessment & Plan",
  "reasonsForVisit":          "Reason for Visit",
  "vitals":                   "Vitals",
  "ICD":                      "ICD Diagnosis Codes",
  // Nereg (hpi / physicalexam reuse the AthenaOne entries above — same key string, same label)
  "chiefcomplaint":           "Chief Complaint",
  "ros":                      "Review of Systems",
  "assessmentplan":           "Assessment & Plan",
  "pastmedicalhistory":       "Past Medical History",
  "diagnosiscodes":           "ICD-10 Diagnosis Codes",
  "billingcodes":             "CPT Billing Codes",
  // DrChrono
  "icd10_codes":              "ICD-10 Codes",
  "cpt_codes":                "CPT Codes",
  // CharmHealth (default/non-SOAP fixed keywords)
  "chief_complaints":         "Chief Complaint",
  "symptoms":                 "Symptoms",
  "present_illness_history":  "History of Present Illness",
  "family_social_history":    "Family & Social History",
  "review_of_systems":        "Review of Systems",
  "physical_examination":     "Physical Examination",
  "assessment_notes":         "Assessment Notes",
  "self_notes":               "Self Notes",
  "diets":                    "Diet",
  "lifestyle":                "Lifestyle",
  "treatment_notes":          "Treatment Notes",
  "patient_notes":            "Patient Notes",
  "followup_notes":           "Follow-up Notes",
  "past_medical_history":     "Past Medical History",
};

// Per-field clarifying captions shown under a field in the mapping picker — reserved for fields
// whose display label alone could mislead about what actually happens on push. Keyed the same
// way as EHR_FIELD_LABELS. See FIELD_LIST_REFERENCE.md.
const EHR_FIELD_HINTS = {
  "billingnotes":    "Free-text push to the billing/services note — not diagnosis codes, despite the name.",
  "diagnoses":       "The real diagnosis-code field — resolves SNOMED codes and pushes via a separate API.",
  "icd10_codes":     "Routed to the ICD-10 code push handler, not sent as free text.",
  "cpt_codes":       "Routed to the CPT code push handler, not sent as free text.",
  "diagnosiscodes":  "Section text is scanned with regex for ICD-10 codes — the code list is sent, not the raw text.",
  "billingcodes":    "Last word of the section's first line is sent as a single CPT code.",
  "ICD":             "Pushed via a separate diagnosis API, not as free text.",
};

// Keep EHR_FIELDS as alias for backward compatibility (AMD default).
const EHR_FIELDS = EHR_FIELDS_BY_SYSTEM.AMD;

// eCW Flow 2 — Selective Copy ("Scribe-it"): a manual copy aid, completely separate from the
// Flow 1 push above — no Lambda ever touches it, and config keys like separator/retain_headings
// don't apply here. ehr_field_name must match the shortcut command's exact text, colon included —
// ECW auto-inserts the colon when the command is invoked. Only "Shortcut Commands" are included
// below (not Merge/Order/Other) since those are ECW actions, not note-content destinations.
// See FIELD_LIST_REFERENCE.md — Cat 1 — ECW, Flow 2.
const ECW_SCRIBEIT_FIELDS = [
  { group: "Shortcut Commands", fields: [
    "Chief Complaints:",
    "HPI:",
    "ROS:",
    "ROS Note:",
    "Examination:",
    "Procedures:",
    "Preventive Medicine:",
    "Allergies:",
    "Social History:",
    "Medical History:",
    "Hospitalization:",
    "Surgical History:",
    "Family History:",
    "Physical Therapy Assessment:",
    "Vitals:",
    "Assessment Notes:",
    "Treatment Notes:",
    "Clinical Notes:",
    "Assessment:",
    "Next Appointment:",
    "OB History:",
    "GYN History:",
  ]},
];

// Shortcut Commands whose name exactly matches a Main Push field — Scribe-it auto-attaches
// for these (same category, no reason to make the doctor pick it twice). The remaining
// Shortcut Commands (Vitals, Allergies, OB/GYN History, Preventive Medicine, etc.) have no
// Main Push equivalent — those stay a real, independent, manual choice.
const ECW_SCRIBEIT_AUTOMATCH = [
  "Chief Complaints", "HPI", "ROS", "Examination", "Social History",
  "Medical History", "Hospitalization", "Surgical History", "Family History", "Assessment",
];

function ecwScribeItAutoMatch(primaryField) {
  if (!primaryField || primaryField.includes(" > ")) return ""; // subsections route via section_code, not a shortcut
  return ECW_SCRIBEIT_AUTOMATCH.includes(primaryField) ? primaryField + ":" : "";
}

const SAMPLE_TRANSCRIPT = `Doctor: Good morning, Mrs. Chen. What brings you in today?
Patient: Hi doctor. I've been having this chest tightness for about three days now. It's worse when I climb stairs.
Doctor: Any shortness of breath or palpitations?
Patient: Some shortness of breath, yes. No palpitations that I've noticed.
Doctor: Let's go through your medications. Still on lisinopril and metformin?
Patient: Yes, both of those. And the atorvastatin.
Doctor: Good. Any allergies?
Patient: Just penicillin — rash.
Doctor: Let me listen to your heart and lungs. [Exam] Heart sounds regular, no murmurs. Lungs clear bilaterally. Blood pressure today is 138/84.
Doctor: I want to get an EKG and review your labs from last month. Your A1c was 7.1, which is reasonable. The EKG shows normal sinus rhythm.
Doctor: I think we're looking at stable angina. Let's add a low-dose aspirin and schedule a stress test within the next two weeks. Follow up with me after that.
Patient: Okay, thank you doctor.`;

const SAMPLE_OUTPUT = {
  s_cc:          "Chest tightness × 3 days, exertional, worse with stair climbing.",
  s_hpi:         "Mrs. Chen is a patient presenting with a 3-day history of chest tightness that is exacerbated by exertion, specifically stair climbing. She also reports associated shortness of breath. No palpitations reported. No prior episodes of similar symptoms documented at this visit.",
  s_ros:         "Cardiovascular: Chest tightness, exertional dyspnea. Denies palpitations.\nRespiratory: Mild shortness of breath with exertion. Denies cough, wheezing.\nAll other systems reviewed and negative.",
  s_ros_general: "Denies fever, chills, fatigue, or unintentional weight change.",
  s_pmh:         "1. Hypertension\n2. Type 2 Diabetes Mellitus\n3. Hyperlipidemia\nAllergies: Penicillin (rash).",
  s_exam:        "Vital Signs: BP 138/84 mmHg.\nCardiovascular: Regular rate and rhythm, no murmurs, rubs, or gallops.\nRespiratory: Clear to auscultation bilaterally, no wheezes or crackles.",
  s_exam_c1:     "Regular rate and rhythm. No murmurs, rubs, or gallops appreciated.",
  s_exam_c2:     "Clear to auscultation bilaterally. No wheezes, rhonchi, or crackles.",
  s_labs:        "HbA1c: 7.1% (last month) — at goal.\nEKG today: Normal sinus rhythm, no acute ischemic changes.",
  s_ap:          "Assessment:\n1. Stable angina — new onset, exertional, EKG without acute changes.\n2. Hypertension — BP mildly elevated at 138/84.\n3. Type 2 DM — A1c 7.1%, reasonably controlled.\n\nPlan:\n1. Add aspirin 81mg daily for cardiovascular protection.\n2. Stress test ordered, to be completed within 2 weeks.\n3. Follow up after stress test results.\n4. Continue current medications: lisinopril, metformin, atorvastatin.",
};

const STARTER_TEMPLATES = [
  {
    id: "starter_cardiology",
    name: "Cardiology Follow-up",
    specialty: "Cardiology",
    description: "Cardiology follow-up note — cardiac exam, medications, and plan.",
    sections: [
      { id: "s_cc",   name: "Chief Complaint",              prompt: "State the primary problem(s) the patient reported to the doctor, in the patient's own words where possible." },
      { id: "s_hpi",  name: "History of Present Illness",   prompt: "Be thorough — do not miss any details about the patient's history. Describe the patient's cardiac symptoms, reason for visit, and diagnosis in full. Mention every problem discussed in the transcript without omission.\n\nList each cardiovascular condition or symptom the patient presents with (e.g. chest pain, palpitations, dyspnea, edema, syncope) and describe onset and duration, frequency and severity, impact on daily activities, and any triggers or exacerbating/relieving factors. Use quotation marks for the patient's exact words describing their symptoms. Note any interventions or prior treatments already tried, and specific dates or time periods for notable changes.\n\nInclude both positive and pertinent negative symptoms the patient reports, especially where the doctor asked about them directly. Mention prior treatments, prior diagnostics, and how the patient is currently managing their condition, including current medications, dosage, and how well they've been working. Include results of any health checkups the patient mentions. Summarize relevant social history — tobacco, alcohol, or drug use, occupation, marital status, and living situation — and any relevant family cardiac history.\n\nMention the patient's name and age. Note whether this is an initial visit or a follow-up, and if a follow-up, the date of the last visit if available. If the patient was referred by another physician, note that.\n\nThis section should only capture the patient's own description of their condition — do not include the doctor's assessment, diagnosis, differential diagnosis, treatment plan, ordered tests, advice, explanations, or instructions given to the patient. Avoid redundancy; be comprehensive without repeating the same fact twice." },
      { id: "s_ros",  name: "Review of Systems",            prompt: "Only note what the patient reported when asked, not what the doctor observed on exam. Cover: Cardiovascular (chest pain, palpitations), Respiratory (cough, shortness of breath), General (weight change, fatigue, fever), GI (abdominal pain, nausea, vomiting), Musculoskeletal (joint or muscle pain, swelling), Neurological (dizziness, weakness, headaches), and Psychiatric (mood, sleep, anxiety) — as discussed. Include pertinent positives and negatives." },
      { id: "s_exam", name: "Physical Exam",                prompt: "Only mention what the doctor observed or found on examination, not what the patient reported. Be concise and technical, using the terms an experienced doctor would use even if not stated verbatim in the transcript. Include vital signs, cardiac auscultation findings (rate, rhythm, murmurs, gallops, rubs), pulmonary findings (breath sounds, wheezing, rales), and extremities (edema, cyanosis, clubbing, pulses)." },
      { id: "s_ap",   name: "Assessment & Plan",            prompt: "If there are multiple diagnoses or problems being managed, list each one followed by a one-paragraph summary of the discussion and a bullet list (using '-') of the plan to manage it. Capture the full discussion, including advice on treatment, procedures, and side-effect management. Include any referrals, and list all tests, labs, or imaging ordered for each problem. Note all new medications prescribed, medications continued, and medications discontinued. Write in the first person ('I'), and use technical, clinical language rather than the layman's terms the doctor may have used with the patient." },
    ],
    sampleOutput: {
      s_cc:   "Chest tightness × 3 days, exertional, worse with stair climbing.",
      s_hpi:  "Mrs. Chen is a 58-year-old woman presenting with a 3-day history of exertional chest tightness. Symptoms are reproducible with stair climbing and associated with mild dyspnea. No palpitations or prior episodes.",
      s_ros:  "Cardiovascular: chest tightness, exertional dyspnea. Denies palpitations.\nRespiratory: mild dyspnea on exertion. Denies cough or wheezing.\nAll other systems reviewed and negative.",
      s_exam: "BP 142/88 mmHg, HR 76 bpm, regular. Lungs clear to auscultation bilaterally. Heart: regular rate and rhythm, no murmurs, rubs, or gallops.",
      s_ap:   "1. Stable angina — stress test ordered, aspirin 81 mg daily added.\n2. Hypertension — BP elevated; increase lisinopril to 20 mg daily.\n3. Follow up in 2 weeks after stress test results.",
    },
  },
  {
    id: "starter_primary_care",
    name: "Primary Care Visit",
    specialty: "Primary Care",
    description: "Primary care visit note for follow-ups and chronic disease management.",
    sections: [
      { id: "s_cc",   name: "Chief Complaint",              prompt: "Brief statement of the reason for today's visit in the patient's own words." },
      { id: "s_hpi",  name: "History of Present Illness",   prompt: "Comprehensive narrative of the presenting concern including timeline, severity, and modifying factors." },
      { id: "s_pmh",  name: "Past Medical History",         prompt: "Active problem list, surgical history, and current medications and allergies." },
      { id: "s_ros",  name: "Review of Systems",            prompt: "Multi-system review. Document positive findings and pertinent negatives." },
      { id: "s_exam", name: "Physical Exam",                prompt: "Vital signs and relevant physical exam findings." },
      { id: "s_ap",   name: "Assessment & Plan",            prompt: "Each problem with diagnosis and plan. Include orders, counseling, and follow-up instructions." },
    ],
    sampleOutput: {
      s_cc:   "Here for a 3-month diabetes and hypertension follow-up.",
      s_hpi:  "Mr. Patel is a 52-year-old male presenting for routine follow-up of type 2 diabetes and hypertension. He reports overall good control. No hypoglycemic episodes. Blood pressure readings at home averaging 130/80 mmHg.",
      s_pmh:  "1. Type 2 Diabetes — on metformin 1000 mg BID\n2. Hypertension — on lisinopril 10 mg daily\n3. Hyperlipidemia — on atorvastatin 40 mg\nAllergies: NKDA.",
      s_ros:  "General: no fatigue or weight change. Cardiovascular: no chest pain or palpitations. Endocrine: no polyuria or polydipsia. All other systems negative.",
      s_exam: "BP 128/78 mmHg, HR 72 bpm, BMI 27.4. Abdomen soft, non-tender. No peripheral edema. Monofilament sensation intact bilaterally.",
      s_ap:   "1. Type 2 DM — A1c 7.0%, at goal. Continue metformin. Repeat A1c in 3 months.\n2. Hypertension — well controlled. Continue lisinopril.\n3. Annual diabetic eye exam ordered. Follow up in 3 months.",
    },
  },
  {
    id: "starter_neuro",
    name: "Neurology Consultation",
    specialty: "Neurology",
    description: "Neurology consult with neurological exam and differential diagnosis.",
    sections: [
      { id: "s_cc",   name: "Chief Complaint",              prompt: "Reason for neurology referral or visit in the patient's own words." },
      { id: "s_hpi",  name: "History of Present Illness",   prompt: "Detailed timeline of neurological symptoms including onset, progression, character, and associated symptoms." },
      { id: "s_pmh",  name: "Past Medical / Neuro History", prompt: "Relevant neurological history, prior imaging, prior episodes, family history of neurological disease." },
      { id: "s_exam", name: "Neurological Exam",            prompt: "Cranial nerves, motor, sensory, coordination, reflexes, gait, and mental status." },
      { id: "s_ap",   name: "Assessment & Plan",            prompt: "Neurological impression with differential, diagnostic workup ordered, and treatment plan." },
    ],
    sampleOutput: {
      s_cc:   "Intermittent headaches and visual disturbances for 6 weeks.",
      s_hpi:  "Ms. Rivera is a 34-year-old woman referred for evaluation of 6-week history of intermittent bifrontal headaches associated with transient visual disturbances lasting 15–20 minutes. Headaches occur 3–4 times per week, 7/10 in severity, with nausea but no vomiting. No aura, photophobia moderate.",
      s_pmh:  "No prior neurological diagnoses. No prior head imaging. Mother has migraine history. No family history of stroke or epilepsy. Current medications: ibuprofen PRN (ineffective).",
      s_exam: "Alert and oriented ×3. Cranial nerves II–XII intact. Motor 5/5 throughout. Sensory intact. Finger-nose-finger intact, no dysmetria. Reflexes 2+ symmetric. Gait steady. No papilledema on fundoscopic exam.",
      s_ap:   "1. Migraine with aura — clinical diagnosis. Start sumatriptan 50 mg PRN and topiramate 25 mg QHS for prophylaxis.\n2. MRI brain with and without contrast ordered to rule out secondary cause.\n3. Headache diary initiated. Follow up in 6 weeks or sooner if worsening.",
    },
  },
  {
    id: "starter_soap",
    name: "General SOAP Note",
    specialty: "General",
    description: "Generic SOAP note — no specialty-specific sections.",
    sections: [
      { id: "s_cc",   name: "Subjective",   prompt: "Patient's chief complaint, HPI, and relevant history in their own words and the clinician's summary." },
      { id: "s_exam", name: "Objective",    prompt: "Vital signs, physical exam findings, and relevant lab or imaging results reviewed today." },
      { id: "s_ap",   name: "Assessment",   prompt: "Clinical impression and diagnosis for each active problem." },
      { id: "s_plan", name: "Plan",         prompt: "Treatment plan for each problem including medications, orders, referrals, and follow-up." },
    ],
    sampleOutput: {
      s_cc:   "Patient is a 45-year-old male presenting with 2-week history of lower back pain, 6/10 in severity, worse with prolonged sitting, better with walking. No radicular symptoms. No bowel or bladder changes.",
      s_exam: "BP 122/74, HR 68, afebrile. Lumbar spine: tenderness to palpation at L4–L5. Straight leg raise negative bilaterally. Neurological exam intact. No motor deficits.",
      s_ap:   "1. Acute mechanical low back pain — no red flag symptoms.\n2. Likely musculoskeletal in etiology.",
      s_plan: "1. Naproxen 500 mg BID with food ×7 days.\n2. Physical therapy referral placed.\n3. Ice/heat alternating. Activity as tolerated.\n4. Return to clinic if no improvement in 4 weeks or if neurological symptoms develop.",
    },
  },
];

// Template-level push settings — set once per template (creation wizard's "Template settings"
// step, or the gear icon next to a template name in the left nav), not per section.
const DEFAULT_TEMPLATE_SETTINGS = {
  separator: "\\n",
  pushSubsections: true,
  retainHeadings: true,
  skipEmptySubsections: false,
  keepBulletPoints: true,
  charLimit: "",
};

// Formats a version timestamp for the version history list — e.g. "Aug 14, 2026, 3:45 PM".
function formatVersionDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function collectEnabledSections(sections) {
  const result = [];
  const walk = (list) => {
    list.forEach((s) => {
      if (s.enabled) result.push(s);
      if (s.children) walk(s.children);
    });
  };
  walk(sections);
  return result;
}

// Doctor-facing labels for the template-level settings that "Save changes" versions alongside
// sections — keep in sync with the fields TemplateSettingsModal actually edits.
const TEMPLATE_SETTING_LABELS = {
  separator: "Separator",
  charLimit: "Character limit",
  pushSubsections: "Push subsections",
  retainHeadings: "Retain headings",
  skipEmptySubsections: "Skip empty subsections",
  keepBulletPoints: "Keep bullet points",
};

// Flattens a section tree (including disabled sections, unlike collectEnabledSections) into a
// flat list, tagging each node with its parent's name so diff messages can say "subsection of X".
function flattenSections(sections, parentName) {
  const out = [];
  (sections || []).forEach((s) => {
    out.push({ ...s, parentName: parentName || null });
    if (s.children) out.push(...flattenSections(s.children, s.name));
  });
  return out;
}

// True if any level of the tree has the same set of sibling ids in a different order —
// reorders are reported once ("Reordered sections"), not per-section, since a drag can shift
// several rows at once and per-row noise isn't useful in a changelog.
function sectionOrderChanged(prevList, nextList) {
  const idsOf = (list) => (list || []).map((s) => s.id);
  const walk = (prev, next) => {
    const prevIds = idsOf(prev);
    const nextIdsShared = idsOf(next).filter((id) => prevIds.includes(id));
    const prevIdsShared = prevIds.filter((id) => nextIdsShared.includes(id));
    if (JSON.stringify(prevIdsShared) !== JSON.stringify(nextIdsShared)) return true;
    for (const p of prev || []) {
      const match = (next || []).find((n) => n.id === p.id);
      if (match && sectionOrderChanged(p.children, match.children)) return true;
    }
    return false;
  };
  return walk(prevList, nextList);
}

// Computes a human-readable "what changed" summary between two saved snapshots (section tree +
// template settings), used by the version history list and to back up the restore confirmation's
// claims about what restoring will actually change. Diffs by section `id`, which is stable within
// a single prototype session — the real backend equivalent needs `section_uuid` stability before
// a diff like this is safe to build (see docs/BACKEND.md, Phase 2).
function summarizeVersionChanges(prev, next) {
  const changes = [];
  const prevById = {};
  flattenSections(prev.sections).forEach((s) => { prevById[s.id] = s; });
  const nextFlat = flattenSections(next.sections);
  const nextIds = new Set(nextFlat.map((s) => s.id));

  // Section-level changes collapse to just the section's name — no field-by-field detail —
  // since a section can be touched several different ways in one save and the log only needs
  // to say which sections were edited, not how. Template-level settings, connections between
  // saves, and reordering aren't tied to one section, so those keep their own descriptive lines.
  nextFlat.forEach((s) => {
    const before = prevById[s.id];
    if (!before) { changes.push(`Added "${s.name}"`); return; }
    const edited =
      before.name !== s.name ||
      !!before.enabled !== !!s.enabled ||
      (before.ehr || "") !== (s.ehr || "") ||
      (before.config || "") !== (s.config || "") ||
      (before.mappingMode || "whole") !== (s.mappingMode || "whole") ||
      (before.stylePrompt || "") !== (s.stylePrompt || "") ||
      JSON.stringify(before.fillSegments || []) !== JSON.stringify(s.fillSegments || []) ||
      (before.staticStart || "") !== (s.staticStart || "") ||
      (before.staticEnd || "") !== (s.staticEnd || "") ||
      (before.defaultNegative || "") !== (s.defaultNegative || "") ||
      JSON.stringify(before.macros || []) !== JSON.stringify(s.macros || []) ||
      JSON.stringify(before.summarizers || []) !== JSON.stringify(s.summarizers || []);
    if (edited) changes.push(`Edited "${s.name}"`);
  });

  Object.keys(prevById).forEach((id) => {
    if (!nextIds.has(id)) changes.push(`Removed "${prevById[id].name}"`);
  });

  if (sectionOrderChanged(prev.sections, next.sections)) changes.push("Reordered sections");

  const prevSettings = prev.templateSettings || {};
  const nextSettings = next.templateSettings || {};
  Object.keys(TEMPLATE_SETTING_LABELS).forEach((key) => {
    if ((prevSettings[key] ?? "") !== (nextSettings[key] ?? "")) {
      changes.push(`Changed ${TEMPLATE_SETTING_LABELS[key]}`);
    }
  });

  return changes;
}

Object.assign(window, {
  TEMPLATES,
  groupsFor,
  ECW_SCRIBEIT_FIELDS,
  ECW_SCRIBEIT_AUTOMATCH,
  ecwScribeItAutoMatch,
  EHR_FIELD_LABELS,
  EHR_FIELD_HINTS,
  makeSections,
  INITIAL_PENDING_REQUESTS,
  amdPushDetail,
  CONFIG_OPTIONS,
  EHR_FIELDS,
  EHR_FIELDS_BY_SYSTEM,
  EHR_CATEGORY,
  EHR_TEMPLATES_BY_SYSTEM,
  SAMPLE_TRANSCRIPT,
  SAMPLE_OUTPUT,
  STARTER_TEMPLATES,
  collectEnabledSections,
  summarizeVersionChanges,
  DEFAULT_TEMPLATE_SETTINGS,
  formatVersionDate,
});
