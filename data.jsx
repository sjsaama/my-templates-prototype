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
    id: "s_ghost_ehr",
    name: "Vitals",
    ghost: "ehr",
    enabled: true,
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
    id: "s_ghost_file",
    name: "Prior Note Summary",
    ghost: "file",
    enabled: true,
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
    if (!s.ghost) out.defaultNegative = s.defaultNegative != null ? s.defaultNegative : "";
    if (s.children) out.children = withDefaultNegatives(s.children);
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
  },
  {
    id: "req_seizure",
    name: "Seizure Frequency",
    description: "Track seizure count, duration, and post-ictal state for epilepsy follow-ups.",
    tplIds: ["neuro", "follow"],
    daysAgo: 5,
  },
];

const CONFIG_OPTIONS = ["Prepend", "Append", "Replace"];
const MACRO_MODES = ["Y/N Logic", "Free Text", "Lorem Ipsum"];
const SUMMARIZER_MODES = ["Replace", "Append", "Prepend", "Inform"];

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
});
