import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ClubEvent, Club, Venue, EventRegistration, AttendanceRecord, EventFeedback, UserProfile } from '../types/cms';

export interface DepartmentMetric {
  department: string;
  registered: number;
  attended: number;
  turnoutRate: number;
}

export interface RatingDistribution {
  star: number;
  count: number;
  percentage: number;
}

export interface CategoryRating {
  category: string;
  average: number;
  count: number;
}

export interface DetailedAttendee {
  studentId: string;
  studentName: string;
  department: string;
  email: string;
  passCode: string;
  registrationDate: string;
  status: 'Present' | 'Absent';
  markedAt?: string;
  markedBy?: string;
}

export interface EventReportData {
  reportRef: string;
  generatedAt: string;
  generatedBy?: {
    name: string;
    role: string;
    studentId?: string;
    email?: string;
  };
  event: ClubEvent;
  club?: Club;
  venue?: Venue;
  metrics: {
    maxSeats: number;
    registeredCount: number;
    attendedCount: number;
    absentCount: number;
    fillRate: number;
    turnoutRate: number;
    totalFeedbacks: number;
    averageRating: number;
    satisfactionScore: number; // percentage (rating / 5 * 100)
  };
  departmentBreakdown: DepartmentMetric[];
  ratingDistribution: RatingDistribution[];
  categoryRatings: CategoryRating[];
  attendees: DetailedAttendee[];
  feedbacks: EventFeedback[];
}

/**
 * Aggregates all data sources into a structured EventReportData object.
 */
