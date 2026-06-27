import React from 'react';
import { HelpCircle, ShieldCheck, Copy, Check } from 'lucide-react';

interface ResultCardProps {
  title: string;
  isMocked?: boolean;
  onCopy?: () => void;
  copyText?: string;
  children: React.ReactNode;
  className?: string;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  title,
  isMocked = false,
  onCopy,
  copyText,
  children,
  className = '',
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (copyText) {
      navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    if (onCopy) {
      onCopy();
    }
  };

  return (
    <div
      className={`border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 rounded-xl shadow-xs overflow-hidden transition-all duration-300 ${className}`}
    >
      <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/20">
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
          {title}
        </h4>
        <div className="flex items-center gap-2">
          {/* Mock vs Live Badge */}
          {isMocked ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-600 dark:text-amber-400">
              <HelpCircle className="w-3 h-3" /> Local Fallback
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 animate-pulse">
              <ShieldCheck className="w-3 h-3" /> AWS Cloud Verified
            </span>
          )}

          {copyText && (
            <button
              onClick={handleCopy}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title="Copy Output"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
};
