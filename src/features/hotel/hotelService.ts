import { supabase } from '@/lib/supabase';
import { buildSystemHotelId, generateHotelHash, type HotelSettings } from '@/features/hotel/hotelRules';

const LOAD_ERROR = 'Không thể tải cấu hình khách sạn.';
const SAVE_ERROR = 'Không thể lưu cấu hình khách sạn. Vui lòng thử lại.';
const DELETE_ERROR = 'Không thể xóa khách sạn. Vui lòng thử lại.';
const DELETE_IN_USE_ERROR = 'Không thể xóa khách sạn đang có dữ liệu chấm công hoặc lịch làm việc.';
const FOREIGN_KEY_VIOLATION = '23503';
const RAISED_EXCEPTION = 'P0001';

interface HotelRow {
  id: string;
  system_hotel_id: string;
  name: string;
  address: string;
  id_prefix: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  geofence_radius_m: number;
  standard_shift_hours: number | string;
  module_workforce: boolean;
  module_warehouse: boolean;
  module_reception: boolean;
}

export interface HotelInfoInput {
  name: string;
  address: string;
}

export interface NewHotelInput extends HotelInfoInput {
  idPrefix: string;
}

export interface HotelSettingsUpdate {
  latitude?: number | null;
  longitude?: number | null;
  geofenceRadiusM?: number;
  standardShiftHours?: number;
  modules?: Partial<HotelSettings['modules']>;
}

const SELECT_COLUMNS =
  'id, system_hotel_id, name, address, id_prefix, latitude, longitude, geofence_radius_m, standard_shift_hours, module_workforce, module_warehouse, module_reception';

function isHotelRow(value: unknown): value is HotelRow {
  const row = value as HotelRow;
  return (
    typeof row?.id === 'string' &&
    typeof row.system_hotel_id === 'string' &&
    typeof row.name === 'string' &&
    typeof row.address === 'string' &&
    (row.id_prefix === null || typeof row.id_prefix === 'string') &&
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

function toHotelSettings(row: HotelRow): HotelSettings {
  const standardShiftHours = Number(row.standard_shift_hours);
  if (!Number.isFinite(standardShiftHours)) throw new Error(LOAD_ERROR);

  return {
    id: row.id,
    name: row.name,
    address: row.address,
    idPrefix: row.id_prefix,
    systemHotelId: row.system_hotel_id,
    latitude: optionalNumber(row.latitude),
    longitude: optionalNumber(row.longitude),
    geofenceRadiusM: row.geofence_radius_m,
    standardShiftHours,
    modules: {
      workforce: row.module_workforce,
      warehouse: row.module_warehouse,
      reception: row.module_reception,
    },
  };
}

export async function listHotels(): Promise<HotelSettings[]> {
  const { data, error } = await supabase.from('hotels').select(SELECT_COLUMNS).order('created_at', { ascending: true });
  if (error || !Array.isArray(data) || !data.every(isHotelRow)) throw new Error(LOAD_ERROR);
  return data.map(toHotelSettings);
}

export async function fetchHotelSettings(hotelId: string): Promise<HotelSettings> {
  const { data, error } = await supabase.from('hotels').select(SELECT_COLUMNS).eq('id', hotelId).maybeSingle();
  if (error || !isHotelRow(data)) throw new Error(LOAD_ERROR);
  return toHotelSettings(data);
}

export async function createHotel(input: NewHotelInput): Promise<void> {
  const { error } = await supabase.from('hotels').insert({
    name: input.name.trim(),
    address: input.address.trim(),
    id_prefix: input.idPrefix,
    system_hotel_id: buildSystemHotelId(input.idPrefix, generateHotelHash()),
  });
  if (error) throw new Error(SAVE_ERROR);
}

export async function updateHotelInfo(hotelId: string, input: HotelInfoInput): Promise<void> {
  const { data, error } = await supabase
    .from('hotels')
    .update({ name: input.name.trim(), address: input.address.trim() })
    .eq('id', hotelId)
    .select('id');
  if (error) {
    if (error.code === RAISED_EXCEPTION) throw new Error(error.message);
    throw new Error(SAVE_ERROR);
  }
  if (!data?.length) throw new Error(SAVE_ERROR);
}

function toConfigRow(update: HotelSettingsUpdate): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (update.latitude !== undefined) row.latitude = update.latitude;
  if (update.longitude !== undefined) row.longitude = update.longitude;
  if (update.geofenceRadiusM !== undefined) row.geofence_radius_m = update.geofenceRadiusM;
  if (update.standardShiftHours !== undefined) row.standard_shift_hours = update.standardShiftHours;
  if (update.modules?.workforce !== undefined) row.module_workforce = update.modules.workforce;
  if (update.modules?.warehouse !== undefined) row.module_warehouse = update.modules.warehouse;
  if (update.modules?.reception !== undefined) row.module_reception = update.modules.reception;
  return row;
}

export async function saveHotelSettings(hotelId: string, update: HotelSettingsUpdate): Promise<void> {
  const { data, error } = await supabase
    .from('hotels')
    .update(toConfigRow(update))
    .eq('id', hotelId)
    .select('id');
  if (error) {
    if (error.code === RAISED_EXCEPTION) throw new Error(error.message);
    throw new Error(SAVE_ERROR);
  }
  if (!data?.length) throw new Error(SAVE_ERROR);
}

export async function deleteHotel(hotelId: string): Promise<void> {
  const { data, error } = await supabase.from('hotels').delete().eq('id', hotelId).select('id');
  if (error) throw new Error(error.code === FOREIGN_KEY_VIOLATION ? DELETE_IN_USE_ERROR : DELETE_ERROR);
  if (!data?.length) throw new Error(DELETE_ERROR);
}
