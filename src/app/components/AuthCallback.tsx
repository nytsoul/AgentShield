import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

/**
 * Auth callback handler.
 * Handles both:
 * 1. Backend Google OAuth redirect (token & email in query params)
 * 2. Supabase session-based auth
 */
export default function AuthCallback() {
    const navigate = useNavigate();
    const [errorMessage, setErrorMessage] = useState<string>('');

    useEffect(() => {
        const handleLogin = async () => {
            try {
                // ── 1. Check for backend OAuth redirect params ──
                const params = new URLSearchParams(window.location.search);
                const token = params.get('token');
                const email = params.get('email');

                if (token && email) {
                    // Backend Google OAuth flow — store token and redirect
                    const savedRole = localStorage.getItem('agentshield-role') || 'user';
                    localStorage.setItem('auth_token', token);
                    localStorage.setItem('user_email', email);
                    localStorage.setItem('user_role', savedRole);
                    localStorage.setItem('agentshield-name', email.split('@')[0]);
                    navigate(savedRole === 'admin' ? '/admin' : '/dashboard');
                    return;
                }

                // ── 2. Supabase session fallback ──
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error || !session) {
                    console.warn('No session found, redirecting to auth page');
                    navigate('/auth');
                    return;
                }
                const role = session.user.user_metadata?.role || localStorage.getItem('agentshield-role') || 'user';
                localStorage.setItem('agentshield-role', role);
                localStorage.setItem('user_role', role);
                navigate(role === 'admin' ? '/admin' : '/dashboard');
            } catch (err) {
                console.error('Auth callback error:', err);
                setErrorMessage('Authentication failed. Please try again.');
                navigate('/auth');
            }
        };
        handleLogin();
    }, [navigate]);

    return (
        <div className="fixed inset-0 bg-[#060a13] flex flex-col items-center justify-center gap-6 relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-6">
                <div className="size-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-xl shadow-cyan-500/25">
                    <Shield className="size-8 text-white" />
                </div>
                <div className="relative">
                    <div className="size-10 border-2 border-cyan-500/40 border-t-cyan-400 rounded-full animate-spin" />
                </div>
                <div className="text-center">
                    <p className="text-white font-bold text-sm mb-1">Verifying credentials</p>
                    <p className="text-slate-500 text-xs">Completing secure authentication…</p>
                    {errorMessage && (
                        <p className="text-red-500 text-xs mt-2">{errorMessage}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
