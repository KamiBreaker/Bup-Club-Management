import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Club, ClubEvent, MembershipApplication, AttendanceRecord, ClubAnnouncement, UserProfile } from '../types/cms';

export interface OfficerActivity {
  applicationsDecided: {
    id: string;
    applicantName: string;
    studentId: string;
    roleName: string;
    status: string;
    date: string;
    remarks?: string;
  }[];
  questionsDispatched: {
    id: string;
    applicantName: string;
    questionPrompt: string;
    date: string;
    studentAnswer?: string;
  }[];
  attendanceCheckIns: {
    eventId: string;
    eventTitle: string;
    studentName: string;
    studentId: string;
    markedAt: string;
  }[];
  eventsOrganized: {
    id: string;
    title: string;
    category: string;
    date: string;
    venueName: string;
    registeredCount: number;
    attendedCount: number;
  }[];
  announcementsCreated: {
    id: string;
    title: string;
    priority: string;
    date: string;
  }[];
}

export interface OfficerProfile {
  name: string;
  designation: string;
  roleType: 'Moderator' | 'Sub-Executive' | 'Executive' | 'Faculty_Advisor';
  studentId: string;
  email?: string;
  department?: string;
  clubId: string;
  clubName: string;
  avatar?: string;
  activities: OfficerActivity;
  stats: {
    totalDecisions: number;
    approvedCount: number;
    rejectedCount: number;
    totalQuestionsAsked: number;
    totalGateVerifications: number;
    totalEventsCoordinated: number;
    activityScore: number;
  };
}

export interface LeadershipReportData {
  reportRef: string;
  generatedAt: string;
  generatedBy?: {
    name: string;
    role: string;
    studentId?: string;
  };
  club?: Club;
  officers: OfficerProfile[];
  summaryMetrics: {
    totalOfficers: number;
    moderatorCount: number;
    subExecCount: number;
    execCount: number;
    totalApplicationsProcessed: number;
    totalGateVerifications: number;
    totalEventsSupervised: number;
  };
}

/**
 * Determine officer role type classification based on designation
 */
export function classifyRoleType(designation: string): 'Moderator' | 'Sub-Executive' | 'Executive' | 'Faculty_Advisor' {
  const lower = (designation || '').toLowerCase();
  if (lower.includes('advisor') || lower.includes('faculty')) return 'Faculty_Advisor';
  if (lower.includes('moderator')) return 'Moderator';
  if (lower.includes('sub-executive') || lower.includes('sub executive') || lower.includes('assistant')) return 'Sub-Executive';
  return 'Executive';
}

/**
 * Builds structured leadership and moderator report data across clubs or a single club.
 */
