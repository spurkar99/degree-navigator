import { courseKind, resolveBasket, type Classifications } from "./audit";
import type { Course } from "./parser";
import { RULESET, type BasketId } from "./rules";
import type { Suggestion } from "./suggestions";
import type { ReturnTypeOfAudit } from "./types";

export type StudentProfile = { name?: string; rollNumber?: string; currentSemester: number };
export type CellStyle = "title" | "muted" | "section" | "header" | "body" | "input" | "total" | "number" | "headline";
export type SheetCell = {
  range: string; value?: string | number; formula?: string; result?: string | number;
  style: CellStyle; align?: "left" | "center" | "right";
};
export type SheetLayout = {
  name: string; cells: SheetCell[]; widths: number[]; heights: Record<number, number>;
  lastRow: number; plannedCreditRanges: string[]; plannedCategoryRanges: string[];
  categoryLabels: string[]; remainingCells: string[]; programme: string;
};

export const SHEET_STYLES = {
  title: { size: 16, bold: true, color: "172B4D", fill: "FFFFFF" },
  muted: { size: 9, bold: false, color: "52657A", fill: "FFFFFF" },
  section: { size: 10, bold: true, color: "FFFFFF", fill: "254B70" },
  header: { size: 9, bold: true, color: "254B70", fill: "E9EFF5" },
  body: { size: 9, bold: false, color: "172B4D", fill: "FFFFFF" },
  input: { size: 9, bold: false, color: "234FA0", fill: "FFF6DC" },
  total: { size: 10, bold: true, color: "172B4D", fill: "E9EFF5" },
  number: { size: 10, bold: false, color: "172B4D", fill: "FFFFFF" },
  headline: { size: 16, bold: true, color: "172B4D", fill: "F2F6FA" },
} as const;

export const EXPORT_LABELS: Record<BasketId, string> = {
  foundation: "Foundation", institute: "Institute", mathematics: "Mathematics", hss: "HSS",
  science: "Science / BS", open_project: "Open project", open_elective: "Open elective",
  chemical_core: "ChE core", chemical_elective: "ChE elective", cse_core: "CSE core",
  cse_theory: "Theory & Algo.", cse_systems: "Systems", cse_elective: "CSE elective",
  excluded: "Not counted", unresolved: "Review",
};

export function columnName(column: number): string {
  let result = "";
  for (let n = column; n > 0; n = Math.floor((n - 1) / 26)) result = String.fromCharCode(65 + (n - 1) % 26) + result;
  return result;
}

