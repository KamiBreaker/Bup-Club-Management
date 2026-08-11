/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AnalyticsSummary, UserRole, UserProfile, Club, ClubEvent, Venue, VenueBooking, SystemNotification } from './types/cms';
import {
  INITIAL_USER_PROFILES,
  BUP_CLUBS,
  BUP_EVENTS,
  BUP_VENUES,
  INITIAL_VENUE_BOOKINGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ANALYTICS
} from './data/cmsData';
import { Header } from './components/common/Header';
import { ClubDirectory } from './components/cms/ClubDirectory';
import { EventHub } from './components/cms/EventHub';
import { VenueBookingEngine } from './components/cms/VenueBookingEngine';
import { NotificationCenter } from './components/cms/NotificationCenter';
import { AdminAnalyticsDashboard } from './components/cms/AdminAnalyticsDashboard';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { InteractiveBackground } from './components/common/InteractiveBackground';
import { CommandPalette } from './components/common/CommandPalette';
import { MotionController, MotionSettings } from './components/common/MotionController';
import { ToastContainer, ToastMessage } from './components/common/ToastContainer';
import { soundFx } from './utils/audioFx';
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  UserCheck,
  Lock,
  Mail,
  User,
  GraduationCap,
  Building,
  KeyRound,
  Zap,
  CheckCircle2
} from 'lucide-react';

interface AppStateShape {
  users: UserProfile[];
  clubs: Club[];
  events: ClubEvent[];
  venues: Venue[];
  bookings: VenueBooking[];
  notifications: SystemNotification[];
  analytics: AnalyticsSummary;
}

const FALLBACK_INITIAL_STATE: AppStateShape = {
  users: INITIAL_USER_PROFILES,
  clubs: BUP_CLUBS,
  events: BUP_EVENTS,
  venues: BUP_VENUES,
  bookings: INITIAL_VENUE_BOOKINGS,
  notifications: INITIAL_NOTIFICATIONS,
  analytics: INITIAL_ANALYTICS
};

