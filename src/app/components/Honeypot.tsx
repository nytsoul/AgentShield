import { useState, useEffect, useCallback } from 'react';
import { Skull, Target, Clock, AlertTriangle, Zap, Activity, ArrowRight, Eye, Shield, Timer, Gauge, Brain } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const phaseColor: Record<string, string> = {
  PROBING: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  ENTRAPPED: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  EXHAUSTED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
};

const priorityColor: Record<string, string> = {
  HIGH: 'bg-red-500/10 text-red-400',
  MED: 'bg-yellow-500/10 text-yellow-400',
  LOW: 'bg-slate-500/10 text-slate-400',
};

const defaultEngagements = [
  { id: 'TRP-0000', attacker: '—', phase: 'PROBING', timeWasted: '0m 00s', turns: 0, strategy: '—', deceptLevel: 0 },
];

const defaultFlowNodes = [
  { id: 'entry', label: 'Threat Detection', x: 0, status: 'active' },
  { id: 'redirect', label: 'Silent Redirect', x: 1, status: 'active' },
  { id: 'decoy', label: 'Decoy Engagement', x: 2, status: 'active' },
  { id: 'tarpit', label: 'Tarpit Loop', x: 3, status: 'active' },
  { id: 'exhaust', label: 'Resource Exhaust', x: 4, status: 'pending' },
  { id: 'intel', label: 'Intel Harvest', x: 5, status: 'pending' },
];

const defaultIntelligenceQueue: { pattern: string; confidence: number; source: string; priority: string }[] = [];

const defaultTrapEfficiency = [
  { name: 'Jailbreak', value: 25, color: '#f87171' },
  { name: 'Roleplay', value: 25, color: '#fbbf24' },
  { name: 'Extraction', value: 25, color: '#22d3ee' },
  { name: 'Social Eng', value: 25, color: '#a78bfa' },
];

const defaultTimeWastedTrend = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  wasted: 0,
  attacks: 0,
}));