/** One worksheet shared by the browser exporter and the standalone preview. */
export function buildGraduationLayout(
  profile: StudentProfile, courses: Course[], choices: Classifications,
  audit: ReturnTypeOfAudit, suggestions: Suggestion[], blank = false,
): SheetLayout {
  const widths = Array.from({ length: 27 }, (_, index) => [4.5, 4.5, 15, 15, 4.5, 15, 2][index % 7]);
  const cells: SheetCell[] = [];
  const heights: Record<number, number> = { 1: 6, 2: 25, 3: 20, 4: 17, 5: 25, 6: 6 };
  const plannedCreditRanges: string[] = [];
  const plannedCategoryRanges: string[] = [];
  const remainingCells: string[] = [];
  function put(row: number, start: number, end: number, value: string | number, style: CellStyle = "body", align?: SheetCell["align"]) {
    const range = start === end ? `${columnName(start)}${row}` : `${columnName(start)}${row}:${columnName(end)}${row}`;
    cells.push({ range, value, style, align });
    const width = widths.slice(start - 1, end).reduce((sum, w) => sum + w, 0);
    const lines = String(value).split("\n").reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / (width * 1.15))), 0);
    heights[row] = Math.max(heights[row] ?? 15, lines * 12 + 3);
    return cells[cells.length - 1];
  }
  function formula(row: number, start: number, end: number, expression: string, result: string | number, style: CellStyle = "number") {
    const cell = put(row, start, end, result, style, typeof result === "number" ? "right" : "left");
    delete cell.value;
    cell.formula = expression;
    cell.result = result;
  }

  put(2, 1, 27, "Degree Navigator — Graduation plan", "title");
  put(3, 1, 13, blank ? "Name: ____________________     Roll number: ____________________" :
    `${profile.name?.trim() || "Name not provided"}     Roll: ${profile.rollNumber?.trim() || "Not provided"}`, blank ? "input" : "muted");
  put(3, 15, 27, `${audit.programme.name}  ${audit.programme.cohort}  |  Current semester: ${profile.currentSemester}`, "muted");
  for (const [start, label] of [[1, "BASE DEGREE CREDITS"], [8, "COMPLETED / PLACED"], [15, "STILL TO COMPLETE"], [22, "FUTURE PLANNED CREDITS"]] as const) put(4, start, start + 5, label, "header");

  put(7, 1, 13, "Credit requirements", "section");
  put(7, 15, 27, "Required activities and checks", "section");
  for (const [start, end, title] of [[1, 5, "Requirement"], [6, 7, "Need"], [8, 9, "Placed"], [10, 11, "Left"], [12, 13, "Status"]] as const) put(8, start, end, title, "header", "center");
  audit.progress.forEach((item, index) => {
    const row = 9 + index;
    put(row, 1, 5, item.name);
    put(row, 6, 7, item.required, "number", "right");
    put(row, 8, 9, item.completed, "number", "right");
    formula(row, 10, 11, `MAX(0,F${row}-H${row})`, item.remaining);
    formula(row, 12, 13, `IF(J${row}=0,"Complete","Pending")`, item.remaining === 0 ? "Complete" : "Pending", "body");
    remainingCells.push(`J${row}:K${row}`);
  });
  const totalRow = 9 + audit.progress.length;
  put(totalRow, 1, 5, "TOTAL BASE DEGREE", "total");
  formula(totalRow, 6, 7, `SUM(F9:F${totalRow - 1})`, audit.totalRequired, "total");
  formula(totalRow, 8, 9, `SUM(H9:H${totalRow - 1})`, audit.allocated, "total");
  formula(totalRow, 10, 11, `SUM(J9:J${totalRow - 1})`, audit.remaining, "total");
  put(totalRow, 12, 13, "credits", "total");
  formula(5, 1, 6, `F${totalRow}`, audit.totalRequired, "headline");
  formula(5, 8, 13, `H${totalRow}`, audit.allocated, "headline");
  formula(5, 15, 20, `J${totalRow}`, audit.remaining, "headline");

  const completedSemesters = Math.max(0, profile.currentSemester - 1);
  const checks: [string, string | number][] = [
    ["Physical Education records", `${audit.pe} of 4`],
    ["Comprehensive viva records", `${audit.viva} of ${completedSemesters} completed semesters`],
    ...audit.checks.map((check): [string, string] => [check.name, `${Math.min(check.completed, check.required)} / ${check.required} credits`]),
    ["Unclassified credits", audit.pending],
    ["Excluded credits", audit.excludedCredits],
    ["Repeated course codes not counted again", audit.duplicateCourses.length],
  ];
  if (audit.programmeId === "cse") checks.push(["Online + CS project elective cap", `${audit.limitedElectiveCredits} / 8 maximum`], ["Credits over that combined cap", audit.limitedElectiveUnplaced]);
  checks.forEach(([label, value], index) => { put(8 + index, 15, 23, label); put(8 + index, 24, 27, value, "number", "right"); });
  const missing = audit.missingGroups.flatMap((group) => group.courses);
  const missingLine = 8 + checks.length;
  put(missingLine, 15, 27, `${missing.length} compulsory course${missing.length === 1 ? "" : "s"} still missing or not placed correctly. See the list below.`, "muted");
  put(totalRow, 15, 23, "Unplanned credit gap (credit count only)", "total");
  formula(totalRow, 24, 27, "MAX(0,O5-V5)", audit.remaining, "total");

  // Four semesters across, two bands; keep every submitted course. Activity
  // records are shown in each semester footer instead of repeating zero rows.
  const activity = (course: Course) => course.credits === 0 && /^(PE 10[1-4]|IN 1\d{2})$/.test(course.code);
  const bySemester = Array.from({ length: 8 }, (_, i) => courses.filter((course) => course.semester === i + 1 && !activity(course)).slice().sort((a, b) => a.code.localeCompare(b.code)));
  const duplicates = new Set(audit.duplicateCourses);
  let blockStart = Math.max(totalRow + 3, missingLine + 3);
  for (let band = 0; band < 2; band++) {
    const slots = Math.max(8, ...bySemester.slice(band * 4, band * 4 + 4).map((items) => items.length));
    for (let panel = 0; panel < 4; panel++) {
      const semester = band * 4 + panel + 1;
      const start = panel * 7 + 1;
      const planned = semester >= profile.currentSemester;
      put(blockStart, start, start + 5, `SEMESTER ${semester}  ${planned ? "PLANNED" : "COMPLETED"}`, "section");
      put(blockStart + 1, start, start + 1, "Code", "header");
      put(blockStart + 1, start + 2, start + 3, "Course", "header");
      put(blockStart + 1, start + 4, start + 4, "Cr", "header", "right");
      put(blockStart + 1, start + 5, start + 5, "Counts as", "header");
      const first = blockStart + 2;
      const last = first + slots - 1;
      const creditRange = `${columnName(start + 4)}${first}:${columnName(start + 4)}${last}`;
      const categoryRange = `${columnName(start + 5)}${first}:${columnName(start + 5)}${last}`;
      if (planned) { plannedCreditRanges.push(creditRange); plannedCategoryRanges.push(categoryRange); }
      for (let index = 0; index < slots; index++) {
        const row = first + index;
        const item = bySemester[semester - 1][index];
        const style = planned ? "input" : "body";
        put(row, start, start + 1, item?.code ?? "", style);
        put(row, start + 2, start + 3, item ? `${item.title}${courseKind(item) === "online" ? " (online)" : ""}` : "", style);
        put(row, start + 4, start + 4, item?.credits ?? "", style, "right");
        put(row, start + 5, start + 5, item ? duplicates.has(item) ? "Duplicate" : EXPORT_LABELS[resolveBasket(item, choices, audit.programmeId)] : "", style);
      }
      put(last + 1, start, start + 3, planned ? "Planned credits" : "Transcript credits", "total");
      formula(last + 1, start + 4, start + 5, `SUM(${creditRange})`, bySemester[semester - 1].reduce((sum, item) => sum + item.credits, 0), "total");
      const records = courses.filter((item) => item.semester === semester && activity(item));
      put(last + 2, start, start + 5, planned ? "Yellow cells: add your planned courses" :
        `PE record: ${records.some((item) => item.code.startsWith("PE ")) ? "yes" : "not found"}   Viva record: ${records.some((item) => item.code.startsWith("IN ")) ? "yes" : "not found"}`, "muted");
    }
    blockStart += slots + 6;
  }
  const plannedCredits = bySemester.slice(Math.max(0, profile.currentSemester - 1)).flat().reduce((sum, course) => sum + course.credits, 0);
  formula(5, 22, 27, plannedCreditRanges.length ? `SUM(${plannedCreditRanges.join(",")})` : "0", plannedCredits, "headline");

  let row = blockStart;
  put(row++, 1, 27, "Missing compulsory courses and next steps", "section");
  put(row++, 1, 27, missing.length ? missing.map((item) => `${item.code}: ${item.title} (${item.credits} cr)`).join("; ") : "No missing compulsory courses found in the submitted history.", "body");
  const actionItems = suggestions.filter((item) => !item.title.startsWith("Complete ") || !item.detail.startsWith("Still missing:")).map((item) => `${item.title}. ${item.detail}`);
  for (let index = 0; index < actionItems.length; index += 2) {
    put(row, 1, 13, actionItems[index], "muted");
    if (actionItems[index + 1]) put(row, 15, 27, actionItems[index + 1], "muted");
    row++;
  }
  if (audit.limitedCourses.length) put(row++, 1, 27, `Online / project credits within the CSE elective cap: ${audit.limitedCourses.map((item) => `${item.course.code} ${item.eligible}/${item.course.credits}`).join("; ")}. Transcript credits above remain unchanged.`, "muted");
  if (audit.programmeId === "cse") put(row++, 1, 27, "CSE electives: at least 8 Theory & Algorithms + 8 Systems within 26 total. Surplus from either basket can meet the other 10 elective credits. Online courses and CS projects share an 8-credit discipline-elective cap.", "muted");
  put(row++, 1, 27, "Completed credits are the downloaded audit snapshot. Yellow future-semester cells are editable; planned totals are raw credits, not approved graduation credits. Re-run the app to audit changed coursework.", "muted");
  put(row++, 1, 27, `Source: ${RULESET.source}${audit.programmeId === "cse" ? ", CSE requirements pp. 12–13 and 20" : ""}. Base B.Tech only. Confirm substitutions, course availability and special approvals with your faculty advisor.`, "muted");

  return { name: "Graduation plan", cells, widths, heights, lastRow: row - 1,
    plannedCreditRanges, plannedCategoryRanges, remainingCells,
    categoryLabels: audit.programme.optionIds.map((id) => EXPORT_LABELS[id]), programme: audit.programme.name };
}
