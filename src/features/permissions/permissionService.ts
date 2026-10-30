import { supabase } from '@/lib/supabase';
import {
  PERMISSION_FEATURES,
  emptyPermissionGrid,
  type DataScope,
  type OverrideMap,
  type PermissionAction,
  type PermissionGrid,
  type RoleSummary,
  type RoleTone,
  overrideKey,
  PERMISSION_ACTIONS,
} from '@/features/permissions/permissionRules';

const LOAD_ERROR = 'Không thể tải dữ liệu phân quyền.';
const DUPLICATE_ROLE = 'Tên vai trò này đã tồn tại.';
const ROLE_IN_USE = 'Không thể xóa vì vẫn còn người dùng thuộc vai trò này.';

interface RoleRow {
  key: string;
  name: string;
  description: string;
  tone: string;
  data_scope: string;
  departments: string[];
}

interface RolePermissionRow {
  feature_key: string;
  can_view: boolean;
  can_edit: boolean;
  can_approve: boolean;
  can_delete: boolean;
}

interface OverrideRow {
  feature_key: string;
  action: string;
  effect: string;
}

const ACTION_COLUMN: Record<PermissionAction, keyof Omit<RolePermissionRow, 'feature_key'>> = {
  view: 'can_view',
  edit: 'can_edit',
  approve: 'can_approve',
  delete: 'can_delete',
};

function assertRows<T>(data: unknown, guard: (value: unknown) => value is T): T[] {
  if (!Array.isArray(data) || !data.every(guard)) throw new Error(LOAD_ERROR);
  return data;
}

function isRoleRow(value: unknown): value is RoleRow {
  const row = value as RoleRow;
  return (
    typeof row?.key === 'string' &&
    typeof row.name === 'string' &&
    typeof row.description === 'string' &&
    typeof row.tone === 'string' &&
    typeof row.data_scope === 'string' &&
    Array.isArray(row.departments)
  );
}

function isRolePermissionRow(value: unknown): value is RolePermissionRow {
  const row = value as RolePermissionRow;
  return (
    typeof row?.feature_key === 'string' &&
    typeof row.can_view === 'boolean' &&
    typeof row.can_edit === 'boolean' &&
    typeof row.can_approve === 'boolean' &&
    typeof row.can_delete === 'boolean'
  );
}

function isOverrideRow(value: unknown): value is OverrideRow {
  const row = value as OverrideRow;
  return typeof row?.feature_key === 'string' && typeof row.action === 'string' && typeof row.effect === 'string';
}

function mapDatabaseError(error: { code?: string }, fallback: string, duplicateMessage?: string): Error {
  if (error.code === '23505' && duplicateMessage) return new Error(duplicateMessage);
  if (error.code === '23503') return new Error(ROLE_IN_USE);
  return new Error(fallback);
}

function gridFromRows(rows: RolePermissionRow[]): PermissionGrid {
  const grid = emptyPermissionGrid();
  for (const row of rows) {
    const feature = PERMISSION_FEATURES.find((item) => item.key === row.feature_key);
    if (!feature) continue;
    for (const action of PERMISSION_ACTIONS) {
      grid[feature.key][action] = row[ACTION_COLUMN[action]];
    }
  }
  return grid;
}

function rowsFromGrid(roleKey: string, grid: PermissionGrid) {
  return PERMISSION_FEATURES.map((feature) => ({
    role_key: roleKey,
    feature_key: feature.key,
    can_view: grid[feature.key].view,
    can_edit: grid[feature.key].edit,
    can_approve: grid[feature.key].approve,
    can_delete: grid[feature.key].delete,
  }));
}

export async function fetchRoles(): Promise<RoleSummary[]> {
  const [roleResult, userResult] = await Promise.all([
    supabase
      .from('roles')
      .select('key, name, description, tone, data_scope, departments')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase.from('app_users').select('role'),
  ]);
  if (roleResult.error) throw roleResult.error;
  if (userResult.error) throw userResult.error;

  const counts = new Map<string, number>();
  for (const row of (userResult.data ?? []) as { role: string }[]) {
    counts.set(row.role, (counts.get(row.role) ?? 0) + 1);
  }

  return assertRows(roleResult.data, isRoleRow).map((row) => ({
    key: row.key,
    name: row.name,
    description: row.description,
    tone: row.tone as RoleTone,
    dataScope: row.data_scope as DataScope,
    departments: row.departments,
    userCount: counts.get(row.key) ?? 0,
  }));
}

