import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import {
  INITIAL_USER_PROFILES,
  BUP_CLUBS,
  BUP_EVENTS,
  BUP_VENUES,
  INITIAL_VENUE_BOOKINGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ANALYTICS,
  INITIAL_APPLICATIONS,
  INITIAL_REGISTRATIONS,
  INITIAL_ATTENDANCE,
  INITIAL_ANNOUNCEMENTS
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

// ----------------------------------------------------
// NORMALIZED DATABASE INITIALIZATION (Slide 8 ER Model)
// ----------------------------------------------------
function initDatabaseTables() {
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

    CREATE TABLE IF NOT EXISTS clubs (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      department TEXT NOT NULL,
      founding_year INTEGER NOT NULL,
      logo_url TEXT,
      banner_url TEXT,
      tagline TEXT,
      description TEXT,
      faculty_advisor TEXT NOT NULL DEFAULT '{}',
      executives TEXT NOT NULL DEFAULT '[]',
      member_count INTEGER NOT NULL DEFAULT 0,
      featured_events_count INTEGER NOT NULL DEFAULT 0,
      budget_allocated REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Active',
      recruitment_open INTEGER NOT NULL DEFAULT 1,
      recruitment_deadline TEXT,
      membership_requirements TEXT NOT NULL DEFAULT '[]',
      objectives TEXT NOT NULL DEFAULT '[]',
      achievements TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS membership_applications (
      id TEXT PRIMARY KEY,
      club_id TEXT NOT NULL,
      club_name TEXT NOT NULL,
      user_id TEXT NOT NULL,
      applicant_name TEXT NOT NULL,
      student_id TEXT NOT NULL,
      department TEXT NOT NULL,
      batch TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      role_name TEXT NOT NULL DEFAULT 'General Member',
      status TEXT NOT NULL DEFAULT 'Pending',
      statement_of_purpose TEXT,
      skills_interests TEXT,
      application_date TEXT NOT NULL,
      decision_date TEXT,
      decision_by TEXT,
      decision_remarks TEXT
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      club_id TEXT NOT NULL,
      club_name TEXT NOT NULL,
      club_logo TEXT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      poster_url TEXT,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      venue_id TEXT NOT NULL,
      venue_name TEXT NOT NULL,
      max_seats INTEGER NOT NULL DEFAULT 100,
      registered_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Upcoming',
      is_rsvp_allowed INTEGER NOT NULL DEFAULT 1,
      registered_user_ids TEXT NOT NULL DEFAULT '[]',
      attendee_user_ids TEXT NOT NULL DEFAULT '[]',
      registration_deadline TEXT,
      contact_person TEXT,
      organizing_team TEXT,
      required_equipment TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS event_registrations (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      event_title TEXT NOT NULL,
      club_name TEXT,
      user_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      department TEXT NOT NULL,
      email TEXT NOT NULL,
      pass_code TEXT NOT NULL UNIQUE,
      registration_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Confirmed',
      attended INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      event_title TEXT,
      user_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      department TEXT,
      status TEXT NOT NULL DEFAULT 'Present',
      marked_at TEXT NOT NULL,
      marked_by TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS venues (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      location TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      facilities TEXT NOT NULL DEFAULT '[]',
      image_url TEXT,
      status TEXT NOT NULL DEFAULT 'Available'
    );

    CREATE TABLE IF NOT EXISTS venue_bookings (
      id TEXT PRIMARY KEY,
      event_id TEXT,
      event_title TEXT NOT NULL,
      club_id TEXT NOT NULL,
      club_name TEXT NOT NULL,
      venue_id TEXT NOT NULL,
      venue_name TEXT NOT NULL,
      booking_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      expected_attendance INTEGER NOT NULL,
      requested_equipment TEXT NOT NULL DEFAULT '[]',
      purpose TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      conflict_detected INTEGER NOT NULL DEFAULT 0,
      conflict_reason TEXT,
      submitted_by TEXT NOT NULL,
      reviewed_by TEXT,
      decision_date TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      target_roles TEXT NOT NULL DEFAULT '[]',
      target_user_id TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      club_id TEXT NOT NULL,
      club_name TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'Normal',
      created_at TEXT NOT NULL,
      created_by TEXT NOT NULL
    );
  `);

  // Safe table schema migrations for Q&A and interactive notifications
  try { db.exec('ALTER TABLE membership_applications ADD COLUMN question_prompt TEXT'); } catch {}
  try { db.exec('ALTER TABLE membership_applications ADD COLUMN question_asked_by TEXT'); } catch {}
  try { db.exec('ALTER TABLE membership_applications ADD COLUMN question_date TEXT'); } catch {}
  try { db.exec('ALTER TABLE membership_applications ADD COLUMN student_answer TEXT'); } catch {}
  try { db.exec('ALTER TABLE membership_applications ADD COLUMN answer_date TEXT'); } catch {}

  try { db.exec('ALTER TABLE notifications ADD COLUMN action_type TEXT'); } catch {}
  try { db.exec('ALTER TABLE notifications ADD COLUMN application_id TEXT'); } catch {}
  try { db.exec('ALTER TABLE notifications ADD COLUMN question_prompt TEXT'); } catch {}
  try { db.exec("ALTER TABLE membership_applications ADD COLUMN application_type TEXT NOT NULL DEFAULT 'Member'"); } catch {}
}

async function seedDatabase() {
  try {
    // 1. Seed Clean Administrator Account
    const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any)?.count || 0;
    if (userCount === 0) {
      const defaultHash = await bcrypt.hash('admin123', 10);
      const insertUser = db.prepare(`
        INSERT OR IGNORE INTO users (id, name, student_id, department, batch, email, password_hash, role, avatar_url, club_memberships, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const u of INITIAL_USER_PROFILES) {
        insertUser.run(
          u.id,
          u.name,
          u.studentId,
          u.department,
          u.batch,
          u.email,
          defaultHash,
          u.role,
          u.avatarUrl,
          JSON.stringify(u.clubMemberships || []),
          new Date().toISOString()
        );
      }
    }

    // 2. Seed Clubs
    const clubCount = (db.prepare('SELECT COUNT(*) as count FROM clubs').get() as any)?.count || 0;
    if (clubCount === 0) {
      const insertClub = db.prepare(`
        INSERT OR IGNORE INTO clubs (id, code, name, category, department, founding_year, logo_url, banner_url, tagline, description, faculty_advisor, executives, member_count, featured_events_count, budget_allocated, status, recruitment_open, recruitment_deadline, membership_requirements, objectives, achievements)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const c of BUP_CLUBS) {
        insertClub.run(
          c.id,
          c.code,
          c.name,
          c.category,
          c.department,
          c.foundingYear,
          c.logoUrl,
          c.bannerUrl,
          c.tagline,
          c.description,
          JSON.stringify(c.facultyAdvisor || {}),
          JSON.stringify(c.executives || []),
          c.memberCount,
          c.featuredEventsCount,
          c.budgetAllocated,
          c.status,
          c.recruitmentOpen !== false ? 1 : 0,
          c.recruitmentDeadline || '2026-09-30',
          JSON.stringify(c.membershipRequirements || ['Minimum CGPA 2.50', 'Valid BUP Student ID', 'Pass Executive Interview']),
          JSON.stringify(c.objectives || ['Skill Development', 'Campus Leadership', 'Inter-University Competitions']),
          JSON.stringify(c.achievements || ['National Finalist 2025', 'Best Co-curricular Society 2024'])
        );
      }
    }

    // 3. Seed Venues
    const venueCount = (db.prepare('SELECT COUNT(*) as count FROM venues').get() as any)?.count || 0;
    if (venueCount === 0) {
      const insertVenue = db.prepare(`
        INSERT OR IGNORE INTO venues (id, name, code, location, capacity, facilities, image_url, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const v of BUP_VENUES) {
        insertVenue.run(
          v.id,
          v.name,
          v.code,
          v.location,
          v.capacity,
          JSON.stringify(v.facilities || []),
          v.imageUrl,
          v.status
        );
      }
    }

    // 4. Seed Events
    const eventCount = (db.prepare('SELECT COUNT(*) as count FROM events').get() as any)?.count || 0;
    if (eventCount === 0) {
      const insertEvent = db.prepare(`
        INSERT OR IGNORE INTO events (id, club_id, club_name, club_logo, title, category, description, poster_url, date, start_time, end_time, venue_id, venue_name, max_seats, registered_count, status, is_rsvp_allowed, registered_user_ids, attendee_user_ids, registration_deadline, contact_person, organizing_team, required_equipment)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const e of BUP_EVENTS) {
        insertEvent.run(
          e.id,
          e.clubId,
          e.clubName,
          e.clubLogo,
          e.title,
          e.category,
          e.description,
          e.posterUrl,
          e.date,
          e.startTime,
          e.endTime,
          e.venueId,
          e.venueName,
          e.maxSeats,
          e.registeredCount,
          e.status,
          e.isRSVPAllowed ? 1 : 0,
          JSON.stringify(e.registeredUserIds || []),
          JSON.stringify(e.attendeeUserIds || []),
          e.registrationDeadline || '2026-08-16',
          e.contactPerson || 'Secretary of Operations',
          e.organizingTeam || `${e.clubName} Core Committee`,
          JSON.stringify(e.requiredEquipment || ['Projector', 'PA System'])
        );
      }
    }

    // 5. Seed Venue Bookings
    const bookingCount = (db.prepare('SELECT COUNT(*) as count FROM venue_bookings').get() as any)?.count || 0;
    if (bookingCount === 0) {
      const insertBooking = db.prepare(`
        INSERT OR IGNORE INTO venue_bookings (id, event_id, event_title, club_id, club_name, venue_id, venue_name, booking_date, start_time, end_time, expected_attendance, requested_equipment, purpose, status, conflict_detected, conflict_reason, submitted_by, reviewed_by, decision_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const b of INITIAL_VENUE_BOOKINGS) {
        insertBooking.run(
          b.id,
          b.eventId || null,
          b.eventTitle,
          b.clubId,
          b.clubName,
          b.venueId,
          b.venueName,
          b.bookingDate,
          b.startTime,
          b.endTime,
          b.expectedAttendance,
          JSON.stringify(b.requestedEquipment || []),
          b.purpose,
          b.status,
          b.conflictDetected ? 1 : 0,
          b.conflictReason || null,
          b.submittedBy,
          b.reviewedBy || null,
          b.decisionDate || null,
          b.createdAt
        );
      }
    }

    // 6. Seed Notifications
    const notifCount = (db.prepare('SELECT COUNT(*) as count FROM notifications').get() as any)?.count || 0;
    if (notifCount === 0) {
      const insertNotif = db.prepare(`
        INSERT OR IGNORE INTO notifications (id, title, message, type, target_roles, target_user_id, read, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const n of INITIAL_NOTIFICATIONS) {
        insertNotif.run(
          n.id,
          n.title,
          n.message,
          n.type,
          JSON.stringify(n.targetRoles || []),
          n.targetUserId || null,
          n.read ? 1 : 0,
          n.timestamp
        );
      }
    }

    // 7. Seed Applications (Slide 8 MEMBERSHIP)
    const appCount = (db.prepare('SELECT COUNT(*) as count FROM membership_applications').get() as any)?.count || 0;
    if (appCount === 0) {
      const insertApp = db.prepare(`
        INSERT OR IGNORE INTO membership_applications (id, club_id, club_name, user_id, applicant_name, student_id, department, batch, email, phone, role_name, status, statement_of_purpose, skills_interests, application_date, decision_date, decision_by, decision_remarks)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const app of INITIAL_APPLICATIONS) {
        insertApp.run(
          app.id,
          app.clubId,
          app.clubName,
          app.userId,
          app.applicantName,
          app.studentId,
          app.department,
          app.batch,
          app.email,
          app.phone || null,
          app.roleName,
          app.status,
          app.statementOfPurpose,
          app.skillsInterests,
          app.applicationDate,
          app.decisionDate || null,
          app.decisionBy || null,
          app.decisionRemarks || null
        );
      }
    }

    // 8. Seed Registrations
    const regCount = (db.prepare('SELECT COUNT(*) as count FROM event_registrations').get() as any)?.count || 0;
    if (regCount === 0) {
      const insertReg = db.prepare(`
        INSERT OR IGNORE INTO event_registrations (id, event_id, event_title, club_name, user_id, student_id, student_name, department, email, pass_code, registration_date, status, attended)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const reg of INITIAL_REGISTRATIONS) {
        insertReg.run(
          reg.id,
          reg.eventId,
          reg.eventTitle,
          reg.clubName || null,
          reg.userId,
          reg.studentId,
          reg.studentName,
          reg.department,
          reg.email,
          reg.passCode,
          reg.registrationDate,
          reg.status,
          reg.attended ? 1 : 0
        );
      }
    }

    // 9. Seed Attendance
    const attCount = (db.prepare('SELECT COUNT(*) as count FROM attendance').get() as any)?.count || 0;
    if (attCount === 0) {
      const insertAtt = db.prepare(`
        INSERT OR IGNORE INTO attendance (id, event_id, event_title, user_id, student_id, student_name, department, status, marked_at, marked_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const att of INITIAL_ATTENDANCE) {
        insertAtt.run(
          att.id,
          att.eventId,
          att.eventTitle || null,
          att.userId,
          att.studentId,
          att.studentName,
          att.department || null,
          att.status,
          att.markedAt,
          att.markedBy
        );
      }
    }

    // 10. Seed Announcements
    const ancCount = (db.prepare('SELECT COUNT(*) as count FROM announcements').get() as any)?.count || 0;
    if (ancCount === 0) {
      const insertAnc = db.prepare(`
        INSERT OR IGNORE INTO announcements (id, club_id, club_name, title, content, priority, created_at, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const anc of INITIAL_ANNOUNCEMENTS) {
        insertAnc.run(
          anc.id,
          anc.clubId,
          anc.clubName,
          anc.title,
          anc.content,
          anc.priority,
          anc.createdAt,
          anc.createdBy
        );
      }
    }

  } catch (e) {
    console.error('Database seed error:', e);
  }
}

// ----------------------------------------------------
// STATE LOADER FROM NORMALIZED RELATIONAL SQLITE
// ----------------------------------------------------
function loadNormalizedAppState() {
  const usersRows = db.prepare('SELECT * FROM users').all();
  const clubsRows = db.prepare('SELECT * FROM clubs').all();
  const eventsRows = db.prepare('SELECT * FROM events').all();
  const venuesRows = db.prepare('SELECT * FROM venues').all();
  const bookingsRows = db.prepare('SELECT * FROM venue_bookings ORDER BY created_at DESC').all();
  const notifRows = db.prepare('SELECT * FROM notifications ORDER BY timestamp DESC').all();
  const appRows = db.prepare('SELECT * FROM membership_applications ORDER BY application_date DESC').all();
  const regRows = db.prepare('SELECT * FROM event_registrations ORDER BY registration_date DESC').all();
  const attRows = db.prepare('SELECT * FROM attendance ORDER BY marked_at DESC').all();
  const ancRows = db.prepare('SELECT * FROM announcements ORDER BY created_at DESC').all();

  const users = usersRows.map((r: any) => ({
    id: r.id,
    name: r.name,
    studentId: r.student_id,
    department: r.department,
    batch: r.batch,
    email: r.email,
    role: r.role,
    avatarUrl: r.avatar_url,
    clubMemberships: JSON.parse(r.club_memberships || '[]')
  }));

  const clubs = clubsRows.map((r: any) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    category: r.category,
    department: r.department,
    foundingYear: r.founding_year,
    logoUrl: r.logo_url,
    bannerUrl: r.banner_url,
    tagline: r.tagline,
    description: r.description,
    facultyAdvisor: JSON.parse(r.faculty_advisor || '{}'),
    executives: JSON.parse(r.executives || '[]'),
    memberCount: r.member_count,
    featuredEventsCount: r.featured_events_count,
    budgetAllocated: r.budget_allocated,
    status: r.status,
    recruitmentOpen: Boolean(r.recruitment_open),
    recruitmentDeadline: r.recruitment_deadline,
    membershipRequirements: JSON.parse(r.membership_requirements || '[]'),
    objectives: JSON.parse(r.objectives || '[]'),
    achievements: JSON.parse(r.achievements || '[]')
  }));

  const events = eventsRows.map((r: any) => ({
    id: r.id,
    clubId: r.club_id,
    clubName: r.club_name,
    clubLogo: r.club_logo,
    title: r.title,
    category: r.category,
    description: r.description,
    posterUrl: r.poster_url,
    date: r.date,
    startTime: r.start_time,
    endTime: r.end_time,
    venueId: r.venue_id,
    venueName: r.venue_name,
    maxSeats: r.max_seats,
    registeredCount: r.registered_count,
    status: r.status,
    isRSVPAllowed: Boolean(r.is_rsvp_allowed),
    registeredUserIds: JSON.parse(r.registered_user_ids || '[]'),
    attendeeUserIds: JSON.parse(r.attendee_user_ids || '[]'),
    registrationDeadline: r.registration_deadline,
    contactPerson: r.contact_person,
    organizingTeam: r.organizing_team,
    requiredEquipment: JSON.parse(r.required_equipment || '[]')
  }));

  const venues = venuesRows.map((r: any) => ({
    id: r.id,
    name: r.name,
    code: r.code,
    location: r.location,
    capacity: r.capacity,
    facilities: JSON.parse(r.facilities || '[]'),
    imageUrl: r.image_url,
    status: r.status
  }));

  const bookings = bookingsRows.map((r: any) => ({
    id: r.id,
    eventId: r.event_id,
    eventTitle: r.event_title,
    clubId: r.club_id,
    clubName: r.club_name,
    venueId: r.venue_id,
    venueName: r.venue_name,
    bookingDate: r.booking_date,
    startTime: r.start_time,
    endTime: r.end_time,
    expectedAttendance: r.expected_attendance,
    requestedEquipment: JSON.parse(r.requested_equipment || '[]'),
    purpose: r.purpose,
    status: r.status,
    conflictDetected: Boolean(r.conflict_detected),
    conflictReason: r.conflict_reason,
    submittedBy: r.submitted_by,
    reviewedBy: r.reviewed_by,
    decisionDate: r.decision_date,
    createdAt: r.created_at
  }));

  const notifications = notifRows.map((r: any) => ({
    id: r.id,
    title: r.title,
    message: r.message,
    type: r.type,
    targetRoles: JSON.parse(r.target_roles || '[]'),
    targetUserId: r.target_user_id || undefined,
    read: Boolean(r.read),
    timestamp: r.timestamp,
    actionType: r.action_type || undefined,
    applicationId: r.application_id || undefined,
    questionPrompt: r.question_prompt || undefined
  }));

  const applications = appRows.map((r: any) => ({
    id: r.id,
    clubId: r.club_id,
    clubName: r.club_name,
    userId: r.user_id,
    applicantName: r.applicant_name,
    studentId: r.student_id,
    department: r.department,
    batch: r.batch,
    email: r.email,
    phone: r.phone,
    roleName: r.role_name,
    applicationType: r.application_type || 'Member',
    status: r.status,
    statementOfPurpose: r.statement_of_purpose,
    skillsInterests: r.skills_interests,
    applicationDate: r.application_date,
    decisionDate: r.decision_date,
    decisionBy: r.decision_by,
    decisionRemarks: r.decision_remarks,
    questionPrompt: r.question_prompt || undefined,
    questionAskedBy: r.question_asked_by || undefined,
    questionDate: r.question_date || undefined,
    studentAnswer: r.student_answer || undefined,
    answerDate: r.answer_date || undefined
  }));

  const registrations = regRows.map((r: any) => ({
    id: r.id,
    eventId: r.event_id,
    eventTitle: r.event_title,
    clubName: r.club_name,
    userId: r.user_id,
    studentId: r.student_id,
    studentName: r.student_name,
    department: r.department,
    email: r.email,
    passCode: r.pass_code,
    registrationDate: r.registration_date,
    status: r.status,
    attended: Boolean(r.attended)
  }));

  const attendance = attRows.map((r: any) => ({
    id: r.id,
    eventId: r.event_id,
    eventTitle: r.event_title,
    userId: r.user_id,
    studentId: r.student_id,
    studentName: r.student_name,
    department: r.department,
    status: r.status,
    markedAt: r.marked_at,
    markedBy: r.marked_by
  }));

  const announcements = ancRows.map((r: any) => ({
    id: r.id,
    clubId: r.club_id,
    clubName: r.club_name,
    title: r.title,
    content: r.content,
    priority: r.priority,
    createdAt: r.created_at,
    createdBy: r.created_by
  }));

  const pendingBookingsCount = bookings.filter((b: any) => b.status === 'Pending').length;
  const pendingAppsCount = applications.filter((a: any) => a.status === 'Pending').length;
  const totalActiveMembers = clubs.reduce((acc: number, c: any) => acc + (c.memberCount || 0), 0);

  const analytics = {
    ...INITIAL_ANALYTICS,
    totalClubs: clubs.length,
    totalActiveMembers: totalActiveMembers || INITIAL_ANALYTICS.totalActiveMembers,
    totalEventsConducted: events.length + 75,
    pendingVenueApprovals: pendingBookingsCount,
    pendingMemberApprovals: pendingAppsCount
  };

  return {
    users,
    clubs,
    events,
    venues,
    bookings,
    notifications,
    applications,
    registrations,
    attendance,
    announcements,
    analytics
  };
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
  initDatabaseTables();
  await seedDatabase();

  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', app: 'BUP-CMS', time: new Date().toISOString() });
  });

  // Quick Instant Login (Default Admin)
  app.post('/api/auth/demo-login', (req, res) => {
    try {
      const { role = 'System_Admin' } = req.body;
      const targetUser = (db.prepare('SELECT * FROM users WHERE role = ? LIMIT 1').get(role) as any)
        || (db.prepare('SELECT * FROM users WHERE email = ? LIMIT 1').get('admin@bup.edu.bd') as any)
        || (db.prepare('SELECT * FROM users LIMIT 1').get() as any);

      if (!targetUser) {
        return res.status(404).json({ error: 'No user accounts found. Please register an account.' });
      }

      const userProfile = buildUserProfile(targetUser);
      const token = createToken({ id: userProfile.id, email: userProfile.email, role: userProfile.role });
      res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7
      });

      const stateSnapshot = loadNormalizedAppState();
      return res.json({ success: true, user: userProfile, state: stateSnapshot });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Login failed' });
    }
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

      // Security: Public registration is strictly restricted to Student or Faculty/Staff.
      // Club Executive, Moderator, and Administrator roles CANNOT be self-declared during signup.
      const allowedRoles = ['Student', 'Faculty_Advisor'];
      const assignedRole = allowedRoles.includes(role) ? role : 'Student';

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
        assignedRole,
        avatarUrl,
        '[]',
        createdAt
      );

      const newUser = {
        id: userId,
        name,
        studentId,
        department,
        batch,
        email,
        role: assignedRole,
        clubMemberships: [],
        avatarUrl
      };

      const token = createToken({ id: userId, email, role: assignedRole });
      res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7
      });

      const stateSnapshot = loadNormalizedAppState();
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

      const stateSnapshot = loadNormalizedAppState();
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
    const stateSnapshot = loadNormalizedAppState();
    return res.json({ state: stateSnapshot });
  });

  // -----------------------------------------------------------------
  // SYSTEM REST ACTIONS WITH DIRECT SQLITE NORMALIZATION & RBAC
  // -----------------------------------------------------------------
  app.post('/api/app-state/update', requireAuth, (req, res) => {
    try {
      const { action, payload } = req.body;
      const currentUserId = req.user.sub;
      const currentUserRow = db.prepare('SELECT * FROM users WHERE id = ?').get(currentUserId) as any;

      if (!currentUserRow) {
        return res.status(404).json({ error: 'Authenticated user not found.' });
      }
      const currentUser = buildUserProfile(currentUserRow);

      switch (action) {
        // --- 1. MEMBERSHIP APPLICATION (Slide 8 MEMBERSHIP lifecycle) ---
        case 'submit-membership-application': {
          const {
            clubId,
            statementOfPurpose,
            skillsInterests,
            phone,
            roleName = 'General Member',
            applicationType = 'Member'
          } = payload || {};
          if (!clubId) {
            return res.status(400).json({ error: 'Club ID is required.' });
          }

          const club = db.prepare('SELECT * FROM clubs WHERE id = ?').get(clubId) as any;
          if (!club) {
            return res.status(404).json({ error: 'Club not found.' });
          }

          // Check if user already has an active or pending membership
          const existingApp = db.prepare(`
            SELECT * FROM membership_applications 
            WHERE club_id = ? AND user_id = ? AND status = 'Pending'
          `).get(clubId, currentUserId) as any;

          if (existingApp) {
            return res.status(400).json({ error: 'You already have a pending application for this club.' });
          }

          const appId = `APP-${Date.now().toString().slice(-6)}`;
          const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

          db.prepare(`
            INSERT INTO membership_applications (
              id, club_id, club_name, user_id, applicant_name, student_id, department, batch, email, phone, role_name, application_type, status, statement_of_purpose, skills_interests, application_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?)
          `).run(
            appId,
            club.id,
            club.name,
            currentUserId,
            currentUser.name,
            currentUser.studentId,
            currentUser.department,
            currentUser.batch,
            currentUser.email,
            phone || '',
            roleName,
            applicationType,
            statementOfPurpose || 'Eager to contribute and learn.',
            skillsInterests || 'General Interest',
            nowStr
          );

          // Emit notification for Club Executives & System Admins
          const isExecApp = applicationType === 'Executive' || applicationType === 'Moderator';
          db.prepare(`
            INSERT INTO notifications (id, title, message, type, target_roles, timestamp)
            VALUES (?, ?, ?, 'Approval', ?, ?)
          `).run(
            `NT-${Date.now()}`,
            isExecApp ? `👑 Executive Candidacy: ${club.name}` : `New Application: ${club.name}`,
            isExecApp
              ? `${currentUser.name} (${currentUser.studentId}) applied for "${roleName}" (Executive / Moderator) of ${club.name}.`
              : `${currentUser.name} (${currentUser.studentId}) submitted a membership application for ${club.name}.`,
            JSON.stringify(['Club_Exec', 'Faculty_Advisor', 'System_Admin']),
            nowStr
          );

          // Confirmation notification for applicant
          db.prepare(`
            INSERT INTO notifications (id, title, message, type, target_roles, target_user_id, timestamp)
            VALUES (?, ?, ?, 'System', ?, ?, ?)
          `).run(
            `NT-${Date.now() + 1}`,
            isExecApp ? 'Executive Board Application Submitted' : 'Application Submitted Successfully',
            isExecApp
              ? `Your application for "${roleName}" of ${club.name} has been received and is awaiting committee and governance review.`
              : `Your membership application for ${club.name} has been received and is currently under review by the executive committee.`,
            JSON.stringify(['Student', 'Club_Exec']),
            currentUserId,
            nowStr
          );

          const stateSnapshot = loadNormalizedAppState();
          return res.json({ success: true, message: 'Application submitted for executive review.', state: stateSnapshot });
        }

        // --- 2. EXECUTIVE APPLICATION REVIEW (Approve / Reject) ---
        case 'review-membership-application': {
          const { applicationId, status, remarks } = payload || {};
          if (!applicationId || !['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ error: 'Valid applicationId and decision status (Approved/Rejected) required.' });
          }

          const appRow = db.prepare('SELECT * FROM membership_applications WHERE id = ?').get(applicationId) as any;
          if (!appRow) {
            return res.status(404).json({ error: 'Membership application not found.' });
          }

          // Enforce club moderator authorization
          const isSystemAdmin = currentUser.role === 'System_Admin';
          const memberships = Array.isArray(currentUser.clubMemberships) ? currentUser.clubMemberships : [];
          const isClubModerator = memberships.some((m: any) => m.clubId === appRow.club_id && m.status === 'Active');

          if (!isSystemAdmin && !isClubModerator) {
            return res.status(403).json({
              error: `Access Denied: Only designated moderators of ${appRow.club_name} or System Administrators can decide on this application.`
            });
          }

          // Enforce one-time final decision (applications cannot be modified once Approved or Rejected)
          if (appRow.status === 'Approved' || appRow.status === 'Rejected') {
            return res.status(400).json({
              error: `Final Decision Already Rendered: This application was already ${appRow.status.toLowerCase()} on ${appRow.decision_date || 'earlier'} by ${appRow.decision_by || 'the committee'} and is permanent.`
            });
          }

          const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
          const reviewerTitle = `${currentUser.name} (${currentUser.role.replace('_', ' ')})`;

          db.prepare(`
            UPDATE membership_applications 
            SET status = ?, decision_date = ?, decision_by = ?, decision_remarks = ?
            WHERE id = ?
          `).run(status, nowStr, reviewerTitle, remarks || '', applicationId);

          if (status === 'Approved') {
            // Update club member_count
            db.prepare('UPDATE clubs SET member_count = member_count + 1 WHERE id = ?').run(appRow.club_id);

            const applicantRow = db.prepare('SELECT id, name, role, avatar_url, club_memberships FROM users WHERE id = ?').get(appRow.user_id) as any;
            const isExecutiveCandidate =
              appRow.application_type === 'Executive' ||
              appRow.application_type === 'Moderator' ||
              /executive|moderator|president|secretary|treasurer|lead/i.test(appRow.role_name);

            if (isExecutiveCandidate) {
              // 1. Induct applicant into club's executives roster
              const clubRow = db.prepare('SELECT executives FROM clubs WHERE id = ?').get(appRow.club_id) as any;
              if (clubRow) {
                const currentExecs = JSON.parse(clubRow.executives || '[]');
                const filteredExecs = currentExecs.filter((e: any) => e.studentId !== appRow.student_id);
                filteredExecs.push({
                  name: appRow.applicant_name,
                  designation: appRow.role_name || 'Executive Member',
                  studentId: appRow.student_id,
                  avatar: applicantRow?.avatar_url || `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(appRow.applicant_name)}`
                });
                db.prepare('UPDATE clubs SET executives = ? WHERE id = ?').run(JSON.stringify(filteredExecs), appRow.club_id);
              }

              // 2. Elevate user role in users table to Club_Exec if currently Student
              if (applicantRow && applicantRow.role === 'Student') {
                db.prepare("UPDATE users SET role = 'Club_Exec' WHERE id = ?").run(appRow.user_id);
              }

              // 3. Update club_memberships with Executive designation
              if (applicantRow) {
                let currentMemberships = JSON.parse(applicantRow.club_memberships || '[]');
                currentMemberships = currentMemberships.filter((m: any) => m.clubId !== appRow.club_id);
                currentMemberships.push({
                  clubId: appRow.club_id,
                  roleName: appRow.role_name || 'Executive Member',
                  status: 'Active'
                });
                db.prepare('UPDATE users SET club_memberships = ? WHERE id = ?').run(
                  JSON.stringify(currentMemberships),
                  appRow.user_id
                );
              }

              // 4. Executive Appointment Notification
              db.prepare(`
                INSERT INTO notifications (id, title, message, type, target_roles, target_user_id, timestamp, action_type, application_id)
                VALUES (?, ?, ?, 'Approval', ?, ?, ?, ?, ?)
              `).run(
                `NT-${Date.now()}`,
                `👑 Executive Appointment Approved! 🎉`,
                `Congratulations! You have been officially approved and appointed as "${appRow.role_name}" of "${appRow.club_name}". You now have full executive and moderation powers for this club.`,
                JSON.stringify(['Student', 'Club_Exec']),
                appRow.user_id,
                nowStr,
                'view_application',
                applicationId
              );
            } else {
              // Standard Member Addition
              if (applicantRow) {
                const currentMemberships = JSON.parse(applicantRow.club_memberships || '[]');
                const exists = currentMemberships.some((m: any) => m.clubId === appRow.club_id);
                if (!exists) {
                  currentMemberships.push({
                    clubId: appRow.club_id,
                    roleName: appRow.role_name || 'General Member',
                    status: 'Active'
                  });
                  db.prepare('UPDATE users SET club_memberships = ? WHERE id = ?').run(
                    JSON.stringify(currentMemberships),
                    appRow.user_id
                  );
                }
              }

              // Standard Member Notification
              db.prepare(`
                INSERT INTO notifications (id, title, message, type, target_roles, target_user_id, timestamp, action_type, application_id)
                VALUES (?, ?, ?, 'Approval', ?, ?, ?, ?, ?)
              `).run(
                `NT-${Date.now()}`,
                `Membership Approved! 🎉`,
                `Congratulations! Your application to join "${appRow.club_name}" has been accepted. ${remarks ? 'Note: ' + remarks : ''}`,
                JSON.stringify(['Student', 'Club_Exec']),
                appRow.user_id,
                nowStr,
                'view_application',
                applicationId
              );
            }
          } else {
            // Rejected notification
            db.prepare(`
              INSERT INTO notifications (id, title, message, type, target_roles, target_user_id, timestamp, action_type, application_id)
              VALUES (?, ?, ?, 'System', ?, ?, ?, ?, ?)
            `).run(
              `NT-${Date.now()}`,
              `Application Update: ${appRow.club_name}`,
              `Your application for ${appRow.club_name} was not approved at this time. ${remarks ? 'Feedback: ' + remarks : ''}`,
              JSON.stringify(['Student', 'Club_Exec']),
              appRow.user_id,
              nowStr,
              'view_application',
              applicationId
            );
          }

          const stateSnapshot = loadNormalizedAppState();
          return res.json({ success: true, message: `Application ${status.toLowerCase()} successfully.`, state: stateSnapshot });
        }

        // --- 2b. MODERATOR ASKS Q&A / CLARIFICATION FROM APPLICANT ---
        case 'request-membership-info': {
          const { applicationId, question } = payload || {};
          if (!applicationId || !question?.trim()) {
            return res.status(400).json({ error: 'Application ID and clarification question are required.' });
          }

          const appRow = db.prepare('SELECT * FROM membership_applications WHERE id = ?').get(applicationId) as any;
          if (!appRow) {
            return res.status(404).json({ error: 'Membership application not found.' });
          }

          const isSystemAdmin = currentUser.role === 'System_Admin';
          const memberships = Array.isArray(currentUser.clubMemberships) ? currentUser.clubMemberships : [];
          const isClubModerator = memberships.some((m: any) => m.clubId === appRow.club_id && m.status === 'Active');

          if (!isSystemAdmin && !isClubModerator) {
            return res.status(403).json({
              error: `Only designated moderators of ${appRow.club_name} can request clarification from applicants.`
            });
          }

          if (appRow.status === 'Approved' || appRow.status === 'Rejected') {
            return res.status(400).json({
              error: `Cannot request clarification: this application already received a final decision (${appRow.status}).`
            });
          }

          const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
          const moderatorTitle = `${currentUser.name} (${currentUser.role.replace('_', ' ')})`;

          db.prepare(`
            UPDATE membership_applications 
            SET status = 'Action Required',
                question_prompt = ?,
                question_asked_by = ?,
                question_date = ?,
                student_answer = NULL,
                answer_date = NULL,
                decision_remarks = ?
            WHERE id = ?
          `).run(question.trim(), moderatorTitle, nowStr, `Clarification requested: ${question.trim()}`, applicationId);

          // Dispatch interactive notification to applicant student
          db.prepare(`
            INSERT INTO notifications (id, title, message, type, target_roles, target_user_id, timestamp, action_type, application_id, question_prompt)
            VALUES (?, ?, ?, 'Action_Required', ?, ?, ?, ?, ?, ?)
          `).run(
            `NT-${Date.now()}`,
            `Inquiry from ${appRow.club_name} Moderator 💬`,
            `The moderator for ${appRow.club_name} has requested clarification on your application: "${question.trim()}". Please reply to proceed.`,
            JSON.stringify(['Student', 'Club_Exec']),
            appRow.user_id,
            nowStr,
            'qna_reply',
            applicationId,
            question.trim()
          );

          const stateSnapshot = loadNormalizedAppState();
          return res.json({
            success: true,
            message: `Clarification request sent to ${appRow.applicant_name}. Notification dispatched.`,
            state: stateSnapshot
          });
        }

        // --- 2c. APPLICANT REPLIES TO MODERATOR Q&A ---
        case 'respond-membership-qna': {
          const { applicationId, answer } = payload || {};
          if (!applicationId || !answer?.trim()) {
            return res.status(400).json({ error: 'Application ID and answer content are required.' });
          }

          const appRow = db.prepare('SELECT * FROM membership_applications WHERE id = ?').get(applicationId) as any;
          if (!appRow) {
            return res.status(404).json({ error: 'Membership application not found.' });
          }

          // Verify ownership or system admin
          if (currentUser.id !== appRow.user_id && currentUser.studentId !== appRow.student_id && currentUser.role !== 'System_Admin') {
            return res.status(403).json({ error: 'You are only authorized to answer inquiries for your own application.' });
          }

          const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

          db.prepare(`
            UPDATE membership_applications 
            SET status = 'Pending',
                student_answer = ?,
                answer_date = ?,
                decision_remarks = ?
            WHERE id = ?
          `).run(answer.trim(), nowStr, `Applicant provided clarification: "${answer.trim()}" (Awaiting moderator review)`, applicationId);

          // Notify club executives and moderator that the student has answered
          db.prepare(`
            INSERT INTO notifications (id, title, message, type, target_roles, timestamp, action_type, application_id)
            VALUES (?, ?, ?, 'Approval', ?, ?, ?, ?)
          `).run(
            `NT-${Date.now()}`,
            `Clarification Received: ${appRow.applicant_name} (${appRow.club_name})`,
            `${appRow.applicant_name} responded to the moderator question: "${answer.trim()}". The application is ready for final decision.`,
            JSON.stringify(['Club_Exec', 'Faculty_Advisor', 'System_Admin']),
            nowStr,
            'view_application',
            applicationId
          );

          const stateSnapshot = loadNormalizedAppState();
          return res.json({
            success: true,
            message: 'Your response was submitted to the club moderator.',
            state: stateSnapshot
          });
        }

        // --- 3. LEAVE CLUB ---
        case 'leave-club': {
          const clubId = payload?.clubId;
          if (!clubId) {
            return res.status(400).json({ error: 'A club id is required.' });
          }

          db.prepare('UPDATE clubs SET member_count = MAX(0, member_count - 1) WHERE id = ?').run(clubId);

          const applicantRow = db.prepare('SELECT club_memberships FROM users WHERE id = ?').get(currentUserId) as any;
          if (applicantRow) {
            const memberships = JSON.parse(applicantRow.club_memberships || '[]').filter((m: any) => m.clubId !== clubId);
            db.prepare('UPDATE users SET club_memberships = ? WHERE id = ?').run(JSON.stringify(memberships), currentUserId);
          }

          const stateSnapshot = loadNormalizedAppState();
          return res.json({ success: true, message: 'Membership removed.', state: stateSnapshot });
        }

        // --- 3b. DIRECT APPOINT CLUB EXECUTIVE / MODERATOR ---
        case 'appoint-club-executive': {
          const isSystemAdmin = currentUser.role === 'System_Admin';
          const memberships = Array.isArray(currentUser.clubMemberships) ? currentUser.clubMemberships : [];
          const isClubMod = memberships.some((m: any) => m.clubId === payload?.clubId && m.status === 'Active');

          if (!isSystemAdmin && !isClubMod) {
            return res.status(403).json({ error: 'Only System Administrators or club executives can appoint new executives.' });
          }

          const { clubId, targetUserId, studentId, designation = 'Executive Member' } = payload || {};
          if (!clubId || (!targetUserId && !studentId)) {
            return res.status(400).json({ error: 'Club ID and target user are required.' });
          }

          const club = db.prepare('SELECT * FROM clubs WHERE id = ?').get(clubId) as any;
          if (!club) return res.status(404).json({ error: 'Club not found.' });

          const targetUser = (targetUserId ? db.prepare('SELECT * FROM users WHERE id = ?').get(targetUserId) : null)
            || (studentId ? db.prepare('SELECT * FROM users WHERE student_id = ?').get(studentId) : null) as any;
          if (!targetUser) return res.status(404).json({ error: 'Target student or user account not found.' });

          // Update club's executives roster
          const execs = JSON.parse(club.executives || '[]');
          const filtered = execs.filter((e: any) => e.studentId !== targetUser.student_id);
          filtered.push({
            name: targetUser.name,
            designation,
            studentId: targetUser.student_id,
            avatar: targetUser.avatar_url || `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(targetUser.name)}`
          });
          db.prepare('UPDATE clubs SET executives = ? WHERE id = ?').run(JSON.stringify(filtered), clubId);

          // Elevate user role if Student
          if (targetUser.role === 'Student') {
            db.prepare("UPDATE users SET role = 'Club_Exec' WHERE id = ?").run(targetUser.id);
          }

          // Update club_memberships
          let userMemberships = JSON.parse(targetUser.club_memberships || '[]');
          userMemberships = userMemberships.filter((m: any) => m.clubId !== clubId);
          userMemberships.push({
            clubId,
            roleName: designation,
            status: 'Active'
          });
          db.prepare('UPDATE users SET club_memberships = ? WHERE id = ?').run(JSON.stringify(userMemberships), targetUser.id);

          // Send notification
          const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
          db.prepare(`
            INSERT INTO notifications (id, title, message, type, target_roles, target_user_id, timestamp)
            VALUES (?, ?, ?, 'Approval', ?, ?, ?)
          `).run(
            `NT-${Date.now()}`,
            `👑 Executive Appointment: ${club.name}`,
            `You have been officially appointed as "${designation}" of ${club.name}. Moderation permissions are now active.`,
            JSON.stringify(['Student', 'Club_Exec']),
            targetUser.id,
            nowStr
          );

          const stateSnapshot = loadNormalizedAppState();
          return res.json({ success: true, message: `Successfully appointed ${targetUser.name} as ${designation}.`, state: stateSnapshot });
        }

        // --- 3c. DIRECT REMOVE CLUB EXECUTIVE ---
        case 'remove-club-executive': {
          if (currentUser.role !== 'System_Admin') {
            return res.status(403).json({ error: 'Only System Administrators can remove club executives.' });
          }

          const { clubId, studentId } = payload || {};
          if (!clubId || !studentId) {
            return res.status(400).json({ error: 'Club ID and student ID are required.' });
          }

          const club = db.prepare('SELECT * FROM clubs WHERE id = ?').get(clubId) as any;
          if (!club) return res.status(404).json({ error: 'Club not found.' });

          const execs = JSON.parse(club.executives || '[]');
          const filtered = execs.filter((e: any) => e.studentId !== studentId);
          db.prepare('UPDATE clubs SET executives = ? WHERE id = ?').run(JSON.stringify(filtered), clubId);

          // Downgrade membership role if applicable
          const targetUser = db.prepare('SELECT * FROM users WHERE student_id = ?').get(studentId) as any;
          if (targetUser) {
            let userMemberships = JSON.parse(targetUser.club_memberships || '[]');
            userMemberships = userMemberships.map((m: any) => {
              if (m.clubId === clubId) {
                return { ...m, roleName: 'General Member' };
              }
              return m;
            });
            db.prepare('UPDATE users SET club_memberships = ? WHERE id = ?').run(JSON.stringify(userMemberships), targetUser.id);
          }

          const stateSnapshot = loadNormalizedAppState();
          return res.json({ success: true, message: 'Executive removed successfully.', state: stateSnapshot });
        }

        // --- 4. RSVP / PASS REGISTRATION ---
        case 'rsvp': {
          const eventId = payload?.eventId;
          if (!eventId) {
            return res.status(400).json({ error: 'An event id is required.' });
          }

          const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId) as any;
          if (!event) {
            return res.status(404).json({ error: 'Event not found.' });
          }

          const registeredIds: string[] = JSON.parse(event.registered_user_ids || '[]');
          if (registeredIds.includes(currentUserId)) {
            return res.status(400).json({ error: 'You are already registered for this event.' });
          }

          if (event.registered_count >= event.max_seats) {
            return res.status(400).json({ error: 'This event has reached full capacity.' });
          }

          registeredIds.push(currentUserId);
          const newCount = event.registered_count + 1;

          db.prepare(`
            UPDATE events 
            SET registered_count = ?, registered_user_ids = ?
            WHERE id = ?
          `).run(newCount, JSON.stringify(registeredIds), eventId);

          const passCode = `BUP-${event.category.toUpperCase().slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`;
          const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

          db.prepare(`
            INSERT INTO event_registrations (
              id, event_id, event_title, club_name, user_id, student_id, student_name, department, email, pass_code, registration_date, status, attended
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed', 0)
          `).run(
            `REG-${Date.now().toString().slice(-6)}`,
            event.id,
            event.title,
            event.club_name,
            currentUserId,
            currentUser.studentId,
            currentUser.name,
            currentUser.department,
            currentUser.email,
            passCode,
            nowStr
          );

          // Confirmation notification
          db.prepare(`
            INSERT INTO notifications (id, title, message, type, target_roles, target_user_id, timestamp)
            VALUES (?, ?, ?, 'Event', ?, ?, ?)
          `).run(
            `NT-${Date.now()}`,
            'RSVP Confirmed & Pass Issued! 🎟️',
            `Your seat for "${event.title}" is confirmed. Pass Code: ${passCode}. Present your QR digital pass at check-in.`,
            JSON.stringify(['Student']),
            currentUserId,
            nowStr
          );

          const stateSnapshot = loadNormalizedAppState();
          return res.json({ success: true, message: 'Event registration confirmed with digital pass.', state: stateSnapshot });
        }

        // --- 5. LIVE ATTENDANCE CHECK-IN (Slide 7 & 13) ---
        case 'record-attendance': {
          const { eventId, studentId, passCode } = payload || {};
          if (!eventId || (!studentId && !passCode)) {
            return res.status(400).json({ error: 'Event ID and either Student ID or Pass Code is required.' });
          }

          const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId) as any;
          if (!event) {
            return res.status(404).json({ error: 'Event not found.' });
          }

          // Locate registration
          let reg = null;
          if (passCode) {
            reg = db.prepare('SELECT * FROM event_registrations WHERE event_id = ? AND pass_code = ?').get(eventId, passCode) as any;
          } else if (studentId) {
            reg = db.prepare('SELECT * FROM event_registrations WHERE event_id = ? AND student_id = ?').get(eventId, studentId) as any;
          }

          const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
          const usherName = `${currentUser.name} (${currentUser.role.replace('_', ' ')})`;

          let attendeeUserId = reg ? reg.user_id : `EXT-${Date.now()}`;
          let attendeeName = reg ? reg.student_name : `Student (${studentId || 'Walk-in'})`;
          let attendeeStudentId = reg ? reg.student_id : studentId;
          let attendeeDept = reg ? reg.department : 'Undergraduate';

          // Insert or update attendance record
          const existingAtt = db.prepare('SELECT id FROM attendance WHERE event_id = ? AND student_id = ?').get(eventId, attendeeStudentId);
          if (existingAtt) {
            return res.status(400).json({ error: `Attendance already recorded for ${attendeeName} (${attendeeStudentId}).` });
          }

          const attId = `ATT-${Date.now().toString().slice(-6)}`;
          db.prepare(`
            INSERT INTO attendance (id, event_id, event_title, user_id, student_id, student_name, department, status, marked_at, marked_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Present', ?, ?)
          `).run(attId, eventId, event.title, attendeeUserId, attendeeStudentId, attendeeName, attendeeDept, nowStr, usherName);

          // Update attendeeUserIds in events table
          const attendeeIds: string[] = JSON.parse(event.attendee_user_ids || '[]');
          if (!attendeeIds.includes(attendeeUserId)) {
            attendeeIds.push(attendeeUserId);
            db.prepare('UPDATE events SET attendee_user_ids = ? WHERE id = ?').run(JSON.stringify(attendeeIds), eventId);
          }

          // Mark registration as attended
          if (reg) {
            db.prepare('UPDATE event_registrations SET attended = 1 WHERE id = ?').run(reg.id);
          }

          const stateSnapshot = loadNormalizedAppState();
          return res.json({
            success: true,
            message: `Attendance verified & logged for ${attendeeName} (${attendeeStudentId}).`,
            record: { studentName: attendeeName, studentId: attendeeStudentId, markedAt: nowStr },
            state: stateSnapshot
          });
        }

        // --- 6. CREATE EVENT (System Admin & Club Executives) ---
        case 'create-event': {
          const newEventData = payload || {};
          const isSystemAdmin = currentUser.role === 'System_Admin';
          const memberships = Array.isArray(currentUser.clubMemberships) ? currentUser.clubMemberships : [];
          const isClubExec = memberships.some((m: any) => m.clubId === newEventData.clubId && m.status === 'Active');
          const isAdvisor = currentUser.role === 'Faculty_Advisor';

          if (!isSystemAdmin && !isClubExec && !isAdvisor) {
            return res.status(403).json({
              error: 'Access Denied: Only System Administrators or designated Club Executives can publish events.'
            });
          }

          const targetClub = db.prepare('SELECT * FROM clubs WHERE id = ?').get(newEventData.clubId) as any;
          const clubName = targetClub?.name || newEventData.clubName || 'BUP Society';
          const clubLogo = targetClub?.logo_url || newEventData.clubLogo || '';

          const eventId = `EVT-${Date.now().toString().slice(-6)}`;
          const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

          db.prepare(`
            INSERT INTO events (
              id, club_id, club_name, club_logo, title, category, description, poster_url, date, start_time, end_time, venue_id, venue_name, max_seats, registered_count, status, is_rsvp_allowed, registered_user_ids, attendee_user_ids, registration_deadline, contact_person, organizing_team, required_equipment
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'Upcoming', 1, ?, '[]', ?, ?, ?, ?)
          `).run(
            eventId,
            newEventData.clubId || (targetClub ? targetClub.id : 'CLUB-01'),
            clubName,
            clubLogo,
            newEventData.title || 'Untitled Event',
            newEventData.category || 'Workshop',
            newEventData.description || 'Campus Event',
            newEventData.posterUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
            newEventData.date || '2026-08-25',
            newEventData.startTime || '10:00',
            newEventData.endTime || '12:00',
            newEventData.venueId || 'VEN-01',
            newEventData.venueName || 'BUP Multipurpose Hall',
            Number(newEventData.maxSeats) || 100,
            JSON.stringify([currentUserId]),
            newEventData.registrationDeadline || newEventData.date || '2026-08-24',
            newEventData.contactPerson || currentUser.name,
            newEventData.organizingTeam || `${clubName} Executive Team`,
            JSON.stringify(newEventData.requiredEquipment || ['Projector', 'PA System'])
          );

          // Update featured events count for club
          if (newEventData.clubId) {
            db.prepare('UPDATE clubs SET featured_events_count = featured_events_count + 1 WHERE id = ?').run(newEventData.clubId);
          }

          // Broadcast notification to students
          db.prepare(`
            INSERT INTO notifications (id, title, message, type, target_roles, timestamp)
            VALUES (?, ?, ?, 'Event', ?, ?)
          `).run(
            `NT-${Date.now()}`,
            `New Event: ${newEventData.title}`,
            `${clubName} published a new event "${newEventData.title}". RSVPs are now open!`,
            JSON.stringify(['Student']),
            nowStr
          );

          const stateSnapshot = loadNormalizedAppState();
          return res.json({ success: true, message: 'New event published on campus calendar.', state: stateSnapshot });
        }

        // --- 6b. DELETE EVENT (System Admin & Club Executives) ---
        case 'delete-event': {
          const { eventId } = payload || {};
          if (!eventId) {
            return res.status(400).json({ error: 'Event ID is required to remove an event.' });
          }

          const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId) as any;
          if (!event) {
            return res.status(404).json({ error: 'Event not found.' });
          }

          const isSystemAdmin = currentUser.role === 'System_Admin';
          const memberships = Array.isArray(currentUser.clubMemberships) ? currentUser.clubMemberships : [];
          const isClubExec = memberships.some((m: any) => m.clubId === event.club_id && m.status === 'Active');
          const isAdvisor = currentUser.role === 'Faculty_Advisor';

          if (!isSystemAdmin && !isClubExec && !isAdvisor) {
            return res.status(403).json({
              error: 'Access Denied: Only System Administrators or authorized club executives can delete events.'
            });
          }

          // Cascade delete registrations, attendance, and venue bookings for this event
          db.prepare('DELETE FROM event_registrations WHERE event_id = ?').run(eventId);
          db.prepare('DELETE FROM attendance WHERE event_id = ?').run(eventId);
          db.prepare('DELETE FROM venue_bookings WHERE event_id = ?').run(eventId);

          // Delete event record
          db.prepare('DELETE FROM events WHERE id = ?').run(eventId);

          // Decrement featured_events_count in clubs table
          db.prepare(`
            UPDATE clubs 
            SET featured_events_count = CASE WHEN featured_events_count > 0 THEN featured_events_count - 1 ELSE 0 END 
            WHERE id = ?
          `).run(event.club_id);

          const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

          // Broadcast cancellation notification
          db.prepare(`
            INSERT INTO notifications (id, title, message, type, target_roles, timestamp)
            VALUES (?, ?, ?, 'Event', ?, ?)
          `).run(
            `NT-${Date.now()}`,
            `Event Cancelled: ${event.title}`,
            `The event "${event.title}" hosted by ${event.club_name} has been cancelled and removed from the campus calendar by ${currentUser.name}.`,
            JSON.stringify(['Student', 'Club_Exec', 'Faculty_Advisor']),
            nowStr
          );

          const stateSnapshot = loadNormalizedAppState();
          return res.json({ success: true, message: `Event "${event.title}" removed successfully.`, state: stateSnapshot });
        }

        // --- 7. NEW VENUE & RESOURCE BOOKING ---
        case 'new-booking': {
          const b = payload || {};
          const bookingId = `BK-${Math.floor(100 + Math.random() * 900)}`;
          const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

          db.prepare(`
            INSERT INTO venue_bookings (
              id, event_id, event_title, club_id, club_name, venue_id, venue_name, booking_date, start_time, end_time, expected_attendance, requested_equipment, purpose, status, conflict_detected, conflict_reason, submitted_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 0, NULL, ?, ?)
          `).run(
            bookingId,
            b.eventId || null,
            b.eventTitle || 'Official Club Meeting',
            b.clubId || 'CLUB-01',
            b.clubName || 'BUP Club',
            b.venueId || 'VEN-01',
            b.venueName || 'BUP Multipurpose Hall',
            b.bookingDate || '2026-08-25',
            b.startTime || '10:00',
            b.endTime || '12:00',
            Number(b.expectedAttendance) || 50,
            JSON.stringify(b.requestedEquipment || ['PA System', 'Projector & Screen']),
            b.purpose || 'Official Club Activity',
            `${currentUser.name} (${currentUser.role.replace('_', ' ')})`,
            nowStr
          );

          // Notify Venue Admins
          db.prepare(`
            INSERT INTO notifications (id, title, message, type, target_roles, timestamp)
            VALUES (?, ?, ?, 'Approval', ?, ?)
          `).run(
            `NT-${Date.now()}`,
            'New Venue Reservation Request',
            `${b.clubName || 'A club'} requested ${b.venueName} for "${b.eventTitle}" on ${b.bookingDate}. Review queue updated.`,
            JSON.stringify(['Venue_Admin', 'Faculty_Advisor', 'System_Admin']),
            nowStr
          );

          const stateSnapshot = loadNormalizedAppState();
          return res.json({ success: true, message: 'Venue reservation request submitted for administrative review.', state: stateSnapshot });
        }

        // --- 8. UPDATE BOOKING STATUS ---
        case 'update-booking-status': {
          const { bookingId, status } = payload || {};
          const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
          const reviewerName = `${currentUser.name} (${currentUser.role.replace('_', ' ')})`;

          db.prepare(`
            UPDATE venue_bookings 
            SET status = ?, reviewed_by = ?, decision_date = ?
            WHERE id = ?
          `).run(status, reviewerName, nowStr, bookingId);

          const booking = db.prepare('SELECT * FROM venue_bookings WHERE id = ?').get(bookingId) as any;

          // Emit notification for club executives
          if (booking) {
            db.prepare(`
              INSERT INTO notifications (id, title, message, type, target_roles, timestamp)
              VALUES (?, ?, ?, 'Approval', ?, ?)
            `).run(
              `NT-${Date.now()}`,
              `Venue Request ${status}: ${booking.venue_name}`,
              `Reservation for "${booking.event_title}" on ${booking.booking_date} has been marked ${status} by ${currentUser.name}.`,
              JSON.stringify(['Club_Exec', 'Faculty_Advisor']),
              nowStr
            );
          }

          const stateSnapshot = loadNormalizedAppState();
          return res.json({ success: true, message: `Booking status updated to ${status}.`, state: stateSnapshot });
        }

        // --- 9. CLUB ANNOUNCEMENTS ---
        case 'create-announcement': {
          const { clubId, title, content, priority = 'Normal' } = payload || {};
          if (!clubId || !title || !content) {
            return res.status(400).json({ error: 'Club ID, title, and content are required.' });
          }

          const club = db.prepare('SELECT name FROM clubs WHERE id = ?').get(clubId) as any;
          const clubName = club?.name || 'BUP Society';
          const ancId = `ANC-${Date.now().toString().slice(-6)}`;
          const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

          db.prepare(`
            INSERT INTO announcements (id, club_id, club_name, title, content, priority, created_at, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(ancId, clubId, clubName, title, content, priority, nowStr, currentUser.name);

          // Broadcast notification to all students and members
          db.prepare(`
            INSERT INTO notifications (id, title, message, type, target_roles, timestamp)
            VALUES (?, ?, ?, 'System', ?, ?)
          `).run(
            `NT-${Date.now()}`,
            `Announcement: ${clubName}`,
            `[${priority.toUpperCase()}] ${title}: ${content.slice(0, 100)}...`,
            JSON.stringify(['Student', 'Club_Exec']),
            nowStr
          );

          const stateSnapshot = loadNormalizedAppState();
          return res.json({ success: true, message: 'Announcement broadcasted to members.', state: stateSnapshot });
        }

        // --- 10. NOTIFICATIONS READ/CLEAR ---
        case 'mark-notification-read': {
          const notificationId = payload?.id;
          if (notificationId) {
            db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(notificationId);
          }
          const stateSnapshot = loadNormalizedAppState();
          return res.json({ success: true, state: stateSnapshot });
        }

        case 'clear-notifications': {
          db.prepare('UPDATE notifications SET read = 1').run();
          const stateSnapshot = loadNormalizedAppState();
          return res.json({ success: true, state: stateSnapshot });
        }

        // --- 11. CREATE CLUB (System Admin Privilege) ---
        case 'create-club': {
          if (currentUser.role !== 'System_Admin') {
            return res.status(403).json({ error: 'Access Denied: Only System Administrators can charter new clubs & societies.' });
          }

          const {
            code,
            name,
            category = 'Academic',
            department = 'BUP General',
            foundingYear = new Date().getFullYear(),
            logoUrl,
            bannerUrl,
            tagline,
            description,
            facultyAdvisor,
            budgetAllocated = 50000,
            recruitmentOpen = true,
            recruitmentDeadline,
            membershipRequirements,
            objectives,
            achievements
          } = payload || {};

          if (!name || !code) {
            return res.status(400).json({ error: 'Society name and unique code are required.' });
          }

          const cleanCode = String(code).trim().toUpperCase();
          const cleanName = String(name).trim();

          const existingClub = db.prepare('SELECT id FROM clubs WHERE code = ? OR LOWER(name) = LOWER(?)').get(cleanCode, cleanName);
          if (existingClub) {
            return res.status(409).json({ error: `A society with code "${cleanCode}" or name "${cleanName}" already exists.` });
          }

          const clubId = `CLUB-${cleanCode.replace(/[^A-Z0-9]/g, '') || Date.now().toString().slice(-4)}`;
          const defaultLogo = logoUrl?.trim() || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanCode)}`;
          const defaultBanner = bannerUrl?.trim() || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80';
          const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

          const facultyAdvisorObj = facultyAdvisor || {
            name: 'Faculty Advisor',
            designation: `Advisor, ${department}`,
            email: `advisor.${cleanCode.toLowerCase()}@bup.edu.bd`
          };

          db.prepare(`
            INSERT INTO clubs (
              id, code, name, category, department, founding_year, logo_url, banner_url, tagline, description, faculty_advisor, executives, member_count, featured_events_count, budget_allocated, status, recruitment_open, recruitment_deadline, membership_requirements, objectives, achievements
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', 0, 0, ?, 'Active', ?, ?, ?, ?, ?)
          `).run(
            clubId,
            cleanCode,
            cleanName,
            category,
            department,
            Number(foundingYear) || new Date().getFullYear(),
            defaultLogo,
            defaultBanner,
            tagline || `${cleanName} at Bangladesh University of Professionals`,
            description || `${cleanName} provides students with opportunities for leadership, skills enrichment, and campus community engagement.`,
            JSON.stringify(facultyAdvisorObj),
            Number(budgetAllocated) || 0,
            recruitmentOpen ? 1 : 0,
            recruitmentDeadline || null,
            JSON.stringify(Array.isArray(membershipRequirements) ? membershipRequirements : ['Enrolled BUP Student', 'Commitment to club activities']),
            JSON.stringify(Array.isArray(objectives) ? objectives : [`Foster excellence in ${category}`, 'Host premier campus events', 'Skill building workshops']),
            JSON.stringify(Array.isArray(achievements) ? achievements : ['Chartered by BUP Student Affairs'])
          );

          // Broadcast notification to all students and faculty
          db.prepare(`
            INSERT INTO notifications (id, title, message, type, target_roles, timestamp)
            VALUES (?, ?, ?, 'System', ?, ?)
          `).run(
            `NT-${Date.now()}`,
            `🎉 New Society Chartered: ${cleanName}`,
            `System Administration has chartered "${cleanName}" (${cleanCode}) under ${department}. Recruitment is now active.`,
            JSON.stringify(['Student', 'Club_Exec', 'Faculty_Advisor', 'System_Admin']),
            nowStr
          );

          const stateSnapshot = loadNormalizedAppState();
          return res.json({ success: true, message: `Society "${cleanName}" created successfully!`, state: stateSnapshot });
        }

        // --- 12. DELETE CLUB (System Admin Privilege) ---
        case 'delete-club': {
          if (currentUser.role !== 'System_Admin') {
            return res.status(403).json({ error: 'Access Denied: Only System Administrators can dissolve or remove clubs.' });
          }

          const { clubId } = payload || {};
          if (!clubId) {
            return res.status(400).json({ error: 'Club ID is required to remove a club.' });
          }

          const club = db.prepare('SELECT * FROM clubs WHERE id = ?').get(clubId) as any;
          if (!club) {
            return res.status(404).json({ error: 'Society not found.' });
          }

          // 1. Cascade delete all events and their registrations & attendance
          const clubEvents = db.prepare('SELECT id FROM events WHERE club_id = ?').all(clubId) as any[];
          for (const evt of clubEvents) {
            db.prepare('DELETE FROM event_registrations WHERE event_id = ?').run(evt.id);
            db.prepare('DELETE FROM attendance WHERE event_id = ?').run(evt.id);
          }
          db.prepare('DELETE FROM events WHERE club_id = ?').run(clubId);

          // 2. Cascade delete applications, venue bookings, and announcements
          db.prepare('DELETE FROM membership_applications WHERE club_id = ?').run(clubId);
          db.prepare('DELETE FROM venue_bookings WHERE club_id = ?').run(clubId);
          db.prepare('DELETE FROM announcements WHERE club_id = ?').run(clubId);

          // 3. Delete club from clubs table
          db.prepare('DELETE FROM clubs WHERE id = ?').run(clubId);

          // 4. Clean up user memberships in users table
          const allUsers = db.prepare('SELECT id, club_memberships FROM users').all() as any[];
          for (const u of allUsers) {
            try {
              const memberships = JSON.parse(u.club_memberships || '[]');
              if (memberships.some((m: any) => m.clubId === clubId)) {
                const filtered = memberships.filter((m: any) => m.clubId !== clubId);
                db.prepare('UPDATE users SET club_memberships = ? WHERE id = ?').run(JSON.stringify(filtered), u.id);
              }
            } catch {}
          }

          const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

          // 5. Broadcast notification
          db.prepare(`
            INSERT INTO notifications (id, title, message, type, target_roles, timestamp)
            VALUES (?, ?, ?, 'System', ?, ?)
          `).run(
            `NT-${Date.now()}`,
            `Society Dissolved: ${club.name}`,
            `"${club.name}" (${club.code}) has been officially decommissioned by System Administration.`,
            JSON.stringify(['Student', 'Club_Exec', 'Faculty_Advisor', 'System_Admin']),
            nowStr
          );

          const stateSnapshot = loadNormalizedAppState();
          return res.json({ success: true, message: `Society "${club.name}" and associated records removed successfully.`, state: stateSnapshot });
        }

        default:
          return res.status(400).json({ error: 'Unsupported action.' });
      }
    } catch (error: any) {
      console.error('State update error:', error);
      return res.status(500).json({ error: error.message || 'Failed to update system state.' });
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
    console.log(`BUP-CMS Server running on http://localhost:${PORT}`);
  });
}

startServer();
