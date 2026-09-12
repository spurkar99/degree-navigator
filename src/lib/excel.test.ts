import { describe, expect, it } from "vitest";
import { auditCourses, courseKey } from "./audit";
import { buildAuditWorkbook, buildInputTemplateWorkbook } from "./excel";
import { parseAll } from "./parser";
import { SAMPLE_TRANSCRIPT } from "./sample";
import { buildSuggestions } from "./suggestions";

describe("Excel exports", () => {
  it("creates the blank template with instructions and eight semesters", () => {
    const workbook = buildInputTemplateWorkbook();
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      "Instructions", "Semester 1", "Semester 2", "Semester 3", "Semester 4",
      "Semester 5", "Semester 6", "Semester 7", "Semester 8",
    ]);
  });

  it("creates and serializes all six personalized audit sheets", async () => {
    const courses = parseAll(SAMPLE_TRANSCRIPT).courses;
    const es418 = courses.find((course) => course.code === "ES 418")!;
    const choices = { [courseKey(es418)]: "open_elective" as const };
    const audit = auditCourses(courses, choices);
    const workbook = buildAuditWorkbook(
      { name: "Example Student", rollNumber: "24110000", currentSemester: 5 },
      courses,
      choices,
      audit,
      buildSuggestions(audit, 4),
    );
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      "Dashboard", "Course History", "Requirement Audit", "Missing Requirements",
      "Suggestions", "Rules & Disclaimer",
    ]);
    expect(workbook.getWorksheet("Dashboard")?.getCell("B7").value).toBe(100);
    const file = await workbook.xlsx.writeBuffer();
    expect(file.byteLength).toBeGreaterThan(10_000);
  });
});