export default function Layer6Honeypot() {
  const [activeEngagements, setActiveEngagements] = useState(defaultEngagements);
  const [deceptionFlowNodes, setDeceptionFlowNodes] = useState(defaultFlowNodes);
  const [intelligenceQueue, setIntelligenceQueue] = useState(defaultIntelligenceQueue);
  const [trapEfficiency, setTrapEfficiency] = useState(defaultTrapEfficiency);
  const [timeWastedTrend, setTimeWastedTrend] = useState(defaultTimeWastedTrend);
  const [selectedTrap, setSelectedTrap] = useState(defaultEngagements[0]);

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [eventsRes, statsRes] = await Promise.all([
        fetch('http://localhost:8000/admin/recent-events', { headers }),
        fetch('http://localhost:8000/admin/stats', { headers }),
      ]);

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        if (eventsData.activeEngagements) setActiveEngagements(eventsData.activeEngagements);
        if (eventsData.deceptionFlowNodes) setDeceptionFlowNodes(eventsData.deceptionFlowNodes);
        if (eventsData.intelligenceQueue) setIntelligenceQueue(eventsData.intelligenceQueue);
        if (eventsData.timeWastedTrend) setTimeWastedTrend(eventsData.timeWastedTrend);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.trapEfficiency) setTrapEfficiency(statsData.trapEfficiency);
      }
    } catch (err) {
      console.error('Honeypot: failed to fetch data', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="w-full px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-widest mb-1">
            <Skull className="size-3.5" /> Stage 05
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Honeypot Tarpit</h1>
          <p className="text-sm text-slate-400 mt-1">Deception network for threat intelligence harvesting</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-orange-400 animate-pulse" /> 5 Active Traps
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Active Traps', value: '42', sub: '↑ 8 from yesterday', icon: Target, color: 'text-orange-400' },
          { label: 'Decoy Nodes', value: '128', sub: 'Across 4 regions', icon: Skull, color: 'text-red-400' },
          { label: 'Time Wasted', value: '14h 22m', sub: 'Attacker resources drained', icon: Timer, color: 'text-emerald-400' },
          { label: 'Intel Harvested', value: '847', sub: 'Attack patterns learned', icon: Brain, color: 'text-cyan-400' },
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
        {/* Active Decoy Engagements Table */}
        <div className="col-span-7 bg-white dark:bg-[#111827] border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Decoy Engagements</h3>
            <span className="text-[10px] text-slate-500">Real-time tarpit status</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800/50 text-xs text-slate-500 uppercase">
                  <th className="px-4 py-3 text-left font-medium">Trap ID</th>
                  <th className="px-4 py-3 text-left font-medium">Attacker</th>
                  <th className="px-4 py-3 text-left font-medium">Phase</th>
                  <th className="px-4 py-3 text-left font-medium">Time Wasted</th>
                  <th className="px-4 py-3 text-left font-medium">Turns</th>
                  <th className="px-4 py-3 text-left font-medium">Strategy</th>
                  <th className="px-4 py-3 text-left font-medium">Deception %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {activeEngagements.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => setSelectedTrap(e)}
                    className={`cursor-pointer hover:bg-slate-50 dark:bg-slate-800/30 transition-colors ${selectedTrap.id === e.id ? 'bg-orange-500/5' : ''}`}
                  >
                    <td className="px-4 py-3 font-mono text-orange-400">{e.id}</td>
                    <td className="px-4 py-3 text-slate-300">{e.attacker}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${phaseColor[e.phase]}`}>{e.phase}</span>
                    </td>
                    <td className="px-4 py-3 text-emerald-400 font-mono">{e.timeWasted}</td>
                    <td className="px-4 py-3 text-slate-400">{e.turns}</td>
                    <td className="px-4 py-3 text-slate-400">{e.strategy}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 w-16">
                          <div className="h-1.5 rounded-full bg-orange-400" style={{ width: `${e.deceptLevel}%` }} />
                        </div>
                        <span className="text-xs font-mono text-orange-400">{e.deceptLevel}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel */}
        <div className="col-span-5 space-y-4">
          {/* Deception Flow Path */}
          <div className="bg-white dark:bg-[#111827] border border-slate-700/50 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Deception Flow Path</h3>
            <div className="flex items-center justify-between">
              {deceptionFlowNodes.map((node, i) => (
                <div key={node.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`size-8 rounded-lg flex items-center justify-center ${node.status === 'active' ? 'bg-orange-500/20 border border-orange-500/50' : 'bg-slate-100 dark:bg-slate-800/50 border border-slate-700/50'}`}>
                      {i === 0 && <AlertTriangle className={`size-4 ${node.status === 'active' ? 'text-orange-400' : 'text-slate-500'}`} />}
                      {i === 1 && <ArrowRight className={`size-4 ${node.status === 'active' ? 'text-orange-400' : 'text-slate-500'}`} />}
                      {i === 2 && <Skull className={`size-4 ${node.status === 'active' ? 'text-orange-400' : 'text-slate-500'}`} />}
                      {i === 3 && <Activity className={`size-4 ${node.status === 'active' ? 'text-orange-400' : 'text-slate-500'}`} />}
                      {i === 4 && <Timer className={`size-4 ${node.status === 'active' ? 'text-orange-400' : 'text-slate-500'}`} />}
                      {i === 5 && <Brain className={`size-4 ${node.status === 'active' ? 'text-orange-400' : 'text-slate-500'}`} />}
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1.5 text-center max-w-[60px]">{node.label}</span>
                  </div>
                  {i < deceptionFlowNodes.length - 1 && (
                    <div className={`w-4 h-0.5 mx-1 ${node.status === 'active' ? 'bg-orange-500/50' : 'bg-slate-700/50'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Trap Efficiency Breakdown */}
          <div className="bg-white dark:bg-[#111827] border border-slate-700/50 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Trap Efficiency by Strategy</h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={100} height={100}>
                <PieChart>
                  <Pie
                    data={trapEfficiency}
                    innerRadius={30}
                    outerRadius={45}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {trapEfficiency.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {trapEfficiency.map((t) => (
                  <div key={t.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full" style={{ backgroundColor: t.color }} />
                      <span className="text-slate-400">{t.name}</span>
                    </div>
                    <span className="text-slate-300 font-semibold">{t.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-12 gap-4">
        {/* Intelligence Queue */}
        <div className="col-span-7 bg-white dark:bg-[#111827] border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Brain className="size-3.5" /> Adaptive Engine Intelligence Queue
            </h3>
            <span className="text-[10px] text-emerald-400 font-semibold">4 patterns pending integration</span>
          </div>
          <div className="space-y-2">
            {intelligenceQueue.map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-[#0d1424] border border-slate-700/30 rounded-lg px-4 py-3">
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-sm text-slate-300 truncate">{item.pattern}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                    <span>Source: {item.source}</span>
                    <span>Confidence: {item.confidence}%</span>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-1 rounded ${priorityColor[item.priority]}`}>{item.priority}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Time Wasted Trend */}
        <div className="col-span-5 bg-white dark:bg-[#111827] border border-slate-700/50 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">24h Attacker Time Wasted</h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={timeWastedTrend}>
              <defs>
                <linearGradient id="wastedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fb923c" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} interval={5} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0d1424', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="wasted" stroke="#fb923c" fill="url(#wastedGrad)" strokeWidth={2} name="Minutes Wasted" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}