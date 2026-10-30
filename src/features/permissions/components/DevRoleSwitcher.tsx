import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useActiveRole } from '@/features/permissions/activeRoleContext';
import { useRoles } from '@/features/permissions/useRoles';

export function DevRoleSwitcher() {
  const roles = useRoles();
  const { activeRoleKey, setActiveRoleKey } = useActiveRole();

  return (
    <div className="hidden items-center gap-2 md:flex">
      <span className="whitespace-nowrap text-xs font-medium text-[#5C6670]">Xem với vai trò</span>
      <Select value={activeRoleKey} onValueChange={setActiveRoleKey} disabled={!roles.data?.length}>
        <SelectTrigger aria-label="Vai trò đang xem" className="h-9 w-[160px] border-[#E2E8F0] bg-white text-sm">
          <SelectValue placeholder="Đang tải..." />
        </SelectTrigger>
        <SelectContent>
          {(roles.data ?? []).map((role) => (
            <SelectItem key={role.key} value={role.key}>
              {role.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
