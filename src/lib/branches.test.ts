import { describe, expect, it } from "vitest";
import { auditCourses, autoClassify, courseKey, courseKind, type Classifications } from "./audit";
import { buildAuditWorkbook, buildInputTemplateWorkbook } from "./excel";
import { buildGraduationLayout } from "./excel-layout";
import { parseAll, type Course } from "./parser";
import { PROGRAMMES, type ProgrammeId } from "./rules";
import { SAMPLE_TRANSCRIPTS } from "./sample";
import { buildSuggestions } from "./suggestions";

const added: ProgrammeId[] = ["civil", "electrical", "icdt", "materials", "mechanical"];
const targets = { civil: 170, electrical: 170, icdt: 172, materials: 170, mechanical: 172 };
const sampleTotals = { civil: 100, electrical: 99, icdt: 96, materials: 100, mechanical: 97 };
const course = (code: string, credits = 4, kind?: Course["kind"], title = code): Course => ({ semester: 5, code, title, credits, kind });
const progress = (audit: ReturnType<typeof auditCourses>, id: string) => audit.progress.find((p) => p.id === id)!;

describe.each(added)("%s base degree", (id) => {
  it("uses the advisory's own core list and credit total", () => {
    const p = PROGRAMMES[id];
    expect(p.totalRequired).toBe(targets[id as keyof typeof targets]);
    expect(p.requirements.reduce((sum, r) => sum + r.required, 0)).toBe(p.totalRequired);
    expect([...p.core].reduce((sum, code) => sum + p.details[code].credits, 0)).toBe(p.requirements.find((r) => r.id === p.coreBasket)?.required);
    for (const [index, key] of [...p.core].entries()) {
      const detail = p.details[key];
      const c = course(detail.codePending ? `EE ${800 + index}` : key, detail.credits, undefined, detail.title);
      expect(autoClassify(c, id)).toBe(p.coreBasket);
      expect(auditCourses([c], {}, id).missingGroups.find((g) => g.id === "core")?.courses.some((m) => m.title === detail.title)).toBe(false);
    }
  });

  it("loads a parseable four-semester example with the expected placement", () => {
    const parsed = parseAll(SAMPLE_TRANSCRIPTS[id]);
    expect(parsed.warnings).toEqual([]);
    const audit = auditCourses(parsed.courses, {}, id);
    expect(audit.unresolved).toEqual([]);
    expect(audit.allocated).toBe(sampleTotals[id as keyof typeof sampleTotals]);
    expect(audit.pe).toBe(4);
    expect(audit.viva).toBe(4);
    expect(audit.remaining).toBe(audit.totalRequired - audit.allocated);
  });

  it("completes a valid full degree fixture, including its science and elective conditions", () => {
    const p = PROGRAMMES[id];
    const history = p.fixedGroups.flatMap((group) => group.codes.map((key, index) => ({
      ...course(p.details[key].codePending ? `EE ${800 + index}` : key, p.details[key].credits), title: p.details[key].title,
    })));
    history.push(course("GE 101", 2), course("GE 201", 2), course("MS 408"), course("MS 491-XVI"), course("MA 205", 2),
      course("PH 201"), course("PH 510"), course("EH 612"), course("CL 399"),
      ...["CL 601", "CL 602", "CL 603", "CL 604"].map((code) => course(code)));
    const choices: Classifications = { "5:CL 399": "open_project" };
    for (const code of ["CL 601", "CL 602", "CL 603", "CL 604"]) choices[`5:${code}`] = "open_elective";
    const electives = id === "civil" ? ["CE 313", "CE 314", "CE 404", "CE 307", "CE 637"] :
      id === "electrical" ? ["ES 215", "ES 333", "ES 412", "ES 414", "ES 416"] :
      id === "icdt" ? ["EE 651", "EE 660", "ES 672", "EE 701", "EE 702"] :
      id === "materials" ? ["MSE 601", "MSE 602", "MSE 603", "MSE 604", "MSE 605"] :
      ["ES 214", "ES 408", "ES 604", "ES 607", "ES 613"];
    history.push(...electives.map((code) => course(code)));
    if (id === "icdt") for (const code of ["EE 701", "EE 702"]) choices[`5:${code}`] = "discipline_elective";
    for (let semester = 1; semester <= 8; semester++) {
      history.push({ ...course(`IN 10${semester}`, 0), semester });
      if (semester <= 4) history.push({ ...course(`PE 10${semester}`, 0), semester });
    }
    const audit = auditCourses(history, choices, id);
    expect(audit.unresolved).toEqual([]);
    expect(audit.allocated).toBe(p.totalRequired);
    expect(audit.missingGroups).toEqual([]);
    expect(audit.checks.every((c) => c.remaining === 0)).toBe(true);
    expect(buildSuggestions(audit, 8).map((s) => s.priority)).toEqual(["Complete"]);
  });

  it("exports one worksheet with correct totals, editable plans and non-overlapping merged ranges", async () => {
    const courses = parseAll(SAMPLE_TRANSCRIPTS[id]).courses;
    const audit = auditCourses(courses, {}, id);
    const suggestions = buildSuggestions(audit, 4);
    const workbook = buildAuditWorkbook({currentSemester: 5}, courses, {}, audit, suggestions);
    expect(workbook.worksheets).toHaveLength(1);
    const sheet = workbook.worksheets[0];
    expect(sheet.getCell("A5").result).toBe(audit.totalRequired);
    expect(sheet.getCell("H5").result).toBe(audit.allocated);
    expect(sheet.pageSetup.fitToWidth).toBe(1);
    expect(sheet.pageSetup.fitToHeight).toBe(1);
    expect(sheet.pageSetup.printArea).toBe(`A1:AA${sheet.rowCount}`);
    const layout = buildGraduationLayout({currentSemester: 5}, courses, {}, audit, suggestions);
    expect(layout.plannedCreditRanges).toHaveLength(4);
    expect(new Set(layout.cells.map((c) => c.range)).size).toBe(layout.cells.length);
    expect((await workbook.xlsx.writeBuffer()).byteLength).toBeGreaterThan(8000);
    const blank = buildInputTemplateWorkbook(id);
    expect(blank.worksheets).toHaveLength(1);
    expect(blank.worksheets[0].getCell("A5").result).toBe(audit.totalRequired);
  });
});

