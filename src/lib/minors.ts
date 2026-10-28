import { courseKey, courseKind, matchCoreRequirement, resolveBasket, type Classifications } from "./audit";
import type { ReturnTypeOfAudit } from "./types";
import type { Course } from "./parser";
import { AI_CORE, AI_CSE_BASKET, AI_ELECTIVES, CSE_CORE, CSE_ELECTIVES, CSE_SYSTEMS, CSE_THEORY, getProgramme, type ProgrammeId } from "./rules";

export const MINOR_SOURCE = "Advisory 63 v1.11 (August 2025), with Advisory 13 (January 2025) sharing rules";
export const MINOR_LIST = [
  ["archaeology", "Archaeological Sciences"], ["ai", "Artificial Intelligence"], ["automobile", "Automobile Engineering"],
  ["biological", "Biological Engineering"], ["biomedical", "Biomedical Engineering"], ["chemical", "Chemical Engineering"],
  ["chemistry", "Chemistry"], ["civil", "Civil Engineering"], ["cognitive", "Cognitive Science"],
  ["computational_mechanics", "Computational Mechanics"], ["cse", "Computer Science and Engineering"],
  ["data_analytics", "Data Analytics"], ["design", "Design"], ["earth", "Earth Sciences"], ["electrical", "Electrical Engineering"],
  ["hss", "Humanities and Social Sciences"], ["icdt", "Integrated Circuit Design and Technology"], ["management", "Management"],
  ["materials", "Materials Engineering"], ["mathematics", "Mathematics"], ["mechanical", "Mechanical Engineering"],
  ["physics", "Physics"], ["quantum", "Quantum Technologies"], ["robotics", "Robotics"], ["safety", "Safety Engineering"],
  ["sustainable", "Sustainable Development"],
] as const;
export type MinorId = typeof MINOR_LIST[number][0];
export type MinorPlacement = { minorId: MinorId; approved?: boolean; group?: "circuits" | "devices" | "special" };
export type MinorPlan = { selected: MinorId[]; placements: Record<string, MinorPlacement> };
export const emptyMinorPlan = (): MinorPlan => ({selected: [], placements: {}});
const detailed = new Set<MinorId>(["archaeology", "biomedical", "computational_mechanics", "icdt", "quantum", "robotics", "sustainable", "ai", "cse", "data_analytics"]);
export const minorName = (id: MinorId) => MINOR_LIST.find(([key]) => key === id)?.[1] ?? id;
export const minorHasDetailedRules = (id: MinorId) => detailed.has(id);
export const minorAllowed = (id: MinorId, major: ProgrammeId) => id !== major;
const codes = (value: string) => value.split(",").map((s) => s.trim());
const archaeology = codes("EH 628,HS 326,HS 425,HS 508,HS 510,HS 520,IN 304,IN 402");
const biomedical = codes("BE 303,BE 304,BE 403,BE 601,BE 603,EE 605,BE 614,BE 616,BE 617,CL 426,EE 323,EE 606,ES 244,ES 606,ES 623,ES 641,ES 655,ES 656,ES 657,HS 638,MS 410,MSE 605");
const computational = codes("MSE 203,MSE 402,EH 618,ES 664,CS 616,ES 658");
const computationalTitles = ["High Performance Computing", "Data Analysis and Visualization", "Computational Methods in Structural Engineering"];
const quantum = codes("PH 616,PH 643");
const quantumTitles = ["Basic Laboratory for Quantum Technologies", "Solid State Physics", "Introduction to Quantum Materials", "Introduction to Quantum Sensing"];
const robotics = codes("ES 321,ES 332,ES 408,ES 613,ES 616,ES 637,ES 641,ES 642,ES 656,ES 666,ME 322,ME 639");
const analytics = codes("BE 614,CE 605,ES 606,CS 328,CS 432,CS 613,EE 605,EE 606,EE 609,EE 645,ES 242,ES 301,ES 404,ES 410,ES 411,ES 413,ES 612,ES 615,ES 617,ES 634,ES 645,HS 523,MA 632,ES 335,EH 615");
const themes: Record<string, string> = {
  "CE 605": "Water", "CE 611": "Water", "CE 637": "Water", "EH 602": "Water", "EH 612": "Water",
  "CE 634": "Pollution & Waste", "CE 691-VI": "Pollution & Waste", "CE 691-VII": "Pollution & Waste", "ES 635": "Pollution & Waste",
  "EE 426": "Energy", "EE 691-V": "Energy", "EE 691-VII": "Energy", "ES 632": "Energy", "ES 663": "Energy", "ES 665": "Energy",
  "EH 605": "Environment / Earth Systems", "EH 608": "Environment / Earth Systems", "EH 691": "Environment / Earth Systems", "HS 515": "Environment / Earth Systems", "IN 304": "Environment / Earth Systems",
};
const titleKey = (title: string) => title.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "");
const titleIs = (c: Course, ...titles: string[]) => titles.some((title) => titleKey(title) === titleKey(c.title));
const icdtTitles = ["Analog & Mixed-Signal Circuits", "CMOS Circuit Design", "Computer Organization & Architecture", "Digital Systems", "Integrated Circuit Fabrication & Manufacturing", "IC Fabrication & Manufacturing", "Integrated Circuits Fabrication & Manufacturing", "Semiconductor Devices", "Semiconductor Material & Device Characterization", "Semiconductor Package Assembly & Manufacturing", "Thin Film Science & Vacuum Technology", "Introduction to Thin Film Science & Vacuum Technology"];

