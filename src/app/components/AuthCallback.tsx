import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Shield, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

/**
 * Handles the OAuth redirect from Google (or any provider).
 * Supabase auto-processes the URL hash/code, then we read
 * the user's role from metadata and redirect accordingly.
 */
export default function AuthCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        const handleCallback = async () => {
            // Wait for Supabase to finish processing the OAuth callback
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error || !session) {
                // If something went wrong, go back to auth page
                navigate('/auth');
                return;
            }

            const role = session.user.user_metadata?.role;
            if (role === 'admin') {
                navigate('/dashboard');
            } else {
                navigate('/chat');
            }
        };

        // Listen for the AUTH_CALLBACK event fired after Google redirect
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                const role = session.user.user_metadata?.role;
                if (role === 'admin') {
                    navigate('/dashboard');
                } else {
                    navigate('/chat');
                }
            } else if (event === 'SIGNED_OUT') {
                navigate('/auth');
            }
        });

        handleCallback();

        return () => subscription.unsubscribe();
    }, [navigate]);

    return (
        <div className="min-h-screen bg-[#060a13] flex flex-col items-center justify-center gap-6 relative overflow-hidden">
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
                </div>
            </div>
        </div>
    );
}
