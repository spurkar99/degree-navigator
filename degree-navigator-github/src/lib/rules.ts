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
  excluded: "Does not count",
  unresolved: "I'm not sure",
};

export const RULESET = {
  programme: "B.Tech Chemical Engineering",
  cohort: "2024–28",
  version: "0.2.0",
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
