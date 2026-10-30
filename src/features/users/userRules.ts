export const USER_ROLES = ['admin', 'manager', 'hr', 'staff'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  manager: 'Quản lý',
  hr: 'Nhân sự',
  staff: 'Nhân viên',
};

export const USER_ROLE_BADGE_CLASS: Record<UserRole, string> = {
  admin: 'border-red-200 bg-red-50 text-red-700',
  manager: 'border-amber-200 bg-amber-50 text-amber-700',
  hr: 'border-purple-200 bg-purple-50 text-purple-700',
  staff: 'border-blue-200 bg-blue-50 text-blue-700',
};

export const DEFAULT_ACCOUNT_PASSWORD = 'Jenius@2026';

export const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,30}$/;

export interface AppUser {
  systemUid: string;
  username: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  employeeSystemUid: string | null;
}

export interface EmployeeOption {
  systemUid: string;
  code: string;
  fullName: string;
  department: string;
}

export interface UserAccountRow extends AppUser {
  employee: EmployeeOption | null;
}

export interface UserFilters {
  role: 'all' | UserRole;
  status: 'all' | 'active' | 'locked';
  search: string;
}

export const DEFAULT_USER_FILTERS: UserFilters = {
  role: 'all',
  status: 'all',
  search: '',
};

export interface NewAccountDraft {
  employeeSystemUid: string;
  username: string;
  fullName: string;
  role: UserRole;
}

export function createEmptyAccountDraft(): NewAccountDraft {
  return { employeeSystemUid: '', username: '', fullName: '', role: 'staff' };
}

export function isUserRole(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value);
}

export function applyUserFilters(rows: UserAccountRow[], filters: UserFilters): UserAccountRow[] {
  const query = filters.search.trim().toLowerCase();
  return rows.filter((row) => {
    if (filters.role !== 'all' && row.role !== filters.role) return false;
    if (filters.status === 'active' && !row.isActive) return false;
    if (filters.status === 'locked' && row.isActive) return false;
    if (!query) return true;
    return [row.username, row.fullName, row.employee?.code ?? '']
      .some((value) => value.toLowerCase().includes(query));
  });
}

export function validateAccountDraft(draft: NewAccountDraft, employees: EmployeeOption[]): string | null {
  if (draft.employeeSystemUid) {
    if (!employees.some((employee) => employee.systemUid === draft.employeeSystemUid)) {
      return 'Vui lòng chọn hồ sơ nhân viên hợp lệ.';
    }
    return null;
  }
  if (!USERNAME_PATTERN.test(draft.username.trim())) {
    return 'Tên đăng nhập chỉ gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang (3-30 ký tự).';
  }
  if (!draft.fullName.trim()) {
    return 'Vui lòng nhập họ và tên.';
  }
  return null;
}

export function employeeOptionLabel(employee: EmployeeOption): string {
  return `${employee.code} - ${employee.fullName} - ${employee.department}`;
}
