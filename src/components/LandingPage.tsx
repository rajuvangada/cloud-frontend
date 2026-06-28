import React, { useState } from 'react';
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
  Mail,
  Sun,
  Moon,
  CheckCircle,
  Play
} from 'lucide-react';
import { FuzzyText } from './FuzzyText';
import { ScrollFloat } from './ScrollFloat';
import { SoftAurora } from './SoftAurora';

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
}) => {
  const isDark = theme === 'dark';
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribed(true);
      setEmailInput('');
      // Simulate toast trigger via alert or just local state. Since App passes onAddToast to other pages but not directly here,
      // showing success state in the card directly is a premium UX.
    }
  };

  const services = [
    {
      icon: <Calculator className="w-8 h-8 text-amber-500" />,
      title: 'AWS Cost Estimator',
      desc: 'Estimate EC2/Lambda runrates, select instances, define active schedules, and review savings plan optimizations.',
    },
    {
      icon: <Terminal className="w-8 h-8 text-blue-500" />,
      title: 'AI Log Analyzer',
      desc: 'Instantly diagnose system errors (503s, timeouts, port blockages) using intelligent parsing and get remediation codes.',
    },
    {
      icon: <Server className="w-8 h-8 text-indigo-500" />,
      title: 'Serverless Infrastructure',
      desc: 'Entirely built using decoupled API Gateway triggers, AWS Lambda computational processes, and MongoDB Atlas.',
    },
    {
      icon: <Activity className="w-8 h-8 text-emerald-500" />,
      title: 'Cloud Monitoring',
      desc: 'Monitor real-time system performance, roundtrip latency ticks, and response statuses via built-in health probes.',
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'Create Account',
      desc: 'Securely register using your email and custom credentials.',
      color: 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
    },
    {
      num: '02',
      title: 'Estimate & Upload',
      desc: 'Input instance specifications and upload diagnostics log streams.',
      color: 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
    },
    {
      num: '03',
      title: 'Review Savings Plans',
      desc: 'Apply optimization advice and remediation guides to prune overhead.',
      color: 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
    }
  ];

  const partners = [
    { name: 'Amazon Web Services', icon: <Cloud className="w-5 h-5 text-amber-500" /> },
    { name: 'MongoDB Atlas', icon: <Server className="w-5 h-5 text-emerald-500" /> },
    { name: 'React UI', icon: <Layers className="w-5 h-5 text-cyan-500" /> },
    { name: 'Python Lambda', icon: <Zap className="w-5 h-5 text-indigo-500" /> }
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200 flex flex-col font-sans relative overflow-hidden">
      
      {/* 1. SoftAurora Background (DARK MODE ONLY) */}
      {isDark && (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
          <SoftAurora
            speed={0.4}
            scale={1.8}
            brightness={0.8}
            color1="#2e1065"
            color2="#e100ff"
            enableMouseInteraction={true}
          />
        </div>
      )}

      {/* 2. Floating Navbar */}
      <div className="sticky top-0 z-50 w-full px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <header className="mx-auto max-w-7xl rounded-2xl bg-white/75 dark:bg-zinc-900/70 border border-zinc-200/50 dark:border-zinc-800/40 shadow-xs backdrop-blur-md transition-colors px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-linear-to-tr from-linear to-aws text-white shadow-xs">
              <Cloud className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-linear-to-r from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent">
              CloudInsight <span className="text-[10px] text-linear dark:text-aws align-super font-semibold tracking-normal uppercase ml-0.5">Lite</span>
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-300">
            <a href="#services" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Services</a>
            <a href="#workflow" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Workflow</a>
            <a href="#topography" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Topography</a>
            <a href="#subscribe" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Subscribe</a>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Theme switcher */}
            <button
              onClick={onThemeToggle}
              className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 p-2 rounded-lg hover:bg-zinc-150/50 dark:hover:bg-zinc-900/50 cursor-pointer transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {isAuthenticated ? (
              <button
                onClick={() => onViewChange('dashboard')}
                className="px-4 py-2 text-xs font-semibold text-white bg-linear hover:bg-linear-hover rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
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
                  className="px-4 py-2 text-xs font-semibold text-white bg-linear hover:bg-linear-hover rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </header>
      </div>

      {/* 3. Hero Section (Figma Styled) */}
      <section className="relative pt-12 pb-20 lg:pt-24 lg:pb-32 flex-grow flex flex-col justify-center items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 w-full">
          
          {/* Left Text Detail */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-linear dark:text-aws">
              Best Serverless Cloud Diagnostics
            </span>
            
            <h1 className="flex flex-col items-center lg:items-start gap-1">
              <span className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[110%] text-zinc-900 dark:text-white">
                Analyze and Optimize
              </span>
              <span className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[110%] text-zinc-900 dark:text-white flex items-center gap-2">
                Your Web Server in
              </span>
              {isDark ? (
                <FuzzyText
                  baseIntensity={0.2}
                  hoverIntensity={0.5}
                  enableHover
                  fontSize="clamp(2.5rem, 6vw, 4.5rem)"
                  fontWeight={900}
                  color="#e100ff"
                  className="inline-block"
                >
                  Real-time
                </FuzzyText>
              ) : (
                <span className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[110%] bg-linear-to-r from-linear to-aws bg-clip-text text-transparent">
                  Real-time
                </span>
              )}
            </h1>
            
            <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Estimate EC2 compute runrates, model savings plan benefits, and decode log errors instantly via our serverless Lambda orchestration.
            </p>
            
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={() => onViewChange(isAuthenticated ? 'dashboard' : 'register')}
                className="px-6 py-3.5 text-sm font-semibold text-white bg-linear hover:bg-linear-hover dark:bg-aws dark:hover:bg-aws-hover rounded-xl shadow-md transition-all duration-200 cursor-pointer flex items-center gap-2 transform hover:-translate-y-0.5"
              >
                Find out more <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Visual SaaS Mockup */}
          <div className="lg:col-span-5 flex justify-center w-full" id="topography">
            <div className="w-full max-w-md border border-zinc-200/50 dark:border-zinc-800/40 bg-white/60 dark:bg-zinc-900/50 backdrop-blur-md rounded-3xl p-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-bl from-linear/10 to-transparent rounded-bl-full pointer-events-none" />
              
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Platform Topography</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              {/* Central flow schematic */}
              <div className="space-y-4 font-mono text-[10px] text-zinc-800 dark:text-zinc-200">
                {/* Frontend node */}
                <div className="p-3 border border-zinc-200/50 dark:border-zinc-800/40 bg-white/40 dark:bg-zinc-950/40 rounded-xl flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2 text-linear dark:text-aws">
                    <Layers className="w-4 h-4" />
                    <span className="font-semibold">React Client</span>
                  </div>
                  <span className="text-zinc-400">localhost:3000</span>
                </div>

                <div className="flex justify-center h-4">
                  <div className="w-px border-l border-dashed border-zinc-300 dark:border-zinc-700" />
                </div>

                {/* Gateway node */}
                <div className="p-3 border border-zinc-200/50 dark:border-zinc-800/40 bg-white/40 dark:bg-zinc-950/40 rounded-xl flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2 text-indigo-500">
                    <Cloud className="w-4 h-4" />
                    <span className="font-semibold">API Gateway</span>
                  </div>
                  <span className="text-zinc-400">/prod/cost</span>
                </div>

                <div className="flex justify-center h-4">
                  <div className="w-px border-l border-dashed border-zinc-300 dark:border-zinc-700" />
                </div>

                {/* Lambda node */}
                <div className="p-3 border border-zinc-200/50 dark:border-zinc-800/40 bg-white/40 dark:bg-zinc-950/40 rounded-xl flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2 text-amber-500">
                    <Zap className="w-4 h-4" />
                    <span className="font-semibold">AWS Lambda</span>
                  </div>
                  <span className="text-amber-500 font-bold">Python 3.12</span>
                </div>

                <div className="flex justify-center h-4">
                  <div className="w-px border-l border-dashed border-zinc-300 dark:border-zinc-700" />
                </div>

                {/* Mongo node */}
                <div className="p-3 border border-zinc-200/50 dark:border-zinc-800/40 bg-white/40 dark:bg-zinc-950/40 rounded-xl flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2 text-emerald-500">
                    <Server className="w-4 h-4" />
                    <span className="font-semibold">MongoDB Atlas</span>
                  </div>
                  <span className="text-emerald-500">cloudinsight</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. Category/Services Section */}
      <section className="py-24 relative overflow-hidden" id="services">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">
          
          <div className="text-center space-y-3">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              CATEGORY
            </span>
            <div className="flex justify-center">
              {isDark ? (
                <ScrollFloat
                  animationDuration={0.8}
                  ease="back.out(1.5)"
                  scrollStart="top bottom-=10%"
                  scrollEnd="bottom center"
                  stagger={0.02}
                  containerClassName="text-3xl font-extrabold tracking-tight text-white"
                  textClassName="text-white text-3xl sm:text-4xl font-black"
                >
                  We Offer Best Services
                </ScrollFloat>
              ) : (
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900">
                  We Offer Best Services
                </h2>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((feat, idx) => (
              <div
                key={idx}
                className="border border-zinc-200/50 dark:border-zinc-800/40 bg-white/70 dark:bg-zinc-900/40 backdrop-blur-md rounded-3xl p-8 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col gap-5 group hover:border-zinc-300 dark:hover:border-zinc-700 hover:-translate-y-1"
              >
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/60 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-300">
                  {feat.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-base text-zinc-900 dark:text-white">{feat.title}</h3>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 5. Book Your Next Trip (Easy Steps) Section */}
      <section className="py-24 relative overflow-hidden" id="workflow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-10 w-full">
          
          {/* Left Steps */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-3">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                Easy and Fast
              </span>
              <div className="flex justify-start">
                {isDark ? (
                  <ScrollFloat
                    animationDuration={0.8}
                    ease="back.out(1.5)"
                    scrollStart="top bottom-=10%"
                    scrollEnd="bottom center"
                    stagger={0.02}
                    containerClassName="text-3xl font-extrabold tracking-tight text-white text-left"
                    textClassName="text-white text-3xl sm:text-4xl font-black text-left"
                  >
                    Optimize Diagnostics in 3 Steps
                  </ScrollFloat>
                ) : (
                  <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 text-left">
                    Optimize Diagnostics in 3 Steps
                  </h2>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  <div className={`p-3 rounded-xl flex-shrink-0 font-bold text-xs sm:text-sm ${step.color}`}>
                    {step.num}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white">{step.title}</h3>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-normal font-normal">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Floating Preview Card */}
          <div className="lg:col-span-6 flex justify-center w-full relative">
            {/* Main floating card */}
            <div className="w-full max-w-sm border border-zinc-200/50 dark:border-zinc-800/40 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md rounded-3xl p-6 shadow-xl relative z-10 space-y-4">
              <div className="h-44 bg-linear-to-tr from-linear to-aws rounded-2xl flex items-center justify-center text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white cursor-pointer hover:scale-105 transition-transform">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-bold text-base text-zinc-900 dark:text-white">Active Scanner</h4>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">Scheduled Audit | 24 June 2026</p>
              </div>

              <div className="flex gap-3 text-[10px] text-zinc-500 dark:text-zinc-400">
                <span className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800">Cost audit</span>
                <span className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800">Log diagnostic</span>
              </div>
            </div>

            {/* Smaller secondary floating card */}
            <div className="absolute bottom-6 right-0 lg:-right-4 z-20 w-56 border border-zinc-200/40 dark:border-zinc-800/30 bg-white/95 dark:bg-zinc-950/90 backdrop-blur-md rounded-2xl p-4 shadow-lg flex gap-3.5 items-center animate-glow">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Audit Scan</p>
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-100 truncate">85% completed</p>
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full w-[85%]" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 6. Partner Cloud Logos */}
      <section className="py-16 border-t border-b border-zinc-200/40 dark:border-zinc-900/50 bg-zinc-50/50 dark:bg-zinc-950/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-center">
            {partners.map((partner, idx) => (
              <div key={idx} className="flex items-center justify-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                <div className="p-2 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl">
                  {partner.icon}
                </div>
                <span className="font-bold text-xs sm:text-sm tracking-tight text-zinc-600 dark:text-zinc-300">
                  {partner.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Newsletter / Subscribe Card Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8" id="subscribe">
        <div className="max-w-5xl mx-auto rounded-3xl bg-zinc-100/50 dark:bg-zinc-900/30 border border-zinc-200/50 dark:border-zinc-800/40 p-8 sm:p-16 relative overflow-hidden shadow-sm backdrop-blur-md">
          {/* Decorative mesh bg glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-linear/5 dark:bg-aws/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl mx-auto text-center space-y-8">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black leading-tight text-zinc-900 dark:text-white">
              Subscribe to get real-time health notifications & optimization alerts
            </h3>
            
            {subscribed ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/35 text-sm font-semibold text-emerald-600 dark:text-emerald-450 rounded-xl animate-fade-in inline-block">
                Awesome! You have successfully subscribed to CloudInsight Lite alert streams.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <div className="relative w-full max-w-md">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Your email address"
                    className="w-full text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 pl-10 pr-4 py-3 outline-hidden focus:ring-1 focus:ring-linear dark:focus:ring-aws text-zinc-900 dark:text-white transition-all shadow-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-white bg-linear hover:bg-linear-hover dark:bg-aws dark:hover:bg-aws-hover rounded-xl shadow-md transition-all duration-200 cursor-pointer whitespace-nowrap"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 8. Footer Section */}
      <footer className="mt-auto border-t border-zinc-200/50 dark:border-zinc-800/40 bg-white/50 dark:bg-zinc-950/20 backdrop-blur-md transition-colors py-16 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Col 1 */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-linear-to-tr from-linear to-aws text-white">
                <Cloud className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-white">
                CloudInsight <span className="text-[10px] text-linear dark:text-aws font-semibold uppercase">Lite</span>
              </span>
            </div>
            <p className="text-zinc-400 dark:text-zinc-500 leading-relaxed font-normal">
              Book AWS savings forecasts, analyze exception logs, and optimize microservice architecture stacks in minutes.
            </p>
          </div>

          {/* Col 2 */}
          <div className="md:col-span-2 space-y-3.5">
            <h5 className="font-bold text-zinc-900 dark:text-white text-sm">Company</h5>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Mobile</a></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="md:col-span-2 space-y-3.5">
            <h5 className="font-bold text-zinc-900 dark:text-white text-sm">Contact</h5>
            <ul className="space-y-2">
              <li><a href="mailto:support@cloudinsight.io" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Help/FAQ</a></li>
              <li><a href="mailto:support@cloudinsight.io" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Press</a></li>
              <li><a href="mailto:support@cloudinsight.io" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Affiliates</a></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="md:col-span-2 space-y-3.5">
            <h5 className="font-bold text-zinc-900 dark:text-white text-sm">More</h5>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Airline fees</a></li>
              <li><a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Airlines</a></li>
              <li><a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Low fare tips</a></li>
            </ul>
          </div>

          {/* Col 5 */}
          <div className="md:col-span-2 space-y-3.5 text-center md:text-left">
            <h5 className="font-bold text-zinc-900 dark:text-white text-sm">Discover Our App</h5>
            <div className="flex justify-center md:justify-start gap-2 mt-2">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                <svg className="w-4 h-4 text-zinc-700 dark:text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                <svg className="w-4 h-4 text-zinc-700 dark:text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-zinc-400 dark:text-zinc-650 border-t border-zinc-200/30 dark:border-zinc-900/40 mt-10 pt-6">
          <span>All rights reserved @ CloudInsight.io</span>
        </div>
      </footer>

    </div>
  );
};
