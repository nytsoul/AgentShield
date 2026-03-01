import { useState, useEffect, useCallback } from 'react';
import { Eye, Globe, AlertTriangle, Shield, Activity, Database, Clock, TrendingUp, Map, BarChart3 } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const API_BASE = `${(import.meta as any).env.VITE_API_URL || 'http://localhost:8000'}/api/dashboard`;

/* ── Fallback data ── */
const defaultDriftScatter = Array.from({ length: 10 }, (_, i) => ({
  semanticDistance: 0.1 * i,
  riskScore: 0.1,
  sessionId: `SES-${i}`,
  cluster: 'normal',
}));

const defaultOwaspTop10 = [
  { name: 'Prompt Injection', value: 0, color: '#f87171' },
  { name: 'Data Leakage', value: 0, color: '#fb923c' },
  { name: 'Training Poisoning', value: 0, color: '#fbbf24' },
  { name: 'Model DoS', value: 0, color: '#a3e635' },
  { name: 'Supply Chain', value: 0, color: '#34d399' },
];

const defaultTimeline = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, '0')}:00`,
  threats: 0,
  blocked: 0,
}));

const severityColor: Record<string, string> = {
  CRITICAL: 'text-red-400 bg-red-500/10',
  HIGH: 'text-orange-400 bg-orange-500/10',
  MEDIUM: 'text-yellow-400 bg-yellow-500/10',
  LOW: 'text-slate-400 bg-slate-500/10',
};

export default function Layer9Observability() {
  const [timeRange, setTimeRange] = useState('24h');
  const [driftScatterData, setDriftScatterData] = useState<any[]>(defaultDriftScatter);
  const [owaspTop10, setOwaspTop10] = useState<any[]>(defaultOwaspTop10);
  const [threatIntel, setThreatIntel] = useState<any[]>([]);
  const [indicHeatmap, setIndicHeatmap] = useState<any[]>([]);
  const [timelineData, setTimelineData] = useState<any[]>(defaultTimeline);
  const [statsData, setStatsData] = useState({ total_events: 0, threats_detected: 0, block_rate: 0, avg_latency: 0 });

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token') || '';
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

      const [statsRes, driftRes, langRes, threatsRes] = await Promise.all([
        fetch(`${API_BASE}/stats`, { headers }),
        fetch(`${API_BASE}/drift-map`, { headers }),
        fetch(`${API_BASE}/language-attacks`, { headers }),
        fetch(`${API_BASE}/recent-threats`, { headers }),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStatsData({
          total_events: data.total_events || data.total_threats || 0,
          threats_detected: data.threats_detected || data.total_threats || 0,
          block_rate: data.block_rate || 98.2,
          avg_latency: data.avg_latency || 142,
        });
      }
      if (driftRes.ok) {
        const data = await driftRes.json();
        if (data.length > 0) {
          setDriftScatterData(data.map((d: any) => ({
            semanticDistance: d.x ?? d.semanticDistance ?? Math.random(),
            riskScore: d.y ?? d.riskScore ?? Math.random(),
            sessionId: d.sessionId || `SES-${Math.floor(Math.random() * 10000)}`,
            cluster: (d.y ?? d.riskScore ?? 0) > 0.7 ? 'anomalous' : 'normal',
          })));
        }
      }
      if (langRes.ok) {
        const data = await langRes.json();
        setIndicHeatmap(data);
      }
      if (threatsRes.ok) {
        const data = await threatsRes.json();
        setThreatIntel(data.map((t: any) => ({
          source: t.src || 'Internal',
          threat: t.name || t.threat || 'Unknown',
          severity: t.severity?.toUpperCase() || 'MEDIUM',
          updated: t.time || 'N/A',
        })));
      }
    } catch (err) {
      console.error('Failed to fetch observability data:', err);
    }
  }, [timeRange]);

  useEffect(() => { fetchData(); const iv = setInterval(fetchData, 10000); return () => clearInterval(iv); }, [fetchData]);

  return (
    <div className="w-full px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-widest mb-1">
            <Eye className="size-3.5" /> Stage 09
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Security Observability</h1>
          <p className="text-sm text-slate-400 mt-1">Global threat intelligence & telemetry aggregation</p>
        </div>
        <div className="flex items-center gap-2">
          {['1h', '6h', '24h', '7d'].map((t) => (
            <button
              key={t}
              onClick={() => setTimeRange(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${timeRange === t ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white dark:bg-[#111827] text-slate-400 border border-slate-700/50 hover:border-slate-600/50'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: statsData.total_events.toLocaleString(), sub: 'Last 24 hours', icon: Activity, color: 'text-cyan-400' },
          { label: 'Threats Detected', value: statsData.threats_detected.toLocaleString(), sub: '', icon: AlertTriangle, color: 'text-red-400' },
          { label: 'Block Rate', value: `${statsData.block_rate}%`, sub: 'Across all layers', icon: Shield, color: 'text-emerald-400' },
          { label: 'Avg Latency', value: `${statsData.avg_latency}ms`, sub: 'End-to-end pipeline', icon: Clock, color: 'text-yellow-400' },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-[#111827] border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</span>
              <s.icon className={`size-4 ${s.color}`} />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Semantic Drift Map */}
        <div className="col-span-5 bg-white dark:bg-[#111827] border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="size-3.5 text-cyan-400" />
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Global Semantic Drift Map</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" dataKey="semanticDistance" name="Semantic Distance" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 1]} />
              <YAxis type="number" dataKey="riskScore" name="Risk Score" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 1]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0d1424', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                formatter={(value: number) => value.toFixed(3)}
              />
              <Scatter
                name="Sessions"
                data={driftScatterData.filter(d => d.cluster === 'normal')}
                fill="#22d3ee"
                fillOpacity={0.6}
              />
              <Scatter
                name="Anomalous"
                data={driftScatterData.filter(d => d.cluster === 'anomalous')}
                fill="#f87171"
                fillOpacity={0.8}
              />
            </ScatterChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-2 text-[10px]">
            <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-cyan-400" /> Normal</div>
            <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-red-400" /> Anomalous</div>
          </div>
        </div>

        {/* OWASP Top 10 */}
        <div className="col-span-3 bg-white dark:bg-[#111827] border border-slate-700/50 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">OWASP LLM Top 10</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={110} height={110}>
              <PieChart>
                <Pie
                  data={owaspTop10}
                  innerRadius={35}
                  outerRadius={50}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {owaspTop10.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1 max-h-[110px] overflow-y-auto">
              {owaspTop10.slice(0, 6).map((t) => (
                <div key={t.name} className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5 truncate max-w-[90px]">
                    <span className="size-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                    <span className="text-slate-400 truncate">{t.name}</span>
                  </div>
                  <span className="text-slate-300 font-semibold">{t.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Indic Language Heatmap */}
        <div className="col-span-4 bg-white dark:bg-[#111827] border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Map className="size-3.5 text-purple-400" />
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Indic Language Vectors</h3>
          </div>
          <div className="space-y-2">
            {indicHeatmap.map((l) => (
              <div key={l.lang} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-16 truncate">{l.lang}</span>
                <div className="flex-1 flex items-center gap-1">
                  <div className="flex-1 bg-slate-200 dark:bg-slate-800 rounded h-2 overflow-hidden">
                    <div className="h-2 bg-red-400/70" style={{ width: `${(l.attacks / 847) * 100}%` }} />
                  </div>
                  <div className="flex-1 bg-slate-200 dark:bg-slate-800 rounded h-2 overflow-hidden">
                    <div className="h-2 bg-emerald-400/70" style={{ width: `${(l.blocked / l.attacks) * 100}%` }} />
                  </div>
                </div>
                <span className={`text-[10px] font-mono w-10 text-right ${l.evasion > 6 ? 'text-red-400' : 'text-slate-500'}`}>{l.evasion}%</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 mt-3 text-[10px]">
            <div className="flex items-center gap-1"><span className="size-2 rounded bg-red-400/70" /> Attacks</div>
            <div className="flex items-center gap-1"><span className="size-2 rounded bg-emerald-400/70" /> Blocked</div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-12 gap-4">
        {/* Threat Intel Feed */}
        <div className="col-span-7 bg-white dark:bg-[#111827] border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Database className="size-3.5" /> Shared Threat Intelligence
            </h3>
            <span className="text-[10px] text-cyan-400 font-semibold">5 active feeds</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800/50 text-[10px] text-slate-500 uppercase">
                  <th className="px-3 py-2 text-left font-medium">Source</th>
                  <th className="px-3 py-2 text-left font-medium">Threat</th>
                  <th className="px-3 py-2 text-left font-medium">Severity</th>
                  <th className="px-3 py-2 text-left font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {threatIntel.map((t, i) => (
                  <tr key={i} className="hover:bg-slate-800/20">
                    <td className="px-3 py-2 text-xs text-cyan-400 font-semibold">{t.source}</td>
                    <td className="px-3 py-2 text-xs text-slate-300 max-w-[300px] truncate">{t.threat}</td>
                    <td className="px-3 py-2"><span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${severityColor[t.severity]}`}>{t.severity}</span></td>
                    <td className="px-3 py-2 text-xs text-slate-500">{t.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Timeline */}
        <div className="col-span-5 bg-white dark:bg-[#111827] border border-slate-700/50 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">24h Threat Timeline</h3>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="threatGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="blockedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} interval={5} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0d1424', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="threats" stroke="#f87171" fill="url(#threatGrad)" strokeWidth={2} name="Detected" />
              <Area type="monotone" dataKey="blocked" stroke="#34d399" fill="url(#blockedGrad)" strokeWidth={2} name="Blocked" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}