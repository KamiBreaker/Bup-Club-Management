import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import {
  BUP_CLUBS,
  BUP_EVENTS,
  BUP_VENUES,
  INITIAL_VENUE_BOOKINGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ANALYTICS
} from './src/data/cmsData';

dotenv.config();

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const projectRoot = process.cwd();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const DB_PATH = process.env.VERCEL
  ? path.join('/tmp', 'bup-cms.db')
  : path.join(projectRoot, 'bup-cms.db');

const db = new Database(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    student_id TEXT NOT NULL,
    department TEXT NOT NULL,
    batch TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    avatar_url TEXT NOT NULL,
    club_memberships TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS app_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

type AppState = {
  users: any[];
  clubs: any[];
  events: any[];
  venues: any[];
  bookings: any[];
  notifications: any[];
  analytics: any;
};

function getInitialState(): AppState {
  return {
    users: [],
    clubs: BUP_CLUBS.map((club) => ({ ...club })),
    events: BUP_EVENTS.map((event) => ({ ...event })),
    venues: BUP_VENUES.map((venue) => ({ ...venue })),
    bookings: INITIAL_VENUE_BOOKINGS.map((booking) => ({ ...booking })),
    notifications: INITIAL_NOTIFICATIONS.map((notification) => ({ ...notification })),
    analytics: INITIAL_ANALYTICS
  };
}

function resetUserData() {
  db.prepare('DELETE FROM users').run();

  const row = db.prepare('SELECT value FROM app_state WHERE key = ?').get('app-state') as { value: string } | undefined;
  if (row) {
    const state = JSON.parse(row.value) as AppState;
    state.users = [];
    saveAppState(state);
  } else {
    saveAppState(getInitialState());
  }
}

function loadAppState(): AppState {
  const row = db.prepare('SELECT value FROM app_state WHERE key = ?').get('app-state') as { value: string } | undefined;
  if (row) {
    return JSON.parse(row.value);
  }

  const initialState = getInitialState();
  saveAppState(initialState);
  return initialState;
}

function saveAppState(state: AppState) {
  db.prepare(`
    INSERT INTO app_state(key, value)
    VALUES(?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run('app-state', JSON.stringify(state));
}

function createToken(user: { id: string; email: string; role: string }) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

function requireAuth(req: any, res: express.Response, next: express.NextFunction) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; email: string; role: string };
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }
}

function buildUserProfile(userRow: any) {
  return {
    id: userRow.id,
    name: userRow.name,
    studentId: userRow.student_id,
    department: userRow.department,
    batch: userRow.batch,
    email: userRow.email,
    role: userRow.role,
    clubMemberships: JSON.parse(userRow.club_memberships || '[]'),
    avatarUrl: userRow.avatar_url
  };
}

async function startServer() {
  const app = express();
  resetUserData();
  const state = loadAppState();
  if (!state.users?.length) {
    saveAppState(getInitialState());
  }

  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', app: 'BUP-CMS', time: new Date().toISOString() });
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, email, password, studentId, department, batch, role = 'Student' } = req.body;
      if (!name || !email || !password || !studentId || !department || !batch) {
        return res.status(400).json({ error: 'Please fill in all required fields.' });
      }

      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const userId = `USR-${Date.now()}`;
      const avatarUrl = `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(name)}`;
      const createdAt = new Date().toISOString();

      db.prepare(`
        INSERT INTO users (id, name, student_id, department, batch, email, password_hash, role, avatar_url, club_memberships, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        name,
        studentId,
        department,
        batch,
        email,
        passwordHash,
        role,
        avatarUrl,
        '[]',
        createdAt
      );

      const stateSnapshot = loadAppState();
      const newUser = {
        id: userId,
        name,
        studentId,
        department,
        batch,
        email,
        role,
        clubMemberships: [],
        avatarUrl
      };

      stateSnapshot.users = [...stateSnapshot.users, newUser];
      saveAppState(stateSnapshot);

      const token = createToken({ id: userId, email, role });
      res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7
      });

      return res.json({ success: true, user: newUser, state: stateSnapshot });
    } catch (error: any) {
      console.error('Register error:', error);
      return res.status(500).json({ error: error.message || 'Registration failed.' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
      if (!row) {
        return res.status(401).json({ error: 'No account found for this email.' });
      }

      const matches = await bcrypt.compare(password, row.password_hash);
      if (!matches) {
        return res.status(401).json({ error: 'Incorrect password.' });
      }

      const user = buildUserProfile(row);
      const token = createToken({ id: user.id, email: user.email, role: user.role });
      res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7
      });

      const stateSnapshot = loadAppState();
      return res.json({ success: true, user, state: stateSnapshot });
    } catch (error: any) {
      console.error('Login error:', error);
      return res.status(500).json({ error: error.message || 'Login failed.' });
    }
  });

  app.post('/api/auth/logout', (_req, res) => {
    res.clearCookie('token');
    return res.json({ success: true });
  });

  app.get('/api/auth/me', requireAuth, (req, res) => {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.sub) as any;
    if (!row) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({ user: buildUserProfile(row) });
  });

  app.get('/api/app-state', requireAuth, (_req, res) => {
    const stateSnapshot = loadAppState();
    return res.json({ state: stateSnapshot });
  });

  app.post('/api/app-state/update', requireAuth, (req, res) => {
    try {
      const { action, payload } = req.body;
      const stateSnapshot = loadAppState();
      const currentUserId = req.user.sub;
      const currentUser = stateSnapshot.users.find((user: any) => user.id === currentUserId);

      if (!currentUser) {
        return res.status(404).json({ error: 'Authenticated user not found.' });
      }

      switch (action) {
        case 'join-club': {
          const clubId = payload?.clubId;
          if (!clubId) {
            return res.status(400).json({ error: 'A club id is required.' });
          }

          stateSnapshot.clubs = stateSnapshot.clubs.map((club: any) =>
            club.id === clubId ? { ...club, memberCount: club.memberCount + 1 } : club
          );

          stateSnapshot.users = stateSnapshot.users.map((user: any) => {
            if (user.id !== currentUserId) {
              return user;
            }

            const alreadyJoined = user.clubMemberships.some((membership: any) => membership.clubId === clubId);
            return {
              ...user,
              clubMemberships: alreadyJoined
                ? user.clubMemberships
                : [...user.clubMemberships, { clubId, roleName: 'General Member', status: 'Active' }]
            };
          });

          stateSnapshot.notifications = [
            {
              id: `NT-${Date.now()}`,
              title: 'Membership Updated',
              message: 'Your membership request has been recorded successfully.',
              type: 'Approval',
              targetRoles: ['Student'],
              read: false,
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
            },
            ...stateSnapshot.notifications
          ];

          saveAppState(stateSnapshot);
          return res.json({ success: true, message: 'Membership updated.', state: stateSnapshot });
        }

        case 'leave-club': {
          const clubId = payload?.clubId;
          if (!clubId) {
            return res.status(400).json({ error: 'A club id is required.' });
          }

          stateSnapshot.clubs = stateSnapshot.clubs.map((club: any) =>
            club.id === clubId ? { ...club, memberCount: Math.max(0, club.memberCount - 1) } : club
          );

          stateSnapshot.users = stateSnapshot.users.map((user: any) => {
            if (user.id !== currentUserId) {
              return user;
            }

            return {
              ...user,
              clubMemberships: user.clubMemberships.filter((membership: any) => membership.clubId !== clubId)
            };
          });

          saveAppState(stateSnapshot);
          return res.json({ success: true, message: 'Membership removed.', state: stateSnapshot });
        }

        case 'rsvp': {
          const eventId = payload?.eventId;
          if (!eventId) {
            return res.status(400).json({ error: 'An event id is required.' });
          }

          const event = stateSnapshot.events.find((entry: any) => entry.id === eventId);
          stateSnapshot.events = stateSnapshot.events.map((entry: any) => {
            if (entry.id !== eventId) {
              return entry;
            }

            return {
              ...entry,
              registeredCount: entry.registeredCount + 1,
              registeredUserIds: [...entry.registeredUserIds, currentUserId]
            };
          });

          stateSnapshot.notifications = [
            {
              id: `NT-${Date.now()}`,
              title: 'RSVP Confirmed!',
              message: `You have successfully claimed a seat for "${event?.title || 'the event'}".`,
              type: 'Event',
              targetRoles: ['Student'],
              read: false,
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
            },
            ...stateSnapshot.notifications
          ];

          saveAppState(stateSnapshot);
          return res.json({ success: true, message: 'Event registration confirmed.', state: stateSnapshot });
        }

        case 'create-event': {
          const newEventData = payload || {};
          const createdEvent = {
            id: `EVT-${Date.now()}`,
            clubId: newEventData.clubId || 'CLUB-01',
            clubName: newEventData.clubName || 'BUP Club',
            clubLogo: newEventData.clubLogo || '',
            title: newEventData.title || 'Untitled Event',
            category: newEventData.category || 'Workshop',
            description: newEventData.description || 'Event description',
            posterUrl: newEventData.posterUrl || '',
            date: newEventData.date || '2026-08-20',
            startTime: newEventData.startTime || '10:00',
            endTime: newEventData.endTime || '12:00',
            venueId: newEventData.venueId || 'VEN-01',
            venueName: newEventData.venueName || 'BUP Hall',
            maxSeats: newEventData.maxSeats || 100,
            registeredCount: 1,
            status: 'Upcoming',
            isRSVPAllowed: true,
            registeredUserIds: [currentUserId],
            attendeeUserIds: []
          };

          stateSnapshot.events = [createdEvent, ...stateSnapshot.events];
          saveAppState(stateSnapshot);
          return res.json({ success: true, message: 'New event created.', state: stateSnapshot });
        }

        case 'new-booking': {
          const newBookingData = payload || {};
          const newBooking = {
            id: `BK-${Math.floor(100 + Math.random() * 900)}`,
            eventTitle: newBookingData.eventTitle || 'Club Event',
            clubId: newBookingData.clubId || 'CLUB-01',
            clubName: newBookingData.clubName || 'BUP Club',
            venueId: newBookingData.venueId || 'VEN-01',
            venueName: newBookingData.venueName || 'BUP Hall',
            bookingDate: newBookingData.bookingDate || '2026-08-20',
            startTime: newBookingData.startTime || '10:00',
            endTime: newBookingData.endTime || '12:00',
            expectedAttendance: newBookingData.expectedAttendance || 50,
            requestedEquipment: newBookingData.requestedEquipment || ['PA System'],
            purpose: newBookingData.purpose || 'Official Club Meeting',
            status: 'Pending',
            conflictDetected: false,
            submittedBy: newBookingData.submittedBy || currentUser.name,
            createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
          };

          stateSnapshot.bookings = [newBooking, ...stateSnapshot.bookings];
          saveAppState(stateSnapshot);
          return res.json({ success: true, message: 'Booking request submitted.', state: stateSnapshot });
        }

        case 'update-booking-status': {
          const { bookingId, status } = payload || {};
          stateSnapshot.bookings = stateSnapshot.bookings.map((booking: any) =>
            booking.id === bookingId ? { ...booking, status, reviewedBy: currentUser.name } : booking
          );
          saveAppState(stateSnapshot);
          return res.json({ success: true, message: 'Booking status updated.', state: stateSnapshot });
        }

        case 'mark-notification-read': {
          const notificationId = payload?.id;
          stateSnapshot.notifications = stateSnapshot.notifications.map((notification: any) =>
            notification.id === notificationId ? { ...notification, read: true } : notification
          );
          saveAppState(stateSnapshot);
          return res.json({ success: true, message: 'Notification marked as read.', state: stateSnapshot });
        }

        case 'clear-notifications': {
          stateSnapshot.notifications = stateSnapshot.notifications.map((notification: any) => ({ ...notification, read: true }));
          saveAppState(stateSnapshot);
          return res.json({ success: true, message: 'Notifications cleared.', state: stateSnapshot });
        }

        default:
          return res.status(400).json({ error: 'Unsupported action.' });
      }
    } catch (error: any) {
      console.error('State update error:', error);
      return res.status(500).json({ error: error.message || 'Failed to update the system state.' });
    }
  });

  app.post('/api/ai/generate', async (req, res) => {
    try {
      const { prompt, context } = req.body;
      const basePrompt = prompt || context || 'Create a polished campus event description.';
      const fallbackText = `${basePrompt}\n\nSuggested local draft: Join us for an engaging BUP campus event designed to build student participation, practical learning, and community spirit.`;

      return res.json({ success: true, fallback: true, text: fallbackText });
    } catch (error: any) {
      console.error('AI fallback error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to generate local AI fallback response' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(projectRoot, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BUP-CMS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
