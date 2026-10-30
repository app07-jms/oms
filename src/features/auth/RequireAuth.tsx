import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthProvider';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, permissions, permissionsError, logout } = useAuth();

  if (!session) return <Navigate to="/login" replace />;

  if (permissionsError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F8FAFC] px-6 text-center">
        <p role="alert" className="text-sm text-red-700">
          {permissionsError}
        </p>
        <Button type="button" onClick={logout} className="h-10 bg-[#4F7284] text-white transition-colors duration-200 hover:bg-[#3F5C6C]">
          Đăng xuất
        </Button>
      </div>
    );
  }

  if (!permissions) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <p className="flex items-center gap-2 text-sm text-[#64748B]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Đang tải tài khoản...
        </p>
      </div>
    );
  }

  return children;
}
