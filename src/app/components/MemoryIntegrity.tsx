import { useState, useEffect, useCallback } from 'react';
import { Database, Shield, AlertTriangle, Search, Filter, RefreshCcw, Lock, Unlock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const API_BASE = `${(import.meta as any).env.VITE_API_URL || 'http://localhost:8000'}/api/memory-integrity`;

/* ── Fallback Data ──────────────────────────────────────────── */
const defaultMemoryFiles = [
  { name: 'No files monitored', agent: 'N/A', anomalyScore: 0, status: 'HEALTHY' },
];

const defaultTimeline = Array.from({ length: 24 }, (_, i) => ({
  hour: `${24 - i}h`,
  system: 0,
  anomaly: 0,
}));

export default function Layer3MemoryIntegrity() {
  const [memoryFiles, setMemoryFiles] = useState<any[]>(defaultMemoryFiles);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [forensics, setForensics] = useState<{ golden: string; current: string } | null>(null);
  const [stats, setStats] = useState({ monitored_files: 0, detected_anomalies: 0, quarantined_states: 0, baseline_drift: 0 });
  const [timeline, setTimeline] = useState<any[]>(defaultTimeline);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token') || '';
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

      const [filesRes, statsRes, timelineRes] = await Promise.all([
        fetch(`${API_BASE}/files`, { headers }),
        fetch(`${API_BASE}/stats`, { headers }),
        fetch(`${API_BASE}/timeline`, { headers }),
      ]);

      if (filesRes.ok) {
        const data = await filesRes.json();
        setMemoryFiles(data.length > 0 ? data : defaultMemoryFiles);
        if (data.length > 0 && !selectedFile) setSelectedFile(data[0]);
      }
      if (statsRes.ok) setStats(await statsRes.json());
      if (timelineRes.ok) setTimeline(await timelineRes.json());
    } catch (err) {
      console.error('Failed to fetch memory integrity data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedFile]);

  const fetchForensics = useCallback(async (fileName: string) => {
    try {
      const token = localStorage.getItem('auth_token') || '';
      const res = await fetch(`${API_BASE}/files/${encodeURIComponent(fileName)}/forensics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setForensics(await res.json());
    } catch (err) {
      setForensics(null);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (selectedFile?.name) fetchForensics(selectedFile.name); }, [selectedFile, fetchForensics]);

  const handleQuarantine = async (fileName: string) => {
    const token = localStorage.getItem('auth_token') || '';
    await fetch(`${API_BASE}/files/${encodeURIComponent(fileName)}/quarantine`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchData();
  };

  const handleRestore = async (fileName: string) => {
    const token = localStorage.getItem('auth_token') || '';
    await fetch(`${API_BASE}/files/${encodeURIComponent(fileName)}/restore`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchData();
  };

  const goldenBaseline = forensics?.golden || `# No baseline loaded
Select a file to view its golden baseline.`;

  const currentActive = forensics?.current || `# No current state loaded
Select a file to view its current state.`;

  return (
    <div className="w-full px-6 py-6 space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'MONITORED FILES', value: String(stats.monitored_files), sub: 'files', trend: '' },
          { label: 'DETECTED ANOMALIES', value: String(stats.detected_anomalies), sub: '', trend: '', color: 'text-red-400' },
          { label: 'QUARANTINED STATES', value: String(stats.quarantined_states), sub: 'Locked', trend: '' },
          { label: 'BASELINE DRIFT', value: `${stats.baseline_drift}%`, sub: 'Global Avg', trend: '' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">{s.label}</div>
            <div className="flex items-end gap-2">
              <span className={`text-2xl font-bold ${s.color || 'text-slate-900 dark:text-white'}`}>{s.value}</span>
              <span className="text-xs text-slate-500 pb-0.5">{s.sub}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main: File List + Forensic View */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* File List */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          {/* Search */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg px-3 py-2 mb-4">
            <Search className="size-4 text-slate-500" />
            <input type="text" placeholder="Search memory files..." className="bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-500 outline-none flex-1" />
          </div>
          <div className="flex gap-2 mb-4">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs font-semibold">
              <Filter className="size-3" /> FILTER
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs font-semibold">
              <RefreshCcw className="size-3" /> Re-Scan
            </button>
          </div>

          {/* File Items */}
          <div className="space-y-2">
            {memoryFiles.map((file, i) => (
              <div
                key={i}
                onClick={() => setSelectedFile(file)}
                className={`p-4 rounded-lg cursor-pointer transition-all ${selectedFile?.name === file.name
                    ? 'bg-red-500/10 border border-red-500/30'
                    : 'bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:bg-slate-800/50'
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{file.name}</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${file.status === 'COMPROMISED' ? 'bg-red-500/20 text-red-400' :
                      file.status === 'WARNING' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-green-500/20 text-green-400'
                    }`}>{file.status}</span>
                </div>
                <p className="text-[10px] text-slate-500 mb-2">{file.agent}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Anomaly Score</span>
                  <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${file.anomalyScore > 50 ? 'bg-red-500' : file.anomalyScore > 20 ? 'bg-amber-500' : 'bg-green-500'}`}
                      style={{ width: `${file.anomalyScore}%` }} />
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{file.anomalyScore}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Forensic Analysis */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedFile?.name || 'Select a file'}</h2>
                <p className="text-xs text-slate-500">FORENSIC ANALYSIS MODE - AGENT: {(selectedFile?.agent || 'N/A').toUpperCase()}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => selectedFile && handleQuarantine(selectedFile.name)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-semibold"
                >
                  <AlertTriangle className="size-3" /> Quarantine Agent
                </button>
                <button
                  onClick={() => selectedFile && handleRestore(selectedFile.name)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg text-xs font-semibold"
                >
                  <RefreshCcw className="size-3" /> Restore Baseline
                </button>
              </div>
            </div>

            {/* Hash comparison */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-50 dark:bg-[#0a0f1a] rounded-lg p-3 border border-slate-200 dark:border-slate-800">
                <p className="text-[9px] text-slate-600 uppercase tracking-wider font-semibold mb-1">Baseline CryptoHash (SHA-256)</p>
                <div className="flex items-center gap-2">
                  <Lock className="size-3 text-green-400" />
                  <span className="text-xs font-mono text-green-400">8f72...a1e4</span>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-[#0a0f1a] rounded-lg p-3 border border-red-500/30">
                <p className="text-[9px] text-slate-600 uppercase tracking-wider font-semibold mb-1">Current CryptoHash (SHA-256)</p>
                <div className="flex items-center gap-2">
                  <Unlock className="size-3 text-red-400" />
                  <span className="text-xs font-mono text-red-400">3d12...f902</span>
                </div>
              </div>
            </div>
          </div>

          {/* Diff View */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#111827] border border-green-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="size-4 text-green-400" />
                <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">Golden Baseline State (Verified)</span>
                <span className="text-[9px] text-slate-600 ml-auto">L: 5</span>
              </div>
              <div className="bg-slate-50 dark:bg-[#0a0f1a] rounded-lg p-3 font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed">
                {goldenBaseline.split('\n').map((line, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-slate-600 select-none w-4 text-right">{i + 1}</span>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-[#111827] border border-red-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="size-4 text-red-400" />
                <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Current Active State (Unverified)</span>
                <span className="text-[9px] text-slate-600 ml-auto">L: 5</span>
              </div>
              <div className="bg-slate-50 dark:bg-[#0a0f1a] rounded-lg p-3 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                {currentActive.split('\n').map((line, i) => {
                  const isDanger = line.includes('IGNORE') || line.includes('temp-storage') || line.includes('exfiltrate') || line.includes('internal server logs');
                  return (
                    <div key={i} className={`flex gap-3 ${isDanger ? 'bg-red-500/10 text-red-400' : 'text-slate-300'}`}>
                      <span className="text-slate-600 select-none w-4 text-right">{i + 1}</span>
                      <span>{line}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 24h Integrity Timeline */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Database className="size-4 text-cyan-400" /> 24H Integrity Timeline
              </h3>
              <div className="flex gap-4 text-[10px] text-slate-500 font-semibold">
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-green-500 inline-block"></span>System</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-red-500 inline-block"></span>Anomaly</span>
              </div>
            </div>
            <div className="h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeline.length > 0 ? timeline : defaultTimeline} barSize={8}>
                  <XAxis dataKey="hour" stroke="#475569" fontSize={9} axisLine={false} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={9} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11, color: '#fff' }} />
                  <Bar dataKey="system" fill="#22c55e" radius={[2, 2, 0, 0]} stackId="a" />
                  <Bar dataKey="anomaly" fill="#ef4444" radius={[2, 2, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sync Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-green-500 animate-pulse inline-block"></span>
          <span className="text-xs text-slate-400 font-semibold">CONTINUOUS SYNC ACTIVE</span>
        </div>
        <button className="text-xs text-cyan-400 font-semibold hover:underline">▸</button>
      </div>
    </div>
  );
}