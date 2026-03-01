import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import {
    Shield, Users, Activity, AlertTriangle, CheckCircle2,
    XCircle, RefreshCcw, Eye, Clock, Zap, Lock, TrendingUp,
    Terminal, BarChart3, Server, Database, Cpu, Brain, Crosshair, Bug, Network, Layers, ArrowRight
} from 'lucide-react';

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000';

interface AdminStats {
    active_sessions: number;
    blocked_today: number;
    honeypot_active: number;
    total_events_today: number;
}

interface SecurityEvent {
    event_id: string;
    session_id: string;
    layer: number;
    action: 'BLOCKED' | 'PASSED' | 'FLAGGED' | 'HONEYPOT';
    threat_score: number;
    reason: string;
    owasp_tag?: string;
    timestamp: string;
}

interface ActiveSession {
    session_id: string;
    role: string;
    turn_count: number;
    cumulative_risk_score: number;
    is_honeypot: boolean;
    created_at: string;
}

const LAYER_NAMES: Record<number, string> = {
    1: 'Ingestion',
    2: 'Pre-Execution',
    3: 'Memory',
    4: 'Conversation',
    5: 'Output',
    6: 'Adversarial',
    7: 'Inter-Agent',
    8: 'Adaptive',
    9: 'Observability',
};

const ACTION_STYLES: Record<string, string> = {
    BLOCKED: 'text-red-500 bg-red-500/10 border-red-500/30',
    PASSED: 'text-green-500 bg-green-500/10 border-green-500/30',
    FLAGGED: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
    HONEYPOT: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
};

