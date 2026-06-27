import React, { useState } from 'react';
import type { ViewType, User, ThemeType } from '../types';
import { loginUser } from '../utils/api';
import { LoadingSpinner } from './LoadingSpinner';
import { Cloud, Mail, Lock, ArrowRight, Sun, Moon } from 'lucide-react';

interface LoginPageProps {
  onViewChange: (view: ViewType) => void;
  onLoginSuccess: (user: User, token: string) => void;
  onAddToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  theme: ThemeType;
  onThemeToggle: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onViewChange,
  onLoginSuccess,
  onAddToast,
  theme,
  onThemeToggle,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const validateForm = () => {
    // Email Check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      return false;
    }
    
    // Password Check
    if (password.length < 6) {
      setErrorMsg('Password must contain at least 6 characters.');
      return false;
    }

    setErrorMsg('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { user, token, isMocked } = await loginUser(email, password);
      
      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      onLoginSuccess(user, token);

      if (isMocked) {
        onAddToast(`Logged in successfully under local mode.`, 'warning');
      } else {
        onAddToast(`Logged in successfully! Welcome back, ${user.name}.`, 'success');
      }
      onViewChange('dashboard');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Invalid email or password credentials. Please verify your entries.');
      onAddToast('Authentication failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center items-center p-4 relative overflow-hidden transition-colors duration-200">
      
      {/* Background glow circle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-linear/5 dark:bg-aws/5 rounded-full blur-3xl pointer-events-none" />

      {/* Floating theme toggle */}
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

        {/* Login form card wrapper */}
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-xl">
          <h2 className="text-lg font-bold text-zinc-950 dark:text-white mb-6">Sign In to Platform</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Error messaging bar */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-250 dark:border-rose-900/30 text-xs font-semibold text-rose-600 dark:text-rose-450 rounded-lg animate-fade-in">
                {errorMsg}
              </div>
            )}

            {/* Email input field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
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

            {/* Password input field */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="login-password" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => onViewChange('forgot')}
                  className="text-xs font-semibold text-linear dark:text-aws hover:underline cursor-pointer"
                  disabled={loading}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-sm rounded-lg border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950 pl-10 pr-3.5 py-2.5 outline-hidden focus:ring-1 focus:ring-linear dark:focus:ring-aws text-zinc-900 dark:text-white transition-all"
                  placeholder="••••••••"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Submit Action button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-2 text-sm font-medium text-white bg-linear hover:bg-linear-hover dark:bg-aws dark:hover:bg-aws-hover rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" color="white" /> Authenticating...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          {/* Registration anchor link footer */}
          <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800 text-center text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-1.5">
            <span>Don't have an account?</span>
            <button
              onClick={() => onViewChange('register')}
              className="font-bold text-linear dark:text-aws hover:underline cursor-pointer"
              disabled={loading}
            >
              Sign Up
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
