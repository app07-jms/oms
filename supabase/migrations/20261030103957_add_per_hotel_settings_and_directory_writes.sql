/*
# Move hotel configuration onto each hotel and allow managing the hotel directory

Each hotel now carries its own address, abbreviation, GPS point, check-in radius, standard shift hours, and module switches. The app manages the hotel directory from the settings page, so the app's roles can insert, update, and delete hotel rows.

## 1. Columns added to `hotels` (all nullable or defaulted)
- `address` (text, default '')
- `id_prefix` (text): the short code, e.g. JMS01. Locked once set.
- `latitude`, `longitude` (numeric)
- `geofence_radius_m` (integer, default 100, 10 to 1000)
- `standard_shift_hours` (numeric, default 8, 1 to 24)
- `module_workforce` (default true), `module_warehouse` (default false), `module_reception` (default false)

## 2. Backfill (idempotent)
- The existing hotel's values are copied from the single `hotel_settings` row where the system IDs match and `id_prefix` is still empty.

## 3. Identity protection
- Trigger `hotel_row_identity_immutable`: `system_hotel_id` can never change; `id_prefix` can't change once set.

## 4. Access
- Grants and policies for INSERT, UPDATE, DELETE on `hotels` for `anon` and `authenticated`. The app has no enforced sign-in gate at the database level yet, so these mirror the existing policies on `hotel_settings`.

## Important Notes
1. Every statement is safe to re-run.
2. The `hotel_settings` table is left in place and is no longer read by the app.
*/

ALTER TABLE hotels ADD COLUMN IF NOT EXISTS address text NOT NULL DEFAULT '';
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS id_prefix text;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS longitude numeric;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS geofence_radius_m integer NOT NULL DEFAULT 100;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS standard_shift_hours numeric NOT NULL DEFAULT 8;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS module_workforce boolean NOT NULL DEFAULT true;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS module_warehouse boolean NOT NULL DEFAULT false;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS module_reception boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hotels_geofence_radius_range') THEN
    ALTER TABLE hotels ADD CONSTRAINT hotels_geofence_radius_range CHECK (geofence_radius_m BETWEEN 10 AND 1000);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hotels_standard_shift_hours_range') THEN
    ALTER TABLE hotels ADD CONSTRAINT hotels_standard_shift_hours_range CHECK (standard_shift_hours BETWEEN 1 AND 24);
  END IF;
END $$;

UPDATE hotels h
SET address = COALESCE(s.address, ''),
    id_prefix = s.id_prefix,
    latitude = s.latitude,
    longitude = s.longitude,
    geofence_radius_m = s.geofence_radius_m,
    standard_shift_hours = s.standard_shift_hours,
    module_workforce = s.module_workforce,
    module_warehouse = s.module_warehouse,
    module_reception = s.module_reception
FROM hotel_settings s
WHERE s.id = 1
  AND h.system_hotel_id = s.system_hotel_id
  AND h.id_prefix IS NULL;

CREATE OR REPLACE FUNCTION protect_hotel_row_identity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.system_hotel_id IS DISTINCT FROM OLD.system_hotel_id THEN
    RAISE EXCEPTION 'Mã định danh hệ thống không thể thay đổi.';
  END IF;
  IF OLD.id_prefix IS NOT NULL AND NEW.id_prefix IS DISTINCT FROM OLD.id_prefix THEN
    RAISE EXCEPTION 'Mã viết tắt đã khóa và không thể thay đổi.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hotel_row_identity_immutable ON hotels;
CREATE TRIGGER hotel_row_identity_immutable
BEFORE UPDATE ON hotels
FOR EACH ROW EXECUTE FUNCTION protect_hotel_row_identity();

GRANT INSERT, UPDATE, DELETE ON hotels TO anon, authenticated;

DROP POLICY IF EXISTS "anon_insert_hotels" ON hotels;
CREATE POLICY "anon_insert_hotels" ON hotels FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_hotels" ON hotels;
CREATE POLICY "anon_update_hotels" ON hotels FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_hotels" ON hotels;
CREATE POLICY "anon_delete_hotels" ON hotels FOR DELETE
  TO anon, authenticated USING (true);
