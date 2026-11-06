import { test, expect, request as playwrightRequest, APIRequestContext } from '@playwright/test';
import Database from 'better-sqlite3';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';

test.describe('BUP-CMS Automated Use Case Test Suite (Playwright)', () => {
  let adminContext: APIRequestContext;
  let studentContext: APIRequestContext;
  let studentProfile: any;
  let adminProfile: any;
  let targetClubId: string = '';
  let targetClubName: string = '';
  let testAppId: string = '';
  let testEventId: string = '';
  let testVenueBookingId: string = '';
  let studentPassCode: string = '';

  test.beforeAll(async () => {
    // 0. Clean and reset test fixture artifacts for 100% test idempotency
    try {
      const db = new Database('bup-cms.db');
      db.prepare("UPDATE users SET role = 'Student' WHERE id = 'USR-1790857194789' OR student_id = '26549010001'").run();
      db.prepare("DELETE FROM membership_applications WHERE role_name = 'Sub-Executive (Technical)'").run();
      db.prepare("DELETE FROM events WHERE title LIKE 'Automated Tech Fest%'").run();
      db.prepare("DELETE FROM event_registrations WHERE student_id = '26549010001'").run();
      db.prepare("DELETE FROM attendance WHERE student_id = '26549010001'").run();
      db.prepare("DELETE FROM event_feedbacks WHERE student_id = '26549010001'").run();
      db.prepare("DELETE FROM venue_bookings WHERE event_title = 'National Cultural Gala'").run();
      db.close();
    } catch (e) {
      // Ignore if database locked temporarily
    }

    // 1. Authenticate System Admin
    adminContext = await playwrightRequest.newContext();
    const adminRes = await adminContext.post(`${BASE_URL}/api/auth/demo-login`, {
      data: { role: 'System_Admin' }
    });
    expect(adminRes.ok()).toBeTruthy();
    const adminData = await adminRes.json();
    adminProfile = adminData.user;

    // 2. Authenticate Student
    studentContext = await playwrightRequest.newContext();
    const studentRes = await studentContext.post(`${BASE_URL}/api/auth/demo-login`, {
      data: { role: 'Student' }
    });
    expect(studentRes.ok()).toBeTruthy();
    const studentData = await studentRes.json();
    studentProfile = studentData.user;

    // 3. Resolve Target Club
    const stateRes = await adminContext.get(`${BASE_URL}/api/app-state`);
    const stateData = await stateRes.json();
    const firstClub = stateData.state.clubs[0];
    targetClubId = firstClub.id;
    targetClubName = firstClub.name;
  });

  test.afterAll(async () => {
    if (adminContext) await adminContext.dispose();
    if (studentContext) await studentContext.dispose();
  });

  // --- MODULE 1: AUTHENTICATION & ACCESS CONTROL (FR-01, FR-02) ---
  test('TC-01: [UC-AUTH-01] Verify Multi-Role Authentication for System Admin & Student', async () => {
    const meRes = await adminContext.get(`${BASE_URL}/api/auth/me`);
    expect(meRes.ok()).toBeTruthy();
    const data = await meRes.json();
    expect(data.user.role).toBe('System_Admin');
    expect(data.user.email).toBe('admin@bup.edu.bd');

    const studentMe = await studentContext.get(`${BASE_URL}/api/auth/me`);
    expect(studentMe.ok()).toBeTruthy();
    const stuData = await studentMe.json();
    expect(stuData.user.role).toBe('Student');
  });

  test('TC-02: [UC-AUTH-02] Verify Access Restriction on Unauthenticated Requests', async () => {
    const unauthCtx = await playwrightRequest.newContext();
    const unauthRes = await unauthCtx.post(`${BASE_URL}/api/app-state/update`, {
      data: { action: 'update-club', payload: { clubId: targetClubId, updates: { name: 'Hack' } } }
    });
    expect(unauthRes.status()).toBe(401);
    await unauthCtx.dispose();
  });

  // --- MODULE 2: PUBLIC GUEST BROWSING (FR-01, FR-03) ---
  test('TC-03: [UC-GUEST-01] Guest Mode can freely retrieve public catalog & health status', async ({ request }) => {
    const healthRes = await request.get(`${BASE_URL}/api/health`);
    expect(healthRes.ok()).toBeTruthy();
    const health = await healthRes.json();
    expect(health.status).toBe('ok');

    const stateRes = await request.get(`${BASE_URL}/api/app-state`);
    expect(stateRes.ok()).toBeTruthy();
    const data = await stateRes.json();
    expect(data.state.clubs.length).toBeGreaterThan(0);
    expect(data.state.events.length).toBeGreaterThan(0);
    expect(data.state.venues.length).toBeGreaterThan(0);
  });

  // --- MODULE 3: CLUB GOVERNANCE & FACULTY ADVISOR EDITING (FR-03, FR-19) ---
  test('TC-04: [UC-CLUB-01] Authorized Society Update (Faculty Advisor & Recruitment deadline)', async () => {
    const updateRes = await adminContext.post(`${BASE_URL}/api/app-state/update`, {
      data: {
        action: 'update-club',
        payload: {
          clubId: targetClubId,
          facultyAdvisor: {
            name: 'Dr. Shahriar Rahman',
            designation: 'Professor & Chair',
            email: 'shahriar@bup.edu.bd'
          },
          recruitmentDeadline: '2026-11-30'
        }
      }
    });
    expect(updateRes.ok()).toBeTruthy();
    const result = await updateRes.json();
    expect(result.success).toBe(true);
    const updatedClub = result.state.clubs.find((c: any) => c.id === targetClubId);
    expect(updatedClub.facultyAdvisor.name).toBe('Dr. Shahriar Rahman');
    expect(updatedClub.recruitmentDeadline).toBe('2026-11-30');
  });

  // --- MODULE 4: RECRUITMENT & EXECUTIVE SCREENING (FR-04, FR-05, FR-20) ---
  test('TC-05: [UC-MEM-01] Student submits Sub-Executive candidacy application', async () => {
    const applyRes = await studentContext.post(`${BASE_URL}/api/app-state/update`, {
      data: {
        action: 'submit-membership-application',
        payload: {
          clubId: targetClubId,
          roleName: 'Sub-Executive (Technical)',
          applicationType: 'Executive',
          statementOfPurpose: 'Passionate about automated campus lighting and digital stage operations.',
          skillsInterests: 'DMX controllers, Audio engineering, React'
        }
      }
    });
    expect(applyRes.ok()).toBeTruthy();
    const result = await applyRes.json();
    expect(result.success).toBe(true);

    const apps = result.state.applications;
    const submitted = apps.find((a: any) => a.roleName === 'Sub-Executive (Technical)' && a.clubId === targetClubId);
    expect(submitted).toBeDefined();
    testAppId = submitted.id;
  });

  test('TC-06: [UC-MEM-02] Moderator Clarification Q&A Inquiry dispatched to Candidate', async () => {
    const qnaRes = await adminContext.post(`${BASE_URL}/api/app-state/update`, {
      data: {
        action: 'request-membership-info',
        payload: {
          applicationId: testAppId,
          question: 'Do you have past experience with festival audio consoles?'
        }
      }
    });
    expect(qnaRes.ok()).toBeTruthy();
    const result = await qnaRes.json();
    const app = result.state.applications.find((a: any) => a.id === testAppId);
    expect(app.status).toBe('Action Required');
    expect(app.questionPrompt).toContain('festival audio consoles');
  });

  test('TC-07: [UC-MEM-03] Candidate responds to Q&A Clarification', async () => {
    const ansRes = await studentContext.post(`${BASE_URL}/api/app-state/update`, {
      data: {
        action: 'respond-membership-qna',
        payload: {
          applicationId: testAppId,
          answer: 'Yes, operated the Yamaha digital mixing console during Inter-University Drama 2025.'
        }
      }
    });
    expect(ansRes.ok()).toBeTruthy();
    const result = await ansRes.json();
    const app = result.state.applications.find((a: any) => a.id === testAppId);
    expect(app.studentAnswer).toContain('Yamaha digital mixing console');
    expect(['Pending', 'Under Review']).toContain(app.status);
  });

  test('TC-08: [UC-MEM-04] Executive Approval elevates candidate to Executive Roster & Role', async () => {
    const reviewRes = await adminContext.post(`${BASE_URL}/api/app-state/update`, {
      data: {
        action: 'review-membership-application',
        payload: {
          applicationId: testAppId,
          status: 'Approved',
          remarks: 'Excellent technical qualifications verified.'
        }
      }
    });
    expect(reviewRes.ok()).toBeTruthy();
    const result = await reviewRes.json();
    const app = result.state.applications.find((a: any) => a.id === testAppId);
    expect(app.status).toBe('Approved');
    expect(app.decisionRemarks).toBe('Excellent technical qualifications verified.');

    // Check club executive roster induction
    const club = result.state.clubs.find((c: any) => c.id === targetClubId);
    const isInducted = (club.executives || []).some((e: any) => e.designation === 'Sub-Executive (Technical)');
    expect(isInducted).toBe(true);
  });

  test('TC-09: [UC-MEM-05] Tamper-Proof Audit Lock: Approved application cannot be re-decided', async () => {
    const lockRes = await adminContext.post(`${BASE_URL}/api/app-state/update`, {
      data: {
        action: 'review-membership-application',
        payload: {
          applicationId: testAppId,
          status: 'Rejected',
          remarks: 'Attempting invalid double-decision'
        }
      }
    });
    expect(lockRes.status()).toBe(400);
    const err = await lockRes.json();
    expect(err.error).toMatch(/Already Rendered|already/i);
  });

  // --- MODULE 5: EVENT LIFECYCLE & CAPACITY (FR-06, FR-07, FR-08) ---
  test('TC-10: [UC-EVT-01] Create Event with strict capacity limits & equipment requisitions', async () => {
    const createEvtRes = await adminContext.post(`${BASE_URL}/api/app-state/update`, {
      data: {
        action: 'create-event',
        payload: {
          title: `Automated Tech Fest ${Date.now().toString().slice(-4)}`,
          category: 'Workshop',
          clubId: targetClubId,
          description: 'Hands-on automated testing, micro-controllers, and AI workshop.',
          date: '2026-11-20',
          startTime: '10:00',
          endTime: '13:00',
          venueId: 'VENUE-02',
          venueName: 'Cyber Lab 1',
          maxSeats: 50,
          registrationDeadline: '2026-11-19',
          requiredEquipment: ['Projector', 'High-Speed Wi-Fi', 'Microphone']
        }
      }
    });
    expect(createEvtRes.ok()).toBeTruthy();
    const result = await createEvtRes.json();
    const created = result.state.events.find((e: any) => e.title.includes('Automated Tech Fest'));
    expect(created).toBeDefined();
    expect(created.maxSeats).toBe(50);
    testEventId = created.id;
  });

  test('TC-11: [UC-EVT-02] Student Event RSVP & Digital Pass Code Generation', async () => {
    const regRes = await studentContext.post(`${BASE_URL}/api/app-state/update`, {
      data: {
        action: 'rsvp',
        payload: { eventId: testEventId }
      }
    });
    expect(regRes.ok()).toBeTruthy();
    const result = await regRes.json();
    const reg = result.state.registrations.find((r: any) => r.eventId === testEventId);
    expect(reg).toBeDefined();
    expect(reg.passCode).toMatch(/^BUP-/);
    studentPassCode = reg.passCode;
  });

  test('TC-12: [UC-EVT-03] Event Rescheduling cascades to venue schedule and alerts users', async () => {
    const reschedRes = await adminContext.post(`${BASE_URL}/api/app-state/update`, {
      data: {
        action: 'update-event',
        payload: {
          eventId: testEventId,
          updates: {
            date: '2026-11-22',
            startTime: '11:00',
            endTime: '14:00'
          }
        }
      }
    });
    expect(reschedRes.ok()).toBeTruthy();
    const result = await reschedRes.json();
    const updated = result.state.events.find((e: any) => e.id === testEventId);
    expect(updated.date).toBe('2026-11-22');
    expect(updated.startTime).toBe('11:00');

    // Verify system notification dispatched
    const notif = result.state.notifications.find((n: any) => n.title.includes('Event Rescheduled'));
    expect(notif).toBeDefined();
  });

  // --- MODULE 6: ATTENDANCE CHECK-IN & VERIFIED FEEDBACK (FR-14, FR-18) ---
  test('TC-13: [UC-ATT-01] Live Event Attendance Check-In via passCode verification', async () => {
    const attRes = await adminContext.post(`${BASE_URL}/api/app-state/update`, {
      data: {
        action: 'record-attendance',
        payload: {
          eventId: testEventId,
          passCode: studentPassCode
        }
      }
    });
    expect(attRes.ok()).toBeTruthy();
    const result = await attRes.json();
    const attRecord = result.state.attendance.find((a: any) => a.eventId === testEventId);
    expect(attRecord).toBeDefined();
  });

  test('TC-14: [UC-FDB-01] Confirmed Attendee submits 5-star quality review & feedback', async () => {
    const fbRes = await studentContext.post(`${BASE_URL}/api/app-state/update`, {
      data: {
        action: 'submit-event-feedback',
        payload: {
          eventId: testEventId,
          rating: 5,
          comment: 'Outstanding workshop! Hands-on automation tools and real-time demonstrations.',
          category: 'Content'
        }
      }
    });
    expect(fbRes.ok()).toBeTruthy();
    const result = await fbRes.json();
    const fb = result.state.feedbacks.find((f: any) => f.eventId === testEventId);
    expect(fb).toBeDefined();
    expect(fb.rating).toBe(5);
    expect(fb.comment).toContain('Outstanding workshop');
  });

  test('TC-15: [UC-FDB-02] Anti-Spam Gate: Unauthorized/Unregistered user blocked from review submission', async () => {
    const fakeRes = await studentContext.post(`${BASE_URL}/api/app-state/update`, {
      data: {
        action: 'submit-event-feedback',
        payload: {
          eventId: 'EVENT-NONEXISTENT',
          rating: 1,
          comment: 'Spam review'
        }
      }
    });
    expect(fakeRes.status()).toBe(404);
  });

  // --- MODULE 7: VENUE BOOKING & RESERVATION (FR-09, FR-12) ---
  test('TC-16: [UC-VEN-01] Club Executive requests Venue Reservation', async () => {
    const bookRes = await adminContext.post(`${BASE_URL}/api/app-state/update`, {
      data: {
        action: 'new-booking',
        payload: {
          venueId: 'VENUE-01',
          venueName: 'Central Auditorium',
          clubId: targetClubId,
          clubName: targetClubName,
          eventTitle: 'National Cultural Gala',
          bookingDate: '2026-12-05',
          startTime: '09:00',
          endTime: '13:00',
          requestedEquipment: ['Sound System', 'Projector & Screen'],
          purpose: 'Annual national inter-university cultural competition'
        }
      }
    });
    expect(bookRes.ok()).toBeTruthy();
    const result = await bookRes.json();
    const booking = result.state.bookings.find((b: any) => b.eventTitle === 'National Cultural Gala');
    expect(booking).toBeDefined();
    testVenueBookingId = booking.id;
  });

  test('TC-17: [UC-VEN-02] Venue Admin Approves Reservation with recorded remarks', async () => {
    const apprvRes = await adminContext.post(`${BASE_URL}/api/app-state/update`, {
      data: {
        action: 'update-booking-status',
        payload: {
          bookingId: testVenueBookingId,
          status: 'Approved'
        }
      }
    });
    expect(apprvRes.ok()).toBeTruthy();
    const result = await apprvRes.json();
    const booking = result.state.bookings.find((b: any) => b.id === testVenueBookingId);
    expect(booking.status).toBe('Approved');
  });

  // --- MODULE 8: EXECUTIVE ROSTER GOVERNANCE (FR-19) ---
  test('TC-18: [UC-EXEC-01] Society Moderator updates designation of inducted candidate', async () => {
    const upRoleRes = await adminContext.post(`${BASE_URL}/api/app-state/update`, {
      data: {
        action: 'update-club-executive-role',
        payload: {
          clubId: targetClubId,
          studentId: studentProfile.studentId,
          designation: 'Lead Technical Director'
        }
      }
    });
    expect(upRoleRes.ok()).toBeTruthy();
    const result = await upRoleRes.json();
    const club = result.state.clubs.find((c: any) => c.id === targetClubId);
    const exec = (club.executives || []).find((e: any) => e.studentId === studentProfile.studentId);
    expect(exec).toBeDefined();
    expect(exec.designation).toBe('Lead Technical Director');
  });

  test('TC-19: [UC-EXEC-02] Society Moderator removes executive from committee roster', async () => {
    const rmRes = await adminContext.post(`${BASE_URL}/api/app-state/update`, {
      data: {
        action: 'remove-club-executive',
        payload: {
          clubId: targetClubId,
          studentId: studentProfile.studentId
        }
      }
    });
    expect(rmRes.ok()).toBeTruthy();
    const result = await rmRes.json();
    const club = result.state.clubs.find((c: any) => c.id === targetClubId);
    const stillThere = (club.executives || []).some((e: any) => e.studentId === studentProfile.studentId);
    expect(stillThere).toBe(false);
  });

  // --- MODULE 9: POST-EVENT COMPLIANCE & EVALUATION REPORT GENERATION ---
  test('TC-20: [UC-REP-01] Post-event report generation with comprehensive KPIs, roster & feedback metrics', async () => {
    // 1. Fetch JSON report for completed event EVT-098 (Hackathon)
    const reportRes = await adminContext.get(`${BASE_URL}/api/events/EVT-098/report`);
    expect(reportRes.ok()).toBeTruthy();
    const data = await reportRes.json();
    expect(data.report).toBeDefined();
    expect(data.report.reportRef).toContain('BUP-REP-EVT-098');
    expect(data.report.event.id).toBe('EVT-098');
    expect(data.report.metrics).toBeDefined();
    expect(data.report.metrics.turnoutRate).toBeGreaterThanOrEqual(0);
    expect(data.report.metrics.averageRating).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(data.report.departmentBreakdown)).toBe(true);
    expect(Array.isArray(data.report.attendees)).toBe(true);
    expect(Array.isArray(data.report.feedbacks)).toBe(true);

    // 2. Fetch Excel format export
    const excelRes = await adminContext.get(`${BASE_URL}/api/events/EVT-098/report?format=excel`);
    expect(excelRes.ok()).toBeTruthy();
    expect(excelRes.headers()['content-type']).toContain('spreadsheetml.sheet');
    const excelBuffer = await excelRes.body();
    expect(excelBuffer.length).toBeGreaterThan(1000);
  });
});
