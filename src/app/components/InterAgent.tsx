import { useState, useEffect, useCallback } from 'react';
import { Network, Shield, AlertTriangle, Lock, CheckCircle, XCircle, ArrowRight, Activity, Eye, Zap, Server, GitBranch } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

const API_BASE = 'http://localhost:8000';

/* ── fallback / default data ── */
const defaultAgents = [
  { id: 'Analyst_Core', type: 'primary', trust: 0.98, status: 'VERIFIED', connections: 4, lastAuth: '2m ago' },
  { id: 'ChatFront_01', type: 'interface', trust: 0.95, status: 'VERIFIED', connections: 2, lastAuth: '1m ago' },
  { id: 'DB_Connector', type: 'data', trust: 0.92, status: 'VERIFIED', connections: 3, lastAuth: '5m ago' },
  { id: 'Tool_Orchestrator', type: 'executor', trust: 0.88, status: 'WARNING', connections: 6, lastAuth: '8m ago' },
  { id: 'External_API_GW', type: 'gateway', trust: 0.45, status: 'SUSPICIOUS', connections: 8, lastAuth: '12m ago' },
];

const defaultInterceptedMessages = [
  { from: 'External_API_GW', to: 'Tool_Orchestrator', msg: 'EXECUTE_CMD: rm -rf /tmp/*', risk: 'CRITICAL', timestamp: '14:42:18' },
  { from: 'Tool_Orchestrator', to: 'DB_Connector', msg: 'QUERY: SELECT * FROM users WHERE 1=1', risk: 'HIGH', timestamp: '14:41:55' },
  { from: 'ChatFront_01', to: 'Analyst_Core', msg: 'USER_INPUT: Show system configuration', risk: 'MEDIUM', timestamp: '14:41:32' },
  { from: 'Analyst_Core', to: 'DB_Connector', msg: 'FETCH: session_context_v2', risk: 'LOW', timestamp: '14:41:08' },
  { from: 'DB_Connector', to: 'ChatFront_01', msg: 'RESPONSE: [REDACTED payload]', risk: 'LOW', timestamp: '14:40:45' },
];

const defaultAnomalousRoutes = [
  {
    route: 'External_API_GW → Tool_Orchestrator',
    reason: 'Unauthorized privilege escalation attempt',
    action: 'BLOCKED',
    timestamp: '14:42:18',
  },
  {
    route: 'Tool_Orchestrator → DB_Connector',
    reason: 'SQL injection pattern in delegation payload',
    action: 'QUARANTINE',
    timestamp: '14:41:55',
  },
];

const defaultTrustMetrics = [
  { metric: 'Auth Validity', score: 95 },
  { metric: 'Payload Integrity', score: 88 },
  { metric: 'Route Compliance', score: 72 },
  { metric: 'Token Freshness', score: 98 },
  { metric: 'Behavior Normal', score: 65 },
  { metric: 'Delegation Chain', score: 80 },
];

const statusColor: Record<string, string> = {
  VERIFIED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  WARNING: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  SUSPICIOUS: 'text-red-400 bg-red-500/10 border-red-500/30',
};

const riskColor: Record<string, string> = {
  CRITICAL: 'text-red-400 bg-red-500/10',
  HIGH: 'text-orange-400 bg-orange-500/10',
  MEDIUM: 'text-yellow-400 bg-yellow-500/10',
  LOW: 'text-slate-400 bg-slate-500/10',
};

const typeIcon: Record<string, string> = {
  primary: 'bg-cyan-500/20 border-cyan-500/50',
  interface: 'bg-blue-500/20 border-blue-500/50',
  data: 'bg-emerald-500/20 border-emerald-500/50',
  executor: 'bg-purple-500/20 border-purple-500/50',
  gateway: 'bg-red-500/20 border-red-500/50',
};

