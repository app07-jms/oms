import { useCatalogResource } from '@/hooks/useCatalogResource';
import { fetchRoles } from '@/features/permissions/permissionService';

const LOAD_ERROR = 'Không thể tải danh sách vai trò.';

export function useRoles() {
  return useCatalogResource(fetchRoles, LOAD_ERROR);
}
