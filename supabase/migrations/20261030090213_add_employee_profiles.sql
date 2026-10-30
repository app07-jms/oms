/*
# Employee profiles: extra fields, system unique IDs, account and leave flags

1. Modified Table: `employees`
- `system_uid` (text, unique, hidden): system-wide ID in the format "JENIUS_usr_xxxxxxxx". Assigned automatically to every existing and new employee. Used as the cross-module key; not shown in the UI.
- `display_name` (text, optional): name shown in daily use ("Tên hiển thị").
- `probation_date` (date, optional): "Ngày thử việc".
- `official_date` (date, optional): "Ngày chính thức".
- `phone` (text, optional): "SĐT".
- `email` (text, optional): "Email".
- `has_account` (boolean, default false): whether a login account has been created and linked.
- `auth_user_id` (uuid, optional): the linked login account. Set only by the account provisioning function.
- `leave_tracking` (boolean, default false): whether annual leave is tracked in the leave book.
- `initial_leave_days` (integer, default 12, >= 0): opening leave days used when leave tracking is turned on.

2. New Function
- `apply_employee_leave_opening(p_code)`: when leave tracking is on for an employee, writes `initial_leave_days` as the opening leave balance for the current year in the leave book. Runs with elevated rights so the leave book stays write-protected from the browser.

3. Security
- RLS stays enabled on `employees`. The table previously had no policies, so the app could not read it at all.
- Added SELECT, INSERT, UPDATE, DELETE policies for anon and authenticated. The app has no sign-in and this data is intentionally shared within the hotel.
- Removed the broad grants (TRUNCATE, REFERENCES, TRIGGER, full-table UPDATE) from anon and authenticated.
- Browser roles can insert and update only the profile fields. `system_uid`, `has_account` and `auth_user_id` cannot be set from the browser.
- `apply_employee_leave_opening` is callable by anon and authenticated only.

4. Notes
- Existing employees get a System Unique ID automatically and keep their current data.
- Employee codes are unique and are used as the login username.
*/

ALTER TABLE employees ADD COLUMN IF NOT EXISTS system_uid text NOT NULL DEFAULT ('JENIUS_usr_' || substr(md5(random()::text || clock_timestamp()::text), 1, 8));
ALTER TABLE employees ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS probation_date date;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS official_date date;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS has_account boolean NOT NULL DEFAULT false;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS leave_tracking boolean NOT NULL DEFAULT false;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS initial_leave_days integer NOT NULL DEFAULT 12;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employees_system_uid_key') THEN
    ALTER TABLE employees ADD CONSTRAINT employees_system_uid_key UNIQUE (system_uid);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employees_initial_leave_days_check') THEN
    ALTER TABLE employees ADD CONSTRAINT employees_initial_leave_days_check CHECK (initial_leave_days >= 0);
  END IF;
END $$;

REVOKE ALL ON employees FROM anon, authenticated;
GRANT SELECT, DELETE ON employees TO anon, authenticated;
GRANT INSERT (code, full_name, display_name, department, position, probation_date, official_date, phone, email, leave_tracking, initial_leave_days)
  ON employees TO anon, authenticated;
GRANT UPDATE (full_name, display_name, department, position, probation_date, official_date, phone, email, leave_tracking, initial_leave_days)
  ON employees TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_employees" ON employees;
CREATE POLICY "anon_select_employees" ON employees FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_employees" ON employees;
CREATE POLICY "anon_insert_employees" ON employees FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_employees" ON employees;
CREATE POLICY "anon_update_employees" ON employees FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_employees" ON employees;
CREATE POLICY "anon_delete_employees" ON employees FOR DELETE
TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION apply_employee_leave_opening(p_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tracking boolean;
  v_days integer;
  v_year integer := EXTRACT(YEAR FROM CURRENT_DATE)::integer;
BEGIN
  SELECT e.leave_tracking, e.initial_leave_days INTO v_tracking, v_days
  FROM employees e
  WHERE e.code = p_code;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy nhân viên: %', p_code USING ERRCODE = '22023';
  END IF;

  IF v_tracking THEN
    INSERT INTO leave_carryovers (year, employee_code, carry_over_days)
    VALUES (v_year, p_code, v_days)
    ON CONFLICT (year, employee_code) DO UPDATE SET carry_over_days = EXCLUDED.carry_over_days;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION apply_employee_leave_opening(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION apply_employee_leave_opening(text) TO anon, authenticated;
