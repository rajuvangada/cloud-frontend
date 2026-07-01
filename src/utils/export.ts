import { jsPDF } from 'jspdf';
import type { CostEstimationResult, LogAnalysisResult } from '../types';

// Helper to trigger a browser download for a CSV string
const downloadCSVFile = (csvContent: string, fileName: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// EXPORT 1: COST HISTORY
export const exportCostHistoryCSV = (estimates: CostEstimationResult[]) => {
  const headers = ['Timestamp', 'Service', 'Resource / Instance', 'Hours Ran', 'Estimated Monthly Cost ($)', 'Estimated Annual Cost ($)', 'Suggested Savings ($)', 'Mode'];
  const rows = estimates.map(e => [
    new Date(e.timestamp).toLocaleString(),
    e.service || 'Lambda/EC2',
    e.instanceType,
    e.hours,
    e.estimatedMonthlyCost.toFixed(2),
    e.estimatedAnnualCost.toFixed(2),
    e.suggestedSavings.toFixed(2),
    e.isMocked ? 'Offline Mode' : 'Live AWS Cloud'
  ]);
  
  const csvContent = [headers.join(','), ...rows.map(r => r.map(val => `"${val}"`).join(','))].join('\n');
  downloadCSVFile(csvContent, `cloudinsight_cost_history_${Date.now()}.csv`);
};

export const exportCostHistoryPDF = (estimates: CostEstimationResult[]) => {
  const doc = new jsPDF();
  
  // Header banner background
  doc.setFillColor(94, 106, 210); // Brand color #5E6AD2
  doc.rect(0, 0, 210, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('CloudInsight Lite', 14, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('AWS Serverless Cost Analytics History Report', 14, 25);
  
  // Meta information
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 45);
  doc.text(`Total Records: ${estimates.length}`, 140, 45);
  
  // Table headers
  doc.setFillColor(240, 240, 240);
  doc.rect(14, 50, 182, 8, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Timestamp', 16, 55);
  doc.text('Resource/Instance', 60, 55);
  doc.text('Monthly ($)', 125, 55);
  doc.text('Annual ($)', 160, 55);
  
  doc.setFont('helvetica', 'normal');
  let y = 64;
  estimates.forEach((item) => {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    const dateStr = new Date(item.timestamp).toLocaleString();
    doc.text(dateStr, 16, y);
    doc.text(item.instanceType, 60, y);
    doc.text(`$${item.estimatedMonthlyCost.toFixed(2)}`, 125, y);
    doc.text(`$${item.estimatedAnnualCost.toFixed(2)}`, 160, y);
    
    // Draw row divider line
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.1);
    doc.line(14, y + 2, 196, y + 2);
    y += 8;
  });
  
  doc.save(`cloudinsight_cost_history_${Date.now()}.pdf`);
};

// EXPORT 2: LOG HISTORY
export const exportLogHistoryCSV = (analyses: LogAnalysisResult[]) => {
  const headers = ['Timestamp', 'Issue Type', 'Severity', 'Log Preview', 'Possible Causes', 'Remediation Recommendations', 'Verification'];
  const rows = analyses.map(a => [
    new Date(a.timestamp).toLocaleString(),
    a.issueType,
    a.severity,
    a.logPreview.replace(/\n/g, ' '),
    a.possibleCauses.join('; '),
    a.recommendations.join('; '),
    a.isMocked ? 'Offline Mode' : 'Live AWS Cloud'
  ]);
  
  const csvContent = [headers.join(','), ...rows.map(r => r.map(val => `"${val}"`).join(','))].join('\n');
  downloadCSVFile(csvContent, `cloudinsight_log_history_${Date.now()}.csv`);
};

export const exportLogHistoryPDF = (analyses: LogAnalysisResult[]) => {
  const doc = new jsPDF();
  
  // Header banner background
  doc.setFillColor(255, 153, 0); // AWS Orange #FF9900
  doc.rect(0, 0, 210, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('CloudInsight Lite', 14, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('AI Log Diagnostic & Security Audit History Report', 14, 25);
  
  // Meta information
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 45);
  doc.text(`Total Records: ${analyses.length}`, 140, 45);
  
  // Table headers
  doc.setFillColor(240, 240, 240);
  doc.rect(14, 50, 182, 8, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Timestamp', 16, 55);
  doc.text('Detected Issue', 60, 55);
  doc.text('Severity', 135, 55);
  doc.text('Mode', 165, 55);
  
  doc.setFont('helvetica', 'normal');
  let y = 64;
  analyses.forEach((item) => {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    const dateStr = new Date(item.timestamp).toLocaleString();
    doc.text(dateStr, 16, y);
    doc.text(item.issueType, 60, y);
    doc.text(item.severity, 135, y);
    doc.text(item.isMocked ? 'Offline' : 'AWS Cloud', 165, y);
    
    // Draw row divider line
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.1);
    doc.line(14, y + 2, 196, y + 2);
    y += 8;
  });
  
  doc.save(`cloudinsight_log_history_${Date.now()}.pdf`);
};

// EXPORT 3: DASHBOARD SUMMARY
export const exportDashboardSummaryCSV = (summaryData: {
  totalCalculations: number;
  totalLogsAnalyzed: number;
  criticalIssues: number;
  apiUptime: number;
}) => {
  const headers = ['Metric', 'Value'];
  const rows = [
    ['Total Cost Calculations', summaryData.totalCalculations],
    ['Total Logs Analyzed', summaryData.totalLogsAnalyzed],
    ['Critical Issues Count', summaryData.criticalIssues],
    ['API Gateway Availability Uptime (%)', `${summaryData.apiUptime}%`]
  ];
  
  const csvContent = [headers.join(','), ...rows.map(r => r.map(val => `"${val}"`).join(','))].join('\n');
  downloadCSVFile(csvContent, `cloudinsight_dashboard_summary_${Date.now()}.csv`);
};

export const exportDashboardSummaryPDF = (summaryData: {
  totalCalculations: number;
  totalLogsAnalyzed: number;
  criticalIssues: number;
  apiUptime: number;
}) => {
  const doc = new jsPDF();
  
  // Header banner background
  doc.setFillColor(33, 33, 33);
  doc.rect(0, 0, 210, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('CloudInsight Lite', 14, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Dashboard Overview Diagnostics Summary Report', 14, 25);
  
  // Meta information
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 45);
  
  // Metrics Grid representation panel
  doc.setFillColor(245, 245, 245);
  doc.rect(14, 55, 182, 50, 'F');
  
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Portal System Health & Operations Summary', 20, 63);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Cost Calculations Run:`, 20, 72);
  doc.setFont('helvetica', 'bold');
  doc.text(`${summaryData.totalCalculations} calculations`, 90, 72);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Application Logs Audited:`, 20, 80);
  doc.setFont('helvetica', 'bold');
  doc.text(`${summaryData.totalLogsAnalyzed} log events`, 90, 80);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Critical Security/Error Issues:`, 20, 88);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 50, 50);
  doc.text(`${summaryData.criticalIssues} issues detected`, 90, 88);
  
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text(`API Gateway Status Uptime:`, 20, 96);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 160, 40);
  doc.text(`${summaryData.apiUptime.toFixed(2)}% availability`, 90, 96);
  
  doc.save(`cloudinsight_dashboard_summary_${Date.now()}.pdf`);
};
