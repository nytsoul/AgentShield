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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);

      if (s?.user) {
        // Read role from user_metadata first, then localStorage fallback
        const metaRole = s.user.user_metadata?.role as UserRole | undefined;
        const storedRole = localStorage.getItem('agentshield-role') as UserRole | null;
        const resolvedRole = metaRole || storedRole || 'user';
        setRoleState(resolvedRole);
        localStorage.setItem('agentshield-role', resolvedRole);
      }

      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);

      if (s?.user) {
        const metaRole = s.user.user_metadata?.role as UserRole | undefined;
        const storedRole = localStorage.getItem('agentshield-role') as UserRole | null;
        const resolvedRole = metaRole || storedRole || 'user';
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