export const MINOR_NOTES: Partial<Record<MinorId, string>> = {
  archaeology: "20 credits from the eight listed courses; at most one approved Archaeological Sciences project.",
  biomedical: "20 credits, including at least 16 from the listed Biomedical basket; at most one approved project.",
  computational_mechanics: "Numerical Methods for Engineers (4 credits), at least one of ES 622 / ME 605, up to three optional-basket courses (12 credits), and at most one approved project. TBD courses match by full title.",
  icdt: "At least two listed core courses (4 credits each), one Circuits elective and one Materials & Devices elective. Confirm elective basket membership with the department. At most one EE 299/399/499 project.",
  quantum: "PH 202 and Quantum Technologies - Applications are compulsory; at least two listed basket courses and at most one approved project. TBD courses match by full title.",
  robotics: "At least one of ME 639 / ES 408. Approved projects and special topics share an 8-credit limit; HoD and DOAA recommendation is required.",
  sustainable: "20 credits from the listed courses, covering at least two of Water, Pollution & Waste, Energy, and Environment / Earth Systems.",
  ai: "CS 303 (4 credits), at least two additional AI core courses, and two further eligible courses; at most one CS 299/399/499 project. Base mandatory courses cannot count again.",
  cse: "ES 242 (4 credits; waived for AI majors), at least two additional CSE core courses, and two further eligible courses. At most one CS project. Only Swayam-NPTEL online courses can count, in the further-course category.",
  data_analytics: "20 credits, including at least 12 from the listed Data Analytics basket. At most one approved project (4 credits) and up to 4 approved Swayam-NPTEL credits; other online platforms do not count.",
};
export function minorNote(id: MinorId) {
  return MINOR_NOTES[id] ?? "20 department-approved credits. This advisory lists the minor but does not specify its course basket or further conditions. Track approved courses here; department review remains required.";
}

