export type BasketId =
  | "foundation"
  | "institute"
  | "mathematics"
  | "hss"
  | "science"
  | "open_project"
  | "open_elective"
  | "chemical_core"
  | "chemical_elective"
  | "cse_core"
  | "cse_theory"
  | "cse_systems"
  | "cse_elective"
  | "ai_core"
  | "ai_cse"
  | "ai_elective"
  | "discipline_core"
  | "discipline_elective"
  | "civil_design"
  | "additional"
  | "excluded"
  | "unresolved";

export const REQUIREMENTS = [
  { id: "foundation", name: "Foundation Programme", required: 4, note: "FP 100" },
  { id: "institute", name: "Institute compulsory", required: 34, note: "Required ES and BS courses" },
  { id: "mathematics", name: "Mathematics", required: 10, note: "8 mandatory + 2 Math basket" },
  { id: "hss", name: "HSS", required: 28, note: "Mandatory, GE and approved electives" },
  { id: "science", name: "Science", required: 12, note: "8 Science basket + 4 BS elective" },
  { id: "open_project", name: "Open Project", required: 4, note: "After the first year" },
  { id: "open_elective", name: "Open Electives", required: 16, note: "Courses not counted elsewhere" },
  { id: "chemical_core", name: "Chemical Engineering Core", required: 42, note: "14 required courses" },
  { id: "chemical_elective", name: "ChE Discipline Electives", required: 20, note: "Approved dynamic basket" },
] as const;

export const TOTAL_REQUIRED = 170;

export const BASKET_LABELS: Record<BasketId, string> = {
  foundation: "Foundation Programme",
  institute: "Institute compulsory",
  mathematics: "Mathematics",
  hss: "HSS / Management",
  science: "Science / BS Elective",
  open_project: "Open Project",
  open_elective: "Open Elective",
  chemical_core: "Chemical Engineering Core",
  chemical_elective: "ChE Discipline Elective",
  cse_core: "CSE Core",
  cse_theory: "CSE Theory & Algorithms",
  cse_systems: "CSE Systems",
  cse_elective: "Other CSE Elective",
  ai_core: "AI Core",
  ai_cse: "AI CSE Basket",
  ai_elective: "Other AI Elective",
  discipline_core: "Discipline Core",
  discipline_elective: "Discipline Elective",
  civil_design: "CE Design / Applications",
  additional: "Additional learning (minor only)",
  excluded: "Does not count",
  unresolved: "I'm not sure",
};

export const RULESET = {
  programme: "B.Tech Chemical Engineering",
  cohort: "2024–28",
  version: "0.6.0",
  source: "Academic Affairs Advisory No. 13 (January 2025)",
} as const;

export const INSTITUTE = new Set([
  "ES 101", "ES 112", "ES 113", "ES 114", "ES 115",
  "ES 116", "ES 117", "ES 118", "ES 243", "BS 192",
]);

export const MATHEMATICS = new Set([
  "MA 103", "MA 104", "MA 203", "MA 204", "MA 205", "MA 206",
]);

export const HSS_MANDATORY = new Set([
  "HS 151", "HS 191", "HS 192", "HS 201", "HS 221",
]);

export const SCIENCE = new Set([
  "PH 201", "PH 202", "PH 404", "PH 503", "PH 505", "PH 507",
  "PH 508", "PH 509", "PH 510", "CH 203", "CH 204", "CH 302",
  "CH 401", "CH 511", "CG 503", "CG 505", "EH 605", "EH 608",
  "EH 303", "EH 612", "EH 602", "EH 304",
]);

export const CHEMICAL_CORE = new Set([
  "ES 211", "CL 201", "CL 202", "CL 203", "CL 204", "CL 205",
  "CL 313", "CL 314", "CL 315", "CL 326", "CL 316", "CL 317",
  "CL 325", "CL 327",
]);

export const KNOWN_CHEMICAL_ELECTIVES = new Set(["CL 328"]);

