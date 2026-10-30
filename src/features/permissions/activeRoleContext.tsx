import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { SUPER_ADMIN_ROLE_KEY } from '@/features/permissions/permissionRules';

interface ActiveRoleContextValue {
  activeRoleKey: string;
  setActiveRoleKey: (roleKey: string) => void;
}

const ActiveRoleContext = createContext<ActiveRoleContextValue | null>(null);

export function ActiveRoleProvider({ children }: { children: ReactNode }) {
  const [activeRoleKey, setActiveRoleKey] = useState(SUPER_ADMIN_ROLE_KEY);
  const value = useMemo(() => ({ activeRoleKey, setActiveRoleKey }), [activeRoleKey]);
  return <ActiveRoleContext.Provider value={value}>{children}</ActiveRoleContext.Provider>;
}

export function useActiveRole(): ActiveRoleContextValue {
  const context = useContext(ActiveRoleContext);
  if (!context) throw new Error('useActiveRole must be used inside ActiveRoleProvider');
  return context;
}
