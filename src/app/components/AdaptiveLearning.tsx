import { useState } from 'react';
import { RefreshCw, Cpu, Activity, TrendingUp, TrendingDown, GitBranch, Check, AlertTriangle, Zap, Clock, BarChart3, Shield, Lock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

/* ── mock data ── */
const modelVersions = [
  { version: 'v2.4.07', date: 'Oct 12', status: 'archived', precision: 0.912, recall: 0.887, falsePos: 4.2 },
  { version: 'v2.4.08', date: 'Oct 19', status: 'archived', precision: 0.924, recall: 0.891, falsePos: 3.8 },
  { version: 'v2.4.09', date: 'Oct 26', status: 'archived', precision: 0.931, recall: 0.903, falsePos: 3.2 },
  { version: 'v2.4.10', date: 'Nov 02', status: 'archived', precision: 0.945, recall: 0.912, falsePos: 2.7 },
  { version: 'v2.4.11', date: 'Nov 09', status: 'previous', precision: 0.958, recall: 0.924, falsePos: 2.1 },
  { version: 'v2.4.12', date: 'Nov 16', status: 'active', precision: 0.971, recall: 0.938, falsePos: 1.4 },
];

const precisionRecallTrend = modelVersions.map((v) => ({
  version: v.version,
  precision: v.precision * 100,
  recall: v.recall * 100,
}));

const falsePositiveTrend = modelVersions.map((v) => ({
  version: v.version,
  rate: v.falsePos,
}));

const engineLoad = [
  { module: 'Semantic Classifier', load: 78, status: 'healthy' },
  { module: 'Pattern Matcher', load: 65, status: 'healthy' },
  { module: 'Injection Detector', load: 92, status: 'warning' },
  { module: 'Language Analyzer', load: 54, status: 'healthy' },
  { module: 'Context Validator', load: 71, status: 'healthy' },
];

const recentUpdates = [
  { change: 'IndicBERT weights fine-tuned for Hinglish obfuscation', impact: '+2.4%', timestamp: '2h ago' },
  { change: 'Salami attack detection threshold lowered to 0.65', impact: '+1.8%', timestamp: '6h ago' },
  { change: 'New roleplay injection signatures added (847 patterns)', impact: '+3.1%', timestamp: '1d ago' },
  { change: 'Cross-agent delegation rules tightened', impact: '+0.9%', timestamp: '2d ago' },
];

const integrityGauge = 98.4;

const statusColor: Record<string, string> = {
  active: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  previous: 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  archived: 'text-slate-500 dark:text-slate-400 bg-slate-500/10 border-slate-400/30 dark:border-slate-500/30',
};

const loadColor = (load: number) => load > 85 ? '#f87171' : load > 70 ? '#fbbf24' : '#34d399';

export default function Layer8AdaptiveLearning() {
  const [selectedVersion, setSelectedVersion] = useState(modelVersions[modelVersions.length - 1]);

  /* theme-aware card + border tokens */
  const card = 'bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700/50';
  const cardInner = 'bg-slate-50 dark:bg-[#0d1424] border border-slate-200 dark:border-slate-700/30';

  return (
    <div className="w-full px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-widest mb-1">
            <RefreshCw className="size-3.5" /> Stage 08
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Adaptive Rule Engine</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Self-optimizing security classifier with neural feedback loop</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
            <Check className="size-3" /> {selectedVersion.version} Active
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Precision', value: `${(selectedVersion.precision * 100).toFixed(1)}%`, sub: '↑ 1.3% from v2.4.11', icon: TrendingUp, color: 'text-emerald-500 dark:text-emerald-400' },
          { label: 'Recall', value: `${(selectedVersion.recall * 100).toFixed(1)}%`, sub: '↑ 1.4% from v2.4.11', icon: TrendingUp, color: 'text-cyan-500 dark:text-cyan-400' },
          { label: 'False Positive Rate', value: `${selectedVersion.falsePos}%`, sub: '↓ 0.7% from v2.4.11', icon: TrendingDown, color: 'text-yellow-500 dark:text-yellow-400' },
          { label: 'Patterns Learned', value: '4,847', sub: '+127 this week', icon: Cpu, color: 'text-purple-500 dark:text-purple-400' },
        ].map((s) => (
          <div key={s.label} className={`${card} rounded-xl p-5`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{s.label}</span>
              <s.icon className={`size-4 ${s.color}`} />
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{s.value}</div>
            <div className="text-xs text-slate-500 mt-1.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Model Lineage Timeline */}
        <div className={`col-span-3 ${card} rounded-xl overflow-hidden`}>
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700/50 flex items-center gap-2">
            <GitBranch className="size-3.5 text-emerald-500 dark:text-emerald-400" />
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Model Lineage</h3>
          </div>
          <div className="p-3 space-y-2 max-h-[420px] overflow-y-auto">
            {modelVersions.slice().reverse().map((v) => (
              <button
                key={v.version}
                onClick={() => setSelectedVersion(v)}
                className={`w-full text-left px-3 py-3 rounded-lg border transition-colors ${selectedVersion.version === v.version
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : `${cardInner} hover:border-slate-300 dark:hover:border-slate-600/50`
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{v.version}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${statusColor[v.status]}`}>{v.status.toUpperCase()}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>{v.date}</span>
                  <span>P: {(v.precision * 100).toFixed(0)}% R: {(v.recall * 100).toFixed(0)}%</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Center Charts */}
        <div className="col-span-6 space-y-4">
          {/* Precision vs Recall */}
          <div className={`${card} rounded-xl p-5`}>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Precision vs Recall Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={precisionRecallTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #e2e8f0)" className="dark:[--chart-grid:#1e293b] [--chart-grid:#e2e8f0]" />
                <XAxis dataKey="version" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis domain={[85, 100]} tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-tooltip-bg)', border: '1px solid var(--color-tooltip-border)', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="precision" stroke="#34d399" strokeWidth={2.5} dot={{ fill: '#34d399', r: 4 }} name="Precision %" />
                <Line type="monotone" dataKey="recall" stroke="#22d3ee" strokeWidth={2.5} dot={{ fill: '#22d3ee', r: 4 }} name="Recall %" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* False Positive Trend */}
          <div className={`${card} rounded-xl p-5`}>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">False Positive Rate Trend</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={falsePositiveTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #e2e8f0)" className="dark:[--chart-grid:#1e293b] [--chart-grid:#e2e8f0]" />
                <XAxis dataKey="version" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 5]} tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-tooltip-bg)', border: '1px solid var(--color-tooltip-border)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="rate" fill="#fbbf24" radius={[4, 4, 0, 0]} name="False Positive %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Panel */}
        <div className="col-span-3 space-y-4">
          {/* Engine Core Integrity */}
          <div className={`${card} rounded-xl p-5`}>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Engine Core Integrity</h3>
            <div className="flex items-center justify-center">
              <div className="relative">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie
                      data={[{ value: integrityGauge }, { value: 100 - integrityGauge }]}
                      innerRadius={48}
                      outerRadius={64}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      <Cell fill="#34d399" />
                      <Cell fill="#e2e8f0" className="dark:fill-[#1e293b]" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{integrityGauge}%</span>
                </div>
              </div>
            </div>
            <p className="text-center text-[11px] text-slate-500 mt-2 font-medium">All systems operational</p>
          </div>

          {/* Engine Load Balance */}
          <div className={`${card} rounded-xl p-5`}>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BarChart3 className="size-3.5" /> Engine Load
            </h3>
            <div className="space-y-3.5">
              {engineLoad.map((e) => (
                <div key={e.module}>
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="text-slate-600 dark:text-slate-400 truncate max-w-[120px] font-medium">{e.module}</span>
                    <span className="font-semibold" style={{ color: loadColor(e.load) }}>{e.load}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${e.load}%`, backgroundColor: loadColor(e.load) }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Updates */}
      <div className={`${card} rounded-xl p-5`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Activity className="size-3.5" /> Recent Rule Updates
          </h3>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Auto-optimization active</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {recentUpdates.map((u, i) => (
            <div key={i} className={`${cardInner} rounded-xl p-4`}>
              <p className="text-xs text-slate-700 dark:text-slate-300 mb-3 line-clamp-2 font-medium leading-relaxed">{u.change}</p>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{u.impact}</span>
                <span className="text-slate-400 dark:text-slate-600 flex items-center gap-1"><Clock className="size-2.5" /> {u.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 dark:border-slate-700/50 pt-5 pb-2 flex items-center justify-between text-[10px] font-semibold tracking-wider text-slate-400 dark:text-slate-600 uppercase">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><Shield className="size-3 text-cyan-500" /> Adaptive Rule Engine v2.4.12</span>
          <span>Status: <span className="text-emerald-500">Operational</span></span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><Lock className="size-3 text-cyan-500" /> AES-256-GCM</span>
          <span>Last Model Update: 2h ago</span>
        </div>
      </div>
    </div>
  );
}
