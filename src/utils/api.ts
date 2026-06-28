import type { CostRequest, CostResponse, LogRequest, LogResponse, CostEstimationResult, LogAnalysisResult, User, CostHistory, LogHistory } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://q2rl2hl6y3.execute-api.us-east-1.amazonaws.com/prod';

// Simple state storage inside API helper to toggle mock behaviour
let useMock = false;
let customEndpoint = '';

export const apiConfig = {
  getUseMock: () => useMock,
  setUseMock: (val: boolean) => { useMock = val; },
  getCustomEndpoint: () => customEndpoint,
  setCustomEndpoint: (val: string) => { customEndpoint = val; }
};

const getUrl = (path: string): string => {
  if (customEndpoint) {
    return `${customEndpoint}${path}`;
  }
  return `${BASE_URL}${path}`;
};

// Client-side fallback pricing rates matching backend python code
const INSTANCE_PRICES: Record<string, number> = {
  't2.micro': 0.0116,
  't2.small': 0.023,
  't3.micro': 0.0104,
};

// Mock data generator for initial list rendering
export const getMockTimeline = () => [
  {
    id: 'act-1',
    type: 'cost' as const,
    title: 'Cost Estimation: t2.small',
    subtitle: '720 hours estimate calculated',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    status: 'success' as const,
    amount: 16.56,
  },
  {
    id: 'act-2',
    type: 'log' as const,
    title: 'Log Analysis: Connection Refused',
    subtitle: 'High severity database socket failure',
    timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
    status: 'success' as const,
    severity: 'HIGH' as const,
  },
  {
    id: 'act-3',
    type: 'cost' as const,
    title: 'Cost Estimation: t3.micro',
    subtitle: '168 hours estimate calculated',
    timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
    status: 'success' as const,
    amount: 1.75,
  },
];

export const getMockAnalyses = (): LogAnalysisResult[] => [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
    logPreview: '2026-06-27T14:02:11Z [ERROR] connection refused: DB connection failed on port 5432 after retry limit.',
    issueType: 'Connection Refused',
    severity: 'HIGH',
    possibleCauses: [
      'Database service process is stopped or crashed.',
      'Network firewall (Security Group) blocking ingress on port 5432.',
      'Max connections limit exceeded on database side.'
    ],
    recommendations: [
      'Verify the PostgreSQL daemon is active (`systemctl status postgresql`).',
      'Inspect RDS Security Groups to allow incoming DB traffic from the Lambda subnet.',
      'Check database connections pool sizes and scale connections count.'
    ],
    isMocked: true
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 180 * 60000).toISOString(),
    logPreview: '2026-06-27T11:15:00Z [WARN] GatewayTimeout: response from application container took more than 30000ms',
    issueType: 'Request Timeout',
    severity: 'HIGH',
    possibleCauses: [
      'Slow database query locking database tables.',
      'Out of memory (OOM) error causing garbage collection pauses.',
      'Unresponsive downstream external third-party microservice API.'
    ],
    recommendations: [
      'Verify slow query log outputs in RDS CloudWatch metrics.',
      'Check container memory limits and increase ECS task sizes if OOM is observed.',
      'Introduce circuit breaker patterns and fallback handlers for external APIs.'
    ],
    isMocked: true
  }
];

export const getMockEstimates = (): CostEstimationResult[] => [
  {
    id: 'est-1',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    instanceType: 't2.small',
    hours: 720,
    estimatedMonthlyCost: 16.56,
    estimatedAnnualCost: 198.72,
    suggestedSavings: 4.97,
    isMocked: true
  },
  {
    id: 'est-2',
    timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
    instanceType: 't3.micro',
    hours: 168,
    estimatedMonthlyCost: 1.75,
    estimatedAnnualCost: 20.97,
    suggestedSavings: 0.52,
    isMocked: true
  }
];

