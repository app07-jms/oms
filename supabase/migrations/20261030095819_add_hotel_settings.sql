/*
# Add hotel settings (single-row configuration)

## Plain-English summary
Stores the hotel's own configuration in one shared row: its name and address, the short prefix used to build the permanent System Hotel ID, the GPS point and check-in radius used for attendance, the standard working hours used for overtime, and which feature modules are switched on.

## New table: hotel_settings
- id (smallint, always 1): the table only ever holds one row.
- name, address (text): hotel name and address.
- id_prefix (text, uppercase letters and digits, 2-10 characters): short code entered by the administrator, e.g. JMS01.
- system_hotel_id (text, unique): permanent identifier generated once from the prefix. Locked after it is first set.
- latitude, longitude (numeric): GPS coordinates of the hotel. Nullable until configured.
- geofence_radius_m (integer, 10-1000, default 100): allowed check-in radius in metres.
- standard_shift_hours (numeric(3,1), 1-24, default 8.0): standard working hours per day; the basis for overtime in payroll closing.
- module_workforce (default on), module_warehouse (default off), module_reception (default off): feature module switches.
- updated_at (timestamptz): last change time.

## Security
- Row level security is enabled.
- anon and authenticated may read, insert (only the single row, id = 1) and update the row. Delete is not granted.
- Trigger hotel_identity_immutable: once system_hotel_id is set, any change to system_hotel_id or id_prefix is rejected by the database.

## Important notes
1. The migration is idempotent and seeds the single row with defaults.
2. Access control for module switches is enforced in the interface only, because the app has no sign-in yet.
*/

CREATE TABLE IF NOT EXISTS hotel_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  id_prefix text CHECK (id_prefix IS NULL OR id_prefix ~ '^[A-Z0-9]{2,10}$'),
  system_hotel_id text UNIQUE,
  latitude numeric(9,6) CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  longitude numeric(9,6) CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  geofence_radius_m integer NOT NULL DEFAULT 100 CHECK (geofence_radius_m BETWEEN 10 AND 1000),
  standard_shift_hours numeric(3,1) NOT NULL DEFAULT 8.0 CHECK (standard_shift_hours BETWEEN 1 AND 24),
  module_workforce boolean NOT NULL DEFAULT true,
  module_warehouse boolean NOT NULL DEFAULT false,
  module_reception boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO hotel_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION protect_hotel_identity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.system_hotel_id IS NOT NULL
     AND (NEW.system_hotel_id IS DISTINCT FROM OLD.system_hotel_id
          OR NEW.id_prefix IS DISTINCT FROM OLD.id_prefix) THEN
    RAISE EXCEPTION 'Mã khách sạn đã được tạo và không thể thay đổi.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hotel_identity_immutable ON hotel_settings;
CREATE TRIGGER hotel_identity_immutable
BEFORE UPDATE ON hotel_settings
FOR EACH ROW EXECUTE FUNCTION protect_hotel_identity();

ALTER TABLE hotel_settings ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON hotel_settings TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_hotel_settings" ON hotel_settings;
CREATE POLICY "anon_select_hotel_settings" ON hotel_settings FOR SELECT
  TO anon, authenticated USING (id = 1);

DROP POLICY IF EXISTS "anon_insert_hotel_settings" ON hotel_settings;
CREATE POLICY "anon_insert_hotel_settings" ON hotel_settings FOR INSERT
  TO anon, authenticated WITH CHECK (id = 1);

DROP POLICY IF EXISTS "anon_update_hotel_settings" ON hotel_settings;
CREATE POLICY "anon_update_hotel_settings" ON hotel_settings FOR UPDATE
  TO anon, authenticated USING (id = 1) WITH CHECK (id = 1);
