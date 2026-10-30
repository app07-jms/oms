/*
# Employment status for employee profiles

1. Modified Table: `employees`
- `employment_status` (text, required): one of 'probation' (Thử việc), 'official' (Làm việc chính thức), 'resigned' (Nghỉ việc).
- Default 'probation' for new rows. Existing employees are set to 'probation' as well and can be changed in the profile.

2. Security
- Browsers can insert and update this column, consistent with the other profile fields. No new policies are needed.

3. Notes
- No existing data is removed or changed beyond setting the new column.
*/

ALTER TABLE employees ADD COLUMN IF NOT EXISTS employment_status text NOT NULL DEFAULT 'probation';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employees_employment_status_check') THEN
    ALTER TABLE employees ADD CONSTRAINT employees_employment_status_check
      CHECK (employment_status IN ('probation', 'official', 'resigned'));
  END IF;
END $$;

GRANT INSERT (employment_status) ON employees TO anon, authenticated;
GRANT UPDATE (employment_status) ON employees TO anon, authenticated;
