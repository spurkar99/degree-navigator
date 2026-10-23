import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { auditCourses, courseKey } from "./audit";
import { buildAuditWorkbook, buildInputTemplateWorkbook } from "./excel";
import { buildGraduationLayout } from "./excel-layout";
import { parseAll } from "./parser";
import { SAMPLE_TRANSCRIPT } from "./sample";
import { buildSuggestions } from "./suggestions";

function sample() {
  const courses = parseAll(SAMPLE_TRANSCRIPT).courses;
  const es418 = courses.find((course) => course.code === "ES 418")!;
  const choices = { [courseKey(es418)]: "open_elective" as const };
  const audit = auditCourses(courses, choices);
  const profile = { name: "Example Student", rollNumber: "24110000", currentSemester: 5 };
  return { courses, choices, audit, profile, suggestions: buildSuggestions(audit, 4) };
}

describe("single-sheet graduation plan", () => {
  it("uses one sheet for the blank template, with eight editable semester panels", () => {
    const workbook = buildInputTemplateWorkbook();
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual(["Graduation plan"]);
    const serialized = JSON.stringify(workbook.model);
    for (let i = 1; i <= 8; i++) expect(serialized).toContain(`SEMESTER ${i}  PLANNED`);
    expect(serialized).not.toContain("Write your Name");
  });

  it("keeps the existing ChE totals on the single worksheet and prints its full range on one page", () => {
    const s = sample();
    const workbook = buildAuditWorkbook(s.profile, s.courses, s.choices, s.audit, s.suggestions);
    const sheet = workbook.worksheets[0];
    expect(workbook.worksheets).toHaveLength(1);
    expect(sheet.getCell("A5").result).toBe(170);
    expect(sheet.getCell("H5").result).toBe(100);
    expect(sheet.getCell("O5").result).toBe(70);
    expect(sheet.getCell("V5").result).toBe(0);
    expect(sheet.pageSetup.fitToWidth).toBe(1);
    expect(sheet.pageSetup.fitToHeight).toBe(1);
    expect(sheet.pageSetup.printArea).toBe(`A1:AA${sheet.rowCount}`);
  });

  it("retains all credit-bearing course names and gives PE and viva a semester footer", () => {
    const s = sample();
    const layout = buildGraduationLayout(s.profile, s.courses, s.choices, s.audit, s.suggestions);
    for (const course of s.courses.filter((item) => item.credits > 0)) {
      expect(layout.cells.some((cell) => cell.value === course.code)).toBe(true);
      expect(layout.cells.some((cell) => cell.value === course.title)).toBe(true);
    }
    expect(layout.cells.filter((cell) => cell.value === "PE record: yes   Viva record: yes")).toHaveLength(4);
  });

  it("uses separate formula totals for future plans without changing earned credits", () => {
    const s = sample();
    const layout = buildGraduationLayout(s.profile, s.courses, s.choices, s.audit, s.suggestions);
    expect(layout.plannedCreditRanges).toHaveLength(4);
    const planned = layout.cells.find((cell) => cell.range.startsWith("V5:"))!;
    for (const range of layout.plannedCreditRanges) expect(planned.formula).toContain(range);
    const workbook = buildAuditWorkbook(s.profile, s.courses, s.choices, s.audit, s.suggestions);
    const sheet = workbook.worksheets[0];
    const input = sheet.getCell(layout.plannedCreditRanges[0].split(":")[0]);
    expect(input.dataValidation.type).toBe("decimal");
    input.value = 4;
    expect(sheet.getCell("H5").result).toBe(100);
    expect(sheet.getCell("O5").result).toBe(70);
    expect(sheet.getCell(layout.plannedCategoryRanges[0].split(":")[0]).dataValidation.type).toBe("list");
  });

  it("expands semester panels instead of discarding extra course rows", () => {
    const s = sample();
    for (let n = 0; n < 20; n++) s.courses.push({ semester: 4, code: `ZZ ${500 + n}`, title: `Additional course ${n}`, credits: 1 });
    const layout = buildGraduationLayout(s.profile, s.courses, s.choices, auditCourses(s.courses, s.choices), []);
    expect(layout.cells.some((cell) => cell.value === "ZZ 519")).toBe(true);
  });

  it("round-trips a single worksheet with formulas and print settings intact", async () => {
    const s = sample();
    const workbook = buildAuditWorkbook(s.profile, s.courses, s.choices, s.audit, s.suggestions);
    const buffer = await workbook.xlsx.writeBuffer();
    const reopened = new ExcelJS.Workbook();
    await reopened.xlsx.load(buffer);
    expect(reopened.worksheets).toHaveLength(1);
    expect(reopened.worksheets[0].getCell("H5").result).toBe(100);
    expect(reopened.worksheets[0].getCell("V5").formula).toContain("SUM(");
    expect(reopened.worksheets[0].pageSetup.fitToHeight).toBe(1);
  });
});
