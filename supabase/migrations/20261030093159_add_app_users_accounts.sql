/*
# User accounts with hidden system IDs and employee links

1. New Table: `app_users`
- `id` (uuid, primary key).
- `system_uid` (text, unique, required): hidden System Unique ID in the form JENIUS_usr_xxxxxxxx. Generated automatically and never changed after creation.
- `username` (text, unique, required, 3-30 characters: letters, digits, dot, underscore or hyphen). Immutable after creation.
- `full_name` (text, required).
- `role` (text, required): admin, manager, hr or staff. Defaults to staff.
- `is_active` (boolean, required, default true). False means the account is locked.
- `employee_system_uid` (text, unique, optional): links the account to one employee profile by that employee's System Unique ID. Cleared automatically if the profile is deleted.
- `auth_user_id` (uuid, unique, optional): the matching sign-in account. Cleared if that sign-in account is deleted.
- `created_at` (timestamp).

2. Modified Table: none.

3. Security
- Row level security is enabled.
- Browsers (anon, authenticated) can read accounts and change only role, lock status and employee link. The system ID, username and sign-in link cannot be changed from the browser.
- Creating accounts and resetting passwords is done only by the server function, which uses the service role.
- A trigger rejects any attempt to change `system_uid`, as a second safeguard.

4. Notes
- The trigger function has a fixed search path.
- Policies cover read and update only; no browser insert or delete is allowed.
*/

CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_uid text NOT NULL UNIQUE DEFAULT ('JENIUS_usr_' || substr(md5(random()::text || clock_timestamp()::text), 1, 8)),
  username text NOT NULL UNIQUE CHECK (username ~ '^[A-Za-z0-9._-]{3,30}$'),
  full_name text NOT NULL CHECK (length(btrim(full_name)) > 0),
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'hr', 'staff')),
  is_active boolean NOT NULL DEFAULT true,
  employee_system_uid text UNIQUE REFERENCES employees(system_uid) ON DELETE SET NULL,
  auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION app_users_keep_system_uid()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.system_uid IS DISTINCT FROM OLD.system_uid THEN
    RAISE EXCEPTION 'system_uid cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS app_users_keep_system_uid ON app_users;
CREATE TRIGGER app_users_keep_system_uid
  BEFORE UPDATE ON app_users
  FOR EACH ROW EXECUTE FUNCTION app_users_keep_system_uid();

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON app_users TO anon, authenticated;
GRANT UPDATE (role, is_active, employee_system_uid) ON app_users TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_users TO service_role;

DROP POLICY IF EXISTS "anon_select_app_users" ON app_users;
CREATE POLICY "anon_select_app_users" ON app_users FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_update_app_users" ON app_users;
CREATE POLICY "anon_update_app_users" ON app_users FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
