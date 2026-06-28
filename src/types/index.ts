export interface CostRequest {
  hours: number;
  instanceType: string;
}

export interface CostResponse {
  service: string;
  estimated_cost: number;
}

export interface LogRequest {
  log: string;
}

export interface LogResponse {
  service: string;
  analysis: string;
}

export interface CostEstimationResult {
  id: string;
  timestamp: string;
  instanceType: string;
  hours: number;
  estimatedMonthlyCost: number;
  estimatedAnnualCost: number;
  suggestedSavings: number;
  isMocked?: boolean;
  service?: 'ec2' | 's3' | 'lambda' | 'rds' | string;
  storageGB?: number;
  requests?: number;
  gbSeconds?: number;
}

export interface LogAnalysisResult {
  id: string;
  timestamp: string;
  logPreview: string;
  issueType: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  possibleCauses: string[];
  recommendations: string[];
  isMocked?: boolean;
}

export interface TimelineEntry {
  id: string;
  type: 'cost' | 'log';
  title: string;
  subtitle: string;
  timestamp: string;
  status: 'success' | 'error';
  amount?: number;
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
}

export interface DashboardStats {
  totalCostEstimates: number;
  totalLogAnalyses: number;
  apiSuccessRate: number; // e.g. 98.4
  lambdaHealth: number; // percentage, e.g. 100
  apiLatency: number; // ms, e.g. 45
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export type ViewType = 'landing' | 'login' | 'register' | 'forgot' | 'dashboard' | 'cost' | 'logs' | 'api' | 'settings';

export type ThemeType = 'light' | 'dark';

export interface CostHistory {
  _id: string;
  service: string;
  resource: string;
  estimated_cost: number;
  timestamp: string;
}

export interface LogHistory {
  _id: string;
  log: string;
  analysis: string;
  timestamp: string;
}
