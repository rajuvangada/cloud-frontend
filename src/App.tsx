import React, { useState, useEffect } from 'react';
import type { ViewType, ThemeType, CostEstimationResult, LogAnalysisResult, TimelineEntry, Toast, User, CostHistory, LogHistory } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ToastContainer } from './components/ToastMessage';
import { DashboardView } from './components/DashboardView';
import { CostEstimatorView } from './components/CostEstimatorView';
import { LogAnalyzerView } from './components/LogAnalyzerView';
import { ApiHealthView } from './components/ApiHealthView';
import { SettingsView } from './components/SettingsView';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { checkApiHealth, fetchCostHistory, fetchLogHistory, parseBackendAnalysis } from './utils/api';

export const App: React.FC = () => {
  // Navigation & layout states
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [theme, setTheme] = useState<ThemeType>('dark');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  // Authentication states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Global history states
  const [estimates, setEstimates] = useState<CostEstimationResult[]>([]);
  const [analyses, setAnalyses] = useState<LogAnalysisResult[]>([]);
  const [costHistory, setCostHistory] = useState<CostHistory[]>([]);
  const [logHistory, setLogHistory] = useState<LogHistory[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Real-time backend API states
  const [apiHealth, setApiHealth] = useState<{ ok: boolean; latency: number }>({ ok: true, latency: 45 });

  // Load database history from MongoDB
  const loadDatabaseHistory = async () => {
    try {
      const costResult = await fetchCostHistory();
      const logResult = await fetchLogHistory();

      setCostHistory(costResult.data || []);
      setLogHistory(logResult.data || []);

      const costItems = Array.isArray(costResult.data) ? costResult.data : [];
      const logItems = Array.isArray(logResult.data) ? logResult.data : [];

      // Map CostHistory to CostEstimationResult so existing frontend continues working
      const mappedEstimates: CostEstimationResult[] = (costItems || []).map((item: CostHistory) => {
        const monthly = item.estimated_cost || 0;
        return {
          id: item._id,
          timestamp: item.timestamp,
          instanceType: item.resource || 'standard-resource',
          hours: 720,
          estimatedMonthlyCost: monthly,
          estimatedAnnualCost: Number((monthly * 12).toFixed(2)),
          suggestedSavings: Number((monthly * 0.3).toFixed(2)),
          isMocked: false,
          service: item.service
        };
      });

      // Map LogHistory to LogAnalysisResult
      const mappedAnalyses: LogAnalysisResult[] = (logItems || []).map((item: LogHistory) => {
        const analysisText = item.analysis || '';
        const details = parseBackendAnalysis(analysisText);
        return {
          id: item._id,
          timestamp: item.timestamp,
          logPreview: item.log ? (item.log.substring(0, 150) + (item.log.length > 150 ? '...' : '')) : '',
          ...details,
          isMocked: false
        };
      });

      setEstimates(mappedEstimates);
      setAnalyses(mappedAnalyses);
      
      const costTimeline: TimelineEntry[] = (mappedEstimates || []).map((item) => ({
        id: `act-${item.id}`,
        type: 'cost',
        title: `Cost Estimation: ${item.instanceType}`,
        subtitle: `720 hours estimate calculated`,
        timestamp: item.timestamp,
        status: 'success',
        amount: item.estimatedMonthlyCost,
      }));
      
      const logTimeline: TimelineEntry[] = (mappedAnalyses || []).map((item) => ({
        id: `act-${item.id}`,
        type: 'log',
        title: `Log Analysis: ${item.issueType}`,
        subtitle: `${item.severity} severity diagnostics completed`,
        timestamp: item.timestamp,
        status: 'success',
        severity: item.severity,
      }));
      
      const combined = [...costTimeline, ...logTimeline].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setTimeline(combined);
    } catch (error) {
      console.error("History API Error:", error);
    }
  };

  // 1. Initialize data, auth status & theme
  useEffect(() => {
    // Sync theme
    const savedTheme = localStorage.getItem('theme') as ThemeType;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Check credentials on load
    const savedToken = localStorage.getItem('token');
    const savedUserStr = localStorage.getItem('user');
    if (savedToken && savedUserStr) {
      try {
        const savedUser = JSON.parse(savedUserStr);
        setCurrentUser(savedUser);
        setIsAuthenticated(true);
        setCurrentView('dashboard');
        // Retrieve live histories from MongoDB
        loadDatabaseHistory();
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setCurrentView('landing');
      }
    } else {
      setCurrentView('landing');
    }

    // Auto-minimize sidebar on smaller screens initially
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }

    // Trigger API gateway ping health check on boot
    const pingBoot = async () => {
      try {
        const res = await checkApiHealth();
        setApiHealth(res);
      } catch (e) {
        console.error('Failed to run boot API checks:', e);
      }
    };
    pingBoot();
  }, []);

  // 2. Route Protection Guard check
  const authProtectedViews: ViewType[] = ['dashboard', 'cost', 'logs', 'api', 'settings'];
  const guestOnlyViews: ViewType[] = ['login', 'register', 'forgot'];

  useEffect(() => {
    if (!isAuthenticated && authProtectedViews.includes(currentView)) {
      setCurrentView('login');
      addToast('Please login to access protected portal screens.', 'warning');
    } else if (isAuthenticated && guestOnlyViews.includes(currentView)) {
      setCurrentView('dashboard');
    }
  }, [currentView, isAuthenticated]);

  // 3. Handlers
  const handleThemeToggle = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    addToast(`Switched to ${nextTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}`, 'info');
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const addToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddEstimate = (result: CostEstimationResult) => {
    setEstimates((prev) => [result, ...prev]);
    
    // Add to activity timeline
    const entry: TimelineEntry = {
      id: `act-${result.id}`,
      type: 'cost',
      title: `Cost Estimation: ${result.instanceType}`,
      subtitle: `${result.hours} hours estimate calculated`,
      timestamp: result.timestamp,
      status: 'success',
      amount: result.estimatedMonthlyCost,
    };
    setTimeline((prev) => [entry, ...prev]);
    
    // Trigger Database re-fetch to sync cost history items
    loadDatabaseHistory();
  };

  const handleAddAnalysis = (result: LogAnalysisResult) => {
    setAnalyses((prev) => [result, ...prev]);

    // Add to activity timeline
    const entry: TimelineEntry = {
      id: `act-${result.id}`,
      type: 'log',
      title: `Log Analysis: ${result.issueType}`,
      subtitle: `${result.severity} severity diagnostics completed`,
      timestamp: result.timestamp,
      status: 'success',
      severity: result.severity,
    };
    setTimeline((prev) => [entry, ...prev]);

    // Trigger Database re-fetch to sync log analyzer items
    loadDatabaseHistory();
  };

  const handleClearHistory = () => {
    setEstimates([]);
    setAnalyses([]);
    setTimeline([]);
  };

  // Auth logins & registration triggers
  const handleLoginSuccess = (user: User, _token: string) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setCurrentView('dashboard');
    loadDatabaseHistory(); // Load historic entries on success
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView('login');
    addToast('Logged out successfully.', 'info');
  };

  const handleLaunchDemo = () => {
    const demoUser: User = {
      id: 'usr-demo',
      name: 'Demo Architect',
      email: 'demo@cloudinsight.io'
    };
    localStorage.setItem('token', 'mock-jwt-demo-token-12345');
    localStorage.setItem('user', JSON.stringify(demoUser));
    handleLoginSuccess(demoUser, 'mock-jwt-demo-token-12345');
    addToast('Demonstration login active (bypassed database credentials).', 'info');
  };

  // 4. Render routing views
  const renderCurrentView = () => {
    switch (currentView) {
      case 'cost':
        return (
          <CostEstimatorView
            onAddEstimate={handleAddEstimate}
            onAddToast={addToast}
            estimates={estimates}
          />
        );
      case 'logs':
        return (
          <LogAnalyzerView
            onAddAnalysis={handleAddAnalysis}
            onAddToast={addToast}
            analyses={analyses}
          />
        );
      case 'api':
        return (
          <ApiHealthView
            onAddToast={addToast}
          />
        );
      case 'settings':
        return (
          <SettingsView
            onAddToast={addToast}
            onClearHistory={handleClearHistory}
            totalEstimates={estimates.length}
            totalAnalyses={analyses.length}
          />
        );
      case 'dashboard':
        return (
          <DashboardView
            estimates={estimates}
            analyses={analyses}
            timeline={timeline}
            onViewChange={setCurrentView}
            apiHealth={apiHealth}
          />
        );
      case 'login':
        return (
          <LoginPage
            onViewChange={setCurrentView}
            onLoginSuccess={handleLoginSuccess}
            onAddToast={addToast}
            theme={theme}
            onThemeToggle={handleThemeToggle}
          />
        );
      case 'register':
        return (
          <RegisterPage
            onViewChange={setCurrentView}
            onLoginSuccess={handleLoginSuccess}
            onAddToast={addToast}
            theme={theme}
            onThemeToggle={handleThemeToggle}
          />
        );
      case 'forgot':
        return (
          <ForgotPasswordPage
            onViewChange={setCurrentView}
            onAddToast={addToast}
            theme={theme}
            onThemeToggle={handleThemeToggle}
          />
        );
      case 'landing':
      default:
        return (
          <LandingPage
            onViewChange={setCurrentView}
            theme={theme}
            onThemeToggle={handleThemeToggle}
            isAuthenticated={isAuthenticated}
            onLaunchDemo={handleLaunchDemo}
          />
        );
    }
  };

  // 5. Layout Rendering (Unauthenticated Guest Shell vs Authenticated Portal Shell)
  const isGuestView = ['landing', 'login', 'register', 'forgot'].includes(currentView);

  if (isGuestView) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200">
        {renderCurrentView()}
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200">
      {/* Navigation Left Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        isOpen={sidebarOpen}
        onToggle={handleSidebarToggle}
      />

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header navbar */}
        <Header
          theme={theme}
          onThemeToggle={handleThemeToggle}
          onSidebarToggle={handleSidebarToggle}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        {/* Dynamic page container content */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {renderCurrentView()}
        </main>
      </div>

      {/* Global Notifications system */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};

export default App;
