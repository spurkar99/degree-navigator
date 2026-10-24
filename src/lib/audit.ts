import {
  AI_AMBIGUOUS_BASKET_CODES, AI_CSE_BASKET, AI_ELECTIVES,
  CSE_ELECTIVES, CSE_SYSTEMS, CSE_THEORY, CIVIL_DESIGN,
  HSS_MANDATORY, INSTITUTE, KNOWN_CHEMICAL_ELECTIVES, MATHEMATICS, SCIENCE,
  getProgramme, type BasketId, type ProgrammeId,
} from "./rules";
import type { Course } from "./parser";

export type Classifications = Record<string, BasketId>;
export const courseKey = (course: Course) => `${course.semester}:${course.code}`;
export function courseKind(course: Course): NonNullable<Course["kind"]> {
  // Known independent project codes cannot bypass limits by selecting Regular.
  if (/^[A-Z]{2,3} (299|399|499)$/.test(course.code)) return "project";
  return course.kind ?? "regular";
}

const normalizedTitle = (title: string) => title.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "");
export function matchCoreRequirement(course: Course, programmeId: ProgrammeId): string | undefined {
  const programme = getProgramme(programmeId);
  if (programme.core.has(course.code) && !programme.details[course.code].codePending) return course.code;
  return [...programme.core].find((key) => programme.details[key].codePending &&
    [programme.details[key].title, ...(programme.coreTitleAliases?.[key] ?? [])]
      .some((title) => normalizedTitle(title) === normalizedTitle(course.title)));
}
function matchesScienceRule(course: Course, programmeId: ProgrammeId) {
  const rule = getProgramme(programmeId).scienceRule;
  return !!rule && (rule.codes.includes(course.code) || (rule.titles?.some((title) => normalizedTitle(title) === normalizedTitle(course.title)) ?? false));
}
export function electiveCapLabel(programmeId: ProgrammeId) {
  return getProgramme(programmeId).capLabel ?? "Online + CS project discipline-elective credits";
}

export function courseReviewReason(course: Course, programmeId: ProgrammeId): string | null {
  if (programmeId !== "ai") return null;
  const ambiguous = AI_AMBIGUOUS_BASKET_CODES[course.code];
  if (ambiguous && !ambiguous.matches.test(course.title)) {
    return `The AI advisory lists ${course.code} as ${ambiguous.title}. The submitted title differs. Confirm the current code and approved basket before choosing its category.`;
  }
  return null;
}

