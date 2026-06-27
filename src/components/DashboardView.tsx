import React from 'react';
import type { ViewType, CostEstimationResult, LogAnalysisResult, TimelineEntry } from '../types';
import { MetricCard } from './MetricCard';
import { EmptyState } from './EmptyState';
import {
  DollarSign,
  FileCode,
  Activity,
  Cpu,
  Clock,
  ArrowRight,
  Terminal,
  HelpCircle,
  ShieldCheck
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
  // Compute metrics
  const totalCost = estimates.reduce((acc, curr) => acc + curr.estimatedMonthlyCost, 0);
  const totalEstimatesCount = estimates.length;
  const totalAnalysesCount = analyses.length;

  // Compute status metrics
  const apiStatusString = apiHealth.ok ? 'Operational' : 'Degraded';
  const lambdaHealthPercent = apiHealth.ok ? 100 : 80;

  // Get most recent log analysis results
  const recentAnalyses = analyses.slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Intro Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">CloudInsight Overview</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Serverless portal diagnostics, automated billing estimates, and real-time log security checks.
        </p>
      </div>

      {/* Grid of metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Total Cost Estimates"
          value={totalEstimatesCount}
          icon={<DollarSign className="w-5 h-5 text-amber-500" />}
          trend={{
            value: `$${totalCost.toFixed(2)}/mo`,
            isPositive: true,
            label: 'total estimated',
          }}
        />
        <MetricCard
          title="Total Log Analyses"
          value={totalAnalysesCount}
          icon={<FileCode className="w-5 h-5 text-blue-500" />}
          trend={{
            value: analyses.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH').length,
            isPositive: false,
            label: 'unresolved issues',
          }}
        />
        <MetricCard
          title="API Status"
          value={apiStatusString}
          icon={<Activity className="w-5 h-5 text-emerald-500" />}
          trend={{
            value: `${apiHealth.latency}ms`,
            isPositive: apiHealth.ok,
            label: 'roundtrip ping',
          }}
          className={!apiHealth.ok ? 'border-rose-200 dark:border-rose-950' : ''}
        />
        <MetricCard
          title="Lambda Health"
          value={`${lambdaHealthPercent}%`}
          icon={<Cpu className="w-5 h-5 text-indigo-500" />}
          trend={{
            value: '0 failures',
            isPositive: true,
            label: 'last 24 hours',
          }}
        />
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
                            item.severity === 'CRITICAL'
                              ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30'
                              : item.severity === 'HIGH'
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
