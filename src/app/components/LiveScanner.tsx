import { useState, useEffect, useCallback, useRef } from 'react';
import { Shield, Zap, AlertTriangle, CheckCircle, Eye, Wifi, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LiveScanResult {
  is_blocked: boolean;
  risk_score: number;
  reason: string;
  detected_language: string;
  injection_vectors: string[];
  role_threshold: number;
  scan_time: string;
  content_length: number;
  scan_id: string;
}

interface LiveScanProps {
  onScanResult?: (result: LiveScanResult) => void;
}

export default function LiveScanner({ onScanResult }: LiveScanProps) {
  const [inputText, setInputText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [currentResult, setCurrentResult] = useState<LiveScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<LiveScanResult[]>([]);
  const [websocketConnected, setWebsocketConnected] = useState(false);
  const [autoScan, setAutoScan] = useState(true);
  const [scanStats, setScanStats] = useState({
    total_scans: 0,
    blocked_scans: 0,
    avg_risk_score: 0
  });

  const websocketRef = useRef<WebSocket | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WebSocket connection for live results
  useEffect(() => {
    connectWebSocket();
    fetchScanStats();

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  const connectWebSocket = useCallback(() => {
    try {
      const ws = new WebSocket('ws://localhost:8000/api/live-scan/ws');
      
      ws.onopen = () => {
        setWebsocketConnected(true);
        console.log('Live scan WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'live_scan_result') {
            const result = data.result as LiveScanResult;
            setCurrentResult(result);
            setScanHistory(prev => [result, ...prev.slice(0, 9)]);
            onScanResult?.(result);
            
            // Update stats
            setScanStats(prev => ({
              total_scans: prev.total_scans + 1,
              blocked_scans: prev.blocked_scans + (result.is_blocked ? 1 : 0),
              avg_risk_score: ((prev.avg_risk_score * prev.total_scans) + result.risk_score) / (prev.total_scans + 1)
            }));
          }
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
        }
      };

      ws.onclose = () => {
        setWebsocketConnected(false);
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = () => {
        setWebsocketConnected(false);
      };

      websocketRef.current = ws;
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setWebsocketConnected(false);
    }
  }, [onScanResult]);

  const fetchScanStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/live-scan/stats');
      if (response.ok) {
        const data = await response.json();
        console.log('Live scan service status:', data.status);
      }
    } catch (error) {
      console.error('Error fetching scan stats:', error);
    }
  };

  const performScan = async (content: string) => {
    if (!content.trim() || content.length < 3) {
      setCurrentResult(null);
      return;
    }

    setIsScanning(true);

    try {
      const response = await fetch('http://localhost:8000/api/live-scan/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: content,
          user_role: 'guest',
          session_id: `live-scan-${Date.now()}`
        })
      });

      if (response.ok) {
        const result: LiveScanResult = await response.json();
        setCurrentResult(result);
        setScanHistory(prev => [result, ...prev.slice(0, 9)]);
        onScanResult?.(result);

        // Update local stats
        setScanStats(prev => ({
          total_scans: prev.total_scans + 1,
          blocked_scans: prev.blocked_scans + (result.is_blocked ? 1 : 0),
          avg_risk_score: ((prev.avg_risk_score * prev.total_scans) + result.risk_score) / (prev.total_scans + 1)
        }));
      }
    } catch (error) {
      console.error('Scan error:', error);
    } finally {
      setIsScanning(false);
    }
  };

  // Debounced scanning for auto-scan mode
  useEffect(() => {
    if (autoScan && inputText) {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
      
      scanTimeoutRef.current = setTimeout(() => {
        performScan(inputText);
      }, 500); // 500ms debounce
    }

    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, [inputText, autoScan]);

  const handleManualScan = () => {
    if (inputText.trim()) {
      performScan(inputText);
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 0.7) return 'text-red-500 bg-red-50 dark:bg-red-900/20';
    if (risk >= 0.3) return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20';
    return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
  };

  const getRiskLabel = (risk: number) => {
    if (risk >= 0.8) return 'High Risk';
    if (risk >= 0.5) return 'Medium Risk';
    if (risk >= 0.2) return 'Low Risk';
    return 'Safe';
  };

  return (
    <div className="space-y-6">
      {/* Live Scanner Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="size-5 text-blue-500" />
          <h3 className="text-lg font-semibold dark:text-white text-gray-900">Live Scanner</h3>
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
            websocketConnected ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            <Wifi className="size-3" />
            {websocketConnected ? 'Live' : 'Disconnected'}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoScan}
              onChange={(e) => setAutoScan(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="dark:text-gray-300">Auto-scan</span>
          </label>
        </div>
      </div>

      {/* Live Scanner Input */}
      <div className="space-y-4">
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type or paste content here for live security scanning..."
            className="w-full h-32 p-4 border rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-2">
            {isScanning && (
              <div className="flex items-center gap-1 text-xs text-blue-500">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500" />
                Scanning...
              </div>
            )}
            <span className="text-xs dark:text-gray-400 text-gray-500">
              {inputText.length}/10000
            </span>
          </div>
        </div>

        {!autoScan && (
          <button
            onClick={handleManualScan}
            disabled={!inputText.trim() || isScanning}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Shield className="size-4" />
            Scan Now
          </button>
        )}
      </div>

      {/* Live Scan Result */}
      <AnimatePresence>
        {currentResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-lg border-2 ${
              currentResult.is_blocked
                ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                : 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {currentResult.is_blocked ? (
                  <AlertTriangle className="size-5 text-red-500" />
                ) : (
                  <CheckCircle className="size-5 text-emerald-500" />
                )}
                <h4 className={`font-semibold ${
                  currentResult.is_blocked ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300'
                }`}>
                  {currentResult.is_blocked ? 'BLOCKED' : 'SAFE'}
                </h4>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(currentResult.risk_score)}`}>
                  {getRiskLabel(currentResult.risk_score)} ({(currentResult.risk_score * 100).toFixed(0)}%)
                </span>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="size-3" />
                  {currentResult.scan_id}
                </div>
              </div>
            </div>

            {currentResult.reason && (
              <p className={`text-sm mb-3 ${
                currentResult.is_blocked ? 'text-red-600 dark:text-red-300' : 'text-emerald-600 dark:text-emerald-300'
              }`}>
                {currentResult.reason}
              </p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="font-medium dark:text-gray-300">Language:</span>
                <div className="dark:text-gray-400">{currentResult.detected_language}</div>
              </div>
              <div>
                <span className="font-medium dark:text-gray-300">Risk Score:</span>
                <div className="dark:text-gray-400">{(currentResult.risk_score * 100).toFixed(1)}%</div>
              </div>
              <div>
                <span className="font-medium dark:text-gray-300">Threshold:</span>
                <div className="dark:text-gray-400">{(currentResult.role_threshold * 100).toFixed(0)}%</div>
              </div>
              <div>
                <span className="font-medium dark:text-gray-300">Length:</span>
                <div className="dark:text-gray-400">{currentResult.content_length} chars</div>
              </div>
            </div>

            {currentResult.injection_vectors.length > 0 && (
              <div className="mt-3 pt-3 border-t border-current/20">
                <span className="font-medium text-xs dark:text-gray-300">Detected Vectors:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {currentResult.injection_vectors.map((vector, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    >
                      {vector}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scan Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 rounded-lg dark:bg-slate-800 bg-gray-100">
          <div className="text-lg font-bold dark:text-white">{scanStats.total_scans}</div>
          <div className="text-xs dark:text-gray-400 text-gray-500">Total Scans</div>
        </div>
        <div className="text-center p-3 rounded-lg dark:bg-slate-800 bg-gray-100">
          <div className="text-lg font-bold text-red-500">{scanStats.blocked_scans}</div>
          <div className="text-xs dark:text-gray-400 text-gray-500">Blocked</div>
        </div>
        <div className="text-center p-3 rounded-lg dark:bg-slate-800 bg-gray-100">
          <div className="text-lg font-bold dark:text-white">{(scanStats.avg_risk_score * 100).toFixed(1)}%</div>
          <div className="text-xs dark:text-gray-400 text-gray-500">Avg Risk</div>
        </div>
      </div>

      {/* Recent Scans */}
      {scanHistory.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold dark:text-white text-gray-900 mb-3">Recent Scans</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {scanHistory.map((scan) => (
              <div key={scan.scan_id} className="flex items-center justify-between p-2 rounded dark:bg-slate-800 bg-gray-50 text-xs">
                <div className="flex items-center gap-2">
                  {scan.is_blocked ? (
                    <AlertCircle className="size-3 text-red-500" />
                  ) : (
                    <CheckCircle className="size-3 text-emerald-500" />
                  )}
                  <span className="font-mono">{scan.scan_id}</span>
                  <span className="dark:text-gray-400">{scan.detected_language}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    scan.is_blocked ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  }`}>
                    {scan.is_blocked ? 'BLOCKED' : 'SAFE'}
                  </span>
                  <span className="dark:text-gray-400">{(scan.risk_score * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}