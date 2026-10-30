import { Eye } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSession, useViewerRole } from '@/features/auth/AuthProvider';
import { useRoles } from '@/features/permissions/useRoles';

export function DevRoleSwitcher() {
  const { account } = useSession();
  const { roleKey, setRoleKey } = useViewerRole();
  const roles = useRoles();

  return (
    <div className="hidden items-center gap-2 rounded-md border border-dashed border-border px-2 py-1 md:flex">
      <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">Xem với vai trò</span>
      <Select
        value={roleKey}
        onValueChange={(value) => setRoleKey(value === account.roleKey ? null : value)}
        disabled={!roles.data}
      >
        <SelectTrigger className="h-8 w-44 text-xs" aria-label="Chọn vai trò xem">
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
