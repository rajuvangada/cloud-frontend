import React, { useState } from 'react';
import type { ViewType, ThemeType } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { Cloud, Mail, ArrowLeft, Send, Sun, Moon } from 'lucide-react';

interface ForgotPasswordPageProps {
  onViewChange: (view: ViewType) => void;
  onAddToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  theme: ThemeType;
  onThemeToggle: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  onViewChange,
  onAddToast,
  theme,
  onThemeToggle,
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    
    setErrorMsg('');
    setLoading(true);
    try {
      // Simulate API Gateway call
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSuccess(true);
      onAddToast(`Password recovery link dispatched to ${email}.`, 'success');
    } catch (err) {
      setErrorMsg('Endpoint unreachable. Please toggle local mock settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center items-center p-4 relative overflow-hidden transition-colors duration-200">
      
      {/* Background glow circle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-linear/5 dark:bg-aws/5 rounded-full blur-3xl pointer-events-none" />

      {/* Theme toggle */}
      <div className="absolute top-5 right-5 z-20">
        <button
          onClick={onThemeToggle}
          className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 p-2.5 rounded-lg hover:bg-zinc-150 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        
        {/* Brand logo header */}
        <div className="flex flex-col items-center text-center gap-2 cursor-pointer" onClick={() => onViewChange('landing')}>
          <div className="p-2 rounded-xl bg-linear-to-tr from-linear to-aws text-white shadow-md animate-glow">
            <Cloud className="w-6 h-6" />
          </div>
          <h1 className="font-extrabold text-xl tracking-tight bg-linear-to-r from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent">
            CloudInsight <span className="text-[10px] text-linear dark:text-aws font-semibold align-super tracking-normal uppercase">Lite</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Serverless Cloud Estimator & AI Log Diagnostics
          </p>
        </div>

        {/* Form Card wrapper */}
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-xl">
          <h2 className="text-lg font-bold text-zinc-950 dark:text-white mb-3">Recover Password</h2>
          
          {success ? (
            <div className="space-y-4 animate-fade-in text-center py-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/30 text-xs font-semibold text-emerald-600 dark:text-emerald-450 rounded-lg">
                Reset instructions have been sent successfully. Please check your inbox at {email}.
              </div>
              <button
                onClick={() => onViewChange('login')}
                className="w-full py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Enter your account email below. We'll send instructions and a link to create a new password.
              </p>

              {/* Error warning tag */}
              {errorMsg && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-250 dark:border-rose-900/30 text-xs font-semibold text-rose-600 dark:text-rose-450 rounded-lg animate-fade-in">
                  {errorMsg}
                </div>
              )}

              {/* Email Input */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="recover-email" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="recover-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm rounded-lg border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950 pl-10 pr-3.5 py-2.5 outline-hidden focus:ring-1 focus:ring-linear dark:focus:ring-aws text-zinc-900 dark:text-white transition-all"
                    placeholder="name@company.com"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 mt-2 text-sm font-medium text-white bg-linear hover:bg-linear-hover dark:bg-aws dark:hover:bg-aws-hover rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" color="white" /> Dispatching...
                  </>
                ) : (
                  <>
                    Send Reset Link <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              {/* Back to Login link */}
              <button
                type="button"
                onClick={() => onViewChange('login')}
                className="w-full py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-300 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                disabled={loading}
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Cancel and return to Login
              </button>

            </form>
          )}

        </div>
      </div>
    </div>
  );
};
