import React from 'react';
import type { ViewType, ThemeType } from '../types';
import {
  Cloud,
  ArrowRight,
  Calculator,
  Terminal,
  Server,
  Layers,
  Zap,
  Activity,
  FileCode,
  Mail,
  Sun,
  Moon
} from 'lucide-react';

interface LandingPageProps {
  onViewChange: (view: ViewType) => void;
  theme: ThemeType;
  onThemeToggle: () => void;
  isAuthenticated: boolean;
  onLaunchDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onViewChange,
  theme,
  onThemeToggle,
  isAuthenticated,
  onLaunchDemo,
}) => {
  const features = [
    {
      icon: <Calculator className="w-6 h-6 text-amber-500" />,
      title: 'AWS Cost Estimator',
      desc: 'Estimate EC2/Lambda runrates, select instances, define active schedules, and review savings plan optimizations.',
    },
    {
      icon: <Terminal className="w-6 h-6 text-blue-500" />,
      title: 'AI Log Analyzer',
      desc: 'Instantly diagnose system errors (503s, timeouts, port blockages) using intelligent parsing and get remediation codes.',
    },
    {
      icon: <Server className="w-6 h-6 text-indigo-500" />,
      title: 'Serverless Infrastructure',
      desc: 'Entirely built using decoupled API Gateway triggers, AWS Lambda computational processes, and MongoDB Atlas.',
    },
    {
      icon: <Activity className="w-6 h-6 text-emerald-500" />,
      title: 'Cloud Monitoring',
      desc: 'Monitor real-time system performance, roundtrip latency ticks, and response statuses via built-in health probes.',
    },
  ];

  const steps = [
    { num: '01', title: 'Create Account', desc: 'Securely register using your email and custom credentials.' },
    { num: '02', title: 'Estimate Costs', desc: 'Input instance specifications and compute hourly/annual run rates.' },
    { num: '03', title: 'Analyze Logs', desc: 'Upload output streams to diagnose exceptions and server timeouts.' },
    { num: '04', title: 'Implement Tips', desc: 'Review automation guides to optimize resource overhead.' },
  ];

  const stack = [
    { name: 'AWS Lambda', desc: 'Python computational core', icon: <Zap className="w-5 h-5 text-amber-500" /> },
    { name: 'API Gateway', desc: 'Serverless HTTP triggers', icon: <Cloud className="w-5 h-5 text-indigo-500" /> },
    { name: 'Python', desc: 'Logic parser engines', icon: <FileCode className="w-5 h-5 text-blue-500" /> },
    { name: 'React', desc: 'Dynamic interface portal', icon: <Layers className="w-5 h-5 text-cyan-500" /> },
    { name: 'MongoDB', desc: 'Atlas user diagnostics stores', icon: <Server className="w-5 h-5 text-emerald-500" /> },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200 flex flex-col font-sans">
      
      {/* 1. Header Navbar */}
      <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-900/60 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-linear-to-tr from-linear to-aws text-white shadow-sm animate-glow">
              <Cloud className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-linear-to-r from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent">
              CloudInsight <span className="text-[10px] text-linear dark:text-aws align-super font-semibold tracking-normal uppercase ml-0.5">Lite</span>
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Theme switcher */}
            <button
              onClick={onThemeToggle}
              className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {isAuthenticated ? (
              <button
                onClick={() => onViewChange('dashboard')}
                className="px-4 py-2 text-xs font-semibold text-white bg-linear hover:bg-linear-hover rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                Go to Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onViewChange('login')}
                  className="px-3.5 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Login
                </button>
                <button
                  onClick={() => onViewChange('register')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-linear hover:bg-linear-hover rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-32 overflow-hidden flex-grow flex flex-col justify-center">
        {/* Background glow graphics */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-linear/10 dark:bg-aws/5 rounded-full blur-3xl pointer-events-none animate-glow" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Left Text details */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-linear/10 text-linear dark:bg-aws/10 dark:text-aws border border-linear/20 dark:border-aws/20">
              <Zap className="w-3.5 h-3.5 animate-pulse" /> Serverless Diagnostics Platform
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[110%] bg-linear-to-r from-zinc-900 via-zinc-800 to-zinc-600 dark:from-white dark:via-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent">
              AWS Billing Insights & <span className="bg-linear-to-r from-linear to-aws bg-clip-text text-transparent">AI Diagnostic Logs</span>
            </h1>

            <p className="text-base sm:text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Estimate EC2 compute runrates, model savings plan benefits, and decode log errors instantly via our serverless Lambda orchestration.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <button
                onClick={() => onViewChange(isAuthenticated ? 'dashboard' : 'register')}
                className="px-6 py-3 text-sm font-semibold text-white bg-linear hover:bg-linear-hover dark:bg-aws dark:hover:bg-aws-hover rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-2"
              >
                Get Started Free <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onLaunchDemo}
                className="px-6 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
              >
                View Dashboard Demo
              </button>
            </div>
          </div>

          {/* Right Visual SaaS architecture mock */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md rounded-2xl p-6 shadow-xl relative overflow-hidden group">
              {/* Outer decorative line coordinates */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-bl from-linear/10 to-transparent rounded-bl-full pointer-events-none" />
              
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Platform Topography</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              {/* Central flow schematic */}
              <div className="space-y-4 font-mono text-[10px]">
                
                {/* Frontend node */}
                <div className="p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-linear dark:text-aws">
                    <Layers className="w-4 h-4" />
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">React Client</span>
                  </div>
                  <span className="text-zinc-400">localhost:3000</span>
                </div>

                {/* Arrow join */}
                <div className="flex justify-center h-4">
                  <div className="w-px border-l border-dashed border-zinc-300 dark:border-zinc-700" />
                </div>

                {/* Gateway trigger node */}
                <div className="p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-500">
                    <Cloud className="w-4 h-4" />
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">API Gateway</span>
                  </div>
                  <span className="text-zinc-400">/prod/cost</span>
                </div>

                {/* Arrow join */}
                <div className="flex justify-center h-4">
                  <div className="w-px border-l border-dashed border-zinc-300 dark:border-zinc-700" />
                </div>

                {/* Lambda trigger node */}
                <div className="p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-500">
                    <Zap className="w-4 h-4" />
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">AWS Lambda</span>
                  </div>
                  <span className="text-amber-500 font-bold">Python 3.12</span>
                </div>

                {/* Arrow join */}
                <div className="flex justify-center h-4">
                  <div className="w-px border-l border-dashed border-zinc-300 dark:border-zinc-700" />
                </div>

                {/* Mongo node */}
                <div className="p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-500">
                    <Server className="w-4 h-4" />
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">MongoDB Atlas</span>
                  </div>
                  <span className="text-emerald-500">cloudinsight</span>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Features Section */}
      <section className="py-20 bg-zinc-100/50 dark:bg-zinc-900/20 border-y border-zinc-200 dark:border-zinc-900/60 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Platform Capabilities</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
              Automated resource billing forecasts and server exception logging integrated on a serverless microservices framework.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, idx) => (
              <div
                key={idx}
                className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col gap-4 group hover:border-zinc-300 dark:hover:border-zinc-700"
              >
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-850/80 border border-zinc-100 dark:border-zinc-800/80 rounded-xl w-fit group-hover:scale-105 transition-transform duration-300">
                  {feat.icon}
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">{feat.title}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 4. How It Works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">How It Works</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
              Get up and running in minutes with our simple 4-step workflow integrations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="relative border border-zinc-150 dark:border-zinc-850 bg-white/40 dark:bg-zinc-950/20 backdrop-blur-xs rounded-2xl p-6 shadow-xs flex flex-col gap-3"
              >
                <span className="text-3xl font-black text-linear/20 dark:text-aws/10 select-none">
                  {step.num}
                </span>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">{step.title}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 5. Tech Stack Section */}
      <section className="py-20 bg-zinc-100/50 dark:bg-zinc-900/20 border-t border-zinc-200 dark:border-zinc-900/60 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Fully Decoupled Technology Stack</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
              Our cloud-native topology leverages these premium technologies for instant scaling and low running overheads.
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-6">
            {stack.map((item, idx) => (
              <div
                key={idx}
                className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4 rounded-xl shadow-xs flex items-center gap-3 hover:scale-103 transition-transform duration-200 min-w-[200px]"
              >
                <div className="p-2 bg-zinc-50 dark:bg-zinc-850 rounded-lg">
                  {item.icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">{item.name}</span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 6. Footer Section */}
      <footer className="mt-auto bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-900 transition-colors py-8 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-linear" />
            <span>© {new Date().getFullYear()} CloudInsight Lite. All rights reserved.</span>
          </div>

          <div className="flex gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-1 cursor-pointer font-medium"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg> GitHub
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-1 cursor-pointer font-medium"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg> LinkedIn
            </a>
            <a
              href="mailto:support@cloudinsight.io"
              className="hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-1 cursor-pointer font-medium"
            >
              <Mail className="w-4 h-4" /> Contact
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
};
