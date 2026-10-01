import {
  Club,
  ClubEvent,
  Venue,
  VenueBooking,
  SystemNotification,
  AnalyticsSummary,
  UserProfile,
  MembershipApplication,
  EventRegistration,
  AttendanceRecord,
  ClubAnnouncement
} from '../types/cms';

export const INITIAL_USER_PROFILES: UserProfile[] = [
  {
    id: 'USR-ADMIN',
    name: 'System Administrator',
    studentId: 'SYS-001',
    department: 'Administration & Student Affairs',
    batch: 'Staff',
    email: 'admin@bup.edu.bd',
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
    facultyAdvisor: { name: '', designation: '', email: '' },
    executives: [],
    memberCount: 0,
    featuredEventsCount: 0,
    budgetAllocated: 120000,
    status: 'Active',
    recruitmentOpen: true,
    recruitmentDeadline: '2026-10-31',
    membershipRequirements: ['Enrolled BUP Undergraduate / Graduate student', 'Passion for performing arts, music, or event management'],
    objectives: ['Promote national heritage', 'Host campus cultural programs', 'Nurture student talent'],
    achievements: ['Champion in National Inter-University Drama Festival', 'Over 50+ stage performances']
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
    facultyAdvisor: { name: '', designation: '', email: '' },
    executives: [],
    memberCount: 0,
    featuredEventsCount: 0,
    budgetAllocated: 150000,
    status: 'Active',
    recruitmentOpen: true,
    recruitmentDeadline: '2026-10-31',
    membershipRequirements: ['Interest in robotics, embedded electronics, or software', 'Commitment to laboratory projects'],
    objectives: ['Build competitive robotics teams', 'Host annual RoboFest', 'Conduct STEM outreach'],
    achievements: ['1st Runner-Up in National RoboTech', '3 published undergraduate research papers']
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
    facultyAdvisor: { name: '', designation: '', email: '' },
    executives: [],
    memberCount: 0,
    featuredEventsCount: 0,
    budgetAllocated: 200000,
    status: 'Active',
    recruitmentOpen: true,
    recruitmentDeadline: '2026-10-31',
    membershipRequirements: ['Enrolled BUP Student', 'Strong motivation for professional career growth'],
    objectives: ['Facilitate campus recruitment', 'Organize corporate summits', 'Provide resume and interview coaching'],
    achievements: ['Organized BUP Career Expo with 60+ MNCs', 'Over 1,200 alumni placements']
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
    facultyAdvisor: { name: '', designation: '', email: '' },
    executives: [],
    memberCount: 0,
    featuredEventsCount: 0,
    budgetAllocated: 110000,
    status: 'Active',
    recruitmentOpen: true,
    recruitmentDeadline: '2026-10-31',
    membershipRequirements: ['Interest in public speaking, critical thinking, and current affairs'],
    objectives: ['Develop parliamentary debating skills', 'Host Inter-University Debate Champions Cup'],
    achievements: ['Champion in BDF National Debate Festival', 'Quarterfinalist in Asians Debating Championship']
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
    facultyAdvisor: { name: '', designation: '', email: '' },
    executives: [],
    memberCount: 0,
    featuredEventsCount: 0,
    budgetAllocated: 250000,
    status: 'Active',
    recruitmentOpen: true,
    recruitmentDeadline: '2026-10-31',
    membershipRequirements: ['Enrolled student with fitness and passion for sports'],
    objectives: ['Organize intra-university sports leagues', 'Train university sports squads'],
    achievements: ['Champions in Inter-University Football Tournament', 'Hosted BUP Olympiad']
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
    title: 'BUP RoboFest: Autonomous Line Follower & AI Bot Battle',
    category: 'Competition',
    description: 'Robotics contest featuring Line Following Robots (LFR), Soccer Bots, and AI Object Recognition challenges with certificates and awards.',
    posterUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    date: '2026-11-15',
    startTime: '09:00',
    endTime: '17:00',
    venueId: 'VEN-01',
    venueName: 'BUP Multipurpose Hall',
    maxSeats: 250,
    registeredCount: 0,
    status: 'Upcoming',
    isRSVPAllowed: true,
    registeredUserIds: [],
    attendeeUserIds: []
  },
  {
    id: 'EVT-102',
    clubId: 'CLUB-01',
    clubName: 'BUP Cultural Forum',
    clubLogo: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=200&q=80',
    title: 'Aalor Kolotan: Campus Cultural Evening & Musical Drama',
    category: 'Cultural',
    description: 'An evening of classical music, traditional dance choreography, and live acoustic band performances by BUP students.',
    posterUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    date: '2026-11-20',
    startTime: '16:00',
    endTime: '20:30',
    venueId: 'VEN-02',
    venueName: 'Plaza Auditorium',
    maxSeats: 300,
    registeredCount: 0,
    status: 'Upcoming',
    isRSVPAllowed: true,
    registeredUserIds: [],
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
    date: '2026-11-25',
    startTime: '10:30',
    endTime: '13:00',
    venueId: 'VEN-02',
    venueName: 'Plaza Auditorium',
    maxSeats: 200,
    registeredCount: 0,
    status: 'Upcoming',
    isRSVPAllowed: true,
    registeredUserIds: [],
    attendeeUserIds: []
  }
];

export const INITIAL_VENUE_BOOKINGS: VenueBooking[] = [];

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [];

export const INITIAL_ANALYTICS: AnalyticsSummary = {
  totalClubs: 5,
  totalActiveMembers: 0,
  totalEventsConducted: 0,
  avgAttendanceRate: 0,
  pendingVenueApprovals: 0,
  pendingMemberApprovals: 0,
  venueUtilization: [
    { name: 'Multipurpose Hall', hoursBooked: 0, bookingsCount: 0 },
    { name: 'Plaza Auditorium', hoursBooked: 0, bookingsCount: 0 },
    { name: 'IoT Lab 402', hoursBooked: 0, bookingsCount: 0 },
    { name: 'Central Campus Field', hoursBooked: 0, bookingsCount: 0 },
    { name: 'Annex Conf Room 204', hoursBooked: 0, bookingsCount: 0 }
  ],
  clubActivityMetrics: [
    { clubCode: 'BUPCF', eventsCount: 0, memberCount: 0, engagementScore: 0 },
    { clubCode: 'BUPRRC', eventsCount: 0, memberCount: 0, engagementScore: 0 },
    { clubCode: 'BCC', eventsCount: 0, memberCount: 0, engagementScore: 0 },
    { clubCode: 'BUPDC', eventsCount: 0, memberCount: 0, engagementScore: 0 },
    { clubCode: 'BUPSC', eventsCount: 0, memberCount: 0, engagementScore: 0 }
  ],
  monthlyRegistrations: []
};

export const INITIAL_APPLICATIONS: MembershipApplication[] = [];

export const INITIAL_REGISTRATIONS: EventRegistration[] = [];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];

export const INITIAL_ANNOUNCEMENTS: ClubAnnouncement[] = [];