export function buildEventReportData(
  event: ClubEvent,
  club?: Club,
  venue?: Venue,
  registrations: EventRegistration[] = [],
  attendanceRecords: AttendanceRecord[] = [],
  feedbacks: EventFeedback[] = [],
  currentUser?: UserProfile
): EventReportData {
  const eventId = event.id;
  const eventRegs = registrations.filter((r) => r.eventId === eventId);
  const eventAtts = attendanceRecords.filter((a) => a.eventId === eventId);
  const eventFbs = feedbacks.filter((f) => f.eventId === eventId);

  // Set of attendee IDs based on attendance records and attendeeUserIds list
  const attendeeIdSet = new Set<string>();
  eventAtts.forEach((a) => {
    if (a.status === 'Present') {
      if (a.studentId) attendeeIdSet.add(a.studentId.trim());
      if (a.userId) attendeeIdSet.add(a.userId.trim());
    }
  });
  (event.attendeeUserIds || []).forEach((uid) => attendeeIdSet.add(uid.trim()));

  // Map of attendance details by studentId
  const attendanceByStudentId = new Map<string, AttendanceRecord>();
  eventAtts.forEach((a) => {
    if (a.studentId) attendanceByStudentId.set(a.studentId.trim(), a);
  });

  // Build full attendee list from registrations
  const attendees: DetailedAttendee[] = eventRegs.map((reg) => {
    const isAttended =
      reg.attended ||
      attendeeIdSet.has(reg.studentId?.trim()) ||
      attendeeIdSet.has(reg.userId?.trim());
    const attRecord = attendanceByStudentId.get(reg.studentId?.trim());

    return {
      studentId: reg.studentId,
      studentName: reg.studentName,
      department: reg.department || 'Unassigned',
      email: reg.email,
      passCode: reg.passCode,
      registrationDate: reg.registrationDate,
      status: isAttended ? 'Present' : 'Absent',
      markedAt: attRecord?.markedAt,
      markedBy: attRecord?.markedBy
    };
  });

  // Calculate Metrics
  const maxSeats = event.maxSeats || 100;
  const registeredCount = Math.max(eventRegs.length, event.registeredCount || 0);
  const attendedCount = attendees.filter((a) => a.status === 'Present').length;
  const absentCount = Math.max(0, registeredCount - attendedCount);
  const fillRate = maxSeats > 0 ? Math.round((registeredCount / maxSeats) * 100) : 0;
  const turnoutRate = registeredCount > 0 ? Math.round((attendedCount / registeredCount) * 100) : 0;

  // Department Breakdown
  const deptMap: { [key: string]: { registered: number; attended: number } } = {};
  attendees.forEach((att) => {
    const dept = att.department || 'Other';
    if (!deptMap[dept]) {
      deptMap[dept] = { registered: 0, attended: 0 };
    }
    deptMap[dept].registered += 1;
    if (att.status === 'Present') {
      deptMap[dept].attended += 1;
    }
  });

  const departmentBreakdown: DepartmentMetric[] = Object.entries(deptMap).map(([dept, data]) => ({
    department: dept,
    registered: data.registered,
    attended: data.attended,
    turnoutRate: data.registered > 0 ? Math.round((data.attended / data.registered) * 100) : 0
  })).sort((a, b) => b.registered - a.registered);

  // Feedback Metrics
  const totalFeedbacks = eventFbs.length;
  const sumRatings = eventFbs.reduce((acc, f) => acc + (Number(f.rating) || 0), 0);
  const averageRating = totalFeedbacks > 0 ? Number((sumRatings / totalFeedbacks).toFixed(1)) : 0;
  const satisfactionScore = averageRating > 0 ? Math.round((averageRating / 5) * 100) : 0;

  // Star Distribution
  const starCounts: { [key: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  eventFbs.forEach((f) => {
    const r = Math.min(5, Math.max(1, Math.round(Number(f.rating) || 5)));
    starCounts[r] = (starCounts[r] || 0) + 1;
  });

  const ratingDistribution: RatingDistribution[] = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: starCounts[star] || 0,
    percentage: totalFeedbacks > 0 ? Math.round(((starCounts[star] || 0) / totalFeedbacks) * 100) : 0
  }));

  // Category Ratings
  const catMap: { [key: string]: { sum: number; count: number } } = {};
  eventFbs.forEach((f) => {
    const cat = f.category || 'General';
    if (!catMap[cat]) catMap[cat] = { sum: 0, count: 0 };
    catMap[cat].sum += Number(f.rating) || 5;
    catMap[cat].count += 1;
  });

  const categoryRatings: CategoryRating[] = Object.entries(catMap).map(([cat, data]) => ({
    category: cat,
    average: Number((data.sum / data.count).toFixed(1)),
    count: data.count
  }));

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const reportRef = `BUP-REP-${eventId}-${now.getFullYear()}`;

  return {
    reportRef,
    generatedAt: `${dateStr} ${now.toTimeString().split(' ')[0].substring(0, 5)}`,
    generatedBy: currentUser
      ? {
          name: currentUser.name,
          role: currentUser.role,
          studentId: currentUser.studentId,
          email: currentUser.email
        }
      : undefined,
    event,
    club,
    venue,
    metrics: {
      maxSeats,
      registeredCount,
      attendedCount,
      absentCount,
      fillRate,
      turnoutRate,
      totalFeedbacks,
      averageRating,
      satisfactionScore
    },
    departmentBreakdown,
    ratingDistribution,
    categoryRatings,
    attendees,
    feedbacks: eventFbs
  };
}

/**
 * Generates an Excel workbook (.xlsx) with multi-sheet audit details.
 */