export const DETAILS: Record<string, { title: string; credits: number }> = {
  "FP 100": { title: "Foundation Programme", credits: 4 },
  "ES 101": { title: "Engineering Graphics", credits: 3 },
  "ES 112": { title: "Computing", credits: 3 },
  "ES 113": { title: "Data-Centric Computing", credits: 3 },
  "ES 114": { title: "Probability, Statistics, and Data Visualization", credits: 3 },
  "ES 115": { title: "Design, Innovation, and Prototyping", credits: 5 },
  "ES 116": { title: "Principles and Applications of Electrical Engineering", credits: 5 },
  "ES 117": { title: "The World of Engineering", credits: 2 },
  "ES 118": { title: "Materials for the Future", credits: 3 },
  "ES 243": { title: "Biology for Engineers", credits: 4 },
  "BS 192": { title: "Undergraduate Science Laboratory", credits: 3 },
  "MA 103": { title: "Calculus of Single Variable and Linear Algebra", credits: 4 },
  "MA 104": { title: "Ordinary Differential Equations", credits: 2 },
  "MA 203": { title: "Numerical Methods", credits: 2 },
  "HS 151": { title: "Economics", credits: 4 },
  "HS 191": { title: "Introduction to Writing I", credits: 2 },
  "HS 192": { title: "Introduction to Writing II", credits: 2 },
  "HS 201": { title: "World Civilizations and Cultures", credits: 4 },
  "HS 221": { title: "Introduction to Philosophy", credits: 4 },
  "ES 211": { title: "Thermodynamics", credits: 3 },
  "CL 201": { title: "Chemical Process Calculations", credits: 3 },
  "CL 202": { title: "Chemical Engineering Thermodynamics", credits: 3 },
  "CL 203": { title: "Process Fluid Mechanics", credits: 3 },
  "CL 204": { title: "Heat Transfer", credits: 3 },
  "CL 205": { title: "Chemical Reaction Engineering I", credits: 3 },
  "CL 313": { title: "Chemical Reaction Engineering II", credits: 3 },
  "CL 314": { title: "Separation Processes I", credits: 3 },
  "CL 315": { title: "Process Dynamics and Control", credits: 3 },
  "CL 326": { title: "Integrated Chemical Engineering Lab I", credits: 3 },
  "CL 316": { title: "Separation Processes II", credits: 3 },
  "CL 317": { title: "Process Synthesis, Design and Simulation", credits: 4 },
  "CL 325": { title: "Transport Phenomena", credits: 3 },
  "CL 327": { title: "Integrated Chemical Engineering Lab II", credits: 2 },
};

export const CORE_ORDER = [
  "ES 211", "CL 201", "CL 202", "CL 203", "CL 204", "CL 205",
  "CL 313", "CL 314", "CL 315", "CL 326", "CL 316", "CL 317",
  "CL 325", "CL 327",
];

export const FIXED_GROUPS = [
  { id: "foundation", name: "Foundation Programme", codes: ["FP 100"] },
  { id: "institute", name: "Institute compulsory", codes: [...INSTITUTE] },
  { id: "mathematics", name: "Mathematics mandatory", codes: ["MA 103", "MA 104", "MA 203"] },
  { id: "hss", name: "HSS mandatory", codes: ["HS 151", "HS 191", "HS 192", "HS 201", "HS 221"] },
  { id: "core", name: "Chemical Engineering core", codes: CORE_ORDER },
];


export type ProgrammeId = "chemical" | "cse" | "ai" | "civil" | "electrical" | "icdt" | "materials" | "mechanical";
export type CourseDetails = { title: string; credits: number; codePending?: boolean };
export type Requirement = { id: BasketId; name: string; required: number; note: string };
export type FixedGroup = { id: string; name: string; codes: string[] };
export type Programme = {
  id: ProgrammeId;
  name: string;
  shortName: string;
  cohort: string;
  totalRequired: number;
  requirements: readonly Requirement[];
  fixedGroups: readonly FixedGroup[];
  core: ReadonlySet<string>;
  coreBasket: BasketId;
  cappedElectiveBaskets?: BasketId[];
  disciplineElectiveCap?: number;
  limitedKinds?: ("online" | "project")[];
  prohibitedElectiveKinds?: ("online" | "project")[];
  electivePrefix?: string;
  electives?: ReadonlySet<string>;
  electiveRule?: string;
  capLabel?: string;
  sourcePages?: string;
  scienceRule?: { name: string; codes: string[]; titles?: string[] };
  coreTitleAliases?: Record<string, string[]>;
  details: Record<string, CourseDetails>;
  optionIds: BasketId[];
};

