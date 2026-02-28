import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Shield, Sun, Moon, Camera, User, Bell, Lock, Palette, Monitor, Save, Check, Upload, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../lib/ThemeProvider';
import { supabase } from '../lib/supabase';

const AVATAR_PRESETS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=agent1&backgroundColor=0ea5e9',
  'https://api.dicebear.com/7.x/bottts/svg?seed=agent2&backgroundColor=6366f1',
  'https://api.dicebear.com/7.x/bottts/svg?seed=agent3&backgroundColor=22c55e',
  'https://api.dicebear.com/7.x/bottts/svg?seed=agent4&backgroundColor=f59e0b',
  'https://api.dicebear.com/7.x/bottts/svg?seed=agent5&backgroundColor=ef4444',
  'https://api.dicebear.com/7.x/bottts/svg?seed=agent6&backgroundColor=8b5cf6',
  'https://api.dicebear.com/7.x/bottts/svg?seed=cyber1&backgroundColor=06b6d4',
  'https://api.dicebear.com/7.x/bottts/svg?seed=shield1&backgroundColor=14b8a6',
];

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'appearance' | 'profile' | 'notifications' | 'security'>('appearance');

  // Profile state
  const [profileName, setProfileName] = useState(() => localStorage.getItem('agentshield-name') || 'Admin User');
  const [profileEmail, setProfileEmail] = useState(() => localStorage.getItem('agentshield-email') || 'admin@agentshield.ai');
  const [profileAvatar, setProfileAvatar] = useState(() => localStorage.getItem('agentshield-avatar') || '');
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);

  // Notification preferences
  const [notifCritical, setNotifCritical] = useState(true);
  const [notifWarning, setNotifWarning] = useState(true);
  const [notifInfo, setNotifInfo] = useState(false);
  const [notifSound, setNotifSound] = useState(true);
  const [notifDesktop, setNotifDesktop] = useState(false);

  const handleSave = () => {
    localStorage.setItem('agentshield-name', profileName);
    localStorage.setItem('agentshield-email', profileEmail);
    localStorage.setItem('agentshield-avatar', customAvatar || profileAvatar);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCustomAvatar(result);
        setProfileAvatar(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const currentAvatar = customAvatar || profileAvatar;

  const tabs = [
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'security' as const, label: 'Security', icon: Lock },
  ];

  const cardClass = 'bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl';
  const labelClass = 'text-sm font-semibold text-slate-700 dark:text-slate-300';
  const descClass = 'text-xs text-slate-500 dark:text-slate-500 mt-0.5';
  const inputClass = 'w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all';

  return (
    <div className="w-full px-6 py-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-wide">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Customize your AgentShield experience.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === tab.id
              ? 'bg-white dark:bg-[#111827] text-cyan-600 dark:text-cyan-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Appearance Tab ──────────────────────────── */}
      {activeTab === 'appearance' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className={`${cardClass} p-6`}>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Theme Mode</h2>
            <p className={descClass}>Choose between light and dark interface modes.</p>

            <div className="grid grid-cols-2 gap-4 mt-6">
              {/* Light Mode Card */}
              <button
                onClick={() => setTheme('light')}
                className={`relative p-5 rounded-xl border-2 transition-all ${theme === 'light'
                  ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
              >
                {theme === 'light' && (
                  <div className="absolute top-3 right-3 size-5 rounded-full bg-cyan-500 flex items-center justify-center">
                    <Check className="size-3 text-white" />
                  </div>
                )}
                <div className="size-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-3 shadow-sm">
                  <Sun className="size-6 text-amber-500" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-slate-900 dark:text-white">Light Mode</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Clean, bright interface for day use</p>
                </div>
              </button>

              {/* Dark Mode Card */}
              <button
                onClick={() => setTheme('dark')}
                className={`relative p-5 rounded-xl border-2 transition-all ${theme === 'dark'
                  ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
              >
                {theme === 'dark' && (
                  <div className="absolute top-3 right-3 size-5 rounded-full bg-cyan-500 flex items-center justify-center">
                    <Check className="size-3 text-white" />
                  </div>
                )}
                <div className="size-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center mb-3 shadow-sm">
                  <Moon className="size-6 text-cyan-400" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-slate-900 dark:text-white">Dark Mode</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Sleek cyber interface for security ops</p>
                </div>
              </button>
            </div>
          </div>

          {/* Accent Color */}
          <div className={`${cardClass} p-6`}>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Accent Color</h2>
            <p className={descClass}>Primary highlight color across the interface.</p>
            <div className="flex gap-3 mt-4">
              {['bg-cyan-500', 'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'].map((color, i) => (
                <button key={i} className={`size-8 rounded-full ${color} ${i === 0 ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#111827] ring-cyan-500' : ''} hover:scale-110 transition-all`} />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Profile Tab ─────────────────────────────── */}
      {activeTab === 'profile' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className={`${cardClass} p-6`}>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Profile Picture</h2>
            <p className={descClass}>Choose an avatar or upload your own image.</p>

            <div className="flex items-center gap-6 mt-6">
              {/* Current Avatar */}
              <div className="relative group">
                <div className="size-24 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-700 shadow-lg">
                  {currentAvatar ? (
                    <img src={currentAvatar} alt="Avatar" className="size-full object-cover" />
                  ) : (
                    <User className="size-10 text-white" />
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 size-8 rounded-full bg-cyan-500 flex items-center justify-center shadow-lg hover:bg-cyan-600 transition-colors"
                >
                  <Camera className="size-4 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              <div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  <Upload className="size-4" />
                  Upload Image
                </button>
                <p className="text-[11px] text-slate-400 mt-1.5">JPG, PNG or GIF. Max 2MB.</p>
              </div>
            </div>

            {/* Preset Avatars */}
            <div className="mt-6">
              <p className={labelClass}>Or choose a preset avatar:</p>
              <div className="grid grid-cols-8 gap-3 mt-3">
                {AVATAR_PRESETS.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => { setProfileAvatar(url); setCustomAvatar(null); }}
                    className={`size-12 rounded-xl overflow-hidden border-2 transition-all hover:scale-110 ${profileAvatar === url && !customAvatar
                      ? 'border-cyan-500 ring-2 ring-cyan-500/30'
                      : 'border-slate-200 dark:border-slate-700'
                      }`}
                  >
                    <img src={url} alt={`Avatar ${i + 1}`} className="size-full" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className={`${cardClass} p-6 space-y-4`}>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Profile Information</h2>

            <div>
              <label className={labelClass}>Display Name</label>
              <input
                type="text"
                className={`${inputClass} mt-1.5`}
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                className={`${inputClass} mt-1.5`}
                value={profileEmail}
                onChange={e => setProfileEmail(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Role</label>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="px-3 py-1 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-bold rounded-full border border-cyan-500/30">ADMIN</span>
                <span className="text-xs text-slate-400">Full access to all security modules</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Notifications Tab ────────────────────────── */}
      {activeTab === 'notifications' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className={`${cardClass} p-6 space-y-5`}>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Alert Preferences</h2>

            {[
              { label: 'Critical Alerts', desc: 'Prompt injections, PII exfiltration, active attacks', value: notifCritical, set: setNotifCritical },
              { label: 'Warning Alerts', desc: 'Elevated drift, memory integrity warnings, suspicious patterns', value: notifWarning, set: setNotifWarning },
              { label: 'Info Alerts', desc: 'Scan completions, rule updates, general system events', value: notifInfo, set: setNotifInfo },
              { label: 'Sound Notifications', desc: 'Play alert sounds for incoming notifications', value: notifSound, set: setNotifSound },
              { label: 'Desktop Notifications', desc: 'Show browser push notifications for critical alerts', value: notifDesktop, set: setNotifDesktop },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div>
                  <p className={labelClass}>{item.label}</p>
                  <p className={descClass}>{item.desc}</p>
                </div>
                <button
                  onClick={() => item.set(!item.value)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${item.value ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${item.value ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Security Tab ──────────────────────────────── */}
      {activeTab === 'security' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className={`${cardClass} p-6 space-y-4`}>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Account Security</h2>

            <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <p className={labelClass}>Two-Factor Authentication</p>
                <p className={descClass}>Add an extra layer of security to your account</p>
              </div>
              <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                Enable
              </button>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <p className={labelClass}>Session Management</p>
                <p className={descClass}>View and manage your active sessions</p>
              </div>
              <span className="text-xs font-semibold text-green-500 bg-green-500/10 px-3 py-1 rounded-full">1 Active</span>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className={labelClass}>API Access Token</p>
                <p className={descClass}>Manage your API keys for programmatic access</p>
              </div>
              <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                Generate
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded-xl p-6">
            <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-1">Danger Zone</h2>
            <p className="text-xs text-red-500/70 mb-4">These actions are irreversible.</p>
            <div className="flex gap-3">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-all"
              >
                <LogOut className="size-4" />
                Sign Out
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${saved
            ? 'bg-green-500 text-white'
            : 'bg-cyan-500 text-white hover:bg-cyan-600'
            }`}
        >
          {saved ? <Check className="size-4" /> : <Save className="size-4" />}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
