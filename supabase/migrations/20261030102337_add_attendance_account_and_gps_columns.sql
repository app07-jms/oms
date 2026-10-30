/*
# Link attendance records to hotels, accounts, and GPS verification

Attendance records now belong to a hotel and the account that made them, and store whether each check-in and check-out was made inside the hotel's geofence.

## 1. Modified Tables
- `attendance_records`
  - `hotel_id` (uuid, references hotels): hotel the shift was worked in.
  - `app_user_system_uid` (text): account that recorded the shift.
  - `check_in_gps_status` (text): `valid` or `out-of-range`.
  - `check_in_distance_m` (integer): distance from the hotel center at check-in.
  - `check_out_gps_status` (text): `valid` or `out-of-range`.
  - `check_out_distance_m` (integer): distance from the hotel center at check-out.

## 2. Indexes
- `(hotel_id, work_date)` for hotel-wide history.
- `(employee_code, work_date)` for personal and department history.

## 3. Notes
- All new columns are nullable so existing rows remain valid.
- Existing grants and row level security policies on the table are unchanged; new columns inherit the table's grants.
- Every statement is safe to re-run.
*/

ALTER TABLE attendance_records
  ADD COLUMN IF NOT EXISTS hotel_id uuid REFERENCES hotels(id),
  ADD COLUMN IF NOT EXISTS app_user_system_uid text,
  ADD COLUMN IF NOT EXISTS check_in_gps_status text CHECK (check_in_gps_status IN ('valid', 'out-of-range')),
  ADD COLUMN IF NOT EXISTS check_in_distance_m integer,
  ADD COLUMN IF NOT EXISTS check_out_gps_status text CHECK (check_out_gps_status IN ('valid', 'out-of-range')),
  ADD COLUMN IF NOT EXISTS check_out_distance_m integer;

CREATE INDEX IF NOT EXISTS attendance_records_hotel_work_date_idx ON attendance_records (hotel_id, work_date);
CREATE INDEX IF NOT EXISTS attendance_records_employee_work_date_idx ON attendance_records (employee_code, work_date);
