import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

export type UserRole = 'user' | 'admin';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole;
  isAdmin: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  isDemoMode: boolean;
  setRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: 'user',
  isAdmin: false,
  isAuthenticated: false,
  loading: true,
  isDemoMode: false,
  setRole: () => { },
});

/** Build a lightweight mock User object for demo mode. */
function buildDemoUser(role: UserRole): User {
  return {
    id: role === 'admin' ? 'demo-admin-id' : 'demo-user-id',
    email: role === 'admin' ? 'admin@example.com' : 'demo_user@example.com',
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: {},
    user_metadata: { full_name: role === 'admin' ? 'Demo Admin' : 'Demo User', role },
    created_at: new Date().toISOString(),
  } as unknown as User;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRoleState] = useState<UserRole>('user');
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('agentshield-role', newRole);
  };

  useEffect(() => {
    // ── 1. Check for demo token first ──
    const demoToken = localStorage.getItem('auth_token');
    if (demoToken?.startsWith('demo-token-')) {
      const demoRole: UserRole = localStorage.getItem('user_role') === 'admin' ? 'admin' : 'user';
      const mockUser = buildDemoUser(demoRole);
      setUser(mockUser);
      setRoleState(demoRole);
      setIsDemoMode(true);
      localStorage.setItem('agentshield-role', demoRole);
      localStorage.setItem('agentshield-name', mockUser.user_metadata.full_name);
      setLoading(false);
      return; // skip Supabase entirely
    }

    // ── 2. Normal Supabase flow ──
    const fetchProfileRole = async (userId: string): Promise<UserRole> => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();
        if (!error && data?.role) return data.role as UserRole;
      } catch { /* fall through */ }
      return (localStorage.getItem('agentshield-role') as UserRole) || 'user';
    };

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);

      if (s?.user) {
        const resolvedRole = await fetchProfileRole(s.user.id);
        setRoleState(resolvedRole);
        localStorage.setItem('agentshield-role', resolvedRole);
      }

      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);

      if (s?.user) {
        const resolvedRole = await fetchProfileRole(s.user.id);
        setRoleState(resolvedRole);
        localStorage.setItem('agentshield-role', resolvedRole);
      } else {
        setRoleState('user');
        localStorage.removeItem('agentshield-role');
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    session,
    role,
    isAdmin: role === 'admin',
    isAuthenticated: !!user || isDemoMode,
    loading,
    isDemoMode,
    setRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