// Data for the 9-layer feature cards
const SECURITY_LAYERS = [
    { id: 1, name: 'L1: Ingestion Pipeline', icon: Server, color: 'text-cyan-500', bg: 'bg-cyan-500/10', path: '/layer1-ingestion', desc: 'Raw input sanitization, translation & decoding.' },
    { id: 2, name: 'L2: MCP Pre-Execution', icon: Cpu, color: 'text-blue-500', bg: 'bg-blue-500/10', path: '/layer2-pre-execution', desc: 'Tool analysis and blast-radius assessment.' },
    { id: 3, name: 'L3: Memory Integrity', icon: Brain, color: 'text-indigo-500', bg: 'bg-indigo-500/10', path: '/layer3-memory', desc: 'Context poisoning & data leak prevention.' },
    { id: 4, name: 'L4: Conversation Intel', icon: Activity, color: 'text-violet-500', bg: 'bg-violet-500/10', path: '/layer4-conversation', desc: 'Semantic drift & multi-turn attack detection.' },
    { id: 5, name: 'L5: Output Validation', icon: Shield, color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10', path: '/layer5-output', desc: 'Response redaction & hallucination tracking.' },
    { id: 6, name: 'L6: Honeypot Tarpit', icon: Crosshair, color: 'text-purple-500', bg: 'bg-purple-500/10', path: '/layer5-honeypot', desc: 'Deception networks for automated attacks.' },
    { id: 7, name: 'L7: Adversarial Defense', icon: Bug, color: 'text-rose-500', bg: 'bg-rose-500/10', path: '/layer6-adversarial', desc: 'Counter-prompting & adversarial classification.' },
    { id: 8, name: 'L8: Inter-Agent Zero Trust', icon: Network, color: 'text-orange-500', bg: 'bg-orange-500/10', path: '/layer7-inter-agent', desc: 'Agent-to-agent secure handoff protocols.' },
    { id: 9, name: 'L9: Adaptive Config', icon: RefreshCcw, color: 'text-amber-500', bg: 'bg-amber-500/10', path: '/layer8-adaptive', desc: 'Dynamic rule generation & threat sharing.' },
    { id: 10, name: 'Global Observability', icon: Layers, color: 'text-slate-500', bg: 'bg-slate-500/10', path: '/layer9-observability', desc: 'Centralized telemetry & system monitoring.' },
];

function StatCard({
    label, value, icon: Icon, color, sub,
}: {
    label: string; value: string | number; icon: React.ElementType; color: string; sub?: string;
}) {
    return (
        <div className="bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-cyan-500/10 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
                <div className={`size-9 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon className="size-[18px]" />
                </div>
            </div>
            <div>
                <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">{value}</p>
                {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
            </div>
        </div>
    );
}

function formatTime(ts: string) {
    try {
        return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
        return ts;
    }
}

function RiskBar({ score }: { score: number }) {
    const pct = Math.min(100, Math.round(score * 100));
    const color = pct > 70 ? 'bg-red-500' : pct > 40 ? 'bg-amber-500' : 'bg-cyan-500';
    return (
        <div className="flex items-center gap-2 w-full">
            <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[11px] font-mono text-slate-500 tabular-nums w-8 text-right">{pct}%</span>
        </div>
    );
}

export default function Admin() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [events, setEvents] = useState<SecurityEvent[]>([]);
    const [sessions, setSessions] = useState<ActiveSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [activeTab, setActiveTab] = useState<'events' | 'sessions'>('events');

    const borderClr = 'border-slate-200 dark:border-cyan-500/10';

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [statsRes, eventsRes, sessionsRes] = await Promise.all([
                fetch(`${API_BASE}/admin/stats`),
                fetch(`${API_BASE}/admin/recent-events?limit=20`),
                fetch(`${API_BASE}/admin/active-sessions`),
            ]);

            if (!statsRes.ok || !eventsRes.ok || !sessionsRes.ok) {
                throw new Error('Backend returned an error. Make sure the backend is running.');
            }

            const [statsData, eventsData, sessionsData] = await Promise.all([
                statsRes.json(),
                eventsRes.json(),
                sessionsRes.json(),
            ]);

            setStats(statsData);
            setEvents(Array.isArray(eventsData) ? eventsData : []);
            setSessions(Array.isArray(sessionsData) ? sessionsData : []);
            setLastRefresh(new Date());
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to fetch admin data.';
            setError(msg);
            // Populate with mock data so the UI still renders
            setStats({ active_sessions: 0, blocked_today: 0, honeypot_active: 0, total_events_today: 0 });
            setEvents([]);
            setSessions([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (!autoRefresh) return;
        const id = setInterval(fetchData, 10000);
        return () => clearInterval(id);
    }, [autoRefresh, fetchData]);

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <span className="size-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                            <Shield className="size-5 text-cyan-500" />
                        </span>
                        Admin Console
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        System-wide security overview & management
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Last Refresh */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock className="size-3.5" />
                        <span>Refreshed {formatTime(lastRefresh.toISOString())}</span>
                    </div>

                    {/* Auto-refresh Toggle */}
                    <button
                        onClick={() => setAutoRefresh(v => !v)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${autoRefresh
                            ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30'
                            : 'text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-white/5'
                            }`}
                    >
                        <span className={`size-1.5 rounded-full ${autoRefresh ? 'bg-cyan-500 animate-pulse' : 'bg-slate-400'}`} />
                        {autoRefresh ? 'Live' : 'Auto'}
                    </button>

                    {/* Refresh Button */}
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all disabled:opacity-50"
                    >
                        <RefreshCcw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-sm">
                    <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-semibold">Backend Connectivity Issue</p>
                        <p className="text-xs mt-0.5 opacity-80">{error}</p>
                    </div>
                </div>
            )}

            {/* 9-Layer Control Deck */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <Layers className="size-5 text-cyan-500" />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Security Infrastructure</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {SECURITY_LAYERS.map(layer => (
                        <Link
                            key={layer.id}
                            to={layer.path}
                            className={`group relative bg-white dark:bg-[#0d1424] border ${borderClr} rounded-xl p-4 transition-all hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-cyan-500/5 hover:border-cyan-500/30 flex flex-col justify-between`}
                        >
                            {/* Layer Indicator */}
                            {layer.id <= 9 && (
                                <div className="absolute top-0 right-0 px-2 py-1 bg-slate-100 dark:bg-white/5 rounded-bl-xl rounded-tr-xl border-b border-l border-slate-200 dark:border-white/5 text-[9px] font-mono font-bold text-slate-400">
                                    LAYER 0{layer.id}
                                </div>
                            )}

                            <div>
                                <div className={`size-10 rounded-xl flex items-center justify-center mb-3 ${layer.bg}`}>
                                    <layer.icon className={`size-5 ${layer.color}`} />
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight mb-1">{layer.name}</h3>
                                <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">{layer.desc}</p>
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                                <div className="flex items-center gap-1.5">
                                    <span className="relative flex size-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full size-2 bg-green-500"></span>
                                    </span>
                                    <span className="text-[10px] font-bold text-green-600 dark:text-green-500 uppercase tracking-wider">Active</span>
                                </div>
                                <ArrowRight className="size-3.5 text-slate-400 group-hover:text-cyan-500 transition-colors" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                <StatCard
                    label="Active Sessions"
                    value={loading ? '—' : (stats?.active_sessions ?? 0)}
                    icon={Users}
                    color="bg-cyan-500/10 text-cyan-500"
                    sub="Currently processing"
                />
                <StatCard
                    label="Blocked Today"
                    value={loading ? '—' : (stats?.blocked_today ?? 0)}
                    icon={XCircle}
                    color="bg-red-500/10 text-red-500"
                    sub="Threats neutralized"
                />
                <StatCard
                    label="Honeypots Active"
                    value={loading ? '—' : (stats?.honeypot_active ?? 0)}
                    icon={Eye}
                    color="bg-purple-500/10 text-purple-500"
                    sub="Deception traps"
                />
                <StatCard
                    label="Events Today"
                    value={loading ? '—' : (stats?.total_events_today ?? 0)}
                    icon={Activity}
                    color="bg-green-500/10 text-green-500"
                    sub="Total pipeline events"
                />
            </div>

            {/* Quick Status cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`bg-white dark:bg-[#0d1424] border ${borderClr} rounded-xl p-4 flex items-center gap-4`}>
                    <div className="size-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                        <CheckCircle2 className="size-5 text-green-500" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Firewall Status</p>
                        <p className="text-sm font-bold text-green-600 dark:text-green-400 mt-0.5">All Systems Go</p>
                    </div>
                </div>
                <div className={`bg-white dark:bg-[#0d1424] border ${borderClr} rounded-xl p-4 flex items-center gap-4`}>
                    <div className="size-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                        <Server className="size-5 text-cyan-500" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Backend API</p>
                        <p className={`text-sm font-bold mt-0.5 ${error ? 'text-red-500' : 'text-cyan-600 dark:text-cyan-400'}`}>
                            {error ? 'Unreachable' : 'Operational'}
                        </p>
                    </div>
                </div>
                <div className={`bg-white dark:bg-[#0d1424] border ${borderClr} rounded-xl p-4 flex items-center gap-4`}>
                    <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Database className="size-5 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Database</p>
                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5">Supabase Connected</p>
                    </div>
                </div>
            </div>

            {/* Tabs: Recent Events | Active Sessions */}
            <div className={`bg-white dark:bg-[#0d1424] border ${borderClr} rounded-xl overflow-hidden`}>
                {/* Tab Bar */}
                <div className={`flex border-b ${borderClr}`}>
                    {[
                        { key: 'events', label: 'Recent Events', icon: Terminal },
                        { key: 'sessions', label: 'Active Sessions', icon: BarChart3 },
                    ].map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key as 'events' | 'sessions')}
                            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all border-b-2 ${activeTab === key
                                ? 'text-cyan-600 dark:text-cyan-400 border-cyan-500'
                                : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                        >
                            <Icon className="size-4" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Events Tab */}
                {activeTab === 'events' && (
                    loading ? (
                        <LoadingRows />
                    ) : events.length === 0 ? (
                        <EmptyState message="No events recorded yet." />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                                        <th className="px-5 py-3 font-semibold">Time</th>
                                        <th className="px-5 py-3 font-semibold">Session</th>
                                        <th className="px-5 py-3 font-semibold">Layer</th>
                                        <th className="px-5 py-3 font-semibold">Action</th>
                                        <th className="px-5 py-3 font-semibold">Score</th>
                                        <th className="px-5 py-3 font-semibold">Reason</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.map((ev, i) => (
                                        <tr
                                            key={ev.event_id || i}
                                            className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                                        >
                                            <td className="px-5 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                                                {formatTime(ev.timestamp)}
                                            </td>
                                            <td className="px-5 py-3 font-mono text-xs text-slate-500 max-w-[120px] truncate">
                                                {ev.session_id?.slice(0, 12)}…
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                    L{ev.layer} {LAYER_NAMES[ev.layer] || ''}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded border ${ACTION_STYLES[ev.action] || 'text-slate-500 bg-slate-100'}`}>
                                                    {ev.action === 'BLOCKED' && <XCircle className="size-3" />}
                                                    {ev.action === 'PASSED' && <CheckCircle2 className="size-3" />}
                                                    {ev.action === 'FLAGGED' && <AlertTriangle className="size-3" />}
                                                    {ev.action === 'HONEYPOT' && <Eye className="size-3" />}
                                                    {ev.action}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`text-xs font-bold tabular-nums ${ev.threat_score > 0.7 ? 'text-red-500' : ev.threat_score > 0.4 ? 'text-amber-500' : 'text-green-500'}`}>
                                                    {(ev.threat_score * 100).toFixed(0)}%
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-xs text-slate-500 max-w-[200px] truncate" title={ev.reason}>
                                                {ev.reason || '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}

                {/* Sessions Tab */}
                {activeTab === 'sessions' && (
                    loading ? (
                        <LoadingRows />
                    ) : sessions.length === 0 ? (
                        <EmptyState message="No active sessions right now." />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                                        <th className="px-5 py-3 font-semibold">Session ID</th>
                                        <th className="px-5 py-3 font-semibold">Role</th>
                                        <th className="px-5 py-3 font-semibold">Turns</th>
                                        <th className="px-5 py-3 font-semibold">Risk Score</th>
                                        <th className="px-5 py-3 font-semibold">Status</th>
                                        <th className="px-5 py-3 font-semibold">Started</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sessions.map((s, i) => (
                                        <tr
                                            key={s.session_id || i}
                                            className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                                        >
                                            <td className="px-5 py-3 font-mono text-xs text-slate-500">
                                                {s.session_id?.slice(0, 16)}…
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    {s.role === 'admin' ? <Lock className="size-3.5 text-cyan-500" /> : <Users className="size-3.5 text-slate-400" />}
                                                    <span className="text-xs font-semibold capitalize text-slate-700 dark:text-slate-300">{s.role}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-xs font-mono text-slate-500">
                                                <div className="flex items-center gap-1.5">
                                                    <TrendingUp className="size-3.5 text-slate-400" />
                                                    {s.turn_count}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 min-w-[140px]">
                                                <RiskBar score={s.cumulative_risk_score} />
                                            </td>
                                            <td className="px-5 py-3">
                                                {s.is_honeypot ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border text-purple-500 bg-purple-500/10 border-purple-500/30">
                                                        <Eye className="size-3" /> Honeypot
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border text-green-500 bg-green-500/10 border-green-500/30">
                                                        <Zap className="size-3" /> Active
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                                                {formatTime(s.created_at)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

function LoadingRows() {
    return (
        <div className="p-8 flex flex-col items-center gap-3">
            <div className="size-7 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Loading data…</p>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="p-12 flex flex-col items-center gap-2 text-slate-400">
            <Activity className="size-8 opacity-30" />
            <p className="text-sm">{message}</p>
        </div>
    );
}
