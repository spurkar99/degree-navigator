import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  CheckCircle2,
  ClipboardPaste,
  GraduationCap,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import {
  ambiguousCourses,
  auditCourses,
  courseKey,
  type Classifications,
} from "./lib/audit";
import { TOTAL_REQUIRED, type BasketId } from "./lib/rules";
import { parseAll, parseSemester, type Course } from "./lib/parser";

type Stage = "profile" | "courses" | "audit";

const SAMPLE: Record<number, string> = {
  1: `| ES 101 | Engineering Graphics | 3 |
| ES 112 | Computing | 3 |
| ES 115 | Design, Innovation, and Prototyping | 5 |
| ES 118 | Materials for the Future | 3 |
| FP 100 | Foundation Programme | 4 |
| HS 191 | Introduction to Writing I | 2 |
| HS 201 | World Civilizations and Cultures | 4 |
| IN 101 | Comprehensive Viva Voce | 0 |
| MA 103 | Calculus of Single Variable and Linear Algebra | 4 |
| PE 101 | Physical Education | 0 |
| SC 368 | Introduction to Web Development | 1 |`,
  2: `| BS 192 | Undergraduate Science Laboratory | 3 |
| ES 113 | Data-Centric Computing | 3 |
| ES 114 | Probability, Statistics, and Data Visualization | 3 |
| ES 116 | Principles and Applications of Electrical Engineering | 5 |
| ES 117 | The World of Engineering | 2 |
| GE 101 | General Education I | 2 |
| HS 192 | Introduction to Writing II | 2 |
| IN 102 | Comprehensive Viva Voce | 0 |
| MA 104 | Ordinary Differential Equations | 2 |
| PE 102 | Physical Education | 0 |
| CL 201 | Chemical Process Calculations | 3 |`,
  3: `| CL 328 | Chemical Engineering Practice in Industry | 2 |
| ES 211 | Thermodynamics | 3 |
| ES 243 | Biology for Engineers | 4 |
| GE 201 | General Education II | 2 |
| HS 221 | Introduction to Philosophy | 4 |
| IN 103 | Comprehensive Viva Voce | 0 |
| MA 205 | Calculus of Several Variables | 2 |
| MS 408 | Financial Considerations In Engineering Decisions | 4 |
| PE 103 | Physical Education | 0 |
| CL 202 | Chemical Engineering Thermodynamics | 3 |`,
  4: `| CL 203 | Process Fluid Mechanics | 3 |
| CL 204 | Heat Transfer | 3 |
| CL 205 | Chemical Reaction Engineering I | 3 |
| EH 612 | Ocean and Global Change | 4 |
| ES 418 | Financial Modeling and Engineering | 4 |
| IN 104 | Comprehensive Viva Voce | 0 |
| MA 203 | Numerical Methods | 2 |
| MS 491-XVI | Special Topics in Management: Lean Six Sigma | 4 |
| PE 104 | Physical Education | 0 |`,
};

const OPTIONS: { value: BasketId; label: string; note: string }[] = [
  { value: "chemical_elective", label: "ChE Discipline Elective", note: "Approved toward the 20-credit ChE elective basket" },
  { value: "hss", label: "HSS / Management Elective", note: "Approved Humanities, Social Science or Management elective" },
  { value: "science", label: "Science / BS Elective", note: "Approved Science basket or Basic Science elective" },
  { value: "open_project", label: "Open Project", note: "The required 4-credit open project course" },
  { value: "open_elective", label: "Open Elective", note: "Counts toward the 16-credit open elective basket" },
  { value: "excluded", label: "Does not count", note: "Appears on the transcript but not in graduation credits" },
  { value: "unresolved", label: "I'm not sure", note: "Keep it visible for review without guessing" },
];

