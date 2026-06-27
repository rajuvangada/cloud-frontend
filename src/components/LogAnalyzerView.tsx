import React, { useState } from 'react';
import type { LogAnalysisResult } from '../types';
import { analyzeLog } from '../utils/api';
import { LoadingSpinner } from './LoadingSpinner';
import { ResultCard } from './ResultCard';
import { EmptyState } from './EmptyState';
import {
  Terminal,
  AlertTriangle,
  Lightbulb,
  Layers,
  Sparkles,
  ClipboardList
} from 'lucide-react';

interface LogAnalyzerViewProps {
  onAddAnalysis: (result: LogAnalysisResult) => void;
  onAddToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  analyses: LogAnalysisResult[];
}

// Log samples for user testing ease
const LOG_SAMPLES = [
  {
    name: 'DB Connection Failure',
    text: `2026-06-27T14:02:11.204Z [ERROR] connection refused: DB connection failed on port 5432 after retry limit. Pool exhausted. errno=111.
2026-06-27T14:02:11.205Z [FATAL] shutdown connection pool: cannot recovery postgres client connection. Exiting process.`
  },
  {
    name: 'Gateway Timeout (503)',
    text: `2026-06-27T14:12:30.505Z [WARN] GatewayTimeout: response from application container took more than 30000ms.
2026-06-27T14:12:30.512Z [INFO] returning HTTP 503 response code to ALB load balancer. user_id=vraju`
  },
  {
    name: 'Successful Server Boot',
    text: `2026-06-27T14:11:58.001Z [INFO] Initializing serverless function framework. Listening on port 8080.
2026-06-27T14:11:58.055Z [INFO] Connected successfully to API gateway controller.
2026-06-27T14:11:58.110Z [INFO] Configuration loaded from AWS SSM parameter store. status=200`
  }
];

// Custom syntax highlighter using regex parsing
const LogSyntaxHighlighter: React.FC<{ log: string }> = ({ log }) => {
  const parseLine = (line: string) => {
    // Regex matches
    const timestampRegex = /^([\d\-T\:\.\+Z]+)/;
    const portOrIpRegex = /(\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b|:\d{2,5}\b)/;

    // Simple word scanner for coloring
    const words = line.split(/(\s+)/);
    
    return (
      <div className="py-0.5 font-mono text-[11px] leading-relaxed break-all">
        {words.map((word, index) => {
          let className = 'text-zinc-700 dark:text-zinc-300'; // Default text color
          
          if (timestampRegex.test(word)) {
            className = 'text-zinc-400 dark:text-zinc-500';
          } else if (/ERROR|FATAL|FAIL/i.test(word)) {
            className = 'text-rose-500 dark:text-rose-400 font-semibold';
          } else if (/WARN|WARNING/i.test(word)) {
            className = 'text-amber-500 dark:text-amber-400 font-semibold';
          } else if (/INFO/i.test(word)) {
            className = 'text-emerald-500 dark:text-emerald-400 font-semibold';
          } else if (portOrIpRegex.test(word)) {
            className = 'text-cyan-500 dark:text-cyan-400';
          } else if (/500|503/i.test(word)) {
            className = 'text-rose-500 dark:text-rose-400 font-bold underline decoration-dotted';
          } else if (/200|201/i.test(word)) {
            className = 'text-emerald-500 dark:text-emerald-400 font-semibold';
          } else if (word.includes('=')) {
            // Highlight variable assigns
            const [k, v] = word.split('=');
            return (
              <span key={index} className="text-zinc-600 dark:text-zinc-400">
                <span className="text-purple-500 dark:text-purple-400">{k}</span>=
                <span className="text-amber-600 dark:text-amber-500">{v}</span>
              </span>
            );
          }

          return (
            <span key={index} className={className}>
              {word}
            </span>
          );
        })}
      </div>
    );
  };

  const lines = log.trim().split('\n');

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800/80 rounded-xl overflow-x-auto max-h-64 divide-y divide-zinc-100/10">
      {lines.map((line, idx) => (
        <div key={idx} className="flex gap-4">
          <span className="text-[10px] text-zinc-300 dark:text-zinc-700 select-none text-right w-6 font-mono">
            {idx + 1}
          </span>
          <div className="flex-1">{parseLine(line)}</div>
        </div>
      ))}
    </div>
  );
};

