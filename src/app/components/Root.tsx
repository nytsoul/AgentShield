import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import {
  Shield, LayoutDashboard,
  Cpu, Brain, Activity, Bug, Network,
  RefreshCcw, Layers, Bell, Search, User, ChevronLeft,
  Zap, AlertTriangle, Crosshair, Settings, Sun, Moon,
  LogOut, CheckCheck, ShieldCheck, Server, MessageSquare
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../lib/ThemeProvider';
import { useNotifications } from '../lib/NotificationProvider';
import { useAuth } from '../lib/AuthProvider';
import SearchPalette from './SearchPalette';
import { supabase } from '../lib/supabase';

const THREAT_LEVELS = [
  { label: 'SECURE', color: '#22c55e', bg: 'border-green-500/30 text-green-600 dark:text-green-400 bg-green-500/10' },
  { label: 'ELEVATED', color: '#f59e0b', bg: 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10' },
  { label: 'CRITICAL', color: '#ef4444', bg: 'border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/10' },
];

export default function Root() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { role, isAdmin } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [threatIdx] = useState(1);
  const [sessions] = useState(142);

  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const isLanding = location.pathname === '/';
  const isAuth = location.pathname.startsWith('/auth');
  const threat = THREAT_LEVELS[threatIdx];
  const sidebarW = collapsed ? 'w-[64px]' : 'w-[220px]';
  const contentML = collapsed ? 'ml-[64px]' : 'ml-[220px]';

  const profileName = localStorage.getItem('agentshield-name') || 'Admin User';
  const profileAvatar = localStorage.getItem('agentshield-avatar') || '';

  /* close dropdowns on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Ctrl+K search shortcut */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(v => !v); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = async () => {
    // Clear demo tokens
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_role');
    localStorage.removeItem('agentshield-role');
    localStorage.removeItem('agentshield-name');
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  const allNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, phase: 'CORE', adminOnly: false, userOnly: false },
    { path: '/chat', label: 'Secured Chat', icon: Shield, phase: 'CHAT', adminOnly: false, userOnly: true },
    { path: '/layer1-ingestion', label: 'Ingestion Pipeline', icon: Server, phase: 'P1', adminOnly: true, userOnly: false },
    { path: '/layer2-pre-execution', label: 'MCP Scanner', icon: Cpu, phase: 'P2', adminOnly: true, userOnly: false },
    { path: '/layer3-memory', label: 'Memory Firewall', icon: Brain, phase: 'P3', adminOnly: true, userOnly: false },
    { path: '/layer4-conversation', label: 'Conv Intelligence', icon: Activity, phase: 'P4', adminOnly: true, userOnly: false },
    { path: '/layer5-output', label: 'Output Validation', icon: Shield, phase: 'P5', adminOnly: true, userOnly: false },
    { path: '/layer5-honeypot', label: 'Honeypot Tarpit', icon: Crosshair, phase: 'P6', adminOnly: true, userOnly: false },
    { path: '/layer6-adversarial', label: 'Adversarial Response', icon: Bug, phase: 'P7', adminOnly: true, userOnly: false },
    { path: '/layer7-inter-agent', label: 'Zero Trust Network', icon: Network, phase: 'P8', adminOnly: true, userOnly: false },
    { path: '/layer8-adaptive', label: 'Adaptive Config', icon: RefreshCcw, phase: 'P9', adminOnly: true, userOnly: false },
    { path: '/layer9-observability', label: 'Observability', icon: Layers, phase: 'OBS', adminOnly: true, userOnly: false },
    { path: '/admin', label: 'Admin Console', icon: ShieldCheck, phase: 'ADM', adminOnly: true, userOnly: false },
  ];

  // Filter nav items based on user role
  const navItems = isAdmin
    ? allNavItems.filter(item => !item.userOnly)
    : allNavItems.filter(item => !item.adminOnly);

  if (isLanding || isAuth) return <Outlet />;

  const notifTypeColor: Record<string, string> = {
    critical: 'bg-red-500', warning: 'bg-amber-500', info: 'bg-cyan-500', success: 'bg-green-500',
  };

  /* shared theme tokens */
  const sidebarBg = 'bg-white dark:bg-[#0d1424]';
  const borderClr = 'border-slate-200 dark:border-cyan-500/10';
  const mainBg = 'bg-slate-50 dark:bg-[#0a0f1a]';
  const headerBg = 'bg-white/95 dark:bg-[#0d1424]/95';
  const footerBg = 'bg-white dark:bg-[#0d1424]';

  return (
    <div className={`min-h-screen ${mainBg} text-slate-900 dark:text-slate-100 flex`}>
      {/* ── Sidebar ──────────────── */}
      <aside className={`fixed top-0 left-0 h-screen ${sidebarW} z-50 flex flex-col ${sidebarBg} border-r ${borderClr} transition-all duration-300 overflow-hidden`}>
        {/* Brand */}
        <div className={`flex items-center gap-2.5 px-4 py-4 border-b ${borderClr}`}>
          <div className="size-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <Shield className="size-4 text-cyan-500" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-black text-slate-900 dark:text-white tracking-widest uppercase leading-none">AgentShield</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1 scrollbar-none">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${active
                  ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-l-2 border-cyan-500 dark:border-cyan-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'}`}>
                  <item.icon className={`size-[18px] shrink-0 ${active ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                  {!collapsed && <span className={`text-[10px] font-mono ${active ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-600'}`}>{item.phase}</span>}
                </div>
              </Link>
            );
          })}

          {/* Settings link */}
          <Link to="/settings">
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-all mt-3 border-t ${borderClr} pt-4 ${location.pathname === '/settings'
              ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'}`}>
              <Settings className="size-[18px] shrink-0" />
              {!collapsed && <span className="truncate flex-1">Settings</span>}
            </div>
          </Link>
        </div>

        {/* Collapse */}
        <div className={`p-3 border-t ${borderClr}`}>
          <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-center gap-2 py-2.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-all text-xs font-semibold">
            <ChevronLeft className={`size-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && 'Collapse Sidebar'}
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────── */}
      <div className={`${contentML} flex-1 flex flex-col min-h-screen transition-all duration-300`}>
        {/* Top Bar */}
        <header className={`sticky top-0 z-40 h-14 ${headerBg} border-b ${borderClr} backdrop-blur-xl flex items-center justify-between px-6 shrink-0`}>
          <div className="flex items-center gap-3">
            <Shield className="size-5 text-cyan-500" />
            <span className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">AgentShield</span>
          </div>

          {/* Center threat */}
          <div className={`flex items-center gap-2 px-5 py-1.5 rounded-full border text-[11px] font-bold tracking-wider ${threat.bg}`}>
            {threatIdx === 2 ? <AlertTriangle className="size-3.5" /> : <Zap className="size-3.5" />}
            GLOBAL THREAT LEVEL: {threat.label}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
              <span className="size-1.5 rounded-full bg-cyan-400 inline-block" />
              SESSIONS: <span className="text-slate-900 dark:text-white font-bold">{sessions}</span>
            </div>

            <div className="flex items-center gap-2 ml-2">
              {/* Theme Toggle */}
              <button onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                className="size-8 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>

              {/* Search */}
              <button onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-slate-700 transition-all">
                <Search className="size-3.5" />
                <span className="hidden md:inline">Search</span>
                <kbd className="hidden md:inline-flex px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono border border-slate-200 dark:border-slate-600">Ctrl+K</kbd>
              </button>

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                  className="size-8 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all relative">
                  <Bell className="size-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">{unreadCount}</span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
                      <button onClick={markAllAsRead} className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline font-semibold flex items-center gap-1"><CheckCheck className="size-3" /> Mark all read</button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-sm"><Bell className="size-8 mx-auto mb-2 opacity-30" />No notifications</div>
                      ) : notifications.slice(0, 10).map(n => (
                        <button key={n.id} onClick={() => markAsRead(n.id)}
                          className={`w-full text-left px-4 py-3 border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-white/5 transition-all ${!n.read ? 'bg-cyan-500/5' : ''}`}>
                          <div className="flex items-start gap-3">
                            <div className={`size-2 rounded-full mt-1.5 shrink-0 ${notifTypeColor[n.type] || 'bg-slate-400'}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className={`text-sm font-semibold truncate ${!n.read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{n.title}</p>
                                {!n.read && <span className="size-2 rounded-full bg-cyan-500 shrink-0" />}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-slate-400">{n.time}</span>
                                {n.layer && <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-mono">L{n.layer}</span>}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-700">
                      <Link to="/settings" onClick={() => setNotifOpen(false)} className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-semibold">Notification Settings</Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                  className="size-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center overflow-hidden ring-2 ring-transparent hover:ring-cyan-500/30 transition-all">
                  {profileAvatar ? <img src={profileAvatar} alt="Profile" className="size-full object-cover" /> : <User className="size-4 text-white" />}
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center overflow-hidden">
                          {profileAvatar ? <img src={profileAvatar} alt="Profile" className="size-full object-cover" /> : <User className="size-5 text-white" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{profileName}</p>
                          <p className="text-[11px] text-slate-500">{isAdmin ? 'Administrator' : 'Standard User'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="py-1.5">
                      <Link to="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"><User className="size-4 text-slate-400" />Profile</Link>
                      <Link to="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"><Settings className="size-4 text-slate-400" />Settings</Link>
                      <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                        {theme === 'dark' ? <Sun className="size-4 text-slate-400" /> : <Moon className="size-4 text-slate-400" />}
                        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                      </button>
                    </div>
                    <div className="border-t border-slate-100 dark:border-slate-700 py-1.5">
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"><LogOut className="size-4" />Sign Out</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className={`border-t ${borderClr} ${footerBg} px-6 py-6 flex items-center justify-between text-[10px] font-semibold tracking-wider text-slate-400 dark:text-slate-600`}>
          <div className="flex items-center gap-3">
            <span>SYSTEM STATUS: <span className="text-green-500">OPERATIONAL</span></span>
          </div>
          <div className="text-center">
            <span>AGENTSHIELD SECURITY PROTOCOL V2.4.1 // DISTRIBUTED LEDGER VERIFIED</span>
          </div>
          <div className="flex items-center gap-4">
            <span>ENCRYPTION: AES-256-GCM</span>
            <span>UPTIME: 99.998%</span>
          </div>
        </footer>
      </div>

      {/* Global Search Palette */}
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