// 1. AWS Cost Estimation integration
export const calculateCost = async (
  hours: number,
  instanceType: string
): Promise<{ result: CostEstimationResult; latency: number }> => {
  const startTime = performance.now();
  
  if (useMock) {
    await new Promise((resolve) => setTimeout(resolve, 800)); // simulate latency
    const monthlyCost = hours * (INSTANCE_PRICES[instanceType] || 0.0116);
    const result: CostEstimationResult = {
      id: `est-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      instanceType,
      hours,
      estimatedMonthlyCost: Number(monthlyCost.toFixed(2)),
      estimatedAnnualCost: Number((monthlyCost * 12).toFixed(2)),
      suggestedSavings: Number((monthlyCost * 0.3).toFixed(2)), // Suggest 30% Savings Plan
      isMocked: true,
    };
    return { result, latency: Math.round(performance.now() - startTime) };
  }

  try {
    const payload: CostRequest = { hours, instanceType };
    const response = await fetch(getUrl('/cost'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data: CostResponse = await response.json();
    const monthlyCost = data.estimated_cost;
    const result: CostEstimationResult = {
      id: `est-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      instanceType,
      hours,
      estimatedMonthlyCost: monthlyCost,
      estimatedAnnualCost: Number((monthlyCost * 12).toFixed(2)),
      suggestedSavings: Number((monthlyCost * 0.3).toFixed(2)),
      isMocked: false,
    };
    return { result, latency: Math.round(performance.now() - startTime) };
  } catch (error) {
    console.warn('API call failed, running local estimation fallback:', error);
    // Graceful fallback to client calculation
    await new Promise((resolve) => setTimeout(resolve, 600)); // brief visual feedback delay
    const monthlyCost = hours * (INSTANCE_PRICES[instanceType] || 0.0116);
    const result: CostEstimationResult = {
      id: `est-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      instanceType,
      hours,
      estimatedMonthlyCost: Number(monthlyCost.toFixed(2)),
      estimatedAnnualCost: Number((monthlyCost * 12).toFixed(2)),
      suggestedSavings: Number((monthlyCost * 0.3).toFixed(2)),
      isMocked: true, // indicates client-side calculation fallback
    };
    return { result, latency: Math.round(performance.now() - startTime) };
  }
};

// Log analysis parser helper
export const parseBackendAnalysis = (analysisText: string): Omit<LogAnalysisResult, 'id' | 'timestamp' | 'logPreview'> => {
  const text = analysisText.toLowerCase();
  
  if (text.includes('service unavailable') || text.includes('503')) {
    return {
      issueType: '503 Service Unavailable',
      severity: 'CRITICAL',
      possibleCauses: [
        'Target service backend daemon has crashed or exited.',
        'Application load balancer health checks are failing due to timeouts.',
        'Server runs out of file descriptors or critical resources.'
      ],
      recommendations: [
        'Verify if backend process is running (`docker ps`, `pm2 status`, etc.).',
        'Review error output from application container logs.',
        'Check target group health settings and HTTP response status in metrics.'
      ]
    };
  } else if (text.includes('timeout') || text.includes('network')) {
    return {
      issueType: 'Request Timeout',
      severity: 'HIGH',
      possibleCauses: [
        'Database locks preventing fast data fetches.',
        'Network firewall rules blocking connections to downstream interfaces.',
        'Unoptimized queries running beyond HTTP Gateway timeouts (30s).'
      ],
      recommendations: [
        'Verify current running MySQL/PostgreSQL queries for locks.',
        'Double-check Security Group ingress/egress policies between network zones.',
        'Add pagination, optimize database indexes, or run long tasks in background queues.'
      ]
    };
  } else if (text.includes('not listening') || text.includes('refused')) {
    return {
      issueType: 'Connection Refused',
      severity: 'HIGH',
      possibleCauses: [
        'The microservice port configuration is mismatching.',
        'The application crashed on boot and is no longer listening.',
        'Inbound traffic blocking by server firewall rules (iptables).'
      ],
      recommendations: [
        'Confirm port bindings via environment variables.',
        'Verify listener processes via netstat commands (`netstat -tulnp`).',
        'Check local server logs for startup failure stacktraces.'
      ]
    };
  } else {
    // Default / unknown logs
    return {
      issueType: 'Generic Diagnostic Alert',
      severity: text.includes('error') ? 'HIGH' : text.includes('warn') ? 'MEDIUM' : 'LOW',
      possibleCauses: [
        'Custom application error log threshold exceeded.',
        'Unexpected state inside code logic flow.',
        'Development or testing debugging flags active.'
      ],
      recommendations: [
        'Search codebase for the matching text pattern or function.',
        'Double check related variables configurations.',
        'Verify user permissions or parameters passed to standard API handlers.'
      ]
    };
  }
};

// 2. AI Log Analyzer integration
export const analyzeLog = async (
  logText: string
): Promise<{ result: LogAnalysisResult; latency: number }> => {
  const startTime = performance.now();

  if (useMock) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const details = parseBackendAnalysis(logText);
    const result: LogAnalysisResult = {
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      logPreview: logText.substring(0, 150) + (logText.length > 150 ? '...' : ''),
      ...details,
      isMocked: true,
    };
    return { result, latency: Math.round(performance.now() - startTime) };
  }

  try {
    const payload: LogRequest = { log: logText };
    const response = await fetch(getUrl('/logs'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data: LogResponse = await response.json();
    const details = parseBackendAnalysis(data.analysis);
    const result: LogAnalysisResult = {
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      logPreview: logText.substring(0, 150) + (logText.length > 150 ? '...' : ''),
      ...details,
      isMocked: false,
    };
    return { result, latency: Math.round(performance.now() - startTime) };
  } catch (error) {
    console.warn('API call failed, running local log analysis fallback:', error);
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    // Client-side regex checking on the text to match backend lambda outputs
    const details = parseBackendAnalysis(logText);
    const result: LogAnalysisResult = {
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      logPreview: logText.substring(0, 150) + (logText.length > 150 ? '...' : ''),
      ...details,
      isMocked: true, // indicates client-side parsing fallback
    };
    return { result, latency: Math.round(performance.now() - startTime) };
  }
};

// 3. Ping endpoint health
export const checkApiHealth = async (): Promise<{ ok: boolean; latency: number }> => {
  const startTime = performance.now();
  if (useMock) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { ok: true, latency: Math.round(performance.now() - startTime) };
  }
  try {
    // Send a cost estimate request with 0 hours as a lightweight ping
    const payload: CostRequest = { hours: 0, instanceType: 't2.micro' };
    const response = await fetch(getUrl('/cost'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4000) // 4s timeout
    });
    return {
      ok: response.status === 200,
      latency: Math.round(performance.now() - startTime)
    };
  } catch (err) {
    return {
      ok: false,
      latency: Math.round(performance.now() - startTime)
    };
  }
};

// 4. User Authentication API handlers
export const loginUser = async (email: string, password: string): Promise<{ user: User; token: string; isMocked: boolean }> => {
  if (useMock) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      user: { id: 'usr-1', name: 'Demo Cloud User', email },
      token: 'mock-jwt-token-key-12345',
      isMocked: true
    };
  }

  try {
    const response = await fetch(getUrl('/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error(`Login failed with status ${response.status}`);
    }

    const data = await response.json();
    return {
      user: data.user,
      token: data.token,
      isMocked: false
    };
  } catch (err) {
    console.warn('API Authentication login failed, running local mock fallback:', err);
    await new Promise((resolve) => setTimeout(resolve, 600));
    return {
      user: { id: 'usr-fallback', name: 'Fallback Developer', email },
      token: 'mock-jwt-token-key-12345-fallback',
      isMocked: true
    };
  }
};

export const registerUser = async (name: string, email: string, password: string): Promise<{ user: User; token: string; isMocked: boolean }> => {
  if (useMock) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      user: { id: `usr-${Math.random().toString(36).substr(2, 5)}`, name, email },
      token: 'mock-jwt-token-key-12345',
      isMocked: true
    };
  }

  try {
    const response = await fetch(getUrl('/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    if (!response.ok) {
      throw new Error(`Registration failed with status ${response.status}`);
    }

    const data = await response.json();
    return {
      user: data.user,
      token: data.token,
      isMocked: false
    };
  } catch (err) {
    console.warn('API Authentication register failed, running local mock fallback:', err);
    await new Promise((resolve) => setTimeout(resolve, 600));
    return {
      user: { id: `usr-${Math.random().toString(36).substr(2, 5)}`, name, email },
      token: 'mock-jwt-token-key-12345-fallback',
      isMocked: true
    };
  }
};

export const getUserProfile = async (token: string): Promise<{ user: User; isMocked: boolean }> => {
  if (useMock || token.includes('mock')) {
    return {
      user: { id: 'usr-1', name: 'Demo Cloud User', email: 'developer@cloudinsight.io' },
      isMocked: true
    };
  }

  try {
    const response = await fetch(getUrl('/auth/profile'), {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Profile fetch failed with status ${response.status}`);
    }

    const data = await response.json();
    return {
      user: data.user,
      isMocked: false
    };
  } catch (err) {
    console.warn('Profile fetch failed, running local fallback profile:', err);
    return {
      user: { id: 'usr-fallback', name: 'Fallback Developer', email: 'developer@cloudinsight.io' },
      isMocked: true
    };
  }
};

