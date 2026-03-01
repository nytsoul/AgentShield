import { Link } from 'react-router';
import type { ComponentType } from 'react';
import {
  Shield,
  ArrowRight,
  CheckCircle,
  Layers,
  Zap,
  Lock,
  Globe,
  Database,
  Activity,
  Sparkles,
  ChevronRight,
  Eye,
  BarChart3,
  Network,
  FileSearch,
  ShieldCheck,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { motion } from 'framer-motion';

type LayerCard = {
  number: number;
  name: string;
  feature: string;
  description: string;
  gradient: string;
  bg: string;
  border: string;
  hoverBorder: string;
  text: string;
  path: string;
  icon: ComponentType<{ className?: string }>;
};

type FlowStep = {
  title: string;
  description: string;
  bullets: string[];
  icon: ComponentType<{ className?: string }>;
};

export default function LandingPage() {
  const layers: LayerCard[] = [
    {
      number: 1,
      name: 'Ingestion Layer',
      feature: 'Language Guard',
      description: 'Zero-trust front door. Detects Hinglish, Tanglish, homoglyphs, and adversarial scripts.',
      gradient: 'from-cyan-500 to-teal-500',
      bg: 'bg-cyan-50 dark:bg-cyan-950/30',
      border: 'border-cyan-200 dark:border-cyan-800/40',
      hoverBorder: 'hover:border-cyan-400 dark:hover:border-cyan-500/60',
      text: 'text-cyan-600 dark:text-cyan-400',
      path: '/layer1-ingestion',
      icon: Globe,
    },
    {
      number: 2,
      name: 'Pre-Execution',
      feature: 'Tool & RAG Scanner',
      description: 'Deep-scans MCP tools and RAG chunks for indirect prompt injections and scope drift.',
      gradient: 'from-blue-500 to-indigo-500',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-800/40',
      hoverBorder: 'hover:border-blue-400 dark:hover:border-blue-500/60',
      text: 'text-blue-600 dark:text-blue-400',
      path: '/layer2-pre-execution',
      icon: Layers,
    },
    {
      number: 3,
      name: 'Memory Integrity',
      feature: 'Poison Guard',
      description: 'Hashes and diffs every turn to block false recall, truncation, and injected tokens.',
      gradient: 'from-violet-500 to-purple-500',
      bg: 'bg-violet-50 dark:bg-violet-950/30',
      border: 'border-violet-200 dark:border-violet-800/40',
      hoverBorder: 'hover:border-violet-400 dark:hover:border-violet-500/60',
      text: 'text-violet-600 dark:text-violet-400',
      path: '/layer3-memory',
      icon: Database,
    },
    {
      number: 4,
      name: 'Drift Tracking',
      feature: 'Conversation Intelligence',
      description: 'Detects slow multi-turn drift, escalation probes, and risk velocity in live chats.',
      gradient: 'from-pink-500 to-rose-500',
      bg: 'bg-pink-50 dark:bg-pink-950/30',
      border: 'border-pink-200 dark:border-pink-800/40',
      hoverBorder: 'hover:border-pink-400 dark:hover:border-pink-500/60',
      text: 'text-pink-600 dark:text-pink-400',
      path: '/layer4-conversation',
      icon: Activity,
    },
    {
      number: 5,
      name: 'Output Layer',
      feature: 'Response Guard',
      description: 'Real-time PII scrubbing, system prompt leakage detection, and exfiltration blocks.',
      gradient: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800/40',
      hoverBorder: 'hover:border-amber-400 dark:hover:border-amber-500/60',
      text: 'text-amber-600 dark:text-amber-400',
      path: '/layer5-output',
      icon: Lock,
    },
    {
      number: 6,
      name: 'Adversarial Response',
      feature: 'Honeypot & Sinkhole',
      description: 'Traps confirmed attackers into decoy LLMs and wastes their probing budget.',
      gradient: 'from-red-500 to-rose-600',
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-800/40',
      hoverBorder: 'hover:border-red-400 dark:hover:border-red-500/60',
      text: 'text-red-600 dark:text-red-400',
      path: '/layer6-adversarial',
      icon: Zap,
    },
    {
      number: 7,
      name: 'Inter-Agent Trust',
      feature: 'Zero Trust Mesh',
      description: 'Prevents agent-to-agent privilege escalation, scope abuse, and data exfiltration.',
      gradient: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-200 dark:border-emerald-800/40',
      hoverBorder: 'hover:border-emerald-400 dark:hover:border-emerald-500/60',
      text: 'text-emerald-600 dark:text-emerald-400',
      path: '/layer7-inter-agent',
      icon: Network,
    },
    {
      number: 8,
      name: 'Adaptive Engine',
      feature: 'Self-Learning Rules',
      description: 'Promotes recurring attacks to blocklists automatically after 3+ sightings.',
      gradient: 'from-slate-800 to-slate-600',
      bg: 'bg-slate-900/5 dark:bg-slate-900/60',
      border: 'border-slate-300 dark:border-slate-800',
      hoverBorder: 'hover:border-slate-500 dark:hover:border-slate-600',
      text: 'text-slate-800 dark:text-slate-200',
      path: '/layer8-adaptive',
      icon: ShieldCheck,
    },
    {
      number: 9,
      name: 'Observability',
      feature: 'Live Telemetry',
      description: 'Real-time metrics: latency, threat mix, geolocation, and layer-level catch rates.',
      gradient: 'from-indigo-500 to-purple-600',
      bg: 'bg-indigo-50 dark:bg-indigo-950/30',
      border: 'border-indigo-200 dark:border-indigo-800/40',
      hoverBorder: 'hover:border-indigo-400 dark:hover:border-indigo-500/60',
      text: 'text-indigo-600 dark:text-indigo-400',
      path: '/layer9-observability',
      icon: BarChart3,
    },
  ];

  const stats = [
    { value: '15847', label: '24h Scans' },
    { value: '298', label: 'Threats Blocked (24h)' },
    { value: '0.023%', label: 'False Positive Rate' },
    { value: '8.4ms', label: 'Avg Latency' },
  ];

  const flow: FlowStep[] = [
    {
      title: 'Pre-input hardening',
      description: 'Normalize, detect homoglyphs, and gate risky text before it hits the model.',
      bullets: ['Role-aware thresholds', 'Mixed-script detection', 'Homoglyph normalization'],
      icon: Eye,
    },
    {
      title: 'Context & memory integrity',
      description: 'Hash every turn, diff context, and flag fabricated recall patterns.',
      bullets: ['Context hashing', 'False recall detection', 'Hash delta auditing'],
      icon: FileSearch,
    },
    {
      title: 'Semantic drift and escalation',
      description: 'Track topic shifts, escalation velocity, and social-engineering probes.',
      bullets: ['Drift velocity', 'Escalation markers', 'Trajectory mapping'],
      icon: Activity,
    },
    {
      title: 'Output and exfiltration control',
      description: 'Redact PII, detect prompt leaks, and stop CSV/JSON/base64 exfil.',
      bullets: ['PII scrubbing', 'Prompt leak guard', 'Exfil pattern block'],
      icon: Lock,
    },
    {
      title: 'Self-learning & observability',
      description: 'Auto-promote recurring attacks and surface real-time analytics.',
      bullets: ['Rule promotion at 3+ hits', 'Layer catch-rate telemetry', 'Geo + timeline view'],
      icon: BarChart3,
    },
  ];

  const endpoints = [
    { method: 'POST', path: '/firewall/analyze-input', detail: 'Layer 1 prompt injection scoring (role-aware thresholds).' },
    { method: 'POST', path: '/firewall/scan-tool', detail: 'Layer 2b tool manifest scanner (description, endpoint, scope).' },
    { method: 'POST', path: '/firewall/scan-rag', detail: 'Layer 2a RAG chunk scanner (instruction patterns, anomalies).' },
    { method: 'POST', path: '/firewall/check-memory', detail: 'Layer 3 memory integrity verifier (hash diff + poison patterns).' },
    { method: 'POST', path: '/firewall/analyze-conversation', detail: 'Layer 4 drift + escalation analyzer (velocity + markers).' },
    { method: 'POST', path: '/firewall/filter-output', detail: 'Layer 5 output firewall (PII, leakage, exfil).' },
    { method: 'POST', path: '/firewall/validate-agent', detail: 'Layer 7 inter-agent zero trust (scope + privilege checks).' },
    { method: 'POST', path: '/firewall/adaptive-status', detail: 'Layer 8 adaptive engine stats and promoted rules.' },
    { method: 'GET', path: '/firewall/observability', detail: 'Layer 9 telemetry dashboard (latency, geo, timeline).' },
  ];

  return (
    <div className="relative min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-colors scroll-smooth" style={{ scrollBehavior: 'smooth' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-[620px] h-[620px] rounded-full bg-cyan-400/10 dark:bg-cyan-500/5 blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-[520px] h-[520px] rounded-full bg-blue-400/10 dark:bg-blue-500/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[420px] h-[420px] rounded-full bg-violet-400/10 dark:bg-violet-500/5 blur-3xl" />
      </div>

      <div className="container mx-auto px-6 py-8 sm:py-12">
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
            <a href="#flow" className="hover:text-cyan-500 transition-colors">Scroll Overview</a>
            <a href="#endpoints" className="hover:text-cyan-500 transition-colors">Endpoints</a>
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

        <div className="text-center max-w-5xl mx-auto mb-24">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge className="mb-6 px-4 py-1.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20 rounded-full font-bold uppercase tracking-wider text-[10px]">
              <Sparkles className="size-3 mr-1.5 inline" /> 9-Layer Adaptive LLM Firewall
            </Badge>

            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-8 leading-[1.05]">
              <span className="bg-gradient-to-b from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">Production-grade AI Defense</span>
              <br />
              <span className="text-cyan-500">Built for zero-trust messaging</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 mb-12 leading-relaxed max-w-3xl mx-auto">
              Intercept every turn between users and LLMs. Score, isolate, and harden prompts, tools, memory, and outputs with no model retraining.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/auth">
                <Button size="lg" className="h-14 px-8 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full font-bold text-lg shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95">
                  Get Started Free
                  <ArrowRight className="ml-2 size-5" />
                </Button>
              </Link>
              <a href="#endpoints">
                <Button size="lg" variant="outline" className="h-14 px-8 rounded-full font-bold text-lg border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50">
                  Explore API Endpoints
                </Button>
              </a>
            </div>
          </motion.div>
        </div>

        <div id="layers" className="mb-28">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">Multi-layer defense architecture</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Independent, fail-secure layers combine to stop prompt injection, tool abuse, RAG poisoning, memory tampering, and exfiltration.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {layers.map((layer, idx) => {
              const Icon = layer.icon;
              return (
                <motion.div
                  key={layer.number}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                >
                  <Link to={layer.path} className="block group">
                    <div className={`h-full p-7 rounded-2xl border transition-all duration-300 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm ${layer.border} ${layer.hoverBorder} hover:shadow-lg dark:hover:shadow-none`}>
                      <div className="flex justify-between items-start mb-5">
                        <div className={`p-3 rounded-xl ${layer.bg}`}>
                          <Icon className={`size-5 ${layer.text}`} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">Layer {layer.number}</span>
                      </div>

                      <h3 className="text-lg font-bold mb-1 text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors capitalize">
                        {layer.name}
                      </h3>
                      <p className={`text-sm font-semibold ${layer.text} mb-3`}>{layer.feature}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-5">
                        {layer.description}
                      </p>

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

        <div id="flow" className="mb-28">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">Scroll the live inspection flow</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Follow a request as it moves through ingestion, memory integrity, semantic drift, output guard, and telemetry.</p>
          </div>

          <div className="space-y-6">
            {flow.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -24 : 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.05 }}
                  className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                      <Icon className="size-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Step {idx + 1}</span>
                        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Real-time</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{step.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{step.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {step.bullets.map((b) => (
                          <span key={b} className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200">
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div id="stats" className="mb-28">
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

        <div id="endpoints" className="mb-28">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">Public demo endpoints</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Hit the firewall directly—every endpoint returns status, risk score, and reason. No auth required for demo.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {endpoints.map((ep, idx) => (
              <motion.div
                key={ep.path}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.03 }}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm flex items-start gap-4"
              >
                <div className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-slate-900 text-white dark:bg-white dark:text-slate-900">{ep.method}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CodePill text={ep.path} />
                    <ChevronRight className="size-3 text-slate-400" />
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Layer demo</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-300 leading-relaxed">{ep.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mb-28 flex flex-wrap justify-center items-center gap-x-10 gap-y-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600">
          <span className="flex items-center gap-2"><CheckCircle className="size-4 text-emerald-500" /> SOC 2 Compliant</span>
          <span className="flex items-center gap-2"><CheckCircle className="size-4 text-emerald-500" /> Zero-Trust Architecture</span>
          <span className="flex items-center gap-2"><CheckCircle className="size-4 text-emerald-500" /> AES-256 Encryption</span>
          <span className="flex items-center gap-2"><CheckCircle className="size-4 text-emerald-500" /> Real-time Monitoring</span>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-900/80 group mb-16">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent -translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
          <div className="px-8 py-20 text-center relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-6 text-slate-900 dark:text-white">Ready to secure your AI assets?</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto mb-10 text-lg">
              Deploy AgentShield in minutes. Plug the /firewall endpoints into your gateway and ship safely.
            </p>
            <Link to="/auth">
              <Button size="lg" className="h-14 px-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-full font-bold text-lg transition-transform hover:scale-105 shadow-xl">
                Launch Security Dashboard
                <ArrowRight className="ml-2 size-5" />
              </Button>
            </Link>
          </div>
        </div>

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

function CodePill({ text }: { text: string }) {
  return (
    <span className="text-[11px] font-mono font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
      {text}
    </span>
  );
}

