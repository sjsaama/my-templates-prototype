// data.jsx — template + section data for the My Templates editor
// Exposed on window for the Babel-transpiled component scripts.

const TEMPLATES = [
  { id: "gen1", name: "General 1", derivative: "Clinical Note", ehr: "AMD_General_Template", ehrSystem: "AMD", group: "Clinical Notes" },
  { id: "gen2", name: "General 2", derivative: "Clinical Note", ehr: "AMD_General_Template", ehrSystem: "AMD", group: "Clinical Notes" },
  { id: "gen3", name: "General 3", derivative: "Clinical Note", ehr: "AMD_General_Template", ehrSystem: "AMD", group: "Clinical Notes" },
  { id: "first", name: "First Visit", derivative: "Clinical Note", ehr: "AMD_FirstVisit_Template", ehrSystem: "AMD", group: "Clinical Notes" },
  { id: "follow", name: "Follow Up", derivative: "Clinical Note", ehr: "AMD_FollowUp_Template", ehrSystem: "AMD", group: "Clinical Notes" },
  { id: "neuro", name: "Neurology Consultation", derivative: "Clinical Note", ehr: "AMD_Neuro_Template", ehrSystem: "AMD", group: "Clinical Notes" },
  { id: "avs", name: "AVS", derivative: "After Visit Summary", ehr: "AMD_AVS_Template", ehrSystem: "AMD", group: "Other Documents" },
  { id: "referral", name: "Referral Letter", derivative: "Letter", ehr: "AMD_Referral_Template", ehrSystem: "AMD", group: "Other Documents" },
  { id: "leave", name: "Medical Leave Letter", derivative: "Letter", ehr: "AMD_Leave_Template", ehrSystem: "AMD", group: "Other Documents" },
  { id: "ddx", name: "DDx (Beta)", derivative: "Clinical Note", ehr: "AMD_DDx_Template", ehrSystem: "AMD", group: "Other Documents" },
  { id: "athena1", name: "Office Visit", derivative: "Clinical Note", ehr: "AthenaOne_OV", ehrSystem: "AthenaOne", group: "Clinical Notes" },
  { id: "ecw1", name: "Progress Note", derivative: "Clinical Note", ehr: "ECW_Progress", ehrSystem: "eCW", group: "Clinical Notes" },
  { id: "charm1", name: "SOAP Note", derivative: "Clinical Note", ehr: "Charm_SOAP", ehrSystem: "Charm", group: "Clinical Notes" },
  { id: "drchrono1", name: "Office Visit", derivative: "Clinical Note", ehr: "DrChrono_OV", ehrSystem: "DrChrono", group: "Clinical Notes" },
  { id: "veradigm1", name: "Progress Note", derivative: "Clinical Note", ehr: "Veradigm_Progress", ehrSystem: "Veradigm", group: "Clinical Notes" },
  { id: "centricity1", name: "Office Visit", derivative: "Clinical Note", ehr: "Centricity_OV", ehrSystem: "Centricity", group: "Clinical Notes" },
  { id: "cerner1", name: "Office Visit", derivative: "Clinical Note", ehr: "Cerner_OV", ehrSystem: "Cerner", group: "Clinical Notes" },
  { id: "nereg1", name: "Progress Note", derivative: "Clinical Note", ehr: "Nereg_Progress", ehrSystem: "Nereg", group: "Clinical Notes" },
  { id: "athlegacy1", name: "Office Visit", derivative: "Clinical Note", ehr: "Athena_Legacy", ehrSystem: "Athena", group: "Clinical Notes" },
  { id: "modmed1", name: "Progress Note", derivative: "Clinical Note", ehr: "ModMed_OV", ehrSystem: "ModMed", group: "Clinical Notes" },
];

