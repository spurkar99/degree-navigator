import ExcelJS from "exceljs";
import { auditCourses, type Classifications } from "./audit";
import { buildGraduationLayout, SHEET_STYLES, type SheetLayout, type StudentProfile } from "./excel-layout";
import type { Course } from "./parser";
import { getProgramme, type ProgrammeId } from "./rules";
import { buildSuggestions, type Suggestion } from "./suggestions";
import type { ReturnTypeOfAudit } from "./types";
import { auditMinors, type MinorAudit, type MinorPlan } from "./minors";

async function saveWorkbook(workbook: ExcelJS.Workbook, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer as BlobPart], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

// ExcelJS stays in the on-demand browser bundle. A neutral layout also lets
// the standalone preview use the same cells, formulas and styles.
export function buildWorkbookFromLayout(layout: SheetLayout) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Degree Navigator";
  workbook.subject = `B.Tech ${layout.programme} graduation plan`;
  workbook.calcProperties.fullCalcOnLoad = true;
  const sheet = workbook.addWorksheet(layout.name, {
    views: [{ showGridLines: false }],
    properties: { defaultRowHeight: 15 },
  });
  sheet.columns = layout.widths.map((width) => ({ width }));
  Object.entries(layout.heights).forEach(([row, height]) => { sheet.getRow(Number(row)).height = height; });
  layout.cells.forEach((item) => {
    if (item.range.includes(":")) sheet.mergeCells(item.range);
    const cell = sheet.getCell(item.range.split(":")[0]);
    cell.value = item.formula ? { formula: item.formula, result: item.result } : item.value ?? "";
    const style = SHEET_STYLES[item.style];
    cell.font = { name: "Arial", size: style.size, bold: style.bold, color: { argb: `FF${style.color}` } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${style.fill}` } };
    cell.alignment = { vertical: "middle", horizontal: item.align ?? "left", wrapText: true };
    cell.numFmt = "General";
  });
  layout.remainingCells.forEach((ref) => sheet.addConditionalFormatting({ ref, rules: [{
    type: "cellIs", operator: "greaterThan", formulae: ["0"], priority: 1,
    style: { font: { color: { argb: "FF9A5B00" } }, fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF3D5" } } },
  }] }));
  layout.plannedCreditRanges.forEach((range) => {
    const [first, last] = range.split(":");
    const column = first.match(/^[A-Z]+/)![0];
    const start = Number(first.match(/\d+$/)![0]);
    const end = Number(last.match(/\d+$/)![0]);
    for (let row = start; row <= end; row++) sheet.getCell(`${column}${row}`).dataValidation = {
      type: "decimal", operator: "greaterThanOrEqual", formulae: [0], allowBlank: true,
      showErrorMessage: true, error: "Enter a non-negative number of credits.",
    };
  });
  layout.plannedCategoryRanges.forEach((range) => {
    const [first, last] = range.split(":");
    const column = first.match(/^[A-Z]+/)![0];
    const start = Number(first.match(/\d+$/)![0]);
    const end = Number(last.match(/\d+$/)![0]);
    for (let row = start; row <= end; row++) sheet.getCell(`${column}${row}`).dataValidation = {
      type: "list", formulae: [`"${layout.categoryLabels.join(",")}"`], allowBlank: true,
      showErrorMessage: true, error: "Choose a requirement from the list.",
    };
  });
  sheet.pageSetup = {
    // OOXML paper size 8 is A3; ExcelJS's abbreviated enum omits it.
    orientation: "landscape", paperSize: 8 as ExcelJS.PaperSize, fitToPage: true, fitToWidth: 1, fitToHeight: 1,
    printArea: `A1:AA${layout.lastRow}`, horizontalCentered: true,
    margins: { left: 0.2, right: 0.2, top: 0.2, bottom: 0.2, header: 0, footer: 0 },
  };
  return workbook;
}

export function buildInputTemplateWorkbook(programmeId: ProgrammeId = "chemical", minorPlan?: MinorPlan) {
  const audit = auditCourses([], {}, programmeId);
  return buildWorkbookFromLayout(buildGraduationLayout(
    { currentSemester: 1 }, [], {}, audit, [], true, minorPlan?auditMinors([],{},audit,minorPlan):undefined,
  ));
}

export function buildAuditWorkbook(
  profile: StudentProfile, courses: Course[], choices: Classifications,
  audit: ReturnTypeOfAudit, suggestions: Suggestion[] = buildSuggestions(audit, profile.currentSemester - 1), minors?: MinorAudit,
) {
  return buildWorkbookFromLayout(buildGraduationLayout(profile, courses, choices, audit, suggestions, false, minors));
}

export async function downloadInputTemplate(programmeId: ProgrammeId = "chemical", minorPlan?: MinorPlan) {
  await saveWorkbook(buildInputTemplateWorkbook(programmeId,minorPlan), `Degree-Navigator-${getProgramme(programmeId).shortName}-Course-Template.xlsx`);
}

export async function downloadAuditWorkbook(
  profile: StudentProfile, courses: Course[], choices: Classifications,
  audit: ReturnTypeOfAudit, suggestions: Suggestion[], minors?: MinorAudit,
) {
  const identifier = profile.rollNumber?.trim() || profile.name?.trim().replace(/\s+/g, "-") || "Student";
  await saveWorkbook(buildAuditWorkbook(profile, courses, choices, audit, suggestions, minors),
    `Degree-Navigator-${audit.programme.shortName}-${identifier}-Graduation-Plan.xlsx`);
}
