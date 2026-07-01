import React, { useState } from 'react';
import type { ViewType, ThemeType } from '../types';
import {
  Cloud,
  ArrowRight,
  Server,
  Layers,
  Zap,
  Activity,
  Mail,
  Sun,
  Moon,
  CheckCircle,
  Play,
  Code,
  Sparkles,
  Cpu,
  ShieldCheck,
  Star,
  Volume2,
  FileText,
  Bot,
  Eye,
  ChevronRight,
  TrendingDown
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
  onLaunchDemo,
}) => {
  const isDark = theme === 'dark';
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // Section 4 Playground States
  const [playgroundTab, setPlaygroundTab] = useState<'audio' | 'text' | 'agent' | 'vision'>('audio');
  const [playgroundText, setPlaygroundText] = useState(
    'Analyzing audio stream diagnostic chunk...\n[00:04.2] User: "My Lambda latency spiked suddenly to 12s, check if there are database connection timeouts."'
  );

  // Section 5 Code Tab State
  const [codeTab, setCodeTab] = useState<'python' | 'js' | 'curl'>('python');

  // Section 6 Video State
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribed(true);
      setEmailInput('');
    }
  };

  const handlePlaygroundTabChange = (tab: 'audio' | 'text' | 'agent' | 'vision') => {
    setPlaygroundTab(tab);
    switch (tab) {
      case 'audio':
        setPlaygroundText(
          'Analyzing audio stream diagnostic chunk...\n[00:04.2] User: "My Lambda latency spiked suddenly to 12s, check if there are database connection timeouts."'
        );
        break;
      case 'text':
        setPlaygroundText(
          'MongoDB connection pool exception:\nMongoNetworkError: connection timed out after 30000ms\n  at MongoClient.connect (r:/node_modules/mongodb/lib/operations/connect.js:47)\n  at connectionRefused (r:/cloud-insight-lite/backend/api.py:128)'
        );
        break;
      case 'agent':
        setPlaygroundText(
          'Agent Task: Auto-healing for spike in AWS EC2 CPU usage.\nTarget Instance: i-0f5a7b6c89101112d (standard-instance-large)\nAction: Spin down legacy threads, balance gateway queues, ping Health Probe.'
        );
        break;
      case 'vision':
        setPlaygroundText(
          'Visual Topology Analysis:\nInputting AWS VPC architecture diagram...\nChecking subnets for open public route tables (0.0.0.0/0) and unassociated Elastic IPs.'
        );
        break;
    }
  };

  const getPlaygroundMetadata = (tab: 'audio' | 'text' | 'agent' | 'vision') => {
    switch (tab) {
      case 'audio':
        return {
          status: 'Processed Successfully',
          latency: '124 ms',
          confidence: '98.5%',
          findings: [
            'Speech-to-text parsed successfully',
            'Spike identified at timestamp 10:41',
            'Remediation suggested: Check DB pool sizes'
          ]
        };
      case 'text':
        return {
          status: 'Exception Identified',
          latency: '89 ms',
          confidence: '99.8%',
          findings: [
            'Database port 27017 blocked',
            'MongoNetworkError exception caught',
            'Remediation: open port in security group'
          ]
        };
      case 'agent':
        return {
          status: 'Active Remediation',
          latency: '412 ms',
          confidence: '95.2%',
          findings: [
            'Queue thresholds balanced',
            'Terminated 3 blocking threads',
            'Health status returned to normal: 200 OK'
          ]
        };
      case 'vision':
        return {
          status: 'Scan Completed',
          latency: '280 ms',
          confidence: '92.1%',
          findings: [
            'VPC layout mapped correctly',
            'Vulnerability: Open route tables (0.0.0.0/0)',
            'Remediation: Restrict routing vectors'
          ]
        };
    }
  };

  const playgroundMeta = getPlaygroundMetadata(playgroundTab);

  const marqueePartners = [
    { name: 'Amazon Web Services', icon: <Cloud className="w-5 h-5 text-zinc-400 group-hover:text-amber-500 transition-colors" /> },
    { name: 'MongoDB Atlas', icon: <Server className="w-5 h-5 text-zinc-400 group-hover:text-emerald-500 transition-colors" /> },
    { name: 'Tailwind CSS', icon: <Zap className="w-5 h-5 text-zinc-400 group-hover:text-cyan-400 transition-colors" /> },
    { name: 'React UI', icon: <Layers className="w-5 h-5 text-zinc-400 group-hover:text-blue-400 transition-colors" /> },
    { name: 'Vite Native', icon: <Activity className="w-5 h-5 text-zinc-400 group-hover:text-purple-400 transition-colors" /> },
    { name: 'Python Lambda', icon: <Cpu className="w-5 h-5 text-zinc-400 group-hover:text-yellow-500 transition-colors" /> },
    { name: 'GitHub Enterprise', icon: <Code className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" /> }
  ];

  const marqueeItems = [...marqueePartners, ...marqueePartners, ...marqueePartners];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-[#1e2033] dark:text-zinc-150 transition-colors duration-200 flex flex-col font-sans relative overflow-x-hidden">
      
      {/* Soft ambient background glow overlay */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-linear-to-br from-[#A5BBFC]/20 to-[#D5E2FF]/30 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-linear-to-br from-[#A5BBFC]/10 to-[#D5E2FF]/20 blur-[120px] pointer-events-none z-0" />

      {/* Aurora Background (DARK MODE ONLY) */}
      {isDark && (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
          <SoftAurora
            speed={0.3}
            scale={1.5}
            brightness={0.6}
            color1="#1e2033"
            color2="#3a3f5c"
            enableMouseInteraction={true}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. Navigation Header */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 w-full px-4 sm:px-6 lg:px-8 py-3 bg-white/40 dark:bg-zinc-950/40 border-b border-zinc-200/20 dark:border-zinc-800/10 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo Wordmark */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onViewChange('landing')}>
            <div className="p-2 rounded-xl bg-linear-to-tr from-[#3a3f5c] to-[#1e2033] text-white shadow-md flex items-center justify-center">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-[#1e2033] dark:text-white">
              CloudInsight <span className="text-[11px] font-bold tracking-normal uppercase bg-[#83C040]/25 text-[#83C040] px-1.5 py-0.5 rounded ml-0.5">Lite</span>
            </span>
          </div>

          {/* Centered Tracking Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-wider uppercase text-zinc-600 dark:text-zinc-300">
            <a href="#playground" className="hover:text-[#3a3f5c] dark:hover:text-white transition-colors duration-200">Platform</a>
            <a href="#developer" className="hover:text-[#3a3f5c] dark:hover:text-white transition-colors duration-200">Developers</a>
            <a href="#media" className="hover:text-[#3a3f5c] dark:hover:text-white transition-colors duration-200">Resources</a>
            <a href="#values" className="hover:text-[#3a3f5c] dark:hover:text-white transition-colors duration-200">Company</a>
          </nav>

          {/* Right Action Utility Controls */}
          <div className="flex items-center gap-3">
            {/* Theme switcher */}
            <button
              onClick={onThemeToggle}
              className="text-zinc-500 hover:text-[#3a3f5c] dark:hover:text-zinc-200 p-2 rounded-full hover:bg-zinc-200/50 dark:hover:bg-zinc-900/50 cursor-pointer transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {isAuthenticated ? (
              <button
                onClick={() => onViewChange('dashboard')}
                className="px-5 py-2.5 text-xs font-semibold rounded-full btn-premium-dark flex items-center gap-1.5 cursor-pointer"
              >
                Go to Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onViewChange('login')}
                  className="px-4 py-2 text-xs font-bold text-[#1e2033] dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer rounded-full border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white/10"
                >
                  Contact Us
                </button>
                <button
                  onClick={() => onViewChange('register')}
                  className="px-5 py-2.5 text-xs font-semibold rounded-full btn-premium-dark cursor-pointer"
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. High-Impact Hero Section */}
      {/* ========================================================================= */}
      <section className="relative pt-16 pb-20 lg:pt-28 lg:pb-32 flex flex-col justify-center items-center z-10">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8 relative">
          
          {/* Geometric Motif Graphic (Radial Glow Centered Behind) */}
          <div className="absolute inset-0 -top-16 flex items-center justify-center pointer-events-none z-0">
            <div className="w-[320px] h-[320px] rounded-full bg-[#A5BBFC]/20 dark:bg-[#3a3f5c]/25 blur-[90px] mix-blend-screen" />
            <div className="absolute w-[200px] h-[200px] border border-dashed border-[#818cf8]/25 rounded-full animate-glow opacity-30" />
            <div className="absolute w-[300px] h-[300px] border border-dotted border-zinc-400/10 rounded-full opacity-40" />
          </div>

          <div className="relative z-10 space-y-6">
            {/* Subheader Framed by Horizontal Divider Rules */}
            <div className="flex items-center justify-center gap-4">
              <div className="w-8 h-px bg-zinc-300 dark:bg-zinc-800" />
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#3a3f5c] dark:text-[#818cf8]">
                India's Sovereign AI Platform
              </span>
              <div className="w-8 h-px bg-zinc-300 dark:bg-zinc-800" />
            </div>

            {/* Main Elegant High-Contrast Serif/Sans Header */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[110%] text-[#1e2033] dark:text-white">
              Sovereign Cloud diagnostics. <br className="hidden sm:inline" />
              {isDark ? (
                <FuzzyText
                  baseIntensity={0.2}
                  hoverIntensity={0.5}
                  enableHover
                  fontSize="clamp(2rem, 5vw, 4rem)"
                  fontWeight={900}
                  color="#818cf8"
                  className="inline-block"
                >
                  Optimized in Real-time.
                </FuzzyText>
              ) : (
                <span className="bg-linear-to-r from-[#3a3f5c] to-[#818cf8] bg-clip-text text-transparent">
                  Optimized in Real-time.
                </span>
              )}
            </h1>

            {/* Explicit 2-Line Business Value Statement */}
            <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
              Estimate EC2 compute runrates and isolate network log failures inside localized boundaries. <br className="hidden md:inline" />
              Deploy secure backend triggers and automate server savings forecasts instantly.
            </p>

            {/* Side-by-Side Dual Button Grouping */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <button
                onClick={() => onViewChange(isAuthenticated ? 'dashboard' : 'register')}
                className="px-8 py-3.5 text-xs font-semibold rounded-full btn-premium-dark flex items-center gap-2 cursor-pointer"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
              
              <button
                onClick={onLaunchDemo}
                className="px-8 py-3.5 text-xs font-bold rounded-full border border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-white/20 dark:bg-zinc-950/20 text-[#1e2033] dark:text-white transition-all active:scale-[0.97] duration-150 flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current text-[#3a3f5c] dark:text-[#818cf8]" />
                Launch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. Moving Partner/Client Marquee */}
      {/* ========================================================================= */}
      <section className="py-8 border-t border-b border-zinc-200/50 dark:border-zinc-900/40 bg-white/30 dark:bg-zinc-950/20 relative z-10 overflow-hidden">
        <div className="w-full relative [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
          <div className="animate-marquee flex items-center gap-16 py-2">
            {/* Repeated lists of items to make it truly infinite */}
            {marqueeItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 opacity-60 hover:opacity-100 transition-opacity duration-300 group cursor-pointer"
              >
                <div className="p-2 bg-zinc-100 dark:bg-zinc-900/60 rounded-xl filter grayscale contrast-125 brightness-90 group-hover:grayscale-0 transition-all duration-300">
                  {item.icon}
                </div>
                <span className="font-bold text-xs tracking-wider uppercase text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. Interactive Product Action Showcase (Playground) */}
      {/* ========================================================================= */}
      <section id="playground" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#3a3f5c] dark:text-[#818cf8]">
              Interactive Showcase
            </span>
            {isDark ? (
              <ScrollFloat
                animationDuration={0.8}
                ease="back.out(1.5)"
                scrollStart="top bottom-=10%"
                scrollEnd="bottom center"
                stagger={0.02}
                containerClassName="text-3xl font-extrabold tracking-tight text-white flex justify-center"
                textClassName="text-white text-3xl sm:text-4xl font-black"
              >
                Test Our Diagnostics Playground
              </ScrollFloat>
            ) : (
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1e2033] dark:text-white">
                Test Our Diagnostics Playground
              </h2>
            )}
            <p className="text-xs sm:text-sm text-zinc-500 max-w-lg mx-auto">
              Simulate cloud workload exceptions and see localized sovereign diagnostic responses in real-time.
            </p>
          </div>

          {/* Interactive Window Panel */}
          <div className="glass-card rounded-[32px] overflow-hidden shadow-xl border border-zinc-200/40 dark:border-zinc-800/35">
            
            {/* Top Bar Switcher Tabs */}
            <div className="flex flex-wrap border-b border-zinc-200/40 dark:border-zinc-800/40 bg-zinc-100/50 dark:bg-zinc-900/30 p-2 gap-1.5">
              
              <button
                onClick={() => handlePlaygroundTabChange('audio')}
                className={`flex-1 min-w-[120px] px-4 py-3 rounded-2xl text-xs font-bold tracking-wide uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                  playgroundTab === 'audio'
                    ? 'bg-white dark:bg-[#3a3f5c] text-[#3a3f5c] dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-white'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                Audio
              </button>

              <button
                onClick={() => handlePlaygroundTabChange('text')}
                className={`flex-1 min-w-[120px] px-4 py-3 rounded-2xl text-xs font-bold tracking-wide uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                  playgroundTab === 'text'
                    ? 'bg-white dark:bg-[#3a3f5c] text-[#3a3f5c] dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                Text
              </button>

              <button
                onClick={() => handlePlaygroundTabChange('agent')}
                className={`flex-1 min-w-[120px] px-4 py-3 rounded-2xl text-xs font-bold tracking-wide uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                  playgroundTab === 'agent'
                    ? 'bg-white dark:bg-[#3a3f5c] text-[#3a3f5c] dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-white'
                }`}
              >
                <Bot className="w-4 h-4" />
                Agent
              </button>

              <button
                onClick={() => handlePlaygroundTabChange('vision')}
                className={`flex-1 min-w-[120px] px-4 py-3 rounded-2xl text-xs font-bold tracking-wide uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                  playgroundTab === 'vision'
                    ? 'bg-white dark:bg-[#3a3f5c] text-[#3a3f5c] dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-white'
                }`}
              >
                <Eye className="w-4 h-4" />
                Vision
              </button>
            </div>

            {/* Split Panel Structure */}
            <div className="grid grid-cols-1 lg:grid-cols-12">
              
              {/* Left Side: Text Input & Configuration */}
              <div className="lg:col-span-7 p-6 sm:p-8 space-y-4 border-r border-zinc-200/20 dark:border-zinc-800/20">
                <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                  <span>Interactive Log Input Console</span>
                  <span>Editable Panel</span>
                </div>
                <textarea
                  className="w-full h-64 p-4 rounded-2xl border border-zinc-250 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-[#818cf8] text-zinc-800 dark:text-zinc-200 leading-relaxed resize-none"
                  value={playgroundText}
                  onChange={(e) => setPlaygroundText(e.target.value)}
                />
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Characters: {playgroundText.length}</span>
                  <span className="flex items-center gap-1.5 text-[#83C040]">
                    <CheckCircle className="w-3.5 h-3.5" /> Engine Ready
                  </span>
                </div>
              </div>

              {/* Right Side: Status elements & Metadata */}
              <div className="lg:col-span-5 p-6 sm:p-8 bg-zinc-50/50 dark:bg-zinc-900/10 space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Diagnostic Status</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-[#83C040]/15 text-[#83C040]">
                      {playgroundMeta.status}
                    </span>
                  </div>

                  {/* Indicators Grid */}
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="p-3 bg-white/40 dark:bg-zinc-900/40 border border-zinc-200/30 dark:border-zinc-800/30 rounded-xl">
                      <p className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Execution Latency</p>
                      <p className="text-base font-extrabold text-[#1e2033] dark:text-zinc-200 mt-1">{playgroundMeta.latency}</p>
                    </div>
                    <div className="p-3 bg-white/40 dark:bg-zinc-900/40 border border-zinc-200/30 dark:border-zinc-800/30 rounded-xl">
                      <p className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Parser Confidence</p>
                      <p className="text-base font-extrabold text-[#1e2033] dark:text-zinc-200 mt-1">{playgroundMeta.confidence}</p>
                    </div>
                  </div>

                  {/* Findings list */}
                  <div className="space-y-2">
                    <p className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Engine Insights</p>
                    <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                      {playgroundMeta.findings.map((finding, idx) => (
                        <div key={idx} className="flex gap-2 items-start">
                          <ChevronRight className="w-3.5 h-3.5 text-[#818cf8] shrink-0 mt-0.5" />
                          <span>{finding}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-200/30 dark:border-zinc-800/30">
                  <button
                    onClick={() => onViewChange('register')}
                    className="w-full py-3 text-xs font-semibold rounded-full btn-premium-dark flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Deploy Parser Configuration <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. Developer Code Block Interface */}
      {/* ========================================================================= */}
      <section id="developer" className="py-24 bg-zinc-100/30 dark:bg-zinc-900/20 relative z-10 border-t border-b border-zinc-200/20 dark:border-zinc-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Block: Structural Typography */}
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-[#83C040]">
              Developer Native APIs
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1e2033] dark:text-white leading-[115%]">
              Add Sovereign diagnostics <br />
              to your app in minutes
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
              Integrate localized models seamlessly via Python, Node.js or direct REST requests. Setup secure API gateway peering routes with standard IAM credentials.
            </p>
            
            {/* Bullet value calls */}
            <div className="space-y-3 pt-2">
              <div className="flex gap-3 items-center">
                <div className="w-5 h-5 rounded-full bg-[#83C040]/10 flex items-center justify-center text-[#83C040]">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Zero third-party telemetry loops</span>
              </div>
              <div className="flex gap-3 items-center">
                <div className="w-5 h-5 rounded-full bg-[#83C040]/10 flex items-center justify-center text-[#83C040]">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Sub-100ms request execution speed</span>
              </div>
              <div className="flex gap-3 items-center">
                <div className="w-5 h-5 rounded-full bg-[#83C040]/10 flex items-center justify-center text-[#83C040]">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">SOC2 compliant local VPC end-taps</span>
              </div>
            </div>
          </div>

          {/* Right Block: Browser Terminal Mockup */}
          <div className="lg:col-span-7">
            <div className="w-full border border-zinc-200/50 dark:border-zinc-800/40 bg-zinc-950 rounded-2xl shadow-2xl overflow-hidden font-mono">
              
              {/* Terminal Window Header Tab picker */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#1e2033]/60 dark:bg-zinc-900 border-b border-zinc-800/80">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => setCodeTab('python')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${
                      codeTab === 'python' ? 'bg-[#3a3f5c] text-white' : 'text-zinc-500 hover:text-zinc-350'
                    }`}
                  >
                    main.py (Python)
                  </button>
                  <button
                    onClick={() => setCodeTab('js')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${
                      codeTab === 'js' ? 'bg-[#3a3f5c] text-white' : 'text-zinc-500 hover:text-zinc-350'
                    }`}
                  >
                    index.js (JS)
                  </button>
                  <button
                    onClick={() => setCodeTab('curl')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${
                      codeTab === 'curl' ? 'bg-[#3a3f5c] text-white' : 'text-zinc-500 hover:text-zinc-350'
                    }`}
                  >
                    diagnose.sh (cURL)
                  </button>
                </div>
              </div>

              {/* Editor Container with Syntax-highlighted code */}
              <div className="p-6 text-xs text-zinc-300 overflow-x-auto min-h-[220px]">
                {codeTab === 'python' && (
                  <pre className="space-y-1">
                    <div><span className="text-rose-400">import</span> <span className="text-zinc-150 font-bold">cloudinsight</span></div>
                    <div className="text-zinc-500"># Initialise secure sovereign client</div>
                    <div>client = cloudinsight.<span className="text-emerald-450 font-semibold">Client</span>(</div>
                    <div>    api_key=<span className="text-amber-300 font-normal">"sk_sovereign_1029"</span>,</div>
                    <div>    region=<span className="text-amber-300 font-normal">"in-west-1"</span></div>
                    <div>)</div>
                    <div className="text-zinc-500"># Analyze application diagnostic log streams</div>
                    <div>analysis = client.logs.<span className="text-blue-400 font-semibold">analyze</span>(</div>
                    <div>    stream=<span className="text-amber-300 font-normal">"./server.log"</span>,</div>
                    <div>    auto_remediate=<span className="text-rose-400">True</span></div>
                    <div>)</div>
                    <div><span className="text-rose-400">print</span>(f<span className="text-amber-300 font-normal">"Diagnostics: {`{analysis.issue_type}`} | Severity: {`{analysis.severity}`}"</span>)</div>
                  </pre>
                )}

                {codeTab === 'js' && (
                  <pre className="space-y-1">
                    <div><span className="text-rose-400">import</span> {`{ CloudInsight }`} <span className="text-rose-400">from</span> <span className="text-amber-300 font-normal">'@cloudinsight/lite'</span>;</div>
                    <div className="text-zinc-500">// Establish client peering session</div>
                    <div><span className="text-rose-400">const</span> client = <span className="text-rose-400">new</span> <span className="text-emerald-450 font-semibold">CloudInsight</span>({`{`}</div>
                    <div>  apiKey: process.env.SOVEREIGN_KEY,</div>
                    <div>  region: <span className="text-amber-300 font-normal">'in-west-1'</span></div>
                    <div>{`}`});</div>
                    <div className="text-zinc-500">// Run real-time compute savings audit</div>
                    <div><span className="text-rose-400">const</span> savings = <span className="text-rose-400">await</span> client.cost.<span className="text-blue-400 font-semibold">estimate</span>({`{`}</div>
                    <div>  resource: <span className="text-amber-300 font-normal">'standard-resource'</span>,</div>
                    <div>  hours: <span className="text-amber-300 font-normal">720</span></div>
                    <div>{`}`});</div>
                    <div>console.<span className="text-blue-400">log</span>(<span className="text-amber-300 font-normal">`Suggested Monthly Savings: $`</span> + savings.suggestedSavings);</div>
                  </pre>
                )}

                {codeTab === 'curl' && (
                  <pre className="space-y-1">
                    <div><span className="text-emerald-450 font-bold">curl</span> -X POST <span className="text-amber-300 font-normal">"https://api.cloudinsight.io/v1/diagnose"</span> \</div>
                    <div>  -H <span className="text-amber-300 font-normal">"Authorization: Bearer sk_sovereign_1029"</span> \</div>
                    <div>  -H <span className="text-amber-300 font-normal">"Content-Type: application/json"</span> \</div>
                    <div>  -d <span className="text-amber-300 font-normal">'{`{`}</span></div>
                    <div>    <span className="text-blue-400">"service"</span>: <span className="text-amber-300 font-normal">"lambda-compute-node"</span>,</div>
                    <div>    <span className="text-blue-400">"log_chunk"</span>: <span className="text-amber-300 font-normal">"MongoDB connection timed out after 30000ms"</span></div>
                    <div>  <span className="text-amber-300 font-normal">{`}`}</span>'</div>
                  </pre>
                )}
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. Media / Video Showpiece Framework */}
      {/* ========================================================================= */}
      <section id="media" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Column: High-density value text blocks with callouts */}
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-[#3a3f5c] dark:text-[#818cf8]">
              Product Overview
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1e2033] dark:text-white leading-[115%]">
              Unify infrastructure audit <br />
              and exceptions tracking
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
              Consolidate your engineering operations. Read real-time latency ticks, audit cloud expenditures on live schedules, and remediation logic through decoupled API pathways.
            </p>

            {/* High density value callouts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 rounded-2xl flex gap-3.5 items-start">
                <TrendingDown className="w-5 h-5 text-[#83C040] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#1e2033] dark:text-white">Runrate Audits</p>
                  <p className="text-[10px] text-zinc-500">Calculate instant savings plan offsets based on actual hour spikes.</p>
                </div>
              </div>
              
              <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 rounded-2xl flex gap-3.5 items-start">
                <Sparkles className="w-5 h-5 text-[#818cf8] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#1e2033] dark:text-white">Decoupled Triggers</p>
                  <p className="text-[10px] text-zinc-500">Process complex traces with independent lightweight AWS Lambda modules.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Beautifully rounded aspect-ratio mockup with play button */}
          <div className="lg:col-span-6">
            <div className="relative w-full aspect-video rounded-[36px] overflow-hidden border border-zinc-200/40 dark:border-zinc-800/40 bg-zinc-950 shadow-2xl flex items-center justify-center group">
              
              {/* Play video overlay content */}
              {!isVideoPlaying ? (
                <>
                  <div className="absolute inset-0 bg-linear-to-tr from-[#3a3f5c]/70 to-[#1e2033]/90 z-10 flex flex-col items-center justify-center space-y-4">
                    <button
                      onClick={() => setIsVideoPlaying(true)}
                      className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#1e2033] cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-lg group-hover:bg-white z-20"
                    >
                      <Play className="w-6 h-6 fill-current text-[#3a3f5c] ml-1" />
                    </button>
                    <p className="text-xs font-semibold text-white/80 tracking-wide uppercase">Watch Platform Demo</p>
                  </div>
                  {/* Visual mockup graphics inside panel */}
                  <div className="w-full h-full opacity-35 bg-[radial-gradient(circle_at_center,#818cf8_0%,transparent_75%)] absolute inset-0 flex items-center justify-center">
                    <div className="w-64 h-64 border border-zinc-700/30 rounded-full animate-glow" />
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-[#1e2033] z-25 flex flex-col justify-between p-6 animate-fade-in font-mono text-[10px] text-zinc-400">
                  <div className="flex justify-between items-center border-b border-zinc-800/60 pb-3">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-[#83C040] animate-pulse" /> Live Stream Monitor
                    </span>
                    <button
                      onClick={() => setIsVideoPlaying(false)}
                      className="text-xs hover:text-white px-2 py-0.5 border border-zinc-800 rounded bg-zinc-900 cursor-pointer"
                    >
                      Reset Demo
                    </button>
                  </div>
                  
                  {/* Dynamic Graph mock simulation */}
                  <div className="flex-1 flex items-end gap-1.5 py-4 px-2">
                    <div className="w-full bg-[#83C040]/30 h-[40%] rounded animate-pulse" />
                    <div className="w-full bg-[#818cf8]/50 h-[85%] rounded animate-pulse" />
                    <div className="w-full bg-[#83C040]/40 h-[60%] rounded animate-pulse" />
                    <div className="w-full bg-[#818cf8]/70 h-[95%] rounded" />
                    <div className="w-full bg-zinc-800 h-[30%] rounded" />
                    <div className="w-full bg-[#83C040]/50 h-[50%] rounded animate-pulse" />
                    <div className="w-full bg-[#818cf8]/40 h-[70%] rounded animate-pulse" />
                  </div>

                  <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-bold">
                    <span>Audit complete: $410 estimated annual savings</span>
                    <span>98% engine load healthy</span>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. Core Value & Trust Pillars Grid */}
      {/* ========================================================================= */}
      <section id="values" className="py-24 bg-zinc-150/30 dark:bg-zinc-900/20 relative z-10 border-t border-b border-zinc-200/20 dark:border-zinc-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#83C040]">
              Operational Pillars
            </span>
            {isDark ? (
              <ScrollFloat
                animationDuration={0.8}
                ease="back.out(1.5)"
                scrollStart="top bottom-=10%"
                scrollEnd="bottom center"
                stagger={0.02}
                containerClassName="text-3xl font-extrabold tracking-tight text-white flex justify-center"
                textClassName="text-white text-3xl sm:text-4xl font-black"
              >
                Trust & Architecture Standards
              </ScrollFloat>
            ) : (
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1e2033] dark:text-white">
                Trust & Architecture Standards
              </h2>
            )}
            <p className="text-xs sm:text-sm text-zinc-500 max-w-lg mx-auto">
              Our core engineering infrastructure is designed from the ground up for strict data isolation and compliant runtime execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Pillar 1 */}
            <div className="glass-card rounded-[32px] p-8 border border-zinc-200/45 dark:border-zinc-800/45 shadow-xs space-y-5 hover:-translate-y-1 hover:border-zinc-350 dark:hover:border-zinc-700 transition-all duration-300">
              <div className="p-3 bg-[#818cf8]/10 text-[#818cf8] rounded-2xl w-fit">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-extrabold text-lg text-[#1e2033] dark:text-white">Sovereign by design</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  All metrics, parameters, and application traces reside natively within your VPC sandbox boundary. No outbound leaks.
                </p>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="glass-card rounded-[32px] p-8 border border-zinc-200/45 dark:border-zinc-800/45 shadow-xs space-y-5 hover:-translate-y-1 hover:border-zinc-350 dark:hover:border-zinc-700 transition-all duration-300">
              <div className="p-3 bg-[#83C040]/10 text-[#83C040] rounded-2xl w-fit">
                <Cpu className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-extrabold text-lg text-[#1e2033] dark:text-white">State of the art models</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Access lightweight local parser algorithms trained specifically to scan standard operational cloud logs and trace headers.
                </p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="glass-card rounded-[32px] p-8 border border-zinc-200/45 dark:border-zinc-800/45 shadow-xs space-y-5 hover:-translate-y-1 hover:border-zinc-350 dark:hover:border-zinc-700 transition-all duration-300">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl w-fit">
                <Star className="w-6 h-6 fill-current" />
              </div>
              <div className="space-y-2">
                <h3 className="font-extrabold text-lg text-[#1e2033] dark:text-white">99.99% Node Availability</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Our system maintains a decentralized network layer utilizing redundant cluster routes for robust, fault-tolerant operations.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. Full-Stack Platform Layers */}
      {/* ========================================================================= */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="space-y-16">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#3a3f5c] dark:text-[#818cf8]">
              Technology Tier
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1e2033] dark:text-white">
              Full-Stack Platform Architecture
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 max-w-lg mx-auto">
              Our layers map operations sequentially to prevent latency leakage and secure customer runtime pipelines.
            </p>
          </div>

          {/* Layer Cards Stack */}
          <div className="space-y-6 max-w-5xl mx-auto">
            
            {/* Layer 1 */}
            <div className="glass-card rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:scale-[1.01] transition-transform duration-200">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-linear-to-tr from-[#3a3f5c] to-[#1e2033] rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm font-bold">
                  01
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-[#1e2033] dark:text-white">Population Applications</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Diagnostic Portal Console, Cost Estimator Interface, Cloud CLI endpoints.</p>
                </div>
              </div>
              <span className="px-3.5 py-1.5 rounded-full text-[10px] font-bold bg-[#83C040]/15 text-[#83C040]">
                User Facing Layer
              </span>
            </div>

            {/* Layer 2 */}
            <div className="glass-card rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:scale-[1.01] transition-transform duration-200">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-linear-to-tr from-[#3a3f5c] to-[#1e2033] rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm font-bold">
                  02
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-[#1e2033] dark:text-white">Base Models & Parsing Engines</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Lightweight fine-tuned transformer weights, heuristic log exceptions classifiers.</p>
                </div>
              </div>
              <span className="px-3.5 py-1.5 rounded-full text-[10px] font-bold bg-[#818cf8]/15 text-[#818cf8]">
                Intelligence Core
              </span>
            </div>

            {/* Layer 3 */}
            <div className="glass-card rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:scale-[1.01] transition-transform duration-200">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-linear-to-tr from-[#3a3f5c] to-[#1e2033] rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm font-bold">
                  03
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-[#1e2033] dark:text-white">Edge Infrastructure nodes</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Secure hardware enclaves, localized peering compute arrays, private databases.</p>
                </div>
              </div>
              <span className="px-3.5 py-1.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500">
                Secure Sandboxes
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. Testimonial & Case Studies Highlight */}
      {/* ========================================================================= */}
      <section className="py-24 bg-zinc-100/30 dark:bg-zinc-900/20 relative z-10 border-t border-b border-zinc-200/20 dark:border-zinc-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#83C040]">
              Proven Outcomes
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1e2033] dark:text-white">
              Enterprise Success metrics
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 max-w-lg mx-auto">
              See how modern development departments audit cloud resources and save hours on triage debugging.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1 */}
            <div className="glass-card rounded-[32px] p-8 border border-zinc-200/45 dark:border-zinc-800/45 shadow-xs flex flex-col justify-between min-h-[260px] group hover:border-[#818cf8]/50 transition-colors">
              <div className="space-y-4">
                {/* Company Logo mock */}
                <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-60 transition-opacity">
                  <Cloud className="w-4 h-4 text-zinc-600 dark:text-white" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-800 dark:text-white">CoreCloud Systems</span>
                </div>
                
                <h3 className="text-3xl sm:text-4xl font-black text-[#1e2033] dark:text-white tracking-tight">
                  3x Increase
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  DevOps departments accelerated diagnostic iterations by automating log parsing.
                </p>
              </div>
              <a href="#playground" className="text-xs font-bold text-[#3a3f5c] dark:text-[#818cf8] underline mt-6 block">
                Read Case Study
              </a>
            </div>

            {/* Card 2 */}
            <div className="glass-card rounded-[32px] p-8 border border-zinc-200/45 dark:border-zinc-800/45 shadow-xs flex flex-col justify-between min-h-[260px] group hover:border-[#818cf8]/50 transition-colors">
              <div className="space-y-4">
                {/* Company Logo mock */}
                <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-60 transition-opacity">
                  <Server className="w-4 h-4 text-zinc-600 dark:text-white" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-800 dark:text-white">Apex Database</span>
                </div>
                
                <h3 className="text-3xl sm:text-4xl font-black text-[#1e2033] dark:text-white tracking-tight">
                  Millions saved
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Compute schedules optimized dynamically utilizing real-time runrate models.
                </p>
              </div>
              <a href="#playground" className="text-xs font-bold text-[#3a3f5c] dark:text-[#818cf8] underline mt-6 block">
                Read Case Study
              </a>
            </div>

            {/* Card 3 */}
            <div className="glass-card rounded-[32px] p-8 border border-zinc-200/45 dark:border-zinc-800/45 shadow-xs flex flex-col justify-between min-h-[260px] group hover:border-[#818cf8]/50 transition-colors">
              <div className="space-y-4">
                {/* Company Logo mock */}
                <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-60 transition-opacity">
                  <Zap className="w-4 h-4 text-zinc-600 dark:text-white" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-800 dark:text-white">Lightning Engine</span>
                </div>
                
                <h3 className="text-3xl sm:text-4xl font-black text-[#1e2033] dark:text-white tracking-tight">
                  99.9% uptime
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Resolved network exceptions autonomously before scaling queues backed up.
                </p>
              </div>
              <a href="#playground" className="text-xs font-bold text-[#3a3f5c] dark:text-[#818cf8] underline mt-6 block">
                Read Case Study
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. Final Action CTA & Multi-Column Footer */}
      {/* ========================================================================= */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative z-10" id="subscribe">
        {/* Massive dark-indigo gradient block */}
        <div className="max-w-5xl mx-auto rounded-[48px] bg-gradient-to-b from-[#3a3f5c] to-[#1e2033] p-8 sm:p-16 relative overflow-hidden shadow-2xl border border-white/10">
          
          {/* Glowing nested graphic center */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#818cf8_0%,transparent_60%)] opacity-35 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] border border-[#818cf8]/15 rounded-full pointer-events-none animate-glow" />

          <div className="relative z-10 max-w-2xl mx-auto text-center space-y-8">
            <span className="px-3 py-1 rounded-full text-[9px] font-bold uppercase bg-[#83C040]/20 text-[#83C040] border border-[#83C040]/30 tracking-widest">
              Join Our Network
            </span>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight text-white">
              Optimize sovereign compute workloads today
            </h3>
            <p className="text-xs text-zinc-350 max-w-md mx-auto leading-relaxed">
              Subscribe to alert streams to get real-time health notifications and optimization triggers directly in your sandbox console.
            </p>
            
            {subscribed ? (
              <div className="p-4 bg-[#83C040]/15 border border-[#83C040]/30 text-xs font-bold text-[#83C040] rounded-xl animate-fade-in inline-block">
                Success! You are now subscribed to CloudInsight Lite alert streams.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <div className="relative w-full max-w-md">
                  <Mail className="absolute left-4 top-3.5 w-4 h-4 text-zinc-400" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter your corporate email address"
                    className="w-full text-xs rounded-full border border-white/10 bg-black/40 pl-11 pr-4 py-3.5 outline-hidden focus:ring-1 focus:ring-[#818cf8] text-white transition-all shadow-inner"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3.5 text-xs font-bold text-[#1e2033] bg-[#83C040] hover:bg-[#72a637] active:scale-[0.97] transition-all rounded-full cursor-pointer whitespace-nowrap shadow-md"
                >
                  Subscribe
                </button>
              </form>
            )}

            {/* Sub-CTAs */}
            <div className="flex justify-center items-center gap-6 pt-4 text-xs font-semibold text-zinc-400">
              <button onClick={() => onViewChange('register')} className="hover:text-white transition-colors cursor-pointer bg-transparent border-0">Create Free Sandbox</button>
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
              <button onClick={onLaunchDemo} className="hover:text-white transition-colors cursor-pointer bg-transparent border-0">Access Demo Mode</button>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Column Footer Grid */}
      <footer className="mt-auto border-t border-zinc-200/50 dark:border-zinc-800/40 bg-white/40 dark:bg-zinc-950/20 backdrop-blur-md transition-colors py-16 text-[11px] text-zinc-500 dark:text-zinc-450 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-12 gap-10">
          
          {/* Logo and company intro */}
          <div className="col-span-2 md:col-span-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-linear-to-tr from-[#3a3f5c] to-[#1e2033] text-white">
                <Cloud className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-sm tracking-tight text-[#1e2033] dark:text-white">
                CloudInsight <span className="text-[9px] text-[#83C040] font-semibold uppercase">Lite</span>
              </span>
            </div>
            <p className="text-zinc-400 dark:text-zinc-500 leading-relaxed font-normal">
              India's premium cloud audit engine. Select optimal instances, analyze trace files, and secure VPC subnets locally.
            </p>
          </div>

          {/* Col 2 */}
          <div className="col-span-1 md:col-span-2 space-y-3.5">
            <h5 className="font-bold text-[#1e2033] dark:text-white text-xs">Products</h5>
            <ul className="space-y-2">
              <li><a href="#playground" className="hover:text-[#3a3f5c] dark:hover:text-white transition-colors">Cost Estimator</a></li>
              <li><a href="#playground" className="hover:text-[#3a3f5c] dark:hover:text-white transition-colors">Log Classifiers</a></li>
              <li><a href="#playground" className="hover:text-[#3a3f5c] dark:hover:text-white transition-colors">Audit Scheduler</a></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="col-span-1 md:col-span-2 space-y-3.5">
            <h5 className="font-bold text-[#1e2033] dark:text-white text-xs">APIs</h5>
            <ul className="space-y-2">
              <li><a href="#developer" className="hover:text-[#3a3f5c] dark:hover:text-white transition-colors">Python SDK</a></li>
              <li><a href="#developer" className="hover:text-[#3a3f5c] dark:hover:text-white transition-colors">Node REST Library</a></li>
              <li><a href="#developer" className="hover:text-[#3a3f5c] dark:hover:text-white transition-colors">cURL Reference</a></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="col-span-1 md:col-span-2 space-y-3.5">
            <h5 className="font-bold text-[#1e2033] dark:text-white text-xs">Developers</h5>
            <ul className="space-y-2">
              <li><a href="#developer" className="hover:text-[#3a3f5c] dark:hover:text-white transition-colors">API Docs</a></li>
              <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#3a3f5c] dark:hover:text-white transition-colors">GitHub Repository</a></li>
              <li><a href="#values" className="hover:text-[#3a3f5c] dark:hover:text-white transition-colors">System Security</a></li>
            </ul>
          </div>

          {/* Col 5 */}
          <div className="col-span-1 md:col-span-2 space-y-3.5">
            <h5 className="font-bold text-[#1e2033] dark:text-white text-xs">Socials</h5>
            <div className="flex gap-2">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <svg className="w-4 h-4 text-zinc-700 dark:text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <svg className="w-4 h-4 text-zinc-700 dark:text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>
              </a>
            </div>
          </div>
        </div>

        {/* copyright string baseline */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-zinc-400 dark:text-zinc-600 border-t border-zinc-200/30 dark:border-zinc-900/40 mt-10 pt-6">
          <span>All rights reserved &copy; {new Date().getFullYear()} CloudInsight.io</span>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
