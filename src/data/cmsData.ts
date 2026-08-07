import { Club, ClubEvent, Venue, VenueBooking, SystemNotification, AnalyticsSummary, UserProfile } from '../types/cms';

export const INITIAL_USER_PROFILES: UserProfile[] = [
  {
    id: 'USR-101',
    name: 'Tanvir Hossain',
    studentId: '21041001',
    department: 'Information and Communication Engineering (ICE)',
    batch: '2021',
    email: 'tanvir.21041001@bup.edu.bd',
    role: 'Student',
    clubMemberships: [
      { clubId: 'CLUB-01', roleName: 'General Member', status: 'Active' },
      { clubId: 'CLUB-02', roleName: 'General Member', status: 'Active' }
    ],
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'
  },
  {
    id: 'USR-102',
    name: 'Anika Rahman',
    studentId: '21041042',
    department: 'Computer Science and Engineering (CSE)',
    batch: '2021',
    email: 'anika.21041042@bup.edu.bd',
    role: 'Club_Exec',
    clubMemberships: [
      { clubId: 'CLUB-02', roleName: 'President', status: 'Active' },
      { clubId: 'CLUB-01', roleName: 'Executive Member', status: 'Active' }
    ],
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80'
  },
  {
    id: 'USR-103',
    name: 'Dr. Shahriar Parvez',
    studentId: 'FAC-802',
    department: 'Department of ICT',
    batch: 'Faculty',
    email: 'shahriar.parvez@bup.edu.bd',
    role: 'Faculty_Advisor',
    clubMemberships: [],
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80'
  },
  {
    id: 'USR-104',
    name: 'Khandakar M. Alam',
    studentId: 'ADM-109',
    department: 'BUP Facilities & Estates Office',
    batch: 'Admin Staff',
    email: 'facilities@bup.edu.bd',
    role: 'Venue_Admin',
    clubMemberships: [],
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80'
  },
  {
    id: 'USR-105',
    name: 'Dean ICT Office',
    studentId: 'SYS-001',
    department: 'Faculty of Science and Technology (FST)',
    batch: 'System Admin',
    email: 'admin.cms@bup.edu.bd',
    role: 'System_Admin',
    clubMemberships: [],
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80'
  }
];

