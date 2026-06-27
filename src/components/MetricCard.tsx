import React from 'react';
import { CardSkeleton } from './LoadingSpinner';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number | string;
    isPositive: boolean;
    label?: string;
  };
  suffix?: string;
  loading?: boolean;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  trend,
  suffix,
  loading = false,
  className = '',
}) => {
  if (loading) {
    return <CardSkeleton />;
  }

  return (
    <div
      className={`relative overflow-hidden border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-xs transition-all duration-300 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700/80 group ${className}`}
    >
      {/* Background glow animation on hover */}
      <div className="absolute inset-0 bg-linear-to-tr from-transparent via-transparent to-zinc-50 dark:to-zinc-800/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="flex justify-between items-start relative z-10">
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</span>
        <div className="p-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-300 group-hover:scale-105 transition-transform duration-300">
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2 relative z-10">
        <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          {value}
        </span>
        {suffix && (
          <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{suffix}</span>
        )}
      </div>

      {trend && (
        <div className="mt-2 flex items-center gap-1.5 text-xs relative z-10">
          <span
            className={`inline-flex items-center gap-0.5 font-medium px-1.5 py-0.5 rounded-full ${
              trend.isPositive
                ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
            }`}
          >
            {trend.isPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            {trend.value}
          </span>
          {trend.label && (
            <span className="text-zinc-400 dark:text-zinc-500 font-normal">{trend.label}</span>
          )}
        </div>
      )}
    </div>
  );
};