type Category = "listed" | "core" | "mandatory" | "optional" | "circuits" | "devices" | "project" | "special" | "other";
type Match = { category: Category; approval: boolean; identity?: string };
function matchMinor(c: Course, p: MinorPlacement): Match | null {
  const id = p.minorId, project = courseKind(c) === "project", regular = courseKind(c) === "regular";
  if (!detailed.has(id)) return {category: project ? "project" : "other", approval: true};
  if (project) {
    if (["ai", "cse"].includes(id) && !/^CS (299|399|499)$/.test(c.code)) return null;
    if (id === "icdt" && !/^EE (299|399|499)$/.test(c.code)) return null;
    if (id === "sustainable") return null;
    return {category: "project", approval: true};
  }
  if (id === "archaeology") return archaeology.includes(c.code) ? {category: "listed", approval: !regular} : null;
  if (id === "biomedical") return {category: biomedical.includes(c.code) && regular ? "listed" : "other", approval: !biomedical.includes(c.code) || !regular};
  if (id === "computational_mechanics") {
    if (regular && titleIs(c, "Numerical Methods for Engineers")) return {category: "mandatory", approval: false, identity: "numerical-methods-for-engineers"};
    if (regular && ["ES 622", "ME 605"].includes(c.code)) return {category: "core", approval: false};
    if (computational.includes(c.code) || computationalTitles.some((title) => titleIs(c, title))) return {category: "optional", approval: !regular, identity: computational.includes(c.code) ? c.code : titleKey(c.title)};
    return null;
  }
  if (id === "icdt") {
    if (regular && (icdtTitles.some((title) => titleIs(c, title)) || ["EE 322", "ES 336", "ES 204"].includes(c.code))) {
      const knownCoreTitle: Record<string,string> = {"EE 322":"Analog & Mixed-Signal Circuits","ES 336":"Computer Organization & Architecture","ES 204":"Digital Systems"};
      const canonical = knownCoreTitle[c.code] ? titleKey(knownCoreTitle[c.code]) : titleIs(c, "IC Fabrication & Manufacturing", "Integrated Circuits Fabrication & Manufacturing") ? "integratedcircuitfabricationandmanufacturing" :
        titleIs(c, "Introduction to Thin Film Science & Vacuum Technology") ? "thinfilmscienceandvacuumtechnology" : titleKey(c.title);
      return {category: "core", approval: false, identity: canonical};
    }
    if (p.group === "circuits" || p.group === "devices") return {category: p.group, approval: true};
    return null;
  }
  if (id === "quantum") {
    if (regular && (c.code === "PH 202" || titleIs(c, "Quantum Technologies - Applications"))) return {category: "mandatory", approval: false, identity: c.code === "PH 202" ? "PH 202" : "quantum-applications"};
    if (quantum.includes(c.code) || quantumTitles.some((title) => titleIs(c, title))) return {category: "listed", approval: !regular, identity: quantum.includes(c.code) ? c.code : titleKey(c.title)};
    return null;
  }
  if (id === "robotics") {
    if (p.group === "special" || /-/.test(c.code)) return {category: "special", approval: true};
    return robotics.includes(c.code) ? {category: "listed", approval: !regular} : null;
  }
  if (id === "sustainable") {
    if (!themes[c.code]) return null;
    if (c.code === "EH 691" && !titleIs(c, "Data Analysis for Earth System Sciences")) return null;
    return {category: "listed", approval: !regular};
  }
  if (id === "ai") {
    if (regular && c.code === "CS 303") return {category: "mandatory", approval: false};
    if (regular && AI_CORE.has(c.code)) return {category: "core", approval: false};
    // AI basket codes CS 301/432/433 conflict across advisory sections.
    const conflict = c.code === "CS 301" ? !titleIs(c, "Operating Systems") : c.code === "CS 432" ? !titleIs(c, "Databases") : c.code === "CS 433" ? !titleIs(c, "Computer Networks") : false;
    if ((AI_CSE_BASKET.has(c.code) || AI_ELECTIVES.has(c.code)) && !conflict) return {category: "other", approval: !regular};
    return {category: "other", approval: true};
  }
  if (id === "cse") {
    if (regular && c.code === "ES 242") return {category: "mandatory", approval: false};
    if (regular && CSE_CORE.has(c.code)) return {category: "core", approval: false};
    const known = c.code.startsWith("CS ") || CSE_ELECTIVES.has(c.code) || CSE_THEORY.has(c.code) || CSE_SYSTEMS.has(c.code);
    return {category: "other", approval: !known || !regular};
  }
  if (id === "data_analytics") {
    const listed = analytics.includes(c.code) && !(c.code === "CS 432" && !titleIs(c,"Databases"));
    return {category: regular && listed ? "listed" : "other", approval: !regular || !listed};
  }
  return null;
}

export type MinorCheck = {name: string; completed: number; required: number; unit: "credits" | "courses" | "themes"};
export type MinorEntry = { course: Course; credits: number; shared: boolean; category: Category; identity: string };
export type MinorResult = {
  id: MinorId; name: string; detailed: boolean; required: number; completed: number; remaining: number;
  shared: number; additional: number; entries: MinorEntry[]; issues: string[]; checks: MinorCheck[];
  status: "Tracked rules met" | "Department review required" | "In progress";
};
export type MinorAudit = {results: MinorResult[]; sharedCourses: number; sharedCredits: number; additionalCredits: number; projectCredits: number; issues: string[]};

/** Explicit placement only; a course belongs to one minor, with up to two
 * qualifying base Open Electives shared across ALL selected minors. */
