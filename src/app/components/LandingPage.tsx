import { Link } from 'react-router';
import { Shield, ArrowRight, CheckCircle, Layers, Zap, Lock, Globe, Database, Cpu, Activity, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const layers = [
    {
      number: 1,
      name: 'Ingestion Layer',
      feature: 'Language Guard',
      description: 'Zero-trust front door. Detects Hinglish, Tanglish & adversarial scripts.',
      gradient: 'from-cyan-500 to-teal-500',
      bg: 'bg-cyan-50 dark:bg-cyan-950/30',
      border: 'border-cyan-200 dark:border-cyan-800/40',
      hoverBorder: 'hover:border-cyan-400 dark:hover:border-cyan-500/60',
      text: 'text-cyan-600 dark:text-cyan-400',
      path: '/layer1-ingestion',
      icon: Globe
    },
    {
      number: 2,
      name: 'Pre-Execution',
      feature: 'Scanner',
      description: 'Deep-scans tools and RAG docs for hidden indirect injections.',
      gradient: 'from-blue-500 to-indigo-500',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-800/40',
      hoverBorder: 'hover:border-blue-400 dark:hover:border-blue-500/60',
      text: 'text-blue-600 dark:text-blue-400',
      path: '/layer2-pre-execution',
      icon: Layers
    },
    {
      number: 3,
      name: 'Memory Integrity',
      feature: 'Firewall',
      description: 'Ensures AI memory state remains unpoisoned across sessions.',
      gradient: 'from-violet-500 to-purple-500',
      bg: 'bg-violet-50 dark:bg-violet-950/30',
      border: 'border-violet-200 dark:border-violet-800/40',
      hoverBorder: 'hover:border-violet-400 dark:hover:border-violet-500/60',
      text: 'text-violet-600 dark:text-violet-400',
      path: '/layer3-memory',
      icon: Database
    },
    {
      number: 4,
      name: 'Drift Tracking',
      feature: 'Intelligence',
      description: 'Detects slow, multi-turn cognitive attacks and prompt drift.',
      gradient: 'from-pink-500 to-rose-500',
      bg: 'bg-pink-50 dark:bg-pink-950/30',
      border: 'border-pink-200 dark:border-pink-800/40',
      hoverBorder: 'hover:border-pink-400 dark:hover:border-pink-500/60',
      text: 'text-pink-600 dark:text-pink-400',
      path: '/layer4-conversation',
      icon: Activity
    },
    {
      number: 5,
      name: 'Output Layer',
      feature: 'Response Guard',
      description: 'Real-time PII redaction and system prompt leakage prevention.',
      gradient: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800/40',
      hoverBorder: 'hover:border-amber-400 dark:hover:border-amber-500/60',
      text: 'text-amber-600 dark:text-amber-400',
      path: '/layer5-output',
      icon: Lock
    },
    {
      number: 6,
      name: 'Adversarial Response',
      feature: 'Honeypot',
      description: 'Redirects identified attackers to decoy LLMs to waste resources.',
      gradient: 'from-red-500 to-rose-600',
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-800/40',
      hoverBorder: 'hover:border-red-400 dark:hover:border-red-500/60',
      text: 'text-red-600 dark:text-red-400',
      path: '/layer6-honeypot',
      icon: Zap
    },
  ];

  const stats = [
    { value: '100M+', label: 'Attacks Blocked' },
    { value: '<2ms', label: 'Latency Penalty' },
    { value: '9 Layers', label: 'Active Defense' },
    { value: '100%', label: 'Fail-Secure Rate' },
  ];

  return (
    <div className="relative min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      {/* Ambient background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-cyan-400/10 dark:bg-cyan-500/5 blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] rounded-full bg-blue-400/10 dark:bg-blue-500/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-violet-400/10 dark:bg-violet-500/5 blur-3xl" />
      </div>

      <div className="container mx-auto px-6 py-8 sm:py-12">
        {/* ───────── Navbar ───────── */}
        <nav className="flex items-center justify-between mb-16 sm:mb-24 relative z-50">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Shield className="size-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
              Agent<span className="text-cyan-500">Shield</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500 dark:text-slate-400">
            <a href="#layers" className="hover:text-cyan-500 transition-colors">Security Layers</a>
            <a href="#stats" className="hover:text-cyan-500 transition-colors">Platform</a>
            <a href="#" className="hover:text-cyan-500 transition-colors">Documentation</a>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" className="hidden sm:inline-flex rounded-full font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50">
                Sign In
              </Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-full font-bold shadow-lg shadow-cyan-500/20 px-6">
                Launch App
              </Button>
            </Link>
          </div>
        </nav>

        {/* ───────── Hero ───────── */}
        <div className="text-center max-w-4xl mx-auto mb-28">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge className="mb-6 px-4 py-1.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20 rounded-full font-bold uppercase tracking-wider text-[10px]">
              <Sparkles className="size-3 mr-1.5 inline" /> 9-Layer Active Defense
            </Badge>

            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-8">
              <span className="bg-gradient-to-b from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                Autonomous LLM
              </span>
              <br />
              <span className="text-cyan-500">Security Middleware</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 mb-12 leading-relaxed max-w-2xl mx-auto">
              A production-grade firewall that intercepts every message between users and LLMs.
              Detect prompt injections, jailbreaks, and memory poisoning with{' '}
              <span className="text-slate-900 dark:text-white font-semibold">zero-latency overhead</span>.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/auth">
                <Button size="lg" className="h-14 px-8 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full font-bold text-lg shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95">
                  Get Started Free
                  <ArrowRight className="ml-2 size-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-14 px-8 rounded-full font-bold text-lg border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50">
                Read Documentation
              </Button>
            </div>
          </motion.div>
        </div>

        {/* ───────── Security Layers ───────── */}
        <div id="layers" className="mb-32">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">Multi-Layer Defense Architecture</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">Each layer operates independently to provide defense-in-depth against evolving AI threats.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {layers.map((layer, idx) => {
              const Icon = layer.icon;
              return (
                <motion.div
                  key={layer.number}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                >
                  <Link to={layer.path} className="block group">
                    <div className={`h-full p-7 rounded-2xl border transition-all duration-300 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm ${layer.border} ${layer.hoverBorder} hover:shadow-lg dark:hover:shadow-none`}>
                      {/* Top row */}
                      <div className="flex justify-between items-start mb-5">
                        <div className={`p-3 rounded-xl ${layer.bg}`}>
                          <Icon className={`size-5 ${layer.text}`} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">Layer {layer.number}</span>
                      </div>

                      {/* Content */}
                      <h3 className="text-lg font-bold mb-1 text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors capitalize">
                        {layer.name}
                      </h3>
                      <p className={`text-sm font-semibold ${layer.text} mb-3`}>{layer.feature}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-5">
                        {layer.description}
                      </p>

                      {/* CTA */}
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-cyan-500 transition-colors">
                        Configure <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ───────── Stats ───────── */}
        <div id="stats" className="mb-32">
          <div className="p-[2px] rounded-3xl bg-gradient-to-r from-cyan-500/60 via-blue-500/60 to-violet-500/60">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-10 sm:p-14 rounded-[22px] bg-white dark:bg-slate-950">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-3xl sm:text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">{s.value}</div>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ───────── Trustedbar ───────── */}
        <div className="mb-32 flex flex-wrap justify-center items-center gap-x-10 gap-y-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600">
          <span className="flex items-center gap-2"><CheckCircle className="size-4 text-emerald-500" /> SOC 2 Compliant</span>
          <span className="flex items-center gap-2"><CheckCircle className="size-4 text-emerald-500" /> Zero-Trust Architecture</span>
          <span className="flex items-center gap-2"><CheckCircle className="size-4 text-emerald-500" /> AES-256 Encryption</span>
          <span className="flex items-center gap-2"><CheckCircle className="size-4 text-emerald-500" /> Real-time Monitoring</span>
        </div>

        {/* ───────── CTA ───────── */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-900/80 group mb-16">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent -translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
          <div className="px-8 py-20 text-center relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-6 text-slate-900 dark:text-white">Ready to secure your AI assets?</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto mb-10 text-lg">
              Deploy AgentShield in minutes. No complex configuration. No downtime.
            </p>
            <Link to="/auth">
              <Button size="lg" className="h-14 px-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-full font-bold text-lg transition-transform hover:scale-105 shadow-xl">
                Launch Security Dashboard
                <ArrowRight className="ml-2 size-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* ───────── Footer ───────── */}
        <footer className="border-t border-slate-200 dark:border-slate-800 pt-10 pb-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400 dark:text-slate-600">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-cyan-500" />
            <span className="font-bold text-slate-600 dark:text-slate-400">AgentShield</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6 text-xs font-semibold uppercase tracking-wider">
            <a href="#" className="hover:text-cyan-500 transition-colors">Privacy</a>
            <a href="#" className="hover:text-cyan-500 transition-colors">Terms</a>
            <a href="#" className="hover:text-cyan-500 transition-colors">Security</a>
          </div>
        </footer>
      </div>
    </div>
  );
}

