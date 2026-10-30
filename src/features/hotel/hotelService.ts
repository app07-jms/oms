import { supabase } from '@/lib/supabase';
import type { HotelSettings } from '@/features/hotel/hotelRules';

const LOAD_ERROR = 'Không thể tải cấu hình khách sạn.';
const SAVE_ERROR = 'Không thể lưu cấu hình khách sạn. Vui lòng thử lại.';
const HOTEL_ROW_ID = 1;

interface HotelSettingsRow {
  name: string;
  address: string;
  id_prefix: string | null;
  system_hotel_id: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  geofence_radius_m: number;
  standard_shift_hours: number | string;
  module_workforce: boolean;
  module_warehouse: boolean;
  module_reception: boolean;
}

export interface HotelSettingsUpdate {
  name?: string;
  address?: string;
  idPrefix?: string;
  systemHotelId?: string;
  latitude?: number | null;
  longitude?: number | null;
  geofenceRadiusM?: number;
  standardShiftHours?: number;
  modules?: Partial<HotelSettings['modules']>;
}

const SELECT_COLUMNS =
  'name, address, id_prefix, system_hotel_id, latitude, longitude, geofence_radius_m, standard_shift_hours, module_workforce, module_warehouse, module_reception';

function isHotelSettingsRow(value: unknown): value is HotelSettingsRow {
  const row = value as HotelSettingsRow;
  return (
    typeof row?.name === 'string' &&
    typeof row.address === 'string' &&
    (row.id_prefix === null || typeof row.id_prefix === 'string') &&
    (row.system_hotel_id === null || typeof row.system_hotel_id === 'string') &&
    typeof row.geofence_radius_m === 'number' &&
    typeof row.module_workforce === 'boolean' &&
    typeof row.module_warehouse === 'boolean' &&
    typeof row.module_reception === 'boolean'
  );
}

function optionalNumber(value: number | string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function fetchHotelSettings(): Promise<HotelSettings> {
  const { data, error } = await supabase
    .from('hotel_settings')
    .select(SELECT_COLUMNS)
    .eq('id', HOTEL_ROW_ID)
    .maybeSingle();
  if (error || !isHotelSettingsRow(data)) throw new Error(LOAD_ERROR);

  const standardShiftHours = Number(data.standard_shift_hours);
  if (!Number.isFinite(standardShiftHours)) throw new Error(LOAD_ERROR);

  return {
    name: data.name,
    address: data.address,
    idPrefix: data.id_prefix,
    systemHotelId: data.system_hotel_id,
    latitude: optionalNumber(data.latitude),
    longitude: optionalNumber(data.longitude),
    geofenceRadiusM: data.geofence_radius_m,
    standardShiftHours,
    modules: {
      workforce: data.module_workforce,
      warehouse: data.module_warehouse,
      reception: data.module_reception,
    },
  };
}

function toUpdateRow(update: HotelSettingsUpdate): Record<string, unknown> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (update.name !== undefined) row.name = update.name.trim();
  if (update.address !== undefined) row.address = update.address.trim();
  if (update.idPrefix !== undefined) row.id_prefix = update.idPrefix;
  if (update.systemHotelId !== undefined) row.system_hotel_id = update.systemHotelId;
  if (update.latitude !== undefined) row.latitude = update.latitude;
  if (update.longitude !== undefined) row.longitude = update.longitude;
  if (update.geofenceRadiusM !== undefined) row.geofence_radius_m = update.geofenceRadiusM;
  if (update.standardShiftHours !== undefined) row.standard_shift_hours = update.standardShiftHours;
  if (update.modules?.workforce !== undefined) row.module_workforce = update.modules.workforce;
  if (update.modules?.warehouse !== undefined) row.module_warehouse = update.modules.warehouse;
  if (update.modules?.reception !== undefined) row.module_reception = update.modules.reception;
  return row;
}

export async function saveHotelSettings(update: HotelSettingsUpdate): Promise<void> {
  const { data, error } = await supabase
    .from('hotel_settings')
    .update(toUpdateRow(update))
    .eq('id', HOTEL_ROW_ID)
    .select('id');
  if (error) {
    if (error.code === 'P0001') throw new Error(error.message);
    throw new Error(SAVE_ERROR);
  }
  if (!data?.length) throw new Error(SAVE_ERROR);
}