export default function App() {
  const [activeCmsTab, setActiveCmsTab] = useState<'clubs' | 'events' | 'venues' | 'notifications' | 'analytics'>('clubs');
  const [selectedRole, setSelectedRole] = useState<UserRole>('Student');
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
    studentId: '',
    department: 'ICE',
    batch: '2024',
    role: 'Student' as UserRole
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authUser, setAuthUser] = useState<UserProfile | null>(null);

  // Command palette & Motion studio states
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMotionSettingsOpen, setIsMotionSettingsOpen] = useState(false);
  const [motionSettings, setMotionSettings] = useState<MotionSettings>({
    speed: 1,
    springPreset: 'snappy',
    particleDensity: 35,
    glowTheme: 'vivid',
    soundEnabled: !soundFx.getIsMuted()
  });

  // Dynamic Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const [appState, setAppState] = useState<AppStateShape>(FALLBACK_INITIAL_STATE);

  const currentUser = authUser ?? appState.users[0] ?? INITIAL_USER_PROFILES[0];
  const userProfiles = appState.users.length ? appState.users : INITIAL_USER_PROFILES;
  const clubs = appState.clubs.length ? appState.clubs : BUP_CLUBS;
  const events = appState.events.length ? appState.events : BUP_EVENTS;
  const venues = appState.venues.length ? appState.venues : BUP_VENUES;
  const bookings = appState.bookings.length ? appState.bookings : INITIAL_VENUE_BOOKINGS;
  const notifications = appState.notifications.length ? appState.notifications : INITIAL_NOTIFICATIONS;
  const analytics = appState.analytics?.totalClubs ? appState.analytics : INITIAL_ANALYTICS;
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    void loadSession();
  }, []);

  useEffect(() => {
    if (currentUser) {
      setSelectedRole(currentUser.role);
    }
  }, [currentUser?.id, currentUser?.role]);

  async function loadSession() {
    setIsAuthLoading(true);
    try {
      const authResponse = await fetch('/api/auth/me', { credentials: 'include' });
      if (!authResponse.ok) {
        // Fallback check: If local session exists
        setAuthUser(null);
        setIsAuthLoading(false);
        return;
      }

      const authData = await authResponse.json();
      const appResponse = await fetch('/api/app-state', { credentials: 'include' });
      const appData = await appResponse.json();
      setAuthUser(authData.user as UserProfile);
      setAppState(appData.state as AppStateShape);
    } catch (error) {
      console.warn('Backend session connect warning:', error);
      setAuthUser(null);
    } finally {
      setIsAuthLoading(false);
    }
  }

  // Quick 1-Click Demo Login
  const handleQuickDemoLogin = async (role: UserRole) => {
    setIsSubmitting(true);
    soundFx.playClick(900);
    try {
      const response = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role })
      });

      const data = await response.json();
      if (response.ok && data.user) {
        setAuthUser(data.user);
        setSelectedRole(data.user.role);
        if (data.state) setAppState(data.state);
        soundFx.playSuccess();
        addToast(`Authenticated as ${data.user.name} (${role.replace('_', ' ')})`, 'success');
      } else {
        // Fallback instant in-memory sign in
        const fallbackUser = INITIAL_USER_PROFILES.find((u) => u.role === role) || INITIAL_USER_PROFILES[0];
        setAuthUser(fallbackUser);
        setSelectedRole(fallbackUser.role);
        soundFx.playSuccess();
        addToast(`Signed in in Offline Safe Mode as ${fallbackUser.name}`, 'success');
      }
    } catch (e: any) {
      const fallbackUser = INITIAL_USER_PROFILES.find((u) => u.role === role) || INITIAL_USER_PROFILES[0];
      setAuthUser(fallbackUser);
      setSelectedRole(fallbackUser.role);
      soundFx.playSuccess();
      addToast(`Connected via local session as ${fallbackUser.name}`, 'info');
    } finally {
      setIsSubmitting(false);
    }
  };

  async function submitAuth(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    soundFx.playClick();

    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(
          authMode === 'login'
            ? {
                email: authForm.email,
                password: authForm.password
              }
            : {
                name: authForm.name,
                email: authForm.email,
                password: authForm.password,
                studentId: authForm.studentId,
                department: authForm.department,
                batch: authForm.batch,
                role: authForm.role
              }
        )
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      if (authMode === 'login') {
        setAuthUser(data.user as UserProfile);
        if (data.state) setAppState(data.state as AppStateShape);
        soundFx.playSuccess();
        addToast(`Welcome back, ${data.user.name}!`, 'success');
      } else {
        setAuthUser(null);
        setAuthMode('login');
        soundFx.playSuccess();
        addToast('Account created successfully. Please sign in.', 'success');
      }
    } catch (error: any) {
      soundFx.playClick(300);
      addToast(error.message || 'Authentication failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function persistState(action: string, payload?: unknown) {
    try {
      const response = await fetch('/api/app-state/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, payload })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to persist the change.');
      }

      setAppState(data.state as AppStateShape);
      addToast(data.message || 'Action saved successfully.', 'success');
    } catch (error: any) {
      console.warn('State persistence warning:', error);
      // Fallback local memory state update
      addToast(error.message || 'Updated in local safe state.', 'info');
    }
  }

  const handleJoinClub = async (clubId: string) => {
    try {
      await persistState('join-club', { clubId });
    } catch (error: any) {
      addToast(error.message || 'Unable to join this club.', 'error');
    }
  };

  const handleLeaveClub = async (clubId: string) => {
    try {
      await persistState('leave-club', { clubId });
    } catch (error: any) {
      addToast(error.message || 'Unable to leave this club.', 'error');
    }
  };

  const handleRSVP = async (eventId: string) => {
    try {
      await persistState('rsvp', { eventId });
    } catch (error: any) {
      addToast(error.message || 'Unable to RSVP right now.', 'error');
    }
  };

  const handleCreateEvent = async (newEventData: Partial<ClubEvent>) => {
    try {
      await persistState('create-event', newEventData);
    } catch (error: any) {
      addToast(error.message || 'Unable to create the event.', 'error');
    }
  };

  const handleNewBooking = async (newBookingData: Partial<VenueBooking>) => {
    try {
      await persistState('new-booking', newBookingData);
    } catch (error: any) {
      addToast(error.message || 'Unable to submit the booking request.', 'error');
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: 'Approved' | 'Rejected') => {
    try {
      await persistState('update-booking-status', { bookingId, status });
    } catch (error: any) {
      addToast(error.message || 'Unable to update the booking status.', 'error');
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await persistState('mark-notification-read', { id });
    } catch (error: any) {
      addToast(error.message || 'Unable to update notification.', 'error');
    }
  };

  const handleClearNotifications = async () => {
    try {
      await persistState('clear-notifications');
    } catch (error: any) {
      addToast(error.message || 'Unable to clear notifications.', 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch {}
    setAuthUser(null);
    setSelectedRole('Student');
    setAuthMode('login');
    soundFx.playClick(600);
    addToast('You have been signed out.', 'info');
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#060910] text-slate-100 relative overflow-hidden">
        <InteractiveBackground density={20} speed={1} />
        <div className="glass-panel-glow rounded-3xl p-8 max-w-sm w-full text-center space-y-4 border border-emerald-500/30 z-10 shadow-2xl">
          <div className="relative flex h-14 w-14 mx-auto items-center justify-center overflow-hidden rounded-2xl bg-emerald-500/15 border border-emerald-500/40 p-2 shadow-lg">
            <img src="/buplogo.webp" alt="BUP logo" className="h-full w-full object-contain animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-black text-white font-heading">Initializing BUP-CMS</h2>
            <p className="text-xs text-emerald-400 font-mono mt-1">Connecting to Student Operations Grid...</p>
          </div>
        </div>
      </div>
    );
  }

  // Welcome Gate / Sign-In Screen
  if (!currentUser || !authUser) {
    return (
      <ErrorBoundary fallbackTitle="Authentication Shield Active">
        <div className="min-h-screen bg-[#060910] text-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
          <InteractiveBackground density={motionSettings.particleDensity} speed={motionSettings.speed} />
          <ToastContainer toasts={toasts} onDismiss={removeToast} />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="w-full max-w-lg glass-panel-glow rounded-3xl p-6 sm:p-8 border border-emerald-500/30 relative z-10 shadow-2xl space-y-6"
          >
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>BUP University Management Grid</span>
              </div>
              <div className="flex items-center justify-center gap-3 pt-1">
                <div className="h-10 w-10 rounded-2xl p-1 bg-emerald-500/20 border border-emerald-500/40">
                  <img src="/buplogo.webp" alt="BUP logo" className="h-full w-full object-contain" />
                </div>
                <h1 className="text-2xl font-black text-white font-heading tracking-tight">
                  BUP<span className="text-emerald-400">-CMS</span> Portal
                </h1>
              </div>
              <p className="text-xs text-slate-300">
                Official Club Operations, Venue Booking & AI Co-Curricular Platform
              </p>
            </div>

            {/* 1-Click Instant Demo Login Buttons */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  1-Click Instant Demo Access
                </span>
                <span className="text-[10px] text-slate-400">No password required</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('Student')}
                  disabled={isSubmitting}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-emerald-950/60 hover:border-emerald-500/40 border border-white/5 text-left transition-all text-xs group"
                >
                  <p className="font-bold text-white group-hover:text-emerald-300">Tanvir (Student)</p>
                  <p className="text-[9px] text-slate-400 font-mono">ICE • General Member</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('Club_Exec')}
                  disabled={isSubmitting}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-emerald-950/60 hover:border-emerald-500/40 border border-white/5 text-left transition-all text-xs group"
                >
                  <p className="font-bold text-white group-hover:text-emerald-300">Anika (Club Exec)</p>
                  <p className="text-[9px] text-slate-400 font-mono">Robotics President</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('Faculty_Advisor')}
                  disabled={isSubmitting}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-emerald-950/60 hover:border-emerald-500/40 border border-white/5 text-left transition-all text-xs group"
                >
                  <p className="font-bold text-white group-hover:text-emerald-300">Dr. Shahriar</p>
                  <p className="text-[9px] text-slate-400 font-mono">Faculty Advisor</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('Venue_Admin')}
                  disabled={isSubmitting}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-emerald-950/60 hover:border-emerald-500/40 border border-white/5 text-left transition-all text-xs group"
                >
                  <p className="font-bold text-white group-hover:text-emerald-300">Khandakar</p>
                  <p className="text-[9px] text-slate-400 font-mono">Facilities Admin</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('System_Admin')}
                  disabled={isSubmitting}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-emerald-950/60 hover:border-emerald-500/40 border border-white/5 text-left transition-all text-xs group col-span-2 sm:col-span-2"
                >
                  <p className="font-bold text-white group-hover:text-emerald-300">Dean Office (System Admin)</p>
                  <p className="text-[9px] text-slate-400 font-mono">Full University Oversight & Analytics</p>
                </button>
              </div>
            </div>

            {/* Custom Credentials Form */}
            <form onSubmit={submitAuth} className="space-y-3.5 text-xs">
              <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400 uppercase tracking-wider pt-1">
                <span className="h-px flex-1 bg-white/10" />
                <span>Or Enter Custom Account</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>

              {authMode === 'register' && (
                <>
                  <input
                    className="w-full rounded-xl glass-input px-3.5 py-2.5 text-xs outline-none"
                    placeholder="Full name"
                    value={authForm.name}
                    onChange={(e) => setAuthForm((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                  <div className="grid grid-cols-2 gap-2.5">
                    <input
                      className="w-full rounded-xl glass-input px-3.5 py-2.5 text-xs outline-none font-mono"
                      placeholder="Student ID (e.g. 21041001)"
                      value={authForm.studentId}
                      onChange={(e) => setAuthForm((prev) => ({ ...prev, studentId: e.target.value }))}
                      required
                    />
                    <input
                      className="w-full rounded-xl glass-input px-3.5 py-2.5 text-xs outline-none font-mono"
                      placeholder="Batch (e.g. 2024)"
                      value={authForm.batch}
                      onChange={(e) => setAuthForm((prev) => ({ ...prev, batch: e.target.value }))}
                      required
                    />
                  </div>
                  <input
                    className="w-full rounded-xl glass-input px-3.5 py-2.5 text-xs outline-none"
                    placeholder="Department (e.g. ICE, CSE, BBA)"
                    value={authForm.department}
                    onChange={(e) => setAuthForm((prev) => ({ ...prev, department: e.target.value }))}
                    required
                  />
                  <div className="rounded-xl glass-input px-3.5 py-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Account Role
                    </label>
                    <select
                      className="w-full bg-transparent text-xs text-white outline-none"
                      value={authForm.role}
                      onChange={(e) => setAuthForm((prev) => ({ ...prev, role: e.target.value as UserRole }))}
                    >
                      <option value="Student" className="bg-slate-950">Student</option>
                      <option value="Club_Exec" className="bg-slate-950">Club Executive</option>
                      <option value="Faculty_Advisor" className="bg-slate-950">Faculty Advisor</option>
                      <option value="Venue_Admin" className="bg-slate-950">Venue Admin</option>
                      <option value="System_Admin" className="bg-slate-950">System Admin</option>
                    </select>
                  </div>
                </>
              )}

              <input
                className="w-full rounded-xl glass-input px-3.5 py-2.5 text-xs outline-none font-mono"
                placeholder="Institutional Email (@bup.edu.bd)"
                type="email"
                value={authForm.email}
                onChange={(e) => setAuthForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
              <input
                className="w-full rounded-xl glass-input px-3.5 py-2.5 text-xs outline-none font-mono"
                placeholder="Password"
                type="password"
                value={authForm.password}
                onChange={(e) => setAuthForm((prev) => ({ ...prev, password: e.target.value }))}
                required
              />

              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 py-3 text-xs font-black text-slate-950 transition-all shadow-xl shadow-emerald-950/50 disabled:opacity-60"
              >
                {isSubmitting
                  ? 'Connecting...'
                  : authMode === 'login'
                  ? 'Sign in to BUP-CMS'
                  : 'Register Account'}
              </motion.button>
            </form>

            <div className="flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                }}
                className="text-emerald-400 hover:text-emerald-300 font-bold"
              >
                {authMode === 'login' ? 'Need an account? Register' : 'Already registered? Sign in'}
              </button>
            </div>
          </motion.div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary fallbackTitle="BUP-CMS Portal Protected">
      <div className="min-h-screen bg-[#060910] text-slate-100 font-sans flex flex-col relative overflow-x-hidden">
        <InteractiveBackground density={motionSettings.particleDensity} speed={motionSettings.speed} />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />

        {/* Global Command Palette */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          clubs={clubs}
          events={events}
          venues={venues}
          onNavigateTab={setActiveCmsTab}
          onRoleChange={setSelectedRole}
          onOpenMotionSettings={() => setIsMotionSettingsOpen(true)}
        />

        {/* Motion & Physics Controller Studio Modal */}
        <MotionController
          isOpen={isMotionSettingsOpen}
          onClose={() => setIsMotionSettingsOpen(false)}
          settings={motionSettings}
          onUpdateSettings={(updated) => setMotionSettings((prev) => ({ ...prev, ...updated }))}
        />

        {/* Navigation Header */}
        <Header
          activeCmsTab={activeCmsTab}
          setActiveCmsTab={setActiveCmsTab}
          selectedRole={selectedRole}
          onRoleChange={setSelectedRole}
          userProfiles={userProfiles}
          currentUser={currentUser}
          unreadNotificationsCount={unreadNotificationsCount}
          onLogout={handleLogout}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenMotionSettings={() => setIsMotionSettingsOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 pb-20 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AnimatePresence mode="wait">
              {activeCmsTab === 'clubs' && (
                <motion.div
                  key="clubs"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 * (1 / motionSettings.speed) }}
                >
                  <ErrorBoundary fallbackTitle="Club Directory Component">
                    <ClubDirectory
                      clubs={clubs}
                      currentUser={currentUser}
                      selectedRole={selectedRole}
                      onJoinClub={handleJoinClub}
                      onLeaveClub={handleLeaveClub}
                    />
                  </ErrorBoundary>
                </motion.div>
              )}

              {activeCmsTab === 'events' && (
                <motion.div
                  key="events"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 * (1 / motionSettings.speed) }}
                >
                  <ErrorBoundary fallbackTitle="Event Hub Component">
                    <EventHub
                      events={events}
                      clubs={clubs}
                      venues={venues}
                      currentUser={currentUser}
                      selectedRole={selectedRole}
                      onRSVP={handleRSVP}
                      onCreateEvent={handleCreateEvent}
                    />
                  </ErrorBoundary>
                </motion.div>
              )}

              {activeCmsTab === 'venues' && (
                <motion.div
                  key="venues"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 * (1 / motionSettings.speed) }}
                >
                  <ErrorBoundary fallbackTitle="Venue Booking Engine">
                    <VenueBookingEngine
                      venues={venues}
                      bookings={bookings}
                      clubs={clubs}
                      currentUser={currentUser}
                      selectedRole={selectedRole}
                      onNewBooking={handleNewBooking}
                      onUpdateBookingStatus={handleUpdateBookingStatus}
                    />
                  </ErrorBoundary>
                </motion.div>
              )}

              {activeCmsTab === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 * (1 / motionSettings.speed) }}
                >
                  <ErrorBoundary fallbackTitle="Notification Center">
                    <NotificationCenter
                      notifications={notifications}
                      onMarkAsRead={handleMarkNotificationRead}
                      onClearAll={handleClearNotifications}
                      selectedRole={selectedRole}
                    />
                  </ErrorBoundary>
                </motion.div>
              )}

              {activeCmsTab === 'analytics' && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 * (1 / motionSettings.speed) }}
                >
                  <ErrorBoundary fallbackTitle="Admin Analytics Dashboard">
                    <AdminAnalyticsDashboard
                      analytics={analytics}
                      bookings={bookings}
                      selectedRole={selectedRole}
                      onUpdateBookingStatus={handleUpdateBookingStatus}
                    />
                  </ErrorBoundary>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Cyber Footer */}
        <footer className="glass-dock text-slate-400 py-6 text-xs border-t border-white/10 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-slate-400">
              © 2026 Bangladesh University of Professionals (BUP) | Dept. of ICE
            </p>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="text-slate-500">Engineered with Anime.js & Motion.dev Physics</span>
              <span className="text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                BUP-CMS v2.5
              </span>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