const GROUP_ORDER = ["My Templates", "Clinical Notes", "Other Documents"];

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
    ehr: "Clinical Notes > chief_complaint",
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
    ehr: "Clinical Notes > hpi_freetext",
    config: "Prepend",
    enabled: true,
    macros: [
      { name: "Pain Assessment Macro", mode: "Y/N Logic" },
      { name: "Symptom Duration Macro", mode: "Y/N Logic" },
    ],
    summarizers: [
      { name: "HPI Chronological Summarizer", mode: "Replace" },
      { name: "ROS Summarizer", mode: "Append" },
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
    ehr: "Clinical Notes > example_freetext",
    config: "Prepend",
    enabled: true,
    macros: [{ name: "Example Macro", mode: "Y/N Logic" }],
    summarizers: [{ name: "Example Summarizer", mode: "Append" }],
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
    ehr: "Clinical Notes > ros_freetext",
    config: "Append",
    enabled: true,
    macros: [{ name: "ROS Negatives Macro", mode: "Free Text" }],
    summarizers: [{ name: "ROS Summarizer", mode: "Append" }],
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
        ehr: "Clinical Notes > ros_general",
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
        ehr: "Clinical Notes > ros_child2",
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
            ehr: "Clinical Notes > ros_gc1",
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
    ehr: "Clinical Notes > pmh_freetext",
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
    ehr: "Clinical Notes > physical_exam",
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
        ehr: "Clinical Notes > exam_cv",
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
        ehr: "Clinical Notes > exam_resp",
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
    ehr: "Clinical Notes > labs_imaging",
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
    ehr: "Clinical Notes > assessment_plan",
    config: "Prepend",
    enabled: true,
    macros: [{ name: "Follow-up Macro", mode: "Y/N Logic" }],
    summarizers: [{ name: "Plan Summarizer", mode: "Inform" }],
    staticStart: "",
    staticEnd: "Return to clinic as scheduled or sooner if symptoms worsen.",
    expanded: false,
    defaultNegative: "Patient understands diagnosis, plan, and when to seek urgent care.",
  },
]));

