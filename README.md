# Degree Navigator

A browser-based graduation audit for IIT Gandhinagar B.Tech students admitted in AY 2024–25.

## Supported majors

- Chemical Engineering: 170 credits, including 42 discipline-core and 20 discipline-elective credits.
- Computer Science and Engineering: 170 credits, including 36 discipline-core and 26 discipline-elective credits.
- Artificial Intelligence: 172 credits, including 44 discipline-core and 20 discipline-elective credits.
- Civil Engineering: 170 credits, including 42 core, 12 Design / Applications and 8 General CE elective credits.
- Electrical Engineering: 170 credits, including 42 core and 20 discipline-elective credits.
- Integrated Circuit Design and Technology (ICDT): 172 credits, including 44 core and 20 discipline-elective credits.
- Materials Engineering: 170 credits, including 42 core and 20 discipline-elective credits.
- Mechanical Engineering: 172 credits, including 44 core and 20 discipline-elective credits.

Select the major on the profile screen. Course classification, fixed-course checks,
planning suggestions, examples, and Excel exports use that programme's rules.
This version covers the base B.Tech degree only; minors and honours are outside its scope.

## CSE requirements

Based on Academic Affairs Advisory No. 13 (January 2025): pp. 12–13 define the
CSE requirements and elective baskets; p. 20 supplies core course codes and a
sample academic path.

- Nine compulsory core courses of 4 credits each.
- At least 8 Theory & Algorithms credits and at least 8 Systems credits.
- Another 10 elective credits, which may include surplus from either basket.
  Credits are counted once: the two minimum baskets plus this remainder total 26.
- Online courses and CS project courses together can contribute at most 8 credits
  toward CSE discipline electives. Mark course type during review; CS 299/399/499
  are automatically treated as projects. This cap does not consume the separate
  Open Project requirement. Limited credits are placed in semester/code order;
  review excess courses for another approved placement.
- The advisory permits all CS elective courses and explicitly lists certain
  non-CS electives. Unknown non-CS courses need student review; new assignments
  to Theory & Algorithms or Systems require an approved classification.

Lists reflect the supplied January 2025 advisory, not a live course catalogue.
Future course availability, prerequisites, substitutions and special approvals
are not inferred.

## AI requirements

Based on Advisory 13 (January 2025), pp. 10–11 and the sample path on p. 17:

- Eleven compulsory core courses of 4 credits each (44 credits).
- Twenty discipline-elective credits, including at least 4 from the AI CSE basket.
- Surplus CSE-basket credits can meet the remaining 16 AI elective credits once.
- Online courses and CS 299/399/499 projects share an 8-credit cap toward AI
  discipline electives; this cap is separate from the Open Project requirement.
- Only electives explicitly identified in the AI advisory are automatically placed.
  Unlisted courses and entries with TBD codes need a confirmed classification.

The advisory uses inconsistent course codes across its AI and CSE sections:
AI lists CS 301 as Operating Systems, CS 432 as Databases and CS 433 as Computer
Networks; the CSE section uses different codes for these courses. The AI review
screen flags mismatching titles for those codes and leaves them unresolved until
the student confirms the approved placement. Updated codes are not silently
assumed equivalent. This is an AI **major**, not an AI minor.

## Other branch rules

The five remaining majors use Advisory 13 (January 2025), pp. 9, 12–16 and sample paths on pp. 19, 21–24.

- Civil: Design / Applications and General CE elective credits remain separate. Only listed codes are auto-classified; new or TBD-coded electives require an approved manual classification.
- Electrical: all EE electives and the explicitly listed non-EE electives are recognized. Projects and online courses contribute zero discipline-elective credits. PH 201 is required within Science.
- ICDT: only the three coded electives in the advisory are auto-classified. Several core codes are unspecified; these requirements match exact full titles (including the advisory's alternate titles), never fabricated codes. Missing courses show their title and “code pending”. A different title requires confirmation of the approved course name before it can satisfy the fixed requirement. PH 510 or Physics of Materials is required within Science.
- Materials: all MSE electives are recognized; MSE 299/399/499 and other explicitly marked project electives share an eight-credit project allowance. One complete course from PH 201, PH 202 or CH 203 must count in Science.
- Mechanical: all ME electives and the explicitly listed non-ME electives are recognized. Online courses contribute zero discipline-elective credits. Project electives share an eight-credit allowance. One specified Physics / Chemistry course must count in Science.
- Every major: independent 299/399/499 project codes are detected automatically. Mark other projects in the review table. Up to 16 project credits may count across the degree, including the Open Project; only credits that fill a requirement consume this allowance. Processing follows semester/code order and does not optimize course placement.

ICDT example codes EE 225, EE 226, EE 227 and ES 339 were verified by title and credits in [IITGN's official course list](https://iitgn.ac.in/academics/courses) in October 2026. This does not assume equivalence for renamed courses such as IC Fabrication & Manufacturing. Unknown codes or electives remain for review.

## Features

- One course-paste field per completed semester; Markdown-table and plain-row parsing.
- Editable course review and requirement classifications before calculating.
- Programme-specific compulsory-course, PE and comprehensive-viva checks.
- Additional checks for GE, Science-basket and Mathematics-basket credits.
- Repeated course codes counted once, with a review suggestion.
- Requirement-based planning suggestions without assuming course availability.
- Downloadable single-sheet course-entry template with eight semester panels.
- Downloadable single-sheet graduation plan with programme-specific credit requirements, semester coursework, future planning cells and remaining compulsory courses.
- No transcript data is uploaded or stored by the application.

The personalised workbook has exactly one worksheet. It brings the credit summary,
requirement breakdown, activity checks, all eight semester panels, missing courses
and next steps together. Future-semester cells are editable and planned-credit
totals recalculate in Excel. Completed / placed credits remain an audit snapshot;
re-run the app to validate changed coursework. The complete worksheet is configured
for one A3 landscape printed page. Larger histories expand without discarding rows.
Excel files are generated locally in the browser. Direct Excel upload is not supported.

## Run locally

Use Node.js 20 or newer:

```sh
npm ci
npm run dev
```

## Validation

```sh
npm test
npm run build
```

Tests cover all eight majors, their core lists and totals, four-semester examples, programme-specific classification, complete-degree fixtures, science choices, elective restrictions, project limits and single-sheet Excel exports.

Examples are illustrative course histories, not prerequisites, recommendations or a timetable. Example placed credits after four semesters are ChE 100 (after the ES 418 review), CSE 100, AI 100, Civil 100, Electrical 99, ICDT 96, Materials 100 and Mechanical 97. ICDT leaves the unnumbered IC Fabrication & Manufacturing course for later rather than inventing its code.

## Accuracy notice

This is a planning aid based on Academic Affairs Advisory No. 13 (January 2025).
Students enter completed coursework; the app does not verify grades or approvals.
Confirm unusual approvals, substitutions and exceptions with your faculty advisor
or Academic Affairs. External-exposure substitutions are not automated. Course-type and approved-placement declarations must be accurate for the project and elective limits to be reliable. The audit uses the supplied January 2025 advisory, rather than assuming later curriculum changes apply to this cohort.
