import { describe, expect, it } from "vitest";
import { auditCourses, courseKey, type Classifications } from "./audit";
import { buildAuditWorkbook, buildInputTemplateWorkbook } from "./excel";
import { buildGraduationLayout } from "./excel-layout";
import { MINOR_LIST, auditMinors, emptyMinorPlan, minorAllowed, minorHasDetailedRules, type MinorId, type MinorPlacement, type MinorPlan } from "./minors";
import type { Course } from "./parser";
import { PROGRAMMES, type ProgrammeId } from "./rules";

const course=(code:string,credits=4,title=code,kind?:Course["kind"]):Course=>({semester:5,code,title,credits,kind});
function run(id:MinorId,courses:Course[],options:{major?:ProgrammeId;choices?:Classifications;approved?:boolean;groups?:Record<string,MinorPlacement["group"]>}={}) {
  const choices=options.choices??Object.fromEntries(courses.map((c)=>[courseKey(c),"additional" as const]));
  const plan:MinorPlan={selected:[id],placements:Object.fromEntries(courses.map((c)=>[courseKey(c),{minorId:id,approved:options.approved,group:options.groups?.[c.code]}]))};
  const base=auditCourses(courses,choices,options.major??"chemical");
  return {base,plan,choices,audit:auditMinors(courses,choices,base,plan)};
}
const result=(r:ReturnType<typeof run>)=>r.audit.results[0];

describe("minor catalogue and honest coverage",()=>{
  it("includes all 26 advisory minors and distinguishes the ten detailed rule sets",()=>{
    expect(MINOR_LIST).toHaveLength(26);
    expect(new Set(MINOR_LIST.map(([id])=>id)).size).toBe(26);
    expect(MINOR_LIST.filter(([id])=>minorHasDetailedRules(id))).toHaveLength(10);
  });
  it.each(Object.keys(PROGRAMMES) as ProgrammeId[])("excludes the student's own %s major from minors",(id)=>{
    expect(minorAllowed(id as MinorId,id)).toBe(false);
    expect(result(run(id as MinorId,[course("ZZ 601")],{major:id,approved:true})).completed).toBe(0);
  });
  it.each(MINOR_LIST.filter(([id])=>!minorHasDetailedRules(id)).map(([id])=>id))("tracks %s only after approval and never claims unprovided department rules are met",(id)=>{
    const history=Array.from({length:5},(_,i)=>course(`ZZ ${600+i}`));
    expect(result(run(id,history)).completed).toBe(0);
    const r=run(id,history,{approved:true,major:id==="chemical"?"cse":"chemical"});
    expect(result(r).completed).toBe(20);
    expect(result(r).status).toBe("Department review required");
    expect(r.base.allocated).toBe(0);
  });
});