export function buildLeadershipReportData(
  targetClub?: Club | null,
  allClubs: Club[] = [],
  applications: MembershipApplication[] = [],
  attendanceRecords: AttendanceRecord[] = [],
  events: ClubEvent[] = [],
  announcements: ClubAnnouncement[] = [],
  users: UserProfile[] = [],
  currentUser?: UserProfile
): LeadershipReportData {
  const clubsToAnalyze = targetClub ? [targetClub] : allClubs;
  const clubIdSet = new Set(clubsToAnalyze.map((c) => c.id));

  // Filter scoped data
  const scopedApps = applications.filter((a) => clubIdSet.has(a.clubId));
  const scopedEvents = events.filter((e) => clubIdSet.has(e.clubId));
  const scopedAnnouncements = announcements.filter((an) => clubIdSet.has(an.clubId));

  const officers: OfficerProfile[] = [];

  clubsToAnalyze.forEach((club) => {
    // 1. Faculty Advisor (Moderator)
    if (club.facultyAdvisor && club.facultyAdvisor.name) {
      const advName = club.facultyAdvisor.name;
      const advEmail = club.facultyAdvisor.email || '';
      const advDesignation = club.facultyAdvisor.designation || 'Faculty Advisor & Chief Moderator';

      const matchedApps = scopedApps.filter(
        (a) =>
          a.clubId === club.id &&
          a.decisionBy &&
          (a.decisionBy.toLowerCase().includes(advName.toLowerCase()) ||
            a.decisionBy.toLowerCase().includes('advisor') ||
            a.decisionBy.toLowerCase().includes('moderator'))
      );

      const matchedQuestions = scopedApps.filter(
        (a) =>
          a.clubId === club.id &&
          a.questionAskedBy &&
          (a.questionAskedBy.toLowerCase().includes(advName.toLowerCase()) ||
            a.questionAskedBy.toLowerCase().includes('advisor') ||
            a.questionAskedBy.toLowerCase().includes('moderator'))
      );

      const matchedEvents = scopedEvents.filter((e) => e.clubId === club.id);

      const approved = matchedApps.filter((a) => a.status === 'Approved').length;
      const rejected = matchedApps.filter((a) => a.status === 'Rejected').length;

      officers.push({
        name: advName,
        designation: advDesignation,
        roleType: 'Faculty_Advisor',
        studentId: 'FACULTY-REF',
        email: advEmail,
        department: club.department,
        clubId: club.id,
        clubName: club.name,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        activities: {
          applicationsDecided: matchedApps.map((a) => ({
            id: a.id,
            applicantName: a.applicantName,
            studentId: a.studentId,
            roleName: a.roleName,
            status: a.status,
            date: a.decisionDate || a.applicationDate,
            remarks: a.decisionRemarks
          })),
          questionsDispatched: matchedQuestions.map((q) => ({
            id: q.id,
            applicantName: q.applicantName,
            questionPrompt: q.questionPrompt || '',
            date: q.questionDate || q.applicationDate,
            studentAnswer: q.studentAnswer
          })),
          attendanceCheckIns: [],
          eventsOrganized: matchedEvents.map((e) => ({
            id: e.id,
            title: e.title,
            category: e.category,
            date: e.date,
            venueName: e.venueName,
            registeredCount: e.registeredCount || 0,
            attendedCount: (e.attendeeUserIds || []).length
          })),
          announcementsCreated: scopedAnnouncements.filter((an) => an.clubId === club.id).map((an) => ({
            id: an.id,
            title: an.title,
            priority: an.priority,
            date: an.createdAt
          }))
        },
        stats: {
          totalDecisions: matchedApps.length,
          approvedCount: approved,
          rejectedCount: rejected,
          totalQuestionsAsked: matchedQuestions.length,
          totalGateVerifications: 0,
          totalEventsCoordinated: matchedEvents.length,
          activityScore: matchedApps.length * 10 + matchedQuestions.length * 5 + matchedEvents.length * 15
        }
      });
    }

    // 2. Club Executives & Sub-Executives
    (club.executives || []).forEach((exec) => {
      const execName = exec.name;
      const execId = exec.studentId;
      const designation = exec.designation || 'Executive Member';
      const roleType = classifyRoleType(designation);

      // Find user profile for extra details if available
      const userProfile = users.find((u) => u.studentId === execId || u.name === execName);

      // Applications decided by this executive/moderator
      const matchedApps = scopedApps.filter(
        (a) =>
          a.clubId === club.id &&
          a.decisionBy &&
          (a.decisionBy.toLowerCase().includes(execName.toLowerCase()) ||
            a.decisionBy.includes(execId) ||
            a.decisionBy.toLowerCase().includes(designation.toLowerCase()))
      );

      // Questions dispatched
      const matchedQuestions = scopedApps.filter(
        (a) =>
          a.clubId === club.id &&
          a.questionAskedBy &&
          (a.questionAskedBy.toLowerCase().includes(execName.toLowerCase()) ||
            a.questionAskedBy.includes(execId) ||
            a.questionAskedBy.toLowerCase().includes(designation.toLowerCase()))
      );

      // Gate check-in attendance marked by this executive
      const matchedAttendance = attendanceRecords.filter(
        (att) =>
          att.markedBy &&
          (att.markedBy.toLowerCase().includes(execName.toLowerCase()) ||
            att.markedBy.includes(execId) ||
            att.markedBy.toLowerCase().includes('usher') ||
            att.markedBy.toLowerCase().includes('moderator'))
      );

      // Events organized or led
      const matchedEvents = scopedEvents.filter(
        (e) =>
          e.clubId === club.id &&
          ((e.contactPerson && e.contactPerson.toLowerCase().includes(execName.toLowerCase())) ||
            (e.organizingTeam && e.organizingTeam.toLowerCase().includes(execName.toLowerCase())) ||
            roleType === 'Moderator' ||
            designation.toLowerCase().includes('president') ||
            designation.toLowerCase().includes('secretary'))
      );

      // Announcements created
      const matchedAnnouncements = scopedAnnouncements.filter(
        (an) =>
          an.clubId === club.id &&
          an.createdBy &&
          (an.createdBy.toLowerCase().includes(execName.toLowerCase()) ||
            an.createdBy.toLowerCase().includes(designation.toLowerCase()))
      );

      const approved = matchedApps.filter((a) => a.status === 'Approved').length;
      const rejected = matchedApps.filter((a) => a.status === 'Rejected').length;

      const activityScore =
        matchedApps.length * 10 +
        matchedQuestions.length * 8 +
        matchedAttendance.length * 2 +
        matchedEvents.length * 15 +
        matchedAnnouncements.length * 5;

      officers.push({
        name: execName,
        designation,
        roleType,
        studentId: execId,
        email: userProfile?.email || `${execId}@bup.edu.bd`,
        department: userProfile?.department || club.department,
        clubId: club.id,
        clubName: club.name,
        avatar: exec.avatar || userProfile?.avatarUrl,
        activities: {
          applicationsDecided: matchedApps.map((a) => ({
            id: a.id,
            applicantName: a.applicantName,
            studentId: a.studentId,
            roleName: a.roleName,
            status: a.status,
            date: a.decisionDate || a.applicationDate,
            remarks: a.decisionRemarks
          })),
          questionsDispatched: matchedQuestions.map((q) => ({
            id: q.id,
            applicantName: q.applicantName,
            questionPrompt: q.questionPrompt || '',
            date: q.questionDate || q.applicationDate,
            studentAnswer: q.studentAnswer
          })),
          attendanceCheckIns: matchedAttendance.map((att) => ({
            eventId: att.eventId,
            eventTitle: att.eventTitle || 'Campus Event',
            studentName: att.studentName,
            studentId: att.studentId,
            markedAt: att.markedAt
          })),
          eventsOrganized: matchedEvents.map((e) => ({
            id: e.id,
            title: e.title,
            category: e.category,
            date: e.date,
            venueName: e.venueName,
            registeredCount: e.registeredCount || 0,
            attendedCount: (e.attendeeUserIds || []).length
          })),
          announcementsCreated: matchedAnnouncements.map((an) => ({
            id: an.id,
            title: an.title,
            priority: an.priority,
            date: an.createdAt
          }))
        },
        stats: {
          totalDecisions: matchedApps.length,
          approvedCount: approved,
          rejectedCount: rejected,
          totalQuestionsAsked: matchedQuestions.length,
          totalGateVerifications: matchedAttendance.length,
          totalEventsCoordinated: matchedEvents.length,
          activityScore
        }
      });
    });
  });

  // Calculate high-level summary metrics
  const moderatorCount = officers.filter((o) => o.roleType === 'Moderator' || o.roleType === 'Faculty_Advisor').length;
  const subExecCount = officers.filter((o) => o.roleType === 'Sub-Executive').length;
  const execCount = officers.filter((o) => o.roleType === 'Executive').length;

  const totalApplicationsProcessed = scopedApps.filter((a) => a.status === 'Approved' || a.status === 'Rejected').length;
  const totalGateVerifications = attendanceRecords.filter((att) => att.status === 'Present').length;
  const totalEventsSupervised = scopedEvents.length;

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const refCode = targetClub ? `BUP-LEAD-${targetClub.code}-${now.getFullYear()}` : `BUP-LEAD-ALL-${now.getFullYear()}`;

  return {
    reportRef: refCode,
    generatedAt: `${dateStr} ${now.toTimeString().split(' ')[0].substring(0, 5)}`,
    generatedBy: currentUser
      ? {
          name: currentUser.name,
          role: currentUser.role,
          studentId: currentUser.studentId
        }
      : undefined,
    club: targetClub || undefined,
    officers,
    summaryMetrics: {
      totalOfficers: officers.length,
      moderatorCount,
      subExecCount,
      execCount,
      totalApplicationsProcessed,
      totalGateVerifications,
      totalEventsSupervised
    }
  };
}

