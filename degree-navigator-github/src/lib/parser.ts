export type Course = {
  semester: number;
  code: string;
  title: string;
  credits: number;
};

const COURSE_CODE = /^[A-Z]{2,3}\s*\d{3}(?:-[A-Z0-9]+)?$/i;

export function normalizeCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/^([A-Z]{2,3})\s*(\d{3})/, "$1 $2");
}

function creditsFrom(value: string) {
  const match = value.trim().match(/^\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

export function parseSemester(input: string, semester: number) {
  const courses: Course[] = [];
  const warnings: string[] = [];
  const seen = new Set<string>();

  input.split(/\r?\n/).forEach((rawLine, lineIndex) => {
    const line = rawLine.trim();
    if (!line) return;

    const cells = line.split("|").map((cell) => cell.trim()).filter(Boolean);
    const separator = cells.length > 0 && cells.every((cell) => /^:?-{1,}:?$/.test(cell));
    const header = !COURSE_CODE.test(cells[0] ?? "") &&
      /course\s*no|course\s*name|credit/i.test(cells.join(" "));
    if (!cells.length || separator || header) return;

    let parsed = 0;
    for (let index = 0; index < cells.length; index += 1) {
      if (!COURSE_CODE.test(cells[index])) continue;
      const title = cells[index + 1]?.trim();
      const credits = creditsFrom(cells[index + 2] ?? "");
      if (!title || credits === null) {
        warnings.push(`Semester ${semester}, line ${lineIndex + 1}: incomplete course row.`);
        continue;
      }
      const code = normalizeCode(cells[index]);
      if (seen.has(code)) {
        warnings.push(`Semester ${semester}: duplicate ${code} ignored.`);
        continue;
      }
      seen.add(code);
      courses.push({ semester, code, title, credits });
      parsed += 1;
      index += 2;
    }

    if (!parsed && !line.startsWith("|")) {
      const plain = line.match(
        /^([A-Z]{2,3}\s*\d{3}(?:-[A-Z0-9]+)?)\s+(.+?)\s+(\d+(?:\.\d+)?)$/i,
      );
      if (plain) {
        const code = normalizeCode(plain[1]);
        if (seen.has(code)) {
          warnings.push(`Semester ${semester}: duplicate ${code} ignored.`);
          return;
        }
        seen.add(code);
        courses.push({
          semester,
          code,
          title: plain[2].trim(),
          credits: Number(plain[3]),
        });
      } else {
        warnings.push(`Semester ${semester}, line ${lineIndex + 1}: row not read.`);
      }
    }
  });

  return { courses, warnings };
}

export function parseAll(inputs: Record<number, string>) {
  const results = Object.entries(inputs).map(([semester, input]) =>
    parseSemester(input, Number(semester)),
  );
  return {
    courses: results.flatMap((result) => result.courses),
    warnings: results.flatMap((result) => result.warnings),
  };
}