describe("branch-specific restrictions", () => {
  it("keeps Civil's two elective baskets separate without surplus transfer", () => {
    const design = [course("CE 313", 8), course("CE 314", 8)];
    const audit = auditCourses(design, {}, "civil");
    expect(progress(audit, "civil_design").completed).toBe(12);
    expect(progress(audit, "discipline_elective").completed).toBe(0);
    expect(audit.allocated).toBe(12);
    expect(autoClassify(course("CE 999"), "civil")).toBeNull();
  });
  it("recognizes only listed ICDT electives, not all EE courses", () => {
    expect(autoClassify(course("EE 651"), "icdt")).toBe("discipline_elective");
    expect(autoClassify(course("EE 999"), "icdt")).toBeNull();
    expect(autoClassify(course("EE 999"), "electrical")).toBe("discipline_elective");
  });
  it.each(["EE 299", "EE 399", "EE 499"])("excludes %s from EE electives even when marked regular", (code) => {
    const audit = auditCourses([course(code, 4, "regular")], {}, "electrical");
    expect(audit.allocated).toBe(0);
    expect(audit.prohibitedElectiveCredits).toBe(4);
  });
  it("excludes online EE electives but keeps an approved Open Project separate", () => {
    const op = course("EE 299");
    const audit = auditCourses([course("EE 651", 4, "online"), op], {[courseKey(op)]: "open_project"}, "electrical");
    expect(audit.prohibitedElectiveCredits).toBe(4);
    expect(progress(audit, "open_project").completed).toBe(4);
    expect(audit.projectCredits).toBe(4);
  });
  it.each(["materials", "mechanical"] as ProgrammeId[])("caps %s projects at eight elective credits, separately from Open Project", (id) => {
    const prefix = id === "materials" ? "MSE" : "ME";
    const op = course(`${prefix} 299`);
    const history = [op, course(`${prefix} 399`), course(`${prefix} 499`), course(`${prefix} 601`, 4, "project")];
    const audit = auditCourses(history, {[courseKey(op)]: "open_project"}, id);
    expect(audit.limitedElectiveCredits).toBe(8);
    expect(audit.limitedElectiveUnplaced).toBe(4);
    expect(audit.allocated).toBe(12);
    expect(courseKind(course(`${prefix} 299`, 4, "regular"))).toBe("project");
  });
  it("does not use ME online credits, and does not consume its project allowance with them", () => {
    const audit = auditCourses([course("ME 601", 4, "online"), course("ME 399"), course("ME 499")], {}, "mechanical");
    expect(audit.prohibitedElectiveCredits).toBe(4);
    expect(audit.limitedElectiveCredits).toBe(8);
    expect(audit.allocated).toBe(8);
    expect(buildSuggestions(audit, 4).some((s) => s.title.includes("ineligible ME"))).toBe(true);
  });
  it("does not apply a combined online/project cap to regular MSE online electives", () => {
    const audit = auditCourses([course("MSE 601", 4, "online"), course("MSE 399"), course("MSE 499")], {}, "materials");
    expect(audit.limitedElectiveSubmitted).toBe(8);
    expect(audit.allocated).toBe(12);
  });
  it.each([
    ["electrical", "PH 201"], ["icdt", "PH 510"], ["materials", "CH 203"], ["mechanical", "PH 404"],
  ] as [ProgrammeId, string][])("requires the %s science choice to count in Science", (id, code) => {
    const c = course(code);
    const missing = auditCourses([c], {[courseKey(c)]: "open_elective"}, id);
    expect(missing.checks.find((c) => c.id === "discipline_science")?.remaining).toBe(4);
    const present = auditCourses([c], {}, id);
    expect(present.checks.find((c) => c.id === "discipline_science")?.remaining).toBe(0);
    expect(progress(present, "science").completed).toBe(4);
  });
  it("requires one complete specified science course, not two incomplete alternatives", () => {
    const a = auditCourses([course("PH 201", 2), course("CH 203", 2)], {}, "materials");
    expect(a.checks.find((c) => c.id === "discipline_science")?.remaining).toBe(2);
  });
  it("counts Physics of Materials as an ICDT science alternative but as MSE core", () => {
    const c = course("MSE 206", 4, undefined, "Physics of Materials");
    expect(autoClassify(c, "icdt")).toBe("science");
    expect(autoClassify(c, "materials")).toBe("discipline_core");
    expect(auditCourses([c], {}, "icdt").checks.find((c) => c.id === "discipline_science")?.remaining).toBe(0);
  });
  it("matches pending ICDT core by full title without accepting similar names or counting twice", () => {
    const c = course("EE 225", 2, undefined, "Unveiling the Semiconductor World");
    expect(autoClassify(c, "icdt")).toBe("discipline_core");
    expect(autoClassify({...c, title: "Semiconductor World Seminar"}, "icdt")).toBeNull();
    const a = auditCourses([c, {...c, semester: 6, code: "EE 801"}], {}, "icdt");
    expect(a.allocated).toBe(2);
    expect(a.duplicateCourses).toHaveLength(1);
    const absent = auditCourses([], {}, "icdt").missingGroups.flatMap((g) => g.courses);
    expect(absent.filter((c) => c.codePending).every((c) => c.code === "Code pending")).toBe(true);
  });
  it("applies the 16-credit total project cap across baskets and surfaces the excess", () => {
    const history = [course("ME 299"), course("ME 399"), course("ME 499"), course("CL 399"), course("CE 399")];
    const choices: Classifications = {};
    for (const c of history) choices[courseKey(c)] = c.code === "CL 399" ? "open_project" : "open_elective";
    const a = auditCourses(history, choices, "mechanical");
    expect(a.projectCredits).toBe(16);
    expect(a.projectLimitUnplaced).toBe(4);
    expect(a.allocated).toBeLessThanOrEqual(16);
    expect(buildSuggestions(a, 4).some((s) => s.title.includes("16-credit"))).toBe(true);
  });
  it("does not consume the global project quota with surplus Open Project credits", () => {
    const op = course("CL 299", 8);
    const a = auditCourses([op, course("ME 299"), course("ME 399"), course("CE 399")], {
      [courseKey(op)]: "open_project", "5:ME 299": "open_elective", "5:ME 399": "open_elective", "5:CE 399": "open_elective",
    }, "mechanical");
    expect(a.projectCredits).toBe(16);
    expect(a.projectLimitUnplaced).toBe(0);
    expect(a.allocated).toBe(16);
  });
});