export const LogAnalyzerView: React.FC<LogAnalyzerViewProps> = ({
  onAddAnalysis,
  onAddToast,
  analyses,
}) => {
  const [logText, setLogText] = useState('');
  const [loading, setLoading] = useState(false);
  const [latestResult, setLatestResult] = useState<LogAnalysisResult | null>(
    analyses.length > 0 ? analyses[0] : null
  );

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logText.trim()) {
      onAddToast('Please paste or write some log files first.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const { result, latency } = await analyzeLog(logText);
      onAddAnalysis(result);
      setLatestResult(result);
      
      if (result.isMocked) {
        onAddToast(`Logs analyzed locally in ${latency}ms (API fallback active).`, 'warning');
      } else {
        onAddToast(`Logs analyzed via AWS Lambda in ${latency}ms!`, 'success');
      }
    } catch (err) {
      onAddToast('Error running log analyzer.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSampleSelect = (text: string) => {
    setLogText(text);
  };

  const copyResultText = latestResult
    ? `AI Log Analysis Report (CloudInsight Lite):\n` +
      `- Issue Type: ${latestResult.issueType}\n` +
      `- Severity: ${latestResult.severity}\n` +
      `- Possible Causes:\n` +
      latestResult.possibleCauses.map((c, i) => `  ${i + 1}. ${c}`).join('\n') + '\n' +
      `- Recommendations:\n` +
      latestResult.recommendations.map((r, i) => `  ${i + 1}. ${r}`).join('\n')
    : '';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">AI Log Analyzer</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Scan application debug streams, check code exceptions, check port blockages, and get remediation advice using AI analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Log input section (Left column, 1/3 width) */}
        <div className="border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-xs h-fit">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-zinc-400" /> Server Log Stream Input
          </h3>
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="log-input" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Log Text
              </label>
              <textarea
                id="log-input"
                rows={10}
                value={logText}
                onChange={(e) => setLogText(e.target.value)}
                className="w-full text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 outline-hidden focus:ring-1 focus:ring-linear dark:focus:ring-aws text-zinc-900 dark:text-white transition-all resize-y"
                placeholder="Paste your standard output or error logs here..."
                required
              />
            </div>

            {/* Quick Presets */}
            <div>
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-2">
                Quick Test Logs
              </span>
              <div className="flex flex-col gap-1.5">
                {LOG_SAMPLES.map((sample) => (
                  <button
                    key={sample.name}
                    type="button"
                    onClick={() => handleSampleSelect(sample.text)}
                    className="w-full text-left text-xs px-3 py-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>{sample.name}</span>
                    <Sparkles className="w-3.5 h-3.5 text-linear dark:text-aws" />
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm font-medium text-white bg-linear hover:bg-linear-hover dark:bg-aws dark:hover:bg-aws-hover rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" color="white" /> Running Diagnostics...
                </>
              ) : (
                'Analyze Log Stream'
              )}
            </button>
          </form>
        </div>

        {/* Diagnostic Outputs (Right column, 2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 rounded-xl p-8 shadow-xs flex flex-col items-center justify-center py-20 gap-4">
              <LoadingSpinner size="lg" color="linear" />
              <div className="text-center">
                <p className="text-sm font-semibold text-zinc-800 dark:text-white">Executing AI Diagnostics...</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Comparing signatures, parsing port configurations, generating repair codes</p>
              </div>
            </div>
          ) : latestResult ? (
            <div className="space-y-6">
              
              {/* Log syntax view */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Highlighted Input logs</span>
                <LogSyntaxHighlighter log={logText || latestResult.logPreview} />
              </div>

              {/* Outputs diagnostic container */}
              <ResultCard
                title="AI Diagnostic Analysis Report"
                isMocked={latestResult.isMocked}
                copyText={copyResultText}
              >
                {/* Header Severity display */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Detected Issue</span>
                    <span className="text-lg font-bold text-zinc-900 dark:text-white">{latestResult.issueType}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Severity Level</span>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                      latestResult.severity === 'CRITICAL'
                        ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/30'
                        : latestResult.severity === 'HIGH'
                        ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30'
                        : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}>
                      <AlertTriangle className="w-3.5 h-3.5" /> {latestResult.severity}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Possible Causes card */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-zinc-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-zinc-400" /> Possible Causes
                    </h4>
                    <div className="space-y-2">
                      {latestResult.possibleCauses.map((cause, idx) => (
                        <div key={idx} className="p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/20 flex gap-2">
                          <span className="font-mono text-zinc-300 dark:text-zinc-600 font-bold">{idx + 1}.</span>
                          <span className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{cause}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations card */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-zinc-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-zinc-400" /> Remediation Options
                    </h4>
                    <div className="space-y-2">
                      {latestResult.recommendations.map((rec, idx) => (
                        <div key={idx} className="p-3 rounded-lg border border-emerald-100/50 dark:border-emerald-900/10 bg-emerald-50/10 dark:bg-emerald-950/5 flex gap-2">
                          <span className="font-mono text-emerald-400 dark:text-emerald-500/80 font-bold">{idx + 1}.</span>
                          <span className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ResultCard>

              {/* Log History list */}
              {analyses.length > 1 && (
                <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-xs">
                  <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/20 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Analysis History</h4>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold flex items-center gap-1">
                      <ClipboardList className="w-3.5 h-3.5" /> Total logs: {analyses.length}
                    </span>
                  </div>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                    {analyses.slice(0, 3).map((item) => (
                      <div key={item.id} className="p-4 flex justify-between items-center hover:bg-zinc-50/40 dark:hover:bg-zinc-900/30 transition-colors">
                        <div className="flex flex-col gap-0.5 max-w-[70%]">
                          <span className="font-semibold text-zinc-900 dark:text-white truncate">{item.issueType}</span>
                          <span className="text-zinc-400 dark:text-zinc-500 truncate font-mono text-[10px]">{item.logPreview}</span>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            item.severity === 'CRITICAL' || item.severity === 'HIGH'
                              ? 'bg-rose-100 dark:bg-rose-950/20 text-rose-500'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                          }`}>
                            {item.severity}
                          </span>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono block mt-1">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              title="Audit server application output logs"
              description="Paste production logs or select a sample log from the inputs list to troubleshoot and extract remediation advice."
              actionLabel="Paste DB sample log"
              onAction={() => handleSampleSelect(LOG_SAMPLES[0].text)}
              icon="log"
            />
          )}
        </div>

      </div>
    </div>
  );
};
