import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Shield, Mail, Lock, User, ArrowRight, Zap, ShieldCheck, Loader2, Eye, EyeOff, Fingerprint, KeyRound, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

// Declare Google sign-in type
declare global {
    interface Window {
        google: any;
    }
}

// Google icon SVG component
const GoogleIcon = () => (
    <svg className="size-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

// GitHub icon SVG
const GithubIcon = () => (
    <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
);

// Animated grid background
const GridBackground = () => (
    <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-cyan-500/15 via-blue-500/10 to-transparent rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-gradient-to-tl from-violet-500/12 via-cyan-500/8 to-transparent rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[80px]" />

        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                    <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
            <motion.div
                key={i}
                className="absolute size-1 bg-cyan-400/30 rounded-full"
                style={{ left: `${15 + i * 15}%`, top: `${10 + (i % 3) * 30}%` }}
                animate={{ y: [0, -30, 0], opacity: [0.2, 0.6, 0.2] }}
                transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
            />
        ))}
    </div>
);

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [role, setRole] = useState<'user' | 'admin'>('user');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const navigate = useNavigate();

    // Memoized callback for credential response
    const handleGoogleCredentialResponse = useCallback(async (response: any) => {
        try {
            console.log('📌 Received credential response:', !!response?.credential);

            if (!response?.credential) {
                throw new Error('No credential received from Google');
            }

            console.log('📤 Sending ID token to backend...');

            // Send the ID token to our backend
            const res = await fetch('http://localhost:8000/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_token: response.credential })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ detail: 'Unknown error' }));
                throw new Error(errorData.detail || `Backend error: ${res.status}`);
            }

            const data = await res.json();
            console.log('✅ Successfully authenticated:', data.email);

            localStorage.setItem('auth_token', data.access_token);
            localStorage.setItem('user_email', data.email);
            localStorage.setItem('user_role', data.role || 'user');

            // Redirect to dashboard
            navigate('/dashboard');
        } catch (error: any) {
            console.error('❌ Credential response error:', error);
            setErrorMsg(error.message || 'Failed to sign in with Google');
            setLoading(false);
        }
    }, [navigate]);

    // Load Google Sign-In script and initialize
    useEffect(() => {
        const loadGoogleScript = () => {
            // Check if script already loaded
            if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
                console.log('Google GSI script already loaded');
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;

            script.onload = () => {
                console.log('✅ Google GSI script loaded');
                // Initialize Google Sign-In
                if (window.google?.accounts?.id) {
                    const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;
                    if (!clientId) {
                        console.error('❌ VITE_GOOGLE_CLIENT_ID not configured');
                        return;
                    }

                    window.google.accounts.id.initialize({
                        client_id: clientId,
                        callback: handleGoogleCredentialResponse,
                        auto_select: false,
                        ux_mode: 'popup'
                    });
                    console.log('✅ Google Sign-In initialized with client ID:', clientId.substring(0, 20) + '...');
                } else {
                    console.error('❌ window.google.accounts.id not available');
                }
            };

            script.onerror = () => {
                console.error('❌ Failed to load Google GSI script');
            };

            document.head.appendChild(script);
        };

        loadGoogleScript();
    }, [handleGoogleCredentialResponse]);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setErrorMsg(null);

        try {
            localStorage.setItem('agentshield-role', role);

            if (!window.google) {
                console.error('Google Sign-In not loaded, initiating OAuth fallback');
                await initiateGoogleOAuth();
                return;
            }

            // Use One Tap prompt to request credential
            console.log('Opening Google One Tap prompt...');
            window.google.accounts.id.prompt((notification: any) => {
                if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                    console.warn('One Tap not displayed, initiating manual OAuth flow');
                    initiateGoogleOAuth();
                } else if (notification.isDismissedMoment()) {
                    console.log('User dismissed One Tap');
                    setErrorMsg('Sign in cancelled');
                    setLoading(false);
                }
            });
        } catch (error: any) {
            console.error('Google Sign-In error:', error);
            // Fallback to traditional OAuth
            await initiateGoogleOAuth();
        }
    };

    const initiateGoogleOAuth = async () => {
        try {
            // Get Google client ID from environment
            const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;
            const redirectUri = `${window.location.origin}/auth/callback`;

            if (!clientId) {
                throw new Error('Google Client ID not configured');
            }

            // Redirect to Google OAuth
            const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
            googleAuthUrl.searchParams.append('client_id', clientId);
            googleAuthUrl.searchParams.append('redirect_uri', redirectUri);
            googleAuthUrl.searchParams.append('response_type', 'code');
            googleAuthUrl.searchParams.append('scope', 'openid email profile');

            window.location.href = googleAuthUrl.toString();
        } catch (error: any) {
            console.error('OAuth initiation error:', error);
            setErrorMsg(error.message);
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        try {
            if (isLogin) {
                // ── Login: verify email + password via Supabase Auth ──
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;

                // Fetch the user's profile from the profiles table
                const { data: profile, error: profileErr } = await supabase
                    .from('profiles')
                    .select('role,full_name')
                    .eq('id', data.user.id)
                    .single();

                if (profileErr) {
                    console.warn('Profile fetch failed, using default role:', profileErr.message);
                }

                const resolvedRole = profile?.role || role;
                localStorage.setItem('agentshield-role', resolvedRole);
                await supabase.auth.updateUser({ data: { role: resolvedRole, full_name: profile?.full_name } });
                navigate('/dashboard');

            } else {
                // ── Register: create auth user + profile row via trigger ──
                if (password.length < 6) {
                    throw new Error('Password must be at least 6 characters.');
                }

                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { full_name: name, role } }
                });
                if (error) throw error;

                if (!data.user) {
                    throw new Error('Registration failed. Please try again.');
                }

                // The database trigger auto-creates the profile row.
                // Also upsert into profiles as a safety net.
                await supabase.from('profiles').upsert({
                    id: data.user.id,
                    email,
                    full_name: name,
                    role,
                }, { onConflict: 'id' });

                localStorage.setItem('agentshield-role', role);
                navigate('/dashboard');
            }
        } catch (error: any) {
            setErrorMsg(error.message || 'An error occurred during authentication.');
        } finally {
            setLoading(false);
        }
    };

    const inputBase = 'w-full bg-slate-100 dark:bg-slate-900/50 border rounded-xl py-3.5 pl-12 pr-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none transition-all duration-300 font-medium text-sm';
    const inputFocused = 'border-cyan-500/60 ring-2 ring-cyan-500/20 dark:bg-slate-900/80 bg-white';
    const inputDefault = 'border-slate-300 dark:border-slate-800/80 hover:border-slate-400 dark:hover:border-slate-700';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-slate-100 dark:from-[#060a13] dark:via-slate-900 dark:to-[#060a13] flex items-center justify-center p-4 transition-colors">
            {/* Ambient blobs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-gradient-to-br from-cyan-400/10 dark:from-cyan-500/10 to-transparent rounded-full blur-[100px] animate-pulse" />
                <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-gradient-to-tl from-violet-400/10 dark:from-violet-500/10 to-transparent rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-[420px]"
            >
                {/* Brand Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/25 mb-4">
                        <Shield className="size-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        Agent<span className="text-cyan-500">Shield</span>
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">AI Security Platform</p>
                </div>

                {/* Card */}
                <div className="bg-white/90 dark:bg-slate-900/60 backdrop-blur-2xl border border-slate-200 dark:border-slate-800/70 rounded-2xl p-7 shadow-xl shadow-slate-200/60 dark:shadow-black/40">
                    {/* Header */}
                    <div className="mb-6">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">
                            {isLogin ? 'Welcome back' : 'Create account'}
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-500">
                            {isLogin ? 'Sign in to your security dashboard' : 'Start protecting your AI infrastructure'}
                        </p>
                    </div>

                    {/* Social Buttons */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            className="flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 transition-all duration-200 group"
                        >
                            <GoogleIcon />
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Google</span>
                        </button>
                        <button
                            disabled={loading}
                            className="flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 transition-all duration-200 group"
                        >
                            <GithubIcon />
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">GitHub</span>
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-4 mb-5">
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">or</span>
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                        {errorMsg && (
                            <motion.div
                                initial={{ opacity: 0, y: -8, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: -8, height: 0 }}
                                className="mb-4"
                            >
                                <div className="p-3 bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2.5">
                                    <div className="size-2 rounded-full bg-red-500 shrink-0" />
                                    {errorMsg}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <AnimatePresence mode="wait">
                            {!isLogin && (
                                <motion.div
                                    key="name-field"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="relative">
                                        <User className={`absolute left-4 top-1/2 -translate-y-1/2 size-4 transition-colors duration-200 ${focusedField === 'name' ? 'text-cyan-500' : 'text-slate-400'}`} />
                                        <input
                                            type="text"
                                            className={`${inputBase} ${focusedField === 'name' ? inputFocused : inputDefault}`}
                                            placeholder="Full name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            onFocus={() => setFocusedField('name')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="relative">
                            <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 size-4 transition-colors duration-200 ${focusedField === 'email' ? 'text-cyan-500' : 'text-slate-400'}`} />
                            <input
                                type="email"
                                className={`${inputBase} ${focusedField === 'email' ? inputFocused : inputDefault}`}
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                                required
                            />
                        </div>

                        <div className="relative">
                            <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 size-4 transition-colors duration-200 ${focusedField === 'password' ? 'text-cyan-500' : 'text-slate-400'}`} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className={`${inputBase} pr-12 ${focusedField === 'password' ? inputFocused : inputDefault}`}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>

                        {/* Role (Register only) */}
                        <AnimatePresence>
                            {!isLogin && (
                                <motion.div key="role" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button type="button" onClick={() => setRole('user')}
                                            className={`relative flex items-center gap-2.5 p-3 rounded-xl border transition-all ${role === 'user'
                                                ? 'border-cyan-500/50 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-300'
                                                : 'border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40 text-slate-500'
                                                }`}>
                                            <div className={`p-1.5 rounded-lg ${role === 'user' ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400' : 'bg-slate-100 dark:bg-slate-700/60 text-slate-400'}`}>
                                                <User className="size-3.5" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-xs font-bold">User</p>
                                                <p className="text-[10px] text-slate-400">Standard</p>
                                            </div>
                                            {role === 'user' && <motion.div layoutId="role-indicator" className="absolute top-2 right-2 size-2 rounded-full bg-cyan-400" />}
                                        </button>
                                        <button type="button" onClick={() => setRole('admin')}
                                            className={`relative flex items-center gap-2.5 p-3 rounded-xl border transition-all ${role === 'admin'
                                                ? 'border-cyan-500/50 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-300'
                                                : 'border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40 text-slate-500'
                                                }`}>
                                            <div className={`p-1.5 rounded-lg ${role === 'admin' ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400' : 'bg-slate-100 dark:bg-slate-700/60 text-slate-400'}`}>
                                                <ShieldCheck className="size-3.5" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-xs font-bold">Admin</p>
                                                <p className="text-[10px] text-slate-400">Full access</p>
                                            </div>
                                            {role === 'admin' && <motion.div layoutId="role-indicator" className="absolute top-2 right-2 size-2 rounded-full bg-cyan-400" />}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full relative overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-cyan-500/20 transition-all duration-300 flex items-center justify-center gap-2 group mt-1"
                        >
                            {loading ? (
                                <Loader2 className="size-5 animate-spin" />
                            ) : (
                                <>
                                    {isLogin ? 'Sign In' : 'Create Account'}
                                    <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform duration-200" />
                                </>
                            )}
                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        </button>
                    </form>

                    {/* Toggle */}
                    <p className="text-center text-sm text-slate-500 dark:text-slate-500 mt-5">
                        {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                        <button
                            type="button"
                            onClick={() => { setIsLogin(!isLogin); setErrorMsg(null); }}
                            className="text-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400 font-semibold transition-colors"
                        >
                            {isLogin ? 'Sign up' : 'Sign in'}
                        </button>
                    </p>

                    {/* Demo Login */}
                    <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800">
                        <p className="text-center text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Quick Demo Access</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                disabled={loading}
                                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 disabled:opacity-50 transition-all text-sm font-semibold"
                                onClick={() => {
                                    localStorage.setItem('auth_token', 'demo-token-user');
                                    localStorage.setItem('user_email', 'demo_user@example.com');
                                    localStorage.setItem('user_role', 'user');
                                    localStorage.setItem('agentshield-role', 'user');
                                    localStorage.setItem('agentshield-name', 'Demo User');
                                    window.location.href = '/dashboard';
                                }}
                            >
                                <User className="size-4" />
                                Demo User
                            </button>
                            <button
                                type="button"
                                disabled={loading}
                                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 disabled:opacity-50 transition-all text-sm font-semibold"
                                onClick={() => {
                                    localStorage.setItem('auth_token', 'demo-token-admin');
                                    localStorage.setItem('user_email', 'admin@example.com');
                                    localStorage.setItem('user_role', 'admin');
                                    localStorage.setItem('agentshield-role', 'admin');
                                    localStorage.setItem('agentshield-name', 'Demo Admin');
                                    window.location.href = '/admin';
                                }}
                            >
                                <ShieldCheck className="size-4" />
                                Demo Admin
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer badges */}
                <div className="mt-5 flex items-center justify-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/40">
                        <Zap className="size-3 text-cyan-500" />
                        <span className="text-[11px] font-semibold text-slate-500">Zero-trust enforced</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/40">
                        <Lock className="size-3 text-cyan-500" />
                        <span className="text-[11px] font-semibold text-slate-500">End-to-end encrypted</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

