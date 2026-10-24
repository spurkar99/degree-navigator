export const SAMPLE_TRANSCRIPT: Record<number, string> = {
  1: `| ES 101 | Engineering Graphics | 3 |
| ES 112 | Computing | 3 |
| ES 115 | Design, Innovation, and Prototyping | 5 |
| ES 118 | Materials for the Future | 3 |
| FP 100 | Foundation Programme | 4 |
| HS 191 | Introduction to Writing I | 2 |
| HS 201 | World Civilizations and Cultures | 4 |
| IN 101 | Comprehensive Viva Voce | 0 |
| MA 103 | Calculus of Single Variable and Linear Algebra | 4 |
| PE 101 | Physical Education | 0 |
| SC 368 | Introduction to Web Development | 1 |`,
  2: `| BS 192 | Undergraduate Science Laboratory | 3 |
| ES 113 | Data-Centric Computing | 3 |
| ES 114 | Probability, Statistics, and Data Visualization | 3 |
| ES 116 | Principles and Applications of Electrical Engineering | 5 |
| ES 117 | The World of Engineering | 2 |
| GE 101 | General Education I | 2 |
| HS 192 | Introduction to Writing II | 2 |
| IN 102 | Comprehensive Viva Voce | 0 |
| MA 104 | Ordinary Differential Equations | 2 |
| PE 102 | Physical Education | 0 |
| CL 201 | Chemical Process Calculations | 3 |`,
  3: `| CL 328 | Chemical Engineering Practice in Industry | 2 |
| ES 211 | Thermodynamics | 3 |
| ES 243 | Biology for Engineers | 4 |
| GE 201 | General Education II | 2 |
| HS 221 | Introduction to Philosophy | 4 |
| IN 103 | Comprehensive Viva Voce | 0 |
| MA 205 | Calculus of Several Variables | 2 |
| MS 408 | Financial Considerations In Engineering Decisions | 4 |
| PE 103 | Physical Education | 0 |
| CL 202 | Chemical Engineering Thermodynamics | 3 |`,
  4: `| CL 203 | Process Fluid Mechanics | 3 |
| CL 204 | Heat Transfer | 3 |
| CL 205 | Chemical Reaction Engineering I | 3 |
| EH 612 | Ocean and Global Change | 4 |
| ES 418 | Financial Modeling and Engineering | 4 |
| IN 104 | Comprehensive Viva Voce | 0 |
| MA 203 | Numerical Methods | 2 |
| MS 491-XVI | Special Topics in Management: Lean Six Sigma | 4 |
| PE 104 | Physical Education | 0 |`,
};


// Illustrative CSE history based on the sample academic path in Advisory 13,
// p. 20. This is example data, not a student's transcript or course timetable.
export const CSE_SAMPLE_TRANSCRIPT: Record<number, string> = {
  1: SAMPLE_TRANSCRIPT[1].split("\n").filter((row) => !row.includes("SC 368")).join("\n"),
  2: SAMPLE_TRANSCRIPT[2].split("\n").filter((row) => !row.includes("CL 201")).join("\n"),
  3: `| GE 201 | General Education II | 2 |
| HS 221 | Introduction to Philosophy | 4 |
| MA 203 | Numerical Methods | 2 |
| PH 201 | Introduction to Electrodynamics | 4 |
| ES 243 | Biology for Engineers | 4 |
| ES 214 | Discrete Mathematics | 4 |
| ES 242 | Data Structures & Algorithms I | 4 |
| IN 103 | Comprehensive Viva Voce | 0 |
| PE 103 | Physical Education | 0 |`,
  4: `| MS 408 | Financial Considerations in Engineering Decisions | 4 |
| MA 205 | Calculus of Several Variables | 2 |
| EH 612 | Ocean and Global Change | 4 |
| ES 204 | Digital Systems | 4 |
| CS 201 | Theory of Computing | 4 |
| CS 327 | Compilers | 4 |
| ES 301 | Data Structures & Algorithms II | 4 |
| IN 104 | Comprehensive Viva Voce | 0 |
| PE 104 | Physical Education | 0 |`,
};

// Illustrative AI path from Advisory 13, p. 17, with Science / HSS
// examples chosen only from the existing approved categories.
export const AI_SAMPLE_TRANSCRIPT: Record<number, string> = {
  1: CSE_SAMPLE_TRANSCRIPT[1],
  2: CSE_SAMPLE_TRANSCRIPT[2],
  3: CSE_SAMPLE_TRANSCRIPT[3].replace(
    "| ES 214 | Discrete Mathematics | 4 |",
    "| ES 244 | Signals, Systems & Random Processes | 4 |",
  ),
  4: `| MS 408 | Financial Considerations in Engineering Decisions | 4 |
| MA 205 | Calculus of Several Variables | 2 |
| EH 612 | Ocean and Global Change | 4 |
| ES 204 | Digital Systems | 4 |
| ES 245 | Control Systems | 4 |
| CS 201 | Theory of Computing | 4 |
| CS 303 | Mathematical Foundations for AI | 4 |
| IN 104 | Comprehensive Viva Voce | 0 |
| PE 104 | Physical Education | 0 |`,
};

