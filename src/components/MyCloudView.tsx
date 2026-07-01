import React, { useState, useEffect } from 'react';
import {
  fetchMyCloudStatus,
  connectMyCloudAccount,
  disconnectMyCloudAccount,
  fetchMyCloudInventory,
  fetchMyCloudCosts,
  fetchMyCloudCredits,
  fetchMyCloudRecommendations,
  fetchMyCloudHealth
} from '../utils/api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Cloud,
  Server,
  Activity,
  Cpu,
  Database,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Layers,
  Brain,
  Lock,
  RefreshCw,
  Trash2,
  LockKeyhole,
  TrendingUp,
  Link,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface MyCloudViewProps {
  onAddToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const COLORS = ['#FF9900', '#5E6AD2', '#00A1C9', '#10B981', '#8B5CF6', '#EF4444', '#EC4899'];

export const MyCloudView: React.FC<MyCloudViewProps> = ({ onAddToast }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'connect' | 'resources' | 'costs' | 'credits' | 'recommendations' | 'health'>('overview');
  
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [accessKeyId, setAccessKeyId] = useState('');
  const [secretAccessKey, setSecretAccessKey] = useState('');
  const [region, setRegion] = useState('us-east-1');
  const [isDemo, setIsDemo] = useState(false);
  const [maskedKey, setMaskedKey] = useState('');
  
  // Data states
  const [inventory, setInventory] = useState<any>(null);
  const [costs, setCosts] = useState<any>(null);
  const [credits, setCredits] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [healthData, setHealthData] = useState<any>(null);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [reloadingAI, setReloadingAI] = useState(false);
  const [activeResourceSubTab, setActiveResourceSubTab] = useState<'ec2' | 'rds' | 'lambda' | 's3' | 'ebs' | 'eip' | 'elb'>('ec2');

  const loadConnectionStatus = async () => {
    try {
      const res = await fetchMyCloudStatus();
      if (res.connected) {
        setIsConnected(true);
        setMaskedKey(res.access_key_id);
        setRegion(res.region);
        setIsDemo(res.is_demo);
        return true;
      } else {
        setIsConnected(false);
        setIsDemo(false);
        return false;
      }
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const loadAllDashboardData = async () => {
    setLoading(true);
    try {
      const [invRes, costRes, credRes, recRes, healthRes] = await Promise.all([
        fetchMyCloudInventory(),
        fetchMyCloudCosts(),
        fetchMyCloudCredits(),
        fetchMyCloudRecommendations(),
        fetchMyCloudHealth()
      ]);

      if (invRes.connected) {
        setInventory(invRes);
      }
      if (costRes.connected) {
        setCosts(costRes);
      }
      if (credRes.connected) {
        setCredits(credRes);
      }
      if (recRes.connected) {
        setRecommendations(recRes.recommendations || []);
      }
      if (healthRes.connected) {
        setHealthData(healthRes);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      onAddToast("Error fetching AWS dashboard metrics.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const connected = await loadConnectionStatus();
      if (connected) {
        await loadAllDashboardData();
      } else {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);
    try {
      const res = await connectMyCloudAccount(accessKeyId, secretAccessKey, region);
      if (res.success) {
        onAddToast(res.message || "AWS Account connected successfully.", "success");
        setAccessKeyId('');
        setSecretAccessKey('');
        const connected = await loadConnectionStatus();
        if (connected) {
          await loadAllDashboardData();
          setActiveTab('overview');
        }
      } else {
        onAddToast(res.message || "Failed to connect AWS Account.", "error");
      }
    } catch (err) {
      onAddToast("Network error trying to connect AWS Account.", "error");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect this AWS account? This will clear credentials from the server.")) return;
    try {
      const res = await disconnectMyCloudAccount();
      if (res.success) {
        onAddToast("AWS Account disconnected.", "info");
        setIsConnected(false);
        setIsDemo(false);
        setInventory(null);
        setCosts(null);
        setCredits(null);
        setRecommendations([]);
        setHealthData(null);
      } else {
        onAddToast(res.message || "Failed to disconnect AWS account.", "error");
      }
    } catch (err) {
      onAddToast("Network error trying to disconnect AWS Account.", "error");
    }
  };

  const handleDemoConnect = async () => {
    setConnecting(true);
    try {
      const res = await connectMyCloudAccount('demo', 'demo', 'us-east-1');
      if (res.success) {
        onAddToast("Connected in Demonstration Mode successfully.", "success");
        const connected = await loadConnectionStatus();
        if (connected) {
          await loadAllDashboardData();
          setActiveTab('overview');
        }
      }
    } catch (err) {
      onAddToast("Failed to start Demonstration Mode.", "error");
    } finally {
      setConnecting(false);
    }
  };

  const handleReloadAI = async () => {
    setReloadingAI(true);
    onAddToast("Triggering live Gemini cloud audits...", "info");
    try {
      const [recRes, healthRes] = await Promise.all([
        fetchMyCloudRecommendations(),
        fetchMyCloudHealth()
      ]);
      if (recRes.connected) setRecommendations(recRes.recommendations || []);
      if (healthRes.connected) setHealthData(healthRes);
      onAddToast("AI Audit reports refreshed.", "success");
    } catch (e) {
      onAddToast("Failed to reload AI audits.", "error");
    } finally {
      setReloadingAI(false);
    }
  };

  // Format Recharts service cost breakdown
  const pieData = React.useMemo(() => {
    if (!costs || !costs.breakdown) return [];
    return Object.entries(costs.breakdown).map(([name, value]) => ({
      name,
      value: Number(value)
    })).filter(item => item.value > 0);
  }, [costs]);

  // Main UI shell loading state
  if (loading) {
    return (
      <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl p-8 shadow-xs flex flex-col items-center justify-center py-32 gap-4 animate-pulse">
        <RefreshCw className="w-8 h-8 text-zinc-400 animate-spin" />
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-zinc-800 dark:text-white">Loading AWS Dashboard Monitor...</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Retrieving configuration inventories and scanning resource states</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white flex items-center gap-2">
            <Cloud className="w-6 h-6 text-linear dark:text-aws" />
            My Cloud Monitoring
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time AWS inventory metrics, active Cost Explorer spends, remaining credits tracking, and Gemini-powered optimization reports.
          </p>
        </div>
        
        {isConnected && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center gap-1.5">
              {isDemo ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Demonstration Mode
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live AWS Account ({region})
                </>
              )}
            </span>
            <button
              onClick={handleDisconnect}
              className="p-1.5 text-zinc-400 hover:text-rose-500 transition-colors border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 cursor-pointer"
              title="Disconnect AWS Account"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto whitespace-nowrap scrollbar-none gap-2">
        {(['overview', 'connect', 'resources', 'costs', 'credits', 'recommendations', 'health'] as const).map((tab) => {
          if (!isConnected && tab !== 'connect') return null;
          const label = tab.charAt(0).toUpperCase() + tab.slice(1);
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2.5 px-4 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
                isActive
                  ? 'border-linear dark:border-aws text-zinc-900 dark:text-white font-bold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {tab === 'connect' && !isConnected ? 'Connect AWS' : label}
            </button>
          );
        })}
      </div>

      {/* View router blocks */}
      
      {/* 1. DISCONNECTED STATE CONNECT VIEW */}
      {!isConnected && activeTab !== 'connect' && (
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl p-12 text-center max-w-xl mx-auto space-y-6 shadow-xs">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-950 text-zinc-400 dark:text-zinc-500 rounded-full w-fit mx-auto border border-zinc-100 dark:border-zinc-800">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">AWS Account Required</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              Connect your AWS account using a read-only IAM configuration access key to populate this real-time monitoring dashboard, or click below to launch the dashboard using simulated data.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={() => setActiveTab('connect')}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-linear dark:bg-aws hover:opacity-90 rounded-lg cursor-pointer transition-opacity"
            >
              Configure Access Key
            </button>
            <button
              onClick={handleDemoConnect}
              disabled={connecting}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-250 dark:border-zinc-800 rounded-lg cursor-pointer transition-colors"
            >
              {connecting ? "Connecting..." : "Launch Demo Mode"}
            </button>
          </div>
        </div>
      )}

      {/* 2. CONNECTION CONFIGURATION TAB */}
      {activeTab === 'connect' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Connection Form */}
          <div className="lg:col-span-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <LockKeyhole className="w-4 h-4 text-zinc-400" />
                AWS IAM Connection Configuration
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Keys are stored locally in the portal database. We strictly recommend utilizing an IAM credential key with read-only access scopes.
              </p>
            </div>

            {isConnected ? (
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl flex gap-3.5 items-start">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs space-y-2">
                  <p className="font-semibold text-emerald-800 dark:text-emerald-400">AWS Credentials Active & Verified</p>
                  <ul className="space-y-1 text-zinc-500 dark:text-zinc-400 font-mono">
                    <li>Access Key ID: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{maskedKey}</span></li>
                    <li>Connected Region: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{region}</span></li>
                  </ul>
                  <button
                    onClick={handleDisconnect}
                    className="mt-2 text-rose-500 hover:underline font-semibold cursor-pointer"
                  >
                    Disconnect and Delete Keys
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConnect} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="aws-access-key" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      AWS Access Key ID
                    </label>
                    <input
                      id="aws-access-key"
                      type="text"
                      required
                      value={accessKeyId}
                      onChange={(e) => setAccessKeyId(e.target.value)}
                      placeholder="AKIAIOSFODNN7EXAMPLE"
                      className="w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 outline-hidden focus:ring-1 focus:ring-linear dark:focus:ring-aws text-zinc-900 dark:text-white transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="aws-secret-key" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      AWS Secret Access Key
                    </label>
                    <input
                      id="aws-secret-key"
                      type="password"
                      required
                      value={secretAccessKey}
                      onChange={(e) => setSecretAccessKey(e.target.value)}
                      placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                      className="w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 outline-hidden focus:ring-1 focus:ring-linear dark:focus:ring-aws text-zinc-900 dark:text-white transition-all"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="aws-region" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Default Region
                  </label>
                  <select
                    id="aws-region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 outline-hidden focus:ring-1 focus:ring-linear dark:focus:ring-aws text-zinc-900 dark:text-white transition-all cursor-pointer"
                  >
                    <option value="us-east-1">us-east-1 (N. Virginia)</option>
                    <option value="us-west-2">us-west-2 (Oregon)</option>
                    <option value="eu-west-1">eu-west-1 (Ireland)</option>
                    <option value="ap-south-1">ap-south-1 (Mumbai)</option>
                  </select>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={connecting}
                    className="px-4 py-2 text-xs font-semibold text-white bg-linear dark:bg-aws hover:opacity-90 rounded-lg cursor-pointer transition-opacity flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {connecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Verify and Save Connection"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDemoConnect}
                    disabled={connecting}
                    className="px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-250 dark:border-zinc-800 rounded-lg cursor-pointer transition-colors"
                  >
                    Launch Demo Mode
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Configuration Guide */}
          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-xs text-xs space-y-4">
            <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              IAM Policy Guide (Read-Only)
            </h4>
            <p className="text-zinc-500 dark:text-zinc-400">
              For complete security compliance, generate an IAM credential policy restricted to read-only capabilities. Here is the recommended IAM profile policy structure:
            </p>
            <pre className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-lg font-mono text-[9px] text-zinc-500 dark:text-zinc-400 overflow-x-auto">
{`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:Describe*",
        "rds:Describe*",
        "lambda:List*",
        "s3:List*",
        "elasticloadbalancing:Describe*",
        "ce:GetCostAndUsage",
        "ce:GetCostForecast"
      ],
      "Resource": "*"
    }
  ]
}`}
            </pre>
          </div>
        </div>
      )}

      {/* 3. OVERVIEW VIEW */}
      {isConnected && activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
          {/* Top Quick Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Today Spend */}
            <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col justify-between shadow-xs">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Today's spend</span>
                <span className="text-[9px] font-bold text-zinc-400 bg-zinc-50 dark:bg-zinc-950 px-1.5 py-0.5 rounded-md">AWS CE</span>
              </div>
              <div className="mt-2.5">
                <h4 className="text-2xl font-extrabold text-zinc-900 dark:text-white font-mono">
                  ${costs?.today_spend?.toFixed(2) || '0.00'}
                </h4>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3 text-emerald-500" /> Avg daily runrate
                </p>
              </div>
            </div>

            {/* MTD Spend */}
            <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col justify-between shadow-xs">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Month-to-Date Spend</span>
                <TrendingDown className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-2.5">
                <h4 className="text-2xl font-extrabold text-zinc-900 dark:text-white font-mono">
                  ${costs?.mtd_spend?.toFixed(2) || '0.00'}
                </h4>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">Accumulated current month</p>
              </div>
            </div>

            {/* Month Forecast */}
            <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col justify-between shadow-xs">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Forecast Monthly Spend</span>
                <TrendingUp className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2.5">
                <h4 className="text-2xl font-extrabold text-zinc-900 dark:text-white font-mono">
                  ${costs?.forecast_spend?.toFixed(2) || '0.00'}
                </h4>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">Estimated billing end of month</p>
              </div>
            </div>

            {/* AWS Credits status */}
            <div className={`p-5 border rounded-xl flex flex-col justify-between shadow-xs ${
              credits?.alert_active 
                ? 'bg-rose-50/10 border-rose-250 dark:border-rose-900/30' 
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
            }`}>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Credits Remaining</span>
                {credits?.alert_active && (
                  <span className="text-[9px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/20 px-1.5 py-0.5 rounded border border-rose-100 dark:border-rose-900/20 animate-pulse">Low</span>
                )}
              </div>
              <div className="mt-2.5">
                <h4 className="text-2xl font-extrabold text-zinc-900 dark:text-white font-mono">
                  ${credits?.credits_remaining?.toFixed(2) || '0.00'}
                </h4>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                  {credits?.remaining_percentage?.toFixed(0)}% of ${credits?.credits_total} total
                </p>
              </div>
            </div>
          </div>

          {/* Quick Resource Summary Grid */}
          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="font-semibold text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">AWS Inventory Overview</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
              {[
                { name: 'EC2 Running', val: inventory?.counts?.ec2_running, icon: <Cpu className="w-4 h-4 text-emerald-500" /> },
                { name: 'EC2 Stopped', val: inventory?.counts?.ec2_stopped, icon: <Cpu className="w-4 h-4 text-zinc-400" /> },
                { name: 'RDS Instances', val: inventory?.counts?.rds, icon: <Database className="w-4 h-4 text-blue-500" /> },
                { name: 'Lambda Fns', val: inventory?.counts?.lambda, icon: <Activity className="w-4 h-4 text-purple-500" /> },
                { name: 'S3 Buckets', val: inventory?.counts?.s3, icon: <Cloud className="w-4 h-4 text-amber-500" /> },
                { name: 'EBS Volumes', val: inventory?.counts?.ebs, icon: <Layers className="w-4 h-4 text-indigo-500" /> },
                { name: 'Elastic IPs', val: inventory?.counts?.elastic_ip, icon: <Link className="w-4 h-4 text-cyan-500" /> },
                { name: 'Load Balancers', val: inventory?.counts?.load_balancer, icon: <Server className="w-4 h-4 text-teal-500" /> },
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => {
                    setActiveTab('resources');
                    if (item.name.includes('EC2')) setActiveResourceSubTab('ec2');
                    else if (item.name.includes('RDS')) setActiveResourceSubTab('rds');
                    else if (item.name.includes('Lambda')) setActiveResourceSubTab('lambda');
                    else if (item.name.includes('S3')) setActiveResourceSubTab('s3');
                    else if (item.name.includes('EBS')) setActiveResourceSubTab('ebs');
                    else if (item.name.includes('Elastic')) setActiveResourceSubTab('eip');
                    else if (item.name.includes('Load')) setActiveResourceSubTab('elb');
                  }}
                  className="p-3.5 bg-zinc-50/50 hover:bg-zinc-100/60 dark:bg-zinc-950/20 dark:hover:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800 rounded-xl text-center space-y-1.5 cursor-pointer transition-all hover:scale-102"
                >
                  <div className="mx-auto w-fit p-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-lg">
                    {item.icon}
                  </div>
                  <div className="font-extrabold text-lg text-zinc-900 dark:text-white font-mono leading-none">{item.val ?? 0}</div>
                  <div className="text-[9px] text-zinc-500 dark:text-zinc-400 font-semibold tracking-tight leading-tight">{item.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Charts Split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Line cost chart */}
            <div className="lg:col-span-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-xs flex flex-col space-y-4">
              <h3 className="font-semibold text-xs text-zinc-400 dark:text-zinc-550 uppercase tracking-wider">AWS Cost Trend (7 Days)</h3>
              <div className="h-56 w-full">
                {costs && costs.cost_trend ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={costs.cost_trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="cloudCostGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF9900" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#FF9900" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f4" className="dark:stroke-zinc-850" />
                      <XAxis dataKey="date" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(24, 24, 27, 0.95)',
                          borderColor: '#27272a',
                          borderRadius: '8px',
                          fontSize: '11px',
                          color: '#fff'
                        }}
                      />
                      <Area type="monotone" dataKey="cost" name="Spend ($)" stroke="#FF9900" strokeWidth={2} fillOpacity={1} fill="url(#cloudCostGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-zinc-400">Loading cost explorer datasets...</div>
                )}
              </div>
            </div>

            {/* Pie chart */}
            <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <h3 className="font-semibold text-xs text-zinc-400 dark:text-zinc-550 uppercase tracking-wider">MTD Service Distribution</h3>
              <div className="h-44 w-full relative">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-zinc-400">No active spending records.</div>
                )}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5 justify-center mt-2.5 text-[9px] font-semibold text-zinc-500 dark:text-zinc-400">
                {pieData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span>{item.name} ({((item.value / (costs?.mtd_spend || 1)) * 100).toFixed(0)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick AI Recommendations Banner */}
          {recommendations.length > 0 && (
            <div className="border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
                <h3 className="font-semibold text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-linear dark:text-aws animate-pulse" />
                  Top Cost Savings Recommendations
                </h3>
                <button
                  onClick={() => setActiveTab('recommendations')}
                  className="text-xs text-linear dark:text-aws font-semibold hover:underline cursor-pointer"
                >
                  View All suggestions &rarr;
                </button>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
                {recommendations.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="py-3 flex justify-between items-start gap-4 hover:bg-zinc-50/20 dark:hover:bg-zinc-950/10 px-2 rounded-lg transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                          item.severity === 'HIGH' 
                            ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30' 
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                        }`}>
                          {item.severity}
                        </span>
                        <span className="font-semibold text-zinc-900 dark:text-white">{item.category}</span>
                      </div>
                      <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">{item.recommended_actions}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono whitespace-nowrap">
                        +${item.estimated_savings?.toFixed(2)}/mo
                      </span>
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-500 block">estimated</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. RESOURCES VIEW */}
      {isConnected && activeTab === 'resources' && (
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl shadow-xs overflow-hidden flex flex-col lg:flex-row">
          {/* Sub menu lists */}
          <div className="w-full lg:w-56 border-r border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 p-4 space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block px-2.5 mb-2">AWS Categories</span>
            {[
              { id: 'ec2', name: 'EC2 Instances', count: (inventory?.counts?.ec2_running || 0) + (inventory?.counts?.ec2_stopped || 0) },
              { id: 'rds', name: 'RDS Databases', count: inventory?.counts?.rds },
              { id: 'lambda', name: 'Lambda Functions', count: inventory?.counts?.lambda },
              { id: 's3', name: 'S3 Buckets', count: inventory?.counts?.s3 },
              { id: 'ebs', name: 'EBS Volumes', count: inventory?.counts?.ebs },
              { id: 'eip', name: 'Elastic IPs', count: inventory?.counts?.elastic_ip },
              { id: 'elb', name: 'Load Balancers', count: inventory?.counts?.load_balancer },
            ].map((subTab) => (
              <button
                key={subTab.id}
                onClick={() => setActiveResourceSubTab(subTab.id as any)}
                className={`w-full flex justify-between items-center px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${
                  activeResourceSubTab === subTab.id
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 font-bold'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-zinc-900/30'
                }`}
              >
                <span>{subTab.name}</span>
                <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold font-mono px-1.5 py-0.5 rounded text-[10px]">
                  {subTab.count ?? 0}
                </span>
              </button>
            ))}
          </div>

          {/* Details Table view */}
          <div className="flex-1 p-6 overflow-x-auto">
            {activeResourceSubTab === 'ec2' && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">EC2 Compute Resource Logs</h4>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 text-zinc-500 dark:text-zinc-400 font-semibold">
                      <th className="px-4 py-2.5">Name</th>
                      <th className="px-4 py-2.5">Instance ID</th>
                      <th className="px-4 py-2.5">Type</th>
                      <th className="px-4 py-2.5">State</th>
                      <th className="px-4 py-2.5">Launch Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40">
                    {inventory?.ec2_instances?.map((item: any) => (
                      <tr key={item.id} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-950/10">
                        <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white truncate max-w-[150px]">{item.name}</td>
                        <td className="px-4 py-3 font-mono text-zinc-450 dark:text-zinc-500">{item.id}</td>
                        <td className="px-4 py-3 font-mono text-zinc-600 dark:text-zinc-400">{item.type}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.state === 'running' 
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100 dark:border-emerald-900/30' 
                              : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700'
                          }`}>
                            {item.state}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-400 dark:text-zinc-500 font-mono">
                          {item.launch_time ? new Date(item.launch_time).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeResourceSubTab === 'rds' && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">RDS Database Clusters</h4>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 text-zinc-500 dark:text-zinc-400 font-semibold">
                      <th className="px-4 py-2.5">Identifier</th>
                      <th className="px-4 py-2.5">Engine</th>
                      <th className="px-4 py-2.5">Class</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5">Availability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40">
                    {inventory?.rds_databases?.map((item: any) => (
                      <tr key={item.id} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-950/10">
                        <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">{item.id}</td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{item.engine}</td>
                        <td className="px-4 py-3 font-mono text-zinc-400 dark:text-zinc-500">{item.type}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100 dark:border-emerald-900/30 text-[10px] font-bold">
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-400 dark:text-zinc-500">
                          {item.multi_az ? 'Multi-AZ (HA)' : 'Single Zone'}
                        </td>
                      </tr>
                    ))}
                    {inventory?.rds_databases?.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-zinc-400 dark:text-zinc-500">No RDS database deployments configured.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeResourceSubTab === 'lambda' && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Serverless Lambda Functions</h4>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 text-zinc-500 dark:text-zinc-400 font-semibold">
                      <th className="px-4 py-2.5">Function Name</th>
                      <th className="px-4 py-2.5">Runtime Environment</th>
                      <th className="px-4 py-2.5">Allocated RAM</th>
                      <th className="px-4 py-2.5">Last Deployment Modification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40">
                    {inventory?.lambda_functions?.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-950/10">
                        <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white truncate max-w-[200px]">{item.name}</td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 font-mono">{item.runtime}</td>
                        <td className="px-4 py-3 font-mono text-zinc-400 dark:text-zinc-500">{item.memory} MB</td>
                        <td className="px-4 py-3 text-zinc-400 dark:text-zinc-500 font-mono">
                          {item.last_modified ? new Date(item.last_modified).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeResourceSubTab === 's3' && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Simple Storage Service (S3) Buckets</h4>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 text-zinc-500 dark:text-zinc-400 font-semibold">
                      <th className="px-4 py-2.5">Bucket Name</th>
                      <th className="px-4 py-2.5">AWS Location</th>
                      <th className="px-4 py-2.5">Creation Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40">
                    {inventory?.s3_buckets?.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-950/10">
                        <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">{item.name}</td>
                        <td className="px-4 py-3 text-zinc-400 dark:text-zinc-500 uppercase font-mono">Global</td>
                        <td className="px-4 py-3 text-zinc-400 dark:text-zinc-500 font-mono">
                          {item.creation_date ? new Date(item.creation_date).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeResourceSubTab === 'ebs' && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Elastic Block Store (EBS) Volumes</h4>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 text-zinc-500 dark:text-zinc-400 font-semibold">
                      <th className="px-4 py-2.5">Volume ID</th>
                      <th className="px-4 py-2.5">Size</th>
                      <th className="px-4 py-2.5">Type</th>
                      <th className="px-4 py-2.5">Usage State</th>
                      <th className="px-4 py-2.5">Attached Host</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40">
                    {inventory?.ebs_volumes?.map((item: any) => (
                      <tr key={item.id} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-950/10">
                        <td className="px-4 py-3 font-mono text-zinc-900 dark:text-white">{item.id}</td>
                        <td className="px-4 py-3 font-mono text-zinc-650 dark:text-zinc-400">{item.size} GB</td>
                        <td className="px-4 py-3 text-zinc-400 dark:text-zinc-500 font-mono uppercase">{item.type}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.state === 'in-use' 
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100 dark:border-emerald-900/30' 
                              : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 border border-amber-100 dark:border-amber-900/30 animate-pulse'
                          }`}>
                            {item.state}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-400 dark:text-zinc-500 font-mono truncate max-w-[120px]">
                          {item.instance_id || 'Not Attached'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeResourceSubTab === 'eip' && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Elastic IP Addresses (EIP)</h4>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 text-zinc-500 dark:text-zinc-400 font-semibold">
                      <th className="px-4 py-2.5">Public IP Address</th>
                      <th className="px-4 py-2.5">Allocation ID</th>
                      <th className="px-4 py-2.5">Attached Host ID</th>
                      <th className="px-4 py-2.5">State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40">
                    {inventory?.elastic_ips?.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-950/10">
                        <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white font-mono">{item.ip}</td>
                        <td className="px-4 py-3 font-mono text-zinc-400 dark:text-zinc-500">{item.allocation_id}</td>
                        <td className="px-4 py-3 font-mono text-zinc-450 dark:text-zinc-450">{item.instance_id || 'Idle'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            item.instance_id 
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-100 dark:border-emerald-900/30' 
                              : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 border-rose-100 dark:border-rose-900/30 animate-pulse'
                          }`}>
                            {item.instance_id ? 'Attached' : 'Unused'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeResourceSubTab === 'elb' && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Load Balancer Instances</h4>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 text-zinc-500 dark:text-zinc-400 font-semibold">
                      <th className="px-4 py-2.5">Name</th>
                      <th className="px-4 py-2.5">Type</th>
                      <th className="px-4 py-2.5">DNS Endpoint Name</th>
                      <th className="px-4 py-2.5">State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40">
                    {inventory?.load_balancers?.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-950/10">
                        <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white truncate max-w-[120px]">{item.name}</td>
                        <td className="px-4 py-3 font-mono text-zinc-450 dark:text-zinc-500 uppercase">{item.type}</td>
                        <td className="px-4 py-3 text-zinc-400 dark:text-zinc-500 font-mono truncate max-w-[200px]" title={item.dns_name}>
                          {item.dns_name}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100 dark:border-emerald-900/30 text-[10px] font-bold">
                            {item.state}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. COSTS VIEW */}
      {isConnected && activeTab === 'costs' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Summary details */}
            <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-xs flex flex-col gap-4">
              <h3 className="font-semibold text-xs text-zinc-400 dark:text-zinc-550 uppercase tracking-wider">AWS Cost Monitoring Summaries</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3.5 bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-100 dark:border-zinc-850 rounded-xl">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block uppercase">Today's Spend</span>
                    <span className="text-xl font-bold font-mono text-zinc-900 dark:text-white">${costs?.today_spend?.toFixed(2)}</span>
                  </div>
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex justify-between items-center p-3.5 bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-100 dark:border-zinc-850 rounded-xl">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block uppercase">Month-to-Date Cost</span>
                    <span className="text-xl font-bold font-mono text-zinc-900 dark:text-white">${costs?.mtd_spend?.toFixed(2)}</span>
                  </div>
                  <TrendingDown className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex justify-between items-center p-3.5 bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-100 dark:border-zinc-850 rounded-xl">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block uppercase">Forecast Monthly cost</span>
                    <span className="text-xl font-bold font-mono text-zinc-900 dark:text-white">${costs?.forecast_spend?.toFixed(2)}</span>
                  </div>
                  <TrendingUp className="w-5 h-5 text-amber-500 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Service breakdown pie */}
            <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <h3 className="font-semibold text-xs text-zinc-400 dark:text-zinc-550 uppercase tracking-wider">Service Breakdown</h3>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value">
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `$${Number(v).toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[9px] font-semibold text-zinc-500 dark:text-zinc-400 mt-2">
                {pieData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="truncate">{item.name}: ${item.value.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Service breakdown table list */}
            <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <h3 className="font-semibold text-xs text-zinc-400 dark:text-zinc-550 uppercase tracking-wider">Spend Details</h3>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs mt-3 flex-1 overflow-y-auto">
                {Object.entries(costs?.breakdown || {}).map(([service, val]: any) => (
                  <div key={service} className="py-2.5 flex justify-between items-center">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-300">{service}</span>
                    <span className="font-bold text-zinc-900 dark:text-white font-mono">${Number(val).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trend Area Chart */}
          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-xs flex flex-col space-y-4">
            <h3 className="font-semibold text-xs text-zinc-400 dark:text-zinc-550 uppercase tracking-wider">AWS Cost Trend Analysis</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={costs?.cost_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="costGradce" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5E6AD2" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#5E6AD2" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f4" className="dark:stroke-zinc-850" />
                  <XAxis dataKey="date" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(24, 24, 27, 0.95)',
                      borderColor: '#27272a',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: '#fff'
                    }}
                  />
                  <Area type="monotone" dataKey="cost" name="Cost Spend ($)" stroke="#5E6AD2" strokeWidth={2} fillOpacity={1} fill="url(#costGradce)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 6. CREDITS VIEW */}
      {isConnected && activeTab === 'credits' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Visual credit progress indicators */}
          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-xs flex flex-col items-center justify-center text-center space-y-6">
            <h3 className="font-semibold text-xs text-zinc-400 dark:text-zinc-550 uppercase tracking-wider self-start">Credit Allocation Pool</h3>
            
            {/* Visual Ring Gauge */}
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="88" cy="88" r="76" strokeWidth="12" stroke="rgba(244, 244, 245, 0.5)" fill="transparent" className="dark:stroke-zinc-800" />
                <circle 
                  cx="88" 
                  cy="88" 
                  r="76" 
                  strokeWidth="12" 
                  stroke={credits?.alert_active ? '#EF4444' : '#FF9900'} 
                  fill="transparent" 
                  strokeDasharray={2 * Math.PI * 76} 
                  strokeDashoffset={2 * Math.PI * 76 * (1 - (credits?.remaining_percentage || 0) / 100)} 
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-extrabold text-zinc-900 dark:text-white font-mono leading-none">
                  {credits?.remaining_percentage?.toFixed(0)}%
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold mt-1">Remaining</span>
              </div>
            </div>

            <div className="w-full space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-zinc-400">Consumed Credits</span>
                <span className="text-zinc-900 dark:text-white font-mono">${credits?.credits_consumed?.toFixed(2)}</span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
                <div 
                  className="bg-zinc-400 dark:bg-zinc-500 h-2 rounded-full transition-all" 
                  style={{ width: `${(credits?.credits_consumed / credits?.credits_total) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Credits summary details list */}
          <div className="lg:col-span-2 space-y-6">
            <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-xs space-y-6">
              <h3 className="font-semibold text-xs text-zinc-400 dark:text-zinc-550 uppercase tracking-wider">AWS Credits Summary details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500 dark:text-zinc-400 font-semibold">Credits Pool Total</span>
                    <span className="font-bold text-zinc-900 dark:text-white font-mono">${credits?.credits_total?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500 dark:text-zinc-400 font-semibold">Credits Remaining</span>
                    <span className="font-bold text-zinc-900 dark:text-white font-mono text-amber-500">${credits?.credits_remaining?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500 dark:text-zinc-400 font-semibold">Credits Consumed</span>
                    <span className="font-bold text-zinc-900 dark:text-white font-mono text-zinc-500">${credits?.credits_consumed?.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500 dark:text-zinc-400 font-semibold">Estimated Days Remaining</span>
                    <span className="font-bold text-zinc-900 dark:text-white font-mono">{credits?.estimated_days_remaining} Days</span>
                  </div>
                  <div className="flex justify-between items-center pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500 dark:text-zinc-400 font-semibold">Warning Threshold</span>
                    <span className="font-bold text-zinc-900 dark:text-white font-mono">&lt; 20% remaining</span>
                  </div>
                  <div className="flex justify-between items-center pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500 dark:text-zinc-400 font-semibold">Alert Email notifications</span>
                    <span className="font-bold text-zinc-900 dark:text-white">Active</span>
                  </div>
                </div>
              </div>

              {/* Alert Warning Box */}
              {credits?.alert_active && (
                <div className="p-4 bg-rose-500/10 border border-rose-250 dark:border-rose-900/30 rounded-xl flex gap-3 items-start animate-pulse">
                  <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-rose-600 dark:text-rose-400">Action Required: Low Credits Warning Alert</p>
                    <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                      Your AWS remaining credits represent {credits?.remaining_percentage?.toFixed(0)}% of the total pool, which is below the 20% limit. Estimated budget exhaust in {credits?.estimated_days_remaining} days. Downsize idle instances to prevent on-demand billing charges.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. AI COST OPTIMIZER TAB */}
      {isConnected && activeTab === 'recommendations' && (
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/20 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-sm text-zinc-950 dark:text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-linear dark:text-aws" />
                Gemini Cost Optimization Suggestions
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Automated idle inventory analysis, overprovisioned database recommendations, and sizing plans.</p>
            </div>
            
            <button
              onClick={handleReloadAI}
              disabled={reloadingAI}
              className="px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-250 dark:border-zinc-800 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${reloadingAI ? 'animate-spin' : ''}`} />
              Re-Audit Account
            </button>
          </div>

          <div className="p-6">
            {reloadingAI ? (
              <div className="animate-pulse space-y-4 py-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-4 border border-zinc-100 dark:border-zinc-800 rounded-xl space-y-2">
                    <div className="h-3 w-40 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-2.5 w-full bg-zinc-200 dark:bg-zinc-850 rounded" />
                    <div className="h-2 w-3/4 bg-zinc-200 dark:bg-zinc-850 rounded" />
                  </div>
                ))}
              </div>
            ) : recommendations.length > 0 ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold bg-zinc-50/30 dark:bg-zinc-950/10">
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Estimated Monthly Savings</th>
                    <th className="px-4 py-3">Recommended Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40">
                  {recommendations.map((item, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/20 dark:hover:bg-zinc-950/10">
                      <td className="px-4 py-4 font-semibold text-zinc-900 dark:text-white">{item.category}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.severity === 'HIGH'
                            ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30'
                            : item.severity === 'MEDIUM'
                            ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30'
                            : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${
                            item.severity === 'HIGH' ? 'bg-rose-500 animate-pulse' : item.severity === 'MEDIUM' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'
                          }`} />
                          {item.severity}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-bold font-mono text-emerald-600 dark:text-emerald-450 whitespace-nowrap">
                        +${item.estimated_savings?.toFixed(2)}/mo
                      </td>
                      <td className="px-4 py-4 text-zinc-500 dark:text-zinc-400 leading-normal max-w-sm">{item.recommended_actions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-zinc-400">Failed to generate optimization recommendations. Ensure API parameters are correct.</div>
            )}
          </div>
        </div>
      )}

      {/* 8. AI HEALTH AUDITOR TAB */}
      {isConnected && activeTab === 'health' && (
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs">
            <div>
              <h3 className="font-bold text-xs text-zinc-400 dark:text-zinc-550 uppercase tracking-wider">CloudWatch AI Health Diagnostician</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Continuous CPU workload threshold checks, storage usage anomalies, and capacity projections.</p>
            </div>
            <button
              onClick={handleReloadAI}
              disabled={reloadingAI}
              className="px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-250 dark:border-zinc-800 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${reloadingAI ? 'animate-spin' : ''}`} />
              Refresh Diagnostic logs
            </button>
          </div>

          {reloadingAI ? (
            <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl p-8 animate-pulse space-y-4">
              <div className="h-4 w-48 bg-zinc-300 dark:bg-zinc-750 rounded" />
              <div className="h-2.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-2.5 w-5/6 bg-zinc-200 dark:bg-zinc-800 rounded" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Warnings */}
              <div className="border border-rose-100 dark:border-rose-950/20 bg-rose-50/5 dark:bg-zinc-900 rounded-xl p-5 shadow-xs space-y-4">
                <h4 className="font-bold text-xs text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500 animate-bounce" />
                  Active Health Warnings
                </h4>
                <div className="space-y-3">
                  {healthData?.warnings?.map((w: string, idx: number) => (
                    <div key={idx} className="p-3 bg-white dark:bg-zinc-950 border border-rose-100/50 dark:border-rose-900/10 rounded-lg text-xs text-zinc-650 dark:text-zinc-400 font-medium">
                      {w}
                    </div>
                  ))}
                  {healthData?.warnings?.length === 0 && (
                    <div className="text-center py-6 text-zinc-400 text-xs">All monitored services operating normally.</div>
                  )}
                </div>
              </div>

              {/* Predictions */}
              <div className="border border-indigo-100 dark:border-indigo-950/20 bg-indigo-50/5 dark:bg-zinc-900 rounded-xl p-5 shadow-xs space-y-4">
                <h4 className="font-bold text-xs text-indigo-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-indigo-500" />
                  Capacity Projections
                </h4>
                <div className="space-y-3">
                  {healthData?.predictions?.map((p: string, idx: number) => (
                    <div key={idx} className="p-3 bg-white dark:bg-zinc-950 border border-indigo-100/50 dark:border-indigo-900/10 rounded-lg text-xs text-zinc-650 dark:text-zinc-400 font-medium">
                      {p}
                    </div>
                  ))}
                </div>
              </div>

              {/* Optimizations */}
              <div className="border border-teal-100 dark:border-teal-950/20 bg-teal-50/5 dark:bg-zinc-900 rounded-xl p-5 shadow-xs space-y-4">
                <h4 className="font-bold text-xs text-teal-600 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-teal-600" />
                  Health Optimizations
                </h4>
                <div className="space-y-3">
                  {healthData?.optimizations?.map((o: string, idx: number) => (
                    <div key={idx} className="p-3 bg-white dark:bg-zinc-950 border border-teal-100/50 dark:border-teal-900/10 rounded-lg text-xs text-zinc-650 dark:text-zinc-400 font-medium">
                      {o}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
