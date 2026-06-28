import type { CostRequest, CostResponse, LogRequest, CostEstimationResult, LogAnalysisResult, User, CostHistory, LogHistory } from '../types';

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

    const data: any = await response.json();
    const details = parseBackendAnalysis(data.analysis || '');
    const result: LogAnalysisResult = {
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      logPreview: logText.substring(0, 150) + (logText.length > 150 ? '...' : ''),
      issueType: data.issue || details.issueType,
      severity: data.severity || details.severity,
      possibleCauses: data.possible_causes || details.possibleCauses,
      recommendations: data.recommended_actions || details.recommendations,
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
    const response = await fetch(getUrl('/health'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(4000) // 4s timeout
    });
    const data = await response.json();
    return {
      ok: response.status === 200 && data.status !== 'offline',
      latency: Math.round(performance.now() - startTime)
    };
  } catch (err) {
    return {
      ok: false,
      latency: Math.round(performance.now() - startTime)
    };
  }
};

export const fetchHealthStatus = async (): Promise<{ status: 'online' | 'degraded' | 'offline'; checks: any[] }> => {
  if (useMock) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      status: 'online',
      checks: [
        { endpoint: '/services', method: 'GET', success: true, status: 200, failures: [], possible_causes: ['Endpoint is operational.'], recommended_actions: ['No action required.'] },
        { endpoint: '/cost', method: 'POST', success: true, status: 200, failures: [], possible_causes: ['Endpoint is operational.'], recommended_actions: ['No action required.'] },
        { endpoint: '/logs', method: 'POST', success: true, status: 200, failures: [], possible_causes: ['Endpoint is operational.'], recommended_actions: ['No action required.'] },
        { endpoint: '/cost-history', method: 'GET', success: true, status: 200, failures: [], possible_causes: ['Endpoint is operational.'], recommended_actions: ['No action required.'] },
        { endpoint: '/log-history', method: 'GET', success: true, status: 200, failures: [], possible_causes: ['Endpoint is operational.'], recommended_actions: ['No action required.'] }
      ]
    };
  }
  try {
    const response = await fetch(getUrl('/health'), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });
    return await response.json();
  } catch (err) {
    console.error('Failed to fetch health status:', err);
    return { status: 'offline', checks: [] };
  }
};

export const fetchHealthHistory = async (): Promise<{ history: number[] }> => {
  if (useMock) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return { history: [45, 52, 48, 62, 50, 42, 48, 55, 47, 51] };
  }
  try {
    const response = await fetch(getUrl('/health/history'), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });
    return await response.json();
  } catch (err) {
    console.error('Failed to fetch health history:', err);
    return { history: [45, 52, 48, 62, 50, 42, 48, 55, 47, 51] };
  }
};

export const fetchHealthMetrics = async (): Promise<{
  current_latency: number;
  avg_latency: number;
  min_latency: number;
  max_latency: number;
  p95_latency: number;
  uptime_pct: number;
  success_rate: number;
  last_check_timestamp: string | null;
}> => {
  if (useMock) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      current_latency: 50,
      avg_latency: 48,
      min_latency: 40,
      max_latency: 65,
      p95_latency: 60,
      uptime_pct: 100,
      success_rate: 100,
      last_check_timestamp: new Date().toISOString()
    };
  }
  try {
    const response = await fetch(getUrl('/health/metrics'), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });
    return await response.json();
  } catch (err) {
    console.error('Failed to fetch health metrics:', err);
    return {
      current_latency: 0,
      avg_latency: 0,
      min_latency: 0,
      max_latency: 0,
      p95_latency: 0,
      uptime_pct: 100,
      success_rate: 100,
      last_check_timestamp: null
    };
  }
};