describe("additional credits and shared Open Electives",()=>{
  it("does not subtract or inflate base-degree targets when minors are selected",()=>{
    const r=run("management",[course("MS 408")],{approved:true});
    expect(r.base.totalRequired).toBe(170);
    expect(r.base.allocated).toBe(0);
    expect(r.base.additionalCredits).toBe(4);
    expect(result(r).additional).toBe(4);
  });
  it("blocks HSS and other base baskets from being double-counted",()=>{
    const c=course("MS 408");
    const r=run("management",[c],{approved:true,choices:{[courseKey(c)]:"hss"}});
    expect(r.base.allocated).toBe(4);
    expect(result(r).completed).toBe(0);
    expect(result(r).issues[0]).toContain("Other base baskets cannot also count");
  });
  it("shares at most two COURSES across all minors, not two per minor or a hardcoded eight credits",()=>{
    const history=[course("MS 401",3),course("MS 402",2),course("CH 501",4)];
    const choices=Object.fromEntries(history.map((c)=>[courseKey(c),"open_elective" as const]));
    const base=auditCourses(history,choices);
    const plan:MinorPlan={selected:["management","chemistry"],placements:{
      "5:MS 401":{minorId:"management",approved:true},"5:MS 402":{minorId:"management",approved:true},"5:CH 501":{minorId:"chemistry",approved:true},
    }};
    const a=auditMinors(history,choices,base,plan);
    expect(a.sharedCourses).toBe(2);expect(a.sharedCredits).toBe(7);
    // Deterministic semester/code order puts CH 501 first, then MS 401.
    expect(a.results.find((r)=>r.id==="management")?.completed).toBe(3);
    expect(a.issues.some((s)=>s.includes("two-course"))).toBe(true);
  });
  it("does not use a mandatory base course for a minor even after moving its bucket",()=>{
    const r=run("cse",[course("ES 242")],{major:"ai"});
    expect(result(r).completed).toBe(0);
    expect(result(r).issues[0]).toContain("mandatory base-programme");
    expect(result(r).checks.some((c)=>c.name.startsWith("ES 242"))).toBe(false);
  });
  it("blocks EE's mandatory PH 201 from a physics minor",()=>{
    expect(result(run("physics",[course("PH 201")],{major:"electrical",approved:true})).completed).toBe(0);
  });
  it("counts duplicate course codes once even with a different semester",()=>{
    const c=course("MS 408");const r=run("management",[c,{...c,semester:6}],{approved:true});
    expect(result(r).completed).toBe(4);
  });
  it("counts a shared project once against the global project limit",()=>{
    const p=course("CS 399");const r=run("cse",[p],{approved:true,choices:{[courseKey(p)]:"open_elective"}});
    expect(r.base.projectCredits).toBe(4);
    expect(r.audit.projectCredits).toBe(4);
    expect(r.audit.sharedCredits).toBe(4);
  });
  it("caps minor-only projects using the degree-wide allowance left after the base audit",()=>{
    const history=[course("CL 299",8),course("CE 399",8),course("CS 399",4)];
    const choices:Classifications={"5:CL 299":"open_elective","5:CE 399":"open_elective","5:CS 399":"additional"};
    const base=auditCourses(history,choices);
    const plan:MinorPlan={selected:["cse"],placements:{"5:CS 399":{minorId:"cse",approved:true}}};
    const a=auditMinors(history,choices,base,plan);
    expect(base.projectCredits).toBe(16);expect(a.projectCredits).toBe(16);expect(a.results[0].completed).toBe(0);
  });
  it("rejects short courses, zero-credit activities and stale placements",()=>{
    const r=run("management",[course("SC 368",1),course("IN 105",0)],{approved:true});
    expect(result(r).completed).toBe(0);
    const base=auditCourses([],{});
    expect(auditMinors([],{},base,{selected:[],placements:r.plan.placements}).results).toEqual([]);
  });
});

