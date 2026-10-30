import { useCatalogResource } from '@/hooks/useCatalogResource';
import { fetchUserAccounts } from '@/features/users/userService';

const LOAD_ERROR = 'Không thể tải danh sách tài khoản.';

export function useUserAccounts() {
  return useCatalogResource(fetchUserAccounts, LOAD_ERROR);
}