// Advisory 13 (January 2025), pp. 12–13; codes verified against p. 20.
export const CSE_DETAILS: Record<string, { title: string; credits: number }> = {
  "ES 242": { title: "Data Structures & Algorithms I", credits: 4 },
  "ES 214": { title: "Discrete Mathematics", credits: 4 },
  "ES 204": { title: "Digital Systems", credits: 4 },
  "ES 336": { title: "Computer Organization & Architecture", credits: 4 },
  "CS 201": { title: "Theory of Computing", credits: 4 },
  "CS 202": { title: "Software Tools & Techniques for CSE", credits: 4 },
  "CS 329": { title: "Foundations of AI: Multiagent Systems", credits: 4 },
  "CS 330": { title: "Operating Systems", credits: 4 },
  "CS 331": { title: "Computer Networks", credits: 4 },
};
export const CSE_CORE = new Set(Object.keys(CSE_DETAILS));
export const CSE_THEORY = new Set(["ES 301", "CS 614", "CS 617", "CS 328"]);
export const CSE_SYSTEMS = new Set([
  "CS 327", "CS 332", "CS 431", "CS 433", "CS 434", "CS 435", "CS 615", "CS 616", "ES 668",
]);
export const CSE_ELECTIVES = new Set([
  "ES 335", "ES 404", "ES 615", "ES 627", "ES 637", "ES 645", "ES 659", "ES 661",
  "ES 666", "ES 667", "ES 669", "ES 670",
]);
export const CSE_LIMITED_ELECTIVE_CAP = 8;
// Advisory 13 (January 2025), pp. 10–11, with core codes from p. 17.
export const AI_DETAILS: Record<string, { title: string; credits: number }> = {
  "ES 242": { title: "Data Structures & Algorithms I", credits: 4 },
  "ES 244": { title: "Signals, Systems & Random Processes", credits: 4 },
  "ES 204": { title: "Digital Systems", credits: 4 },
  "CS 201": { title: "Theory of Computing", credits: 4 },
  "CS 303": { title: "Mathematical Foundations for AI", credits: 4 },
  "ES 245": { title: "Control Systems", credits: 4 },
  "CS 203": { title: "Software Tools & Techniques for AI", credits: 4 },
  "ES 336": { title: "Computer Organization & Architecture", credits: 4 },
  "CS 329": { title: "Foundations of AI: Multiagent Systems", credits: 4 },
  "ES 335": { title: "Machine Learning", credits: 4 },
  "CS 328": { title: "Introduction to Data Science", credits: 4 },
};
export const AI_CORE = new Set(Object.keys(AI_DETAILS));
export const AI_CSE_BASKET = new Set(["CS 301", "CS 327", "CS 432", "CS 433", "EE 323", "ES 214", "ES 669"]);
export const AI_ELECTIVES = new Set(["CS 613", "ES 615", "ES 645", "ES 659", "ES 661", "ES 666", "ES 667", "ES 670"]);
// The AI basket uses older/inconsistent codes compared with the CSE section.
// Only these named code/title combinations are automatically placed here.
export const AI_AMBIGUOUS_BASKET_CODES: Record<string, { title: string; matches: RegExp }> = {
  "CS 301": { title: "Operating Systems", matches: /\boperating\s+systems?\b/i },
  "CS 432": { title: "Databases", matches: /\bdatabases?\b/i },
  "CS 433": { title: "Computer Networks", matches: /\bcomputer\s+networks?\b/i },
};
const commonRequirements: Requirement[] = REQUIREMENTS.filter(
  (item) => item.id !== "chemical_core" && item.id !== "chemical_elective",
);
const cseRequirements: Requirement[] = [
  ...commonRequirements,
  { id: "cse_core", name: "CSE Core", required: 36, note: "Nine mandatory courses, 4 credits each" },
  { id: "cse_theory", name: "CSE Theory & Algorithms", required: 8, note: "At least 8 credits; excess counts toward other CSE electives" },
  { id: "cse_systems", name: "CSE Systems", required: 8, note: "At least 8 credits; excess counts toward other CSE electives" },
  { id: "cse_elective", name: "Other CSE elective credits", required: 10, note: "26 elective credits overall, including the two 8-credit baskets" },
];
const aiRequirements: Requirement[] = [
  ...commonRequirements,
  { id: "ai_core", name: "AI Core", required: 44, note: "Eleven mandatory courses, 4 credits each" },
  { id: "ai_cse", name: "AI CSE Basket", required: 4, note: "At least 4 elective credits; excess counts toward other AI electives" },
  { id: "ai_elective", name: "Other AI elective credits", required: 16, note: "20 elective credits overall, including at least 4 from the CSE basket" },
];
function optionIds(requirements: readonly Requirement[]): BasketId[] {
  return [...requirements.map((item) => item.id), "additional", "excluded", "unresolved"];
}