// Ensure every template section has a defaultNegative field (ghost sections excluded).
function withDefaultNegatives(sections) {
  return sections.map((s) => {
    const out = { ...s, detailsExpanded: !!s.detailsExpanded, promptOpen: !!s.promptOpen };
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

// Impact counts for disable confirmation (includes child sections).
function sectionImpact(s) {
  let macros = (s.macros || []).length;
  let summarizers = (s.summarizers || []).length;
  const walk = (list) => {
    list.forEach((c) => {
      macros += (c.macros || []).length;
      summarizers += (c.summarizers || []).length;
      if (c.children) walk(c.children);
    });
  };
  if (s.children) walk(s.children);
  return { macros, summarizers };
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
    tplIds: ["gen1", "gen2", "gen3"],
    daysAgo: 2,
    status: "approved",
    ops_note: "",
    seenByDoctor: false,
  },
  {
    id: "req_seizure",
    name: "Seizure Frequency",
    description: "Track seizure count, duration, and post-ictal state for epilepsy follow-ups.",
    tplIds: ["neuro", "follow"],
    daysAgo: 5,
    status: "rejected",
    ops_note: "This section already exists as a subsection under Neurology Consultation.",
    seenByDoctor: false,
  },
  {
    id: "req_family",
    name: "Family History",
    description: "Document hereditary conditions and relevant family medical background.",
    tplIds: ["gen1", "first"],
    daysAgo: 1,
    status: "pending",
    ops_note: "",
    seenByDoctor: true,
  },
];

const CONFIG_OPTIONS = ["Prepend", "Append", "Replace"];
const MACRO_MODES = ["Y/N Logic", "Free Text", "Lorem Ipsum"];
const SUMMARIZER_MODES = ["Replace", "Append", "Prepend", "Inform"];

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
  eCW: [
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
  ],
  Charm: [
    { group: "Clinical Notes", fields: [
      "Chief Complaint",
      "History of Present Illness",
      "Review of Systems",
      "Physical Examination",
      "Assessment Notes",
      "Treatment Notes",
      "Past Medical History",
      "Labs & Diagnostics",
      "Medications",
      "Allergies",
    ]},
    { group: "Vitals", fields: [
      "Blood Pressure",
      "Heart Rate",
      "Temperature",
      "Weight",
      "Height",
      "BMI",
      "O2 Saturation",
    ]},
    { group: "Administrative", fields: [
      "Visit Reason",
      "Follow-up Appointment",
      "Diagnosis Codes",
      "Referring Provider",
      "Patient Instructions",
      "Billing Notes",
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
  Nereg: [],
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
  Centricity: { cat: 1, label: "Centricity",              fieldSource: "fixed" },
  // Cat 3: fieldSource "none" = no section→field mapping. Template/document connection in the
  // EHR is still required — do not treat as "skip Connect EHR." See ehr_mapping/CATEGORY_3.md.
  Cerner:     { cat: 3, label: "Cerner",                  fieldSource: "none",  autoMsg: "Whole note pushed as PDF", requiresEhrTemplateConnection: true },
  Nereg:      { cat: 3, label: "Nereg",                   fieldSource: "none",  autoMsg: "Auto-mapped from section names", requiresEhrTemplateConnection: true },
  ModMed:     { cat: 3, label: "ModMed",                  fieldSource: "none",  autoMsg: "Whole note pushed as PDF", requiresEhrTemplateConnection: true },
  Athena:     { cat: 4, label: "Athena (Legacy)",         fieldSource: "none",  noPushMsg: "Athena" },
  "ECW FHIR": { cat: 4, label: "ECW FHIR",               fieldSource: "none",  noPushMsg: "ECW" },
  Greenway:   { cat: 4, label: "Greenway (Prime Suites)", fieldSource: "none",  noPushMsg: "Greenway" },
  Tebra:      { cat: 4, label: "Tebra",                   fieldSource: "none",  noPushMsg: "Tebra" },
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
  // Centricity (Athena Flow)
  "chief_complaint":          "Chief Complaint",
  "ros":                      "Review of Systems",
  "physical_exam":            "Physical Exam",
  "assessment_plan":          "Assessment & Plan",
  "past_medical_history":     "Past Medical History",
};

// Keep EHR_FIELDS as alias for backward compatibility (AMD default).
const EHR_FIELDS = EHR_FIELDS_BY_SYSTEM.AMD;

// eCW Scribe-it has a separate note panel with its own field targets.
// These are distinct from the primary shortcut-command destinations.
const ECW_SCRIBEIT_FIELDS = [
  { group: "Scribe-it Note Sections", fields: [
    "ScribeIt > Chief Complaint",
    "ScribeIt > HPI",
    "ScribeIt > Review of Systems",
    "ScribeIt > Physical Exam",
    "ScribeIt > Assessment",
    "ScribeIt > Plan",
    "ScribeIt > Procedures",
    "ScribeIt > Follow-up",
  ]},
  { group: "Scribe-it Administrative", fields: [
    "ScribeIt > Patient Instructions",
    "ScribeIt > Referral Notes",
    "ScribeIt > Billing Notes",
  ]},
];

// Character limits for AMD EHR fields. Keyed by the AMD "Page > Field Name" string.
const AMD_CHAR_LIMITS = {
  "Office Visit > History of Present Illness": 2000,
  "Office Visit > Review of Systems": 1500,
  "Office Visit > Physical Exam": 3000,
  "Office Visit > Assessment & Plan": 4000,
  "Office Visit > Chief Complaint": 500,
  "Office Visit > Past Medical History": 2000,
  "Administrative > Patient Instructions": 1000,
  "Administrative > Follow-up Instructions": 1000,
};

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
    description: "Standard follow-up note for cardiology patients. Covers cardiac exam, current medications, and plan.",
    sections: [
      { id: "s_cc",   name: "Chief Complaint",              prompt: "Document the patient's chief complaint concisely in their own words." },
      { id: "s_hpi",  name: "History of Present Illness",   prompt: "Narrative of the presenting illness including onset, duration, quality, and associated symptoms." },
      { id: "s_ros",  name: "Review of Systems",            prompt: "Cardiovascular and relevant system review. Note positive and pertinent negative findings." },
      { id: "s_exam", name: "Physical Exam",                prompt: "Vital signs, cardiac and pulmonary exam findings." },
      { id: "s_ap",   name: "Assessment & Plan",            prompt: "List each problem with ICD-10 code and the corresponding plan, including medications, orders, and follow-up." },
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
    description: "General outpatient visit note for primary care. Suitable for follow-ups and chronic disease management.",
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
    description: "New or follow-up neurology consult. Includes detailed neurological exam and differential diagnosis.",
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
    description: "Standard SOAP format suitable for any specialty. Clean structure, no specialty-specific sections.",
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

Object.assign(window, {
  TEMPLATES,
  groupsFor,
  ECW_SCRIBEIT_FIELDS,
  EHR_FIELD_LABELS,
  makeSections,
  INITIAL_PENDING_REQUESTS,
  sectionImpact,
  amdPushDetail,
  CONFIG_OPTIONS,
  MACRO_MODES,
  SUMMARIZER_MODES,
  EHR_FIELDS,
  EHR_FIELDS_BY_SYSTEM,
  EHR_CATEGORY,
  AMD_CHAR_LIMITS,
  EHR_TEMPLATES_BY_SYSTEM,
  SAMPLE_TRANSCRIPT,
  SAMPLE_OUTPUT,
  STARTER_TEMPLATES,
  collectEnabledSections,
});
