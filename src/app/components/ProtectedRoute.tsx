import { Navigate } from 'react-router';
import { useAuth } from '../lib/AuthProvider';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0a0f1a]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-semibold">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
