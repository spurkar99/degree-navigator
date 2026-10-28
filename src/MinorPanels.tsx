import type { Course } from "./lib/parser";
import type { ProgrammeId } from "./lib/rules";
import { MINOR_LIST, MINOR_SOURCE, minorAllowed, minorHasDetailedRules, minorName, minorNote, type MinorAudit, type MinorId, type MinorPlacement, type MinorPlan } from "./lib/minors";

export function MinorPicker({major,plan,onToggle}: {major: ProgrammeId;plan: MinorPlan;onToggle:(id:MinorId)=>void}) {
  return <div className="minor-picker">
    <details>
      <summary>Optional minors <span>{plan.selected.length ? `${plan.selected.length} selected` : "Choose minors"}</span></summary>
      <p>Select the minors you want to track. You can choose more than one, outside your own major.</p>
      <div className="minor-options">{MINOR_LIST.map(([id,name]) => <label key={id}>
        <input type="checkbox" checked={plan.selected.includes(id)} disabled={!minorAllowed(id,major)} onChange={()=>onToggle(id)} />
        <span>{name}<small>{!minorAllowed(id,major) ? "Your major" : minorHasDetailedRules(id) ? "Published course rules" : "Department-approved course tracker"}</small></span>
      </label>)}</div>
    </details>
    {plan.selected.length>0 && <div className="minor-selected">{plan.selected.map((id)=><span key={id}>{minorName(id)} <button type="button" aria-label={`Remove ${minorName(id)} minor`} onClick={()=>onToggle(id)}>×</button></span>)}</div>}
  </div>;
}

export function MinorCourseChoice({course,plan,onChange}: {course:Course;plan:MinorPlan;onChange:(placement?:MinorPlacement)=>void}) {
  const placement=plan.placements[`${course.semester}:${course.code}`];
  return <td className="minor-course-choice">
    <select aria-label={`Minor for ${course.code}`} value={placement?.minorId??""} onChange={(e)=>onChange(e.target.value?{minorId:e.target.value as MinorId}:undefined)}>
      <option value="">No minor</option>{plan.selected.map((id)=><option key={id} value={id}>{minorName(id)}</option>)}
    </select>
    {placement && <>
      {placement.minorId==="icdt" && <select aria-label={`ICDT basket for ${course.code}`} value={placement.group??""} onChange={(e)=>onChange({...placement,group:e.target.value as MinorPlacement["group"],approved:false})}>
        <option value="">Core / project / choose basket</option><option value="circuits">Circuits elective</option><option value="devices">Materials &amp; Devices elective</option>
      </select>}
      {placement.minorId==="robotics" && <select aria-label={`Robotics category for ${course.code}`} value={placement.group??""} onChange={(e)=>onChange({...placement,group:e.target.value as MinorPlacement["group"],approved:false})}>
        <option value="">Listed course / project</option><option value="special">Approved special topics</option>
      </select>}
      <label><input type="checkbox" checked={placement.approved??false} onChange={(e)=>onChange({...placement,approved:e.target.checked})} aria-label={`Department approval for ${course.code}`} /> Department approval confirmed</label>
    </>}
  </td>;
}

export function MinorResults({audit}: {audit:MinorAudit}) {
  if (!audit.results.length) return null;
  return <div className="panel minors-panel">
    <p className="eyebrow">Additional learning</p><h2>Your minors</h2>
    <p>These credits are tracked separately from your base degree. Up to two qualifying Open Elective courses may be shared across all minors; a course is assigned to one minor here.</p>
    <div className="minor-sharing"><strong>{audit.sharedCourses}/2 Open Elective courses shared</strong><span>{audit.sharedCredits} shared credits · {audit.additionalCredits} minor-only credits · {audit.projectCredits}/16 project credits across base degree and minors</span></div>
    <div className="minor-result-grid">{audit.results.map((r)=><article key={r.id} className="minor-result">
      <div className="minor-result-head"><h3>{r.name}</h3><strong>{r.completed}/20 cr</strong></div>
      <p className={`minor-status ${r.status==="Tracked rules met"?"met":""}`}>{r.status}</p>
      <p>{minorNote(r.id)}</p>
      <p>{r.additional} minor-only credits + {r.shared} shared Open Elective credits. {r.remaining} credits still needed.</p>
      {r.checks.map((c)=><div className="minor-check" key={c.name}><span>{c.name}</span><strong>{Math.min(c.completed,c.required)}/{c.required} {c.unit}</strong></div>)}
      {r.entries.length>0 && <details><summary>Counted courses ({r.entries.length})</summary><ul>{r.entries.map((e)=><li key={e.course.code}>{e.course.code} — {e.course.title}: {e.credits} cr{e.shared?" (shared Open Elective)":""}{e.category==="circuits"?" · Circuits":e.category==="devices"?" · Materials & Devices":""}</li>)}</ul></details>}
      {r.issues.length>0 && <div className="minor-issues"><strong>Review placements</strong><ul>{r.issues.map((issue,index)=><li key={index}>{issue}</li>)}</ul></div>}
    </article>)}</div>
    <p className="minor-source">{MINOR_SOURCE}. “Tracked rules met” is a planning result, not an institute award. Department approval is a student declaration. Missing baskets, renamed courses and exceptions still need department confirmation.</p>
  </div>;
}