describe("published minor rules",()=>{
  it("completes Archaeological Sciences from the approved list, including IN courses",()=>{
    const r=run("archaeology",["EH 628","HS 326","HS 425","IN 304","IN 402"].map((c)=>course(c)));
    expect(result(r).completed).toBe(20);expect(result(r).status).toBe("Tracked rules met");
  });
  it("allows one approved archaeology project and rejects a second",()=>{
    const r=run("archaeology",[course("EH 299"),course("EH 399")],{approved:true});
    expect(result(r).completed).toBe(4);expect(result(r).issues[0]).toContain("at most one project");
  });
  it("needs sixteen listed Biomedical credits even when twenty total credits are approved",()=>{
    const r=run("biomedical",["BE 303","BE 304","BE 403","BE 601","ZZ 601"].map((c)=>course(c)),{approved:true});
    expect(result(r).status).toBe("Tracked rules met");
    const missing=run("biomedical",["BE 303","BE 304","BE 403","ZZ 601","ZZ 602"].map((c)=>course(c)),{approved:true});
    expect(result(missing).completed).toBe(20);expect(result(missing).checks[0].completed).toBe(12);expect(result(missing).status).toBe("In progress");
  });
  it("requires the NEW four-credit Numerical Methods course, not MA 203",()=>{
    const r=run("computational_mechanics",[course("ZZ 601",4,"Numerical Methods for Engineers"),course("ES 622"),course("MSE 402"),course("ES 664"),course("EH 618")]);
    expect(result(r).status).toBe("Tracked rules met");
    expect(result(run("computational_mechanics",[course("MA 203",2,"Numerical Methods")])).completed).toBe(0);
  });
  it("caps Computational Mechanics optional courses at three and twelve credits",()=>{
    const r=run("computational_mechanics",["MSE 203","MSE 402","EH 618","ES 664"].map((c)=>course(c)));
    expect(result(r).completed).toBe(12);expect(result(r).issues[0]).toContain("three optional");
  });
  it("uses exact titles for pending computational-course codes without accepting vaguely similar names",()=>{
    const r=run("computational_mechanics",[course("ZZ 601",4,"High Performance Computing"),course("ZZ 602",4,"High Performance Computing Workshop")]);
    expect(result(r).completed).toBe(4);
  });
  it("requires two ICDT cores plus both approved elective baskets",()=>{
    const r=run("icdt",[course("ES 204"),course("EE 227",4,"CMOS Circuit Design"),course("EE 651"),course("ES 672"),course("EE 660")],{approved:true,groups:{"EE 651":"circuits","ES 672":"devices","EE 660":"circuits"}});
    expect(result(r).status).toBe("Tracked rules met");
    const missing=run("icdt",[course("EE 651")],{approved:true});
    expect(result(missing).completed).toBe(0);
  });
  it("does not count the same ICDT core twice under known and title-based codes",()=>{
    const r=run("icdt",[course("ES 204",4,"Wrong pasted title"),course("ZZ 601",4,"Digital Systems")]);
    expect(result(r).completed).toBe(4);expect(result(r).checks[0].completed).toBe(1);
  });
  it("enforces both Quantum mandatory courses and two basket courses",()=>{
    const r=run("quantum",[course("PH 202"),course("ZZ 601",4,"Quantum Technologies - Applications"),course("PH 616"),course("PH 643"),course("PH 399")],{approved:true});
    expect(result(r).status).toBe("Tracked rules met");
    expect(result(run("quantum",[course("PH 616",12),course("PH 643",8)])).status).toBe("In progress");
  });
  it("requires ME 639 / ES 408 and combines Robotics projects with approved special topics under eight credits",()=>{
    const r=run("robotics",[course("ES 408"),course("ES 613"),course("ES 616"),course("ME 399"),course("ME 691-I"),course("ME 499")],{approved:true});
    expect(result(r).completed).toBe(20);expect(result(r).entries.filter((e)=>["project","special"].includes(e.category)).reduce((n,e)=>n+e.credits,0)).toBe(8);
    expect(result(run("robotics",[course("ME 399")])).completed).toBe(0);
  });
  it("requires Sustainable Development courses from at least two thematic areas",()=>{
    const water=["CE 605","CE 611","CE 637","EH 602","EH 612"].map((c)=>course(c));
    expect(result(run("sustainable",water)).status).toBe("In progress");
    water[4]=course("EE 426");expect(result(run("sustainable",water)).status).toBe("Tracked rules met");
  });
  it("does not guess the theme of an unrelated EH 691 special topic",()=>{
    expect(result(run("sustainable",[course("EH 691",4,"Another Special Topic")],{approved:true})).completed).toBe(0);
  });
  it("requires AI mandatory and core courses without reusing CSE-major core",()=>{
    const r=run("ai",["CS 303","ES 244","ES 245","ES 335","CS 328"].map((c)=>course(c)),{major:"cse"});
    expect(result(r).status).toBe("Tracked rules met");
    const blocked=run("ai",[course("ES 204")],{major:"cse"});expect(result(blocked).completed).toBe(0);
    expect(result(run("ai",[course("CS 433",4,"Databases")])).completed).toBe(0);
  });
  it("requires CSE mandatory ES 242 and two core courses for non-AI majors",()=>{
    const r=run("cse",["ES 242","ES 214","ES 204","CS 330","CS 331"].map((c)=>course(c)));
    expect(result(r).status).toBe("Tracked rules met");
  });
  it("waives ES 242 for AI majors without giving four free minor credits",()=>{
    const r=run("cse",["ES 214","CS 202","CS 330","CS 331","CS 614"].map((c)=>course(c)),{major:"ai"});
    expect(result(r).status).toBe("Tracked rules met");expect(result(r).completed).toBe(20);
  });
  it("restricts CSE online courses to approved Swayam-NPTEL further courses",()=>{
    const history=[course("ES 242"),course("ES 214"),course("ES 204"),course("ZZ 601",4,"Approved online elective","online"),course("CS 330")];
    expect(result(run("cse",history,{approved:true})).completed).toBe(16);
    history[3].onlineProvider="swayam_nptel";
    expect(result(run("cse",history,{approved:true})).status).toBe("Tracked rules met");
  });
  it("needs twelve listed Data Analytics credits and independently caps project / NPTEL credits at four",()=>{
    const n=course("ZZ 601",8,"Approved analytics online course","online");n.onlineProvider="swayam_nptel";
    const r=run("data_analytics",[course("BE 614"),course("CE 605"),course("CS 328"),course("CS 399",8),n],{approved:true});
    expect(result(r).completed).toBe(20);
    expect(result(r).checks[0].completed).toBe(12);
    expect(result(r).entries.find((e)=>e.course.code==="CS 399")?.credits).toBe(4);
    expect(result(r).entries.find((e)=>e.course.code==="ZZ 601")?.credits).toBe(4);
  });
});

