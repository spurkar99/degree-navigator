import ExcelJS from "exceljs";
import { classificationSource, resolveBasket, type Classifications } from "./audit";
import type { Course } from "./parser";
import { BASKET_LABELS, RULESET, TOTAL_REQUIRED } from "./rules";
import type { Suggestion } from "./suggestions";
import type { ReturnTypeOfAudit } from "./types";

type StudentProfile = {
  name?: string;
  rollNumber?: string;
  currentSemester: number;
};

const headerFill = "FF0F172A";
const accentFill = "FF0F766E";
const lightFill = "FFF1F5F9";

function titleSheet(sheet: ExcelJS.Worksheet, title: string, subtitle: string, columns: number) {
  sheet.mergeCells(1, 1, 1, columns);
  sheet.getCell(1, 1).value = title;
  sheet.getCell(1, 1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 18 };
  sheet.getCell(1, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: headerFill } };
  sheet.getCell(1, 1).alignment = { vertical: "middle" };
  sheet.getRow(1).height = 30;
  sheet.mergeCells(2, 1, 2, columns);
  sheet.getCell(2, 1).value = subtitle;
  sheet.getCell(2, 1).font = { italic: true, color: { argb: "FF475569" } };
  sheet.getRow(2).height = 24;
}

function styleHeader(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: accentFill } };
    cell.alignment = { vertical: "middle" };
  });
  row.height = 22;
}

function finishSheet(sheet: ExcelJS.Worksheet) {
  sheet.views = [{ state: "frozen", ySplit: 3 }];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= 2) return;
    row.eachCell((cell) => {
      cell.border = {
        bottom: { style: "hair", color: { argb: "FFE2E8F0" } },
      };
      cell.alignment = { ...cell.alignment, vertical: "top", wrapText: true };
    });
  });
  sheet.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: sheet.columnCount } };
}

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

export function buildInputTemplateWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Degree Navigator";
  workbook.subject = `${RULESET.programme} course-entry template`;

  const instructions = workbook.addWorksheet("Instructions", { properties: { tabColor: { argb: accentFill } } });
  instructions.columns = [{ width: 24 }, { width: 74 }];
  titleSheet(instructions, "Degree Navigator — Course Entry Template", `${RULESET.programme} · ${RULESET.cohort}`, 2);
  styleHeader(instructions.addRow(["Item", "Guidance"]));
  [
    ["How to use", "Enter completed courses semester-wise. Keep one course per row."],
    ["Course code", "Use the official code, for example CL 203."],
    ["Credits", "Enter the numeric course credit exactly as shown on your transcript."],
    ["Privacy", "This file stays on your device unless you choose to share it."],
    ["Important", "The current website accepts pasted course tables; direct Excel upload is planned for a later version."],
  ].forEach((row) => instructions.addRow(row));
  finishSheet(instructions);

  for (let semester = 1; semester <= 8; semester += 1) {
    const sheet = workbook.addWorksheet(`Semester ${semester}`);
    sheet.columns = [{ width: 18 }, { width: 52 }, { width: 12 }];
    titleSheet(sheet, `Semester ${semester}`, "Enter only completed courses", 3);
    styleHeader(sheet.addRow(["Course Code", "Course Name", "Credits"]));
    for (let row = 0; row < 12; row += 1) sheet.addRow(["", "", ""]);
    finishSheet(sheet);
  }

  return workbook;
}