export const pingHealth = async (): Promise<{ status: 'online' | 'degraded' | 'offline'; checks: any[] }> => {
  if (useMock) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      status: 'online',
      checks: [
        { endpoint: '/services', method: 'GET', success: true, status: 200, failures: [], possible_causes: ['Endpoint is operational.'], recommended_actions: ['No action required.'] },
        { endpoint: '/cost', method: 'POST', success: true, status: 200, failures: [], possible_causes: ['Endpoint is operational.'], recommended_actions: ['No action required.'] },
        { endpoint: '/logs', method: 'POST', success: true, status: 200, failures: [], possible_causes: ['Endpoint is operational.'], recommended_actions: ['No action required.'] },
        { endpoint: '/cost-history', method: 'GET', success: true, status: 200, failures: [], possible_causes: ['Endpoint is operational.'], recommended_actions: ['No action required.'] },
        { endpoint: '/log-history', method: 'GET', success: true, status: 200, failures: [], possible_causes: ['Endpoint is operational.'], recommended_actions: ['No action required.'] }
      ]
    };
  }
  try {
    const response = await fetch(getUrl('/health/ping'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000) // Allow 10s for parallel checks
    });
    return await response.json();
  } catch (err) {
    console.error('Failed to run health ping:', err);
    return { status: 'offline', checks: [] };
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

const LOCAL_CATALOG_MOCK = [
  {
    "id": "ec2",
    "name": "EC2 Compute Instances",
    "category": "Compute",
    "tier": 1,
    "icon": "Cpu",
    "description": "Virtual servers in the cloud",
    "fields": "ec2"
  },
  {
    "id": "lambda",
    "name": "AWS Lambda (Serverless Compute)",
    "category": "Compute",
    "tier": 2,
    "icon": "Cpu",
    "description": "Run code in response to events without server provisioning",
    "fields": "lambda"
  },
  {
    "id": "lightsail",
    "name": "Amazon Lightsail VPS",
    "category": "Compute",
    "tier": 2,
    "icon": "Cpu",
    "description": "Virtual private servers, storage, and networking built for simplicity",
    "fields": "generic",
    "unit": "Instance Hours",
    "defaultRate": 0.007
  },
  {
    "id": "batch",
    "name": "AWS Batch (Batch Jobs)",
    "category": "Compute",
    "tier": 2,
    "icon": "Cpu",
    "description": "Run batch computing jobs at any scale",
    "fields": "generic",
    "unit": "Job Run Hours",
    "defaultRate": 0.015
  },
  {
    "id": "elasticbeanstalk",
    "name": "AWS Elastic Beanstalk",
    "category": "Compute",
    "tier": 3,
    "icon": "Cpu",
    "description": "Deploy and scale web apps and services",
    "fields": "generic"
  },
  {
    "id": "outposts",
    "name": "AWS Outposts",
    "category": "Compute",
    "tier": 3,
    "icon": "Cpu",
    "description": "Run AWS services on-premises",
    "fields": "generic"
  },
  {
    "id": "wavelength",
    "name": "AWS Wavelength",
    "category": "Compute",
    "tier": 3,
    "icon": "Cpu",
    "description": "Deliver ultra-low latency applications for 5G devices",
    "fields": "generic"
  },
  {
    "id": "localzones",
    "name": "AWS Local Zones",
    "category": "Compute",
    "tier": 3,
    "icon": "Cpu",
    "description": "Place compute, storage, database closer to large population centers",
    "fields": "generic"
  },
  {
    "id": "serverlessrepo",
    "name": "AWS Serverless Application Repository",
    "category": "Compute",
    "tier": 3,
    "icon": "Cpu",
    "description": "Store and share serverless applications",
    "fields": "generic"
  },
  {
    "id": "simspace",
    "name": "AWS SimSpace Weaver",
    "category": "Compute",
    "tier": 3,
    "icon": "Cpu",
    "description": "Build and run large-scale spatial simulations",
    "fields": "generic"
  },
  {
    "id": "ec2imagebuilder",
    "name": "EC2 Image Builder",
    "category": "Compute",
    "tier": 3,
    "icon": "Cpu",
    "description": "Build secure virtual machine and container images",
    "fields": "generic"
  },
  {
    "id": "apprunner",
    "name": "AWS App Runner",
    "category": "Compute",
    "tier": 3,
    "icon": "Cpu",
    "description": "Deploy containerized web applications at scale quickly",
    "fields": "generic"
  },
  {
    "id": "bottlerocket",
    "name": "Bottlerocket OS",
    "category": "Compute",
    "tier": 3,
    "icon": "Cpu",
    "description": "Linux-based open-source operating system purpose-built for containers",
    "fields": "generic"
  },
  {
    "id": "ecsanywhere",
    "name": "Amazon ECS Anywhere",
    "category": "Compute",
    "tier": 3,
    "icon": "Cpu",
    "description": "Run Amazon ECS container tasks on customer-managed infrastructure",
    "fields": "generic"
  },
  {
    "id": "eksanywhere",
    "name": "Amazon EKS Anywhere",
    "category": "Compute",
    "tier": 3,
    "icon": "Cpu",
    "description": "Run Amazon EKS on customer-managed infrastructure",
    "fields": "generic"
  },
  {
    "id": "ecs",
    "name": "ECS (Elastic Container Service)",
    "category": "Containers",
    "tier": 1,
    "icon": "Cpu",
    "description": "Run and scale containerized applications",
    "fields": "generic",
    "unit": "vCPU Hours",
    "defaultRate": 0.0406
  },
  {
    "id": "eks",
    "name": "EKS (Elastic Kubernetes Service)",
    "category": "Containers",
    "tier": 1,
    "icon": "Cpu",
    "description": "Run managed Kubernetes clusters on AWS",
    "fields": "generic",
    "unit": "Cluster Hours",
    "defaultRate": 0.1
  },
  {
    "id": "ecr",
    "name": "Elastic Container Registry (ECR)",
    "category": "Containers",
    "tier": 2,
    "icon": "Cloud",
    "description": "Store, manage, and deploy container images securely",
    "fields": "generic",
    "unit": "GB Storage-Month",
    "defaultRate": 0.1
  },
  {
    "id": "s3",
    "name": "S3 Standard Storage",
    "category": "Storage",
    "tier": 2,
    "icon": "Cloud",
    "description": "Highly scalable, reliable, and secure object storage",
    "fields": "s3"
  },
  {
    "id": "ebs",
    "name": "EBS Volume Storage",
    "category": "Storage",
    "tier": 1,
    "icon": "Cloud",
    "description": "High performance block storage volumes for EC2",
    "fields": "generic",
    "unit": "GB-Month",
    "defaultRate": 0.1
  },
  {
    "id": "efs",
    "name": "EFS File System Storage",
    "category": "Storage",
    "tier": 2,
    "icon": "Cloud",
    "description": "Simple, serverless, set-and-forget elastic file systems",
    "fields": "generic",
    "unit": "GB-Month",
    "defaultRate": 0.3
  },
  {
    "id": "fsx",
    "name": "FSx Managed File Systems",
    "category": "Storage",
    "tier": 1,
    "icon": "Cloud",
    "description": "Fully managed third-party file systems (Windows, Lustre, NetApp, OpenZFS)",
    "fields": "generic",
    "unit": "GB-Month",
    "defaultRate": 0.13
  },
  {
    "id": "glacier",
    "name": "S3 Glacier Storage",
    "category": "Storage",
    "tier": 2,
    "icon": "Cloud",
    "description": "Secure, durable, and low-cost archive storage in S3",
    "fields": "generic",
    "unit": "GB-Month",
    "defaultRate": 0.0036
  },
  {
    "id": "backup",
    "name": "AWS Backup",
    "category": "Storage",
    "tier": 2,
    "icon": "Cloud",
    "description": "Centralized backup management across AWS services",
    "fields": "generic",
    "unit": "GB Storage-Month",
    "defaultRate": 0.05
  },
  {
    "id": "storagegateway",
    "name": "AWS Storage Gateway",
    "category": "Storage",
    "tier": 3,
    "icon": "Cloud",
    "description": "Hybrid cloud storage with local caching",
    "fields": "generic"
  },
  {
    "id": "snowball",
    "name": "AWS Snowball",
    "category": "Storage",
    "tier": 3,
    "icon": "Cloud",
    "description": "Physical data transport device with edge computing capabilities",
    "fields": "generic"
  },
  {
    "id": "snowcone",
    "name": "AWS Snowcone",
    "category": "Storage",
    "tier": 3,
    "icon": "Cloud",
    "description": "Ultra-portable, rugged edge computing and storage device",
    "fields": "generic"
  },
  {
    "id": "snowmobile",
    "name": "AWS Snowmobile",
    "category": "Storage",
    "tier": 3,
    "icon": "Cloud",
    "description": "Exabyte-scale data transfer truck",
    "fields": "generic"
  },
  {
    "id": "elasticdisasterrecovery",
    "name": "AWS Elastic Disaster Recovery",
    "category": "Storage",
    "tier": 3,
    "icon": "Cloud",
    "description": "Minimize downtime and data loss with fast, reliable recovery",
    "fields": "generic"
  },
  {
    "id": "rds",
    "name": "RDS Database Instance",
    "category": "Database",
    "tier": 1,
    "icon": "Database",
    "description": "Managed relational databases for MySQL, PostgreSQL, Oracle, SQL Server",
    "fields": "rds"
  },
  {
    "id": "dynamodb",
    "name": "DynamoDB NoSQL database",
    "category": "Database",
    "tier": 2,
    "icon": "Database",
    "description": "Fully managed fast, flexible, serverless NoSQL database",
    "fields": "generic",
    "unit": "Capacity Units",
    "defaultRate": 0.00065
  },
  {
    "id": "redshift",
    "name": "Redshift Data Warehouse",
    "category": "Database",
    "tier": 1,
    "icon": "Database",
    "description": "Fast, simple, cost-effective cloud data warehouse",
    "fields": "generic",
    "unit": "Node Hours",
    "defaultRate": 0.25
  },
  {
    "id": "elasticache",
    "name": "ElastiCache (Redis / Memcached)",
    "category": "Database",
    "tier": 1,
    "icon": "Database",
    "description": "In-memory caching and database service",
    "fields": "generic",
    "unit": "Node Hours",
    "defaultRate": 0.022
  },
  {
    "id": "documentdb",
    "name": "DocumentDB (with MongoDB compatibility)",
    "category": "Database",
    "tier": 1,
    "icon": "Database",
    "description": "Fast, scalable, highly available MongoDB-compatible database",
    "fields": "generic",
    "unit": "Node Hours",
    "defaultRate": 0.077
  },
  {
    "id": "memorydb",
    "name": "MemoryDB for Redis",
    "category": "Database",
    "tier": 1,
    "icon": "Database",
    "description": "Redis-compatible, durable, in-memory database service",
    "fields": "generic",
    "unit": "Node Hours",
    "defaultRate": 0.013
  },
  {
    "id": "keyspaces",
    "name": "Amazon Keyspaces (Cassandra)",
    "category": "Database",
    "tier": 3,
    "icon": "Database",
    "description": "Scalable, highly available, managed Cassandra-compatible database",
    "fields": "generic"
  },
  {
    "id": "neptune",
    "name": "Amazon Neptune",
    "category": "Database",
    "tier": 3,
    "icon": "Database",
    "description": "Fast, reliable, managed graph database built for cloud",
    "fields": "generic"
  },
  {
    "id": "timestream",
    "name": "Amazon Timestream",
    "category": "Database",
    "tier": 3,
    "icon": "Database",
    "description": "Managed, fast, serverless time-series database",
    "fields": "generic"
  },
  {
    "id": "qldb",
    "name": "Amazon QLDB",
    "category": "Database",
    "tier": 3,
    "icon": "Database",
    "description": "Fully managed ledger database for cryptographically verifiable transaction logs",
    "fields": "generic"
  },
  {
    "id": "rdsproxy",
    "name": "Amazon RDS Proxy",
    "category": "Database",
    "tier": 3,
    "icon": "Database",
    "description": "Highly available database proxy for scale and connection pooling",
    "fields": "generic"
  },
  {
    "id": "elasticacheserverless",
    "name": "ElastiCache Serverless",
    "category": "Database",
    "tier": 3,
    "icon": "Database",
    "description": "Instantly create serverless Redis or Memcached caches",
    "fields": "generic"
  },
  {
    "id": "neptuneserverless",
    "name": "Neptune Serverless",
    "category": "Database",
    "tier": 3,
    "icon": "Database",
    "description": "Serverless graph database scaling automatically based on traffic",
    "fields": "generic"
  },
  {
    "id": "aurora",
    "name": "Amazon Aurora DB",
    "category": "Database",
    "tier": 1,
    "icon": "Database",
    "description": "High performance relational database with MySQL/PostgreSQL compatibility",
    "fields": "rds"
  },
  {
    "id": "vpc",
    "name": "Amazon VPC Network Routing",
    "category": "Networking & Content Delivery",
    "tier": 2,
    "icon": "Activity",
    "description": "Provision isolated virtual networks for cloud workloads",
    "fields": "generic",
    "unit": "GB-Data",
    "defaultRate": 0.01
  },
  {
    "id": "cloudfront",
    "name": "CloudFront CDN distribution",
    "category": "Networking & Content Delivery",
    "tier": 2,
    "icon": "Activity",
    "description": "Global content delivery network with edge performance",
    "fields": "generic",
    "unit": "GB-Transferred",
    "defaultRate": 0.085
  },
  {
    "id": "api-gateway",
    "name": "API Gateway Management",
    "category": "Networking & Content Delivery",
    "tier": 2,
    "icon": "Activity",
    "description": "Create, maintain, monitor, and secure REST and HTTP APIs at scale",
    "fields": "generic",
    "unit": "Million Requests",
    "defaultRate": 3.5
  },
  {
    "id": "route53",
    "name": "Route 53 DNS Resolver",
    "category": "Networking & Content Delivery",
    "tier": 2,
    "icon": "Activity",
    "description": "Reliable and cost-effective DNS and domain routing",
    "fields": "generic",
    "unit": "Hosted Zones",
    "defaultRate": 0.5
  },
  {
    "id": "elb",
    "name": "Load Balancer (ALB / NLB)",
    "category": "Networking & Content Delivery",
    "tier": 2,
    "icon": "Activity",
    "description": "Distribute incoming traffic across target containers, VMs, and IPs",
    "fields": "generic",
    "unit": "LCU Hours",
    "defaultRate": 0.0252
  },
  {
    "id": "transitgateway",
    "name": "AWS Transit Gateway",
    "category": "Networking & Content Delivery",
    "tier": 3,
    "icon": "Activity",
    "description": "Connect VPCs and on-premises networks through a central hub",
    "fields": "generic"
  },
  {
    "id": "appmesh",
    "name": "AWS App Mesh",
    "category": "Networking & Content Delivery",
    "tier": 3,
    "icon": "Activity",
    "description": "Application-level networking configuration for containers and microservices",
    "fields": "generic"
  },
  {
    "id": "directconnect",
    "name": "AWS Direct Connect",
    "category": "Networking & Content Delivery",
    "tier": 3,
    "icon": "Activity",
    "description": "Dedicated private network connection from on-premise to AWS",
    "fields": "generic"
  },
  {
    "id": "globalaccelerator",
    "name": "AWS Global Accelerator",
    "category": "Networking & Content Delivery",
    "tier": 3,
    "icon": "Activity",
    "description": "Improve application speed and availability with a global network path",
    "fields": "generic"
  },
  {
    "id": "vpn",
    "name": "AWS Client VPN",
    "category": "Networking & Content Delivery",
    "tier": 3,
    "icon": "Activity",
    "description": "Secure client and server-to-server network access configurations",
    "fields": "generic"
  },
  {
    "id": "privatelink",
    "name": "AWS PrivateLink",
    "category": "Networking & Content Delivery",
    "tier": 3,
    "icon": "Activity",
    "description": "Secure private VPC connectivity to endpoints and APIs",
    "fields": "generic"
  },
  {
    "id": "route53resolver",
    "name": "Route 53 Resolver",
    "category": "Networking & Content Delivery",
    "tier": 3,
    "icon": "Activity",
    "description": "DNS queries resolution between hybrid IT networks",
    "fields": "generic"
  },
  {
    "id": "cloudmap",
    "name": "AWS Cloud Map",
    "category": "Networking & Content Delivery",
    "tier": 3,
    "icon": "Activity",
    "description": "Cloud resource discovery service for application microservices",
    "fields": "generic"
  },
  {
    "id": "networkfirewall",
    "name": "AWS Network Firewall",
    "category": "Networking & Content Delivery",
    "tier": 3,
    "icon": "Activity",
    "description": "Deploy stateful network threat filtering at VPC boundaries",
    "fields": "generic"
  },
  {
    "id": "verifiedaccess",
    "name": "AWS Verified Access",
    "category": "Networking & Content Delivery",
    "tier": 3,
    "icon": "Activity",
    "description": "Secure corporate application access without a VPN",
    "fields": "generic"
  },
  {
    "id": "route53arc",
    "name": "Route 53 Application Recovery Controller",
    "category": "Networking & Content Delivery",
    "tier": 3,
    "icon": "Activity",
    "description": "Monitor redundant application configurations for disaster recovery failovers",
    "fields": "generic"
  },
  {
    "id": "cloudwan",
    "name": "AWS Cloud WAN",
    "category": "Networking & Content Delivery",
    "tier": 3,
    "icon": "Activity",
    "description": "Build, manage, and monitor global wide area networks",
    "fields": "generic"
  },
  {
    "id": "datatransfer",
    "name": "AWS Data Transfer",
    "category": "Networking & Content Delivery",
    "tier": 2,
    "icon": "Activity",
    "description": "AWS data transfer charges to the Internet and other regions",
    "fields": "generic",
    "unit": "GB Transferred",
    "defaultRate": 0.09
  },
  {
    "id": "athena",
    "name": "Athena Serverless Queries",
    "category": "Analytics",
    "tier": 3,
    "icon": "BarChart",
    "description": "Query data in S3 using standard SQL instantly",
    "fields": "generic"
  },
  {
    "id": "glue",
    "name": "Glue ETL Pipeline Scheduler",
    "category": "Analytics",
    "tier": 3,
    "icon": "BarChart",
    "description": "Simple data integration and ETL mapping serverless workflows",
    "fields": "generic"
  },
  {
    "id": "emr",
    "name": "EMR Big Data Compute Nodes",
    "category": "Analytics",
    "tier": 3,
    "icon": "BarChart",
    "description": "Run open-source big data frameworks (Apache Spark, Hadoop, Presto)",
    "fields": "generic"
  },
  {
    "id": "kinesis",
    "name": "Amazon Kinesis Data Streams",
    "category": "Analytics",
    "tier": 3,
    "icon": "BarChart",
    "description": "Ingest and process real-time streaming data at scale",
    "fields": "generic"
  },
  {
    "id": "kinesisfirehose",
    "name": "Amazon Kinesis Data Firehose",
    "category": "Analytics",
    "tier": 3,
    "icon": "BarChart",
    "description": "Deliver streaming data to destinations like S3, Redshift, OpenSearch",
    "fields": "generic"
  },
  {
    "id": "kinesisanalytics",
    "name": "Amazon Kinesis Data Analytics",
    "category": "Analytics",
    "tier": 3,
    "icon": "BarChart",
    "description": "Analyze streaming data in real-time with SQL or Apache Flink",
    "fields": "generic"
  },
  {
    "id": "quicksight",
    "name": "QuickSight BI Dashboarding",
    "category": "Analytics",
    "tier": 3,
    "icon": "BarChart",
    "description": "Fast, cloud-powered business intelligence reporting dashboards",
    "fields": "generic"
  },
  {
    "id": "msk",
    "name": "Managed Streaming for Apache Kafka (MSK)",
    "category": "Analytics",
    "tier": 3,
    "icon": "BarChart",
    "description": "Run fully managed Apache Kafka clusters easily",
    "fields": "generic"
  },
  {
    "id": "opensearch",
    "name": "OpenSearch Service",
    "category": "Analytics",
    "tier": 1,
    "icon": "BarChart",
    "description": "Search, analyze, and visualize data in real-time",
    "fields": "generic",
    "unit": "Instance Hours",
    "defaultRate": 0.05
  },
  {
    "id": "dataexchange",
    "name": "AWS Data Exchange",
    "category": "Analytics",
    "tier": 3,
    "icon": "BarChart",
    "description": "Find, subscribe to, and use third-party data sets",
    "fields": "generic"
  },
  {
    "id": "lakeformation",
    "name": "AWS Lake Formation",
    "category": "Analytics",
    "tier": 3,
    "icon": "BarChart",
    "description": "Build, secure, and manage data lakes easily",
    "fields": "generic"
  },
  {
    "id": "cleanrooms",
    "name": "AWS Clean Rooms",
    "category": "Analytics",
    "tier": 3,
    "icon": "BarChart",
    "description": "Collaborate on collective data sets without sharing raw data",
    "fields": "generic"
  },
  {
    "id": "finspace",
    "name": "Amazon FinSpace",
    "category": "Analytics",
    "tier": 3,
    "icon": "BarChart",
    "description": "Data management and analytics for the financial services industry",
    "fields": "generic"
  },
  {
    "id": "datapipeline",
    "name": "AWS Data Pipeline",
    "category": "Analytics",
    "tier": 3,
    "icon": "BarChart",
    "description": "Orchestrate data movement and transformations across databases",
    "fields": "generic"
  },
  {
    "id": "opensearchserverless",
    "name": "OpenSearch Serverless",
    "category": "Analytics",
    "tier": 3,
    "icon": "BarChart",
    "description": "Serverless search and log analytics engine option",
    "fields": "generic"
  },
  {
    "id": "gluedatabrew",
    "name": "AWS Glue DataBrew",
    "category": "Analytics",
    "tier": 3,
    "icon": "BarChart",
    "description": "Visual data preparation tool for cleanups and normalization",
    "fields": "generic"
  },
  {
    "id": "iam",
    "name": "IAM Access Rights Policy",
    "category": "Security, Identity & Compliance",
    "tier": 2,
    "icon": "Shield",
    "description": "Centrally manage users, credentials, and resource access policies",
    "fields": "generic",
    "unit": "Active Users",
    "defaultRate": 0.0
  },
  {
    "id": "kms",
    "name": "KMS Key Cryptography",
    "category": "Security, Identity & Compliance",
    "tier": 2,
    "icon": "Shield",
    "description": "Create and control cryptographic keys to encrypt data",
    "fields": "generic",
    "unit": "Active Keys",
    "defaultRate": 1.0
  },
  {
    "id": "secretsmanager",
    "name": "Secrets Manager Vault",
    "category": "Security, Identity & Compliance",
    "tier": 2,
    "icon": "Shield",
    "description": "Store, rotate, and retrieve application secrets and API credentials",
    "fields": "generic",
    "unit": "Secrets-Month",
    "defaultRate": 0.4
  },
  {
    "id": "guardduty",
    "name": "Amazon GuardDuty",
    "category": "Security, Identity & Compliance",
    "tier": 3,
    "icon": "Shield",
    "description": "Intelligent threat detection and continuous security monitoring",
    "fields": "generic"
  },
  {
    "id": "inspector",
    "name": "Amazon Inspector",
    "category": "Security, Identity & Compliance",
    "tier": 3,
    "icon": "Shield",
    "description": "Automated vulnerability management for workloads",
    "fields": "generic"
  },
  {
    "id": "macie",
    "name": "Amazon Macie",
    "category": "Security, Identity & Compliance",
    "tier": 3,
    "icon": "Shield",
    "description": "Discover and protect sensitive data at scale in S3",
    "fields": "generic"
  },
  {
    "id": "shield",
    "name": "AWS Shield",
    "category": "Security, Identity & Compliance",
    "tier": 3,
    "icon": "Shield",
    "description": "Managed DDoS protection for apps running on AWS",
    "fields": "generic"
  },
  {
    "id": "waf",
    "name": "AWS WAF",
    "category": "Security, Identity & Compliance",
    "tier": 3,
    "icon": "Shield",
    "description": "Protect web applications from common web exploits and attacks",
    "fields": "generic"
  },
  {
    "id": "cognito",
    "name": "Amazon Cognito",
    "category": "Security, Identity & Compliance",
    "tier": 3,
    "icon": "Shield",
    "description": "Customer identity and access management for sign-ups and sign-ins",
    "fields": "generic"
  },
  {
    "id": "securityhub",
    "name": "AWS Security Hub",
    "category": "Security, Identity & Compliance",
    "tier": 3,
    "icon": "Shield",
    "description": "Unified security and compliance posture checks",
    "fields": "generic"
  },
  {
    "id": "detective",
    "name": "Amazon Detective",
    "category": "Security, Identity & Compliance",
    "tier": 3,
    "icon": "Shield",
    "description": "Investigate and analyze the root causes of security findings",
    "fields": "generic"
  },
  {
    "id": "auditmanager",
    "name": "AWS Audit Manager",
    "category": "Security, Identity & Compliance",
    "tier": 3,
    "icon": "Shield",
    "description": "Continuously audit AWS usage for compliance",
    "fields": "generic"
  },
  {
    "id": "signer",
    "name": "AWS Signer",
    "category": "Security, Identity & Compliance",
    "tier": 3,
    "icon": "Shield",
    "description": "Fully managed code signing service trust validations",
    "fields": "generic"
  },
  {
    "id": "ram",
    "name": "AWS Resource Access Manager (RAM)",
    "category": "Security, Identity & Compliance",
    "tier": 3,
    "icon": "Shield",
    "description": "Share resources securely across multiple AWS accounts",
    "fields": "generic"
  },
  {
    "id": "directoryservice",
    "name": "AWS Directory Service",
    "category": "Security, Identity & Compliance",
    "tier": 3,
    "icon": "Shield",
    "description": "Managed Microsoft Active Directory in the cloud",
    "fields": "generic"
  },
  {
    "id": "cloudhsm",
    "name": "AWS CloudHSM",
    "category": "Security, Identity & Compliance",
    "tier": 3,
    "icon": "Shield",
    "description": "Managed hardware security modules (HSM) on AWS network",
    "fields": "generic"
  },
  {
    "id": "verifiedaccesssec",
    "name": "AWS Verified Access",
    "category": "Security, Identity & Compliance",
    "tier": 3,
    "icon": "Shield",
    "description": "Secure access to applications based on zero-trust parameters",
    "fields": "generic"
  },
  {
    "id": "acm",
    "name": "AWS Certificate Manager (ACM)",
    "category": "Security, Identity & Compliance",
    "tier": 3,
    "icon": "Shield",
    "description": "Provision, manage, and deploy SSL/TLS certificates",
    "fields": "generic"
  },
  {
    "id": "identitycenter",
    "name": "AWS IAM Identity Center",
    "category": "Security, Identity & Compliance",
    "tier": 3,
    "icon": "Shield",
    "description": "Single sign-on access dashboard and portal for accounts",
    "fields": "generic"
  },
  {
    "id": "firewallmanager",
    "name": "AWS Firewall Manager",
    "category": "Security, Identity & Compliance",
    "tier": 3,
    "icon": "Shield",
    "description": "Central rule administrator for WAF, Shield, and groups",
    "fields": "generic"
  },
  {
    "id": "securitylake",
    "name": "Amazon Security Lake",
    "category": "Security, Identity & Compliance",
    "tier": 3,
    "icon": "Shield",
    "description": "Automatically centralize security data from cloud and on-prem",
    "fields": "generic"
  },
  {
    "id": "cloudwatch",
    "name": "CloudWatch metrics & logs",
    "category": "Management & Governance",
    "tier": 2,
    "icon": "Eye",
    "description": "Observe and monitor infrastructure resources and apps",
    "fields": "generic",
    "unit": "GB Ingested",
    "defaultRate": 0.3
  },
  {
    "id": "cloudtrail",
    "name": "CloudTrail Audit Streams",
    "category": "Management & Governance",
    "tier": 2,
    "icon": "Eye",
    "description": "Audit and track user actions and API calls across AWS",
    "fields": "generic",
    "unit": "Million Events",
    "defaultRate": 2.0
  },
  {
    "id": "config",
    "name": "AWS Config",
    "category": "Management & Governance",
    "tier": 3,
    "icon": "Eye",
    "description": "Record and evaluate configurations of AWS resources",
    "fields": "generic"
  },
  {
    "id": "ssm",
    "name": "AWS Systems Manager",
    "category": "Management & Governance",
    "tier": 3,
    "icon": "Eye",
    "description": "Operations hub for secure resource management at scale",
    "fields": "generic"
  },
  {
    "id": "organizations",
    "name": "AWS Organizations",
    "category": "Management & Governance",
    "tier": 3,
    "icon": "Eye",
    "description": "Central management and consolidation of multiple AWS accounts",
    "fields": "generic"
  },
  {
    "id": "controltower",
    "name": "AWS Control Tower",
    "category": "Management & Governance",
    "tier": 3,
    "icon": "Eye",
    "description": "Set up and govern secure multi-account AWS environments",
    "fields": "generic"
  },
  {
    "id": "servicecatalog",
    "name": "AWS Service Catalog",
    "category": "Management & Governance",
    "tier": 3,
    "icon": "Eye",
    "description": "Create and manage catalogs of IT services approved for use",
    "fields": "generic"
  },
  {
    "id": "cloudformation",
    "name": "AWS CloudFormation",
    "category": "Management & Governance",
    "tier": 3,
    "icon": "Eye",
    "description": "Model, provision, and manage AWS resources using templates",
    "fields": "generic"
  },
  {
    "id": "autoscaling",
    "name": "AWS Auto Scaling",
    "category": "Management & Governance",
    "tier": 3,
    "icon": "Eye",
    "description": "Automatically adjust resources to maintain stable performance",
    "fields": "generic"
  },
  {
    "id": "budgets",
    "name": "AWS Budgets",
    "category": "Management & Governance",
    "tier": 3,
    "icon": "Eye",
    "description": "Set custom budgets and receive spending notification alerts",
    "fields": "generic"
  },
  {
    "id": "costexplorer",
    "name": "AWS Cost Explorer",
    "category": "Management & Governance",
    "tier": 3,
    "icon": "Eye",
    "description": "Visualize, understand, and manage your AWS costs over time",
    "fields": "generic"
  },
  {
    "id": "wellarchitected",
    "name": "AWS Well-Architected Tool",
    "category": "Management & Governance",
    "tier": 3,
    "icon": "Eye",
    "description": "Measure your architecture against cloud best practices",
    "fields": "generic"
  },
  {
    "id": "appconfig",
    "name": "AWS AppConfig",
    "category": "Management & Governance",
    "tier": 3,
    "icon": "Eye",
    "description": "Configure, validate, and deploy application flags at runtime",
    "fields": "generic"
  },
  {
    "id": "licensemanager",
    "name": "AWS License Manager",
    "category": "Management & Governance",
    "tier": 3,
    "icon": "Eye",
    "description": "Track software licenses (Microsoft, Oracle, SAP) dynamically",
    "fields": "generic"
  },
  {
    "id": "trustedadvisor",
    "name": "AWS Trusted Advisor",
    "category": "Management & Governance",
    "tier": 2,
    "icon": "Eye",
    "description": "Optimize costs, security, tolerance, and performance",
    "fields": "generic",
    "unit": "Recommendations Checked",
    "defaultRate": 0.0
  },
  {
    "id": "health",
    "name": "AWS Health Dashboard",
    "category": "Management & Governance",
    "tier": 3,
    "icon": "Eye",
    "description": "Track alerts and status events impacting your AWS infrastructure",
    "fields": "generic"
  },
  {
    "id": "resiliencehub",
    "name": "AWS Resilience Hub",
    "category": "Management & Governance",
    "tier": 3,
    "icon": "Eye",
    "description": "Define, track, and improve application resilience capabilities",
    "fields": "generic"
  },
  {
    "id": "computeoptimizer",
    "name": "AWS Compute Optimizer",
    "category": "Management & Governance",
    "tier": 3,
    "icon": "Eye",
    "description": "Get recommendations for right-sizing EC2, EBS, Lambda",
    "fields": "generic"
  },
  {
    "id": "servicequotas",
    "name": "AWS Service Quotas",
    "category": "Management & Governance",
    "tier": 3,
    "icon": "Eye",
    "description": "View and request limit increases for AWS service values",
    "fields": "generic"
  },
  {
    "id": "launchwizard",
    "name": "AWS Launch Wizard",
    "category": "Management & Governance",
    "tier": 3,
    "icon": "Eye",
    "description": "Guided setup for enterprise applications like SAP, SQL Server",
    "fields": "generic"
  },
  {
    "id": "dms",
    "name": "AWS Database Migration Service",
    "category": "Migration & Transfer",
    "tier": 3,
    "icon": "BarChart",
    "description": "Migrate databases to AWS with minimal downtime",
    "fields": "generic"
  },
  {
    "id": "datasync",
    "name": "AWS DataSync",
    "category": "Migration & Transfer",
    "tier": 3,
    "icon": "BarChart",
    "description": "Automate moving data between storage systems and AWS",
    "fields": "generic"
  },
  {
    "id": "transfer",
    "name": "AWS Transfer Family",
    "category": "Migration & Transfer",
    "tier": 3,
    "icon": "BarChart",
    "description": "Fully managed support for SFTP, FTPS, and FTP into S3/EFS",
    "fields": "generic"
  },
  {
    "id": "migrationhub",
    "name": "AWS Migration Hub",
    "category": "Migration & Transfer",
    "tier": 3,
    "icon": "BarChart",
    "description": "Single location to track migration statuses across tools",
    "fields": "generic"
  },
  {
    "id": "applicationdiscovery",
    "name": "AWS Application Discovery Service",
    "category": "Migration & Transfer",
    "tier": 3,
    "icon": "BarChart",
    "description": "Plan migrations by identifying on-premises inventory",
    "fields": "generic"
  },
  {
    "id": "mgn",
    "name": "AWS Application Migration Service",
    "category": "Migration & Transfer",
    "tier": 3,
    "icon": "BarChart",
    "description": "Lift-and-shift physical, virtual, and cloud servers to AWS",
    "fields": "generic"
  },
  {
    "id": "sms",
    "name": "AWS Server Migration Service",
    "category": "Migration & Transfer",
    "tier": 3,
    "icon": "BarChart",
    "description": "Migrate on-premises VMs to Amazon EC2 AMIs",
    "fields": "generic"
  },
  {
    "id": "mainframe",
    "name": "AWS Mainframe Modernization",
    "category": "Migration & Transfer",
    "tier": 3,
    "icon": "BarChart",
    "description": "Migrate mainframe workloads to AWS managed runtimes",
    "fields": "generic"
  },
  {
    "id": "sct",
    "name": "AWS Schema Conversion Tool",
    "category": "Migration & Transfer",
    "tier": 3,
    "icon": "BarChart",
    "description": "Convert database schemas for cross-engine migrations",
    "fields": "generic"
  },
  {
    "id": "migrationorchestrator",
    "name": "AWS Migration Hub Orchestrator",
    "category": "Migration & Transfer",
    "tier": 3,
    "icon": "BarChart",
    "description": "Simplify and automate application migration workflows",
    "fields": "generic"
  },
  {
    "id": "codecommit",
    "name": "AWS CodeCommit",
    "category": "Developer Tools",
    "tier": 3,
    "icon": "Cpu",
    "description": "Secure, highly scalable managed private Git repositories",
    "fields": "generic"
  },
  {
    "id": "codebuild",
    "name": "AWS CodeBuild",
    "category": "Developer Tools",
    "tier": 3,
    "icon": "Cpu",
    "description": "Build and test code with continuous scaling on-demand",
    "fields": "generic"
  },
  {
    "id": "codedeploy",
    "name": "AWS CodeDeploy",
    "category": "Developer Tools",
    "tier": 3,
    "icon": "Cpu",
    "description": "Automate code deployments to EC2, Fargate, Lambda",
    "fields": "generic"
  },
  {
    "id": "codepipeline",
    "name": "AWS CodePipeline",
    "category": "Developer Tools",
    "tier": 3,
    "icon": "Cpu",
    "description": "Orchestrate continuous delivery pipeline workflows",
    "fields": "generic"
  },
  {
    "id": "codestar",
    "name": "AWS CodeStar",
    "category": "Developer Tools",
    "tier": 3,
    "icon": "Cpu",
    "description": "Quick project workspace templates for cloud applications",
    "fields": "generic"
  },
  {
    "id": "cloud9",
    "name": "AWS Cloud9 IDE",
    "category": "Developer Tools",
    "tier": 3,
    "icon": "Cpu",
    "description": "Write, run, and debug code from any web browser",
    "fields": "generic"
  },
  {
    "id": "xray",
    "name": "AWS X-Ray",
    "category": "Developer Tools",
    "tier": 3,
    "icon": "Cpu",
    "description": "Analyze and debug production, distributed microservices",
    "fields": "generic"
  },
  {
    "id": "cloudshell",
    "name": "AWS CloudShell",
    "category": "Developer Tools",
    "tier": 3,
    "icon": "Cpu",
    "description": "Command-line terminal access to AWS CLI toolset",
    "fields": "generic"
  },
  {
    "id": "codewhisperer",
    "name": "Amazon CodeWhisperer AI",
    "category": "Developer Tools",
    "tier": 3,
    "icon": "Cpu",
    "description": "AI-powered coding suggestions inside your IDE",
    "fields": "generic"
  },
  {
    "id": "fis",
    "name": "AWS Fault Injection Simulator",
    "category": "Developer Tools",
    "tier": 3,
    "icon": "Cpu",
    "description": "Run controlled chaos engineering experiments on AWS",
    "fields": "generic"
  },
  {
    "id": "codeartifact",
    "name": "AWS CodeArtifact",
    "category": "Developer Tools",
    "tier": 3,
    "icon": "Cpu",
    "description": "Secure package management repository for npm, pip, maven",
    "fields": "generic"
  },
  {
    "id": "devicefarm",
    "name": "AWS Device Farm",
    "category": "Developer Tools",
    "tier": 3,
    "icon": "Cpu",
    "description": "Test applications on real browser and mobile devices",
    "fields": "generic"
  },
  {
    "id": "appconfigagent",
    "name": "AWS AppConfig Agent",
    "category": "Developer Tools",
    "tier": 3,
    "icon": "Cpu",
    "description": "Fetch and cache application feature flags locally",
    "fields": "generic"
  },
  {
    "id": "sagemaker",
    "name": "SageMaker Studio Notebooks",
    "category": "Machine Learning & AI",
    "tier": 3,
    "icon": "Brain",
    "description": "Build, train, and deploy machine learning models quickly",
    "fields": "generic",
    "unit": "Compute Hours",
    "defaultRate": 0.056
  },
  {
    "id": "bedrock",
    "name": "Bedrock AI Model APIs",
    "category": "Machine Learning & AI",
    "tier": 3,
    "icon": "Brain",
    "description": "Build generative AI apps with foundation model APIs",
    "fields": "generic",
    "unit": "Million Tokens",
    "defaultRate": 15.0
  },
  {
    "id": "rekognition",
    "name": "Rekognition Video/Image recognition",
    "category": "Machine Learning & AI",
    "tier": 3,
    "icon": "Brain",
    "description": "Identify objects, people, text, scenes in images/videos",
    "fields": "generic",
    "unit": "Images Scanned",
    "defaultRate": 0.001
  },
  {
    "id": "comprehend",
    "name": "Amazon Comprehend (NLP)",
    "category": "Machine Learning & AI",
    "tier": 3,
    "icon": "Brain",
    "description": "Natural language processing to find insights in text documents",
    "fields": "generic"
  },
  {
    "id": "translate",
    "name": "Amazon Translate",
    "category": "Machine Learning & AI",
    "tier": 3,
    "icon": "Brain",
    "description": "High-quality neural machine translation service for fast translation",
    "fields": "generic"
  },
  {
    "id": "transcribe",
    "name": "Amazon Transcribe",
    "category": "Machine Learning & AI",
    "tier": 3,
    "icon": "Brain",
    "description": "Speech-to-text voice audio transcription and analysis",
    "fields": "generic"
  },
  {
    "id": "polly",
    "name": "Amazon Polly (TTS)",
    "category": "Machine Learning & AI",
    "tier": 3,
    "icon": "Brain",
    "description": "Turn text into lifelike speech outputs across voices",
    "fields": "generic"
  },
  {
    "id": "lex",
    "name": "Amazon Lex (Chatbots)",
    "category": "Machine Learning & AI",
    "tier": 3,
    "icon": "Brain",
    "description": "Build voice and text conversational interfaces (chatbots)",
    "fields": "generic"
  },
  {
    "id": "forecast",
    "name": "Amazon Forecast",
    "category": "Machine Learning & AI",
    "tier": 3,
    "icon": "Brain",
    "description": "Build custom time-series forecasts with machine learning",
    "fields": "generic"
  },
  {
    "id": "personalize",
    "name": "Amazon Personalize",
    "category": "Machine Learning & AI",
    "tier": 3,
    "icon": "Brain",
    "description": "Deliver custom recommendations to application users",
    "fields": "generic"
  },
  {
    "id": "textract",
    "name": "Amazon Textract (OCR)",
    "category": "Machine Learning & AI",
    "tier": 3,
    "icon": "Brain",
    "description": "Extract scanned text, layout, tables, and handwriting",
    "fields": "generic"
  },
  {
    "id": "kendra",
    "name": "Amazon Kendra (Search)",
    "category": "Machine Learning & AI",
    "tier": 3,
    "icon": "Brain",
    "description": "Intelligent semantic search engine for repositories",
    "fields": "generic"
  },
  {
    "id": "codeguru",
    "name": "Amazon CodeGuru",
    "category": "Machine Learning & AI",
    "tier": 3,
    "icon": "Brain",
    "description": "Automate code quality checks and identify performance bottlenecks",
    "fields": "generic"
  },
  {
    "id": "devopsguru",
    "name": "Amazon DevOps Guru",
    "category": "Machine Learning & AI",
    "tier": 3,
    "icon": "Brain",
    "description": "Identify operational anomalies and recommend fixes",
    "fields": "generic"
  },
  {
    "id": "monitron",
    "name": "Amazon Monitron",
    "category": "Machine Learning & AI",
    "tier": 3,
    "icon": "Brain",
    "description": "End-to-end industrial machine condition monitoring system",
    "fields": "generic"
  },
  {
    "id": "lookoutmetrics",
    "name": "Amazon Lookout for Metrics",
    "category": "Machine Learning & AI",
    "tier": 3,
    "icon": "Brain",
    "description": "Find anomalies in business metrics and diagnostic drivers",
    "fields": "generic"
  },
  {
    "id": "lookoutvision",
    "name": "Amazon Lookout for Vision",
    "category": "Machine Learning & AI",
    "tier": 3,
    "icon": "Brain",
    "description": "Identify manufacturing visual defects at scale",
    "fields": "generic"
  },
  {
    "id": "lookoutequipment",
    "name": "Amazon Lookout for Equipment",
    "category": "Machine Learning & AI",
    "tier": 3,
    "icon": "Brain",
    "description": "Analyze sensor data for predictive maintenance",
    "fields": "generic"
  },
  {
    "id": "panorama",
    "name": "AWS Panorama",
    "category": "Machine Learning & AI",
    "tier": 3,
    "icon": "Brain",
    "description": "Run computer vision applications on on-premise cameras",
    "fields": "generic"
  },
  {
    "id": "healthlake",
    "name": "AWS HealthLake",
    "category": "Machine Learning & AI",
    "tier": 3,
    "icon": "Brain",
    "description": "Store and analyze petabyte-scale healthcare data records",
    "fields": "generic"
  },
  {
    "id": "comprehendmedical",
    "name": "Amazon Comprehend Medical",
    "category": "Machine Learning & AI",
    "tier": 3,
    "icon": "Brain",
    "description": "Extract medical conditions and dosages from records",
    "fields": "generic"
  },
  {
    "id": "deepracer",
    "name": "AWS DeepRacer",
    "category": "Machine Learning & AI",
    "tier": 3,
    "icon": "Brain",
    "description": "Hands-on Reinforcement Learning (RL) with autonomous cars",
    "fields": "generic"
  },
  {
    "id": "deepcomposer",
    "name": "AWS DeepComposer",
    "category": "Machine Learning & AI",
    "tier": 3,
    "icon": "Brain",
    "description": "Generative AI piano keyboard compose assistant",
    "fields": "generic"
  },
  {
    "id": "deeplens",
    "name": "AWS DeepLens Camera",
    "category": "Machine Learning & AI",
    "tier": 3,
    "icon": "Brain",
    "description": "Deep learning enabled developer video camera projects",
    "fields": "generic"
  },
  {
    "id": "a2i",
    "name": "Amazon Augmented AI (A2I)",
    "category": "Machine Learning & AI",
    "tier": 3,
    "icon": "Brain",
    "description": "Provide human review oversight logic for ML workflows",
    "fields": "generic"
  },
  {
    "id": "mediaconvert",
    "name": "Elemental MediaConvert",
    "category": "Media Services",
    "tier": 3,
    "icon": "Eye",
    "description": "Format and compress video files for multiscreen delivery",
    "fields": "generic"
  },
  {
    "id": "medialive",
    "name": "Elemental MediaLive",
    "category": "Media Services",
    "tier": 3,
    "icon": "Eye",
    "description": "Encode high-quality live video broadcasts",
    "fields": "generic"
  },
  {
    "id": "mediapackage",
    "name": "Elemental MediaPackage",
    "category": "Media Services",
    "tier": 3,
    "icon": "Eye",
    "description": "Prepare and protect video streams for internet delivery",
    "fields": "generic"
  },
  {
    "id": "mediastore",
    "name": "Elemental MediaStore",
    "category": "Media Services",
    "tier": 3,
    "icon": "Eye",
    "description": "High performance, low latency storage optimization for video",
    "fields": "generic"
  },
  {
    "id": "mediatailor",
    "name": "Elemental MediaTailor",
    "category": "Media Services",
    "tier": 3,
    "icon": "Eye",
    "description": "Insert targeted advertising content into video streams",
    "fields": "generic"
  },
  {
    "id": "kinesisvideo",
    "name": "Kinesis Video Streams",
    "category": "Media Services",
    "tier": 3,
    "icon": "Eye",
    "description": "Capture, process, and store video streams for analytics",
    "fields": "generic"
  },
  {
    "id": "ivs",
    "name": "Amazon Interactive Video Service (IVS)",
    "category": "Media Services",
    "tier": 3,
    "icon": "Eye",
    "description": "Managed live video platform for interactive streaming apps",
    "fields": "generic"
  },
  {
    "id": "elastictranscoder",
    "name": "Amazon Elastic Transcoder",
    "category": "Media Services",
    "tier": 3,
    "icon": "Eye",
    "description": "Highly scalable, easy-to-use video conversion tool",
    "fields": "generic"
  },
  {
    "id": "mediaconnect",
    "name": "Elemental MediaConnect",
    "category": "Media Services",
    "tier": 3,
    "icon": "Eye",
    "description": "High quality, secure live video transport networks",
    "fields": "generic"
  },
  {
    "id": "mediastream",
    "name": "Elemental MediaStream",
    "category": "Media Services",
    "tier": 3,
    "icon": "Eye",
    "description": "Manage and scale live media stream delivery pipelines",
    "fields": "generic"
  },
  {
    "id": "chime",
    "name": "Amazon Chime Meetings",
    "category": "Business Applications",
    "tier": 3,
    "icon": "Shield",
    "description": "Video conferencing, chat, and voice calls inside applications",
    "fields": "generic"
  },
  {
    "id": "workdocs",
    "name": "Amazon WorkDocs Collaboration",
    "category": "Business Applications",
    "tier": 3,
    "icon": "Shield",
    "description": "Secure enterprise storage and document collaboration service",
    "fields": "generic"
  },
  {
    "id": "workmail",
    "name": "Amazon WorkMail Business Email",
    "category": "Business Applications",
    "tier": 3,
    "icon": "Shield",
    "description": "Secure, managed business email and calendar servers",
    "fields": "generic"
  },
  {
    "id": "honeycode",
    "name": "Amazon Honeycode Builder",
    "category": "Business Applications",
    "tier": 3,
    "icon": "Shield",
    "description": "Build mobile and web business apps without programming",
    "fields": "generic"
  },
  {
    "id": "wickr",
    "name": "AWS Wickr Encryption",
    "category": "Business Applications",
    "tier": 3,
    "icon": "Shield",
    "description": "Secure end-to-end encrypted messaging and meetings",
    "fields": "generic"
  },
  {
    "id": "appfabric",
    "name": "AWS AppFabric Connect",
    "category": "Business Applications",
    "tier": 3,
    "icon": "Shield",
    "description": "Connect and coordinate multiple SaaS applications",
    "fields": "generic"
  },
  {
    "id": "chimesdk",
    "name": "Amazon Chime SDK",
    "category": "Business Applications",
    "tier": 3,
    "icon": "Shield",
    "description": "Embed audio/video calls directly into applications",
    "fields": "generic"
  },
  {
    "id": "supplychain",
    "name": "AWS Supply Chain Insights",
    "category": "Business Applications",
    "tier": 3,
    "icon": "Shield",
    "description": "Optimize supply chain performance with visibility insights",
    "fields": "generic"
  },
  {
    "id": "cleanroomscollab",
    "name": "Clean Rooms Collaborations",
    "category": "Business Applications",
    "tier": 3,
    "icon": "Shield",
    "description": "Establish privacy-safe collaborations on data rooms",
    "fields": "generic"
  },
  {
    "id": "workdocsapi",
    "name": "Amazon WorkDocs API integration",
    "category": "Business Applications",
    "tier": 3,
    "icon": "Shield",
    "description": "Programmatic files access and manipulation tools",
    "fields": "generic"
  },
  {
    "id": "connect",
    "name": "Amazon Connect Center",
    "category": "Customer Engagement",
    "tier": 3,
    "icon": "Activity",
    "description": "Cloud-based omnichannel virtual contact center solution",
    "fields": "generic"
  },
  {
    "id": "pinpoint",
    "name": "Amazon Pinpoint Campaigns",
    "category": "Customer Engagement",
    "tier": 3,
    "icon": "Activity",
    "description": "Analyze and send multichannel communications to users",
    "fields": "generic"
  },
  {
    "id": "ses",
    "name": "Amazon SES Email Service",
    "category": "Customer Engagement",
    "tier": 2,
    "icon": "Activity",
    "description": "High-scale, cost-effective transactional and marketing emails",
    "fields": "generic",
    "unit": "Emails Sent",
    "defaultRate": 0.0001
  },
  {
    "id": "simpledb",
    "name": "Amazon SimpleDB storage",
    "category": "Customer Engagement",
    "tier": 3,
    "icon": "Activity",
    "description": "Flexible, low-maintenance structured database service",
    "fields": "generic"
  },
  {
    "id": "connectcampaigns",
    "name": "Amazon Connect Outbound Dialer",
    "category": "Customer Engagement",
    "tier": 3,
    "icon": "Activity",
    "description": "Run high-volume outbound client outreach campaigns",
    "fields": "generic"
  },
  {
    "id": "customerprofiles",
    "name": "Amazon Connect Customer Profiles",
    "category": "Customer Engagement",
    "tier": 3,
    "icon": "Activity",
    "description": "Consolidate customer data records in real time",
    "fields": "generic"
  },
  {
    "id": "pinpointsms",
    "name": "Amazon Pinpoint SMS",
    "category": "Customer Engagement",
    "tier": 3,
    "icon": "Activity",
    "description": "Deploy SMS message communications campaigns globally",
    "fields": "generic"
  },
  {
    "id": "workspaces",
    "name": "Amazon WorkSpaces Desktops",
    "category": "End User Computing",
    "tier": 3,
    "icon": "Cloud",
    "description": "Persistent, managed virtual desktop infrastructure (VDI)",
    "fields": "generic"
  },
  {
    "id": "appstream",
    "name": "Amazon AppStream 2.0 Streaming",
    "category": "End User Computing",
    "tier": 3,
    "icon": "Cloud",
    "description": "Stream desktop applications securely to web browsers",
    "fields": "generic"
  },
  {
    "id": "workspacesweb",
    "name": "Amazon WorkSpaces Web Browser",
    "category": "End User Computing",
    "tier": 3,
    "icon": "Cloud",
    "description": "Secure, lightweight browser workspaces for employees",
    "fields": "generic"
  },
  {
    "id": "thinclient",
    "name": "Amazon WorkSpaces Thin Client",
    "category": "End User Computing",
    "tier": 3,
    "icon": "Cloud",
    "description": "Low-cost client computing devices for virtual desktops",
    "fields": "generic"
  },
  {
    "id": "workspacescore",
    "name": "Amazon WorkSpaces Core API",
    "category": "End User Computing",
    "tier": 3,
    "icon": "Cloud",
    "description": "Infrastructure API to integrate workspaces into third-party options",
    "fields": "generic"
  },
  {
    "id": "braket",
    "name": "Amazon Braket Quantum",
    "category": "Quantum Technologies",
    "tier": 3,
    "icon": "Cpu",
    "description": "Access quantum computers and simulators to test algorithms",
    "fields": "generic"
  },
  {
    "id": "iotcore",
    "name": "AWS IoT Core",
    "category": "IoT",
    "tier": 3,
    "icon": "Activity",
    "description": "Connect devices to cloud services securely at scale",
    "fields": "generic"
  },
  {
    "id": "iotdevicemanagement",
    "name": "AWS IoT Device Management",
    "category": "IoT",
    "tier": 3,
    "icon": "Activity",
    "description": "Organize, monitor, and troubleshoot device fleets",
    "fields": "generic"
  },
  {
    "id": "iotdevicedefender",
    "name": "AWS IoT Device Defender",
    "category": "IoT",
    "tier": 3,
    "icon": "Activity",
    "description": "Secure your IoT device fleet with continuous audits",
    "fields": "generic"
  },
  {
    "id": "iot1click",
    "name": "AWS IoT 1-Click",
    "category": "IoT",
    "tier": 3,
    "icon": "Activity",
    "description": "Trigger AWS Lambda functions with simple IoT button click",
    "fields": "generic"
  },
  {
    "id": "iotanalytics",
    "name": "AWS IoT Analytics",
    "category": "IoT",
    "tier": 3,
    "icon": "Activity",
    "description": "Run and operationalize analytics on massive IoT data",
    "fields": "generic"
  },
  {
    "id": "iotevents",
    "name": "AWS IoT Events",
    "category": "IoT",
    "tier": 3,
    "icon": "Activity",
    "description": "Detect and respond to events from IoT sensors and apps",
    "fields": "generic"
  },
  {
    "id": "iotsitewise",
    "name": "AWS IoT SiteWise",
    "category": "IoT",
    "tier": 3,
    "icon": "Activity",
    "description": "Collect, organize, and analyze industrial sensor data",
    "fields": "generic"
  },
  {
    "id": "iotthingsgraph",
    "name": "AWS IoT Things Graph",
    "category": "IoT",
    "tier": 3,
    "icon": "Activity",
    "description": "Connect different devices and web services visually",
    "fields": "generic"
  },
  {
    "id": "iotgreengrass",
    "name": "AWS IoT Greengrass",
    "category": "IoT",
    "tier": 3,
    "icon": "Activity",
    "description": "Run local compute, messaging, data caching on devices",
    "fields": "generic"
  },
  {
    "id": "iotroborunner",
    "name": "AWS IoT RoboRunner",
    "category": "IoT",
    "tier": 3,
    "icon": "Activity",
    "description": "Build applications to run robotics fleets together",
    "fields": "generic"
  },
  {
    "id": "iotfleetwise",
    "name": "AWS IoT FleetWise",
    "category": "IoT",
    "tier": 3,
    "icon": "Activity",
    "description": "Collect, transform, and transfer vehicle data to the cloud",
    "fields": "generic"
  },
  {
    "id": "iottwinmaker",
    "name": "AWS IoT TwinMaker",
    "category": "IoT",
    "tier": 3,
    "icon": "Activity",
    "description": "Create digital twins of real-world systems and structures",
    "fields": "generic"
  },
  {
    "id": "iotdevicesdk",
    "name": "AWS IoT Device SDK integrations",
    "category": "IoT",
    "tier": 3,
    "icon": "Activity",
    "description": "Local device SDK code blocks to connect to Core",
    "fields": "generic"
  },
  {
    "id": "iotsecuretunneling",
    "name": "AWS IoT Secure Tunneling",
    "category": "IoT",
    "tier": 3,
    "icon": "Activity",
    "description": "Establish secure connections to remote edge devices",
    "fields": "generic"
  },
  {
    "id": "iotexpresslink",
    "name": "AWS IoT ExpressLink connectivity",
    "category": "IoT",
    "tier": 3,
    "icon": "Activity",
    "description": "Hardware modules for rapid cloud secure integration",
    "fields": "generic"
  },
  {
    "id": "managedblockchain",
    "name": "Amazon Managed Blockchain",
    "category": "Blockchain",
    "tier": 3,
    "icon": "Cpu",
    "description": "Create and manage scalable Hyperledger and Ethereum networks",
    "fields": "generic"
  },
  {
    "id": "gamelift",
    "name": "Amazon GameLift hosting",
    "category": "Game Tech",
    "tier": 3,
    "icon": "Activity",
    "description": "Host and scale dedicated multiplayer game servers",
    "fields": "generic"
  },
  {
    "id": "gamesparks",
    "name": "Amazon GameSparks backend",
    "category": "Game Tech",
    "tier": 3,
    "icon": "Activity",
    "description": "Build, run, and scale multiplatform game backend features",
    "fields": "generic"
  },
  {
    "id": "sns",
    "name": "Amazon SNS Notification",
    "category": "Application Integration",
    "tier": 2,
    "icon": "Activity",
    "description": "Pub/sub messaging and mobile push notifications service",
    "fields": "generic",
    "unit": "Notifications Sent",
    "defaultRate": 2e-06
  },
  {
    "id": "sqs",
    "name": "Amazon SQS Queue",
    "category": "Application Integration",
    "tier": 2,
    "icon": "Activity",
    "description": "Managed message queuing for decoupling microservices",
    "fields": "generic",
    "unit": "Requests",
    "defaultRate": 4e-07
  },
  {
    "id": "eventbridge",
    "name": "Amazon EventBridge",
    "category": "Application Integration",
    "tier": 2,
    "icon": "Activity",
    "description": "Serverless event bus to connect application data",
    "fields": "generic",
    "unit": "Events Ingested",
    "defaultRate": 1e-06
  },
  {
    "id": "stepfunctions",
    "name": "AWS Step Functions",
    "category": "Application Integration",
    "tier": 3,
    "icon": "Activity",
    "description": "Visual workflows orchestrator for serverless apps",
    "fields": "generic"
  },
  {
    "id": "mq",
    "name": "Amazon MQ Brokers",
    "category": "Application Integration",
    "tier": 3,
    "icon": "Activity",
    "description": "Managed message broker service for ActiveMQ and RabbitMQ",
    "fields": "generic"
  },
  {
    "id": "appflow",
    "name": "Amazon AppFlow integrations",
    "category": "Application Integration",
    "tier": 3,
    "icon": "Activity",
    "description": "Securely transfer data between SaaS apps and AWS services",
    "fields": "generic"
  },
  {
    "id": "amplify",
    "name": "AWS Amplify hosting",
    "category": "Front-End Web & Mobile",
    "tier": 3,
    "icon": "Cloud",
    "description": "Build, deploy, and host modern web and mobile apps",
    "fields": "generic"
  },
  {
    "id": "appsync",
    "name": "AWS AppSync GraphQL",
    "category": "Front-End Web & Mobile",
    "tier": 3,
    "icon": "Cloud",
    "description": "Build secure GraphQL APIs to power modern web/mobile apps",
    "fields": "generic"
  },
  {
    "id": "location",
    "name": "Amazon Location Service",
    "category": "Front-End Web & Mobile",
    "tier": 3,
    "icon": "Activity",
    "description": "Add maps, points of interest, geocoding to apps securely",
    "fields": "generic"
  },
  {
    "id": "groundstation",
    "name": "AWS Ground Station",
    "category": "Satellite",
    "tier": 3,
    "icon": "Activity",
    "description": "Control satellite communications and process downlink data",
    "fields": "generic"
  },
  {
    "id": "robomaker",
    "name": "AWS RoboMaker Simulation",
    "category": "Robotics",
    "tier": 3,
    "icon": "Cpu",
    "description": "Cloud simulation environment to build and test robotics apps",
    "fields": "generic"
  }
];
export const fetchServices = async (): Promise<{ data: any[] }> => {
  if (useMock) {
    return { data: LOCAL_CATALOG_MOCK };
  }
  try {
    const response = await fetch(getUrl('/services'));
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    const items = data && Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
    return { data: items };
  } catch (error) {
    console.warn("Failed to fetch services catalog from API, using fallback:", error);
    return { data: LOCAL_CATALOG_MOCK };
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
      service: service as any,
      supported: data.supported !== false,
      message: data.message
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