describe("single-sheet minor exports",()=>{
  it("keeps base totals unchanged and includes selected minor rules, placement and review status on the same worksheet",async()=>{
    const history=["ES 242","ES 214","ES 204","CS 330","CS 331"].map((c)=>course(c));
    const r=run("cse",history);const sheet=buildAuditWorkbook({currentSemester:6},history,r.choices,r.base,[],r.audit);
    expect(sheet.worksheets).toHaveLength(1);expect(sheet.worksheets[0].getCell("A5").result).toBe(170);
    expect(sheet.worksheets[0].getCell("H5").result).toBe(0);
    const layout=buildGraduationLayout({currentSemester:6},history,r.choices,r.base,[],false,r.audit);
    expect(layout.cells.some((c)=>c.value==="Tracked rules met")).toBe(true);
    expect(layout.cells.some((c)=>String(c.value).includes("CS 330 4 cr"))).toBe(true);
    expect(new Set(layout.cells.map((c)=>c.range)).size).toBe(layout.cells.length);
    expect((await sheet.xlsx.writeBuffer()).byteLength).toBeGreaterThan(8000);
    expect(sheet.worksheets[0].pageSetup.fitToHeight).toBe(1);
  });
  it("supports every selected minor in a blank one-sheet template without hiding unknown rule coverage",()=>{
    const plan=emptyMinorPlan();plan.selected=MINOR_LIST.map(([id])=>id).filter((id)=>id!=="chemical");
    const w=buildInputTemplateWorkbook("chemical",plan);expect(w.worksheets).toHaveLength(1);
    const values:string[]=[];w.worksheets[0].eachRow((row)=>row.eachCell((c)=>{if(typeof c.value==="string")values.push(c.value);}));
    expect(values.some((v)=>v.includes("Management — 0/20"))).toBe(true);
    expect(values).toContain("Department review required");
    expect(values.some((v)=>v.includes("Quantum Technologies — 0/20"))).toBe(true);
  });
});
