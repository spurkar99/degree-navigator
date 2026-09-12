import type { ReturnTypeOfAudit } from "./types";

export type SuggestionPriority = "Action needed" | "Next priority" | "Plan ahead" | "Complete";

export type Suggestion = {
  priority: SuggestionPriority;
  title: string;
  detail: string;
};

const priorityOrder: Record<SuggestionPriority, number> = {
  "Action needed": 0,
  "Next priority": 1,
  "Plan ahead": 2,
  Complete: 3,
};

export function buildSuggestions(audit: ReturnTypeOfAudit, completedSemesters: number): Suggestion[] {
  const suggestions: Suggestion[] = [];

  if (audit.unresolved.length) {
    suggestions.push({
      priority: "Action needed",
      title: `Classify ${audit.unresolved.length} course${audit.unresolved.length === 1 ? "" : "s"}`,
      detail: `${audit.pending} credits are not included until their requirement basket is confirmed.`,
    });
  }

  audit.missingGroups.forEach((group) => {
    const codes = group.courses.map((course) => course.code);
    suggestions.push({
      priority: "Next priority",
      title: `Complete ${group.name}`,
      detail: `Still missing: ${codes.slice(0, 5).join(", ")}${codes.length > 5 ? ` and ${codes.length - 5} more` : ""}.`,
    });
  });

  const planningBaskets = new Set(["hss", "science", "open_project", "open_elective", "chemical_elective"]);
  audit.progress
    .filter((item) => item.remaining > 0 && planningBaskets.has(item.id))
    .forEach((item) => {
      suggestions.push({
        priority: "Plan ahead",
        title: `Plan ${item.remaining} more ${item.name} credit${item.remaining === 1 ? "" : "s"}`,
        detail: `You have ${item.completed} of ${item.required} credits currently placed in this requirement.`,
      });
    });

  if (audit.pe < 4) {
    suggestions.push({
      priority: "Plan ahead",
      title: `Complete ${4 - audit.pe} remaining PE requirement${4 - audit.pe === 1 ? "" : "s"}`,
      detail: `The audit found ${audit.pe} of the four mandatory Physical Education records.`,
    });
  }

  if (audit.viva < completedSemesters) {
    suggestions.push({
      priority: "Action needed",
      title: "Verify missing viva records",
      detail: `The audit found ${audit.viva} viva records across ${completedSemesters} completed semesters.`,
    });
  }

  if (!suggestions.length) {
    suggestions.push({
      priority: "Complete",
      title: "All tracked base-degree requirements are complete",
      detail: "Confirm final eligibility and any special approvals with Academic Affairs.",
    });
  }

  return suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}
