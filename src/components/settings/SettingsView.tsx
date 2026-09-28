import React, { useState } from 'react';
import { AppSettings } from '../../types';
import { testSupabaseConnection } from '../../services/supabase';
import { triggerWebhook } from '../../services/webhook';
import { requestBrowserNotificationPermission } from '../../services/notifications';
import { 
  Settings, 
  User, 
  Globe, 
  Bell, 
  Mic, 
  Database, 
  Workflow, 
  Send, 
  MessageSquare, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Save, 
  Moon, 
  Sun,
  ShieldCheck
} from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onSaveSettings: (settings: Partial<AppSettings>) => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onResetData,
}) => {
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [supabaseTestStatus, setSupabaseTestStatus] = useState<{ testing: boolean; message?: string; success?: boolean }>({ testing: false });
  const [webhookTestStatus, setWebhookTestStatus] = useState<{ testing: boolean; message?: string; success?: boolean }>({ testing: false });
  const [browserNotifStatus, setBrowserNotifStatus] = useState<string>('default');

  const handleInputChange = (field: keyof AppSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestSupabase = async () => {
    setSupabaseTestStatus({ testing: true });
    const res = await testSupabaseConnection(formData.supabaseUrl, formData.supabaseAnonKey);
    setSupabaseTestStatus({
      testing: false,
      success: res.success,
      message: res.message
    });
    if (res.success) {
      handleInputChange('supabaseConnected', true);
    }
  };

  const handleTestWebhook = async () => {
    setWebhookTestStatus({ testing: true });
    const res = await triggerWebhook(formData.n8nWebhookUrl, {
      event: 'voice.task_processed',
      timestamp: new Date().toISOString(),
      source: 'TaskPulse AI Web',
      data: {
        rawVoiceTranscript: 'Test ping from TaskPulse AI Settings'
      }
    });
    setWebhookTestStatus({
      testing: false,
      success: res.success,
      message: res.message
    });
  };

  const handleEnableBrowserNotifs = async () => {
    const granted = await requestBrowserNotificationPermission();
    setBrowserNotifStatus(granted ? 'granted' : 'denied');
    handleInputChange('browserNotificationsEnabled', granted);
  };

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            System & Workspace Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure profile, default reminders, timezones, Supabase, n8n webhooks, and AI voice parsing
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {saveSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save All Settings
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Profile & Timezone */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <User className="w-5 h-5 text-indigo-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Admin Profile & Timezone
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Admin Name
              </label>
              <input
                type="text"
                value={formData.adminName}
                onChange={e => handleInputChange('adminName', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Admin Email
              </label>
              <input
                type="email"
                value={formData.adminEmail}
                onChange={e => handleInputChange('adminEmail', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Organization / Team Name
              </label>
              <input
                type="text"
                value={formData.organizationName}
                onChange={e => handleInputChange('organizationName', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Timezone (Asia/Karachi Default)</span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">UTC+05:00</span>
              </label>
              <select
                value={formData.timezone}
                onChange={e => handleInputChange('timezone', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Asia/Karachi">Asia/Karachi (Pakistan Standard Time, UTC+05:00)</option>
                <option value="Asia/Dubai">Asia/Dubai (Gulf Standard Time, UTC+04:00)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST, UTC+05:30)</option>
                <option value="Europe/London">Europe/London (GMT/BST, UTC+00:00)</option>
                <option value="America/New_York">America/New_York (EST, UTC-05:00)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST, UTC-08:00)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: AI Voice & Language Settings */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Mic className="w-5 h-5 text-indigo-500" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Voice & Multilingual AI Engine
              </h2>
              <p className="text-xs text-slate-400">
                Configure voice recognition language, Roman Urdu parser, and optional LLM refinement
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Preferred Voice Language Mode
              </label>
              <select
                value={formData.voiceLanguage}
                onChange={e => handleInputChange('voiceLanguage', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="auto">Auto-Detect (English + Urdu/Roman Urdu)</option>
                <option value="ur-roman">Prioritize Roman Urdu & Urdu phrases</option>
                <option value="en">English (US / UK standard)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Default Reminder Setting for Tasks
              </label>
              <select
                value={formData.defaultReminder}
                onChange={e => handleInputChange('defaultReminder', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="15m">15 minutes before</option>
                <option value="30m">30 minutes before</option>
                <option value="1h">1 hour before (Recommended)</option>
                <option value="2h">2 hours before</option>
                <option value="1d">1 day before</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Notification Channels */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Bell className="w-5 h-5 text-indigo-500" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Notification Channels & Alerts
              </h2>
              <p className="text-xs text-slate-400">
                Setup browser alerts, audio sound chimes, Telegram bot, and WhatsApp integrations
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Audio Sound Chimes
                </span>
                <span className="text-[11px] text-slate-400">
                  Plays pleasant harmonic chime on reminders and task alerts
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.soundEnabled}
                onChange={e => handleInputChange('soundEnabled', e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded-lg focus:ring-indigo-500"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Browser Desktop Notifications
                </span>
                <span className="text-[11px] text-slate-400">
                  Native OS popup alerts when tasks are due
                </span>
              </div>
              <button
                type="button"
                onClick={handleEnableBrowserNotifs}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs font-semibold"
              >
                Request Permission
              </button>
            </div>
          </div>

          {/* Telegram Bot */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-blue-500" />
                Telegram Bot Alerts (Optional)
              </span>
              <input
                type="checkbox"
                checked={formData.telegramEnabled}
                onChange={e => handleInputChange('telegramEnabled', e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </div>
            {formData.telegramEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <input
                  type="text"
                  placeholder="Telegram Bot Token (e.g. 123456:ABC-DEF)"
                  value={formData.telegramBotToken}
                  onChange={e => handleInputChange('telegramBotToken', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Telegram Chat ID (e.g. -100123456789)"
                  value={formData.telegramChatId}
                  onChange={e => handleInputChange('telegramChatId', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Supabase Database Architecture */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-emerald-500" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Supabase Integration
                </h2>
                <p className="text-xs text-slate-400">
                  Connect your live Supabase PostgreSQL backend (Schema: supabase_schema.sql)
                </p>
              </div>
            </div>

            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Architecture Ready
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={formData.supabaseUrl}
                onChange={e => handleInputChange('supabaseUrl', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Supabase Anon / Public API Key
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={formData.supabaseAnonKey}
                onChange={e => handleInputChange('supabaseAnonKey', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">
              Note: When disconnected, TaskPulse operates with resilient local storage and 1:1 schema simulation.
            </span>
            <button
              type="button"
              onClick={handleTestSupabase}
              disabled={supabaseTestStatus.testing}
              className="px-4 py-2 rounded-xl border border-emerald-500 text-emerald-600 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${supabaseTestStatus.testing ? 'animate-spin' : ''}`} />
              Test Supabase Connection
            </button>
          </div>

          {supabaseTestStatus.message && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              supabaseTestStatus.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200'
            }`}>
              {supabaseTestStatus.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{supabaseTestStatus.message}</span>
            </div>
          )}
        </div>

        {/* Section 5: Automation & n8n Ready */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <Workflow className="w-5 h-5 text-indigo-500" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  n8n Automation & Webhook Integration
                </h2>
                <p className="text-xs text-slate-400">
                  Trigger automated workflows in n8n on voice task creation and deadline notifications
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Enable Webhooks</span>
              <input
                type="checkbox"
                checked={formData.n8nEnabled}
                onChange={e => handleInputChange('n8nEnabled', e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </label>
          </div>

          {formData.n8nEnabled && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  n8n Inbound Webhook URL
                </label>
                <input
                  type="text"
                  placeholder="https://n8n.yourdomain.com/webhook/taskpulse-voice-task"
                  value={formData.n8nWebhookUrl}
                  onChange={e => handleInputChange('n8nWebhookUrl', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  Pre-configured workflow file <span className="font-mono text-indigo-500">n8n_task_workflow.json</span> is included in the project root!
                </span>
                <button
                  type="button"
                  onClick={handleTestWebhook}
                  disabled={webhookTestStatus.testing || !formData.n8nWebhookUrl}
                  className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  Test Webhook Payload
                </button>
              </div>

              {webhookTestStatus.message && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  webhookTestStatus.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200'
                }`}>
                  {webhookTestStatus.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{webhookTestStatus.message}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 6: Danger Zone / Reset Demo Data */}
        <div className="p-6 rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-3">
          <h3 className="text-sm font-bold text-rose-800 dark:text-rose-300">
            Reset All Application Data
          </h3>
          <p className="text-xs text-rose-700/80 dark:text-rose-400">
            Clear all created tasks, activity history, and restore sample team members and initial tasks.
          </p>
          <button
            type="button"
            onClick={() => {
              if (confirm('Are you sure you want to reset all tasks and members to the default seed state?')) {
                onResetData();
              }
            }}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            Reset Database to Seed State
          </button>
        </div>
      </form>
    </div>
  );
};
