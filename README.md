# Degree Navigator

A browser-based graduation audit for IIT Gandhinagar B.Tech Chemical Engineering students admitted in AY 2024-25.

## Version 0.2 scope

- One course-paste field per completed semester
- Markdown-table and plain-row parsing
- Editable review table before the audit is calculated
- Student confirmation or correction of every course classification
- 170-credit B.Tech Chemical Engineering audit
- Fixed-course, PE and comprehensive-viva checks
- Requirement-based planning suggestions without assuming course availability
- Downloadable blank course-entry workbook
- Downloadable six-sheet personalised Excel audit
- No transcript data is uploaded or stored

## Excel audit

The personalised workbook contains Dashboard, Course History, Requirement Audit,
Missing Requirements, Suggestions, and Rules & Disclaimer sheets. Excel files are
generated locally in the browser.

## Quality checks

Run `npm test` to execute the parser, audit, suggestion, and workbook tests. The
four-semester reference transcript is locked to an expected result of 100 eligible
credits out of 170 after ES 418 is confirmed as an open elective.

## Run locally

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open the local URL shown in the terminal.

## Accuracy notice

This is a planning aid based on Academic Affairs Advisory No. 13 (January 2025). Students should confirm unusual approvals, substitutions and exceptions with their faculty advisor or Academic Affairs.
