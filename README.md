# Degree Navigator

A browser-based graduation audit for IIT Gandhinagar B.Tech students admitted in AY 2024–25.

## Supported majors

- Chemical Engineering: 170 credits, including 42 discipline-core and 20 discipline-elective credits.
- Computer Science and Engineering: 170 credits, including 36 discipline-core and 26 discipline-elective credits.

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

Tests cover both majors, their four-semester examples (100 eligible credits out
of 170), programme isolation, basket surplus, elective minimums, the combined
online/project cap, duplicate records, shared subrequirements, and Excel exports.
The Chemical Engineering example requires ES 418 to be confirmed as an open elective.
The CSE example is illustrative data drawn from the advisory's sample academic
path; it is not a real transcript or a promise of future course offerings.

## Accuracy notice

This is a planning aid based on Academic Affairs Advisory No. 13 (January 2025).
Students enter completed coursework; the app does not verify grades or approvals.
Confirm unusual approvals, substitutions and exceptions with your faculty advisor
or Academic Affairs. External-exposure substitutions and institution-wide project
credit limits beyond the CSE elective cap are not automated in this version.