export default function Layer7InterAgent() {
  const [agents, setAgents] = useState(defaultAgents);
  const [interceptedMessages, setInterceptedMessages] = useState(defaultInterceptedMessages);
  const [anomalousRoutes, setAnomalousRoutes] = useState(defaultAnomalousRoutes);
  const [trustMetrics, setTrustMetrics] = useState(defaultTrustMetrics);
  const [selectedAgent, setSelectedAgent] = useState(defaultAgents[0]);

  const fetchData = useCallback(async () => {
    try {
      const authToken = localStorage.getItem('auth_token') || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      };

      const [statsRes, eventsRes] = await Promise.all([
        fetch(`${API_BASE}/admin/stats`, { headers }),
        fetch(`${API_BASE}/admin/recent-events`, { headers }),
      ]);

      if (statsRes.ok) {
        const stats = await statsRes.json();
        if (stats.agents && Array.isArray(stats.agents)) {
          setAgents(stats.agents);
        }
        if (stats.trust_metrics && Array.isArray(stats.trust_metrics)) {
          setTrustMetrics(stats.trust_metrics);
        }
        if (stats.anomalous_routes && Array.isArray(stats.anomalous_routes)) {
          setAnomalousRoutes(stats.anomalous_routes);
        }
      }

      if (eventsRes.ok) {
        const events = await eventsRes.json();
        const eventList = Array.isArray(events) ? events : events.events ?? [];
        if (eventList.length > 0) {
          const mapped = eventList.map((e: any) => ({
            from: e.source_agent || e.from || 'Unknown',
            to: e.target_agent || e.to || 'Unknown',
            msg: e.message || e.content || e.msg || '',
            risk: (e.risk_level || e.risk || 'LOW').toUpperCase(),
            timestamp: e.timestamp
              ? new Date(e.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              : '',
          }));
          setInterceptedMessages(mapped);
        }
      }
    } catch (err) {
      console.error('InterAgent: failed to fetch data', err);
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
            <Network className="size-3.5" /> Stage 07
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cross-Agent Zero-Trust</h1>
          <p className="text-sm text-slate-400 mt-1">Inter-agent delegation firewall & trust verification</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-red-400 animate-pulse" /> 1 Suspicious Agent
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#111827] border border-slate-700/50 text-slate-300 text-xs font-semibold">
            {agents.length} Active Agents
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Active Agents', value: '5', sub: '4 verified, 1 suspicious', icon: Server, color: 'text-cyan-400' },
          { label: 'Delegations/min', value: '847', sub: '↑ 12% from baseline', icon: GitBranch, color: 'text-purple-400' },
          { label: 'Auth Challenges', value: '23', sub: 'Last 60 minutes', icon: Lock, color: 'text-yellow-400' },
          { label: 'Routes Blocked', value: '4', sub: 'Anomalous patterns', icon: Shield, color: 'text-red-400' },
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
        {/* Agent Topology */}
        <div className="col-span-4 bg-white dark:bg-[#111827] border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700/50">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Agent Trust Network</h3>
          </div>
          <div className="p-4 space-y-2">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={`w-full text-left px-3 py-3 rounded-lg border transition-colors ${selectedAgent.id === agent.id ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-[#0d1424] border-slate-700/30 hover:border-slate-600/50'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`size-8 rounded-lg flex items-center justify-center border ${typeIcon[agent.type]}`}>
                    <Server className="size-4 text-slate-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">{agent.id}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${statusColor[agent.status]}`}>{agent.status}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{agent.connections} connections</span>
                      <span>Last auth: {agent.lastAuth}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: `${agent.trust * 100}%`,
                        backgroundColor: agent.trust > 0.8 ? '#34d399' : agent.trust > 0.5 ? '#fbbf24' : '#f87171'
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{(agent.trust * 100).toFixed(0)}%</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Intercepted Messages */}
        <div className="col-span-5 bg-white dark:bg-[#111827] border border-slate-700/50 rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Intercepted Delegations</h3>
            <div className="flex items-center gap-1.5">
              <Eye className="size-3 text-indigo-400" />
              <span className="text-[10px] text-indigo-400 font-semibold">LIVE INSPECTION</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[350px]">
            {interceptedMessages.map((msg, i) => (
              <div key={i} className={`p-3 rounded-lg border ${msg.risk === 'CRITICAL' ? 'border-red-500/30 bg-red-500/5' : 'border-slate-700/30 bg-[#0d1424]'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">{msg.from}</span>
                    <ArrowRight className="size-3 text-slate-600" />
                    <span className="text-slate-300">{msg.to}</span>
                  </div>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${riskColor[msg.risk]}`}>{msg.risk}</span>
                </div>
                <p className="text-xs text-slate-400 font-mono truncate">{msg.msg}</p>
                <span className="text-[10px] text-slate-600 mt-1 block">{msg.timestamp}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="col-span-3 space-y-4">
          {/* Trust Radar */}
          <div className="bg-white dark:bg-[#111827] border border-slate-700/50 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Trust Profile: {selectedAgent.id}</h3>
            <ResponsiveContainer width="100%" height={150}>
              <RadarChart data={trustMetrics}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 9 }} />
                <Radar name="Trust" dataKey="score" stroke="#818cf8" fill="#818cf8" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Anomalous Routes */}
          <div className="bg-white dark:bg-[#111827] border border-slate-700/50 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <AlertTriangle className="size-3.5 text-red-400" /> Anomalous Routes
            </h3>
            <div className="space-y-2">
              {anomalousRoutes.map((route, i) => (
                <div key={i} className="p-3 rounded-lg border border-red-500/30 bg-red-500/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-red-400">{route.route}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${route.action === 'BLOCKED' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{route.action}</span>
                  </div>
                  <p className="text-[10px] text-slate-500">{route.reason}</p>
                  <div className="mt-2 flex gap-2">
                    <button className="flex-1 text-[10px] font-semibold py-1.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors">
                      Verify Token
                    </button>
                    <button className="flex-1 text-[10px] font-semibold py-1.5 rounded bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors">
                      Quarantine
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}