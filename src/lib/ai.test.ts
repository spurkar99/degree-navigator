import { describe, expect, it } from "vitest";
import { auditCourses, autoClassify, courseKey, courseReviewReason, resolveBasket } from "./audit";
import { buildAuditWorkbook, buildInputTemplateWorkbook } from "./excel";
import { parseAll, type Course } from "./parser";
import { AI_CSE_BASKET, AI_DETAILS, AI_ELECTIVES, PROGRAMMES } from "./rules";
import { AI_SAMPLE_TRANSCRIPT } from "./sample";
import { buildSuggestions } from "./suggestions";

const course = (code: string, credits = 4, kind?: Course["kind"], title = code): Course => ({ semester: 5, code, title, credits, kind });
const progress = (audit: ReturnType<typeof auditCourses>, id: string) => audit.progress.find((item) => item.id === id)!;

describe("Artificial Intelligence 2024–28", () => {
  it("requires 172 credits, including eleven core courses and twenty electives", () => {
    const p = PROGRAMMES.ai;
    expect(p.totalRequired).toBe(172);
    expect(p.requirements.reduce((sum, item) => sum + item.required, 0)).toBe(172);
    expect(p.core.size).toBe(11);
    expect(Object.values(AI_DETAILS).reduce((sum, item) => sum + item.credits, 0)).toBe(44);
    const audit = auditCourses([], {}, "ai");
    expect(progress(audit, "ai_cse").required).toBe(4);
    expect(progress(audit, "ai_elective").required).toBe(16);
  });

  it("classifies all AI core courses without treating them as CSE electives", () => {
    for (const [code, details] of Object.entries(AI_DETAILS)) expect(autoClassify(course(code, 4, undefined, details.title), "ai")).toBe("ai_core");
    expect(autoClassify(course("ES 335"), "cse")).toBe("cse_elective");
    expect(autoClassify(course("CS 328"), "cse")).toBe("cse_theory");
    expect(autoClassify(course("CS 303"), "chemical")).toBeNull();
  });

  it("recognizes the specified AI CSE basket and the listed AI electives", () => {
    const titles: Record<string, string> = { "CS 301": "Operating Systems", "CS 432": "Databases", "CS 433": "Computer Networks" };
    for (const code of AI_CSE_BASKET) expect(autoClassify(course(code, 4, undefined, titles[code] ?? code), "ai")).toBe("ai_cse");
    for (const code of AI_ELECTIVES) expect(autoClassify(course(code), "ai")).toBe("ai_elective");
    expect(autoClassify(course("CS 999"), "ai")).toBeNull();
  });

  it("does not silently equate conflicting course codes from the two advisory sections", () => {
    const databases = course("CS 433", 4, undefined, "Databases");
    expect(courseReviewReason(databases, "ai")).toContain("Computer Networks");
    expect(autoClassify(databases, "ai")).toBeNull();
    expect(resolveBasket(databases, {}, "ai")).toBe("unresolved");
    expect(autoClassify(databases, "cse")).toBe("cse_systems");
    expect(autoClassify(course("CS 330", 4, undefined, "Operating Systems"), "ai")).toBeNull();
    expect(resolveBasket(databases, { [courseKey(databases)]: "ai_cse" }, "ai")).toBe("ai_cse");
  });

  it("keeps classifications from another major out of the AI audit", () => {
    const c = course("CS 201");
    expect(resolveBasket(c, { [courseKey(c)]: "cse_core" }, "ai")).toBe("unresolved");
  });

  it("reproduces the four-semester AI sample at 100 out of 172 credits", () => {
    const parsed = parseAll(AI_SAMPLE_TRANSCRIPT);
    expect(parsed.warnings).toEqual([]);
    const audit = auditCourses(parsed.courses, {}, "ai");
    expect(audit.allocated).toBe(100);
    expect(audit.remaining).toBe(72);
    expect(audit.unresolved).toEqual([]);
    expect(progress(audit, "ai_core").completed).toBe(24);
    expect(audit.missingGroups.find((group) => group.id === "core")?.courses).toHaveLength(5);
    expect(audit.pe).toBe(4);
    expect(audit.viva).toBe(4);
    expect(audit.checks.every((check) => check.remaining === 0)).toBe(true);
  });

  it("counts surplus CSE basket credits toward the other AI electives once", () => {
    const history = ["ES 214", "CS 327", "CS 613", "ES 615", "ES 645"].map((code) => course(code));
    const audit = auditCourses(history, {}, "ai");
    expect(progress(audit, "ai_cse").completed).toBe(4);
    expect(progress(audit, "ai_elective").completed).toBe(16);
    expect(audit.allocated).toBe(20);
  });

  it("does not let general AI electives replace the four-credit CSE minimum", () => {
    const history = ["CS 613", "ES 615", "ES 645", "ES 659", "ES 661"].map((code) => course(code));
    const audit = auditCourses(history, {}, "ai");
    expect(progress(audit, "ai_cse").remaining).toBe(4);
    expect(audit.allocated).toBe(16);
    expect(buildSuggestions(audit, 4).some((item) => item.title.includes("AI CSE Basket"))).toBe(true);
  });

  it("shares one eight-credit discipline-elective cap across online courses and CS projects", () => {
    const audit = auditCourses([course("CS 299"), course("CS 399"), course("CS 613", 4, "online")], {}, "ai");
    expect(audit.limitedElectiveSubmitted).toBe(12);
    expect(audit.limitedElectiveCredits).toBe(8);
    expect(audit.limitedElectiveUnplaced).toBe(4);
    expect(audit.allocated).toBe(8);
    expect(buildSuggestions(audit, 4).some((item) => item.title.includes("AI online / project"))).toBe(true);
  });

  it("applies the elective cap before CSE-basket surplus is allocated", () => {
    const audit = auditCourses([course("CS 327", 4, "online"), course("EE 323", 4, "online"), course("ES 214", 4, "online")], {}, "ai");
    expect(progress(audit, "ai_cse").completed).toBe(4);
    expect(progress(audit, "ai_elective").completed).toBe(4);
    expect(audit.allocated).toBe(8);
    expect(audit.limitedElectiveUnplaced).toBe(4);
  });

  it("keeps the open project separate from the AI elective cap", () => {
    const project = course("CS 299");
    const audit = auditCourses([project, course("CS 399"), course("CS 499"), course("CS 613", 4, "online")], { [courseKey(project)]: "open_project" }, "ai");
    expect(progress(audit, "open_project").completed).toBe(4);
    expect(audit.limitedElectiveCredits).toBe(8);
    expect(audit.allocated).toBe(12);
  });

  it("requires missing AI core courses even if enough raw core credits were submitted", () => {
    const core = course("CS 303");
    const audit = auditCourses([core], { [courseKey(core)]: "open_elective" }, "ai");
    expect(audit.missingGroups.find((group) => group.id === "core")?.courses.some((item) => item.code === "CS 303")).toBe(true);
  });

  it("completes a full 172-credit AI degree without double-counting the CSE basket", () => {
    const programme = PROGRAMMES.ai;
    const history = programme.fixedGroups.flatMap((group) => group.codes.map((code) => ({ ...course(code, programme.details[code].credits), title: programme.details[code].title })));
    history.push(course("GE 101", 2), course("GE 201", 2), course("MS 408"), course("MS 491-XVI"),
      course("PH 201"), course("EH 612"), course("CH 203"), course("MA 205", 2), course("CS 399"),
      ...["ME 501", "ME 502", "CL 601", "EE 605", "ES 214", "CS 613", "ES 615", "ES 645", "ES 659"].map((code) => course(code)));
    for (let semester = 1; semester <= 8; semester++) {
      history.push({ ...course(`IN 10${semester}`, 0), semester });
      if (semester <= 4) history.push({ ...course(`PE 10${semester}`, 0), semester });
    }
    const choices = Object.fromEntries(history.filter((item) => ["ME 501", "ME 502", "CL 601", "EE 605", "CS 399"].includes(item.code))
      .map((item) => [courseKey(item), item.code === "CS 399" ? "open_project" as const : "open_elective" as const]));
    const audit = auditCourses(history, choices, "ai");
    expect(audit.allocated).toBe(172);
    expect(audit.remaining).toBe(0);
    expect(audit.missingGroups).toEqual([]);
    expect(buildSuggestions(audit, 8).map((item) => item.priority)).toEqual(["Complete"]);
  });

  it("exports a single-sheet AI plan and blank template with the correct credit total", async () => {
    const courses = parseAll(AI_SAMPLE_TRANSCRIPT).courses;
    const audit = auditCourses(courses, {}, "ai");
    const workbook = buildAuditWorkbook({currentSemester: 5}, courses, {}, audit, buildSuggestions(audit, 4));
    expect(workbook.worksheets).toHaveLength(1);
    const sheet = workbook.worksheets[0];
    expect(sheet.getCell("A5").result).toBe(172);
    expect(sheet.getCell("H5").result).toBe(100);
    expect(sheet.getCell("O5").result).toBe(72);
    expect(workbook.subject).toContain("Artificial Intelligence");
    expect(JSON.stringify(workbook.model)).toContain("AI CSE Basket");
    expect(JSON.stringify(workbook.model)).not.toContain("CSE Theory & Algorithms");
    expect(sheet.pageSetup.fitToHeight).toBe(1);
    const blank = buildInputTemplateWorkbook("ai");
    expect(blank.worksheets).toHaveLength(1);
    expect(blank.worksheets[0].getCell("A5").result).toBe(172);
    expect((await workbook.xlsx.writeBuffer()).byteLength).toBeGreaterThan(8_000);
  });
});