export function auditMinors(courses: Course[], choices: Classifications, base: ReturnTypeOfAudit, plan: MinorPlan): MinorAudit {
  const selected = [...new Set(plan.selected)].filter((id) => MINOR_LIST.some(([key]) => key === id));
  const results: MinorResult[] = selected.map((id) => ({id, name: minorName(id), detailed: detailed.has(id), required: 20,
    completed: 0, remaining: 20, shared: 0, additional: 0, entries: [], issues: [], checks: [], status: "In progress"}));
  const seen = new Set<string>(), identities = new Set<string>(), shared = new Set<string>();
  let projectCredits = base.projectCredits, additionalCredits = 0;
  const sharedEntries: {course: Course; credits: number}[] = [];
  const quota = new Map<MinorId, {projects: number; projectCredits: number; online: number; optional: number; optionalCredits: number}>();
  const fixed = new Set(base.programme.fixedGroups.flatMap((g) => g.codes));
  if (base.programme.scienceRule?.codes.length === 1 && !base.programme.scienceRule.titles?.length) fixed.add(base.programme.scienceRule.codes[0]);
  for (const c of courses.slice().sort((a,b) => a.semester-b.semester || a.code.localeCompare(b.code))) {
    if (seen.has(c.code)) continue;
    seen.add(c.code);
    const p = plan.placements[courseKey(c)];
    const r = results.find((result) => result.id === p?.minorId);
    if (!p || !r) continue;
    const reject = (reason: string) => r.issues.push(`${c.code}: ${reason}`);
    if (!minorAllowed(p.minorId, base.programmeId)) {reject("a minor must be outside your own major.");continue;}
    if (!(c.credits > 0) || /^SC |^PE |^IN 1\d{2}$/.test(c.code)) {reject("this activity / short course cannot count towards the minor.");continue;}
    if (fixed.has(c.code) || matchCoreRequirement(c, base.programmeId)) {reject("this is a mandatory base-programme course; it cannot also count towards a minor.");continue;}
    const basket = resolveBasket(c, choices, base.programmeId);
    const isShared = basket === "open_elective";
    if (basket !== "additional" && !isShared) {reject("choose Additional learning (minor only), or Open Elective for permitted sharing. Other base baskets cannot also count.");continue;}
    const match = matchMinor(c, p);
    if (!match) {reject("not matched to the published minor basket. Confirm the current course / basket before placement.");continue;}
    if (match.approval && !p.approved) {reject("department approval / topic relevance must be confirmed before this course can count.");continue;}
    const kind = courseKind(c);
    if (kind === "online" && ["cse", "data_analytics"].includes(p.minorId) && c.onlineProvider !== "swayam_nptel") {reject("only approved Swayam-NPTEL online courses can count for this minor.");continue;}
    const identity = `${p.minorId}:${match.identity ?? c.code}`;
    if (identities.has(identity)) {reject("this requirement was already counted under another code / title.");continue;}
    const q = quota.get(p.minorId) ?? {projects: 0, projectCredits: 0, online: 0, optional: 0, optionalCredits: 0};
    const project = kind === "project", special = match.category === "special";
    if (project && detailed.has(p.minorId) && p.minorId !== "robotics" && q.projects >= 1) {reject("at most one project course may count for this minor.");continue;}
    if (p.minorId === "computational_mechanics" && match.category === "optional" && q.optional >= 3) {reject("at most three optional-basket courses may count.");continue;}
    if (isShared && shared.size >= 2) {reject("the two-course Open Elective sharing allowance is already used across your minors. Move this course to Additional learning if appropriate.");continue;}
    let credits = c.credits;
    if (p.minorId === "computational_mechanics" && match.category === "optional") credits = Math.min(credits, Math.max(0, 12 - q.optionalCredits));
    if (p.minorId === "robotics" && (project || special)) credits = Math.min(credits, Math.max(0, 8 - q.projectCredits));
    if (p.minorId === "data_analytics" && project) credits = Math.min(credits, 4);
    if (p.minorId === "data_analytics" && kind === "online") credits = Math.min(credits, Math.max(0, 4 - q.online));
    const sharedBase = isShared ? base.counted.find((entry) => courseKey(entry.course) === courseKey(c) && entry.basket === "open_elective")?.credits ?? 0 : 0;
    if (isShared) {
      if (sharedBase < c.credits) {reject("the full Open Elective course was not placed in the base audit. Choose minor-only placement instead.");continue;}
      if (sharedEntries.reduce((sum,e) => sum+e.credits,0)+c.credits > base.progress.find((entry) => entry.id === "open_elective")!.completed) {reject("the shared courses exceed the placed Open Elective credits. Choose minor-only placement instead.");continue;}
    }
    if (project && !isShared) credits = Math.min(credits, Math.max(0, 16 - projectCredits));
    // Do not consume a shared course, project or optional-course allowance for
    // a course whose contribution is zero.
    if (credits <= 0) {reject("no credit allowance remains for this course type.");continue;}
    if (credits < c.credits) reject(`${credits} of ${c.credits} credits count after applying the project / online / basket limits.`);
    identities.add(identity);
    if (project) {q.projects++; if (!isShared) projectCredits += credits;}
    if (project || special) q.projectCredits += credits;
    if (kind === "online") q.online += credits;
    if (match.category === "optional") {q.optional++; q.optionalCredits += credits;}
    quota.set(p.minorId,q);
    if (isShared) {shared.add(c.code);sharedEntries.push({course:c,credits:c.credits});r.shared += credits;}
    else {r.additional += credits;additionalCredits += credits;}
    r.entries.push({course:c, credits, shared:isShared, category:match.category, identity});
  }
  for (const r of results) {
    const entries = r.entries;
    const sum = (category: Category) => entries.filter((e) => e.category === category).reduce((n,e) => n+e.credits,0);
    const count = (category: Category, minCredits=0) => entries.filter((e) => e.category === category && e.credits >= minCredits).length;
    const check = (name: string, completed: number, required: number, unit: MinorCheck["unit"]="courses") => r.checks.push({name,completed,required,unit});
    if (r.id === "biomedical") check("Listed Biomedical basket",sum("listed"),16,"credits");
    if (r.id === "data_analytics") check("Listed Data Analytics basket",sum("listed"),12,"credits");
    if (r.id === "computational_mechanics") {check("Numerical Methods for Engineers",count("mandatory",4),1);check("ES 622 or ME 605",count("core",4),1);}
    if (r.id === "icdt") {check("Additional ICDT core courses (4 credits each)",count("core",4),2);check("Approved Circuits elective",count("circuits"),1);check("Approved Materials & Devices elective",count("devices"),1);}
    if (r.id === "quantum") {
      check("PH 202",entries.some((e) => e.category === "mandatory" && e.course.code === "PH 202")?1:0,1);
      check("Quantum Technologies - Applications",entries.some((e) => e.identity.endsWith(":quantum-applications"))?1:0,1);
      check("Quantum elective basket courses",count("listed"),2);
    }
    if (r.id === "robotics") check("ME 639 or ES 408",entries.filter((e) => e.category === "listed" && ["ME 639","ES 408"].includes(e.course.code)).length,1);
    if (r.id === "sustainable") check("Different thematic areas",new Set(entries.map((e) => themes[e.course.code]).filter(Boolean)).size,2,"themes");
    if (r.id === "ai" || r.id === "cse") {
      const waived = r.id === "cse" && base.programmeId === "ai";
      if (!waived) check(r.id === "ai" ? "CS 303 (4 credits)" : "ES 242 (4 credits)",count("mandatory",4),1);
      check("Additional core courses (4 credits each)",count("core",4),2);
      check(waived ? "Further courses (ES 242 waived for AI majors)" : "Further eligible courses",Math.max(0,entries.length-(waived?0:1)-2),2);
    }
    r.completed = Math.min(20,entries.reduce((n,e) => n+e.credits,0));
    r.remaining = 20-r.completed;
    r.status = !r.detailed ? "Department review required" : r.remaining===0 && r.checks.every((c) => c.completed>=c.required) && r.issues.length===0 ? "Tracked rules met" : "In progress";
    if (!minorAllowed(r.id,base.programmeId)) r.issues.push("Choose a minor outside your own major.");
  }
  return {results,sharedCourses:shared.size,sharedCredits:sharedEntries.reduce((n,e) => n+e.credits,0),additionalCredits,projectCredits,
    issues: results.flatMap((r) => r.issues.map((issue) => `${r.name}: ${issue}`))};
}
