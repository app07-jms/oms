import { Menu } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { NotificationsMenu } from '@/components/layout/NotificationsMenu';
import { UserMenu } from '@/components/layout/UserMenu';
import { Button } from '@/components/ui/button';
import { useSession } from '@/features/auth/AuthProvider';
import { SUPER_ADMIN_ROLE_KEY } from '@/features/permissions/permissionRules';
import { DevRoleSwitcher } from '@/features/permissions/components/DevRoleSwitcher';

interface AppHeaderProps {
  onOpenMenu: () => void;
}

export function AppHeader({ onOpenMenu }: AppHeaderProps) {
  const { account } = useSession();
  const isSuperAdmin = account.roleKey === SUPER_ADMIN_ROLE_KEY;
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background px-4 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="text-foreground lg:hidden"
        onClick={onOpenMenu}
        aria-label="Mở menu"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </Button>

      <div className="flex items-center">
        <Logo />
        <span className="ml-2 whitespace-nowrap text-base font-semibold tracking-tight text-foreground">
          OMS by Jenius
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {isSuperAdmin && <DevRoleSwitcher />}
        <NotificationsMenu />
        <UserMenu />
      </div>
    </header>
  );
}
