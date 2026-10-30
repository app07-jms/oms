import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { navigationGroups, visibleNavigationForPermissions, type NavGroup } from '@/config/navigation';
import { useAuth } from '@/features/auth/AuthProvider';
import { visibleNavigationGroups } from '@/features/hotel/hotelRules';
import { useHotelSettings } from '@/features/hotel/HotelSettingsProvider';
import { cn } from '@/lib/utils';

interface NavTreeProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function NavTree({ collapsed = false, onNavigate }: NavTreeProps) {
  const { settings } = useHotelSettings();
  const { permissions } = useAuth();
  const moduleGroups = visibleNavigationGroups(navigationGroups, settings.modules);
  const groups = permissions ? visibleNavigationForPermissions(moduleGroups, permissions) : [];

  return (
    <nav aria-label="Menu chính" className="flex flex-col gap-1">
      {groups.map((group) =>
        collapsed ? (
          <CollapsedNavGroup key={group.id} group={group} onNavigate={onNavigate} />
        ) : (
          <NavGroupItem key={group.id} group={group} onNavigate={onNavigate} />
        )
      )}
    </nav>
  );
}

function NavGroupItem({ group, onNavigate }: { group: NavGroup; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const containsActive = group.items.some((item) => item.path === pathname);
  const [open, setOpen] = useState(containsActive);
  const Icon = group.icon;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-background/60',
          containsActive && 'bg-background/60'
        )}
      >
        <Icon className={cn('h-5 w-5 shrink-0', containsActive && 'text-primary')} aria-hidden="true" />
        <span className="flex-1 truncate text-left">{group.title}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 transition-transform duration-200', open && 'rotate-180')}
          aria-hidden="true"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <ul className="ml-5 mt-1 flex flex-col gap-0.5 border-l border-border pl-3">
          {group.items.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'block rounded-md px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-primary font-medium text-primary-foreground'
                      : 'text-foreground hover:bg-background/60'
                  )
                }
              >
                {item.title}
              </NavLink>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

function CollapsedNavGroup({ group, onNavigate }: { group: NavGroup; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const Icon = group.icon;
  const containsActive = group.items.some((item) => item.path === pathname);

  const handleNavigate = () => {
    setOpen(false);
    onNavigate?.();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={group.title}
        className={cn(
          'mx-auto flex h-10 w-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-background/60',
          containsActive && 'bg-background/60 text-primary'
        )}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent side="right" align="start" sideOffset={12} className="w-56 p-2">
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {group.title}
        </p>
        <ul className="flex flex-col gap-0.5">
          {group.items.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={handleNavigate}
                className={({ isActive }) =>
                  cn(
                    'block rounded-md px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-primary font-medium text-primary-foreground'
                      : 'text-foreground hover:bg-accent'
                  )
                }
              >
                {item.title}
              </NavLink>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
