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
];

const GROUP_ORDER = ["Clinical Notes", "Other Documents"];

function groupsFor(templates) {
  const list = templates || TEMPLATES;
  return GROUP_ORDER
    .map((label) => ({ label, templates: list.filter((t) => t.group === label) }))
    .filter((g) => g.templates.length > 0);
}

// Macro / summarizer connection modes
// macro modes: "Y/N Logic", "Free Text", "Lorem Ipsum"
// summarizer modes: "Replace", "Append", "Prepend", "Inform"

const makeSections = () => withDefaultNegatives([
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
]);

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

// EHR field lists per system. AMD uses "Page > Field Name", eCW uses "Field > section_code",
// others use plain snake_case field names.
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
  eCW: [
    { group: "Progress Notes", fields: [
      "Progress Notes > chief_complaint",
      "Progress Notes > hpi",
      "Progress Notes > ros",
      "Progress Notes > physical_exam",
      "Progress Notes > assessment_plan",
      "Progress Notes > pmh",
      "Progress Notes > medications",
      "Progress Notes > allergies",
    ]},
    { group: "Labs", fields: [
      "Labs > lab_results",
      "Labs > imaging",
      "Labs > pathology",
    ]},
    { group: "Vitals", fields: [
      "Vitals > bp",
      "Vitals > hr",
      "Vitals > temp",
      "Vitals > weight",
      "Vitals > height",
      "Vitals > bmi",
      "Vitals > o2_sat",
    ]},
    { group: "Administrative", fields: [
      "Administrative > visit_reason",
      "Administrative > follow_up",
      "Administrative > diagnosis_codes",
      "Administrative > patient_instructions",
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

// Keep EHR_FIELDS as alias for backward compatibility (AMD default).
const EHR_FIELDS = EHR_FIELDS_BY_SYSTEM.AMD;

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

Object.assign(window, {
  TEMPLATES,
  groupsFor,
  makeSections,
  INITIAL_PENDING_REQUESTS,
  sectionImpact,
  amdPushDetail,
  CONFIG_OPTIONS,
  MACRO_MODES,
  SUMMARIZER_MODES,
  EHR_FIELDS,
  EHR_FIELDS_BY_SYSTEM,
  AMD_CHAR_LIMITS,
});
