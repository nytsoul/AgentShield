import { useState, useRef, useEffect } from 'react';
import { Send, Shield, Zap, AlertTriangle, CheckCircle2, Bot, User, Trash2, ArrowRight, Layers, MessageSquare, Terminal } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    security_results?: any;
    status: 'processing' | 'secured' | 'blocked' | 'sent';
}

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || isProcessing) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            status: 'sent'
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsProcessing(true);

        // Placeholder for "processing" state in assistant response
        const assistantMsgId = (Date.now() + 1).toString();
        const assistantMsg: Message = {
            id: assistantMsgId,
            role: 'assistant',
            content: '',
            status: 'processing'
        };
        setMessages(prev => [...prev, assistantMsg]);

        try {
            const response = await fetch('http://localhost:8080/chat/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: input,
                    user_id: "demo-user",
                    session_id: "chat-session-xyz"
                })
            });

            const data = await response.json();

            setMessages(prev => prev.map(m =>
                m.id === assistantMsgId
                    ? {
                        ...m,
                        content: data.response,
                        status: data.status === 'BLOCKED' ? 'blocked' : 'secured',
                        security_results: data.layer_results
                    }
                    : m
            ));
        } catch (error) {
            setMessages(prev => prev.map(m =>
                m.id === assistantMsgId
                    ? {
                        ...m,
                        content: "Security system error. Connection to backend failed.",
                        status: 'blocked'
                    }
                    : m
            ));
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] max-w-7xl mx-auto p-6 lg:p-10">
            {/* Header Info */}
            <div className="flex items-center justify-between mb-8 px-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 rounded-xl">
                        <Shield className="size-6 text-cyan-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Adaptive <span className="text-cyan-500">Firewall</span></h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">9-Layer Real-time Inspection Active</p>
                    </div>
                </div>
                <Badge variant="outline" className="border-cyan-500/30 text-cyan-600 dark:text-cyan-500 bg-cyan-500/5 px-3 py-1">
                    <Zap className="size-3 mr-1" /> Ultra-Secure Mode
                </Badge>
            </div>

            {/* Chat Area */}
            <Card className="flex-1 bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/60 backdrop-blur-xl rounded-[40px] overflow-hidden flex flex-col mb-8 shadow-lg">
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                            <div className="size-24 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                                <MessageSquare className="size-12 text-slate-400 dark:text-slate-600" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">Start an Encrypted Session</p>
                                <p className="text-base text-slate-600 dark:text-slate-400">Every message is processed through 9 security layers.</p>
                            </div>
                        </div>
                    )}

                    <AnimatePresence>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[85%] group ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`flex items-center gap-3 mb-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`size-10 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-cyan-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-cyan-500 border border-slate-300 dark:border-slate-700'
                                            }`}>
                                            {msg.role === 'user' ? <User className="size-5" /> : <Bot className="size-5" />}
                                        </div>
                                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                            {msg.role === 'user' ? 'End User' : 'Adaptive Firewall'}
                                        </span>
                                        {msg.status === 'processing' && <Zap className="size-3 text-cyan-500 animate-pulse" />}
                                    </div>

                                    <div className={`p-5 rounded-3xl ${msg.role === 'user'
                                            ? 'bg-cyan-600 text-white rounded-tr-none shadow-lg shadow-cyan-500/10'
                                            : 'bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 rounded-tl-none'
                                        }`}>
                                        {msg.status === 'processing' ? (
                                            <div className="flex gap-1.5 py-2">
                                                <span className="size-1.5 rounded-full bg-cyan-500 animate-bounce [animation-delay:-0.3s]" />
                                                <span className="size-1.5 rounded-full bg-cyan-500 animate-bounce [animation-delay:-0.15s]" />
                                                <span className="size-1.5 rounded-full bg-cyan-500 animate-bounce" />
                                            </div>
                                        ) : (
                                            <p className="text-base leading-relaxed">{msg.content}</p>
                                        )}
                                    </div>

                                    {msg.security_results && (
                                        <div className="mt-4 grid grid-cols-3 gap-2">
                                            {Object.entries(msg.security_results).slice(0, 3).map(([key, value]: [string, any]) => (
                                                <div key={key} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                                    <span className="text-[8px] font-black uppercase text-slate-500 dark:text-slate-400 truncate mr-2">{key.replace('_', ' ')}</span>
                                                    {value.status === 'BLOCKED' ? <Trash2 className="size-3 text-red-500" /> : <CheckCircle2 className="size-3 text-green-500" />}
                                                </div>
                                            ))}
                                            <button className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[8px] font-black uppercase hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400">
                                                View All 9 Layers
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Input Area */}
                <div className="p-6 bg-slate-50/80 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800/60 backdrop-blur-md">
                    <div className="relative max-w-5xl mx-auto flex items-center gap-4">
                        <div className="flex-1 relative">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder="Enter message. Security layers are active..."
                                className="w-full h-16 bg-white dark:bg-slate-900/50 border-slate-300 dark:border-slate-800 rounded-2xl pl-14 pr-4 text-base focus:ring-2 focus:ring-cyan-500 transition-all outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600"
                            />
                            <Terminal className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-slate-400 dark:text-slate-500" />
                        </div>
                        <Button
                            onClick={sendMessage}
                            disabled={isProcessing || !input.trim()}
                            className="h-16 w-16 rounded-2xl bg-cyan-500 hover:bg-cyan-600 shadow-lg shadow-cyan-500/20 active:scale-95 transition-transform p-0"
                        >
                            <Send className="size-7 text-white" />
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Footer / Status */}
            <div className="border-t border-slate-200 dark:border-slate-700/50 pt-6 pb-2 flex items-center justify-between text-[10px] font-semibold tracking-wider text-slate-400 dark:text-slate-600 uppercase">
                <div className="flex items-center gap-6">
                    <span className="flex items-center gap-1.5"><Shield className="size-3 text-cyan-500" /> Adaptive Firewall Active</span>
                    <span className="flex items-center gap-1.5"><Layers className="size-3 text-cyan-500" /> 9 Security Layers</span>
                </div>
                <div className="flex items-center gap-6">
                    <span className="flex items-center gap-1.5">Status: <span className="text-emerald-500">Protected</span></span>
                    <span className="flex items-center gap-1.5">Encryption: AES-256-GCM</span>
                </div>
            </div>
        </div>
    );
}
