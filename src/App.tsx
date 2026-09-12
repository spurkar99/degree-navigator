import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  CheckCircle2,
  ClipboardPaste,
  Download,
  FileSpreadsheet,
  GraduationCap,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  auditCourses,
  autoClassify,
  classificationSource,
  courseKey,
  type Classifications,
} from "./lib/audit";
import { normalizeCode, parseAll, parseSemester, type Course } from "./lib/parser";
import { BASKET_LABELS, TOTAL_REQUIRED, type BasketId } from "./lib/rules";
import { SAMPLE_TRANSCRIPT } from "./lib/sample";
import { buildSuggestions } from "./lib/suggestions";

type Stage = "profile" | "courses" | "review" | "audit";

const OPTION_IDS: BasketId[] = [
  "foundation", "institute", "mathematics", "hss", "science",
  "open_project", "open_elective", "chemical_core", "chemical_elective",
  "excluded", "unresolved",
];

function Steps({ stage }: { stage: Stage }) {
  const labels: { id: Stage; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "courses", label: "Courses" },
    { id: "review", label: "Review" },
    { id: "audit", label: "Audit" },
  ];
  const index = labels.findIndex((item) => item.id === stage) + 1;

  return (
    <nav className="steps" aria-label="Audit steps">
      {labels.map((item, itemIndex) => {
        const step = itemIndex + 1;
        return (
          <div className="step-wrap" key={item.id}>
            {itemIndex > 0 && <span className="step-line" />}
            <span className={`step ${step === index ? "active" : ""} ${step < index ? "done" : ""}`}>
              <span className="step-number">{step < index ? <Check size={15} /> : step}</span>
              <span>{item.label}</span>
            </span>
          </div>
        );
      })}
    </nav>
  );
}

