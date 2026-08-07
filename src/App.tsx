/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AnalyticsSummary, UserRole, UserProfile, Club, ClubEvent, Venue, VenueBooking, SystemNotification } from './types/cms';
import { Header } from './components/common/Header';
import { ClubDirectory } from './components/cms/ClubDirectory';
import { EventHub } from './components/cms/EventHub';
import { VenueBookingEngine } from './components/cms/VenueBookingEngine';
import { NotificationCenter } from './components/cms/NotificationCenter';
import { AdminAnalyticsDashboard } from './components/cms/AdminAnalyticsDashboard';

interface AppStateShape {
  users: UserProfile[];
  clubs: Club[];
  events: ClubEvent[];
  venues: Venue[];
  bookings: VenueBooking[];
  notifications: SystemNotification[];
  analytics: AnalyticsSummary;
}

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
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authUser, setAuthUser] = useState<UserProfile | null>(null);
  const [appState, setAppState] = useState<AppStateShape>({
    users: [],
    clubs: [],
    events: [],
    venues: [],
    bookings: [],
    notifications: [],
    analytics: {
      totalClubs: 0,
      totalActiveMembers: 0,
      totalEventsConducted: 0,
      avgAttendanceRate: 0,
      pendingVenueApprovals: 0,
      pendingMemberApprovals: 0,
      venueUtilization: [],
      clubActivityMetrics: [],
      monthlyRegistrations: []
    }
  });

  const currentUser = authUser ?? appState.users[0] ?? null;
  const userProfiles = appState.users;
  const clubs = appState.clubs;
  const events = appState.events;
  const venues = appState.venues;
  const bookings = appState.bookings;
  const notifications = appState.notifications;
  const analytics = appState.analytics;
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    void loadSession();
  }, []);

  useEffect(() => {
    if (currentUser) {
      setSelectedRole(currentUser.role);
    }
  }, [currentUser?.id]);

  async function loadSession() {
    setIsAuthLoading(true);
    try {
      const authResponse = await fetch('/api/auth/me', { credentials: 'include' });
      if (!authResponse.ok) {
        setAuthUser(null);
        setIsAuthLoading(false);
        return;
      }

      const authData = await authResponse.json();
      const appResponse = await fetch('/api/app-state', { credentials: 'include' });
      const appData = await appResponse.json();
      setAuthUser(authData.user as UserProfile);
      setAppState(appData.state as AppStateShape);
      setFeedback(null);
    } catch (error) {
      console.error('Unable to load session', error);
      setAuthUser(null);
    } finally {
      setIsAuthLoading(false);
    }
  }

  async function submitAuth(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(authMode === 'login' ? {
          email: authForm.email,
          password: authForm.password
        } : {
          name: authForm.name,
          email: authForm.email,
          password: authForm.password,
          studentId: authForm.studentId,
          department: authForm.department,
          batch: authForm.batch,
          role: authForm.role
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      if (authMode === 'login') {
        setAuthUser(data.user as UserProfile);
        setAppState(data.state as AppStateShape);
        setFeedback('Welcome back.');
      } else {
        setAuthUser(null);
        setAuthMode('login');
        setAuthForm((prev) => ({
          ...prev,
          name: '',
          email: '',
          password: '',
          studentId: '',
          department: 'ICE',
          batch: '2024',
          role: 'Student'
        }));
        setFeedback('Account created successfully. Please sign in.');
      }
    } catch (error: any) {
      setFeedback(error.message || 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function persistState(action: string, payload?: unknown) {
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
    setFeedback(data.message || 'Saved successfully.');
  }

  const handleJoinClub = async (clubId: string) => {
    try {
      await persistState('join-club', { clubId });
    } catch (error: any) {
      setFeedback(error.message || 'Unable to join this club.');
    }
  };

  const handleLeaveClub = async (clubId: string) => {
    try {
      await persistState('leave-club', { clubId });
    } catch (error: any) {
      setFeedback(error.message || 'Unable to leave this club.');
    }
  };

  const handleRSVP = async (eventId: string) => {
    try {
      await persistState('rsvp', { eventId });
    } catch (error: any) {
      setFeedback(error.message || 'Unable to RSVP right now.');
    }
  };

  const handleCreateEvent = async (newEventData: Partial<ClubEvent>) => {
    try {
      await persistState('create-event', newEventData);
    } catch (error: any) {
      setFeedback(error.message || 'Unable to create the event.');
    }
  };

  const handleNewBooking = async (newBookingData: Partial<VenueBooking>) => {
    try {
      await persistState('new-booking', newBookingData);
    } catch (error: any) {
      setFeedback(error.message || 'Unable to submit the booking request.');
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: 'Approved' | 'Rejected') => {
    try {
      await persistState('update-booking-status', { bookingId, status });
    } catch (error: any) {
      setFeedback(error.message || 'Unable to update the booking status.');
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await persistState('mark-notification-read', { id });
    } catch (error: any) {
      setFeedback(error.message || 'Unable to update the notification.');
    }
  };

  const handleClearNotifications = async () => {
    try {
      await persistState('clear-notifications');
    } catch (error: any) {
      setFeedback(error.message || 'Unable to clear notifications.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setAuthUser(null);
      setSelectedRole('Student');
      setAuthMode('login');
      setFeedback('You have been signed out.');
    } catch (error: any) {
      setFeedback(error.message || 'Unable to sign out right now.');
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-700">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
          <p className="text-sm font-semibold">Loading secure portal...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl">
          <div className="mb-6">
            <p className="text-emerald-400 text-sm font-semibold uppercase tracking-[0.3em]">Secure access</p>
            <h1 className="mt-2 text-3xl font-bold">Welcome to BUP-CMS</h1>
            <p className="mt-2 text-sm text-slate-400">Create an account or sign in to access the club operations dashboard.</p>
          </div>

          <form className="space-y-4" onSubmit={submitAuth}>
            {authMode === 'register' && (
              <>
                <input
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none"
                  placeholder="Full name"
                  value={authForm.name}
                  onChange={(event) => setAuthForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none"
                    placeholder="Student ID"
                    value={authForm.studentId}
                    onChange={(event) => setAuthForm((prev) => ({ ...prev, studentId: event.target.value }))}
                    required
                  />
                  <input
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none"
                    placeholder="Batch"
                    value={authForm.batch}
                    onChange={(event) => setAuthForm((prev) => ({ ...prev, batch: event.target.value }))}
                    required
                  />
                </div>
                <input
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none"
                  placeholder="Department"
                  value={authForm.department}
                  onChange={(event) => setAuthForm((prev) => ({ ...prev, department: event.target.value }))}
                  required
                />
                <div className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Choose your role
                  </label>
                  <select
                    className="w-full bg-transparent text-sm text-white outline-none"
                    value={authForm.role}
                    onChange={(event) => setAuthForm((prev) => ({ ...prev, role: event.target.value as UserRole }))}
                  >
                    <option value="Student" className="bg-slate-900">Student</option>
                    <option value="Club_Exec" className="bg-slate-900">Club Executive</option>
                    <option value="Faculty_Advisor" className="bg-slate-900">Faculty Advisor</option>
                    <option value="Venue_Admin" className="bg-slate-900">Venue Admin</option>
                    <option value="System_Admin" className="bg-slate-900">System Admin</option>
                  </select>
                </div>
              </>
            )}

            <input
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none"
              placeholder="Email"
              type="email"
              value={authForm.email}
              onChange={(event) => setAuthForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
            <input
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none"
              placeholder="Password"
              type="password"
              value={authForm.password}
              onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))}
              required
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-70"
            >
              {isSubmitting ? 'Please wait...' : authMode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
            <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-emerald-400">
              {authMode === 'login' ? 'Need an account? Register' : 'Already registered? Sign in'}
            </button>
          </div>

          {feedback && <p className="mt-4 text-sm text-amber-400">{feedback}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col">
      <Header
        activeCmsTab={activeCmsTab}
        setActiveCmsTab={setActiveCmsTab}
        selectedRole={selectedRole}
        onRoleChange={setSelectedRole}
        userProfiles={userProfiles}
        currentUser={currentUser}
        unreadNotificationsCount={unreadNotificationsCount}
        onLogout={handleLogout}
      />

      <main className="flex-1 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {feedback && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {feedback}
            </div>
          )}

          {activeCmsTab === 'clubs' && (
            <ClubDirectory
              clubs={clubs}
              currentUser={currentUser}
              selectedRole={selectedRole}
              onJoinClub={handleJoinClub}
              onLeaveClub={handleLeaveClub}
            />
          )}

          {activeCmsTab === 'events' && (
            <EventHub
              events={events}
              clubs={clubs}
              venues={venues}
              currentUser={currentUser}
              selectedRole={selectedRole}
              onRSVP={handleRSVP}
              onCreateEvent={handleCreateEvent}
            />
          )}

          {activeCmsTab === 'venues' && (
            <VenueBookingEngine
              venues={venues}
              bookings={bookings}
              clubs={clubs}
              currentUser={currentUser}
              selectedRole={selectedRole}
              onNewBooking={handleNewBooking}
              onUpdateBookingStatus={handleUpdateBookingStatus}
            />
          )}

          {activeCmsTab === 'notifications' && (
            <NotificationCenter
              notifications={notifications}
              onMarkAsRead={handleMarkNotificationRead}
              onClearAll={handleClearNotifications}
              selectedRole={selectedRole}
            />
          )}

          {activeCmsTab === 'analytics' && (
            <AdminAnalyticsDashboard
              analytics={analytics}
              bookings={bookings}
              selectedRole={selectedRole}
              onUpdateBookingStatus={handleUpdateBookingStatus}
            />
          )}
        </div>
      </main>

      <footer className="bg-[#0F2027] text-slate-400 py-6 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>
            © 2026 Bangladesh University of Professionals (BUP) | Dept. of ICE
          </p>
          <p className="font-mono text-emerald-400">
            BUP-CMS v1.0.0
          </p>
        </div>
      </footer>
    </div>
  );
}
