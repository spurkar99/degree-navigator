import { describe, expect, it } from "vitest";
import { auditCourses, autoClassify, courseKey, resolveBasket } from "./audit";
import { parseAll } from "./parser";
import { SAMPLE_TRANSCRIPT } from "./sample";

describe("Chemical Engineering 2024–28 audit", () => {
  const courses = parseAll(SAMPLE_TRANSCRIPT).courses;
  const es418 = courses.find((course) => course.code === "ES 418")!;

  it("asks for an unknown course instead of guessing", () => {
    expect(autoClassify(es418)).toBeNull();
    expect(resolveBasket(es418, {})).toBe("unresolved");
  });

  it("recognizes CL 328 as a ChE discipline elective", () => {
    const cl328 = courses.find((course) => course.code === "CL 328")!;
    expect(autoClassify(cl328)).toBe("chemical_elective");
  });

  it("reproduces the expected sample audit", () => {
    const audit = auditCourses(courses, { [courseKey(es418)]: "open_elective" });
    expect(audit.allocated).toBe(100);
    expect(audit.remaining).toBe(70);
    expect(audit.excludedCredits).toBe(1);
    expect(audit.pe).toBe(4);
    expect(audit.viva).toBe(4);
    expect(audit.unresolved).toEqual([]);
    expect(audit.progress.find((item) => item.id === "chemical_elective")?.completed).toBe(2);
    expect(audit.progress.find((item) => item.id === "open_elective")?.completed).toBe(4);
  });

  it("allows a student selection to override an automatic classification", () => {
    const cl328 = courses.find((course) => course.code === "CL 328")!;
    expect(resolveBasket(cl328, { [courseKey(cl328)]: "open_elective" })).toBe("open_elective");
  });
});
