import { describe, expect, it } from "vitest";
import { auditCourses, autoClassify, courseKey, courseKind, resolveBasket } from "./audit";
import { buildAuditWorkbook, buildInputTemplateWorkbook } from "./excel";
import { parseAll, type Course } from "./parser";
import { CSE_DETAILS, PROGRAMMES } from "./rules";
import { CSE_SAMPLE_TRANSCRIPT } from "./sample";
import { buildSuggestions } from "./suggestions";

const course = (code: string, credits = 4, kind?: Course["kind"]): Course => ({ semester: 5, code, title: code, credits, kind });
const progress = (audit: ReturnType<typeof auditCourses>, id: string) => audit.progress.find((item) => item.id === id)!;

describe("Computer Science and Engineering 2024–28", () => {
  it("uses each major's own credit distribution", () => {
    for (const programme of Object.values(PROGRAMMES)) {
      expect(programme.requirements.reduce((sum, item) => sum + item.required, 0)).toBe(programme.totalRequired);
    }
    expect(PROGRAMMES.cse.core.size).toBe(9);
    expect(Object.values(CSE_DETAILS).reduce((sum, item) => sum + item.credits, 0)).toBe(36);
  });

  it("classifies CSE cores, both baskets, general CS and listed non-CS electives", () => {
    for (const code of PROGRAMMES.cse.core) expect(autoClassify(course(code), "cse")).toBe("cse_core");
    expect(autoClassify(course("ES 301"), "cse")).toBe("cse_theory");
    expect(autoClassify(course("CS 433"), "cse")).toBe("cse_systems");
    expect(autoClassify(course("ES 335"), "cse")).toBe("cse_elective");
    expect(autoClassify(course("CS 613"), "cse")).toBe("cse_elective");
    expect(autoClassify(course("ES 999"), "cse")).toBeNull();
  });

  it("keeps Chemical Engineering and CSE classifications separate", () => {
    expect(autoClassify(course("CS 201"), "chemical")).toBeNull();
    expect(autoClassify(course("CL 201"), "cse")).toBeNull();
    expect(resolveBasket(course("CL 201"), { [courseKey(course("CL 201"))]: "chemical_core" }, "cse")).toBe("unresolved");
  });

  it("reproduces the CSE four-semester example with 100 eligible credits", () => {
    const parsed = parseAll(CSE_SAMPLE_TRANSCRIPT);
    expect(parsed.warnings).toEqual([]);
    const audit = auditCourses(parsed.courses, {}, "cse");
    expect(audit.allocated).toBe(100);
    expect(audit.remaining).toBe(70);
    expect(audit.pending).toBe(0);
    expect(progress(audit, "cse_core").completed).toBe(16);
    expect(progress(audit, "cse_theory").completed).toBe(4);
    expect(progress(audit, "cse_systems").completed).toBe(4);
    expect(audit.checks.every((check) => check.remaining === 0)).toBe(true);
    expect(audit.pe).toBe(4);
    expect(audit.viva).toBe(4);
    expect(audit.missingGroups.find((group) => group.id === "core")?.courses).toHaveLength(5);
  });

  it("counts surplus theory and systems credits toward the other electives once", () => {
    const history = ["ES 301", "CS 614", "CS 617", "CS 327", "CS 332", "CS 431", "ES 335"].map((code) => course(code));
    const audit = auditCourses(history, {}, "cse");
    expect(progress(audit, "cse_theory").completed).toBe(8);
    expect(progress(audit, "cse_systems").completed).toBe(8);
    expect(progress(audit, "cse_elective").completed).toBe(10);
    expect(audit.allocated).toBe(26);
  });

  it("does not let surplus theory or general electives satisfy Systems", () => {
    const audit = auditCourses(["ES 301", "CS 614", "CS 617", "CS 328", "ES 335", "CS 613", "ES 404"].map((code) => course(code)), {}, "cse");
    expect(progress(audit, "cse_systems").remaining).toBe(8);
    expect(audit.allocated).toBe(18);
  });

  it("shares one eight-credit cap across online and CS project electives", () => {
    const audit = auditCourses([course("CS 299"), course("CS 399"), course("CS 613", 4, "online")], {}, "cse");
    expect(audit.limitedElectiveSubmitted).toBe(12);
    expect(audit.limitedElectiveCredits).toBe(8);
    expect(audit.limitedElectiveUnplaced).toBe(4);
    expect(audit.allocated).toBe(8);
    expect(buildSuggestions(audit, 4).some((item) => item.title.includes("online / project"))).toBe(true);
    expect(courseKind(course("CS 299", 4, "regular"))).toBe("project");
  });

  it("applies the online cap before basket minimums and surplus allocation", () => {
    const history = [course("CS 328", 4, "online"), course("CS 614", 4, "online"), course("CS 617", 4, "online")];
    const audit = auditCourses(history, {}, "cse");
    expect(progress(audit, "cse_theory").completed).toBe(8);
    expect(progress(audit, "cse_elective").completed).toBe(0);
    expect(audit.allocated).toBe(8);
  });

  it("keeps the CSE elective cap separate from the open project requirement", () => {
    const open = course("CS 299");
    const audit = auditCourses([open, course("CS 399"), course("CS 499"), course("CS 613", 2, "online")], {
      [courseKey(open)]: "open_project",
    }, "cse");
    expect(progress(audit, "open_project").completed).toBe(4);
    expect(audit.limitedElectiveCredits).toBe(8);
    expect(audit.limitedElectiveUnplaced).toBe(2);
    expect(audit.allocated).toBe(12);
  });

  it("does not count repeated course codes twice across semesters", () => {
    const audit = auditCourses([course("CS 201"), { ...course("CS 201"), semester: 6 }], {}, "cse");
    expect(audit.allocated).toBe(4);
    expect(audit.duplicateCourses).toHaveLength(1);
  });

  it("still flags a mandatory core when its credits are placed elsewhere", () => {
    const core = course("CS 201");
    const audit = auditCourses([core], { [courseKey(core)]: "open_elective" }, "cse");
    expect(audit.missingGroups.find((group) => group.id === "core")?.courses.some((item) => item.code === "CS 201")).toBe(true);
  });

  it("does not treat twelve BS elective credits as eight Science basket credits", () => {
    const history = [course("BS 500"), course("BS 501"), course("BS 502")];
    const choices = Object.fromEntries(history.map((item) => [courseKey(item), "science" as const]));
    const audit = auditCourses(history, choices, "cse");
    expect(progress(audit, "science").remaining).toBe(0);
    expect(audit.checks.find((check) => check.id === "science_basket")?.remaining).toBe(8);
  });

  it("completes a 170-credit CSE degree only when fixed courses and both baskets are met", () => {
    const programme = PROGRAMMES.cse;
    const history = programme.fixedGroups.flatMap((group) => group.codes.map((code) =>
      ({ ...course(code, programme.details[code].credits), title: programme.details[code].title })));
    history.push(course("GE 101", 2), course("GE 201", 2), course("MS 408"), course("MS 491-XVI"),
      course("PH 201"), course("EH 612"), course("CH 203"), course("MA 205", 2), course("CS 399"),
      ...["ME 501", "ME 502", "CL 601", "EE 605"].map((code) => course(code)),
      ...["ES 301", "CS 614", "CS 327", "CS 332", "ES 335", "CS 613"].map((code) => course(code)),
      course("ES 404", 2));
    for (let semester = 1; semester <= 8; semester++) {
      history.push({ ...course(`IN 10${semester}`, 0), semester });
      if (semester <= 4) history.push({ ...course(`PE 10${semester}`, 0), semester });
    }
    const choices = Object.fromEntries(history.filter((item) =>
      ["ME 501", "ME 502", "CL 601", "EE 605", "CS 399"].includes(item.code))
      .map((item) => [courseKey(item), item.code === "CS 399" ? "open_project" as const : "open_elective" as const]));
    const audit = auditCourses(history, choices, "cse");
    expect(audit.allocated).toBe(170);
    expect(audit.remaining).toBe(0);
    expect(audit.missingGroups).toEqual([]);
    expect(audit.checks.every((check) => check.remaining === 0)).toBe(true);
    expect(buildSuggestions(audit, 8).map((item) => item.priority)).toEqual(["Complete"]);
  });

  it("exports CSE metadata, baskets and cap details without Chemical Engineering labels", async () => {
    const history = [...parseAll(CSE_SAMPLE_TRANSCRIPT).courses, course("CS 299"), course("CS 399"), course("CS 613", 4, "online")];
    const audit = auditCourses(history, {}, "cse");
    const workbook = buildAuditWorkbook({ currentSemester: 6 }, history, {}, audit, buildSuggestions(audit, 5));
    expect(workbook.subject).toContain("Computer Science and Engineering");
    expect(workbook.getWorksheet("Graduation plan")?.getCell("O3").value).toContain("Computer Science and Engineering");
    const serialized = JSON.stringify(workbook.model);
    expect(serialized).toContain("CSE Theory & Algorithms");
    expect(serialized).toContain("Online + CS project elective cap");
    expect(workbook.worksheets).toHaveLength(1);
    expect(serialized).not.toContain("ChE Discipline Electives");
    expect((await workbook.xlsx.writeBuffer()).byteLength).toBeGreaterThan(8_000);
    expect(buildInputTemplateWorkbook("cse").subject).toContain("Computer Science and Engineering");
  });
});
