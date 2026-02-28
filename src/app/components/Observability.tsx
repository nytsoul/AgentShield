import { useState } from 'react';
import { Eye, Globe, AlertTriangle, Shield, Activity, Database, Clock, TrendingUp, Map, BarChart3 } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

/* ── mock data ── */
const driftScatterData = Array.from({ length: 50 }, (_, i) => ({
  semanticDistance: Math.random() * 0.8,
  riskScore: Math.random() * 0.9 + 0.1,
  sessionId: `SES-${8800 + i}`,
  cluster: Math.random() > 0.7 ? 'anomalous' : 'normal',
}));

const owaspTop10 = [
  { name: 'Prompt Injection', value: 34, color: '#f87171' },
  { name: 'Data Leakage', value: 18, color: '#fb923c' },
  { name: 'Training Poisoning', value: 12, color: '#fbbf24' },
  { name: 'Model DoS', value: 11, color: '#a3e635' },
  { name: 'Supply Chain', value: 9, color: '#34d399' },
  { name: 'Sensitive Disclosure', value: 8, color: '#22d3ee' },
  { name: 'Plugin Insecurity', value: 5, color: '#818cf8' },
  { name: 'Excessive Agency', value: 3, color: '#c084fc' },
];

const threatIntel = [
  { source: 'MITRE ATLAS', threat: 'LLM04:2024 Prompt Injection via Markdown', severity: 'CRITICAL', updated: '2h ago' },
  { source: 'OpenSSF', threat: 'Indirect prompt injection in tool-use chains', severity: 'HIGH', updated: '4h ago' },
  { source: 'NIST AI RMF', threat: 'Context manipulation via unicode homoglyphs', severity: 'HIGH', updated: '8h ago' },
  { source: 'Internal Lab', threat: 'Novel Hinglish code-switching evasion', severity: 'MEDIUM', updated: '12h ago' },
  { source: 'HuggingFace', threat: 'Embedding space adversarial perturbation', severity: 'MEDIUM', updated: '1d ago' },
];

const indicHeatmap = [
  { lang: 'Hindi', attacks: 847, blocked: 812, evasion: 4.1 },
  { lang: 'Tamil', attacks: 234, blocked: 221, evasion: 5.5 },
  { lang: 'Bengali', attacks: 189, blocked: 178, evasion: 5.8 },
  { lang: 'Telugu', attacks: 156, blocked: 149, evasion: 4.5 },
  { lang: 'Marathi', attacks: 98, blocked: 94, evasion: 4.1 },
  { lang: 'Hinglish', attacks: 423, blocked: 389, evasion: 8.0 },
];

const timelineData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, '0')}:00`,
  threats: 10 + Math.floor(Math.random() * 40 + (i > 9 && i < 18 ? 25 : 0)),
  blocked: 8 + Math.floor(Math.random() * 35 + (i > 9 && i < 18 ? 22 : 0)),
}));

const severityColor: Record<string, string> = {
  CRITICAL: 'text-red-400 bg-red-500/10',
  HIGH: 'text-orange-400 bg-orange-500/10',
  MEDIUM: 'text-yellow-400 bg-yellow-500/10',
  LOW: 'text-slate-400 bg-slate-500/10',
};

export default function Layer9Observability() {
  const [timeRange, setTimeRange] = useState('24h');

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
          { label: 'Total Events', value: '42,903', sub: 'Last 24 hours', icon: Activity, color: 'text-cyan-400' },
          { label: 'Threats Detected', value: '1,429', sub: '↑ 8% from yesterday', icon: AlertTriangle, color: 'text-red-400' },
          { label: 'Block Rate', value: '98.2%', sub: 'Across all layers', icon: Shield, color: 'text-emerald-400' },
          { label: 'Avg Latency', value: '142ms', sub: 'End-to-end pipeline', icon: Clock, color: 'text-yellow-400' },
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