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
  setRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: 'user',
  isAdmin: false,
  isAuthenticated: false,
  loading: true,
  setRole: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRoleState] = useState<UserRole>('user');
  const [loading, setLoading] = useState(true);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('agentshield-role', newRole);
  };

  useEffect(() => {
    // Helper to resolve role from profiles table
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

    // Get initial session
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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);

      if (s?.user) {
        const resolvedRole = await fetchProfileRole(s.user.id);
        setRoleState(resolvedRole);
        localStorage.setItem('agentshield-role', resolvedRole);
      } else {
        // Logged out
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
    isAuthenticated: !!user,
    loading,
    setRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
