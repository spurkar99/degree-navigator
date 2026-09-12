import {
  CHEMICAL_CORE,
  DETAILS,
  FIXED_GROUPS,
  HSS_MANDATORY,
  INSTITUTE,
  KNOWN_CHEMICAL_ELECTIVES,
  MATHEMATICS,
  REQUIREMENTS,
  SCIENCE,
  TOTAL_REQUIRED,
  type BasketId,
} from "./rules";
import type { Course } from "./parser";

export type Classifications = Record<string, BasketId>;
export const courseKey = (course: Course) => `${course.semester}:${course.code}`;

export function autoClassify(course: Course): BasketId | null {
  if (course.code.startsWith("SC ")) return "excluded";
  if (course.code === "FP 100") return "foundation";
  if (course.code.startsWith("PE ") || course.code.startsWith("IN ")) return "excluded";
  if (INSTITUTE.has(course.code)) return "institute";
  if (MATHEMATICS.has(course.code)) return "mathematics";
  if (
    HSS_MANDATORY.has(course.code) ||
    course.code.startsWith("GE ") ||
    course.code.startsWith("HS ") ||
    course.code.startsWith("MS ")
  ) return "hss";
  if (SCIENCE.has(course.code)) return "science";
  if (CHEMICAL_CORE.has(course.code)) return "chemical_core";
  if (KNOWN_CHEMICAL_ELECTIVES.has(course.code)) return "chemical_elective";
  return null;
}

export function ambiguousCourses(courses: Course[]) {
  return courses.filter((course) => autoClassify(course) === null);
}

export function resolveBasket(course: Course, choices: Classifications): BasketId {
  return choices[courseKey(course)] ?? autoClassify(course) ?? "unresolved";
}

export function classificationSource(course: Course, choices: Classifications) {
  return choices[courseKey(course)] ? "Student selected" : autoClassify(course) ? "Rule matched" : "Needs review";
}

export function auditCourses(courses: Course[], choices: Classifications) {
  const totals = Object.fromEntries(REQUIREMENTS.map((item) => [item.id, 0])) as Record<
    (typeof REQUIREMENTS)[number]["id"],
    number
  >;
  const unresolved: Course[] = [];
  const excluded: Course[] = [];

  courses.forEach((course) => {
    const basket = resolveBasket(course, choices);
    if (!basket || basket === "unresolved") {
      unresolved.push(course);
    } else if (basket === "excluded") {
      excluded.push(course);
    } else {
      totals[basket] += course.credits;
    }
  });

  const progress = REQUIREMENTS.map((requirement) => {
    const completed = Math.min(totals[requirement.id], requirement.required);
    return {
      ...requirement,
      completed,
      remaining: requirement.required - completed,
    };
  });

  const codes = new Set(courses.map((course) => course.code));
  const missingGroups = FIXED_GROUPS.map((group) => ({
    ...group,
    courses: group.codes
      .filter((code) => !codes.has(code))
      .map((code) => ({ code, ...DETAILS[code] })),
  })).filter((group) => group.courses.length);

  const allocated = progress.reduce((sum, item) => sum + item.completed, 0);
  return {
    progress,
    totals,
    allocated,
    remaining: TOTAL_REQUIRED - allocated,
    pending: unresolved.reduce((sum, course) => sum + course.credits, 0),
    unresolved,
    excludedCredits: excluded.reduce((sum, course) => sum + course.credits, 0),
    missingGroups,
    pe: ["PE 101", "PE 102", "PE 103", "PE 104"].filter((code) => codes.has(code)).length,
    viva: courses.filter((course) => /^IN 1\d{2}$/.test(course.code)).length,
  };
}