// Illustrative histories based on Advisory 13 sample paths, with actual
// Science / HSS / elective examples substituted for generic basket slots.
const sampleYearOne = { 1: CSE_SAMPLE_TRANSCRIPT[1], 2: CSE_SAMPLE_TRANSCRIPT[2] };
const semesterRows = (rows: [string, string, number][], semester: number) => [
  ...rows.map(([code, title, credits]) => `| ${code} | ${title} | ${credits} |`),
  `| IN 10${semester} | Comprehensive Viva Voce | 0 |`,
  `| PE 10${semester} | Physical Education | 0 |`,
].join("\n");
const commonThird: [string, string, number][] = [
  ["GE 201", "General Education II", 2], ["HS 221", "Introduction to Philosophy", 4], ["MA 203", "Numerical Methods", 2],
];
const commonFourth: [string, string, number][] = [["MS 408", "Financial Considerations in Engineering Decisions", 4], ["MA 205", "Calculus of Several Variables", 2]];
export const CIVIL_SAMPLE_TRANSCRIPT = { ...sampleYearOne,
  3: semesterRows([...commonThird, ["PH 201", "Introduction to Electrodynamics", 4], ["ES 243", "Biology for Engineers", 4],
    ["ES 221", "Mechanics of Solids", 4], ["CE 201", "Earth Materials & Processes", 2], ["CE 203", "Geospatial Engineering", 3]], 3),
  4: semesterRows([...commonFourth, ["EH 612", "Ocean and Global Change", 4], ["ES 212", "Fluid Mechanics", 4],
    ["CE 202", "Sustainability & Environment", 3], ["CE 302", "Structural Analysis", 4], ["CE 313", "Environmental Science and Engineering", 4]], 4),
};
export const ELECTRICAL_SAMPLE_TRANSCRIPT = { ...sampleYearOne,
  3: semesterRows([...commonThird, ["PH 201", "Introduction to Electrodynamics", 4], ["ES 243", "Biology for Engineers", 4],
    ["ES 244", "Signals, Systems & Random Processes", 4], ["EE 221", "Electronic Devices", 3], ["EE 223", "Electrical Machines", 4]], 3),
  4: semesterRows([...commonFourth, ["EH 612", "Ocean and Global Change", 4], ["ES 204", "Digital Systems", 4],
    ["EE 224", "Power Systems", 4], ["ES 245", "Control Systems", 4]], 4),
};
// The advisory leaves these four ICDT codes blank. This example uses codes
// verified by title/credits in IITGN's official course list (October 2026):
// https://iitgn.ac.in/academics/courses . No new course equivalences are inferred.
// The unnumbered IC Fabrication & Manufacturing course is left for later.
export const ICDT_SAMPLE_TRANSCRIPT = { ...sampleYearOne,
  3: semesterRows([...commonThird, ["ES 204", "Digital Systems", 4], ["ES 244", "Signals, Systems & Random Processes", 4],
    ["EE 322", "Analog & Mixed Signal Circuits", 4], ["EE 225", "Unveiling the Semiconductor World", 2], ["EE 226", "Semiconductor Devices", 4]], 3),
  4: semesterRows([...commonFourth, ["PH 510", "Condensed Matter Physics", 4], ["EE 227", "CMOS Circuit Design", 4],
    ["ES 339", "Integrated Circuit Fabrication Lab", 2], ["EE 651", "CMOS Analog IC Design", 4]], 4),
};
export const MATERIALS_SAMPLE_TRANSCRIPT = { ...sampleYearOne,
  3: semesterRows([...commonThird, ["ES 243", "Biology for Engineers", 4], ["MSE 202", "Materials Thermodynamics", 4],
    ["MSE 204", "Transport Phenomena in Materials Engineering", 4], ["MSE 207", "Structure of Materials", 4]], 3),
  4: semesterRows([...commonFourth, ["MSE 203", "Integrated Computational Materials Engineering", 4], ["MSE 205", "Mechanical Behaviour of Materials", 4],
    ["MSE 206", "Physics of Materials", 4], ["MSE 210", "Microstructural Engineering", 4], ["MSE 632", "Characterization of Materials", 4]], 4),
};
export const MECHANICAL_SAMPLE_TRANSCRIPT = { ...sampleYearOne,
  3: semesterRows([...commonThird, ["PH 201", "Introduction to Electrodynamics", 4], ["ES 243", "Biology for Engineers", 4],
    ["ES 211", "Thermodynamics", 3], ["ME 206", "Statics & Dynamics", 4]], 3),
  4: semesterRows([...commonFourth, ["EH 612", "Ocean and Global Change", 4], ["ES 221", "Mechanics of Solids", 4],
    ["ME 207", "Fluid Dynamics", 5], ["ME 208", "Vibrations", 2], ["ME 209", "Principles of Manufacturing Processes", 3]], 4),
};

export const SAMPLE_TRANSCRIPTS = {
  chemical: SAMPLE_TRANSCRIPT,
  cse: CSE_SAMPLE_TRANSCRIPT,
  ai: AI_SAMPLE_TRANSCRIPT,
  civil: CIVIL_SAMPLE_TRANSCRIPT,
  electrical: ELECTRICAL_SAMPLE_TRANSCRIPT,
  icdt: ICDT_SAMPLE_TRANSCRIPT,
  materials: MATERIALS_SAMPLE_TRANSCRIPT,
  mechanical: MECHANICAL_SAMPLE_TRANSCRIPT,
};