// 5. Database History Retrieval API handlers
export const fetchCostHistory = async (): Promise<{ data: CostHistory[] }> => {
  if (useMock) {
    const mockData: CostHistory[] = [
      {
        _id: 'est-1',
        service: 'ec2',
        resource: 't2.small',
        estimated_cost: 16.56,
        timestamp: new Date(Date.now() - 5 * 60000).toISOString()
      },
      {
        _id: 'est-2',
        service: 'ec2',
        resource: 't3.micro',
        estimated_cost: 1.75,
        timestamp: new Date(Date.now() - 120 * 60000).toISOString()
      }
    ];
    return { data: mockData };
  }

  try {
    const response = await fetch(getUrl('/cost-history'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const items = data && Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
    return { data: items };
  } catch (error) {
    console.error("History API Error:", error);
    const mockData: CostHistory[] = [
      {
        _id: 'est-1',
        service: 'ec2',
        resource: 't2.small',
        estimated_cost: 16.56,
        timestamp: new Date(Date.now() - 5 * 60000).toISOString()
      },
      {
        _id: 'est-2',
        service: 'ec2',
        resource: 't3.micro',
        estimated_cost: 1.75,
        timestamp: new Date(Date.now() - 120 * 60000).toISOString()
      }
    ];
    return { data: mockData };
  }
};

export const fetchLogHistory = async (): Promise<{ data: LogHistory[] }> => {
  if (useMock) {
    const mockData: LogHistory[] = [
      {
        _id: 'log-1',
        log: '2026-06-27T14:02:11Z [ERROR] connection refused: DB connection failed on port 5432 after retry limit.',
        analysis: 'connection refused',
        timestamp: new Date(Date.now() - 25 * 60000).toISOString()
      },
      {
        _id: 'log-2',
        log: '2026-06-27T11:15:00Z [WARN] GatewayTimeout: response from application container took more than 30000ms',
        analysis: 'timeout',
        timestamp: new Date(Date.now() - 180 * 60000).toISOString()
      }
    ];
    return { data: mockData };
  }

  try {
    const response = await fetch(getUrl('/log-history'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const items = data && Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
    return { data: items };
  } catch (error) {
    console.error("History API Error:", error);
    const mockData: LogHistory[] = [
      {
        _id: 'log-1',
        log: '2026-06-27T14:02:11Z [ERROR] connection refused: DB connection failed on port 5432 after retry limit.',
        analysis: 'connection refused',
        timestamp: new Date(Date.now() - 25 * 60000).toISOString()
      },
      {
        _id: 'log-2',
        log: '2026-06-27T11:15:00Z [WARN] GatewayTimeout: response from application container took more than 30000ms',
        analysis: 'timeout',
        timestamp: new Date(Date.now() - 180 * 60000).toISOString()
      }
    ];
    return { data: mockData };
  }
};

// 6. S3 & Lambda service cost calculators (service extension)
export const calculateS3Cost = async (
  storageGB: number
): Promise<{ result: CostEstimationResult; latency: number }> => {
  const startTime = performance.now();
  
  if (useMock) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const pricePerGb = 0.023;
    const monthlyCost = storageGB * pricePerGb;
    const result: CostEstimationResult = {
      id: `est-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      instanceType: 'S3 Standard Storage',
      hours: 720,
      estimatedMonthlyCost: Number(monthlyCost.toFixed(4)),
      estimatedAnnualCost: Number((monthlyCost * 12).toFixed(4)),
      suggestedSavings: Number((monthlyCost * 0.15).toFixed(4)),
      isMocked: true,
      service: 's3',
      storageGB
    };
    return { result, latency: Math.round(performance.now() - startTime) };
  }

  try {
    const payload = { service: 's3', storageGB };
    const response = await fetch(getUrl('/cost'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const monthlyCost = data.total_cost || data.estimated_cost || 0;
    const result: CostEstimationResult = {
      id: `est-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      instanceType: 'S3 Standard Storage',
      hours: 720,
      estimatedMonthlyCost: monthlyCost,
      estimatedAnnualCost: Number((monthlyCost * 12).toFixed(4)),
      suggestedSavings: Number((monthlyCost * 0.15).toFixed(4)),
      isMocked: data.source === 'local-fallback',
      service: 's3',
      storageGB
    };
    return { result, latency: Math.round(performance.now() - startTime) };
  } catch (error) {
    console.warn('S3 API failed, running local fallback calculation:', error);
    await new Promise((resolve) => setTimeout(resolve, 600));
    const pricePerGb = 0.023;
    const monthlyCost = storageGB * pricePerGb;
    const result: CostEstimationResult = {
      id: `est-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      instanceType: 'S3 Standard Storage',
      hours: 720,
      estimatedMonthlyCost: Number(monthlyCost.toFixed(4)),
      estimatedAnnualCost: Number((monthlyCost * 12).toFixed(4)),
      suggestedSavings: Number((monthlyCost * 0.15).toFixed(4)),
      isMocked: true,
      service: 's3',
      storageGB
    };
    return { result, latency: Math.round(performance.now() - startTime) };
  }
};

export const calculateLambdaCost = async (
  requests: number,
  gbSeconds: number
): Promise<{ result: CostEstimationResult; latency: number }> => {
  const startTime = performance.now();
  
  const estimateLocal = () => {
    const reqCost = (requests / 1000000.0) * 0.20;
    const compCost = gbSeconds * 0.0000166667;
    const monthlyCost = reqCost + compCost;
    return {
      id: `est-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      instanceType: 'Lambda Invocations',
      hours: 720,
      estimatedMonthlyCost: Number(monthlyCost.toFixed(6)),
      estimatedAnnualCost: Number((monthlyCost * 12).toFixed(6)),
      suggestedSavings: Number((monthlyCost * 0.2).toFixed(6)),
      isMocked: true,
      service: 'lambda' as const,
      requests,
      gbSeconds
    };
  };

  if (useMock) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { result: estimateLocal(), latency: Math.round(performance.now() - startTime) };
  }

  try {
    const payload = { service: 'lambda', requests, gbSeconds };
    const response = await fetch(getUrl('/cost'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const monthlyCost = data.total_cost || data.estimated_cost || 0;
    const result: CostEstimationResult = {
      id: `est-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      instanceType: 'Lambda Invocations',
      hours: 720,
      estimatedMonthlyCost: monthlyCost,
      estimatedAnnualCost: Number((monthlyCost * 12).toFixed(6)),
      suggestedSavings: Number((monthlyCost * 0.2).toFixed(6)),
      isMocked: data.source === 'local-fallback',
      service: 'lambda',
      requests,
      gbSeconds
    };
    return { result, latency: Math.round(performance.now() - startTime) };
  } catch (error) {
    console.warn('Lambda API failed, running local fallback calculation:', error);
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { result: estimateLocal(), latency: Math.round(performance.now() - startTime) };
  }
};

export const calculateRdsCost = async (
  hours: number,
  instanceType: string,
  databaseEngine: string = 'PostgreSQL'
): Promise<{ result: CostEstimationResult; latency: number }> => {
  const startTime = performance.now();
  
  if (useMock) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const rdsRates: Record<string, number> = { 'db.t3.micro': 0.0180, 'db.t3.small': 0.0360, 'db.t2.micro': 0.0170 };
    const monthlyCost = hours * (rdsRates[instanceType] || 0.0180);
    const result: CostEstimationResult = {
      id: `est-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      instanceType,
      hours,
      estimatedMonthlyCost: Number(monthlyCost.toFixed(4)),
      estimatedAnnualCost: Number((monthlyCost * 12).toFixed(4)),
      suggestedSavings: Number((monthlyCost * 0.2).toFixed(4)),
      isMocked: true,
      service: 'rds'
    };
    return { result, latency: Math.round(performance.now() - startTime) };
  }

  try {
    const payload = {
      service: 'rds',
      database_engine: databaseEngine,
      usage: {
        instanceType,
        hours
      }
    };
    const response = await fetch(getUrl('/cost'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const monthlyCost = data.total_cost || data.estimated_cost || 0;
    const result: CostEstimationResult = {
      id: `est-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      instanceType,
      hours,
      estimatedMonthlyCost: monthlyCost,
      estimatedAnnualCost: Number((monthlyCost * 12).toFixed(4)),
      suggestedSavings: Number((monthlyCost * 0.2).toFixed(4)),
      isMocked: data.source === 'local-fallback',
      service: 'rds'
    };
    return { result, latency: Math.round(performance.now() - startTime) };
  } catch (error) {
    console.warn('RDS API failed, running local fallback calculation:', error);
    await new Promise((resolve) => setTimeout(resolve, 600));
    const rdsRates: Record<string, number> = { 'db.t3.micro': 0.0180, 'db.t3.small': 0.0360, 'db.t2.micro': 0.0170 };
    const monthlyCost = hours * (rdsRates[instanceType] || 0.0180);
    const result: CostEstimationResult = {
      id: `est-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      instanceType,
      hours,
      estimatedMonthlyCost: Number(monthlyCost.toFixed(4)),
      estimatedAnnualCost: Number((monthlyCost * 12).toFixed(4)),
      suggestedSavings: Number((monthlyCost * 0.2).toFixed(4)),
      isMocked: true,
      service: 'rds'
    };
    return { result, latency: Math.round(performance.now() - startTime) };
  }
};

export const calculateGenericCost = async (
  service: string,
  resource: string,
  usageValue: number,
  unit: string,
  region: string = 'ap-south-1'
): Promise<{ result: CostEstimationResult; latency: number }> => {
  const startTime = performance.now();
  
  if (useMock) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const monthlyCost = usageValue * 0.02;
    const result: CostEstimationResult = {
      id: `est-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      instanceType: `${service.toUpperCase()} (${resource})`,
      hours: 720,
      estimatedMonthlyCost: Number(monthlyCost.toFixed(4)),
      estimatedAnnualCost: Number((monthlyCost * 12).toFixed(4)),
      suggestedSavings: Number((monthlyCost * 0.1).toFixed(4)),
      isMocked: true,
      service: service as any
    };
    return { result, latency: Math.round(performance.now() - startTime) };
  }

  try {
    const payload = {
      service,
      region,
      usage: {
        resource,
        usage: usageValue,
        unit
      }
    };
    const response = await fetch(getUrl('/cost'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const monthlyCost = data.total_cost || data.estimated_cost || 0;
    const result: CostEstimationResult = {
      id: `est-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      instanceType: `${service.toUpperCase()} (${resource})`,
      hours: 720,
      estimatedMonthlyCost: monthlyCost,
      estimatedAnnualCost: Number((monthlyCost * 12).toFixed(4)),
      suggestedSavings: Number((monthlyCost * 0.1).toFixed(4)),
      isMocked: data.source === 'local-fallback',
      service: service as any
    };
    return { result, latency: Math.round(performance.now() - startTime) };
  } catch (error) {
    console.warn('Generic API failed, running local fallback calculation:', error);
    await new Promise((resolve) => setTimeout(resolve, 600));
    const monthlyCost = usageValue * 0.02;
    const result: CostEstimationResult = {
      id: `est-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      instanceType: `${service.toUpperCase()} (${resource})`,
      hours: 720,
      estimatedMonthlyCost: Number(monthlyCost.toFixed(4)),
      estimatedAnnualCost: Number((monthlyCost * 12).toFixed(4)),
      suggestedSavings: Number((monthlyCost * 0.1).toFixed(4)),
      isMocked: true,
      service: service as any
    };
    return { result, latency: Math.round(performance.now() - startTime) };
  }
};




