/*
# Roles, permission matrix and per-user overrides

1. New Tables
- `roles`: role catalogue. `key` (primary key, generated), `name` (unique), `description`, `tone` (badge colour: red, blue, yellow, green, slate), `data_scope` (self, department or hotel), `departments` (names used when scope is department), `sort_order`, `created_at`.
- `role_permissions`: default permissions per role and feature. Four flags: can_view, can_edit, can_approve, can_delete.
- `user_permission_overrides`: individual grants or revokes for one account, keyed by account System Unique ID, feature and action.

2. Modified Tables
- `app_users.role` must now match a key in `roles`. Existing values are migrated: manager and hr become mod. A foreign key enforces this, and the old fixed list is removed.

3. Seed Data
- Four roles (Super Admin, Admin, Mod, Staff) with default permissions. All seeds use ON CONFLICT DO NOTHING.

4. Security
- Row level security is enabled on all three tables. Browsers (anon, authenticated) get the grants and per-verb policies they need. The permission matrix is configuration only, since the app has no sign-in yet.

5. Notes
- Deleting a role that still has users is blocked by the foreign key.
- Deleting a user removes their overrides.
*/

CREATE TABLE IF NOT EXISTS roles (
  key text PRIMARY KEY DEFAULT ('role_' || substr(md5(random()::text || clock_timestamp()::text), 1, 8)),
  name text NOT NULL UNIQUE CHECK (length(btrim(name)) > 0),
  description text NOT NULL DEFAULT '',
  tone text NOT NULL DEFAULT 'slate' CHECK (tone IN ('red', 'blue', 'yellow', 'green', 'slate')),
  data_scope text NOT NULL DEFAULT 'self' CHECK (data_scope IN ('self', 'department', 'hotel')),
  departments text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO roles (key, name, description, tone, data_scope, sort_order) VALUES
  ('super_admin', 'Super Admin', 'Toàn quyền quản trị hệ thống và tài khoản.', 'red', 'hotel', 1),
  ('admin', 'Admin', 'Quản trị nghiệp vụ toàn khách sạn, không chỉnh sửa cấu hình gốc.', 'blue', 'hotel', 2),
  ('mod', 'Mod', 'Duyệt và chỉnh sửa chấm công, lịch làm việc theo bộ phận.', 'yellow', 'department', 3),
  ('staff', 'Staff', 'Tự chấm công, xem lịch làm việc và sổ phép cá nhân.', 'green', 'self', 4)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_key text NOT NULL REFERENCES roles(key) ON DELETE CASCADE,
  feature_key text NOT NULL CHECK (feature_key IN ('attendance', 'schedule', 'timesheet', 'closing', 'leave', 'employees', 'system')),
  can_view boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  can_approve boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  PRIMARY KEY (role_key, feature_key)
);

INSERT INTO role_permissions (role_key, feature_key, can_view, can_edit, can_approve, can_delete) VALUES
  ('super_admin', 'attendance', true, true, true, true),
  ('super_admin', 'schedule', true, true, true, true),
  ('super_admin', 'timesheet', true, true, true, true),
  ('super_admin', 'closing', true, true, true, true),
  ('super_admin', 'leave', true, true, true, true),
  ('super_admin', 'employees', true, true, true, true),
  ('super_admin', 'system', true, true, true, true),
  ('admin', 'attendance', true, true, true, true),
  ('admin', 'schedule', true, true, true, true),
  ('admin', 'timesheet', true, true, true, true),
  ('admin', 'closing', true, true, true, true),
  ('admin', 'leave', true, true, true, true),
  ('admin', 'employees', true, true, true, true),
  ('admin', 'system', true, true, true, true),
  ('mod', 'attendance', true, true, true, true),
  ('mod', 'schedule', true, true, false, true),
  ('mod', 'timesheet', true, true, true, true),
  ('mod', 'closing', true, true, true, false),
  ('mod', 'leave', true, true, false, false),
  ('mod', 'employees', true, true, false, true),
  ('mod', 'system', false, false, false, false),
  ('staff', 'attendance', true, true, false, false),
  ('staff', 'schedule', true, false, false, false),
  ('staff', 'timesheet', true, false, false, false),
  ('staff', 'closing', false, false, false, false),
  ('staff', 'leave', true, false, false, false),
  ('staff', 'employees', false, false, false, false),
  ('staff', 'system', false, false, false, false)
ON CONFLICT (role_key, feature_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS user_permission_overrides (
  user_system_uid text NOT NULL REFERENCES app_users(system_uid) ON DELETE CASCADE,
  feature_key text NOT NULL CHECK (feature_key IN ('attendance', 'schedule', 'timesheet', 'closing', 'leave', 'employees', 'system')),
  action text NOT NULL CHECK (action IN ('view', 'edit', 'approve', 'delete')),
  effect text NOT NULL CHECK (effect IN ('grant', 'revoke')),
  PRIMARY KEY (user_system_uid, feature_key, action)
);

ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_role_check;
UPDATE app_users SET role = 'mod' WHERE role IN ('manager', 'hr');

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'app_users_role_fkey') THEN
    ALTER TABLE app_users
      ADD CONSTRAINT app_users_role_fkey FOREIGN KEY (role) REFERENCES roles(key);
  END IF;
END $$;

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permission_overrides ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON roles TO anon, authenticated;
GRANT INSERT (name, description, tone) ON roles TO anon, authenticated;
GRANT UPDATE (name, description, data_scope, departments) ON roles TO anon, authenticated;
GRANT DELETE ON roles TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON role_permissions TO anon, authenticated;
GRANT SELECT, INSERT, DELETE ON user_permission_overrides TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_roles" ON roles;
CREATE POLICY "anon_select_roles" ON roles FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_roles" ON roles;
CREATE POLICY "anon_insert_roles" ON roles FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_roles" ON roles;
CREATE POLICY "anon_update_roles" ON roles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_roles" ON roles;
CREATE POLICY "anon_delete_roles" ON roles FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_role_permissions" ON role_permissions;
CREATE POLICY "anon_select_role_permissions" ON role_permissions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_role_permissions" ON role_permissions;
CREATE POLICY "anon_insert_role_permissions" ON role_permissions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_role_permissions" ON role_permissions;
CREATE POLICY "anon_update_role_permissions" ON role_permissions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_user_permission_overrides" ON user_permission_overrides;
CREATE POLICY "anon_select_user_permission_overrides" ON user_permission_overrides FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_user_permission_overrides" ON user_permission_overrides;
CREATE POLICY "anon_insert_user_permission_overrides" ON user_permission_overrides FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_user_permission_overrides" ON user_permission_overrides;
CREATE POLICY "anon_delete_user_permission_overrides" ON user_permission_overrides FOR DELETE TO anon, authenticated USING (true);