export function buildAuditWorkbook(
  profile: StudentProfile,
  courses: Course[],
  choices: Classifications,
  audit: ReturnTypeOfAudit,
  suggestions: Suggestion[],
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Degree Navigator";
  workbook.subject = `${RULESET.programme} graduation audit`;
  workbook.created = new Date();

  const dashboard = workbook.addWorksheet("Dashboard", { properties: { tabColor: { argb: accentFill } } });
  dashboard.columns = [{ width: 30 }, { width: 54 }];
  titleSheet(dashboard, "Degree Navigator — Graduation Audit", `${RULESET.programme} · ${RULESET.cohort}`, 2);
  styleHeader(dashboard.addRow(["Field", "Value"]));
  [
    ["Student", profile.name?.trim() || "Not provided"],
    ["Roll number", profile.rollNumber?.trim() || "Not provided"],
    ["Current semester", profile.currentSemester],
    ["Eligible credits placed", audit.allocated],
    ["Base B.Tech requirement", TOTAL_REQUIRED],
    ["Credits remaining", audit.remaining],
    ["Progress", `${Math.round((audit.allocated / TOTAL_REQUIRED) * 100)}%`],
    ["Credits awaiting classification", audit.pending],
    ["Physical Education", `${audit.pe}/4`],
    ["Viva records", `${audit.viva}/${Math.max(0, profile.currentSemester - 1)}`],
    ["Generated", new Date().toLocaleString()],
  ].forEach((row) => dashboard.addRow(row));
  finishSheet(dashboard);

  const history = workbook.addWorksheet("Course History");
  history.columns = [
    { width: 11 }, { width: 17 }, { width: 48 }, { width: 10 },
    { width: 31 }, { width: 17 }, { width: 18 },
  ];
  titleSheet(history, "Course History", "Review classifications before using this audit for planning", 7);
  styleHeader(history.addRow(["Semester", "Course Code", "Course Name", "Credits", "Requirement", "Counts?", "Classification source"]));
  courses
    .slice()
    .sort((a, b) => a.semester - b.semester || a.code.localeCompare(b.code))
    .forEach((course) => {
      const basket = resolveBasket(course, choices);
      history.addRow([
        course.semester,
        course.code,
        course.title,
        course.credits,
        BASKET_LABELS[basket],
        basket === "excluded" ? "No" : basket === "unresolved" ? "Pending" : "Yes",
        classificationSource(course, choices),
      ]);
    });
  finishSheet(history);

  const requirements = workbook.addWorksheet("Requirement Audit");
  requirements.columns = [{ width: 34 }, { width: 13 }, { width: 13 }, { width: 13 }, { width: 14 }, { width: 52 }];
  titleSheet(requirements, "Requirement Audit", "Credits are counted once within the base degree", 6);
  styleHeader(requirements.addRow(["Requirement", "Required", "Completed", "Remaining", "Status", "Rule"]));
  audit.progress.forEach((item) => requirements.addRow([
    item.name,
    item.required,
    item.completed,
    item.remaining,
    item.remaining === 0 ? "Complete" : "Pending",
    item.note,
  ]));
  finishSheet(requirements);

  const missing = workbook.addWorksheet("Missing Requirements");
  missing.columns = [{ width: 32 }, { width: 17 }, { width: 50 }, { width: 12 }];
  titleSheet(missing, "Missing Fixed Courses", "Courses not found in the submitted history", 4);
  styleHeader(missing.addRow(["Group", "Course Code", "Course Name", "Credits"]));
  audit.missingGroups.forEach((group) => group.courses.forEach((course) => missing.addRow([
    group.name,
    course.code,
    course.title,
    course.credits,
  ])));
  if (!audit.missingGroups.length) missing.addRow(["No missing fixed courses", "", "", ""]);
  finishSheet(missing);

  const plan = workbook.addWorksheet("Suggestions");
  plan.columns = [{ width: 19 }, { width: 44 }, { width: 76 }];
  titleSheet(plan, "Planning Suggestions", "Requirement-level guidance only; course availability and approvals are not assumed", 3);
  styleHeader(plan.addRow(["Priority", "Suggestion", "Reason"]));
  suggestions.forEach((item) => plan.addRow([item.priority, item.title, item.detail]));
  finishSheet(plan);

  const rules = workbook.addWorksheet("Rules & Disclaimer");
  rules.columns = [{ width: 28 }, { width: 84 }];
  titleSheet(rules, "Rules & Disclaimer", "Check unusual approvals and substitutions with Academic Affairs", 2);
  styleHeader(rules.addRow(["Item", "Details"]));
  [
    ["Programme", RULESET.programme],
    ["Cohort", RULESET.cohort],
    ["Rules version", RULESET.version],
    ["Source", RULESET.source],
    ["Scope", "Base B.Tech only. Minors, honors and dual majors are not included in this version."],
    ["Classification", "Rule matched means the app placed the course automatically. Student selected means the category was confirmed or changed during review."],
    ["Disclaimer", "This workbook is a planning aid, not an official degree audit. Confirm unusual approvals, substitutions and exceptions with your faculty advisor or Academic Affairs."],
  ].forEach((row) => rules.addRow(row));
  finishSheet(rules);

  workbook.eachSheet((sheet) => {
    sheet.pageSetup = {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    };
    sheet.getColumn(1).eachCell((cell, rowNumber) => {
      if (rowNumber > 3 && rowNumber % 2 === 0) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: lightFill } };
      }
    });
  });

  return workbook;
}

export async function downloadInputTemplate() {
  await saveWorkbook(buildInputTemplateWorkbook(), "Degree-Navigator-Course-Template.xlsx");
}

export async function downloadAuditWorkbook(
  profile: StudentProfile,
  courses: Course[],
  choices: Classifications,
  audit: ReturnTypeOfAudit,
  suggestions: Suggestion[],
) {
  const identifier = profile.rollNumber?.trim() || profile.name?.trim().replace(/\s+/g, "-") || "Student";
  await saveWorkbook(
    buildAuditWorkbook(profile, courses, choices, audit, suggestions),
    `Degree-Navigator-${identifier}-Audit.xlsx`,
  );
}
