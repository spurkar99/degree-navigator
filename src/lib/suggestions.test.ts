import { describe, expect, it } from "vitest";
import { auditCourses, courseKey } from "./audit";
import { parseAll } from "./parser";
import { SAMPLE_TRANSCRIPT } from "./sample";
import { buildSuggestions } from "./suggestions";

describe("planning suggestions", () => {
  it("prioritizes unresolved classifications", () => {
    const audit = auditCourses(parseAll(SAMPLE_TRANSCRIPT).courses, {});
    const suggestions = buildSuggestions(audit, 4);
    expect(suggestions[0].priority).toBe("Action needed");
    expect(suggestions[0].title).toContain("Classify 1 course");
  });

  it("shows requirement-level planning after classification", () => {
    const courses = parseAll(SAMPLE_TRANSCRIPT).courses;
    const es418 = courses.find((course) => course.code === "ES 418")!;
    const audit = auditCourses(courses, { [courseKey(es418)]: "open_elective" });
    const suggestions = buildSuggestions(audit, 4);
    expect(suggestions.some((item) => item.title.includes("ChE Discipline Electives"))).toBe(true);
    expect(suggestions.some((item) => item.detail.includes("course offering"))).toBe(false);
  });
});
