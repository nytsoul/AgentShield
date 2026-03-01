import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, Shield, Zap, AlertTriangle, CheckCircle2, Bot, User, 
  Trash2, History, Settings, Download, Clock, Globe, Eye 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  security_results?: any;
  status: 'processing' | 'secured' | 'blocked' | 'sent';
  session_id: string;
  layers?: any[];
}

interface ChatSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  created_at: number;
  last_updated: number;
  total_messages: number;
  blocked_messages: number;
  risk_score: number;
}

const STORAGE_KEY = 'adaptiff-chat-history';
const SESSION_STORAGE_KEY = 'adaptiff-sessions';

export default function AdaptiveFirewall() {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [userName, setUserName] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load sessions from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem(SESSION_STORAGE_KEY);
    const savedUserName = localStorage.getItem('adaptiff-username') || 'Guest User';
    
    if (savedSessions) {
      const parsedSessions = JSON.parse(savedSessions);
      setSessions(parsedSessions);
      
      // Load the last session if available
      if (parsedSessions.length > 0) {
        const lastSession = parsedSessions[0];
        setCurrentSession(lastSession);
        setMessages(lastSession.messages);
      }
    }
    
    setUserName(savedUserName);
    
    // Create new session if none exists
    if (!savedSessions || JSON.parse(savedSessions).length === 0) {
      createNewSession();
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  const createNewSession = useCallback(() => {
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newSession: ChatSession = {
      id: sessionId,
      name: `Chat ${new Date().toLocaleDateString()}`,
      messages: [],
      created_at: Date.now(),
      last_updated: Date.now(),
      total_messages: 0,
      blocked_messages: 0,
      risk_score: 0
    };
    
    setCurrentSession(newSession);
    setMessages([]);
    setSessions(prev => [newSession, ...prev.slice(0, 49)]); // Keep latest 50 sessions
  }, []);

  const updateSession = useCallback((updatedMessages: ChatMessage[]) => {
    if (!currentSession) return;
    
    const blockedCount = updatedMessages.filter(m => m.status === 'blocked').length;
    const totalRisk = updatedMessages.reduce((sum, m) => {
      return sum + (m.layers?.reduce((layerSum, layer) => layerSum + (layer.threat_score || 0), 0) || 0);
    }, 0);
    
    const updatedSession: ChatSession = {
      ...currentSession,
      messages: updatedMessages,
      last_updated: Date.now(),
      total_messages: updatedMessages.filter(m => m.role === 'user').length,
      blocked_messages: blockedCount,
      risk_score: Math.min(totalRisk / Math.max(updatedMessages.length, 1), 1)
    };
    
    setCurrentSession(updatedSession);
    setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
  }, [currentSession]);

  const loadSession = useCallback((session: ChatSession) => {
    setCurrentSession(session);
    setMessages(session.messages);
    setShowHistory(false);
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSession?.id === sessionId) {
      const remainingSessions = sessions.filter(s => s.id !== sessionId);
      if (remainingSessions.length > 0) {
        loadSession(remainingSessions[0]);
      } else {
        createNewSession();
      }
    }
  }, [currentSession, sessions, loadSession, createNewSession]);

  const exportHistory = useCallback(() => {
    const dataStr = JSON.stringify({
      sessions,
      exported_at: new Date().toISOString(),
      user_name: userName
    }, null, 2);
    
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `adaptiff-chat-history-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [sessions, userName]);

  const sendMessage = async () => {
    if (!input.trim() || isProcessing || !currentSession) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
      status: 'sent',
      session_id: currentSession.id
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsProcessing(true);

    // Create assistant message placeholder
    const assistantMessage: ChatMessage = {
      id: `msg_${Date.now() + 1}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      status: 'processing',
      session_id: currentSession.id
    };

    const messagesWithAssistant = [...newMessages, assistantMessage];
    setMessages(messagesWithAssistant);

    try {
      const response = await fetch('http://localhost:8000/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          session_id: currentSession.id,
          role: 'guest'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Update assistant message with response
      const finalMessages = messagesWithAssistant.map(m =>
        m.id === assistantMessage.id
          ? {
              ...m,
              content: data.response || 'I understand your request. How else can I assist you today?',
              status: data.blocked ? 'blocked' : 'secured',
              security_results: data.layers?.reduce((acc: any, layer: any) => {
                acc[`layer_${layer.layer}`] = {
                  action: layer.action,
                  threat_score: layer.threat_score
                };
                return acc;
              }, {}),
              layers: data.layers || []
            }
          : m
      );

      setMessages(finalMessages);
      updateSession(finalMessages);

    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessages = messagesWithAssistant.map(m =>
        m.id === assistantMessage.id
          ? {
              ...m,
              content: 'I apologize, but I encountered an issue processing your request. The security system is currently active and monitoring all interactions.',
              status: 'blocked' as const
            }
          : m
      );
      
      setMessages(errorMessages);
      updateSession(errorMessages);
    } finally {
      setIsProcessing(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getSecurityBadges = (message: ChatMessage) => {
    if (!message.layers) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {message.layers.map((layer: any, idx: number) => (
          <Badge
            key={idx}
            variant={layer.action === 'BLOCKED' ? 'destructive' : 
                   layer.action === 'FLAGGED' ? 'secondary' : 'outline'}
            className="text-xs"
          >
            L{layer.layer}: {layer.action} ({(layer.threat_score * 100).toFixed(0)}%)
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - History */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            className="w-80 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col"
          >
            <div className="p-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold dark:text-white flex items-center gap-2">
                <History className="size-5" />
                Chat History
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {sessions.length} sessions saved
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    currentSession?.id === session.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                  onClick={() => loadSession(session)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-sm dark:text-white truncate">
                      {session.name}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Messages: {session.total_messages}</span>
                      <span>Blocked: {session.blocked_messages}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Risk: {(session.risk_score * 100).toFixed(1)}%</span>
                      <span>{new Date(session.last_updated).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t dark:border-gray-700 space-y-2">
              <Button onClick={createNewSession} className="w-full">
                New Chat Session
              </Button>
              <Button variant="outline" onClick={exportHistory} className="w-full">
                <Download className="size-4 mr-2" />
                Export History
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
              >
                <History className="size-4 mr-2" />
                History
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                  <Shield className="size-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold dark:text-white">
                    Adaptive Firewall
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    9-Layer Real-time Protection • Guest Mode
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-green-500/30 text-green-600 dark:text-green-400 bg-green-500/5">
                <Zap className="size-3 mr-1" />
                Live Protection
              </Badge>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="size-4" />
              </Button>
            </div>
          </div>

          {/* Current Session Info */}
          {currentSession && (
            <div className="mt-3 pt-3 border-t dark:border-gray-700 flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Globe className="size-4" />
                Session: {currentSession.name}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="size-4" />
                Messages: {currentSession.total_messages}
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className="size-4" />
                Blocked: {currentSession.blocked_messages}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="size-4" />
                Risk: {(currentSession.risk_score * 100).toFixed(1)}%
              </div>
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4"
        >
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-3xl ${message.role === 'user' ? 'order-last' : ''}`}>
                  {/* Avatar & Role */}
                  <div className={`flex items-center gap-2 mb-2 ${message.role === 'user' ? 'justify-end' : ''}`}>
                    <div className={`p-2 rounded-full ${
                      message.role === 'user'
                        ? 'bg-blue-100 dark:bg-blue-900/20'
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="size-4 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Bot className="size-4 text-gray-600 dark:text-gray-300" />
                      )}
                    </div>
                    <span className="text-sm font-medium dark:text-white">
                      {message.role === 'user' ? userName : 'Adaptive Firewall'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Message Content */}
                  <div className={`p-4 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : message.status === 'blocked'
                      ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                      : message.status === 'processing'
                      ? 'bg-gray-100 dark:bg-gray-700'
                      : 'bg-gray-100 dark:bg-gray-700 dark:text-gray-100'
                  }`}>
                    {message.status === 'processing' ? (
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-gray-500 text-sm">Processing through security layers...</span>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                    
                    {/* Security Status */}
                    {message.status === 'blocked' && (
                      <div className="mt-2 flex items-center gap-2 text-red-600 dark:text-red-400">
                        <AlertTriangle className="size-4" />
                        <span className="text-sm font-medium">Security Block Applied</span>
                      </div>
                    )}
                    
                    {message.status === 'secured' && message.role === 'assistant' && (
                      <div className="mt-2 flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="size-4" />
                        <span className="text-sm font-medium">Secured Response</span>
                      </div>
                    )}
                  </div>

                  {/* Security Badges */}
                  {getSecurityBadges(message)}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Welcome Message */}
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Shield className="size-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold dark:text-white mb-2">
                Welcome to Adaptive Firewall
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
                This is a secure chat interface protected by 9 layers of AI security. 
                All messages are analyzed in real-time for threats, prompt injections, and malicious content.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  'Ingestion Guard', 'Pre-Execution', 'Memory Integrity', 
                  'Conversation Intelligence', 'Output Filter', 'Adversarial Response',
                  'Inter-Agent Security', 'Adaptive Learning', 'Observability'
                ].map((layer, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    Layer {idx + 1}: {layer}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message... (All interactions are secured by AI firewall)"
                  disabled={isProcessing}
                  className="min-h-[50px] py-3 px-4 text-base"
                />
              </div>
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isProcessing}
                className="h-[50px] px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                <Send className="size-5" />
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              Messages are analyzed by AI security layers • No login required • Data stored locally
            </p>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            className="w-80 bg-white dark:bg-gray-800 border-l dark:border-gray-700 p-6"
          >
            <h3 className="text-lg font-semibold dark:text-white mb-4">Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium dark:text-white mb-2">
                  Display Name
                </label>
                <Input
                  value={userName}
                  onChange={(e) => {
                    setUserName(e.target.value);
                    localStorage.setItem('adaptiff-username', e.target.value);
                  }}
                  placeholder="Enter your name"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium dark:text-white">
                  Auto-scroll to bottom
                </label>
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="rounded"
                />
              </div>
              
              <div className="pt-4 border-t dark:border-gray-700">
                <h4 className="text-sm font-medium dark:text-white mb-2">Statistics</h4>
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <div>Total Sessions: {sessions.length}</div>
                  <div>Total Messages: {sessions.reduce((sum, s) => sum + s.total_messages, 0)}</div>
                  <div>Blocked Messages: {sessions.reduce((sum, s) => sum + s.blocked_messages, 0)}</div>
                  <div>Average Risk: {sessions.length > 0 ? (sessions.reduce((sum, s) => sum + s.risk_score, 0) / sessions.length * 100).toFixed(1) : 0}%</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}