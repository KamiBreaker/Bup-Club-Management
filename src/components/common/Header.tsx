import React from 'react';
import { motion } from 'motion/react';
import { UserProfile, UserRole } from '../../types/cms';
import {
  Calendar,
  Building2,
  Users,
  Bell,
  ShieldCheck,
  LayoutDashboard,
  LogOut,
  Search,
  Sliders,
  Sparkles,
  Volume2,
  VolumeX
} from 'lucide-react';
import { soundFx } from '../../utils/audioFx';

interface HeaderProps {
  activeCmsTab: 'clubs' | 'events' | 'venues' | 'notifications' | 'analytics';
  setActiveCmsTab: (tab: 'clubs' | 'events' | 'venues' | 'notifications' | 'analytics') => void;
  selectedRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  userProfiles: UserProfile[];
  currentUser: UserProfile;
  unreadNotificationsCount: number;
  onLogout: () => void;
  onOpenCommandPalette: () => void;
  onOpenMotionSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeCmsTab,
  setActiveCmsTab,
  selectedRole,
  onRoleChange,
  userProfiles,
  currentUser,
  unreadNotificationsCount,
  onLogout,
  onOpenCommandPalette,
  onOpenMotionSettings
}) => {
  const tabs = [
    { id: 'clubs' as const, label: 'Clubs & Societies', icon: Users },
    { id: 'events' as const, label: 'Events & RSVPs', icon: Calendar },
    { id: 'venues' as const, label: 'Venue Booking', icon: Building2 },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell, count: unreadNotificationsCount },
    ...(selectedRole === 'Venue_Admin' ||
    selectedRole === 'System_Admin' ||
    selectedRole === 'Faculty_Advisor' ||
    selectedRole === 'Club_Exec'
      ? [{ id: 'analytics' as const, label: 'Admin Analytics', icon: LayoutDashboard }]
      : [])
  ];

  return (
    <header className="sticky top-0 z-40 w-full transition-all">
      {/* Top Academic Status Ticker */}
      <div className="bg-gradient-to-r from-[#003828] via-[#05261d] to-[#001f16] px-4 py-1 text-[11px] text-emerald-200 border-b border-emerald-500/20 backdrop-blur-md flex flex-wrap justify-between items-center">
        <div className="flex items-center gap-2 font-medium tracking-wide">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-white">Bangladesh University of Professionals (BUP)</span>
          <span className="text-emerald-500/50">|</span>
          <span className="text-emerald-300/90 hidden md:inline">Dept. of Information & Communication Engineering (ICE)</span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[10px]">
          <span className="hidden sm:inline text-emerald-300/80">Campus Grid System v2.5</span>
          <span className="bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
            Live Sync Active
          </span>
        </div>
      </div>

      {/* Main Glassmorphic Navigation Bar */}
      <div className="glass-dock border-b border-white/10 px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveCmsTab('clubs')}>
            <motion.div
              whileHover={{ scale: 1.08, rotate: 3 }}
              whileTap={{ scale: 0.95 }}
              className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl p-1 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/40 shadow-lg shadow-emerald-950/40"
            >
              <img
                src="/buplogo.webp"
                alt="BUP logo"
                className="h-full w-full object-contain filter drop-shadow"
              />
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight text-white font-heading">
                  BUP<span className="text-emerald-400">-CMS</span>
                </h1>
                <span className="text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  NEXT-GEN
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                Club & Society Intelligence Portal
              </p>
            </div>
          </div>

          {/* Quick Search Trigger & Motion HUD */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundFx.playClick();
                onOpenCommandPalette();
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10 text-xs transition-all hover:border-emerald-500/40 shadow-sm group"
            >
              <Search className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="hidden md:inline text-[11px] text-slate-400">Search & Commands</span>
              <kbd className="text-[10px] font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-white/10 text-slate-400 group-hover:text-emerald-300">
                ⌘K
              </kbd>
            </button>

            {/* Motion Settings Tool */}
            <button
              onClick={() => {
                soundFx.playClick();
                onOpenMotionSettings();
              }}
              title="Motion & Physics Studio"
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10 hover:border-emerald-500/40 transition-all hover:text-emerald-300"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>

            {/* Role Switcher Pill */}
            <div className="relative flex items-center bg-slate-900/90 px-2.5 py-1.5 rounded-xl border border-white/10 shadow-inner">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mr-1.5 shrink-0" />
              <select
                value={selectedRole}
                onChange={(e) => {
                  soundFx.playClick();
                  onRoleChange(e.target.value as UserRole);
                }}
                className="bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer pr-1"
              >
                <option value="Student" className="bg-slate-950 text-white">Student</option>
                <option value="Club_Exec" className="bg-slate-950 text-white">Club Exec</option>
                <option value="Faculty_Advisor" className="bg-slate-950 text-white">Faculty Advisor</option>
                <option value="Venue_Admin" className="bg-slate-950 text-white">Venue Admin</option>
                <option value="System_Admin" className="bg-slate-950 text-white">System Admin</option>
              </select>
            </div>

            {/* User Profile & Logout */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-white/10">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-8 h-8 rounded-xl object-cover ring-2 ring-emerald-500/30 bg-slate-800"
              />
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-white leading-tight">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-emerald-400 font-mono">
                  {currentUser.studentId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  onLogout();
                }}
                title="Sign out"
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 transition-all"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation Pill Bar with Framer Spring Physics */}
        <div className="max-w-7xl mx-auto mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between overflow-x-auto pb-0.5">
          <nav className="flex space-x-1 text-xs font-bold relative">
            {tabs.map((tab) => {
              const isActive = activeCmsTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    soundFx.playClick(isActive ? 700 : 900);
                    setActiveCmsTab(tab.id);
                  }}
                  className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-colors duration-200 z-10 ${
                    isActive ? 'text-emerald-300 font-extrabold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="header-active-pill"
                      className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-emerald-500/20 rounded-xl border border-emerald-500/40 shadow-md shadow-emerald-950/30 -z-10"
                      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                    />
                  )}
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <motion.span
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="ml-1 bg-emerald-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-sm"
                    >
                      {tab.count}
                    </motion.span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>Role:</span>
            <span className="font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30 text-[11px]">
              {selectedRole.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