export function autoClassify(course: Course, programmeId: ProgrammeId = "chemical"): BasketId | null {
  const programme = getProgramme(programmeId);
  if (courseReviewReason(course, programmeId)) return null;
  if (course.code.startsWith("SC ")) return "excluded";
  if (course.code === "FP 100") return "foundation";
  if (course.code.startsWith("PE ") || course.code.startsWith("IN ")) return "excluded";
  if (INSTITUTE.has(course.code)) return "institute";
  if (MATHEMATICS.has(course.code)) return "mathematics";
  if (HSS_MANDATORY.has(course.code) || /^(GE|HS|MS) /.test(course.code)) return "hss";
  if (matchCoreRequirement(course, programmeId)) return programme.coreBasket;
  if (SCIENCE.has(course.code) || matchesScienceRule(course, programmeId)) return "science";
  if (programmeId === "chemical" && KNOWN_CHEMICAL_ELECTIVES.has(course.code)) return "chemical_elective";
  if (programmeId === "cse") {
    if (CSE_THEORY.has(course.code)) return "cse_theory";
    if (CSE_SYSTEMS.has(course.code)) return "cse_systems";
    // The advisory permits all CS electives. Unlisted non-CS courses need review.
    if (CSE_ELECTIVES.has(course.code) || course.code.startsWith("CS ")) return "cse_elective";
  }
  if (programmeId === "ai") {
    if (AI_CSE_BASKET.has(course.code)) return "ai_cse";
    if (AI_ELECTIVES.has(course.code) || /^CS (299|399|499)$/.test(course.code)) return "ai_elective";
  }
  if (programmeId === "civil" && CIVIL_DESIGN.has(course.code)) return "civil_design";
  if (programme.electives?.has(course.code) || (programme.electivePrefix && course.code.startsWith(`${programme.electivePrefix} `))) return "discipline_elective";
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
  const prohibitedElectives: Course[] = [];
  const projectLimitedCourses: { course: Course; notPlaced: number }[] = [];
  let projectCredits = 0;
  let limitedElectiveCredits = 0;
  let limitedElectiveSubmitted = 0;
  const counted: { course: Course; basket: BasketId; credits: number }[] = [];
  const seen = new Set<string>();
  const seenCore = new Set<string>();
  const duplicateCourses: Course[] = [];

  courses.slice().sort((a, b) => a.semester - b.semester || a.code.localeCompare(b.code)).forEach((course) => {
    if (seen.has(course.code)) { duplicateCourses.push(course); return; }
    seen.add(course.code);
    const basket = resolveBasket(course, choices, programmeId);
    if (basket === "unresolved") { unresolved.push(course); return; }
    if (basket === "excluded") { excluded.push(course); return; }
    const coreKey = basket === programme.coreBasket ? matchCoreRequirement(course, programmeId) : undefined;
    if (coreKey && seenCore.has(coreKey)) { duplicateCourses.push(course); return; }
    if (coreKey) seenCore.add(coreKey);
    let credits = course.credits;
    const cappedElective = programme.cappedElectiveBaskets?.includes(basket);
    const kind = courseKind(course);
    if (cappedElective && programme.prohibitedElectiveKinds?.includes(kind as "online" | "project")) {
      prohibitedElectives.push(course);
      return;
    }
    if (cappedElective && programme.disciplineElectiveCap !== undefined && (programme.limitedKinds ?? ["online", "project"]).includes(kind as "online" | "project")) {
      limitedElectiveSubmitted += credits;
      const eligible = Math.min(credits, Math.max(0, programme.disciplineElectiveCap - limitedElectiveCredits));
      limitedElectiveCredits += eligible;
      limitedCourses.push({ course, eligible, notPlaced: credits - eligible });
      credits = eligible;
    }
    if (kind === "project") {
      // Only credits which can fill a requirement use the overall project quota.
      // An 8-credit project placed in the 4-credit Open Project bucket uses four.
      let room = Math.max(0, (programme.requirements.find((r) => r.id === basket)?.required ?? 0) - totals[basket]);
      if (programmeId === "cse" && ["cse_theory", "cse_systems", "cse_elective"].includes(basket)) {
        const otherRoom = Math.max(0, 10 - totals.cse_elective - Math.max(0, totals.cse_theory - 8) - Math.max(0, totals.cse_systems - 8));
        room = basket === "cse_elective" ? otherRoom : room + otherRoom;
      }
      if (programmeId === "ai" && ["ai_cse", "ai_elective"].includes(basket)) {
        const otherRoom = Math.max(0, 16 - totals.ai_elective - Math.max(0, totals.ai_cse - 4));
        room = basket === "ai_elective" ? otherRoom : room + otherRoom;
      }
      const candidate = Math.min(credits, room);
      const eligible = Math.min(candidate, Math.max(0, 16 - projectCredits));
      if (eligible < candidate) projectLimitedCourses.push({ course, notPlaced: candidate - eligible });
      projectCredits += eligible;
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
  if (programmeId === "ai") totals.ai_elective += Math.max(0, totals.ai_cse - 4);
  const progress = programme.requirements.map((requirement) => {
    const completed = Math.min(totals[requirement.id], requirement.required);
    return { ...requirement, completed, remaining: requirement.required - completed };
  });
  const missingGroups = programme.fixedGroups.map((group) => ({
    ...group,
    courses: group.codes.filter((code) => !counted.some((entry) =>
      (group.id === "core" ? matchCoreRequirement(entry.course, programmeId) === code : entry.course.code === code)
      && entry.basket === (group.id === "core" ? programme.coreBasket : group.id)
      && entry.credits >= programme.details[code].credits,
    )).map((code) => ({ code: programme.details[code].codePending ? "Code pending" : code, ...programme.details[code] })),
  })).filter((group) => group.courses.length);

  const codes = new Set(courses.map((course) => course.code));
  const sum = (predicate: (entry: typeof counted[number]) => boolean) => counted.filter(predicate).reduce((n, entry) => n + entry.credits, 0);
  const checks = [
    { id: "ge", name: "General Education within HSS", required: 4, completed: sum((e) => e.basket === "hss" && e.course.code.startsWith("GE ")) },
    { id: "science_basket", name: "Science basket within Science / BS", required: 8, completed: sum((e) => e.basket === "science" && (SCIENCE.has(e.course.code) || matchesScienceRule(e.course, programmeId))) },
    { id: "math_basket", name: "Mathematics basket", required: 2, completed: sum((e) => e.basket === "mathematics" && ["MA 204", "MA 205", "MA 206"].includes(e.course.code)) },
    ...(programme.scienceRule ? [{ id: "discipline_science", name: programme.scienceRule.name, required: 4,
      completed: Math.min(4, Math.max(0, ...counted.filter((e) => e.basket === "science" && matchesScienceRule(e.course, programmeId)).map((e) => e.credits))) }] : []),
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
    prohibitedElectives, prohibitedElectiveCredits: prohibitedElectives.reduce((sum, course) => sum + course.credits, 0),
    projectCredits, projectLimitedCourses, projectLimitUnplaced: projectLimitedCourses.reduce((sum, entry) => sum + entry.notPlaced, 0),
  };
}
