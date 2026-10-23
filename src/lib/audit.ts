import {
  CSE_ELECTIVES, CSE_LIMITED_ELECTIVE_CAP, CSE_SYSTEMS, CSE_THEORY,
  HSS_MANDATORY, INSTITUTE, KNOWN_CHEMICAL_ELECTIVES, MATHEMATICS, SCIENCE,
  getProgramme, type BasketId, type ProgrammeId,
} from "./rules";
import type { Course } from "./parser";

export type Classifications = Record<string, BasketId>;
export const courseKey = (course: Course) => `${course.semester}:${course.code}`;
export function courseKind(course: Course): NonNullable<Course["kind"]> {
  // A known independent CS project cannot bypass the cap by selecting Regular.
  if (/^CS (299|399|499)$/.test(course.code)) return "project";
  return course.kind ?? "regular";
}

export function autoClassify(course: Course, programmeId: ProgrammeId = "chemical"): BasketId | null {
  const programme = getProgramme(programmeId);
  if (course.code.startsWith("SC ")) return "excluded";
  if (course.code === "FP 100") return "foundation";
  if (course.code.startsWith("PE ") || course.code.startsWith("IN ")) return "excluded";
  if (INSTITUTE.has(course.code)) return "institute";
  if (MATHEMATICS.has(course.code)) return "mathematics";
  if (HSS_MANDATORY.has(course.code) || /^(GE|HS|MS) /.test(course.code)) return "hss";
  if (SCIENCE.has(course.code)) return "science";
  if (programme.core.has(course.code)) return programmeId === "cse" ? "cse_core" : "chemical_core";
  if (programmeId === "chemical" && KNOWN_CHEMICAL_ELECTIVES.has(course.code)) return "chemical_elective";
  if (programmeId === "cse") {
    if (CSE_THEORY.has(course.code)) return "cse_theory";
    if (CSE_SYSTEMS.has(course.code)) return "cse_systems";
    // The advisory permits all CS electives. Unlisted non-CS courses need review.
    if (CSE_ELECTIVES.has(course.code) || course.code.startsWith("CS ")) return "cse_elective";
  }
  return null;
}

export function ambiguousCourses(courses: Course[], programmeId: ProgrammeId = "chemical") {
  return courses.filter((course) => autoClassify(course, programmeId) === null);
}

export function resolveBasket(course: Course, choices: Classifications, programmeId: ProgrammeId = "chemical"): BasketId {
  const basket = choices[courseKey(course)] ?? autoClassify(course, programmeId) ?? "unresolved";
  return getProgramme(programmeId).optionIds.includes(basket) ? basket : "unresolved";
}

export function classificationSource(course: Course, choices: Classifications, programmeId: ProgrammeId = "chemical") {
  if (resolveBasket(course, choices, programmeId) === "unresolved") return "Needs review";
  return choices[courseKey(course)] ? "Student selected" : "Rule matched";
}

export function auditCourses(courses: Course[], choices: Classifications, programmeId: ProgrammeId = "chemical") {
  const programme = getProgramme(programmeId);
  const totals = Object.fromEntries(programme.requirements.map((item) => [item.id, 0])) as Record<BasketId, number>;
  const unresolved: Course[] = [];
  const excluded: Course[] = [];
  const limitedCourses: { course: Course; eligible: number; notPlaced: number }[] = [];
  let limitedElectiveCredits = 0;
  let limitedElectiveSubmitted = 0;
  const counted: { course: Course; basket: BasketId; credits: number }[] = [];
  const seen = new Set<string>();
  const duplicateCourses: Course[] = [];

  courses.slice().sort((a, b) => a.semester - b.semester || a.code.localeCompare(b.code)).forEach((course) => {
    if (seen.has(course.code)) { duplicateCourses.push(course); return; }
    seen.add(course.code);
    const basket = resolveBasket(course, choices, programmeId);
    if (basket === "unresolved") { unresolved.push(course); return; }
    if (basket === "excluded") { excluded.push(course); return; }
    let credits = course.credits;
    const cseElective = ["cse_theory", "cse_systems", "cse_elective"].includes(basket);
    if (programmeId === "cse" && cseElective && courseKind(course) !== "regular") {
      limitedElectiveSubmitted += credits;
      const eligible = Math.min(credits, Math.max(0, CSE_LIMITED_ELECTIVE_CAP - limitedElectiveCredits));
      limitedElectiveCredits += eligible;
      limitedCourses.push({ course, eligible, notPlaced: credits - eligible });
      credits = eligible;
    }
    totals[basket] += credits;
    counted.push({ course, basket, credits });
  });

  // Minimum baskets, not ceilings. Surplus can meet the remaining 26 elective
  // credits, but cannot fill the other minimum basket or count twice.
  if (programmeId === "cse") {
    totals.cse_elective += Math.max(0, totals.cse_theory - 8) + Math.max(0, totals.cse_systems - 8);
  }
  const progress = programme.requirements.map((requirement) => {
    const completed = Math.min(totals[requirement.id], requirement.required);
    return { ...requirement, completed, remaining: requirement.required - completed };
  });
  const missingGroups = programme.fixedGroups.map((group) => ({
    ...group,
    courses: group.codes.filter((code) => !counted.some((entry) =>
      entry.course.code === code && entry.basket === (group.id === "core"
        ? programmeId === "cse" ? "cse_core" : "chemical_core" : group.id)
      && entry.credits >= programme.details[code].credits,
    )).map((code) => ({ code, ...programme.details[code] })),
  })).filter((group) => group.courses.length);

  const codes = new Set(courses.map((course) => course.code));
  const sum = (predicate: (entry: typeof counted[number]) => boolean) => counted.filter(predicate).reduce((n, entry) => n + entry.credits, 0);
  const checks = [
    { id: "ge", name: "General Education within HSS", required: 4, completed: sum((e) => e.basket === "hss" && e.course.code.startsWith("GE ")) },
    { id: "science_basket", name: "Science basket within Science / BS", required: 8, completed: sum((e) => e.basket === "science" && SCIENCE.has(e.course.code)) },
    { id: "math_basket", name: "Mathematics basket", required: 2, completed: sum((e) => e.basket === "mathematics" && ["MA 204", "MA 205", "MA 206"].includes(e.course.code)) },
  ].map((check) => ({ ...check, remaining: Math.max(0, check.required - check.completed) }));
  const allocated = progress.reduce((total, item) => total + item.completed, 0);
  return {
    programmeId, programme, totalRequired: programme.totalRequired, progress, totals, allocated,
    remaining: programme.totalRequired - allocated,
    pending: unresolved.reduce((sum, course) => sum + course.credits, 0), unresolved,
    excludedCredits: excluded.reduce((sum, course) => sum + course.credits, 0), missingGroups,
    pe: ["PE 101", "PE 102", "PE 103", "PE 104"].filter((code) => codes.has(code)).length,
    viva: new Set(courses.filter((course) => /^IN 1\d{2}$/.test(course.code)).map((course) => course.semester)).size,
    checks, duplicateCourses, limitedCourses, limitedElectiveCredits, limitedElectiveSubmitted,
    limitedElectiveUnplaced: limitedElectiveSubmitted - limitedElectiveCredits,
  };
}
