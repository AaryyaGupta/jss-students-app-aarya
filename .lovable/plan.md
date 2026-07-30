# Second-year (3rd semester) timetable update

Replace the first-year timetable with the ODD Semester 2026-27 schedule from the uploaded file, effective 14/07/2026.

## What changes

- All existing timetable entries are deleted, along with all existing attendance records (fresh start for second year).
- New classes are loaded for the six CS/AI-ML sections in the file:
  - III CS1 -> A1 CSE-1
  - III CS2 -> A2 CSE-2
  - III CS3 -> A3 CSE-3
  - AI-ML-1 -> A4 CS-AIML
  - AI-ML-2 -> A5 CS-AIML
  - AI-ML-3 -> A6 CS-AIML-3
- Batch B1 (IT) gets no new timetable, as agreed.
- Subject names use the readable subject titles from each sheet's code/subject legend (for example BCS 301 -> Data Structures, BAS 301 -> Technical Communication), with lab entries kept as separate group entries (e.g. "DS Lab (A1)" and "WDW Lab (A2)") the same way last year's data handled G1/G2 groups.
- Mentoring and other non-subject slots are carried over as-is.
- Lunch (12:45-1:45) is not stored as a class.

## Technical notes

- Parse each sheet: header row 9 holds time slots, rows for MON-SAT hold cell text in the form `CODE\nSHORT NAME\nFACULTY`, and lab cells carry room and group markers like `BCS 351 (A1)`.
- Map each time-slot header to `start_time`/`end_time` (24h), split multi-group lab cells into one row per group.
- Delete + insert is done as a data operation on `timetable` and `attendance_record`; no schema changes needed.
- After loading, verify each batch's day-by-day schedule against the sheet before finishing.

## Not included

- No app UI changes; the timetable and dashboard pages already read from the batch-prefixed data.
- No IT/CSDS sections (not present in the file).