function Bar({ value }: { value: number }) {
  return (
    <div className="bar" aria-label={`${Math.round(value)} percent`}>
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export default function App() {
  const [stage, setStage] = useState<Stage>("profile");
  const [studentName, setStudentName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [current, setCurrent] = useState("");
  const [inputs, setInputs] = useState<Record<number, string>>({});
  const [courses, setCourses] = useState<Course[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [choices, setChoices] = useState<Classifications>({});
  const [exporting, setExporting] = useState(false);

  const completed = Math.max(0, Number(current || 0) - 1);
  const semesters = Array.from({ length: completed }, (_, index) => index + 1);
  const audit = useMemo(() => auditCourses(courses, choices), [courses, choices]);
  const suggestions = useMemo(() => buildSuggestions(audit, completed), [audit, completed]);
  const coursesNeedingAnswers = courses.filter(
    (course) => autoClassify(course) === null && choices[courseKey(course)] === undefined,
  );

  function continueToCourses() {
    const next = { ...inputs };
    semesters.forEach((semester) => {
      if (next[semester] === undefined) next[semester] = "";
    });
    setInputs(next);
    setStage("courses");
  }

  function loadSample() {
    setStudentName("Example Student");
    setRollNumber("24110000");
    setCurrent("5");
    setInputs(SAMPLE_TRANSCRIPT);
    setStage("courses");
  }

  function analyze() {
    const parsed = parseAll(inputs);
    setCourses(parsed.courses);
    setWarnings(parsed.warnings);
    setChoices({});
    setStage("review");
  }

  function updateCourse(index: number, update: Partial<Course>) {
    const previous = courses[index];
    const oldKey = courseKey(previous);
    setCourses((existing) => existing.map((course, courseIndex) => (
      courseIndex === index ? { ...course, ...update } : course
    )));
    if (update.code !== undefined || update.semester !== undefined) {
      setChoices((existing) => {
        const next = { ...existing };
        delete next[oldKey];
        return next;
      });
    }
  }

  function removeCourse(index: number) {
    const key = courseKey(courses[index]);
    setCourses((existing) => existing.filter((_, courseIndex) => courseIndex !== index));
    setChoices((existing) => {
      const next = { ...existing };
      delete next[key];
      return next;
    });
  }

  function addCourse() {
    setCourses((existing) => [...existing, {
      semester: Math.max(1, completed), code: "", title: "", credits: 0,
    }]);
  }

  function setClassification(course: Course, basket: BasketId | "") {
    const key = courseKey(course);
    setChoices((existing) => {
      const next = { ...existing };
      if (!basket) delete next[key];
      else next[key] = basket;
      return next;
    });
  }

  async function exportAudit() {
    setExporting(true);
    try {
      const { downloadAuditWorkbook } = await import("./lib/excel");
      await downloadAuditWorkbook(
        { name: studentName, rollNumber, currentSemester: Number(current) },
        courses, choices, audit, suggestions,
      );
    } finally {
      setExporting(false);
    }
  }

  async function exportTemplate() {
    const { downloadInputTemplate } = await import("./lib/excel");
    await downloadInputTemplate();
  }

  function reset() {
    setStage("profile");
    setStudentName("");
    setRollNumber("");
    setCurrent("");
    setInputs({});
    setCourses([]);
    setWarnings([]);
    setChoices({});
  }

  const canAnalyze = semesters.length > 0 && semesters.every(
    (semester) => parseSemester(inputs[semester] ?? "", semester).courses.length,
  );
  const validCourses = courses.length > 0 && courses.every(
    (course) => course.code.trim() && course.title.trim() && Number.isFinite(course.credits) && course.credits >= 0,
  );
  const canAudit = validCourses && coursesNeedingAnswers.length === 0;

  return (
    <main>
      <header className="topbar">
        <div className="shell brand-row">
          <div className="brand">
            <span className="brand-icon"><GraduationCap size={22} /></span>
            <div><strong>Degree Navigator</strong><small>IIT Gandhinagar</small></div>
          </div>
          <span className="cohort">ChE · 2024–28 · v0.2</span>
        </div>
      </header>

      <div className="shell page">
        <Steps stage={stage} />

        {stage === "profile" && (
          <section className="profile-grid">
            <div>
              <p className="eyebrow">Start your audit</p>
              <h1>See exactly what you’ve finished—and what is left.</h1>
              <p className="lede">
                Built for B.Tech Chemical Engineering students admitted in 2024.
                Your course tables and Excel files are processed in this browser.
              </p>
              <div className="panel form-panel">
                <div className="form-grid">
                  <label>
                    <span>Name <small>optional</small></span>
                    <input value={studentName} onChange={(event) => setStudentName(event.target.value)} placeholder="Your name" />
                  </label>
                  <label>
                    <span>Roll number <small>optional</small></span>
                    <input value={rollNumber} onChange={(event) => setRollNumber(event.target.value)} placeholder="24XXXXXX" />
                  </label>
                </div>
                <label htmlFor="semester">Which semester are you currently in?</label>
                <p>We’ll create one paste field for every completed semester.</p>
                <select id="semester" value={current} onChange={(event) => setCurrent(event.target.value)}>
                  <option value="">Select current semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                    <option key={semester} value={semester}>Semester {semester}</option>
                  ))}
                </select>
                {current === "1" && <span className="field-note">There is no completed semester to audit yet.</span>}
                <button className="button primary wide" disabled={!current || current === "1"} onClick={continueToCourses}>
                  Continue to course entry <ArrowRight size={18} />
                </button>
                <button className="button text wide" onClick={loadSample}>Load the four-semester example</button>
                <button className="button text wide" onClick={() => void exportTemplate()}>
                  <FileSpreadsheet size={18} /> Download blank Excel template
                </button>
              </div>
            </div>
            <aside className="summary-card">
              <div className="summary-head">
                <span>Base B.Tech requirement</span>
                <strong>170</strong>
                <small>graduation credits</small>
              </div>
              <div className="summary-list">
                {[
                  ["Review before calculating", "Correct every parsed course and requirement basket"],
                  ["Downloadable workbook", "Keep or share a six-sheet personalised audit"],
                  ["No silent guesses", "You confirm any course we cannot place"],
                ].map(([title, note]) => (
                  <div className="summary-item" key={title}>
                    <CheckCircle2 size={20} />
                    <div><strong>{title}</strong><span>{note}</span></div>
                  </div>
                ))}
              </div>
            </aside>
          </section>
        )}

        {stage === "courses" && (
          <section>
            <div className="section-head">
              <div>
                <p className="eyebrow">Completed coursework</p>
                <h1>Paste one semester at a time</h1>
                <p>Copy the three-column table from the student portal. Headers and table separators are fine.</p>
              </div>
              <span className="cohort light">Currently in semester {current}</span>
            </div>

            <div className="semester-list">
              {semesters.map((semester) => {
                const count = parseSemester(inputs[semester] ?? "", semester).courses.length;
                return (
                  <article className="panel semester-card" key={semester}>
                    <div className="semester-head">
                      <span className="semester-number">{semester}</span>
                      <div><h2>Semester {semester}</h2><p>Paste the completed-course table</p></div>
                      {!!count && <span className="read-count">{count} {count === 1 ? "course" : "courses"} read</span>}
                    </div>
                    <textarea
                      value={inputs[semester] ?? ""}
                      onChange={(event) => setInputs((existing) => ({ ...existing, [semester]: event.target.value }))}
                      placeholder={"| ES 101 | Engineering Graphics | 3 |\n| ES 112 | Computing | 3 |"}
                      aria-label={`Semester ${semester} course table`}
                    />
                  </article>
                );
              })}
            </div>

            <div className="action-bar">
              <button className="button text" onClick={() => setStage("profile")}><ArrowLeft size={18} /> Back</button>
              <div>
                <button className="button secondary" onClick={() => void exportTemplate()}><Download size={18} /> Excel template</button>
                <button className="button secondary" onClick={loadSample}><ClipboardPaste size={18} /> Use example</button>
                <button className="button primary" disabled={!canAnalyze} onClick={analyze}>
                  Review parsed courses <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </section>
        )}

        {stage === "review" && (
          <section>
            <div className="section-head">
              <div>
                <p className="eyebrow">Check before calculating</p>
                <h1>Review every parsed course</h1>
                <p>Edit incorrect values, remove extra rows and answer any classification questions.</p>
              </div>
              <span className="cohort light">{courses.length} courses found</span>
            </div>

            {!!warnings.length && (
              <div className="warning">
                <AlertTriangle size={20} />
                <div><strong>{warnings.length} pasted row{warnings.length === 1 ? " needs" : "s need"} attention</strong>
                  {warnings.map((warning) => <p key={warning}>{warning}</p>)}
                </div>
              </div>
            )}

            {!!coursesNeedingAnswers.length && (
              <div className="warning">
                <AlertTriangle size={20} />
                <div><strong>We are not sure where {coursesNeedingAnswers.length} course{coursesNeedingAnswers.length === 1 ? "" : "s"} should count.</strong>
                  <p>Choose a requirement below, or explicitly select “I’m not sure”. Nothing will be guessed.</p>
                </div>
              </div>
            )}

            <div className="panel review-panel">
              <div className="review-table-wrap">
                <table className="review-table">
                  <thead><tr><th>Sem</th><th>Course code</th><th>Course name</th><th>Credits</th><th>Requirement</th><th>Source</th><th aria-label="Delete" /></tr></thead>
                  <tbody>
                    {courses.map((course, index) => {
                      const automatic = autoClassify(course);
                      const value = choices[courseKey(course)] ?? automatic ?? "";
                      const source = classificationSource(course, choices);
                      return (
                        <tr key={index} className={!value ? "needs-answer" : ""}>
                          <td><input className="cell-number" type="number" min="1" max="8" value={course.semester} onChange={(event) => updateCourse(index, { semester: Number(event.target.value) })} /></td>
                          <td><input className="cell-code" value={course.code} onChange={(event) => updateCourse(index, { code: event.target.value.toUpperCase() })} onBlur={(event) => updateCourse(index, { code: normalizeCode(event.target.value) })} /></td>
                          <td><input value={course.title} onChange={(event) => updateCourse(index, { title: event.target.value })} /></td>
                          <td><input className="cell-number" type="number" min="0" step="0.5" value={course.credits} onChange={(event) => updateCourse(index, { credits: Number(event.target.value) })} /></td>
                          <td>
                            <select value={value} onChange={(event) => setClassification(course, event.target.value as BasketId | "")}>
                              <option value="">Choose category…</option>
                              {OPTION_IDS.map((id) => <option key={id} value={id}>{BASKET_LABELS[id]}</option>)}
                            </select>
                          </td>
                          <td><span className={`source-tag ${source === "Needs review" ? "pending" : ""}`}>{source}</span></td>
                          <td><button className="icon-button" onClick={() => removeCourse(index)} aria-label={`Delete ${course.code}`}><Trash2 size={17} /></button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button className="button text add-course" onClick={addCourse}><Plus size={17} /> Add a missing course</button>
            </div>

            <div className="action-bar">
              <button className="button text" onClick={() => setStage("courses")}><ArrowLeft size={18} /> Edit pasted tables</button>
              <div>
                {!validCourses && <span className="action-note">Complete every course row.</span>}
                {!!coursesNeedingAnswers.length && <span className="action-note">Answer {coursesNeedingAnswers.length} classification question{coursesNeedingAnswers.length === 1 ? "" : "s"}.</span>}
                <button className="button primary" disabled={!canAudit} onClick={() => setStage("audit")}>
                  Calculate my audit <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </section>
        )}

        {stage === "audit" && (
          <section>
            <div className="section-head">
              <div>
                <p className="eyebrow">Your degree audit</p>
                <h1>{audit.allocated} of {TOTAL_REQUIRED} credits placed</h1>
                <p>{courses.length} courses reviewed across {completed} completed semesters.</p>
              </div>
              <div className="head-actions">
                <button className="button secondary" onClick={() => setStage("review")}><ArrowLeft size={18} /> Review courses</button>
                <button className="button primary" disabled={exporting} onClick={() => void exportAudit()}>
                  <FileSpreadsheet size={18} /> {exporting ? "Preparing Excel…" : "Download Excel audit"}
                </button>
                <button className="button text" onClick={reset}><RotateCcw size={18} /> Start over</button>
              </div>
            </div>

            {audit.unresolved.length > 0 && (
              <div className="warning">
                <AlertTriangle size={20} />
                <div><strong>Review needed</strong><p>{audit.unresolved.length} course(s), worth {audit.pending} credits, remain unclassified.</p></div>
              </div>
            )}

            <div className="audit-grid">
              <aside className="audit-side">
                <div className="progress-card">
                  <div className="progress-title">
                    <div><span>Graduation progress</span><strong>{Math.round(audit.allocated / TOTAL_REQUIRED * 100)}%</strong></div>
                    <BookOpenCheck size={28} />
                  </div>
                  <Bar value={audit.allocated / TOTAL_REQUIRED * 100} />
                  <div className="progress-stat"><span>Remaining</span><strong>{audit.remaining} credits</strong></div>
                  {!!audit.pending && <div className="progress-stat"><span>Awaiting classification</span><strong>{audit.pending} credits</strong></div>}
                </div>
                <div className="panel activity-card">
                  <h2><ShieldCheck size={20} /> Non-credit requirements</h2>
                  <div className="activity"><span>Physical Education</span><strong>{audit.pe}/4</strong></div>
                  <Bar value={audit.pe / 4 * 100} />
                  <div className="activity"><span>Viva records found</span><strong>{audit.viva}/{completed}</strong></div>
                  <Bar value={completed ? audit.viva / completed * 100 : 0} />
                </div>
                {!!audit.excludedCredits && (
                  <div className="panel excluded"><strong>{audit.excludedCredits} short-course credit excluded.</strong> It remains on the transcript but does not count toward 170 credits.</div>
                )}
              </aside>

              <div className="panel requirements">
                <h2>Requirement breakdown</h2>
                <p>Credits are counted once within the base degree.</p>
                <div className="requirement-list">
                  {audit.progress.map((item) => (
                    <div className="requirement" key={item.id}>
                      <div className="requirement-top">
                        <div><strong>{item.name} {item.remaining === 0 && <CheckCircle2 size={16} />}</strong><span>{item.note}</span></div>
                        <div><strong>{item.completed}/{item.required}</strong><span>{item.remaining ? `${item.remaining} left` : "Complete"}</span></div>
                      </div>
                      <Bar value={item.completed / item.required * 100} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="panel suggestions-panel">
              <div className="suggestions-head"><div><p className="eyebrow">Plan ahead</p><h2>Suggested next actions</h2></div><Sparkles size={24} /></div>
              <p className="suggestions-note">These suggestions use requirement gaps only. They do not assume future course availability, prerequisites or approvals.</p>
              <div className="suggestion-list">
                {suggestions.map((suggestion) => (
                  <article key={`${suggestion.priority}:${suggestion.title}`}>
                    <span>{suggestion.priority}</span>
                    <div><strong>{suggestion.title}</strong><p>{suggestion.detail}</p></div>
                  </article>
                ))}
              </div>
            </div>

            <div className="bottom-grid">
              <div className="panel missing">
                <h2>Missing fixed courses</h2>
                {!audit.missingGroups.length && <p className="empty-state">No missing fixed courses found.</p>}
                {audit.missingGroups.map((group) => (
                  <div className="missing-group" key={group.id}>
                    <h3>{group.name}</h3>
                    <div>{group.courses.map((course) => (
                      <span key={course.code}><b>{course.code}</b> · {course.credits} cr</span>
                    ))}</div>
                  </div>
                ))}
              </div>
              <div className="panel method">
                <h2>How this result was calculated</h2>
                <p><CheckCircle2 size={17} /> You reviewed every parsed course before calculation.</p>
                <p><CheckCircle2 size={17} /> CL 328 was recognized as a ChE discipline elective.</p>
                <p><CheckCircle2 size={17} /> Uncertain courses were classified only after your answer.</p>
                <small>
                  Planning aid based on Academic Affairs Advisory No. 13 (January 2025).
                  Confirm unusual approvals, substitutions and exceptions with your faculty advisor or Academic Affairs.
                </small>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
