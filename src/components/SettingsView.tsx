import React, { useState } from 'react';
import { apiConfig } from '../utils/api';
import { Save, Trash2, Info, Server } from 'lucide-react';

interface SettingsViewProps {
  onAddToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  onClearHistory: () => void;
  totalEstimates: number;
  totalAnalyses: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onAddToast,
  onClearHistory,
  totalEstimates,
  totalAnalyses,
}) => {
  const [mockMode, setMockMode] = useState<boolean>(apiConfig.getUseMock());
  const [customUrl, setCustomUrl] = useState<string>(apiConfig.getCustomEndpoint());
  const [saving, setSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Write configs
    apiConfig.setUseMock(mockMode);
    apiConfig.setCustomEndpoint(customUrl.trim());
    
    setTimeout(() => {
      setSaving(false);
      onAddToast('Settings saved successfully.', 'success');
    }, 400);
  };

  const handleResetSettings = () => {
    setMockMode(false);
    setCustomUrl('');
    apiConfig.setUseMock(false);
    apiConfig.setCustomEndpoint('');
    onAddToast('Settings restored to defaults.', 'info');
  };

  const handleTriggerClear = () => {
    if (window.confirm('Are you sure you want to clear session estimates and analyzer reports? This cannot be undone.')) {
      onClearHistory();
      onAddToast('Session diagnostic histories cleared successfully.', 'success');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">Settings</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Adjust portal configurations, manage AWS gateway URLs, toggle connection bypasses, and prune database histories.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* API Settings Section (Left 2/3 width) */}
        <div className="lg:col-span-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-xs h-fit space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-zinc-400" /> Gateway Connection Configurations
            </h3>
            <button
              onClick={handleResetSettings}
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 font-semibold cursor-pointer"
            >
              Reset to Defaults
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Mock API Mode Toggle */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-zinc-150 dark:border-zinc-800/80 bg-zinc-50/30 dark:bg-zinc-950/20">
              <div className="space-y-1">
                <label htmlFor="mock-toggle" className="text-sm font-semibold text-zinc-900 dark:text-white block cursor-pointer">
                  Mock API Mode (Bypass Gateway)
                </label>
                <span className="text-xs text-zinc-400 dark:text-zinc-500 block leading-relaxed">
                  When enabled, requests run locally on the client-side, bypassing live AWS Gateway calls. Use this when working offline or encountering throttling.
                </span>
              </div>
              <div className="relative inline-flex items-center cursor-pointer mt-1">
                <input
                  id="mock-toggle"
                  type="checkbox"
                  checked={mockMode}
                  onChange={(e) => setMockMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-200 dark:bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-linear dark:peer-checked:bg-aws" />
              </div>
            </div>

            {/* Custom URL Endpoint */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label htmlFor="custom-url" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  Custom Base URL Override
                </label>
                {!customUrl ? (
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 px-2 py-0.5 rounded-full">
                    Production Active
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 px-2 py-0.5 rounded-full">
                    Custom Endpoint Override
                  </span>
                )}
              </div>
              <input
                id="custom-url"
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://q2rl2hl6y3.execute-api.us-east-1.amazonaws.com"
                className="w-full text-sm font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 outline-hidden focus:ring-1 focus:ring-linear dark:focus:ring-aws text-zinc-900 dark:text-white transition-all"
              />
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal">
                Leave empty to run default AWS N.Virginia cloud: `https://q2rl2hl6y3.execute-api.us-east-1.amazonaws.com`
              </span>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2.5 text-sm font-medium text-white bg-linear hover:bg-linear-hover dark:bg-aws dark:hover:bg-aws-hover rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {saving ? (
                'Saving...'
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Connection Settings
                </>
              )}
            </button>
          </form>
        </div>

        {/* Clear Data section (Right 1/3 width) */}
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-zinc-400" /> Prune Diagnostic Data
            </h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed">
              Flush cost calculations metrics and log analyses cached in the current session.
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500 dark:text-zinc-400">Total Estimates:</span>
                <span className="font-semibold text-zinc-900 dark:text-white">{totalEstimates}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500 dark:text-zinc-400">Total Log Reports:</span>
                <span className="font-semibold text-zinc-900 dark:text-white">{totalAnalyses}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleTriggerClear}
              disabled={totalEstimates === 0 && totalAnalyses === 0}
              className="w-full py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/15 border border-rose-100 dark:border-rose-900/30 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear session data
            </button>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-lg text-[10px] text-zinc-400 dark:text-zinc-500 flex gap-2 items-start leading-normal">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Note: Session databases are stored inside app memory context and will also clear naturally on page reloads.
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
