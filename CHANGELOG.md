# Changelog

## Unreleased

- Replaced the six-sheet Excel audit with one graduation-plan worksheet.
- Combined credit requirements, activity checks, eight semester panels, missing courses and next steps.
- Added editable future-semester planning cells, category dropdowns and formula totals.
- Kept planned credits separate from completed / placed audit credits.
- Changed the blank course-entry template to the same single-sheet layout.
- Set the whole worksheet to fit one A3 landscape printed page without discarding course rows.

## 0.3.0

- Added Computer Science and Engineering for the 2024–28 cohort alongside Chemical Engineering.
- Added a major selector and programme-specific course review, examples, audit and Excel exports.
- Added the nine CSE core courses, Theory & Algorithms and Systems minimums, and general elective allocation.
- Allowed surplus basket credits to meet the remaining elective requirement without counting them twice.
- Added online/project course types and the combined eight-credit CSE discipline-elective cap.
- Added GE, Science-basket and Mathematics-basket subchecks, plus duplicate-course review.
- Preserved the existing Chemical Engineering sample audit and regression tests.
- Kept minors and honours outside this release.

## 0.2.0

- Added an editable review step between course parsing and the audit.
- Added explicit student confirmation for courses the rules cannot classify.
- Allowed students to correct automatic classifications before calculation.
- Added optional student name and roll number fields.
- Added a downloadable eight-semester course-entry Excel template.
- Added a personalised six-sheet Excel audit export.
- Added conservative requirement-based planning suggestions.
- Added parser, audit, suggestion, and Excel workbook tests.
- Fixed duplicate detection for plain-text course rows.
- Moved Excel generation into an on-demand bundle to keep the initial page fast.
