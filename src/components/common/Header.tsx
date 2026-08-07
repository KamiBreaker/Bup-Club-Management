import React from 'react';
import { UserProfile, UserRole } from '../../types/cms';
import {
  Calendar,
  Building2,
  Users,
  Bell,
  ShieldCheck,
  LayoutDashboard,
  LogOut
} from 'lucide-react';

interface HeaderProps {
  activeCmsTab: 'clubs' | 'events' | 'venues' | 'notifications' | 'analytics';
  setActiveCmsTab: (tab: 'clubs' | 'events' | 'venues' | 'notifications' | 'analytics') => void;
  selectedRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  userProfiles: UserProfile[];
  currentUser: UserProfile;
  unreadNotificationsCount: number;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeCmsTab,
  setActiveCmsTab,
  selectedRole,
  onRoleChange,
  userProfiles,
  currentUser,
  unreadNotificationsCount,
  onLogout
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-sm">
      {/* Top Banner with BUP Branding */}
      <div className="bg-[#004d38] px-4 py-1 text-xs text-emerald-100 flex flex-wrap justify-between items-center border-b border-emerald-800">
        <div className="flex items-center gap-2 font-medium tracking-wide">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Bangladesh University of Professionals (BUP)</span>
          <span className="text-emerald-300">|</span>
          <span className="text-emerald-200">Dept. of Information & Communication Engineering (ICE)</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span>BUP Club & Society Management</span>
          <span className="text-emerald-300">|</span>
          <span className="bg-emerald-950 text-emerald-200 px-2 py-0.5 rounded border border-emerald-800">
            System Active
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Main System Branding */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-transparent p-0">
              <img
                src="/buplogo.webp"
                alt="BUP logo"
                className="h-full w-full object-contain object-center"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-white font-sans">
                  BUP-CMS
                </h1>
                <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                  Official Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Club & Society Management System
              </p>
            </div>
          </div>

          {/* User Role Switcher */}
          <div className="flex items-center gap-3">
            {/* Role Switcher Dropdown */}
            <div className="relative flex items-center bg-slate-800 px-2 py-1.5 rounded-xl border border-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
              <select
                value={selectedRole}
                onChange={(e) => onRoleChange(e.target.value as UserRole)}
                className="bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer pr-1"
              >
                <option value="Student" className="bg-slate-900 text-white">
                  Role: Student
                </option>
                <option value="Club_Exec" className="bg-slate-900 text-white">
                  Role: Club Executive
                </option>
                <option value="Faculty_Advisor" className="bg-slate-900 text-white">
                  Role: Faculty Advisor
                </option>
                <option value="Venue_Admin" className="bg-slate-900 text-white">
                  Role: Venue Admin
                </option>
                <option value="System_Admin" className="bg-slate-900 text-white">
                  Role: System Admin
                </option>
              </select>
            </div>

            {/* User Profile Avatar */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-8 h-8 rounded-xl object-cover border border-slate-700"
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
                onClick={onLogout}
                className="ml-2 inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 transition hover:border-emerald-600 hover:text-emerald-300"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* CMS Tab Bar */}
        <div className="flex items-center justify-between border-t border-slate-800 py-2 overflow-x-auto">
            <nav className="flex space-x-2 text-xs font-bold">
              <button
                onClick={() => setActiveCmsTab('clubs')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeCmsTab === 'clubs'
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Club Directory
              </button>
              <button
                onClick={() => setActiveCmsTab('events')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeCmsTab === 'events'
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Events & RSVPs
              </button>
              <button
                onClick={() => setActiveCmsTab('venues')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeCmsTab === 'venues'
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Venue Booking
              </button>
              <button
                onClick={() => setActiveCmsTab('notifications')}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeCmsTab === 'notifications'
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                Notifications
                {unreadNotificationsCount > 0 && (
                  <span className="ml-1 bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
              {(selectedRole === 'Venue_Admin' || selectedRole === 'System_Admin' || selectedRole === 'Faculty_Advisor' || selectedRole === 'Club_Exec') && (
                <button
                  onClick={() => setActiveCmsTab('analytics')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    activeCmsTab === 'analytics'
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Admin & Analytics
                </button>
              )}
            </nav>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300">
              <span className="text-slate-400">Logged as:</span>
              <span className="font-bold text-emerald-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {selectedRole.replace('_', ' ')}
              </span>
            </div>
          </div>
      </div>
    </header>
  );
};
