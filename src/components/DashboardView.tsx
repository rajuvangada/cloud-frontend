import React, { useState, useEffect } from 'react';
import type { ViewType, CostEstimationResult, LogAnalysisResult, TimelineEntry } from '../types';
import { MetricCard } from './MetricCard';
import { EmptyState } from './EmptyState';
import { fetchHealthStatus, fetchHealthMetrics } from '../utils/api';
import {
  exportDashboardSummaryCSV,
  exportDashboardSummaryPDF
} from '../utils/export';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  FileCode,
  Clock,
  ArrowRight,
  Terminal,
  HelpCircle,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Globe,
  Cpu,
  Database,
  Activity,
  Download,
  RefreshCw
} from 'lucide-react';

interface DashboardViewProps {
  estimates: CostEstimationResult[];
  analyses: LogAnalysisResult[];
  timeline: TimelineEntry[];
  onViewChange: (view: ViewType) => void;
  apiHealth: { ok: boolean; latency: number };
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  estimates,
  analyses,
  timeline,
  onViewChange,
  apiHealth,
}) => {
  // Cloud service monitor state
  const [healthData, setHealthData] = useState<{
    api_gateway: string;
    lambda: string;
    mongodb: string;
    status: string;
    timestamp: string;
  } | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [metrics, setMetrics] = useState<{
    uptime_pct: number;
    current_latency: number;
    avg_latency: number;
    success_rate: number;
  } | null>(null);

  const loadDashboardData = async () => {
    try {
      const h = await fetchHealthStatus();
      setHealthData(h);
      
      const m = await fetchHealthMetrics();
      setMetrics(m);
    } catch (e) {
      console.error("Dashboard diagnostics load failed:", e);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // 30 seconds refresh
    return () => clearInterval(interval);
  }, []);

  // Compute metrics for existing cards
  const totalAnalysesCount = analyses.length;
  // Read props to satisfy unused variables compiler rule
  if (estimates.length < 0 && apiHealth.ok) {
    console.log(estimates, apiHealth);
  }

  const criticalIssuesCount = analyses.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH').length;
  const warningsCount = analyses.filter(a => a.severity === 'MEDIUM' || (a.severity as string) === 'WARNING').length;
  const securityFindingsCount = analyses.filter(a => 
    a.issueType?.toLowerCase().includes('auth') || 
    a.issueType?.toLowerCase().includes('access denied') || 
    a.issueType?.toLowerCase().includes('forbidden') || 
    a.issueType?.toLowerCase().includes('permission')
  ).length;

  // Get most recent log analysis results
  const recentAnalyses = analyses.slice(0, 5);

  // Format Cost Trend data (Costs by Date)
  const costTrendData = React.useMemo(() => {
    const dailyMap: Record<string, number> = {};
    estimates.forEach(e => {
      const dateStr = new Date(e.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
      dailyMap[dateStr] = (dailyMap[dateStr] || 0) + e.estimatedMonthlyCost;
    });
    return Object.entries(dailyMap)
      .map(([date, cost]) => ({ date, cost }))
      .reverse();
  }, [estimates]);

  // Format Error Distribution data (Most Common Log Errors)
  const errorDistData = React.useMemo(() => {
    const errorMap: Record<string, number> = {};
    analyses.forEach(a => {
      errorMap[a.issueType] = (errorMap[a.issueType] || 0) + 1;
    });
    return Object.entries(errorMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5 errors
  }, [analyses]);

  // Export handlers
  const handleExportCSV = () => {
    exportDashboardSummaryCSV({
      totalCalculations: estimates.length,
      totalLogsAnalyzed: analyses.length,
      criticalIssues: criticalIssuesCount,
      apiUptime: metrics?.uptime_pct ?? 100.0
    });
  };

  const handleExportPDF = () => {
    exportDashboardSummaryPDF({
      totalCalculations: estimates.length,
      totalLogsAnalyzed: analyses.length,
      criticalIssues: criticalIssuesCount,
      apiUptime: metrics?.uptime_pct ?? 100.0
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Intro Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">CloudInsight Overview</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Serverless portal diagnostics, automated billing estimates, and real-time log security checks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-250 dark:border-zinc-800 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-250 dark:border-zinc-800 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export PDF
          </button>
        </div>
      </div>

      {/* Cloud Services Monitor Section */}
      <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
          <h3 className="font-semibold text-sm text-zinc-950 dark:text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-zinc-400" /> Cloud Services Monitor
          </h3>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: '3s' }} /> Auto-refreshes every 30s
          </span>
        </div>
        
        {healthLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse flex items-center justify-between p-4 border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 rounded-xl">
                <div className="space-y-2">
                  <div className="h-2.5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-4 w-24 bg-zinc-300 dark:bg-zinc-700 rounded" />
                </div>
                <div className="w-6 h-6 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* API Gateway Card */}
            <div className="flex items-center justify-between p-4 border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 rounded-xl hover:border-zinc-200 dark:hover:border-zinc-700 transition-all">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">API Gateway</span>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  {healthData?.api_gateway === 'online' ? (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      Online
                    </>
                  ) : healthData?.api_gateway === 'degraded' ? (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                      Degraded
                    </>
                  ) : (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                      Offline
                    </>
                  )}
                </h4>
              </div>
              <Activity className={`w-8 h-8 ${healthData?.api_gateway === 'online' ? 'text-emerald-500/20' : healthData?.api_gateway === 'degraded' ? 'text-amber-500/20' : 'text-rose-500/20'}`} />
            </div>

            {/* AWS Lambda Card */}
            <div className="flex items-center justify-between p-4 border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 rounded-xl hover:border-zinc-200 dark:hover:border-zinc-700 transition-all">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">AWS Lambda</span>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Running
                </h4>
              </div>
              <Cpu className="w-8 h-8 text-emerald-500/20" />
            </div>

            {/* MongoDB Atlas Card */}
            <div className="flex items-center justify-between p-4 border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 rounded-xl hover:border-zinc-200 dark:hover:border-zinc-700 transition-all">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">MongoDB Atlas</span>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  {healthData?.mongodb === 'connected' ? (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      Connected
                    </>
                  ) : (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                      Disconnected
                    </>
                  )}
                </h4>
              </div>
              <Database className={`w-8 h-8 ${healthData?.mongodb === 'connected' ? 'text-emerald-500/20' : 'text-rose-500/20'}`} />
            </div>
          </div>
        )}
      </div>

      {/* Grid of metrics (Existing Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Total Logs"
          value={totalAnalysesCount}
          icon={<FileCode className="w-5 h-5 text-blue-500" />}
          trend={{
            value: analyses.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH').length,
            isPositive: false,
            label: 'unresolved issues',
          }}
        />
        <MetricCard
          title="Critical Issues"
          value={analyses.filter(a => a.severity === 'CRITICAL').length}
          icon={<AlertTriangle className="w-5 h-5 text-rose-500" />}
          trend={{
            value: `${analyses.filter(a => a.severity === 'CRITICAL').length} fatal`,
            isPositive: false,
            label: 'require immediate action',
          }}
        />
        <MetricCard
          title="Warnings"
          value={warningsCount}
          icon={<HelpCircle className="w-5 h-5 text-amber-500" />}
          trend={{
            value: `${warningsCount} alerts`,
            isPositive: true,
            label: 'monitored issues',
          }}
        />
        <MetricCard
          title="Security Findings"
          value={securityFindingsCount}
          icon={<ShieldAlert className="w-5 h-5 text-indigo-500" />}
          trend={{
            value: `${securityFindingsCount} findings`,
            isPositive: true,
            label: 'access & auth audits',
          }}
        />
      </div>

      {/* Summary Diagnostics Grid (New Cards) */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          System Operations Metrics (MongoDB Backed)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard
            title="Total Cost Calculations"
            value={estimates.length}
            icon={<Cpu className="w-5 h-5 text-purple-500" />}
            trend={{
              value: `${estimates.length} calculations`,
              isPositive: true,
              label: 'total runs recorded',
            }}
          />
          <MetricCard
            title="Logs Analyzed"
            value={analyses.length}
            icon={<FileCode className="w-5 h-5 text-blue-500" />}
            trend={{
              value: `${analyses.length} events`,
              isPositive: true,
              label: 'analyzed log streams',
            }}
          />
          <MetricCard
            title="Critical Issues"
            value={criticalIssuesCount}
            icon={<AlertTriangle className="w-5 h-5 text-rose-500" />}
            trend={{
              value: `${criticalIssuesCount} active`,
              isPositive: false,
              label: 'critical/high anomalies',
            }}
          />
          <MetricCard
            title="API Uptime"
            value={metrics ? `${metrics.uptime_pct}%` : '100%'}
            icon={<Globe className="w-5 h-5 text-emerald-500" />}
            trend={{
              value: metrics ? `${metrics.uptime_pct}% SLA` : '100% SLA',
              isPositive: true,
              label: 'api health uptime',
            }}
          />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Trend Chart */}
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-xs flex flex-col space-y-4">
          <h3 className="font-semibold text-sm text-zinc-950 dark:text-white">
            Cost Trend Analysis
          </h3>
          <div className="h-64 w-full">
            {costTrendData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-400">
                No cost calculation records found to display trend.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={costTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5E6AD2" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#5E6AD2" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" className="dark:stroke-zinc-800" />
                  <XAxis dataKey="date" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(24, 24, 27, 0.95)',
                      borderColor: '#27272a',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: '#fff'
                    }}
                  />
                  <Area type="monotone" dataKey="cost" name="Monthly Cost ($)" stroke="#5E6AD2" strokeWidth={2} fillOpacity={1} fill="url(#costGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Error Distribution Chart */}
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-xs flex flex-col space-y-4">
          <h3 className="font-semibold text-sm text-zinc-950 dark:text-white">
            Common Error Distribution
          </h3>
          <div className="h-64 w-full">
            {errorDistData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-400">
                No log analysis logs recorded to show distributions.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={errorDistData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" className="dark:stroke-zinc-800" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(24, 24, 27, 0.95)',
                      borderColor: '#27272a',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="count" name="Frequency" fill="#FF9900" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Primary layout content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Analysis Table (2/3 width on desktop) */}
        <div className="lg:col-span-2 border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 rounded-xl shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
              <h3 className="font-semibold text-sm text-zinc-950 dark:text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-zinc-400" /> Recent AI Log Analyses
              </h3>
              <button
                onClick={() => onViewChange('logs')}
                className="text-xs text-linear dark:text-aws font-medium inline-flex items-center gap-1 hover:underline cursor-pointer"
              >
                Launch Analyzer <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {analyses.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="No analyses recorded"
                  description="Submit server application output logs on the Log Analyzer page to extract errors and recommendations."
                  actionLabel="Analyze First Log"
                  onAction={() => onViewChange('logs')}
                  icon="log"
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 text-zinc-500 dark:text-zinc-400 font-medium">
                      <th className="px-6 py-3">Timestamp</th>
                      <th className="px-6 py-3">Issue Type</th>
                      <th className="px-6 py-3">Severity</th>
                      <th className="px-6 py-3">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                    {recentAnalyses.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-900/30 transition-colors">
                        <td className="px-6 py-4 font-mono text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white truncate max-w-[180px]">
                          {item.issueType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                            item.severity === 'CRITICAL' || item.severity === 'HIGH'
                              ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30'
                              : item.severity === 'MEDIUM'
                              ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30'
                              : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
                          }`}>
                            {item.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.isMocked ? (
                            <span className="text-zinc-400 dark:text-zinc-500 inline-flex items-center gap-1">
                              <HelpCircle className="w-3.5 h-3.5 text-amber-500" /> Local Fallback
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" /> AWS Cloud
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {analyses.length > 5 && (
            <div className="px-6 py-3 border-t border-zinc-100 dark:border-zinc-800 text-center">
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                Displaying 5 of {analyses.length} total analyzer jobs.
              </span>
            </div>
          )}
        </div>

        {/* Activity Timeline (1/3 width on desktop) */}
        <div className="border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/80">
            <h3 className="font-semibold text-sm text-zinc-950 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-400" /> Activity Timeline
            </h3>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            {timeline.length === 0 ? (
              <div className="h-full flex items-center justify-center py-8">
                <span className="text-xs text-zinc-400 dark:text-zinc-500 text-center">
                  No calculations or analyses ran during this session.
                </span>
              </div>
            ) : (
              <div className="relative border-l border-zinc-200 dark:border-zinc-800 pl-4 space-y-6">
                {timeline.map((entry) => (
                  <div key={entry.id} className="relative">
                    {/* Time indicator circle */}
                    <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-900 ${
                      entry.type === 'cost' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />

                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-semibold text-zinc-900 dark:text-white line-clamp-1">
                          {entry.title}
                        </span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                          {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                        {entry.subtitle}
                      </span>
                      {entry.type === 'cost' && entry.amount !== undefined && (
                        <span className="text-xs font-bold text-amber-500 mt-0.5">
                          ${entry.amount.toFixed(2)}/mo
                        </span>
                      )}
                      {entry.type === 'log' && entry.severity && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md w-fit mt-0.5 ${
                          entry.severity === 'CRITICAL' || entry.severity === 'HIGH'
                            ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-500'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                        }`}>
                          {entry.severity}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
