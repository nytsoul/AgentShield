import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Shield, Mail, Lock, User, ArrowRight, Zap, ShieldCheck, Loader2, Eye, EyeOff, Fingerprint, KeyRound, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

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
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
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

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
            localStorage.setItem('agentshield-role', role);

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    queryParams: {
                        prompt: 'select_account',
                    }
                }
            });
            if (error) throw error;
        } catch (error: any) {
            setErrorMsg(error.message || 'Failed to sign in with Google.');
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;

                localStorage.setItem('agentshield-role', role);
                await supabase.auth.updateUser({ data: { role } });
                navigate('/dashboard');

            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { full_name: name, role } }
                });
                if (error) throw error;

                localStorage.setItem('agentshield-role', role);
                navigate('/dashboard');
            }
        } catch (error: any) {
            setErrorMsg(error.message || 'An error occurred during authentication.');
        } finally {
            setLoading(false);
        }
    };

    const inputBase = 'w-full bg-slate-900/50 border rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none transition-all duration-300 font-medium text-sm';
    const inputFocused = 'border-cyan-500/60 ring-2 ring-cyan-500/20 bg-slate-900/80';
    const inputDefault = 'border-slate-800/80 hover:border-slate-700';

    return (
        <div className="min-h-screen bg-[#060a13] flex relative overflow-hidden">
            <GridBackground />

            {/* ── Left Panel: Branding ── */}
            <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative z-10 flex-col justify-between p-12">
                {/* Top branding */}
                <div>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex items-center gap-3 mb-16"
                    >
                        <div className="size-11 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                            <Shield className="size-6 text-white" />
                        </div>
                        <div>
                            <p className="text-lg font-black text-white tracking-tight">Slingshot</p>
                            <p className="text-[10px] font-semibold text-cyan-400 uppercase tracking-[0.2em]">Security Platform</p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <h2 className="text-4xl xl:text-5xl font-black text-white leading-[1.15] mb-6">
                            Protect your
                            <br />
                            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                                AI agents
                            </span>
                            <br />
                            from threats
                        </h2>
                        <p className="text-slate-400 text-base leading-relaxed max-w-md">
                            9-layer autonomous security middleware that monitors, detects, and neutralizes threats across your entire AI infrastructure in real time.
                        </p>
                    </motion.div>
                </div>

                {/* Feature pills */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="space-y-4"
                >
                    <div className="flex flex-wrap gap-2.5">
                        {[
                            { icon: Fingerprint, text: 'Zero Trust Architecture' },
                            { icon: KeyRound, text: 'AES-256 Encryption' },
                            { icon: Sparkles, text: 'AI-Powered Detection' },
                        ].map(({ icon: Icon, text }) => (
                            <div key={text} className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-800/40 border border-slate-700/40 backdrop-blur-sm">
                                <Icon className="size-3.5 text-cyan-400" />
                                <span className="text-xs font-semibold text-slate-300">{text}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-6 pt-4">
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                                {['bg-cyan-500', 'bg-blue-500', 'bg-violet-500', 'bg-emerald-500'].map((c, i) => (
                                    <div key={i} className={`size-7 rounded-full ${c} border-2 border-[#060a13] flex items-center justify-center`}>
                                        <User className="size-3 text-white" />
                                    </div>
                                ))}
                            </div>
                            <span className="text-xs text-slate-400 font-medium">2,400+ teams</span>
                        </div>
                        <div className="h-4 w-px bg-slate-800" />
                        <div className="flex items-center gap-1.5">
                            <div className="size-2 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-xs text-slate-400 font-medium">99.99% uptime</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* ── Right Panel: Auth Form ── */}
            <div className="flex-1 flex items-center justify-center relative z-10 p-6 lg:p-12">
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="w-full max-w-[440px]"
                >
                    {/* Mobile brand */}
                    <div className="lg:hidden text-center mb-10">
                        <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/25 mb-4">
                            <Shield className="size-7 text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight">
                            Slingshot <span className="text-cyan-400">Firewall</span>
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">AI Security Platform</p>
                    </div>

                    {/* Card */}
                    <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800/50 rounded-2xl p-8 shadow-2xl shadow-black/40">
                        {/* Header */}
                        <div className="mb-7">
                            <h2 className="text-xl font-black text-white mb-1">
                                {isLogin ? 'Welcome back' : 'Create account'}
                            </h2>
                            <p className="text-sm text-slate-500">
                                {isLogin ? 'Sign in to access your security dashboard' : 'Start protecting your AI infrastructure'}
                            </p>
                        </div>

                        {/* Social Buttons */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <button
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                                className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group"
                            >
                                <GoogleIcon />
                                <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">Google</span>
                            </button>
                            <button
                                disabled={loading}
                                className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group"
                            >
                                <GithubIcon />
                                <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">GitHub</span>
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest">or</span>
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                        </div>

                        {/* Error */}
                        <AnimatePresence>
                            {errorMsg && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                    exit={{ opacity: 0, y: -8, height: 0 }}
                                    className="mb-5"
                                >
                                    <div className="p-3.5 bg-red-500/8 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium flex items-center gap-2.5">
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
                                        <div className="relative mb-4">
                                            <User className={`absolute left-4 top-1/2 -translate-y-1/2 size-4 transition-colors duration-200 ${focusedField === 'name' ? 'text-cyan-400' : 'text-slate-600'}`} />
                                            <input
                                                type="text"
                                                className={`${inputBase} ${focusedField === 'name' ? inputFocused : inputDefault}`}
                                                placeholder="Full name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                onFocus={() => setFocusedField('name')}
                                                onBlur={() => setFocusedField(null)}
                                                required={!isLogin}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="relative">
                                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 size-4 transition-colors duration-200 ${focusedField === 'email' ? 'text-cyan-400' : 'text-slate-600'}`} />
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
                                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 size-4 transition-colors duration-200 ${focusedField === 'password' ? 'text-cyan-400' : 'text-slate-600'}`} />
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
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>

                            {isLogin && (
                                <div className="flex justify-end">
                                    <button type="button" className="text-xs text-cyan-500 hover:text-cyan-400 font-semibold transition-colors">
                                        Forgot password?
                                    </button>
                                </div>
                            )}

                            {/* Role Selection */}
                            <div className="pt-1">
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Access Level</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setRole('user')}
                                        className={`relative flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 group ${role === 'user'
                                            ? 'bg-blue-500/8 border-blue-500/40 shadow-lg shadow-blue-500/5'
                                            : 'bg-slate-900/40 border-slate-800/60 hover:border-slate-700'
                                            }`}
                                    >
                                        <div className={`size-9 rounded-lg flex items-center justify-center transition-all ${role === 'user'
                                            ? 'bg-blue-500/15 text-blue-400'
                                            : 'bg-slate-800/60 text-slate-600 group-hover:text-slate-500'
                                            }`}>
                                            <User className="size-4" />
                                        </div>
                                        <div className="text-left">
                                            <p className={`text-xs font-bold transition-colors ${role === 'user' ? 'text-blue-300' : 'text-slate-400'}`}>User</p>
                                            <p className="text-[10px] text-slate-600">Standard access</p>
                                        </div>
                                        {role === 'user' && (
                                            <motion.div
                                                layoutId="role-indicator"
                                                className="absolute top-2 right-2 size-2 rounded-full bg-blue-400"
                                            />
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRole('admin')}
                                        className={`relative flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 group ${role === 'admin'
                                            ? 'bg-cyan-500/8 border-cyan-500/40 shadow-lg shadow-cyan-500/5'
                                            : 'bg-slate-900/40 border-slate-800/60 hover:border-slate-700'
                                            }`}
                                    >
                                        <div className={`size-9 rounded-lg flex items-center justify-center transition-all ${role === 'admin'
                                            ? 'bg-cyan-500/15 text-cyan-400'
                                            : 'bg-slate-800/60 text-slate-600 group-hover:text-slate-500'
                                            }`}>
                                            <ShieldCheck className="size-4" />
                                        </div>
                                        <div className="text-left">
                                            <p className={`text-xs font-bold transition-colors ${role === 'admin' ? 'text-cyan-300' : 'text-slate-400'}`}>Admin</p>
                                            <p className="text-[10px] text-slate-600">Full control</p>
                                        </div>
                                        {role === 'admin' && (
                                            <motion.div
                                                layoutId="role-indicator"
                                                className="absolute top-2 right-2 size-2 rounded-full bg-cyan-400"
                                            />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full relative overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all duration-300 flex items-center justify-center gap-2 group mt-3"
                            >
                                {loading ? (
                                    <Loader2 className="size-5 animate-spin" />
                                ) : (
                                    <>
                                        {isLogin ? 'Sign In' : 'Create Account'}
                                        <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform duration-200" />
                                    </>
                                )}
                                {/* Shimmer effect */}
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            </button>
                        </form>

                        {/* Toggle */}
                        <p className="text-center text-sm text-slate-500 mt-7">
                            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                            <button
                                type="button"
                                onClick={() => { setIsLogin(!isLogin); setErrorMsg(null); }}
                                className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                            >
                                {isLogin ? 'Sign up' : 'Sign in'}
                            </button>
                        </p>
                    </div>

                    {/* Footer badges */}
                    <div className="mt-8 flex items-center justify-center gap-3">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800/40">
                            <Zap className="size-3 text-cyan-400" />
                            <span className="text-[11px] font-semibold text-slate-500">Zero-trust enforced</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800/40">
                            <Lock className="size-3 text-cyan-400" />
                            <span className="text-[11px] font-semibold text-slate-500">End-to-end encrypted</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