/**
 * Generates a multi-tab Excel spreadsheet for Moderator & Sub-Executive activities.
 */
export function exportLeadershipReportExcel(report: LeadershipReportData): void {
  const wb = XLSX.utils.book_new();

  // ----------------------------------------------------
  // SHEET 1: GOVERNANCE & LEADERSHIP OVERVIEW
  // ----------------------------------------------------
  const summaryRows = [
    ['BANGLADESH UNIVERSITY OF PROFESSIONALS (BUP)'],
    ['DIRECTORATE OF STUDENTS WELFARE • OFFICE OF STUDENT AFFAIRS'],
    ['CLUB LEADERSHIP, MODERATOR & SUB-EXECUTIVE ACTIVITY AUDIT REPORT'],
    [''],
    ['Report Reference ID:', report.reportRef],
    ['Audit Timestamp:', report.generatedAt],
    ['Generated By:', report.generatedBy ? `${report.generatedBy.name} (${report.generatedBy.role})` : 'Authorized CMS Admin'],
    ['Scope / Club:', report.club ? `${report.club.name} (${report.club.code})` : 'All Campus Clubs & Societies'],
    ['Faculty Advisor / Chief Moderator:', report.club?.facultyAdvisor?.name || 'Assigned Faculty Council'],
    [''],
    ['--- LEADERSHIP ROSTER SUMMARY ---'],
    ['Total Accredited Officers:', report.summaryMetrics.totalOfficers],
    ['Moderators & Faculty Advisors:', report.summaryMetrics.moderatorCount],
    ['Sub-Executive Officers:', report.summaryMetrics.subExecCount],
    ['Executive Committee Members:', report.summaryMetrics.execCount],
    [''],
    ['--- AGGREGATE GOVERNANCE PERFORMANCE ---'],
    ['Total Candidate Applications Audited:', report.summaryMetrics.totalApplicationsProcessed],
    ['Total Gate Attendance Verifications Logged:', report.summaryMetrics.totalGateVerifications],
    ['Total Society Events Coordinated:', report.summaryMetrics.totalEventsSupervised]
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 35 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Governance Overview');

  // ----------------------------------------------------
  // SHEET 2: OFFICERS & ACTIVITY STATS ROSTER
  // ----------------------------------------------------
  const officerHeaders = [
    'Sl No',
    'Officer Name',
    'Official Designation',
    'Role Classification',
    'Student / Faculty ID',
    'Department',
    'Email Address',
    'Club Name',
    'Decisions Made',
    'Approved',
    'Rejected',
    'Clarification Q&As',
    'Gate Verifications',
    'Events Coordinated',
    'Activity Score'
  ];

  const officerRows = report.officers.map((off, idx) => [
    idx + 1,
    off.name,
    off.designation,
    off.roleType,
    off.studentId,
    off.department || 'N/A',
    off.email || 'N/A',
    off.clubName,
    off.stats.totalDecisions,
    off.stats.approvedCount,
    off.stats.rejectedCount,
    off.stats.totalQuestionsAsked,
    off.stats.totalGateVerifications,
    off.stats.totalEventsCoordinated,
    off.stats.activityScore
  ]);

  const wsOfficers = XLSX.utils.aoa_to_sheet([officerHeaders, ...officerRows]);
  wsOfficers['!cols'] = [
    { wch: 8 },
    { wch: 25 },
    { wch: 30 },
    { wch: 18 },
    { wch: 18 },
    { wch: 22 },
    { wch: 28 },
    { wch: 30 },
    { wch: 16 },
    { wch: 12 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 15 }
  ];
  XLSX.utils.book_append_sheet(wb, wsOfficers, 'Officers & Activity Stats');

  // ----------------------------------------------------
  // SHEET 3: MEMBERSHIP DECISIONS LOG
  // ----------------------------------------------------
  const decisionHeaders = [
    'Sl No',
    'Deciding Officer / Moderator',
    'Officer Designation',
    'Applicant Name',
    'Applicant ID',
    'Applied Role',
    'Decision Status',
    'Decision Date',
    'Audit Remarks / Evaluation'
  ];

  const decisionRows: any[] = [];
  let decIdx = 1;
  report.officers.forEach((off) => {
    off.activities.applicationsDecided.forEach((app) => {
      decisionRows.push([
        decIdx++,
        off.name,
        off.designation,
        app.applicantName,
        app.studentId,
        app.roleName,
        app.status,
        app.date,
        app.remarks || 'Standard Inductions Evaluation'
      ]);
    });
  });

  const wsDecisions = XLSX.utils.aoa_to_sheet([decisionHeaders, ...decisionRows]);
  wsDecisions['!cols'] = [
    { wch: 8 },
    { wch: 25 },
    { wch: 28 },
    { wch: 22 },
    { wch: 16 },
    { wch: 22 },
    { wch: 16 },
    { wch: 18 },
    { wch: 45 }
  ];
  XLSX.utils.book_append_sheet(wb, wsDecisions, 'Membership Decisions Log');

  // ----------------------------------------------------
  // SHEET 4: MODERATOR CLARIFICATION Q&A AUDIT LOG
  // ----------------------------------------------------
  const qnaHeaders = [
    'Sl No',
    'Inquiring Officer / Moderator',
    'Candidate Name',
    'Clarification Question Prompt',
    'Dispatch Date',
    'Candidate Response / Submission'
  ];

  const qnaRows: any[] = [];
  let qnaIdx = 1;
  report.officers.forEach((off) => {
    off.activities.questionsDispatched.forEach((q) => {
      qnaRows.push([
        qnaIdx++,
        `${off.name} (${off.designation})`,
        q.applicantName,
        q.questionPrompt,
        q.date,
        q.studentAnswer || 'Awaiting response'
      ]);
    });
  });

  const wsQna = XLSX.utils.aoa_to_sheet([qnaHeaders, ...qnaRows]);
  wsQna['!cols'] = [{ wch: 8 }, { wch: 30 }, { wch: 22 }, { wch: 45 }, { wch: 18 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsQna, 'Clarifications & Q&A');

  // ----------------------------------------------------
  // SHEET 5: GATE ATTENDANCE & VERIFICATION LOG
  // ----------------------------------------------------
  const gateHeaders = [
    'Sl No',
    'Logged By / Usher',
    'Event Title',
    'Verified Attendee Name',
    'Attendee Student ID',
    'Gate Scan Timestamp'
  ];

  const gateRows: any[] = [];
  let gateIdx = 1;
  report.officers.forEach((off) => {
    off.activities.attendanceCheckIns.forEach((att) => {
      gateRows.push([
        gateIdx++,
        `${off.name} (${off.designation})`,
        att.eventTitle,
        att.studentName,
        att.studentId,
        att.markedAt
      ]);
    });
  });

  const wsGate = XLSX.utils.aoa_to_sheet([gateHeaders, ...gateRows]);
  wsGate['!cols'] = [{ wch: 8 }, { wch: 30 }, { wch: 32 }, { wch: 24 }, { wch: 18 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsGate, 'Gate Verification Log');

  // Download File
  const filename = `${report.reportRef}_Activity_Report.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Generates an executive PDF report for Leadership, Moderator & Sub-Executive activities.
 */
export function exportLeadershipReportPdf(report: LeadershipReportData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  const emeraldPrimary = [6, 78, 59];
  const emeraldAccent = [16, 185, 129];
  const slateDark = [15, 23, 42];
  const slateMuted = [100, 116, 139];
  const slateLightBg = [248, 250, 252];

  let currentY = margin;

  // Header Banner
  doc.setFillColor(emeraldPrimary[0], emeraldPrimary[1], emeraldPrimary[2]);
  doc.rect(margin, currentY, contentWidth, 68, 'F');
  doc.setFillColor(emeraldAccent[0], emeraldAccent[1], emeraldAccent[2]);
  doc.rect(margin, currentY + 65, contentWidth, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('BANGLADESH UNIVERSITY OF PROFESSIONALS (BUP)', margin + 15, currentY + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(209, 250, 229);
  doc.text('OFFICE OF STUDENT AFFAIRS • DIRECTORATE OF STUDENTS WELFARE', margin + 15, currentY + 36);
  doc.text('CLUB LEADERSHIP, MODERATOR & SUB-EXECUTIVE ACTIVITY AUDIT REPORT', margin + 15, currentY + 50);

  // Right pill
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`REF: ${report.reportRef}`, pageWidth - margin - 15, currentY + 22, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(209, 250, 229);
  doc.text(`Date: ${report.generatedAt}`, pageWidth - margin - 15, currentY + 36, { align: 'right' });
  doc.text('Status: Verified Governance Audit', pageWidth - margin - 15, currentY + 50, { align: 'right' });

  currentY += 80;

  // Title
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  const titleText = report.club
    ? `${report.club.name} (${report.club.code}) - Leadership Governance Audit`
    : 'BUP Campus Societies - Leadership & Moderation Governance Audit';
  doc.text(titleText, margin, currentY);
  currentY += 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  const subText = `Faculty Advisor: ${report.club?.facultyAdvisor?.name || 'Faculty Governance Council'} • Total Appointed Officers: ${report.summaryMetrics.totalOfficers} • Generated By: ${report.generatedBy?.name || 'CMS Administrator'}`;
  doc.text(subText, margin, currentY);
  currentY += 15;

  // KPI metric cards (4 cards)
  const cardWidth = (contentWidth - 30) / 4;
  const cardHeight = 46;
  const kpis = [
    { label: 'TOTAL OFFICERS', val: `${report.summaryMetrics.totalOfficers}`, sub: `${report.summaryMetrics.moderatorCount} Moderators` },
    { label: 'SUB-EXECUTIVES', val: `${report.summaryMetrics.subExecCount}`, sub: `${report.summaryMetrics.execCount} Executive Officers` },
    { label: 'APPLICATIONS AUDITED', val: `${report.summaryMetrics.totalApplicationsProcessed}`, sub: 'Inductions Evaluated' },
    { label: 'GATE VERIFICATIONS', val: `${report.summaryMetrics.totalGateVerifications}`, sub: 'Turnout Logged' }
  ];

  kpis.forEach((kpi, idx) => {
    const x = margin + idx * (cardWidth + 10);
    doc.setFillColor(slateLightBg[0], slateLightBg[1], slateLightBg[2]);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 4, 4, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 4, 4, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(kpi.label, x + 8, currentY + 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(emeraldPrimary[0], emeraldPrimary[1], emeraldPrimary[2]);
    doc.text(kpi.val, x + 8, currentY + 27);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(kpi.sub, x + 8, currentY + 39);
  });

  currentY += cardHeight + 18;

  // Officers Roster Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('Designated Moderators, Sub-Executives & Officers Roster', margin, currentY);
  currentY += 8;

  const officerTableRows = report.officers.map((off, idx) => [
    (idx + 1).toString(),
    off.name,
    off.designation,
    off.roleType,
    off.studentId,
    off.department || 'N/A',
    off.stats.totalDecisions.toString(),
    off.stats.totalGateVerifications.toString(),
    off.stats.activityScore.toString()
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'striped',
    headStyles: {
      fillColor: emeraldPrimary as any,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5
    },
    styles: {
      fontSize: 7,
      cellPadding: 3.5
    },
    head: [['#', 'Officer Name', 'Official Designation', 'Role Type', 'ID / Ref', 'Department', 'Decisions', 'Gate Shifts', 'Score']],
    body: officerTableRows.length > 0 ? officerTableRows : [['-', 'No designated officers assigned', '-', '-', '-', '-', '-', '-', '-']]
  });

  currentY = (doc as any).lastAutoTable.finalY + 18;

  // Membership Decisions & Q&A Log
  if (currentY > pageHeight - 160) {
    doc.addPage();
    currentY = margin;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('Membership Decisions & Candidate Evaluations Log', margin, currentY);
  currentY += 8;

  const decisionList: any[] = [];
  report.officers.forEach((off) => {
    off.activities.applicationsDecided.forEach((app, i) => {
      if (decisionList.length < 15) {
        decisionList.push([
          (decisionList.length + 1).toString(),
          off.name,
          off.designation,
          app.applicantName,
          app.roleName,
          app.status,
          app.date
        ]);
      }
    });
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5
    },
    styles: {
      fontSize: 7,
      cellPadding: 3.5
    },
    head: [['#', 'Deciding Officer / Moderator', 'Designation', 'Applicant Name', 'Role Applied', 'Decision', 'Date']],
    body: decisionList.length > 0 ? decisionList : [['-', 'No formal decisions recorded yet', '-', '-', '-', '-', '-']]
  });

  currentY = (doc as any).lastAutoTable.finalY + 25;

  // Institutional Sign-Off
  if (currentY > pageHeight - 130) {
    doc.addPage();
    currentY = margin + 25;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('Institutional Compliance & Governance Sign-Off', margin, currentY);
  currentY += 15;

  const signBoxWidth = (contentWidth - 30) / 3;
  const signBoxY = currentY;

  const signBlocks = [
    { title: 'PREPARED BY', role: 'General Secretary / Head of HR', name: 'Executive Secretariat' },
    { title: 'VERIFIED & AUDITED BY', role: 'Faculty Advisor & Chief Moderator', name: report.club?.facultyAdvisor?.name || 'Chief Faculty Moderator' },
    { title: 'CONFIRMED BY', role: 'Directorate of Students Welfare', name: 'Office of Student Affairs, BUP' }
  ];

  signBlocks.forEach((sb, idx) => {
    const x = margin + idx * (signBoxWidth + 15);
    doc.setDrawColor(203, 213, 225);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(x, signBoxY + 40, x + signBoxWidth, signBoxY + 40);
    doc.setLineDashPattern([], 0);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(sb.title, x, signBoxY + 50);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(sb.name, x, signBoxY + 62);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(sb.role, x, signBoxY + 73);
    doc.text(`Date: ____________________`, x, signBoxY + 83);
  });

  // Footer & Page numbers
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);

    doc.text(
      `Bangladesh University of Professionals (BUP) • Leadership & Moderation Audit • ${report.reportRef}`,
      margin,
      pageHeight - 14
    );
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 14,
      { align: 'right' }
    );
  }

  const filename = `${report.reportRef}_Activity_Report.pdf`;
  doc.save(filename);
}