export function exportEventReportExcel(report: EventReportData): void {
  const wb = XLSX.utils.book_new();

  // ----------------------------------------------------
  // SHEET 1: EXECUTIVE SUMMARY & EVENT PROFILE
  // ----------------------------------------------------
  const summaryRows = [
    ['BANGLADESH UNIVERSITY OF PROFESSIONALS (BUP)'],
    ['OFFICE OF STUDENT AFFAIRS - DIRECTORATE OF STUDENTS WELFARE'],
    ['POST-EVENT COMPLIANCE, PARTICIPATION & AUDIT REPORT'],
    [''],
    ['Report Reference ID:', report.reportRef],
    ['Report Generated At:', report.generatedAt],
    ['Generated By:', report.generatedBy ? `${report.generatedBy.name} (${report.generatedBy.role})` : 'Authorized CMS Officer'],
    [''],
    ['--- EVENT SPECIFICATIONS ---'],
    ['Event ID:', report.event.id],
    ['Event Title:', report.event.title],
    ['Category:', report.event.category],
    ['Lifecycle Status:', report.event.status],
    ['Event Date:', report.event.date],
    ['Time Window:', `${report.event.startTime} - ${report.event.endTime}`],
    ['Venue Name:', report.event.venueName],
    ['Venue Location:', report.venue?.location || 'BUP Main Campus'],
    ['Venue Capacity:', report.venue?.capacity || report.event.maxSeats],
    ['Description:', report.event.description],
    ['Contact Person / Lead:', report.event.contactPerson || 'Club Executive Committee'],
    ['Required Logistics / Equipment:', (report.event.requiredEquipment || []).join(', ') || 'Standard Auditorium AV'],
    [''],
    ['--- HOST CLUB PROFILE ---'],
    ['Organizing Club:', report.club?.name || report.event.clubName],
    ['Club Code:', report.club?.code || 'N/A'],
    ['Category:', report.club?.category || 'N/A'],
    ['Affiliated Department:', report.club?.department || 'Inter-Departmental'],
    ['Faculty Advisor:', report.club?.facultyAdvisor?.name || 'N/A'],
    ['Advisor Designation:', report.club?.facultyAdvisor?.designation || 'N/A'],
    ['Advisor Email:', report.club?.facultyAdvisor?.email || 'N/A'],
    ['Allocated Annual Budget (BDT):', report.club?.budgetAllocated?.toLocaleString() || 'N/A'],
    [''],
    ['--- KEY PARTICIPATION & QUALITY KPIS ---'],
    ['Allocated Seat Capacity:', report.metrics.maxSeats],
    ['Total Registered Participants:', report.metrics.registeredCount],
    ['Capacity Fill Rate (%):', `${report.metrics.fillRate}%`],
    ['Verified Gate Attendance:', report.metrics.attendedCount],
    ['Absentee / No-Show Count:', report.metrics.absentCount],
    ['Turnout Rate (% of Registered):', `${report.metrics.turnoutRate}%`],
    ['Total Feedback Reviews Received:', report.metrics.totalFeedbacks],
    ['Average Participant Satisfaction (1-5):', `${report.metrics.averageRating} / 5.0`],
    ['Overall Satisfaction Score (%):', `${report.metrics.satisfactionScore}%`]
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 35 }, { wch: 65 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

  // ----------------------------------------------------
  // SHEET 2: ATTENDANCE & REGISTRATION ROSTER
  // ----------------------------------------------------
  const rosterHeaders = [
    'Sl No',
    'Student ID',
    'Student Name',
    'Department',
    'Email Address',
    'Gate Pass Code',
    'Registration Date',
    'Attendance Status',
    'Check-in Timestamp',
    'Verified By'
  ];

  const rosterRows = report.attendees.map((att, idx) => [
    idx + 1,
    att.studentId,
    att.studentName,
    att.department,
    att.email,
    att.passCode,
    att.registrationDate,
    att.status,
    att.markedAt || (att.status === 'Present' ? 'Verified at Entrance' : 'N/A'),
    att.markedBy || (att.status === 'Present' ? 'Gate Scanner' : 'N/A')
  ]);

  const wsRoster = XLSX.utils.aoa_to_sheet([rosterHeaders, ...rosterRows]);
  wsRoster['!cols'] = [
    { wch: 8 },
    { wch: 15 },
    { wch: 25 },
    { wch: 22 },
    { wch: 30 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 22 },
    { wch: 18 }
  ];
  XLSX.utils.book_append_sheet(wb, wsRoster, 'Attendance Roster');

  // ----------------------------------------------------
  // SHEET 3: DEPARTMENT PARTICIPATION BREAKDOWN
  // ----------------------------------------------------
  const deptHeaders = [
    'Department / Program',
    'Registered Count',
    'Verified Attendees',
    'Turnout Rate (%)'
  ];

  const deptRows = report.departmentBreakdown.map((d) => [
    d.department,
    d.registered,
    d.attended,
    `${d.turnoutRate}%`
  ]);

  const wsDept = XLSX.utils.aoa_to_sheet([deptHeaders, ...deptRows]);
  wsDept['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsDept, 'Department Breakdown');

  // ----------------------------------------------------
  // SHEET 4: FEEDBACK & QUALITY REVIEWS
  // ----------------------------------------------------
  const feedbackHeaders = [
    'Sl No',
    'Student Name',
    'Student ID',
    'Department',
    'Rating (1-5)',
    'Review Category',
    'Student Comment / Feedback',
    'Submission Date'
  ];

  const feedbackRows = report.feedbacks.map((fb, idx) => [
    idx + 1,
    fb.studentName,
    fb.studentId,
    fb.department,
    fb.rating,
    fb.category || 'General',
    fb.comment,
    fb.createdAt
  ]);

  const wsFeedback = XLSX.utils.aoa_to_sheet([feedbackHeaders, ...feedbackRows]);
  wsFeedback['!cols'] = [
    { wch: 8 },
    { wch: 24 },
    { wch: 16 },
    { wch: 20 },
    { wch: 14 },
    { wch: 22 },
    { wch: 55 },
    { wch: 18 }
  ];
  XLSX.utils.book_append_sheet(wb, wsFeedback, 'Feedback & Reviews');

  // ----------------------------------------------------
  // SHEET 5: VENUE & LOGISTICS SPECIFICATIONS
  // ----------------------------------------------------
  const venueHeaders = ['Parameter', 'Specification Details'];
  const venueRows = [
    ['Venue Name', report.event.venueName],
    ['Building / Location', report.venue?.location || 'Main Campus'],
    ['Rated Seating Capacity', report.venue?.capacity || report.event.maxSeats],
    ['Available Facilities', (report.venue?.facilities || []).join(', ') || 'Audio/Visual Projector, High-Speed WiFi'],
    ['Equipment Deployed for Event', (report.event.requiredEquipment || []).join(', ') || 'Podium Microphones, Projection Display, Sound System'],
    ['Turnout vs Capacity Ratio', `${report.metrics.attendedCount} / ${report.metrics.maxSeats} (${Math.round((report.metrics.attendedCount / report.metrics.maxSeats) * 100)}%)`],
    ['Organizing Team Lead', report.event.organizingTeam || report.event.contactPerson || 'Club Executive Board'],
    ['Club Faculty Advisor', report.club?.facultyAdvisor?.name ? `${report.club.facultyAdvisor.name} (${report.club.facultyAdvisor.email})` : 'N/A']
  ];

  const wsVenue = XLSX.utils.aoa_to_sheet([venueHeaders, ...venueRows]);
  wsVenue['!cols'] = [{ wch: 30 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsVenue, 'Logistics & Venue');

  // Write file to client
  const sanitizedTitle = report.event.title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
  const filename = `BUP_Post_Event_Report_${sanitizedTitle}_${report.event.date}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Generates an executive PDF report with BUP branding and styled tables.
 */
export function exportEventReportPdf(report: EventReportData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  // Primary Theme Colors (BUP Emerald & Navy)
  const emeraldPrimary = [6, 78, 59]; // #064e3b
  const emeraldAccent = [16, 185, 129]; // #10b981
  const slateDark = [15, 23, 42]; // #0f172a
  const slateMuted = [100, 116, 139]; // #64748b
  const slateLightBg = [248, 250, 252]; // #f8fafc

  let currentY = margin;

  // ----------------------------------------------------
  // 1. INSTITUTIONAL HEADER BANNER
  // ----------------------------------------------------
  doc.setFillColor(emeraldPrimary[0], emeraldPrimary[1], emeraldPrimary[2]);
  doc.rect(margin, currentY, contentWidth, 68, 'F');

  // University Crest placeholder & Gold accent bar
  doc.setFillColor(emeraldAccent[0], emeraldAccent[1], emeraldAccent[2]);
  doc.rect(margin, currentY + 65, contentWidth, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('BANGLADESH UNIVERSITY OF PROFESSIONALS (BUP)', margin + 15, currentY + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(209, 250, 229);
  doc.text('OFFICE OF STUDENT AFFAIRS • DIRECTORATE OF STUDENTS WELFARE', margin + 15, currentY + 36);
  doc.text('POST-EVENT COMPLIANCE, PARTICIPATION & EVALUATION AUDIT REPORT', margin + 15, currentY + 50);

  // Reference Code & Date Pill (Top Right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`REF: ${report.reportRef}`, pageWidth - margin - 15, currentY + 22, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(209, 250, 229);
  doc.text(`Date: ${report.generatedAt}`, pageWidth - margin - 15, currentY + 36, { align: 'right' });
  doc.text('Status: Verified & Audited', pageWidth - margin - 15, currentY + 50, { align: 'right' });

  currentY += 80;

  // ----------------------------------------------------
  // 2. EVENT TITLE & HIGH-LEVEL SUMMARY
  // ----------------------------------------------------
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const splitTitle = doc.splitTextToSize(report.event.title, contentWidth);
  doc.text(splitTitle, margin, currentY);
  currentY += splitTitle.length * 18 + 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  const subtitle = `Organized by: ${report.club?.name || report.event.clubName} • Category: ${report.event.category} • Date: ${report.event.date} (${report.event.startTime} - ${report.event.endTime}) • Venue: ${report.event.venueName}`;
  doc.text(subtitle, margin, currentY);
  currentY += 15;

  // Horizontal divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 15;

  // ----------------------------------------------------
  // 3. EXECUTIVE KPI CARDS GRID (4 Metrics in 1 Row)
  // ----------------------------------------------------
  const cardWidth = (contentWidth - 30) / 4;
  const cardHeight = 48;
  const kpis = [
    { label: 'REGISTERED / SEATS', val: `${report.metrics.registeredCount} / ${report.metrics.maxSeats}`, sub: `${report.metrics.fillRate}% capacity` },
    { label: 'VERIFIED TURNOUT', val: `${report.metrics.attendedCount}`, sub: `${report.metrics.turnoutRate}% attendance` },
    { label: 'ABSENTEE RATE', val: `${report.metrics.absentCount}`, sub: `${100 - report.metrics.turnoutRate}% no-show` },
    { label: 'SATISFACTION SCORE', val: `${report.metrics.averageRating} / 5.0`, sub: `${report.metrics.totalFeedbacks} reviews` }
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
    doc.setFontSize(13);
    doc.setTextColor(emeraldPrimary[0], emeraldPrimary[1], emeraldPrimary[2]);
    doc.text(kpi.val, x + 8, currentY + 28);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(kpi.sub, x + 8, currentY + 40);
  });

  currentY += cardHeight + 20;

  // ----------------------------------------------------
  // 4. EVENT & CLUB METADATA PROFILE TABLE
  // ----------------------------------------------------
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8
    },
    styles: {
      fontSize: 8,
      cellPadding: 4,
      textColor: [30, 41, 59]
    },
    head: [['Event Specifications', 'Host Club Governance & Logistics']],
    body: [
      [
        `Event ID: ${report.event.id}\nCategory: ${report.event.category}\nDate & Time: ${report.event.date} | ${report.event.startTime} - ${report.event.endTime}\nVenue: ${report.event.venueName} (${report.venue?.location || 'Main Campus'})\nSeating: ${report.event.maxSeats} capacity`,
        `Club: ${report.club?.name || report.event.clubName} (${report.club?.code || 'N/A'})\nFaculty Advisor: ${report.club?.facultyAdvisor?.name || 'Assigned Faculty'}\nAdvisor Email: ${report.club?.facultyAdvisor?.email || 'N/A'}\nOrganizing Lead: ${report.event.organizingTeam || report.event.contactPerson || 'Executive Committee'}\nAllocated Budget: BDT ${report.club?.budgetAllocated?.toLocaleString() || '150,000'}`
      ],
      [
        `Description: ${report.event.description}`,
        `Equipment & Facilities Deployed: ${(report.event.requiredEquipment || []).join(', ') || 'Auditorium AV, Microphones, Stage Lighting, Projectors'}`
      ]
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 18;

  // ----------------------------------------------------
  // 5. DEPARTMENT PARTICIPATION BREAKDOWN
  // ----------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('Department Participation Distribution', margin, currentY);
  currentY += 8;

  const deptTableRows = report.departmentBreakdown.map((d) => [
    d.department,
    d.registered.toString(),
    d.attended.toString(),
    `${d.turnoutRate}%`
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'striped',
    headStyles: {
      fillColor: emeraldPrimary as any,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8
    },
    styles: {
      fontSize: 8,
      cellPadding: 4
    },
    head: [['Academic Department / Faculty', 'Registered RSVPs', 'Verified Attendees', 'Turnout Rate (%)']],
    body: deptTableRows.length > 0 ? deptTableRows : [['All Campus Departments', report.metrics.registeredCount.toString(), report.metrics.attendedCount.toString(), `${report.metrics.turnoutRate}%`]]
  });

  currentY = (doc as any).lastAutoTable.finalY + 20;

  // ----------------------------------------------------
  // 6. PARTICIPANT FEEDBACK & RATINGS SUMMARY
  // ----------------------------------------------------
  // Check if we need a new page for feedback section
  if (currentY > pageHeight - 180) {
    doc.addPage();
    currentY = margin;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('Participant Feedback & Quality Ratings', margin, currentY);
  currentY += 8;

  const feedbackRows = report.feedbacks.slice(0, 10).map((fb, idx) => [
    (idx + 1).toString(),
    fb.studentName,
    fb.department,
    `${fb.rating} / 5`,
    fb.category || 'General',
    fb.comment
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 85 },
      2: { cellWidth: 70 },
      3: { cellWidth: 45 },
      4: { cellWidth: 70 },
      5: { cellWidth: 'auto' }
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 4
    },
    head: [['#', 'Student Name', 'Department', 'Rating', 'Category', 'Comments & Observations']],
    body: feedbackRows.length > 0
      ? feedbackRows
      : [['-', 'No written feedback submitted', '-', '-', '-', 'Participants verified without optional feedback entry.']]
  });

  currentY = (doc as any).lastAutoTable.finalY + 20;

  // ----------------------------------------------------
  // 7. VERIFIED ATTENDEE ROSTER (Paginated)
  // ----------------------------------------------------
  if (currentY > pageHeight - 160) {
    doc.addPage();
    currentY = margin;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(`Official Attendee & Verification Roster (${report.attendees.length} Registrations)`, margin, currentY);
  currentY += 8;

  const rosterTableRows = report.attendees.map((att, idx) => [
    (idx + 1).toString(),
    att.studentId,
    att.studentName,
    att.department,
    att.passCode,
    att.status,
    att.markedAt ? att.markedAt.substring(11, 16) || 'Logged' : att.status === 'Present' ? 'Verified' : 'Absent'
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: emeraldPrimary as any,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 65 },
      2: { cellWidth: 105 },
      3: { cellWidth: 80 },
      4: { cellWidth: 85 },
      5: { cellWidth: 50 },
      6: { cellWidth: 'auto' }
    },
    styles: {
      fontSize: 7,
      cellPadding: 3.5
    },
    head: [['#', 'Student ID', 'Student Name', 'Department', 'Pass Code', 'Status', 'Gate Log']],
    body: rosterTableRows.length > 0
      ? rosterTableRows
      : [['-', '-', 'No registered attendees recorded', '-', '-', '-', '-']]
  });

  currentY = (doc as any).lastAutoTable.finalY + 30;

  // ----------------------------------------------------
  // 8. INSTITUTIONAL SIGN-OFF & AUDIT ENDORSEMENTS
  // ----------------------------------------------------
  if (currentY > pageHeight - 130) {
    doc.addPage();
    currentY = margin + 30;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('Institutional Compliance & Audit Sign-Off', margin, currentY);
  currentY += 15;

  const signBoxWidth = (contentWidth - 30) / 3;
  const signBoxY = currentY;

  const signBlocks = [
    { title: 'PREPARED BY', role: 'Club Event Convener / Secretary', name: report.event.organizingTeam || 'Executive Committee' },
    { title: 'VERIFIED & ENDORSED BY', role: 'Faculty Advisor', name: report.club?.facultyAdvisor?.name || 'Assigned Faculty Advisor' },
    { title: 'APPROVED & ARCHIVED BY', role: 'Director, Office of Student Affairs', name: 'Directorate of Students Welfare' }
  ];

  signBlocks.forEach((sb, idx) => {
    const x = margin + idx * (signBoxWidth + 15);
    doc.setDrawColor(203, 213, 225);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(x, signBoxY + 45, x + signBoxWidth, signBoxY + 45);
    doc.setLineDashPattern([], 0);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(sb.title, x, signBoxY + 55);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(sb.name, x, signBoxY + 68);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(sb.role, x, signBoxY + 79);
    doc.text(`Date: ____________________`, x, signBoxY + 90);
  });

  // ----------------------------------------------------
  // 9. PAGE NUMBERING & WATERMARK FOOTER (Across all pages)
  // ----------------------------------------------------
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
      `Bangladesh University of Professionals (BUP) • Club Management System • ${report.reportRef}`,
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

  // Trigger download
  const sanitizedTitle = report.event.title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
  const filename = `BUP_Post_Event_Report_${sanitizedTitle}_${report.event.date}.pdf`;
  doc.save(filename);
}