export async function createRole(input: { name: string; description: string; tone: RoleTone }): Promise<void> {
  const { error } = await supabase.from('roles').insert({
    name: input.name.trim(),
    description: input.description.trim(),
    tone: input.tone,
  });
  if (error) throw mapDatabaseError(error, 'Không thể thêm vai trò. Vui lòng thử lại.', DUPLICATE_ROLE);
}

export async function updateRoleDetails(roleKey: string, input: { name: string; description: string }): Promise<void> {
  const { data, error } = await supabase
    .from('roles')
    .update({ name: input.name.trim(), description: input.description.trim() })
    .eq('key', roleKey)
    .select('key');
  if (error) throw mapDatabaseError(error, 'Không thể cập nhật vai trò. Vui lòng thử lại.', DUPLICATE_ROLE);
  if (!data?.length) throw new Error('Không thể cập nhật vai trò. Vui lòng thử lại.');
}

export async function deleteRole(roleKey: string): Promise<void> {
  const { data, error } = await supabase.from('roles').delete().eq('key', roleKey).select('key');
  if (error) throw mapDatabaseError(error, 'Không thể xóa vai trò. Vui lòng thử lại.');
  if (!data?.length) throw new Error('Không thể xóa vai trò. Vui lòng thử lại.');
}

export async function fetchRoleGrid(roleKey: string): Promise<PermissionGrid> {
  const { data, error } = await supabase
    .from('role_permissions')
    .select('feature_key, can_view, can_edit, can_approve, can_delete')
    .eq('role_key', roleKey);
  if (error) throw new Error(LOAD_ERROR);
  return gridFromRows(assertRows(data, isRolePermissionRow));
}

export async function saveRoleConfiguration(
  roleKey: string,
  input: { dataScope: DataScope; departments: string[]; grid: PermissionGrid },
): Promise<void> {
  const { data, error } = await supabase
    .from('roles')
    .update({ data_scope: input.dataScope, departments: input.departments })
    .eq('key', roleKey)
    .select('key');
  if (error || !data?.length) throw new Error('Không thể lưu phạm vi dữ liệu. Vui lòng thử lại.');

  const { error: permissionError } = await supabase
    .from('role_permissions')
    .upsert(rowsFromGrid(roleKey, input.grid), { onConflict: 'role_key,feature_key' });
  if (permissionError) throw new Error('Không thể lưu cấu hình phân quyền. Vui lòng thử lại.');
}

export async function fetchUserPermissionContext(
  userSystemUid: string,
  roleKey: string,
): Promise<{ inherited: PermissionGrid; overrides: OverrideMap }> {
  const [inherited, overrideResult] = await Promise.all([
    fetchRoleGrid(roleKey),
    supabase.from('user_permission_overrides').select('feature_key, action, effect').eq('user_system_uid', userSystemUid),
  ]);
  if (overrideResult.error) throw new Error(LOAD_ERROR);

  const overrides: OverrideMap = {};
  for (const row of assertRows(overrideResult.data, isOverrideRow)) {
    if (row.effect !== 'grant' && row.effect !== 'revoke') throw new Error(LOAD_ERROR);
    overrides[`${row.feature_key}:${row.action}`] = row.effect;
  }
  return { inherited, overrides };
}

export async function saveUserOverrides(userSystemUid: string, overrides: OverrideMap): Promise<void> {
  const { error: deleteError } = await supabase
    .from('user_permission_overrides')
    .delete()
    .eq('user_system_uid', userSystemUid);
  if (deleteError) throw new Error('Không thể lưu quyền riêng lẻ. Vui lòng thử lại.');

  const rows = PERMISSION_FEATURES.flatMap((feature) =>
    PERMISSION_ACTIONS.flatMap((action) => {
      const effect = overrides[overrideKey(feature.key, action)];
      return effect
        ? [{ user_system_uid: userSystemUid, feature_key: feature.key, action, effect }]
        : [];
    }),
  );
  if (rows.length === 0) return;

  const { error: insertError } = await supabase.from('user_permission_overrides').insert(rows);
  if (insertError) throw new Error('Không thể lưu quyền riêng lẻ. Vui lòng thử lại.');
}
