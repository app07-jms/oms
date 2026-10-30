import { KeyRound, Link2, Lock, ShieldCheck, Unlock, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROLE_TONE_BADGE_CLASS, type RoleSummary } from '@/features/permissions/permissionRules';
import type { UserAccountRow } from '@/features/users/userRules';

interface UserTableProps {
  rows: UserAccountRow[];
  roles: RoleSummary[];
  hasAnyAccounts: boolean;
  isBusy: boolean;
  onLinkProfile: (row: UserAccountRow) => void;
  onEditRole: (row: UserAccountRow) => void;
  onOverridePermissions: (row: UserAccountRow) => void;
  onResetPassword: (row: UserAccountRow) => void;
  onToggleActive: (row: UserAccountRow) => void;
}

const HEAD_CLASS = 'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5C6670]';
const CELL_CLASS = 'px-4 py-3 align-middle text-sm text-[#1F2A30]';
const BADGE_BASE = 'inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium';

export function UserTable({
  rows,
  roles,
  hasAnyAccounts,
  isBusy,
  onLinkProfile,
  onEditRole,
  onOverridePermissions,
  onResetPassword,
  onToggleActive,
}: UserTableProps) {
  const roleByKey = new Map(roles.map((role) => [role.key, role]));
  return (
    <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#E2E8F0]">
          <thead className="bg-[#F8FAFC]">
            <tr>
              <th scope="col" className={HEAD_CLASS}>STT</th>
              <th scope="col" className={HEAD_CLASS}>Username</th>
              <th scope="col" className={HEAD_CLASS}>Họ và tên</th>
              <th scope="col" className={HEAD_CLASS}>Bộ phận</th>
              <th scope="col" className={HEAD_CLASS}>Vai trò</th>
              <th scope="col" className={HEAD_CLASS}>Trạng thái</th>
              <th scope="col" className={HEAD_CLASS}>Liên kết hồ sơ</th>
              <th scope="col" className={`${HEAD_CLASS} text-right`}>Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-[#5C6670]">
                  {hasAnyAccounts ? 'Không có tài khoản phù hợp với bộ lọc.' : 'Chưa có tài khoản nào.'}
                </td>
              </tr>
            )}
            {rows.map((row, index) => {
              return (
                <tr key={row.systemUid} className="transition-colors duration-150 hover:bg-[#F8FAFC]">
                  <td className={`${CELL_CLASS} text-[#5C6670]`}>{index + 1}</td>
                  <td className={`${CELL_CLASS} font-medium`}>{row.username}</td>
                  <td className={CELL_CLASS}>{row.fullName}</td>
                  <td className={`${CELL_CLASS} text-[#5C6670]`}>{row.employee?.department ?? '—'}</td>
                  <td className={CELL_CLASS}>
                    <span className={`${BADGE_BASE} ${ROLE_TONE_BADGE_CLASS[roleByKey.get(row.role)?.tone ?? 'slate']}`}>
                      {roleByKey.get(row.role)?.name ?? row.role}
                    </span>
                  </td>
                  <td className={CELL_CLASS}>
                    {row.isActive ? (
                      <span className={`${BADGE_BASE} border-emerald-200 bg-emerald-50 text-emerald-700`}>Hoạt động</span>
                    ) : (
                      <span className={`${BADGE_BASE} border-red-200 bg-red-50 text-red-700`}>Đã khóa</span>
                    )}
                  </td>
                  <td className={CELL_CLASS}>
                    {row.employee ? (
                      <span className={`${BADGE_BASE} border-[#4F7284]/20 bg-[#4F7284]/10 text-[#3D5B69]`}>
                        {row.employee.code} - {row.employee.fullName}
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onLinkProfile(row)}
                        className="h-8 border-dashed border-[#4F7284] text-[#4F7284] hover:bg-[#4F7284]/5 hover:text-[#3D5B69]"
                      >
                        <Link2 className="mr-1.5 h-3.5 w-3.5" />
                        Liên kết hồ sơ
                      </Button>
                    )}
                  </td>
                  <td className={CELL_CLASS}>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onResetPassword(row)}
                        disabled={isBusy}
                        className="h-8 border-[#E2E8F0] text-[#1F2A30]"
                      >
                        <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                        Reset MK
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditRole(row)}
                        disabled={isBusy}
                        className="h-8 border-[#E2E8F0] text-[#1F2A30]"
                      >
                        <UserCog className="mr-1.5 h-3.5 w-3.5" />
                        Sửa vai trò
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOverridePermissions(row)}
                        disabled={isBusy}
                        className="h-8 border-[#4F7284]/40 text-[#3D5B69] hover:bg-[#4F7284]/5 hover:text-[#3D5B69]"
                      >
                        <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                        Phân quyền riêng
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onToggleActive(row)}
                        disabled={isBusy}
                        className={
                          row.isActive
                            ? 'h-8 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-700'
                            : 'h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700'
                        }
                      >
                        {row.isActive ? <Lock className="mr-1.5 h-3.5 w-3.5" /> : <Unlock className="mr-1.5 h-3.5 w-3.5" />}
                        {row.isActive ? 'Khóa' : 'Mở khóa'}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