// January 2025 Advisory 13, pp. 12–16; codes from sample paths pp. 19, 21–24.
export const CIVIL_DETAILS: Record<string, CourseDetails> = {
  "ES 221": { title: "Mechanics of Solids", credits: 4 },
  "CE 201": { title: "Earth Materials & Processes", credits: 2 },
  "CE 203": { title: "Geospatial Engineering", credits: 3 },
  "CE 302": { title: "Structural Analysis", credits: 4 },
  "ES 212": { title: "Fluid Mechanics", credits: 4 },
  "CE 202": { title: "Sustainability & Environment", credits: 3 },
  "CE 310": { title: "Hydrology & Hydraulics", credits: 4 },
  "CE 312": { title: "Design of Steel Structures", credits: 4 },
  "CE 301": { title: "Soil Mechanics", credits: 5 },
  "CE 311": { title: "Design of Reinforced Concrete Structures", credits: 5 },
  "CE 403": { title: "Construction Technology & Management", credits: 4 },
};
export const CIVIL_DESIGN = new Set(["CE 313", "CE 314", "CE 404"]);
export const CIVIL_ELECTIVES = new Set(["CE 307", "CE 637", "ES 404"]);
export const ELECTRICAL_DETAILS: Record<string, CourseDetails> = {
  "ES 244": { title: "Signals, Systems & Random Processes", credits: 4 },
  "EE 221": { title: "Electronic Devices", credits: 3 },
  "EE 223": { title: "Electrical Machines", credits: 4 },
  "EE 224": { title: "Power Systems", credits: 4 },
  "ES 245": { title: "Control Systems", credits: 4 },
  "ES 204": { title: "Digital Systems", credits: 4 },
  "EE 312": { title: "Engineering Electromagnetics", credits: 4 },
  "EE 322": { title: "Analog & Mixed Signal Circuits", credits: 4 },
  "EE 333": { title: "Power Electronics", credits: 4 },
  "EE 323": { title: "Digital Signal Processing", credits: 4 },
  "EE 313": { title: "Communication Systems", credits: 3 },
};
export const ELECTRICAL_ELECTIVES = new Set([
  "ES 215", "ES 333", "ES 412", "ES 414", "ES 416", "ES 408", "ES 612", "ES 613", "ES 615", "ES 616",
  "ES 625", "ES 626", "ES 637", "ES 641", "ES 642", "ES 655", "ES 656", "ES 657", "ES 659", "ES 662",
  "ES 663", "ES 665", "ES 666", "ES 667", "ES 668", "ES 669", "ES 670", "PH 643",
]);
// Internal requirement keys are not course codes. The advisory leaves these
// ICDT codes unspecified; they are matched by exact normalized course title.
export const ICDT_DETAILS: Record<string, CourseDetails> = {
  "icdt-unveiling": { title: "Unveiling the Semiconductor World", credits: 2, codePending: true },
  "ES 244": ELECTRICAL_DETAILS["ES 244"],
  "ES 336": CSE_DETAILS["ES 336"],
  "ES 204": CSE_DETAILS["ES 204"],
  "EE 322": ELECTRICAL_DETAILS["EE 322"],
  "icdt-cmos": { title: "CMOS Circuit Design", credits: 4, codePending: true },
  "icdt-devices": { title: "Semiconductor Devices", credits: 4, codePending: true },
  "icdt-characterization": { title: "Semiconductor Material & Device Characterization", credits: 4, codePending: true },
  "icdt-fabrication": { title: "IC Fabrication & Manufacturing", credits: 4, codePending: true },
  "icdt-thin-film": { title: "Thin Film Science & Vacuum Technology", credits: 4, codePending: true },
  "icdt-packaging": { title: "Semiconductor Package Assembly & Manufacturing", credits: 4, codePending: true },
  "icdt-lab": { title: "IC Fabrication Lab", credits: 2, codePending: true },
};
export const ICDT_ELECTIVES = new Set(["EE 651", "EE 660", "ES 672"]);
export const MATERIALS_DETAILS: Record<string, CourseDetails> = {
  "MSE 207": { title: "Structure of Materials", credits: 4 },
  "MSE 202": { title: "Materials Thermodynamics", credits: 4 },
  "MSE 204": { title: "Transport Phenomena in Materials Engineering", credits: 4 },
  "MSE 210": { title: "Microstructural Engineering", credits: 4 },
  "MSE 206": { title: "Physics of Materials", credits: 4 },
  "MSE 203": { title: "Integrated Computational Materials Engineering", credits: 4 },
  "MSE 205": { title: "Mechanical Behaviour of Materials", credits: 4 },
  "MSE 313": { title: "Polymers, Ceramics and Composites", credits: 4 },
  "MSE 307": { title: "Materials Processing", credits: 4 },
  "MSE 302": { title: "Corrosion & Degradation of Materials", credits: 4 },
  "MSE 312": { title: "Materials & Environment", credits: 2 },
};
export const MECHANICAL_DETAILS: Record<string, CourseDetails> = {
  "ES 211": { title: "Thermodynamics", credits: 3 },
  "ME 206": { title: "Statics & Dynamics", credits: 4 },
  "ME 207": { title: "Fluid Dynamics", credits: 5 },
  "ES 221": CIVIL_DETAILS["ES 221"],
  "ME 209": { title: "Principles of Manufacturing Processes", credits: 3 },
  "ME 208": { title: "Vibrations", credits: 2 },
  "ME 334": { title: "Heat and Mass Transfer", credits: 4 },
  "ME 362": { title: "Introduction to Manufacturing Systems & Metrology", credits: 3 },
  "ME 333": { title: "Mechanics of Materials", credits: 3 },
  "ES 245": ELECTRICAL_DETAILS["ES 245"],
  "ME 335": { title: "Synthesis and Analysis of Mechanisms", credits: 3 },
  "ME 337": { title: "Mechanical Systems Design", credits: 3 },
  "ES 337": { title: "Energy Systems", credits: 3 },
};
export const MECHANICAL_ELECTIVES = new Set([
  "CL 324", "CS 435", "ES 214", "ES 408", "ES 604", "ES 607", "ES 613", "ES 616", "ES 621", "ES 622",
  "ES 631", "ES 632", "ES 641", "ES 642", "ES 646", "ES 648", "ES 653", "ES 656", "MSE 313", "MSE 632",
]);
function remainingProgramme(
  id: ProgrammeId, name: string, shortName: string, coreDetails: Record<string, CourseDetails>,
  extras: Partial<Programme> = {},
): Programme {
  const coreCredits = Object.values(coreDetails).reduce((sum, item) => sum + item.credits, 0);
  const requirements: Requirement[] = [...commonRequirements,
    { id: "discipline_core", name: `${shortName} Core`, required: coreCredits, note: `${Object.keys(coreDetails).length} mandatory courses` },
    ...(id === "civil" ? [{ id: "civil_design" as const, name: "CE Design / Applications", required: 12, note: "Separate design / applications basket" }] : []),
    { id: "discipline_elective", name: `${shortName} ${id === "civil" ? "General " : ""}Discipline Electives`, required: id === "civil" ? 8 : 20, note: "Approved discipline elective basket" },
  ];
  return { id, name, shortName, cohort: "2024–28", totalRequired: 108 + coreCredits + 20,
    requirements, coreBasket: "discipline_core", core: new Set(Object.keys(coreDetails)),
    fixedGroups: [...FIXED_GROUPS.filter((group) => group.id !== "core"), { id: "core", name: `${name} core`, codes: Object.keys(coreDetails) }],
    details: { ...DETAILS, ...coreDetails }, optionIds: optionIds(requirements), ...extras };
}
export const PROGRAMMES: Record<ProgrammeId, Programme> = {
  chemical: {
    id: "chemical", name: "Chemical Engineering", shortName: "ChE", cohort: "2024–28",
    totalRequired: TOTAL_REQUIRED, requirements: REQUIREMENTS, fixedGroups: FIXED_GROUPS,
    core: CHEMICAL_CORE, coreBasket: "chemical_core", details: DETAILS, optionIds: optionIds(REQUIREMENTS),
  },
  cse: {
    id: "cse", name: "Computer Science and Engineering", shortName: "CSE", cohort: "2024–28",
    totalRequired: TOTAL_REQUIRED, requirements: cseRequirements,
    fixedGroups: [...FIXED_GROUPS.filter((group) => group.id !== "core"),
      { id: "core", name: "Computer Science and Engineering core", codes: [...CSE_CORE] }],
    core: CSE_CORE, coreBasket: "cse_core", details: { ...DETAILS, ...CSE_DETAILS }, optionIds: optionIds(cseRequirements),
    cappedElectiveBaskets: ["cse_theory", "cse_systems", "cse_elective"], disciplineElectiveCap: CSE_LIMITED_ELECTIVE_CAP,
  },
  ai: {
    id: "ai", name: "Artificial Intelligence", shortName: "AI", cohort: "2024–28",
    totalRequired: 172, requirements: aiRequirements,
    fixedGroups: [...FIXED_GROUPS.filter((group) => group.id !== "core"),
      { id: "core", name: "Artificial Intelligence core", codes: [...AI_CORE] }],
    core: AI_CORE, coreBasket: "ai_core", details: { ...DETAILS, ...AI_DETAILS }, optionIds: optionIds(aiRequirements),
    cappedElectiveBaskets: ["ai_cse", "ai_elective"], disciplineElectiveCap: 8,
  },
  civil: remainingProgramme("civil", "Civil Engineering", "CE", CIVIL_DETAILS, {
    electives: CIVIL_ELECTIVES, sourcePages: "9, 12 and 19",
    electiveRule: "CE electives need 12 Design / Applications credits and 8 General CE credits. The two baskets are separate; excess in one does not replace the other.",
  }),
  electrical: remainingProgramme("electrical", "Electrical Engineering", "EE", ELECTRICAL_DETAILS, {
    electives: ELECTRICAL_ELECTIVES, electivePrefix: "EE", sourcePages: "9, 13–14 and 21",
    cappedElectiveBaskets: ["discipline_elective"], prohibitedElectiveKinds: ["online", "project"],
    electiveRule: "Project courses and online courses are not counted as EE discipline electives. PH 201 must count in the Science basket.",
    scienceRule: { name: "EE Science: PH 201", codes: ["PH 201"] },
  }),
  icdt: remainingProgramme("icdt", "Integrated Circuit Design and Technology", "ICDT", ICDT_DETAILS, {
    electives: ICDT_ELECTIVES, sourcePages: "9, 14–15 and 22",
    electiveRule: "Several ICDT core codes are unspecified in the advisory. These courses match by full title; verify the actual transcript code. Unlisted electives need an approved classification.",
    coreTitleAliases: { "icdt-fabrication": ["Integrated Circuits Fabrication & Manufacturing"], "icdt-thin-film": ["Introduction to Thin Film Science & Vacuum Technology"], "icdt-lab": ["Device Fabrication Lab", "Integrated Circuit Fabrication Lab"] },
    scienceRule: { name: "ICDT Science: PH 510 or Physics of Materials", codes: ["PH 510"], titles: ["Physics of Materials"] },
  }),
  materials: remainingProgramme("materials", "Materials Engineering", "MSE", MATERIALS_DETAILS, {
    electivePrefix: "MSE", sourcePages: "9, 15–16 and 23",
    cappedElectiveBaskets: ["discipline_elective"], disciplineElectiveCap: 8, limitedKinds: ["project"], capLabel: "MSE project discipline-elective credits",
    electiveRule: "All MSE electives are eligible. MSE 299/399/499 projects can contribute at most 8 discipline-elective credits. One of PH 201, PH 202 or CH 203 must count in Science.",
    scienceRule: { name: "MSE Science: PH 201 / PH 202 / CH 203", codes: ["PH 201", "PH 202", "CH 203"] },
  }),
  mechanical: remainingProgramme("mechanical", "Mechanical Engineering", "ME", MECHANICAL_DETAILS, {
    electives: MECHANICAL_ELECTIVES, electivePrefix: "ME", sourcePages: "9, 16 and 24",
    cappedElectiveBaskets: ["discipline_elective"], disciplineElectiveCap: 8, limitedKinds: ["project"], capLabel: "ME project discipline-elective credits", prohibitedElectiveKinds: ["online"],
    electiveRule: "Online courses are not counted as ME discipline electives. ME projects can contribute at most 8 discipline-elective credits. The specified Physics / Chemistry Science requirement is checked separately.",
    scienceRule: { name: "ME specified Physics / Chemistry Science course", codes: ["PH 201", "PH 202", "PH 404", "PH 503", "PH 505", "PH 507", "PH 508", "PH 509", "PH 510", "CH 203", "CH 204", "CH 302", "CH 401"] },
  }),
};
export function getProgramme(id: ProgrammeId = "chemical") {
  return PROGRAMMES[id];
}
