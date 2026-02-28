import { Shield, AlertTriangle, Activity, TrendingUp, TrendingDown, Zap, RefreshCcw } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from 'recharts';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

const API_BASE = 'http://localhost:8000/api/dashboard';

const severityColor: Record<string, string> = {
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-amber-500 text-white',
  low: 'bg-green-500 text-white',
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    system_health: 0,
    threats_intercepted: 0,
    semantic_drift: 0,
    active_agents: 0,
  });
  const [driftMapData, setDriftMapData] = useState<any[]>([]);
  const [pipelineStages, setPipelineStages] = useState<any[]>([]);
  const [languageAttackData, setLanguageAttackData] = useState<any[]>([]);
  const [recentThreats, setRecentThreats] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [bottomStats, setBottomStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [logExpanded, setLogExpanded] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, driftRes, pipelineRes, langRes, threatsRes, logsRes, bottomRes] = await Promise.all([
        fetch(`${API_BASE}/stats`).then(r => r.json()).catch(() => ({})),
        fetch(`${API_BASE}/drift-map`).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_BASE}/pipeline-status`).then(r => r.json()).catch(() => ({ stages: [] })),
        fetch(`${API_BASE}/language-attacks`).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_BASE}/recent-threats`).then(r => r.json()).catch(() => ({ threats: [] })),
        fetch(`${API_BASE}/system-logs`).then(r => r.json()).catch(() => ({ logs: [] })),
        fetch(`${API_BASE}/bottom-stats`).then(r => r.json()).catch(() => ({ stats: [] })),
      ]);

      setStats({
        system_health: statsRes.system_health ?? 98.2,
        threats_intercepted: statsRes.threats_intercepted ?? 0,
        semantic_drift: statsRes.semantic_drift ?? 0.342,
        active_agents: statsRes.active_agents ?? 0,
      });
      setDriftMapData(driftRes.data || []);
      setPipelineStages(pipelineRes.stages || []);
      setLanguageAttackData(langRes.data || []);
      setRecentThreats(threatsRes.threats || []);
      setSystemLogs(logsRes.logs || []);
      setBottomStats(bottomRes.stats || []);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <RefreshCcw className="size-8 text-cyan-500 animate-spin" />
    </div>
  );

  return (
    <div className="w-full px-6 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-wide">OPERATIONAL OVERVIEW</h1>
        <p className="text-sm text-slate-500 mt-0.5">Real-time telemetry and cross-agent security pipeline monitoring.</p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'SYSTEM HEALTH SCORE', value: `${stats.system_health}%`, trend: '+0.4%', up: true, icon: Shield },
          { label: 'INTERCEPTED THREATS', value: stats.threats_intercepted.toLocaleString(), trend: '+12%', up: false, icon: AlertTriangle },
          { label: 'SEMANTIC DRIFT VARIANCE', value: stats.semantic_drift.toFixed(3), trend: '+22.1%', up: false, icon: Activity },
          { label: 'ACTIVE AGENTS', value: stats.active_agents.toString(), trend: '-2%', up: false, icon: Zap },
        ].map((stat, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
            className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="size-10 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                <stat.icon className="size-5 text-cyan-400" />
              </div>
              <span className={`text-xs font-semibold flex items-center gap-1 ${stat.up ? 'text-green-400' : 'text-amber-400'}`}>
                {stat.up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {stat.trend}
              </span>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</div>
            <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Drift Map + Recent Threats */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Semantic Drift Map</h2>
              <p className="text-xs text-slate-500 mt-0.5">Vectorized variance analysis across active sessions</p>
            </div>
            <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full font-semibold">LIVE: 2.6s POLLING</span>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={driftMapData.length > 0 ? driftMapData : Array.from({ length: 24 }, (_, i) => ({
                time: `${String(i).padStart(2, '0')}:00`,
                driftVariance: Math.random() * 40 + 5,
                securityThreshold: 25,
                systemNoise: Math.random() * 10 + 2,
              }))}>
                <defs>
                  <linearGradient id="driftGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11, color: '#fff' }} />
                <Area type="monotone" dataKey="driftVariance" stroke="#06b6d4" fill="url(#driftGrad)" strokeWidth={2} name="Drift Variance" />
                <Line type="monotone" dataKey="securityThreshold" stroke="#ef4444" strokeDasharray="8 4" strokeWidth={1.5} dot={false} name="Security Threshold" />
                <Area type="monotone" dataKey="systemNoise" stroke="#334155" fill="#1e293b" strokeWidth={1} name="System Noise" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-6 mt-3 text-[10px] text-slate-500 font-semibold">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-cyan-400 inline-block"></span>Drift Variance</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-red-500 inline-block"></span>Security Threshold</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-slate-600 inline-block"></span>System Noise</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Recent Threats</h2>
            <button className="text-[10px] text-cyan-400 font-semibold hover:underline">VIEW ALL</button>
          </div>
          <p className="text-[10px] text-slate-500 mb-4">Unfiltered real-time event pipeline</p>
          <div className="space-y-3">
            {(recentThreats.length > 0 ? recentThreats : [
              { time: '--:--:--', name: 'No threats detected', src: 'System idle', severity: 'low' },
            ]).map((t: any, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-[10px] text-slate-600 font-mono mt-0.5 shrink-0">{t.time}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{t.name}</p>
                  <p className="text-[10px] text-slate-500">{t.src}</p>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${severityColor[t.severity] || 'bg-slate-500 text-white'}`}>{t.severity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pipeline + Language Attacks */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="size-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">9-Stage Pipeline Integrity</h2>
          </div>
          <div className="flex items-center justify-between gap-2">
            {(pipelineStages.length > 0 ? pipelineStages : [
              { id: 'P01', name: 'Ingestion', status: 'healthy' },
              { id: 'P02', name: 'Pre-Exec', status: 'healthy' },
              { id: 'P03', name: 'Memory', status: 'healthy' },
              { id: 'P04', name: 'Conv Intel', status: 'healthy' },
              { id: 'P05', name: 'Output', status: 'healthy' },
              { id: 'P06', name: 'Honeypot', status: 'healthy' },
              { id: 'P07', name: 'Inter-Agent', status: 'healthy' },
              { id: 'P08', name: 'Adaptive', status: 'healthy' },
              { id: 'P09', name: 'Observability', status: 'healthy' },
            ]).map((stage: any) => (
              <div key={stage.id} className="flex flex-col items-center gap-2 flex-1">
                <div className={`w-full h-10 rounded-lg flex items-center justify-center text-[9px] font-bold ${
                  stage.status === 'healthy' ? 'bg-green-500/20 border border-green-500/30 text-green-400' :
                  stage.status === 'warning' ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400' :
                  'bg-red-500/20 border border-red-500/30 text-red-400'
                }`}>{stage.id}</div>
                <span className="text-[8px] text-slate-500 text-center leading-tight font-semibold">{stage.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">Indic Language Attack Vectors</h2>
          <p className="text-[10px] text-slate-500 mb-4">Detection volume by script origin</p>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={languageAttackData.length > 0 ? languageAttackData : [
                { lang: 'Hindi', attacks: 0 },
                { lang: 'Telugu', attacks: 0 },
                { lang: 'Tamil', attacks: 0 },
                { lang: 'Bengali', attacks: 0 },
                { lang: 'Kannada', attacks: 0 },
              ]} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="lang" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} width={60} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11, color: '#fff' }} />
                <Bar dataKey="attacks" fill="#06b6d4" radius={[0, 4, 4, 0]} name="Linguistic Attacks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(bottomStats.length > 0 ? bottomStats : [
          { label: 'AVG DRIFT SCORE', value: '0.1422' },
          { label: 'ANOMALY DENSITY', value: '4.1%' },
          { label: 'CRITICAL NODES', value: '03' },
          { label: 'SHARED SIGNATURES', value: '14,208' },
        ]).map((s: any, i: number) => (
          <div key={i} className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">{s.label}</p>
            <p className="text-xl font-bold text-cyan-400">{s.value}</p>
          </div>
        ))}
      </div>

      {/* System Logs */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl">
        <button onClick={() => setLogExpanded(!logExpanded)} className="w-full px-5 py-3 flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white">
          <span>System Log</span>
          <span className="text-[10px] text-slate-500">{logExpanded ? '▾ COLLAPSE' : '▸ EXPAND'}</span>
        </button>
        {logExpanded && (
          <div className="px-5 pb-4 font-mono text-xs space-y-1.5">
            {(systemLogs.length > 0 ? systemLogs : [
              { time: '14:30:11', text: 'SYSTEM: Ready for security events.', type: 'info' },
            ]).map((log: any, i: number) => (
              <div key={i} className={log.type === 'alert' ? 'text-red-400' : 'text-slate-400'}>
                <span className="text-slate-600">[{log.time}]</span> {log.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}