export const BUP_CLUBS: Club[] = [
  {
    id: 'CLUB-01',
    code: 'BUPCF',
    name: 'BUP Cultural Forum',
    category: 'Cultural',
    department: 'University-wide',
    foundingYear: 2011,
    logoUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=200&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    tagline: 'Celebrating Art, Music, and Bangladesh Heritage',
    description: 'BUP Cultural Forum is the flagship socio-cultural club of BUP responsible for organizing national day celebrations, musical concerts, drama festivals, and talent hunts.',
    facultyAdvisor: { name: 'Prof. Nusrat Jahan', designation: 'Associate Professor, Dept. of English', email: 'nusrat.jahan@bup.edu.bd' },
    executives: [
      { name: 'Sabrina Islam', designation: 'President', studentId: '20041012', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
      { name: 'Mahir Faisal', designation: 'General Secretary', studentId: '20041088', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' }
    ],
    memberCount: 340,
    featuredEventsCount: 14,
    budgetAllocated: 120000,
    status: 'Active'
  },
  {
    id: 'CLUB-02',
    code: 'BUPRRC',
    name: 'BUP Robotics & Research Club',
    category: 'Technical',
    department: 'Faculty of Science and Technology (FST)',
    foundingYear: 2016,
    logoUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=200&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    tagline: 'Innovating Autonomous Systems & AI for Tomorrow',
    description: 'BUPRRC fosters hands-on engineering, IoT systems, autonomous robotics, AI hackathons, and international competition teams.',
    facultyAdvisor: { name: 'Dr. Shahriar Parvez', designation: 'Associate Professor, Dept. of ICT', email: 'shahriar.parvez@bup.edu.bd' },
    executives: [
      { name: 'Anika Rahman', designation: 'President', studentId: '21041042', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80' },
      { name: 'Redwan Ahmed', designation: 'General Secretary', studentId: '21041009', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80' }
    ],
    memberCount: 210,
    featuredEventsCount: 18,
    budgetAllocated: 150000,
    status: 'Active'
  },
  {
    id: 'CLUB-03',
    code: 'BCC',
    name: 'BUP Career Development Club',
    category: 'Business',
    department: 'Faculty of Business Studies (FBS)',
    foundingYear: 2013,
    logoUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=200&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80',
    tagline: 'Bridging Academic Excellence with Corporate Leadership',
    description: 'BCC connects students with industry leaders, corporate recruitment drives, case competitions, resume workshops, and executive networking sessions.',
    facultyAdvisor: { name: 'Dr. S. M. Ali', designation: 'Professor, Dept. of Business Administration', email: 'ali.sm@bup.edu.bd' },
    executives: [
      { name: 'Abrar Hasan', designation: 'President', studentId: '20021004', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80' }
    ],
    memberCount: 480,
    featuredEventsCount: 22,
    budgetAllocated: 200000,
    status: 'Active'
  },
  {
    id: 'CLUB-04',
    code: 'BUPDC',
    name: 'BUP Debating Club',
    category: 'Academic',
    department: 'University-wide',
    foundingYear: 2010,
    logoUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=200&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
    tagline: 'Reason, Rhetoric, and National Championship Debates',
    description: 'BUPDC trains speakers in Asian Parliamentary and British Parliamentary debate formats, representing BUP in national and international tournaments.',
    facultyAdvisor: { name: 'Lecturer Fahmida Hoque', designation: 'Dept. of International Relations', email: 'fahmida.ir@bup.edu.bd' },
    executives: [
      { name: 'Nafis Chowdhury', designation: 'President', studentId: '21011033', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80' }
    ],
    memberCount: 190,
    featuredEventsCount: 12,
    budgetAllocated: 110000,
    status: 'Active'
  },
  {
    id: 'CLUB-05',
    code: 'BUPSC',
    name: 'BUP Sports Club',
    category: 'Sports',
    department: 'University-wide',
    foundingYear: 2012,
    logoUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=200&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
    tagline: 'Championing Athletic Spirit and Teamwork',
    description: 'BUPSC organizes inter-departmental football, cricket, badminton, table tennis leagues, and annual athletic meets.',
    facultyAdvisor: { name: 'Major Farhan Karim', designation: 'Director of Physical Education', email: 'farhan.sports@bup.edu.bd' },
    executives: [
      { name: 'Tarikul Islam', designation: 'President', studentId: '20051019', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80' }
    ],
    memberCount: 520,
    featuredEventsCount: 15,
    budgetAllocated: 250000,
    status: 'Active'
  }
];

export const BUP_VENUES: Venue[] = [
  {
    id: 'VEN-01',
    name: 'BUP Multipurpose Hall',
    code: 'MPH-01',
    location: 'Main Academic Building, Ground Floor',
    capacity: 600,
    facilities: ['PA System', 'Projector & Dual Screens', 'Central AC', 'Stage Lighting', 'VIP Lounge'],
    imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    status: 'Available'
  },
  {
    id: 'VEN-02',
    name: 'Plaza Auditorium',
    code: 'PLZ-AUD',
    location: 'BUP Plaza Complex, Level 2',
    capacity: 350,
    facilities: ['Acoustic Panels', 'Digital Podium', 'Podium Mics', 'Projector'],
    imageUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
    status: 'Available'
  },
  {
    id: 'VEN-03',
    name: 'ICT Advanced Hardware & IoT Lab 402',
    code: 'LAB-402',
    location: 'FST Building, 4th Floor',
    capacity: 60,
    facilities: ['High-speed LAN', 'Soldering Stations', 'Arduino/Raspberry Pi Kits', 'Interactive Smartboard'],
    imageUrl: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=800&q=80',
    status: 'Available'
  },
  {
    id: 'VEN-04',
    name: 'BUP Central Campus Field',
    code: 'MAIN-FLD',
    location: 'Central Campus Outdoor Complex',
    capacity: 1200,
    facilities: ['Floodlights', 'Sound System Setup Access', 'First Aid Pavilion'],
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
    status: 'Available'
  },
  {
    id: 'VEN-05',
    name: 'Annex Building Conference Room 204',
    code: 'CONF-204',
    location: 'Annex Block, 2nd Floor',
    capacity: 40,
    facilities: ['Executive Boardroom Table', 'Video Conferencing Setup', 'AC', 'Coffee Machine Access'],
    imageUrl: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=800&q=80',
    status: 'Available'
  }
];

export const BUP_EVENTS: ClubEvent[] = [
  {
    id: 'EVT-101',
    clubId: 'CLUB-02',
    clubName: 'BUP Robotics & Research Club',
    clubLogo: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=200&q=80',
    title: 'BUP RoboFest 2026: Autonomous Line Follower & AI Bot Battle',
    category: 'Competition',
    description: 'National robotics contest featuring Line Following Robots (LFR), Soccer Bots, and AI Object Recognition challenges with BDT 1,00,000 prize pool.',
    posterUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    date: '2026-08-18',
    startTime: '09:00',
    endTime: '17:00',
    venueId: 'VEN-01',
    venueName: 'BUP Multipurpose Hall',
    maxSeats: 250,
    registeredCount: 184,
    status: 'Upcoming',
    isRSVPAllowed: true,
    registeredUserIds: ['USR-101', 'USR-102'],
    attendeeUserIds: []
  },
  {
    id: 'EVT-102',
    clubId: 'CLUB-01',
    clubName: 'BUP Cultural Forum',
    clubLogo: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=200&q=80',
    title: 'Aalor Kolotan: Monsoon Cultural Evening & Musical Drama',
    category: 'Cultural',
    description: 'An evening of classical music, traditional dance choreography, and live acoustic band performances by BUP students.',
    posterUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    date: '2026-08-22',
    startTime: '16:00',
    endTime: '20:30',
    venueId: 'VEN-02',
    venueName: 'Plaza Auditorium',
    maxSeats: 300,
    registeredCount: 290,
    status: 'Upcoming',
    isRSVPAllowed: true,
    registeredUserIds: ['USR-101'],
    attendeeUserIds: []
  },
  {
    id: 'EVT-103',
    clubId: 'CLUB-03',
    clubName: 'BUP Career Development Club',
    clubLogo: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=200&q=80',
    title: 'Corporate Leadership Summit & Resume Masterclass',
    category: 'Workshop',
    description: 'Interactive session with HR directors from top MNCs on mastering corporate interviews, ATS resume formatting, and LinkedIn networking.',
    posterUrl: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=800&q=80',
    date: '2026-08-12',
    startTime: '10:30',
    endTime: '13:00',
    venueId: 'VEN-02',
    venueName: 'Plaza Auditorium',
    maxSeats: 200,
    registeredCount: 165,
    status: 'Upcoming',
    isRSVPAllowed: true,
    registeredUserIds: ['USR-101'],
    attendeeUserIds: []
  },
  {
    id: 'EVT-104',
    clubId: 'CLUB-04',
    clubName: 'BUP Debating Club',
    clubLogo: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=200&q=80',
    title: 'Inter-Departmental Parliamentary Debate Championship',
    category: 'Competition',
    description: '32 teams competing in Asian Parliamentary format debating contemporary economic and technological ethics topics.',
    posterUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80',
    date: '2026-08-28',
    startTime: '09:30',
    endTime: '18:00',
    venueId: 'VEN-05',
    venueName: 'Annex Building Conference Room 204',
    maxSeats: 80,
    registeredCount: 72,
    status: 'Upcoming',
    isRSVPAllowed: true,
    registeredUserIds: [],
    attendeeUserIds: []
  }
];

export const INITIAL_VENUE_BOOKINGS: VenueBooking[] = [
  {
    id: 'BK-901',
    eventId: 'EVT-101',
    eventTitle: 'BUP RoboFest 2026: Autonomous Line Follower',
    clubId: 'CLUB-02',
    clubName: 'BUP Robotics & Research Club',
    venueId: 'VEN-01',
    venueName: 'BUP Multipurpose Hall',
    bookingDate: '2026-08-18',
    startTime: '08:00',
    endTime: '18:00',
    expectedAttendance: 250,
    requestedEquipment: ['PA System', 'Dual Projector', 'Stage Extension'],
    purpose: 'National Robotics Competition and Exhibition',
    status: 'Approved',
    conflictDetected: false,
    submittedBy: 'Anika Rahman (Club Exec)',
    reviewedBy: 'Khandakar M. Alam (Facilities Admin)',
    createdAt: '2026-08-01 10:15'
  },
  {
    id: 'BK-902',
    eventId: 'EVT-102',
    eventTitle: 'Aalor Kolotan: Monsoon Cultural Evening',
    clubId: 'CLUB-01',
    clubName: 'BUP Cultural Forum',
    venueId: 'VEN-02',
    venueName: 'Plaza Auditorium',
    bookingDate: '2026-08-22',
    startTime: '15:00',
    endTime: '21:00',
    expectedAttendance: 300,
    requestedEquipment: ['Stage Lighting', 'Podium Mics', 'Acoustic Sound Board'],
    purpose: 'Annual Cultural Performance',
    status: 'Approved',
    conflictDetected: false,
    submittedBy: 'Sabrina Islam (Club Exec)',
    reviewedBy: 'Khandakar M. Alam (Facilities Admin)',
    createdAt: '2026-08-02 14:20'
  },
  {
    id: 'BK-903',
    eventTitle: 'Inter-Club General Body Meeting',
    clubId: 'CLUB-03',
    clubName: 'BUP Career Development Club',
    venueId: 'VEN-05',
    venueName: 'Annex Building Conference Room 204',
    bookingDate: '2026-08-20',
    startTime: '11:00',
    endTime: '13:00',
    expectedAttendance: 35,
    requestedEquipment: ['Projector', 'AC'],
    purpose: 'Executive Committee Quarterly Review',
    status: 'Pending',
    conflictDetected: false,
    submittedBy: 'Abrar Hasan (Club Exec)',
    createdAt: '2026-08-04 09:10'
  }
];

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'NT-501',
    title: 'Venue Booking Approved!',
    message: 'Your booking request for BUP Multipurpose Hall on Aug 18, 2026 has been approved by the Facilities Office.',
    type: 'Approval',
    targetRoles: ['Club_Exec', 'Student'],
    read: false,
    timestamp: '2026-08-04 11:30'
  },
  {
    id: 'NT-502',
    title: 'Event Reminder: RoboFest 2026',
    message: 'RoboFest 2026 starts in 13 days! Make sure to present your QR digital pass at the entrance.',
    type: 'Reminder',
    targetRoles: ['Student', 'Club_Exec'],
    read: false,
    timestamp: '2026-08-05 08:00'
  },
  {
    id: 'NT-503',
    title: 'New Member Application',
    message: 'Tanvir Hossain applied to join BUP Robotics & Research Club. Review in Admin Panel.',
    type: 'Event',
    targetRoles: ['Club_Exec', 'Faculty_Advisor'],
    read: true,
    timestamp: '2026-08-03 16:45'
  }
];

export const INITIAL_ANALYTICS: AnalyticsSummary = {
  totalClubs: 8,
  totalActiveMembers: 2450,
  totalEventsConducted: 81,
  avgAttendanceRate: 88.4,
  pendingVenueApprovals: 2,
  pendingMemberApprovals: 14,
  venueUtilization: [
    { name: 'Multipurpose Hall', hoursBooked: 142, bookingsCount: 28 },
    { name: 'Plaza Auditorium', hoursBooked: 110, bookingsCount: 22 },
    { name: 'IoT Lab 402', hoursBooked: 85, bookingsCount: 19 },
    { name: 'Central Campus Field', hoursBooked: 96, bookingsCount: 12 },
    { name: 'Annex Conf Room 204', hoursBooked: 48, bookingsCount: 14 }
  ],
  clubActivityMetrics: [
    { clubCode: 'BUPCF', eventsCount: 14, memberCount: 340, engagementScore: 94 },
    { clubCode: 'BUPRRC', eventsCount: 18, memberCount: 210, engagementScore: 92 },
    { clubCode: 'BCC', eventsCount: 22, memberCount: 480, engagementScore: 96 },
    { clubCode: 'BUPDC', eventsCount: 12, memberCount: 190, engagementScore: 89 },
    { clubCode: 'BUPSC', eventsCount: 15, memberCount: 520, engagementScore: 91 }
  ],
  monthlyRegistrations: [
    { month: 'Mar', rsvps: 310, newMembers: 120 },
    { month: 'Apr', rsvps: 450, newMembers: 180 },
    { month: 'May', rsvps: 520, newMembers: 210 },
    { month: 'Jun', rsvps: 390, newMembers: 140 },
    { month: 'Jul', rsvps: 680, newMembers: 310 },
    { month: 'Aug', rsvps: 820, newMembers: 390 }
  ]
};
