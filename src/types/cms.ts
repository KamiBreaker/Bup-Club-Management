export type UserRole = 'Student' | 'Club_Exec' | 'Faculty_Advisor' | 'Venue_Admin' | 'System_Admin';

export interface UserProfile {
  id: string;
  name: string;
  studentId: string;
  department: string;
  batch: string;
  email: string;
  role: UserRole;
  clubMemberships: { clubId: string; roleName: string; status: 'Active' | 'Pending' | 'Inactive' }[];
  avatarUrl: string;
}

export interface Club {
  id: string;
  code: string;
  name: string;
  category: 'Cultural' | 'Technical' | 'Business' | 'Sports' | 'Academic' | 'Social Work';
  department: string;
  foundingYear: number;
  logoUrl: string;
  bannerUrl: string;
  tagline: string;
  description: string;
  facultyAdvisor: { name: string; designation: string; email: string };
  executives: { name: string; designation: string; studentId: string; avatar: string }[];
  memberCount: number;
  featuredEventsCount: number;
  budgetAllocated: number;
  status: 'Active' | 'Pending Approval' | 'Inactive';
  recruitmentOpen?: boolean;
  recruitmentDeadline?: string;
  membershipRequirements?: string[];
  objectives?: string[];
  achievements?: string[];
}

export interface MembershipApplication {
  id: string;
  clubId: string;
  clubName: string;
  userId: string;
  applicantName: string;
  studentId: string;
  department: string;
  batch: string;
  email: string;
  phone?: string;
  roleName: string;
  applicationType?: 'Member' | 'Executive' | 'Moderator';
  status: 'Pending' | 'Approved' | 'Rejected' | 'Action Required';
  statementOfPurpose: string;
  skillsInterests: string;
  applicationDate: string;
  decisionDate?: string;
  decisionBy?: string;
  decisionRemarks?: string;
  questionPrompt?: string;
  questionAskedBy?: string;
  questionDate?: string;
  studentAnswer?: string;
  answerDate?: string;
}

export interface ClubEvent {
  id: string;
  clubId: string;
  clubName: string;
  clubLogo: string;
  title: string;
  category: 'Workshop' | 'Competition' | 'Cultural' | 'Seminar' | 'Recruitment' | 'Training';
  description: string;
  posterUrl: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;
  venueId: string;
  venueName: string;
  maxSeats: number;
  registeredCount: number;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';
  isRSVPAllowed: boolean;
  registeredUserIds: string[];
  attendeeUserIds: string[];
  registrationDeadline?: string;
  contactPerson?: string;
  organizingTeam?: string;
  requiredEquipment?: string[];
}

export interface EventRegistration {
  id: string;
  eventId: string;
  eventTitle: string;
  clubName?: string;
  userId: string;
  studentId: string;
  studentName: string;
  department: string;
  email: string;
  passCode: string; // e.g. "BUP-PASS-9042"
  registrationDate: string;
  status: 'Confirmed' | 'Cancelled';
  attended?: boolean;
}

export interface AttendanceRecord {
  id: string;
  eventId: string;
  eventTitle?: string;
  userId: string;
  studentId: string;
  studentName: string;
  department?: string;
  status: 'Present' | 'Absent';
  markedAt: string;
  markedBy: string;
}

export interface ClubAnnouncement {
  id: string;
  clubId: string;
  clubName: string;
  title: string;
  content: string;
  priority: 'Normal' | 'Urgent';
  createdAt: string;
  createdBy: string;
}

export interface Venue {
  id: string;
  name: string;
  code: string;
  location: string;
  capacity: number;
  facilities: string[];
  imageUrl: string;
  status: 'Available' | 'Maintenance' | 'Booked';
}

export interface VenueBooking {
  id: string;
  eventId?: string;
  eventTitle: string;
  clubId: string;
  clubName: string;
  venueId: string;
  venueName: string;
  bookingDate: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  expectedAttendance: number;
  requestedEquipment: string[];
  purpose: string;
  status: 'Approved' | 'Pending' | 'Rejected' | 'Cancelled';
  conflictDetected: boolean;
  conflictReason?: string;
  submittedBy: string;
  reviewedBy?: string;
  decisionDate?: string;
  createdAt: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'Approval' | 'Reminder' | 'Event' | 'System' | 'Action_Required';
  targetRoles: UserRole[];
  targetUserId?: string;
  read: boolean;
  timestamp: string;
  actionType?: 'qna_reply' | 'view_application' | 'view_event';
  applicationId?: string;
  clubId?: string;
  clubName?: string;
  questionPrompt?: string;
}

export interface AnalyticsSummary {
  totalClubs: number;
  totalActiveMembers: number;
  totalEventsConducted: number;
  avgAttendanceRate: number;
  pendingVenueApprovals: number;
  pendingMemberApprovals: number;
  venueUtilization: { name: string; hoursBooked: number; bookingsCount: number }[];
  clubActivityMetrics: { clubCode: string; eventsCount: number; memberCount: number; engagementScore: number }[];
  monthlyRegistrations: { month: string; rsvps: number; newMembers: number }[];
}
