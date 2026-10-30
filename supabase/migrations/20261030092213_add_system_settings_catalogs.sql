/*
# System settings catalogs: departments, positions and shift types

1. New Tables
- `departments`: id (uuid, primary key), name (unique), sort_order, created_at.
- `positions`: id (uuid, primary key), department_id (references departments, cascades on delete), name, created_at. A position name is unique within its department.
- `shift_types`: code (primary key, e.g. S1, OFF), name, is_working (working day or day off), start_time and end_time (required for working days), break_minutes (default 60, 0 for days off), sort_order, created_at.

2. Seed data
- The five departments in use today, each with starter positions.
- The six shift codes the schedule already uses: S1, C1, D1 (working), OFF, P, UP (days off).
- Seeding uses ON CONFLICT DO NOTHING, so re-running this migration never changes rows that already exist.

3. Security
- Row level security is enabled on all three tables.
- The app has no sign-in, so anon and authenticated roles get SELECT, INSERT, UPDATE and DELETE on these catalogs. Each verb has its own policy.
- Table-level grants only; no other tables are changed.

4. Notes
- Nothing is dropped or altered in existing tables.
- Shift codes are not yet enforced by the schedule tables, which still use their own fixed code list.
*/

CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE CHECK (length(btrim(name)) > 0),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(btrim(name)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT positions_department_name_key UNIQUE (department_id, name)
);

CREATE INDEX IF NOT EXISTS positions_department_id_idx ON positions (department_id);

CREATE TABLE IF NOT EXISTS shift_types (
  code text PRIMARY KEY CHECK (code ~ '^[A-Z0-9]{1,10}$'),
  name text NOT NULL CHECK (length(btrim(name)) > 0),
  is_working boolean NOT NULL,
  start_time time,
  end_time time,
  break_minutes integer NOT NULL DEFAULT 60 CHECK (break_minutes >= 0 AND break_minutes <= 720),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT shift_types_working_times_check CHECK (
    NOT is_working OR (start_time IS NOT NULL AND end_time IS NOT NULL)
  )
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_types ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON departments TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON positions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON shift_types TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_departments" ON departments;
CREATE POLICY "anon_select_departments" ON departments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_departments" ON departments;
CREATE POLICY "anon_insert_departments" ON departments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_departments" ON departments;
CREATE POLICY "anon_update_departments" ON departments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_departments" ON departments;
CREATE POLICY "anon_delete_departments" ON departments FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_positions" ON positions;
CREATE POLICY "anon_select_positions" ON positions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_positions" ON positions;
CREATE POLICY "anon_insert_positions" ON positions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_positions" ON positions;
CREATE POLICY "anon_update_positions" ON positions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_positions" ON positions;
CREATE POLICY "anon_delete_positions" ON positions FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_shift_types" ON shift_types;
CREATE POLICY "anon_select_shift_types" ON shift_types FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_shift_types" ON shift_types;
CREATE POLICY "anon_insert_shift_types" ON shift_types FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_shift_types" ON shift_types;
CREATE POLICY "anon_update_shift_types" ON shift_types FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_shift_types" ON shift_types;
CREATE POLICY "anon_delete_shift_types" ON shift_types FOR DELETE TO anon, authenticated USING (true);

INSERT INTO departments (name, sort_order) VALUES
  ('Lễ tân', 1),
  ('Buồng phòng', 2),
  ('F&B', 3),
  ('Bếp', 4),
  ('Hành chính / HR', 5)
ON CONFLICT (name) DO NOTHING;

INSERT INTO positions (department_id, name)
SELECT d.id, p.name
FROM (VALUES
  ('Lễ tân', 'Trưởng bộ phận Lễ tân'),
  ('Lễ tân', 'Nhân viên Lễ tân'),
  ('Buồng phòng', 'Trưởng bộ phận Buồng phòng'),
  ('Buồng phòng', 'Nhân viên Buồng phòng'),
  ('F&B', 'Trưởng bộ phận F&B'),
  ('F&B', 'Nhân viên phục vụ'),
  ('Bếp', 'Bếp trưởng'),
  ('Bếp', 'Phụ bếp'),
  ('Hành chính / HR', 'Trưởng phòng Hành chính / HR'),
  ('Hành chính / HR', 'Nhân viên HR')
) AS p(department_name, name)
JOIN departments d ON d.name = p.department_name
ON CONFLICT (department_id, name) DO NOTHING;

INSERT INTO shift_types (code, name, is_working, start_time, end_time, break_minutes, sort_order) VALUES
  ('S1', 'Ca Sáng', true, '06:00', '14:00', 60, 1),
  ('C1', 'Ca Chiều', true, '14:00', '22:00', 60, 2),
  ('D1', 'Ca Đêm', true, '22:00', '06:00', 60, 3),
  ('OFF', 'Nghỉ', false, NULL, NULL, 0, 4),
  ('P', 'Nghỉ phép', false, NULL, NULL, 0, 5),
  ('UP', 'Nghỉ không lương', false, NULL, NULL, 0, 6)
ON CONFLICT (code) DO NOTHING;
