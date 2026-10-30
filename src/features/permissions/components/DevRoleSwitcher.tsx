import { useState } from 'react';
import { ChevronDown, ChevronUp, UserCog } from 'lucide-react';
import { useActiveRole } from '@/features/permissions/activeRoleContext';
import { cn } from '@/lib/utils';

interface TestRole {
  key: string;
  label: string;
  access: string;
  dotClass: string;
}

const TEST_ROLES: TestRole[] = [
  { key: 'super_admin', label: 'Test Super Admin', access: 'Toàn quyền', dotClass: 'bg-red-500' },
  { key: 'admin', label: 'Test Admin', access: 'Cấu hình khách sạn và nhân sự', dotClass: 'bg-blue-500' },
  { key: 'mod', label: 'Test Mod', access: 'Nhân viên thuộc bộ phận được gán', dotClass: 'bg-yellow-400' },
  { key: 'staff', label: 'Test Staff', access: 'Lịch làm việc và bảng chấm công cá nhân', dotClass: 'bg-green-500' },
];

export function DevRoleSwitcher() {
  const { activeRoleKey, setActiveRoleKey } = useActiveRole();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
      {isOpen && (
        <div className="flex w-72 flex-col gap-1 rounded-xl border border-[#E2E8F0] bg-white p-2 shadow-lg">
          <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-[#5C6670]">
            Xem với vai trò
          </p>
          {TEST_ROLES.map((role) => {
            const isActive = role.key === activeRoleKey;
            return (
              <button
                key={role.key}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveRoleKey(role.key)}
                className={cn(
                  'flex items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors duration-200',
                  isActive ? 'bg-[#4F7284]/10' : 'hover:bg-[#F7F9FA]',
                )}
              >
                <span className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', role.dotClass)} aria-hidden="true" />
                <span className="flex min-w-0 flex-col">
                  <span className={cn('text-sm font-medium', isActive ? 'text-[#4F7284]' : 'text-[#1F2A30]')}>
                    {role.label}
                  </span>
                  <span className="text-xs leading-relaxed text-[#5C6670]">{role.access}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#1F2A30] shadow-md transition-colors duration-200 hover:border-[#4F7284] hover:text-[#4F7284]"
      >
        <UserCog className="h-4 w-4" aria-hidden="true" />
        Dev: {TEST_ROLES.find((role) => role.key === activeRoleKey)?.label ?? 'Chọn vai trò'}
        {isOpen ? <ChevronDown className="h-4 w-4" aria-hidden="true" /> : <ChevronUp className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  );
}
