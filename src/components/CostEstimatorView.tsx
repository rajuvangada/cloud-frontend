import React, { useState } from 'react';
import type { CostEstimationResult } from '../types';
import { calculateCost } from '../utils/api';
import { LoadingSpinner } from './LoadingSpinner';
import { ResultCard } from './ResultCard';
import { EmptyState } from './EmptyState';
import {
  TrendingDown,
  Info,
  Layers,
  Cpu
} from 'lucide-react';

interface CostEstimatorViewProps {
  onAddEstimate: (result: CostEstimationResult) => void;
  onAddToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  estimates: CostEstimationResult[];
}

const INSTANCE_SPECS = [
  { type: 't2.micro', cpu: '1 vCPU', ram: '1 GiB', price: '$0.0116/hr', desc: 'Burstable general purpose' },
  { type: 't2.small', cpu: '1 vCPU', ram: '2 GiB', price: '$0.0230/hr', desc: 'Burstable general purpose' },
  { type: 't3.micro', cpu: '2 vCPUs', ram: '1 GiB', price: '$0.0104/hr', desc: 'Next-gen burstable, cost optimized' },
];

export const CostEstimatorView: React.FC<CostEstimatorViewProps> = ({
  onAddEstimate,
  onAddToast,
  estimates,
}) => {
  const [instanceType, setInstanceType] = useState('t2.micro');
  const [hours, setHours] = useState<number>(720);
  const [loading, setLoading] = useState(false);
  const [latestResult, setLatestResult] = useState<CostEstimationResult | null>(
    estimates.length > 0 ? estimates[0] : null
  );

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hours <= 0 || hours > 8760) {
      onAddToast('Please enter a valid range of hours (1 to 8760).', 'error');
      return;
    }

    setLoading(true);
    try {
      const { result, latency } = await calculateCost(hours, instanceType);
      onAddEstimate(result);
      setLatestResult(result);
      
      if (result.isMocked) {
        onAddToast(`Calculated locally in ${latency}ms (API fallback active).`, 'warning');
      } else {
        onAddToast(`Calculated via AWS Lambda in ${latency}ms!`, 'success');
      }
    } catch (err) {
      onAddToast('Error running cost estimation.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleHoursPreset = (amount: number) => {
    setHours(amount);
  };

  const copyResultText = latestResult
    ? `AWS Cost Estimate (CloudInsight Lite):\n` +
      `- Instance Type: ${latestResult.instanceType}\n` +
      `- Duration: ${latestResult.hours} hours\n` +
      `- Estimated Monthly Cost: $${latestResult.estimatedMonthlyCost.toFixed(2)}\n` +
      `- Estimated Annual Cost: $${latestResult.estimatedAnnualCost.toFixed(2)}\n` +
      `- Suggested Savings Plan Option: -$${latestResult.suggestedSavings.toFixed(2)}/mo`
    : '';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">AWS Cost Estimator</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Estimate billing impact for AWS EC2 instances, forecast annual run-rates, and detect optimization strategies.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Estimator Input Form (Left column, 1/3 width) */}
        <div className="border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-xs h-fit">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-zinc-400" /> Estimation Parameters
          </h3>
          <form onSubmit={handleCalculate} className="space-y-5">
            {/* Instance Select */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="instance-type" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Instance Type
              </label>
              <select
                id="instance-type"
                value={instanceType}
                onChange={(e) => setInstanceType(e.target.value)}
                className="w-full text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 outline-hidden focus:ring-1 focus:ring-linear dark:focus:ring-aws text-zinc-900 dark:text-white transition-all cursor-pointer"
              >
                <option value="t2.micro">t2.micro ($0.0116/hr)</option>
                <option value="t2.small">t2.small ($0.0230/hr)</option>
                <option value="t3.micro">t3.micro ($0.0104/hr)</option>
              </select>
            </div>

            {/* Hours Input */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="usage-hours" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  Usage Hours
                </label>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Max: 8760 (1yr)</span>
              </div>
              <input
                id="usage-hours"
                type="number"
                min="1"
                max="8760"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-full text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 outline-hidden focus:ring-1 focus:ring-linear dark:focus:ring-aws text-zinc-900 dark:text-white transition-all"
                placeholder="720"
                required
              />
              {/* Presets buttons */}
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => handleHoursPreset(168)}
                  className="text-[10px] font-medium px-2 py-1 rounded bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                >
                  1 Week (168h)
                </button>
                <button
                  type="button"
                  onClick={() => handleHoursPreset(720)}
                  className="text-[10px] font-medium px-2 py-1 rounded bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                >
                  1 Month (720h)
                </button>
                <button
                  type="button"
                  onClick={() => handleHoursPreset(8760)}
                  className="text-[10px] font-medium px-2 py-1 rounded bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                >
                  1 Year (8760h)
                </button>
              </div>
            </div>

            {/* Calculate Action */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm font-medium text-white bg-linear hover:bg-linear-hover dark:bg-aws dark:hover:bg-aws-hover rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" color="white" /> Calculating...
                </>
              ) : (
                'Calculate Cost'
              )}
            </button>
          </form>

          {/* Instance Specifications Sheet */}
          <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800">
            <h4 className="text-xs font-bold text-zinc-950 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-400" /> Instance Catalog Specs
            </h4>
            <div className="space-y-3">
              {INSTANCE_SPECS.map((spec) => (
                <div
                  key={spec.type}
                  className={`p-2.5 rounded-lg border text-xs flex flex-col gap-1 ${
                    instanceType === spec.type
                      ? 'border-linear/40 dark:border-aws/40 bg-linear/5 dark:bg-aws/5'
                      : 'border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/20 dark:bg-zinc-950/20'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-zinc-900 dark:text-white">{spec.type}</span>
                    <span className="font-mono text-zinc-500 dark:text-zinc-400 font-bold">{spec.price}</span>
                  </div>
                  <div className="flex gap-2 text-[10px] text-zinc-400 dark:text-zinc-500">
                    <span>{spec.cpu}</span>
                    <span>•</span>
                    <span>{spec.ram}</span>
                    <span>•</span>
                    <span className="truncate">{spec.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Estimation Results (Right column, 2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 rounded-xl p-8 shadow-xs flex flex-col items-center justify-center py-20 gap-4">
              <LoadingSpinner size="lg" color={instanceType.startsWith('t3') ? 'aws' : 'linear'} />
              <div className="text-center">
                <p className="text-sm font-semibold text-zinc-800 dark:text-white">Estimating Cloud Cost...</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Retrieving instances billing rates, formatting annual forecasts</p>
              </div>
            </div>
          ) : latestResult ? (
            <div className="space-y-6">
              {/* Output Result Card wrapper */}
              <ResultCard
                title="Cost Calculations & Optimization recommendations"
                isMocked={latestResult.isMocked}
                copyText={copyResultText}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Monthly card */}
                  <div className="p-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Estimated Monthly Cost</span>
                    <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">${latestResult.estimatedMonthlyCost.toFixed(2)}</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Based on {latestResult.hours} hours</span>
                  </div>

                  {/* Suggested Savings */}
                  <div className="p-5 bg-emerald-50/40 dark:bg-emerald-950/15 border border-emerald-100/80 dark:border-emerald-900/20 rounded-xl flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5" /> Suggested Savings
                    </span>
                    <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">-${latestResult.suggestedSavings.toFixed(2)}</span>
                    <span className="text-[10px] text-emerald-600/70 dark:text-emerald-500 font-medium">3-Year Savings Plan forecast</span>
                  </div>

                  {/* Estimated Annual Cost */}
                  <div className="p-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Estimated Annual Runrate</span>
                    <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">${latestResult.estimatedAnnualCost.toFixed(2)}</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Forecasted multiplier (x12)</span>
                  </div>
                </div>

                {/* Savings recommendations report */}
                <div className="mt-6 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/20 flex gap-3.5 items-start">
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-500 border border-amber-100 dark:border-amber-900/30 flex-shrink-0 mt-0.5">
                    <Info className="w-4 h-4" />
                  </div>
                  <div className="text-xs space-y-1.5">
                    <p className="font-semibold text-zinc-900 dark:text-white">CloudInsight Optimization Recommendations:</p>
                    <ul className="list-disc pl-4 text-zinc-500 dark:text-zinc-400 space-y-1">
                      <li>
                        Switching to <span className="font-semibold text-zinc-800 dark:text-zinc-300">t3.micro</span> could yield a savings of <span className="font-semibold text-emerald-500 font-mono">10%</span> over t2.micro, with better burst CPU capabilities.
                      </li>
                      <li>
                        For constant workloads, commit to an AWS Compute Savings Plan to reduce EC2 overhead by up to <span className="font-semibold text-emerald-500 font-mono">30%</span> (estimated savings of <span className="font-semibold font-mono">${latestResult.suggestedSavings.toFixed(2)}/mo</span>).
                      </li>
                    </ul>
                  </div>
                </div>
              </ResultCard>

              {/* Estimation History Table */}
              {estimates.length > 1 && (
                <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-xs">
                  <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/20">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Calculation History</h4>
                  </div>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                    {estimates.slice(0, 4).map((est) => (
                      <div key={est.id} className="p-4 flex justify-between items-center hover:bg-zinc-50/40 dark:hover:bg-zinc-900/30 transition-colors">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-zinc-900 dark:text-white">Instance: {est.instanceType}</span>
                          <span className="text-zinc-400 dark:text-zinc-500">{est.hours} hours estimated</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-zinc-900 dark:text-white block">${est.estimatedMonthlyCost.toFixed(2)}/mo</span>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                            {new Date(est.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
              title="Calculate your first instance cost"
              description="Select instance specifications and enter expected runtime hours on the left to see billing projections."
              actionLabel="Set Standard Month"
              onAction={() => handleHoursPreset(720)}
              icon="cost"
            />
          )}
        </div>

      </div>
    </div>
  );
};
