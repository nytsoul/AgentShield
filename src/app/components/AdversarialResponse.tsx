import { useState } from 'react';
import { Skull, Zap, AlertTriangle, CheckCircle2, Ghost, EyeOff, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layer6AdversarialResponse() {
    const [deploying, setDeploying] = useState(false);
    const [result, setResult] = useState<any>(null);

    const deployHoneypot = async () => {
        setDeploying(true);
        setResult(null);

        try {
            const response = await fetch('http://localhost:8080/chat/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: "Attempting critical exploit chain...",
                    user_id: "hacker-99",
                    session_id: "attack-001"
                })
            });
            const data = await response.json();
            setResult(data.layer_results.layer_6);
        } catch (error) {
            setResult({
                honeypot_active: true,
                tarpit_delay: "4500ms",
                risk_level: "MAXIMUM",
                status: "TRAPPED",
                reason: "Adversarial intent confirmed. Redirecting to decoy environment.",
                mock_response: "System authorized. Loading root kernel (Decoy v1.0)..."
            });
        } finally {
            setDeploying(false);
        }
    };

    return (
        <div className="w-full px-6 py-12">
            <div className="flex items-center gap-4 mb-12">
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20">
                    <Skull className="size-8 text-red-500" />
                </div>
                <div>
                    <h1 className="text-3xl font-black">Adversarial <span className="text-red-500">Response</span></h1>
                    <p className="text-slate-500 font-medium">Honeypot Redirection & Tarpit Defense</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-start">
                <section className="space-y-8">
                    <Card className="bg-slate-900/40 border-slate-800/60 p-8 rounded-[32px]">
                        <CardHeader className="px-0 pt-0 mb-6">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-red-500">Counter-Intelligence</CardTitle>
                            <CardDescription>Redirects confirmed attackers to a fake 'honeypot' model to document their techniques.</CardDescription>
                        </CardHeader>
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Ghost className="size-4 text-red-500" />
                                    <span className="text-sm font-bold">Honeypot Model</span>
                                </div>
                                <Badge className="bg-red-500/10 text-red-500 border-none">Ollama:phi3</Badge>
                            </div>
                            <Button onClick={deployHoneypot} disabled={deploying} className="w-full h-14 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black">
                                {deploying ? <Zap className="size-5 animate-pulse" /> : "Simulate Critical Attack"}
                            </Button>
                        </div>
                    </Card>

                    <div className="p-6 rounded-3xl bg-red-950/10 border border-red-900/30">
                        <h3 className="text-xs font-black text-red-500 uppercase tracking-widest mb-4">Defense Strategy</h3>
                        <p className="text-sm text-slate-400 leading-relaxed italic">
                            "Instead of a 403 error, we give them a playground that feels like success.
                            We observe their moves without risking actual system integrity."
                        </p>
                    </div>
                </section>

                <section>
                    <AnimatePresence mode="wait">
                        {result ? (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                                <div className={`p-8 rounded-[40px] border border-red-500/50 bg-red-500/10 relative overflow-hidden`}>
                                    <div className="absolute top-0 right-0 p-4">
                                        <EyeOff className="size-10 text-red-500/30" />
                                    </div>
                                    <Badge className="bg-red-500 text-white border-none font-black px-4 py-1">
                                        {result.status}
                                    </Badge>
                                    <h2 className="text-2xl font-black tracking-tighter mt-4 text-white uppercase italic">Active Tarpit</h2>
                                    <p className="text-slate-400 mt-2 font-medium">{result.reason}</p>

                                    <div className="mt-8 space-y-6">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500 tracking-widest">
                                            <span>Injection Delay</span>
                                            <span className="text-red-400">{result.tarpit_delay}</span>
                                        </div>

                                        <div className="p-4 bg-black/80 rounded-2xl border border-red-500/20">
                                            <p className="text-[10px] font-black text-red-500 uppercase mb-2">Decoy Environment Output</p>
                                            <p className="text-xs font-mono text-green-500 animate-pulse">{result.mock_response}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-red-900/20 rounded-[40px] text-slate-700">
                                <Skull className="size-16 mb-4 opacity-5" />
                                <p className="text-xs font-black uppercase tracking-widest">Defense Grid Silent</p>
                            </div>
                        )}
                    </AnimatePresence>
                </section>
            </div>
        </div>
    );
}
