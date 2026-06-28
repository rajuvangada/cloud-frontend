import React, { useState, useEffect } from 'react';
import { apiConfig, fetchHealthStatus, fetchHealthHistory, fetchHealthMetrics, pingHealth } from '../utils/api';
import { Activity, ShieldCheck, RefreshCw, Server, Send, AlertTriangle } from 'lucide-react';

interface ApiHealthViewProps {
  onAddToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const ENDPOINT_DESCRIPTIONS: Record<string, { method: string, description: string }> = {
  '/services': { method: 'GET', description: 'AWS Services Catalog' },
  '/cost': { method: 'POST', description: 'AWS Lambda Estimator' },
  '/logs': { method: 'POST', description: 'AWS Lambda Diagnostics' },
  '/cost-history': { method: 'GET', description: 'MongoDB Cost Analytics' },
  '/log-history': { method: 'GET', description: 'MongoDB Log Analytics' }
};

export const ApiHealthView: React.FC<ApiHealthViewProps> = ({ onAddToast }) => {
  const [loading, setLoading] = useState(false);
  const [latencyHistory, setLatencyHistory] = useState<number[]>([45, 52, 48, 62, 50, 42, 48, 55, 47, 51]);
  const [lastChecked, setLastChecked] = useState<string>(new Date().toLocaleTimeString());
  const [gatewayStatus, setGatewayStatus] = useState<'online' | 'degraded' | 'offline'>('online');
  const [avgLatency, setAvgLatency] = useState<number>(50);
  const [routeChecks, setRouteChecks] = useState<any[]>([
    { endpoint: '/services', method: 'GET', success: true, status: 200, description: 'AWS Services Catalog' },
    { endpoint: '/cost', method: 'POST', success: true, status: 200, description: 'AWS Lambda Estimator' },
    { endpoint: '/logs', method: 'POST', success: true, status: 200, description: 'AWS Lambda Diagnostics' },
    { endpoint: '/cost-history', method: 'GET', success: true, status: 200, description: 'MongoDB Cost Analytics' },
    { endpoint: '/log-history', method: 'GET', success: true, status: 200, description: 'MongoDB Log Analytics' }
  ]);

  const updateStatusFromData = (status: 'online' | 'degraded' | 'offline', checks: any[], metrics?: any) => {
    setGatewayStatus(status);
    
    if (checks && checks.length > 0) {
      const updatedChecks = checks.map(c => {
        const info = ENDPOINT_DESCRIPTIONS[c.endpoint] || { method: 'GET', description: 'API Route' };
        return {
          endpoint: c.endpoint,
          method: info.method,
          description: info.description,
          success: c.success,
          status: c.status
        };
      });
      setRouteChecks(updatedChecks);
    }
    
    if (metrics) {
      setAvgLatency(metrics.avg_latency || 50);
      if (metrics.last_check_timestamp) {
        setLastChecked(new Date(metrics.last_check_timestamp).toLocaleTimeString());
      }
    } else {
      setLastChecked(new Date().toLocaleTimeString());
    }
  };

  const refreshHealthData = async () => {
    try {
      const statusRes = await fetchHealthStatus();
      const historyRes = await fetchHealthHistory();
      const metricsRes = await fetchHealthMetrics();
      
      if (historyRes.history) {
        setLatencyHistory(historyRes.history);
      }
      
      updateStatusFromData(statusRes.status, statusRes.checks, metricsRes);
    } catch (err) {
      console.error('Failed to load health statistics:', err);
    }
  };

  useEffect(() => {
    refreshHealthData();
    
    // Auto-polling interval every 15 seconds
    const interval = setInterval(() => {
      refreshHealthData();
    }, 15000);
    
    return () => clearInterval(interval);
  }, []);

  const handlePing = async () => {
    setLoading(true);
    try {
      const res = await pingHealth();
      const historyRes = await fetchHealthHistory();
      const metricsRes = await fetchHealthMetrics();
      
      if (historyRes.history) {
        setLatencyHistory(historyRes.history);
      }
      
      updateStatusFromData(res.status, res.checks, metricsRes);
      
      if (res.status === 'online') {
        onAddToast(`All gateway endpoints operational! Roundtrip check completed.`, 'success');
      } else if (res.status === 'degraded') {
        onAddToast('Performance degraded. Some serverless route checks failed.', 'warning');
      } else {
        onAddToast('Gateway unreachable. All target routes failing.', 'error');
      }
    } catch (err) {
      setGatewayStatus('offline');
      onAddToast('Failed to connect to the AWS API Gateway endpoint.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Generate SVG chart path coordinates
  const chartHeight = 120;
  const chartWidth = 500;
  const maxLatency = Math.max(...latencyHistory, 100);
  const minLatency = Math.min(...latencyHistory, 20);
  const range = maxLatency - minLatency || 1;

  const points = latencyHistory.map((val, idx) => {
    const x = (idx / (latencyHistory.length - 1)) * chartWidth;
    const y = chartHeight - ((val - minLatency) / range) * (chartHeight - 20) - 10;
    return `${x},${y}`;
  }).join(' ');

  // SVG Area path closing it under the curve
  const areaPoints = points
    ? `0,${chartHeight} ${points} ${chartWidth},${chartHeight}`
    : '';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">API Health Monitor</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time verification of serverless routes, endpoint responses, and API gateway cluster metrics.
          </p>
        </div>
        <button
          onClick={handlePing}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-linear hover:bg-linear-hover dark:bg-aws dark:hover:bg-aws-hover rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Ping Gateway
        </button>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Status card */}
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Gateway Status</span>
            <span className="text-lg font-bold text-zinc-900 dark:text-white capitalize flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                gatewayStatus === 'online' ? 'bg-emerald-500 animate-pulse' : gatewayStatus === 'degraded' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'
              }`} />
              {gatewayStatus === 'online' ? 'Operational' : gatewayStatus === 'degraded' ? 'Performance Degraded' : 'Unreachable'}
            </span>
          </div>
          <Activity className="w-8 h-8 text-emerald-500/20" />
        </div>

        {/* Avg Latency Card */}
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Average Latency</span>
            <span className="text-lg font-bold text-zinc-900 dark:text-white font-mono">{avgLatency} ms</span>
          </div>
          <Server className="w-8 h-8 text-blue-500/20" />
        </div>

        {/* Last Check Card */}
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Last Diagnostic Check</span>
            <span className="text-lg font-bold text-zinc-900 dark:text-white font-mono">{lastChecked}</span>
          </div>
          <ShieldCheck className="w-8 h-8 text-indigo-500/20" />
        </div>

      </div>

      {/* Visual Latency Chart and Route Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Latency curve (Left 2/3 width) */}
        <div className="lg:col-span-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">API Latency Stream (Last 15 ticks)</h3>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Range: {minLatency}ms - {maxLatency}ms</span>
          </div>

          {/* SVG representation */}
          <div className="w-full h-36 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden relative">
            <svg
              className="w-full h-full"
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="gradient-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5E6AD2" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#5E6AD2" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="currentColor" className="text-zinc-200 dark:text-zinc-800/40" strokeDasharray="3" />
              <line x1="0" y1={chartHeight / 4} x2={chartWidth} y2={chartHeight / 4} stroke="currentColor" className="text-zinc-200 dark:text-zinc-800/40" strokeDasharray="3" />
              <line x1="0" y1={(3 * chartHeight) / 4} x2={chartWidth} y2={(3 * chartHeight) / 4} stroke="currentColor" className="text-zinc-200 dark:text-zinc-800/40" strokeDasharray="3" />

              {/* Area path */}
              {areaPoints && <polygon points={areaPoints} fill="url(#gradient-area)" />}

              {/* Line path */}
              {points && (
                <polyline
                  fill="none"
                  stroke="#5E6AD2"
                  strokeWidth="2.5"
                  points={points}
                />
              )}

              {/* Individual nodes */}
              {latencyHistory.map((val, idx) => {
                const x = (idx / (latencyHistory.length - 1)) * chartWidth;
                const y = chartHeight - ((val - minLatency) / range) * (chartHeight - 20) - 10;
                return (
                  <circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r="4"
                    fill="#FF9900"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="hover:r-6 cursor-pointer transition-all"
                  />
                );
              })}
            </svg>
          </div>

          <div className="flex justify-between items-center text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold px-1">
            <span>Older Stream</span>
            <span>Real-time response tracking</span>
            <span>Live Sync</span>
          </div>
        </div>

        {/* Route status list (Right 1/3 width) */}
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Serverless Route Checks</h3>
            <div className="space-y-3">
              {routeChecks.map((ep) => (
                <div key={ep.endpoint} className="p-3 border border-zinc-100 dark:border-zinc-800 rounded-lg bg-zinc-50/20 dark:bg-zinc-950/20 flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {ep.method} {ep.endpoint}
                    </span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      {ep.description}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    ep.success
                      ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30'
                      : 'text-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30'
                  }`}>
                    {ep.success ? `${ep.status || 200} OK` : ep.status ? `${ep.status} Error` : 'Offline'}
                  </span>
                </div>
              ))}

              {/* API Gateway region info */}
              <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1.5 leading-relaxed">
                <div className="flex justify-between">
                  <span>Region:</span>
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">us-east-1 (N. Virginia)</span>
                </div>
                <div className="flex justify-between">
                  <span>SSL Protocol:</span>
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">TLS 1.3 / HTTPS</span>
                </div>
                <div className="flex justify-between">
                  <span>Throttling Limit:</span>
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">100 req/sec burst</span>
                </div>
              </div>
            </div>
          </div>

          {apiConfig.getUseMock() && (
            <div className="mt-6 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 flex gap-2 items-start text-xs text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Mock Server Mode active. Current graph records simulated local loopbacks.
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
