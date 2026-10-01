import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { INITIAL_USER_PROFILES, BUP_CLUBS, BUP_VENUES, BUP_EVENTS } from '../src/data/cmsData';

const db = new Database('bup-cms.db');

console.log('Purging existing database tables...');
db.exec(`
  DELETE FROM users;
  DELETE FROM membership_applications;
  DELETE FROM event_registrations;
  DELETE FROM attendance;
  DELETE FROM notifications;
  DELETE FROM announcements;
  DELETE FROM venue_bookings;
  DELETE FROM clubs;
  DELETE FROM events;
  DELETE FROM venues;
`);

console.log('Seeding clean administrator account...');
const adminHash = bcrypt.hashSync('admin123', 10);
const insertUser = db.prepare(`
  INSERT INTO users (id, name, student_id, department, batch, email, password_hash, role, avatar_url, club_memberships, created_at)
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
    adminHash,
    u.role,
    u.avatarUrl,
    JSON.stringify(u.clubMemberships || []),
    new Date().toISOString()
  );
}

console.log('Seeding clean clubs with zero mock executives...');
const insertClub = db.prepare(`
  INSERT INTO clubs (id, code, name, category, department, founding_year, logo_url, banner_url, tagline, description, faculty_advisor, executives, member_count, featured_events_count, budget_allocated, status, recruitment_open, recruitment_deadline, membership_requirements, objectives, achievements)
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
    c.recruitmentDeadline || '2026-10-31',
    JSON.stringify(c.membershipRequirements || []),
    JSON.stringify(c.objectives || []),
    JSON.stringify(c.achievements || [])
  );
}

console.log('Seeding clean campus venues...');
const insertVenue = db.prepare(`
  INSERT INTO venues (id, name, code, location, capacity, facilities, image_url, status)
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

console.log('Seeding clean events with zero attendees...');
const insertEvent = db.prepare(`
  INSERT INTO events (id, club_id, club_name, club_logo, title, category, description, poster_url, date, start_time, end_time, venue_id, venue_name, max_seats, registered_count, status, is_rsvp_allowed, registered_user_ids, attendee_user_ids, registration_deadline, contact_person, organizing_team, required_equipment)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
for (const ev of BUP_EVENTS) {
  insertEvent.run(
    ev.id,
    ev.clubId,
    ev.clubName,
    ev.clubLogo,
    ev.title,
    ev.category,
    ev.description,
    ev.posterUrl,
    ev.date,
    ev.startTime,
    ev.endTime,
    ev.venueId,
    ev.venueName,
    ev.maxSeats,
    0,
    ev.status,
    ev.isRSVPAllowed ? 1 : 0,
    '[]',
    '[]',
    ev.registrationDeadline || null,
    ev.contactPerson || null,
    ev.organizingTeam || null,
    JSON.stringify(ev.requiredEquipment || [])
  );
}

console.log('Clean database reset successfully finished!');
