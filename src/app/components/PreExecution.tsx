import { useState, useEffect, useCallback } from 'react';
import { Search, Shield, AlertTriangle, CheckCircle2, RefreshCcw, Filter, BarChart3, Lock, Wifi, FileCheck, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { motion } from 'framer-motion';

const API_BASE = `${(import.meta as any).env.VITE_API_URL || 'http://localhost:8000'}/api/pre-execution`;

/* ── Fallback Data ──────────────────────────────────────────── */
const defaultTools = [
  { name: 'No tools loaded', source: 'N/A', risk: 0, threats: [], status: 'APPROVED', scanned: '--' },
];

const defaultRiskBreakdown = [
  { axis: 'Injection', value: 0 },
  { axis: 'Data Leak', value: 0 },
  { axis: 'Privilege Esc.', value: 0 },
  { axis: 'Side Effects', value: 0 },
  { axis: 'Evasion', value: 0 },
  { axis: 'Exfiltration', value: 0 },
];

const defaultRiskDistribution = [
  { range: '0.0-0.2', count: 0 },
  { range: '0.2-0.4', count: 0 },
  { range: '0.4-0.6', count: 0 },
  { range: '0.6-0.8', count: 0 },
  { range: '0.8-1.0', count: 0 },
];

const statusColor: Record<string, string> = {
  APPROVED: 'bg-green-500/20 text-green-400 border border-green-500/30',
  QUARANTINED: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  BLOCKED: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

const threatColor: Record<string, string> = {
  'Prompt Injection': 'bg-red-500/20 text-red-400',
  'Over-Permission': 'bg-amber-500/20 text-amber-400',
  Shadow: 'bg-purple-500/20 text-purple-400',
  Exfiltration: 'bg-orange-500/20 text-orange-400',
};

export default function Layer2PreExecution() {
  const [tools, setTools] = useState<any[]>(defaultTools);
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [riskBreakdown, setRiskBreakdown] = useState<any[]>(defaultRiskBreakdown);
  const [riskDistribution, setRiskDistribution] = useState<any[]>(defaultRiskDistribution);
  const [stats, setStats] = useState({ total_scanned: 0, avg_risk: 0, critical_blocks: 0, uptime: 99.9 });
  const [policies, setPolicies] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token') || '';
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

      const [toolsRes, statsRes, distRes, policiesRes] = await Promise.all([
        fetch(`${API_BASE}/tools`, { headers }),
        fetch(`${API_BASE}/stats`, { headers }),
        fetch(`${API_BASE}/risk-distribution`, { headers }),
        fetch(`${API_BASE}/policies`, { headers }),
      ]);

      if (toolsRes.ok) {
        const data = await toolsRes.json();
        setTools(data.length > 0 ? data : defaultTools);
        if (data.length > 0 && !selectedTool) setSelectedTool(data[0]);
      }
      if (statsRes.ok) setStats(await statsRes.json());
      if (distRes.ok) setRiskDistribution(await distRes.json());
      if (policiesRes.ok) setPolicies(await policiesRes.json());
    } catch (err) {
      console.error('Failed to fetch pre-execution data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedTool]);

  const fetchToolRiskBreakdown = useCallback(async (toolName: string) => {
    try {
      const token = localStorage.getItem('auth_token') || '';
      const res = await fetch(`${API_BASE}/tools/${toolName}/risk-breakdown`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRiskBreakdown(data.map((d: any) => ({ axis: d.axis, value: Math.round(d.value * 100) })));
      }
    } catch (err) {
      setRiskBreakdown(defaultRiskBreakdown);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (selectedTool?.name) fetchToolRiskBreakdown(selectedTool.name); }, [selectedTool, fetchToolRiskBreakdown]);

  const handleRescan = async (toolName: string) => {
    const token = localStorage.getItem('auth_token') || '';
    await fetch(`${API_BASE}/tools/${toolName}/rescan`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchData();
  };

  const handleQuarantine = async (toolName: string) => {
    const token = localStorage.getItem('auth_token') || '';
    await fetch(`${API_BASE}/tools/${toolName}/quarantine`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchData();
  };

  const filteredTools = tools.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-mono text-sm">{'>'}_</span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">MCP TOOL SCANNER</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">STAGE 02 // PRE-EXECUTION INTELLIGENCE & LAYER ANALYSIS</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#111827] border border-cyan-500/30 text-cyan-400 rounded-lg text-sm font-semibold hover:bg-cyan-500/10 transition-colors">
            <RefreshCcw className="size-4" /> Trigger Re-Scan
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm font-semibold hover:bg-red-500/30 transition-colors">
            <AlertTriangle className="size-4" /> Bulk Quarantine
          </button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'TOTAL TOOLS SCANNED', value: stats.total_scanned.toLocaleString(), trend: '', bg: 'bg-white dark:bg-[#111827]' },
          { label: 'AVG RISK SCORE', value: `${Math.round(stats.avg_risk * 100)}/100`, trend: '', bg: 'bg-white dark:bg-[#111827]' },
          { label: 'CRITICAL BLOCKS', value: String(stats.critical_blocks), trend: '', icon: AlertTriangle, bg: 'bg-white dark:bg-[#111827]' },
          { label: 'SCANNER UPTIME', value: `${stats.uptime}%`, trend: 'Stable', bg: 'bg-white dark:bg-[#111827]' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`${s.bg} border border-slate-200 dark:border-slate-800 rounded-xl p-5`}>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">{s.label}</div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</span>
              {s.trend && <span className="text-xs text-cyan-400 font-semibold">{s.trend}</span>}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content: Tool List + Inspector */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Tool List */}
        <div className="lg:col-span-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl">
          {/* Search Bar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg px-3 py-2 flex-1">
              <Search className="size-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search tools or sources.."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-500 outline-none flex-1"
              />
            </div>
            <button className="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-slate-500 hover:text-white transition-colors">
              <Filter className="size-4" />
            </button>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 px-4 py-2 text-[10px] text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800/50">
            <div className="col-span-4">Tool Identity</div>
            <div className="col-span-2">Origin Source</div>
            <div className="col-span-2 text-center">Risk Metric</div>
            <div className="col-span-2">Threat Classification</div>
            <div className="col-span-2">Status</div>
          </div>

          {/* Tool Rows */}
          <div className="divide-y divide-slate-800/50">
            {filteredTools.map((tool, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedTool(tool)}
                className={`grid grid-cols-12 px-4 py-3.5 items-center cursor-pointer transition-colors ${selectedTool?.name === tool.name ? 'bg-cyan-500/5 border-l-2 border-cyan-400' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                  }`}
              >
                <div className="col-span-4">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{tool.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{tool.source}</p>
                </div>
                <div className="col-span-2 text-xs text-slate-400 truncate">{tool.source.split('/')[0]}</div>
                <div className="col-span-2 flex justify-center">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${tool.risk > 70 ? 'bg-red-500' : tool.risk > 40 ? 'bg-amber-500' : 'bg-green-500'}`}
                        style={{ width: `${tool.risk}%` }} />
                    </div>
                    <span className="text-xs text-slate-400 font-mono">{tool.risk}</span>
                  </div>
                </div>
                <div className="col-span-2 flex flex-wrap gap-1">
                  {tool.threats.length === 0 ? (
                    <span className="text-[10px] text-slate-600">No threats</span>
                  ) : (
                    tool.threats.map((t: string, j: number) => (
                      <span key={j} className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${threatColor[t] || 'bg-slate-200 dark:bg-slate-700 text-slate-300'}`}>{t}</span>
                    ))
                  )}
                </div>
                <div className="col-span-2">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusColor[tool.status]}`}>{tool.status}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="px-4 py-3 text-[10px] text-slate-600 font-semibold">
            SHOWING {filteredTools.length} OF {stats.total_scanned} REGISTRY ENTRIES
          </div>
        </div>

        {/* Right Panel: Inspector */}
        <div className="lg:col-span-2 space-y-4">
          {/* Registry Inspector */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider">Registry Inspector</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{selectedTool?.name || 'Select a tool'}</h3>
            <p className="text-xs text-slate-500 mb-4">ID: mcp-04 // v2.4.1</p>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => selectedTool && handleRescan(selectedTool.name)}
                className="flex-1 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg text-xs font-bold hover:bg-cyan-500/30 transition-colors"
              >RE-SCAN</button>
              <button
                onClick={() => selectedTool && handleQuarantine(selectedTool.name)}
                className="flex-1 py-2 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/30 transition-colors"
              >QUARANTINE</button>
            </div>

            {/* Risk Vector Breakdown */}
            <h4 className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">Risk Vector Breakdown</h4>
            <p className="text-[9px] text-slate-600 mb-2">Multi-dimensional analysis</p>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={riskBreakdown} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: '#64748b', fontSize: 9 }} />
                  <PolarRadiusAxis tick={false} axisLine={false} />
                  <Radar name="Risk" dataKey="value" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Parameter Schema */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Parameter Schema</h4>
              <button className="text-[10px] text-cyan-400 font-semibold">Copy JSON</button>
            </div>
            <div className="bg-slate-50 dark:bg-[#0a0f1a] rounded-lg p-3 font-mono text-[11px] text-slate-600 dark:text-slate-300 overflow-auto max-h-40">
              <pre>{selectedTool ? JSON.stringify({
                name: selectedTool.name,
                version: "1.4.0-stable",
                permissions: [],
                "fs.root": "/tmp/sandbox",
                "net.connect": ".pypi.org",
                "env.get": "USERNAME"
              }, null, 2) : '// Select a tool from the list'}</pre>
            </div>
          </div>

          {/* Policy Enforcement */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h4 className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-4">Policy Enforcement</h4>
            {[
              { label: 'Enforce Sandboxing', desc: 'MANDATORY KERNEL ISOLATION', on: true, icon: Shield },
              { label: 'Egress Filtering', desc: 'BLOCK NON-WHITELISTED IPS', on: true, icon: Wifi },
              { label: 'Audit Trailing', desc: 'VERBOSE SESSION LOGGING', on: false, icon: FileCheck },
              { label: 'Integrity Check', desc: 'RUNTIME HASH VALIDATION', on: true, icon: Eye },
            ].concat(policies.map(p => ({ label: p.label, desc: p.desc?.toUpperCase() || '', on: p.on, icon: Lock }))).map((p, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-200 dark:border-slate-800/50 last:border-0">
                <div className="flex items-center gap-3">
                  <p.icon className="size-4 text-cyan-400" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">{p.label}</p>
                    <p className="text-[9px] text-slate-600">{p.desc}</p>
                  </div>
                </div>
                <div className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${p.on ? 'bg-cyan-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                  <div className={`size-4 rounded-full bg-white transition-transform ${p.on ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk Distribution Bar */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Risk Distribution</h2>
          <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full font-semibold">Scale: 0.0-1.0</span>
        </div>
        <div className="h-[120px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={riskDistribution.length > 0 ? riskDistribution : defaultRiskDistribution} barSize={40}>
              <XAxis dataKey="range" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11, color: '#fff' }} />
              <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}