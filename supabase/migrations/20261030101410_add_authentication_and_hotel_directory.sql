/*
# Add hotel directory, hotel assignments, and seed the Super Admin account

Introduces the multi-hotel foundation for sign-in and seeds the first Super Admin so the team can log in.

## 1. New Tables
- `hotels`: directory of hotels the system manages.
  - `id` (uuid, primary key)
  - `system_hotel_id` (text, unique, not null): the locked hotel identifier, e.g. JMS01_Hotels8uyds
  - `name` (text, not null)
  - `created_at` (timestamptz)
- `app_user_hotels`: which hotels an account may work in. Super Admin sees every hotel and needs no rows here.
  - `app_user_system_uid` (text, references app_users.system_uid, cascade delete)
  - `hotel_id` (uuid, references hotels.id, cascade delete)
  - `created_at` (timestamptz)
  - Primary key on both reference columns.

## 2. Seed Data (idempotent)
- Hotel identity in `hotel_settings`: prefix JMS01 and system ID JMS01_Hotels8uyds, only when no identity is set yet.
- Matching `hotels` row, created only if missing.
- Employee record JMS01_Hotels8uyds_usr_superadmin (the Super Admin's linked employee), created only if missing.
- Super Admin Supabase Auth user: username `jenius`, email `jenius@accounts.jenius.local`, password `123456`.
- Matching `app_users` row with role `super_admin`, linked to that employee.

## 3. Security Changes
- RLS enabled on both new tables.
- Read policies for `anon` and `authenticated` on both tables. The hotel directory is shared data and the app reads it before role checks run.
- `service_role` is granted access for the account-management edge function.

## Important Notes
1. Passwords are stored only in Supabase Auth, hashed with bcrypt.
2. Every statement is safe to re-run.
*/

CREATE TABLE IF NOT EXISTS hotels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_hotel_id text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_user_hotels (
  app_user_system_uid text NOT NULL REFERENCES app_users(system_uid) ON DELETE CASCADE,
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (app_user_system_uid, hotel_id)
);

CREATE INDEX IF NOT EXISTS app_user_hotels_hotel_id_idx ON app_user_hotels (hotel_id);

ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_user_hotels ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON hotels TO anon, authenticated;
GRANT SELECT ON app_user_hotels TO anon, authenticated;
GRANT SELECT, INSERT ON hotels TO service_role;
GRANT SELECT, INSERT, DELETE ON app_user_hotels TO service_role;

DROP POLICY IF EXISTS "anon_select_hotels" ON hotels;
CREATE POLICY "anon_select_hotels" ON hotels FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_app_user_hotels" ON app_user_hotels;
CREATE POLICY "anon_select_app_user_hotels" ON app_user_hotels FOR SELECT
  TO anon, authenticated USING (true);

UPDATE hotel_settings
SET id_prefix = 'JMS01',
    system_hotel_id = 'JMS01_Hotels8uyds',
    name = CASE WHEN name = '' THEN 'Jenius Hotels' ELSE name END
WHERE id = 1 AND system_hotel_id IS NULL;

INSERT INTO hotels (system_hotel_id, name)
SELECT 'JMS01_Hotels8uyds', 'Jenius Hotels'
WHERE NOT EXISTS (SELECT 1 FROM hotels WHERE system_hotel_id = 'JMS01_Hotels8uyds');

INSERT INTO employees (system_uid, code, full_name, department, position, has_account)
SELECT 'JMS01_Hotels8uyds_usr_superadmin', 'jenius', 'Super Admin', 'Ban quản lý', 'Super Admin', true
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE system_uid = 'JMS01_Hotels8uyds_usr_superadmin');

DO $$
DECLARE
  v_auth_id uuid;
  v_email text := 'jenius@accounts.jenius.local';
BEGIN
  SELECT id INTO v_auth_id FROM auth.users WHERE email = v_email;

  IF v_auth_id IS NULL THEN
    v_auth_id := gen_random_uuid();

    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current,
      reauthentication_token
    ) VALUES (
      v_auth_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      v_email,
      extensions.crypt('123456', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      now(),
      now(),
      '', '', '', '', '', ''
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_auth_id AND provider = 'email') THEN
    INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
      v_auth_id::text,
      v_auth_id,
      jsonb_build_object('sub', v_auth_id::text, 'email', v_email, 'email_verified', true),
      'email',
      now(),
      now(),
      now()
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM app_users WHERE username = 'jenius') THEN
    INSERT INTO app_users (username, full_name, role, is_active, employee_system_uid, auth_user_id)
    VALUES ('jenius', 'Super Admin', 'super_admin', true, 'JMS01_Hotels8uyds_usr_superadmin', v_auth_id);
  END IF;
END $$;
