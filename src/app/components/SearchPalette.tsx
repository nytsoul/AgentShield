import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Search, X, LayoutDashboard, Cpu, Brain, Activity, Crosshair, Bug, Network, RefreshCcw, Layers, Shield } from 'lucide-react';

interface SearchItem {
  label: string;
  path: string;
  icon: React.ElementType;
  keywords: string[];
  category: string;
}

const SEARCH_ITEMS: SearchItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, keywords: ['overview', 'stats', 'health', 'threats', 'home', 'main'], category: 'Pages' },
  { label: 'MCP Scanner', path: '/layer2-pre-execution', icon: Cpu, keywords: ['tool', 'scanner', 'pre-execution', 'mcp', 'quarantine', 'risk'], category: 'Pages' },
  { label: 'Memory Firewall', path: '/layer3-memory', icon: Brain, keywords: ['memory', 'firewall', 'integrity', 'forensic', 'hash', 'baseline', 'poisoning'], category: 'Pages' },
  { label: 'Conversation Intelligence', path: '/layer4-conversation', icon: Activity, keywords: ['conversation', 'intelligence', 'drift', 'session', 'escalation', 'chat', 'transcript'], category: 'Pages' },
  { label: 'Honeypot Tarpit', path: '/layer5-honeypot', icon: Crosshair, keywords: ['honeypot', 'tarpit', 'decoy', 'trap', 'attacker', 'engagement'], category: 'Pages' },
  { label: 'Adversarial Response', path: '/layer6-adversarial', icon: Bug, keywords: ['adversarial', 'response', 'decoy', 'phi3'], category: 'Pages' },
  { label: 'Zero Trust Bridge', path: '/layer7-inter-agent', icon: Network, keywords: ['zero trust', 'inter-agent', 'agent', 'delegation', 'trust', 'verification'], category: 'Pages' },
  { label: 'Adaptive Rule Engine', path: '/layer8-adaptive', icon: RefreshCcw, keywords: ['adaptive', 'rule', 'engine', 'learning', 'model', 'precision', 'recall'], category: 'Pages' },
  { label: 'Observability', path: '/layer9-observability', icon: Layers, keywords: ['observability', 'owasp', 'telemetry', 'monitoring', 'indic', 'threat intel'], category: 'Pages' },
  { label: 'Settings', path: '/settings', icon: Shield, keywords: ['settings', 'theme', 'profile', 'appearance', 'dark', 'light'], category: 'Settings' },
];

interface SearchPaletteProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchPalette({ open, onClose }: SearchPaletteProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (open) {
      setQuery('');
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) onClose();
        else onClose(); // toggle handled from parent
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const filtered = query.trim()
    ? SEARCH_ITEMS.filter(item => {
      const q = query.toLowerCase();
      return (
        item.label.toLowerCase().includes(q) ||
        item.keywords.some(k => k.includes(q))
      );
    })
    : SEARCH_ITEMS;

  const grouped = filtered.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, SearchItem[]>);

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <Search className="size-5 text-slate-400" />
          <input
            type="text"
            autoFocus
            placeholder="Search pages, features, settings..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-500 border border-slate-200 dark:border-slate-600">
            ESC
          </kbd>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-300">
            <X className="size-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <div className="px-3 py-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {category}
              </div>
              {items.map(item => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleSelect(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${isActive
                      ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                      }`}
                  >
                    <item.icon className="size-4 shrink-0" />
                    <span className="font-medium">{item.label}</span>
                    {isActive && (
                      <span className="ml-auto text-[10px] bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 px-2 py-0.5 rounded-full font-semibold">Current</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-sm">
              No results for "{query}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-5 py-3 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] border border-slate-200 dark:border-slate-600">↑↓</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] border border-slate-200 dark:border-slate-600">↵</kbd>
            Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] border border-slate-200 dark:border-slate-600">Ctrl+K</kbd>
            Toggle
          </span>
        </div>
      </div>
    </div>
  );
}
