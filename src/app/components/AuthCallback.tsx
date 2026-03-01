import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

/**
 * Default login fallback.
 * This component checks for an existing Supabase session and redirects the user
 * based on their role (admin or regular user). It deliberately ignores any
 * Google OAuth `code` query parameter, providing a simple, reliable login path.
 */
export default function AuthCallback() {
    const navigate = useNavigate();
    const [errorMessage, setErrorMessage] = useState<string>('');

    useEffect(() => {
        const handleLogin = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error || !session) {
                    console.warn('No session found, redirecting to auth page');
                    navigate('/auth');
                    return;
                }
                const role = session.user.user_metadata?.role;
                if (role === 'admin') {
                    navigate('/dashboard');
                } else {
                    navigate('/chat');
                }
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
