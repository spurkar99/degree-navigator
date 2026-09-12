import { describe, expect, it } from "vitest";
import { parseAll, parseSemester } from "./parser";
import { SAMPLE_TRANSCRIPT } from "./sample";

describe("course parser", () => {
  it("reads the four-semester sample without warnings", () => {
    const result = parseAll(SAMPLE_TRANSCRIPT);
    expect(result.courses).toHaveLength(41);
    expect(result.warnings).toEqual([]);
    expect(result.courses.find((course) => course.code === "CL 328")).toMatchObject({
      semester: 3,
      credits: 2,
    });
  });

  it("ignores Markdown headers and separators", () => {
    const result = parseSemester(
      "| Course No | Course Name | Credit |\n| --- | --- | --- |\n| CL 203 | Process Fluid Mechanics | 3 |",
      4,
    );
    expect(result.courses).toEqual([{
      semester: 4,
      code: "CL 203",
      title: "Process Fluid Mechanics",
      credits: 3,
    }]);
    expect(result.warnings).toEqual([]);
  });

  it("does not count duplicate plain-text rows twice", () => {
    const result = parseSemester(
      "CL203 Process Fluid Mechanics 3\nCL 203 Process Fluid Mechanics 3",
      4,
    );
    expect(result.courses).toHaveLength(1);
    expect(result.warnings[0]).toContain("duplicate CL 203");
  });
});