function Steps({ stage }: { stage: Stage }) {
  const index = stage === "profile" ? 1 : stage === "courses" ? 2 : 3;
  return (
    <nav className="steps" aria-label="Audit steps">
      {["Profile", "Courses", "Audit"].map((label, item) => {
        const step = item + 1;
        return (
          <div className="step-wrap" key={label}>
            {item > 0 && <span className="step-line" />}
            <span className={`step ${step === index ? "active" : ""} ${step < index ? "done" : ""}`}>
              <span className="step-number">{step < index ? <Check size={15} /> : step}</span>
              <span>{label}</span>
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
      <span style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

export default function App() {
  const [stage, setStage] = useState<Stage>("profile");
  const [current, setCurrent] = useState("");
  const [inputs, setInputs] = useState<Record<number, string>>({});
  const [courses, setCourses] = useState<Course[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [choices, setChoices] = useState<Classifications>({});
  const [questions, setQuestions] = useState<Course[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<BasketId | "">("");
  const [showQuestion, setShowQuestion] = useState(false);

  const completed = Math.max(0, Number(current || 0) - 1);
  const semesters = Array.from({ length: completed }, (_, index) => index + 1);
  const audit = useMemo(() => auditCourses(courses, choices), [courses, choices]);
  const question = questions[questionIndex];

  function continueToCourses() {
    const next = { ...inputs };
    semesters.forEach((semester) => {
      if (next[semester] === undefined) next[semester] = "";
    });
    setInputs(next);
    setStage("courses");
  }

  function loadSample() {
    setCurrent("5");
    setInputs(SAMPLE);
    setStage("courses");
  }

  function analyze() {
    const parsed = parseAll(inputs);
    const uncertain = ambiguousCourses(parsed.courses);
    setCourses(parsed.courses);
    setWarnings(parsed.warnings);
    setChoices({});
    setQuestions(uncertain);
    setQuestionIndex(0);
    setSelected("");
    if (uncertain.length) setShowQuestion(true);
    else setStage("audit");
  }

  function confirmChoice() {
    if (!selected || !question) return;
    setChoices((existing) => ({ ...existing, [courseKey(question)]: selected }));
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((value) => value + 1);
      setSelected("");
    } else {
      setShowQuestion(false);
      setStage("audit");
    }
  }

  function reset() {
    setStage("profile");
    setCurrent("");
    setInputs({});
    setCourses([]);
    setWarnings([]);
    setChoices({});
    setQuestions([]);
  }

  const canAnalyze =
    semesters.length > 0 &&
    semesters.every((semester) => parseSemester(inputs[semester] ?? "", semester).courses.length);

  return (
    <main>
      <header className="topbar">
        <div className="shell brand-row">
          <div className="brand">
            <span className="brand-icon"><GraduationCap size={22} /></span>
            <div><strong>Degree Navigator</strong><small>IIT Gandhinagar</small></div>
          </div>
          <span className="cohort">ChE · 2024–28</span>
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
                Your course tables are processed in this browser.
              </p>
              <div className="panel form-panel">
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
                  ["Exact requirement matching", "Fixed institute, Math and ChE core courses"],
                  ["No silent guesses", "You confirm any course we cannot place"],
                  ["Non-credit checks", "Physical Education and semester viva records"],
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
                <button className="button secondary" onClick={loadSample}><ClipboardPaste size={18} /> Use example</button>
                <button className="button primary" disabled={!canAnalyze} onClick={analyze}>
                  Review my courses <ArrowRight size={18} />
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
                <p>{courses.length} courses read across {completed} completed semesters.</p>
              </div>
              <div className="head-actions">
                <button className="button secondary" onClick={() => setStage("courses")}><ArrowLeft size={18} /> Edit courses</button>
                <button className="button text" onClick={reset}><RotateCcw size={18} /> Start over</button>
              </div>
            </div>

            {(audit.unresolved.length > 0 || warnings.length > 0) && (
              <div className="warning">
                <AlertTriangle size={20} />
                <div><strong>Review needed</strong><p>
                  {!!audit.unresolved.length && `${audit.unresolved.length} course(s) remain unclassified. `}
                  {!!warnings.length && `${warnings.length} pasted row(s) could not be read.`}
                </p></div>
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

            <div className="bottom-grid">
              <div className="panel missing">
                <h2>Missing fixed courses</h2>
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
                <p><CheckCircle2 size={17} /> Fixed courses were matched by course code.</p>
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

      {showQuestion && question && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="classification-title">
            <span className="modal-icon"><AlertTriangle size={21} /></span>
            <h2 id="classification-title">Where should this course count?</h2>
            <p>We could not place it confidently, so no basket has been selected for you.</p>
            <div className="course-question">
              <b>{question.code}</b><strong>{question.title}</strong>
              <span>Semester {question.semester} · {question.credits} credits</span>
            </div>
            <div className="options">
              {OPTIONS.map((option) => (
                <label className={selected === option.value ? "selected" : ""} key={option.value}>
                  <input
                    type="radio"
                    name="classification"
                    value={option.value}
                    checked={selected === option.value}
                    onChange={() => setSelected(option.value)}
                  />
                  <span><strong>{option.label}</strong><small>{option.note}</small></span>
                </label>
              ))}
            </div>
            <div className="modal-actions">
              <button className="button secondary" onClick={() => setShowQuestion(false)}>Back to courses</button>
              <button className="button primary" disabled={!selected} onClick={confirmChoice}>
                Confirm {questions.length > 1 ? `(${questionIndex + 1} of ${questions.length})` : ""}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
