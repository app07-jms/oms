/*
# Leave opening balance is set once, never overwritten

1. Modified Function
- `apply_employee_leave_opening(p_code)`: when leave tracking is on, the opening balance for the current year is inserted only if no balance exists for that employee and year. A balance set by a year-end rollover or an earlier opening is left untouched.

2. Security
- Unchanged: the function still runs with elevated rights and is callable by anon and authenticated only. Its write can no longer overwrite existing leave data.
*/

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
    ON CONFLICT (year, employee_code) DO NOTHING;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION apply_employee_leave_opening(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION apply_employee_leave_opening(text) TO anon, authenticated;
