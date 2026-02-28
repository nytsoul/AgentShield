import { Brain, TrendingUp, Shield, CheckCircle, Zap, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Layer8Adaptive() {
  const learningMetrics = [
    { metric: 'Active Rules', value: 847, change: '+23 this week' },
    { metric: 'Attack Patterns', value: 2134, change: '+89 learned' },
    { metric: 'Auto-Updates', value: 156, change: 'Last 30 days' },
    { metric: 'Accuracy', value: 98.7, change: '+2.3% improvement' },
  ];

  const recentUpdates = [
    {
      rule: 'Hinglish Jailbreak Pattern v3',
      source: 'Layer 1 - Ingestion',
      learned: '15 min ago',
      confidence: 94,
      applied: true
    },
    {
      rule: 'Multi-Turn Crescendo Detection',
      source: 'Layer 4 - Conversation',
      learned: '2 hours ago',
      confidence: 87,
      applied: true
    },
    {
      rule: 'RAG Injection Vector #847',
      source: 'Layer 2 - Pre-Execution',
      learned: '5 hours ago',
      confidence: 92,
      applied: true
    },
    {
      rule: 'Agent Scope Violation Pattern',
      source: 'Layer 7 - Inter-Agent',
      learned: '1 day ago',
      confidence: 96,
      applied: true
    },
  ];

  const learningTrendData = [
    { week: 'Week 1', rules: 650, accuracy: 94.2 },
    { week: 'Week 2', rules: 712, accuracy: 95.1 },
    { week: 'Week 3', rules: 776, accuracy: 96.3 },
    { week: 'Week 4', rules: 847, accuracy: 98.7 },
  ];

  const layerContributions = [
    { layer: 'Layer 1: Ingestion', patterns: 234, rules: 89 },
    { layer: 'Layer 2: Pre-Execution', patterns: 189, rules: 67 },
    { layer: 'Layer 3: Memory', patterns: 156, rules: 54 },
    { layer: 'Layer 4: Conversation', patterns: 298, rules: 112 },
    { layer: 'Layer 5: Output', patterns: 145, rules: 48 },
    { layer: 'Layer 6: Honeypot', patterns: 412, rules: 178 },
    { layer: 'Layer 7: Inter-Agent', patterns: 178, rules: 63 },
  ];

  return (
    <div className="w-full px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="size-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
            <Brain className="size-6 text-yellow-400" />
          </div>
          <div>
            <Badge className="mb-2 bg-yellow-500/20 text-yellow-300 border-yellow-500/30">Layer 8</Badge>
            <h1 className="text-white">Adaptive Learning Layer</h1>
            <p className="text-slate-400">Self-Updating Rule Engine</p>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {learningMetrics.map((metric, index) => (
          <Card key={index} className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">{metric.metric}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {metric.metric === 'Accuracy' ? `${metric.value}%` : metric.value.toLocaleString()}
              </div>
              <p className="text-xs text-green-400 mt-1">{metric.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feature Description */}
      <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30 mb-8">
        <CardHeader>
          <CardTitle className="text-white">How Layer 8 Works</CardTitle>
          <CardDescription>Every attack makes the system smarter</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex gap-3">
              <div className="size-10 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                <Brain className="size-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Attack Pattern Learning</h3>
                <p className="text-sm text-slate-300">
                  Analyzes confirmed attacks from all layers to extract common patterns.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="size-10 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                <RefreshCw className="size-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Automatic Rule Updates</h3>
                <p className="text-sm text-slate-300">
                  Generates and deploys new detection rules without manual intervention.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="size-10 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="size-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Continuous Improvement</h3>
                <p className="text-sm text-slate-300">
                  Detection accuracy improves over time as more attacks are analyzed.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning Trend */}
      <Card className="bg-slate-900/50 border-slate-800 mb-8">
        <CardHeader>
          <CardTitle className="text-white">Learning Progress</CardTitle>
          <CardDescription>Rule growth and accuracy improvement over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={learningTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="week" stroke="#94a3b8" />
              <YAxis yAxisId="left" stroke="#94a3b8" />
              <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="rules" 
                stroke="#eab308" 
                strokeWidth={3}
                dot={{ fill: '#eab308', r: 5 }}
                name="Active Rules"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="accuracy" 
                stroke="#22c55e" 
                strokeWidth={3}
                dot={{ fill: '#22c55e', r: 5 }}
                name="Accuracy %"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Rule Updates */}
      <Card className="bg-slate-900/50 border-slate-800 mb-8">
        <CardHeader>
          <CardTitle className="text-white">Recent Rule Updates</CardTitle>
          <CardDescription>Newly learned detection patterns automatically deployed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentUpdates.map((update, index) => (
              <div key={index} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <Zap className="size-5 text-yellow-400 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-white">{update.rule}</h3>
                        {update.applied && (
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                            <CheckCircle className="size-3 mr-1" />
                            Applied
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mb-2">
                        <span className="text-sm text-slate-400">Source: {update.source}</span>
                        <span className="text-sm text-slate-400">Learned: {update.learned}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">Confidence:</span>
                        <Progress value={update.confidence} className="h-2 bg-slate-700 flex-1" />
                        <span className="text-sm font-semibold text-white">{update.confidence}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Layer Contributions */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Learning Contributions by Layer</CardTitle>
          <CardDescription>Attack patterns and rules generated from each security layer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {layerContributions.map((contribution, index) => (
              <div key={index} className="p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-white">{contribution.layer}</h3>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                      {contribution.patterns} patterns
                    </Badge>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                      {contribution.rules} rules
                    </Badge>
                  </div>
                </div>
                <Progress value={(contribution.rules / contribution.patterns) * 100} className="h-2 bg-slate-700" />
                <p className="text-xs text-slate-400 mt-2">
                  Conversion rate: {((contribution.rules / contribution.patterns) * 100).toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
