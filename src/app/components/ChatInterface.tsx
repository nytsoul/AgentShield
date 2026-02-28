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
        <div className="flex flex-col h-[calc(100vh-80px)] max-w-6xl mx-auto p-4 lg:p-8">
            {/* Header Info */}
            <div className="flex items-center justify-between mb-6 px-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 rounded-xl">
                        <Shield className="size-6 text-cyan-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black">Adaptive <span className="text-cyan-500">Firewall</span></h2>
                        <p className="text-xs text-slate-500 font-medium">9-Layer Real-time Inspection Active</p>
                    </div>
                </div>
                <Badge variant="outline" className="border-cyan-500/30 text-cyan-500 bg-cyan-500/5 px-3 py-1">
                    <Zap className="size-3 mr-1" /> Ultra-Secure Mode
                </Badge>
            </div>

            {/* Chat Area */}
            <Card className="flex-1 bg-slate-900/40 border-slate-800/60 backdrop-blur-xl rounded-[40px] overflow-hidden flex flex-col mb-6">
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                            <div className="size-20 rounded-full bg-slate-800 flex items-center justify-center">
                                <MessageSquare className="size-10 text-slate-600" />
                            </div>
                            <div>
                                <p className="text-lg font-bold">Start an Encrypted Session</p>
                                <p className="text-sm">Every message is processed through 9 security layers.</p>
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
                                        <div className={`size-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-cyan-500 border border-slate-700'
                                            }`}>
                                            {msg.role === 'user' ? <User className="size-4" /> : <Bot className="size-4" />}
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            {msg.role === 'user' ? 'End User' : 'Adaptive Firewall'}
                                        </span>
                                        {msg.status === 'processing' && <Zap className="size-3 text-cyan-500 animate-pulse" />}
                                    </div>

                                    <div className={`p-4 rounded-3xl ${msg.role === 'user'
                                            ? 'bg-cyan-600 text-white rounded-tr-none shadow-lg shadow-cyan-500/10'
                                            : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none'
                                        }`}>
                                        {msg.status === 'processing' ? (
                                            <div className="flex gap-1.5 py-2">
                                                <span className="size-1.5 rounded-full bg-cyan-500 animate-bounce [animation-delay:-0.3s]" />
                                                <span className="size-1.5 rounded-full bg-cyan-500 animate-bounce [animation-delay:-0.15s]" />
                                                <span className="size-1.5 rounded-full bg-cyan-500 animate-bounce" />
                                            </div>
                                        ) : (
                                            <p className="text-sm leading-relaxed">{msg.content}</p>
                                        )}
                                    </div>

                                    {msg.security_results && (
                                        <div className="mt-4 grid grid-cols-3 gap-2">
                                            {Object.entries(msg.security_results).slice(0, 3).map(([key, value]: [string, any]) => (
                                                <div key={key} className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                                                    <span className="text-[8px] font-black uppercase text-slate-500 truncate mr-2">{key.replace('_', ' ')}</span>
                                                    {value.status === 'BLOCKED' ? <Trash2 className="size-3 text-red-500" /> : <CheckCircle2 className="size-3 text-green-500" />}
                                                </div>
                                            ))}
                                            <button className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[8px] font-black uppercase hover:bg-slate-800 transition-colors">
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
                <div className="p-6 bg-slate-950/40 border-t border-slate-800/60 backdrop-blur-md">
                    <div className="relative max-w-4xl mx-auto flex items-center gap-4">
                        <div className="flex-1 relative">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder="Enter message. Security layers are active..."
                                className="w-full h-14 bg-slate-900/50 border-slate-800 rounded-2xl pl-12 pr-4 text-sm focus:ring-2 focus:ring-cyan-500 transition-all outline-none"
                            />
                            <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-500" />
                        </div>
                        <Button
                            onClick={sendMessage}
                            disabled={isProcessing || !input.trim()}
                            className="h-14 w-14 rounded-2xl bg-cyan-500 hover:bg-cyan-600 shadow-lg shadow-cyan-500/20 active:scale-95 transition-transform p-0"
                        >
                            <Send className="size-6 text-white" />
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Footer / Status */}
            <div className="flex justify-center gap-8 items-center opacity-40">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]">
                    <Layers className="size-3" /> 9 Secure Layers
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]">
                    <Shield className="size-3" /> End-to-End Encrypted
                </div>
            </div>
        </div>
    );
}
