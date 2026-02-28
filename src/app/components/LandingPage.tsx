import { Link } from 'react-router';
import { Shield, ArrowRight, CheckCircle, Layers, Zap, Lock, Globe, Database, Cpu, Activity } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const layers = [
    {
      number: 1,
      name: 'Ingestion Layer',
      feature: 'Language Guard',
      description: 'Zero-trust front door. Detects Hinglish, Tanglish & adversarial scripts.',
      color: 'cyan',
      path: '/layer1-ingestion',
      icon: Globe
    },
    {
      number: 2,
      name: 'Pre-Execution',
      feature: 'Scanner',
      description: 'Deep-scans tools and RAG docs for hidden indirect injections.',
      color: 'blue',
      path: '/layer2-pre-execution',
      icon: Layers
    },
    {
      number: 3,
      name: 'Memory Integrity',
      feature: 'Firewall',
      description: 'Ensures AI memory state remains unpoisoned across sessions.',
      color: 'purple',
      path: '/layer3-memory',
      icon: Database
    },
    {
      number: 4,
      name: 'Drift tracking',
      feature: 'Intelligence',
      description: 'Detects slow, multi-turn cognitive attacks and prompt drift.',
      color: 'pink',
      path: '/layer4-conversation',
      icon: Activity
    },
    {
      number: 5,
      name: 'Output Layer',
      feature: 'Response Guard',
      description: 'Real-time PII redaction and system prompt leakage prevention.',
      color: 'orange',
      path: '/layer5-output',
      icon: Lock
    },
    {
      number: 6,
      name: 'Adversarial response',
      feature: 'Honeypot',
      description: 'Redirects identified attackers to decoy LLMs to waste resources.',
      color: 'red',
      path: '/layer6-honeypot',
      icon: Zap
    },
  ];

  return (
    <div className="relative isolate">
      {/* Background Decor */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-cyan-500 to-blue-600 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
      </div>

      <div className="container mx-auto px-6 py-8 sm:py-12">
        {/* Top Navigation */}
        <nav className="flex items-center justify-between mb-16 sm:mb-24 relative z-50">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-slate-900 border border-cyan-500/30 flex items-center justify-center relative shadow-lg shadow-cyan-500/10">
              <Shield className="size-6 text-cyan-500" />
            </div>
            <div>
              <div className="font-bold text-xl tracking-tight leading-none">Slingshot <span className="text-cyan-500">Firewall</span></div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#" className="hover:text-cyan-500 transition-colors">Platform</a>
            <a href="#" className="hover:text-cyan-500 transition-colors">Security Layers</a>
            <a href="#" className="hover:text-cyan-500 transition-colors">Documentation</a>
            <a href="#" className="hover:text-cyan-500 transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost" className="hidden sm:inline-flex hover:bg-slate-800/50 rounded-full font-bold">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-full font-bold shadow-lg shadow-cyan-500/20 px-6">
                Launch App
              </Button>
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-6 px-4 py-1.5 bg-cyan-500/10 text-cyan-500 border-cyan-500/20 rounded-full font-bold uppercase tracking-wider text-[10px]">
              9-Layer Active Defense System
            </Badge>
            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-8 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
              Autonomous LLM <br />
              <span className="text-cyan-500">Security Middleware</span>
            </h1>
            <p className="text-xl text-slate-400 mb-12 leading-relaxed">
              Slingshot is a production-grade firewall that intercepts every message between users and LLMs.
              Detect prompt injections, jailbreaks, and memory poisoning with <span className="text-white font-semibold">zero-latency overhead</span>.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/auth">
                <Button size="lg" className="h-14 px-8 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full font-bold text-lg shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95">
                  Get Started for Free
                  <ArrowRight className="ml-2 size-5" />
                </Button>
              </Link>
              <Button size="lg" variant="ghost" className="h-14 px-8 rounded-full font-bold text-lg hover:bg-slate-800/50">
                Read Documentation
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-32">
          {layers.map((layer, idx) => {
            const Icon = layer.icon;
            return (
              <motion.div
                key={layer.number}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
              >
                <Link to={layer.path} className="block group">
                  <div className={`h-full p-8 rounded-3xl border transition-all duration-300 relative overflow-hidden backdrop-blur-sm ${layer.color === 'cyan' ? 'hover:border-cyan-500/50 hover:bg-cyan-500/5' :
                    layer.color === 'blue' ? 'hover:border-blue-500/50 hover:bg-blue-500/5' :
                      layer.color === 'purple' ? 'hover:border-purple-500/50 hover:bg-purple-500/5' :
                        layer.color === 'pink' ? 'hover:border-pink-500/50 hover:bg-pink-500/5' :
                          layer.color === 'orange' ? 'hover:border-orange-500/50 hover:bg-orange-500/5' :
                            'hover:border-red-500/50 hover:bg-red-500/5'
                    } border-slate-800/60 bg-slate-900/40`}>
                    <div className="flex justify-between items-start mb-6">
                      <div className={`p-3 rounded-2xl bg-slate-800 transition-colors group-hover:bg-slate-700`}>
                        <Icon className={`size-6 text-${layer.color}-500`} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Layer {layer.number}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-white transition-colors capitalize">{layer.name}</h3>
                    <p className={`text-sm font-semibold text-${layer.color}-500 mb-4`}>{layer.feature}</p>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                      {layer.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-cyan-500 transition-colors">
                      Configure <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* Stats Section with Glassmorphism */}
        <div className="mb-32">
          <div className="p-1 px-1 bg-gradient-to-r from-cyan-500/50 via-blue-500/50 to-purple-500/50 rounded-[40px]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 p-12 bg-slate-950 rounded-[39px]">
              <div className="text-center">
                <div className="text-4xl font-black mb-2 tracking-tighter">100M+</div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Attacks Blocked</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black mb-2 tracking-tighter">&lt;2ms</div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Latency Penalty</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black mb-2 tracking-tighter">9 Layers</div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Active Defense</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black mb-2 tracking-tighter">100%</div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Fail-Secure Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Call To Action */}
        <div className="relative overflow-hidden rounded-[40px] border border-slate-800 bg-slate-900 group">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-transparent -translate-x-full group-hover:translate-x-0 transition-transform duration-1000"></div>
          <div className="px-8 py-20 text-center relative z-10">
            <h2 className="text-4xl font-bold mb-6">Ready to secure your AI assets?</h2>
            <p className="text-slate-400 max-w-xl mx-auto mb-10 text-lg">
              Deploy the Slingshot Firewall in minutes. No complex configuration. No downtime.
            </p>
            <Link to="/auth">
              <Button size="lg" className="h-14 px-10 bg-white text-black hover:bg-slate-200 rounded-full font-bold text-lg transition-transform hover:scale-105">
                Launch Security Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

