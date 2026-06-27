import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'aws' | 'linear' | 'white' | 'gray';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'linear',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const colorClasses = {
    aws: 'border-aws/20 border-t-aws',
    linear: 'border-linear/20 border-t-linear',
    white: 'border-white/20 border-t-white',
    gray: 'border-zinc-300 dark:border-zinc-700 border-t-zinc-600 dark:border-t-zinc-200',
  };

  return (
    <div
      className={`rounded-full animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      role="status"
      aria-label="loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Elegant Skeleton Loader component
interface SkeletonProps {
  className?: string;
  count?: number;
}

export const LoadingSkeleton: React.FC<SkeletonProps> = ({ className = '', count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded ${className}`}
        />
      ))}
    </>
  );
};

// Specialized Card skeleton layout
export const CardSkeleton: React.FC = () => {
  return (
    <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-xs space-y-4">
      <div className="flex justify-between items-center">
        <LoadingSkeleton className="h-4 w-24" />
        <LoadingSkeleton className="h-8 w-8 rounded-full" />
      </div>
      <LoadingSkeleton className="h-8 w-32" />
      <LoadingSkeleton className="h-3 w-48" />
    </div>
  );
};
