import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  MembershipApplication,
  Club,
  UserProfile,
  UserRole
} from '../../types/cms';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  FileText,
  UserCheck,
  Send,
  Download,
  Sparkles,
  Phone,
  Mail,
  GraduationCap,
  Building,
  AlertCircle,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  MessageSquareQuote,
  HelpCircle,
  SendHorizontal,
  AlertTriangle,
  Award,
  UserPlus,
  Trash2
} from 'lucide-react';
import { soundFx } from '../../utils/audioFx';

interface MembershipHubProps {
  applications: MembershipApplication[];
  clubs: Club[];
  users: UserProfile[];
  currentUser: UserProfile;
  selectedRole: UserRole;
  onReviewApplication: (applicationId: string, status: 'Approved' | 'Rejected', remarks?: string) => void;
  onRequestApplicationInfo?: (applicationId: string, question: string) => Promise<void> | void;
  onRespondQna?: (applicationId: string, answer: string) => Promise<void> | void;
  onApplyForClub?: (clubId?: string) => void;
  onAppointExecutive?: (clubId: string, targetUserId: string, designation: string) => Promise<void> | void;
  onRemoveExecutive?: (clubId: string, studentId: string) => Promise<void> | void;
}

export const MembershipHub: React.FC<MembershipHubProps> = ({
  applications = [],
  clubs = [],
  users = [],
  currentUser,
  selectedRole,
  onReviewApplication,
  onRequestApplicationInfo,
  onRespondQna,
  onApplyForClub,
  onAppointExecutive,
  onRemoveExecutive
}) => {
  const [activeTab, setActiveTab] = useState<'applications' | 'roster' | 'my-applications'>('applications');
  const [selectedClubId, setSelectedClubId] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Action Required' | 'Approved' | 'Rejected'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<MembershipApplication | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Moderator Q&A Inquiry State
  const [moderatorQuestion, setModeratorQuestion] = useState('');
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [filterOnlyMyClubs, setFilterOnlyMyClubs] = useState(false);

  // Direct Executive Appointment State
  const [isAppointModalOpen, setIsAppointModalOpen] = useState(false);
  const [appointClubId, setAppointClubId] = useState(clubs[0]?.id || '');
  const [appointUserId, setAppointUserId] = useState('');
  const [appointDesignation, setAppointDesignation] = useState('Club Moderator');
  const [isSubmittingAppoint, setIsSubmittingAppoint] = useState(false);

  // Student In-line Q&A Answers (for My Applications tab)
  const [studentAnswerDrafts, setStudentAnswerDrafts] = useState<{ [appId: string]: string }>({});
  const [submittingAnswers, setSubmittingAnswers] = useState<{ [appId: string]: boolean }>({});

  const isExecutiveOrAdmin =
    selectedRole === 'Club_Exec' ||
    selectedRole === 'Faculty_Advisor' ||
    selectedRole === 'System_Admin';

  // Identify which clubs the current user moderates
  const userModeratedClubIds = useMemo(() => {
    if (selectedRole === 'System_Admin') return clubs.map((c) => c.id);
    const memberships = currentUser?.clubMemberships || [];
    const fromMemberships = memberships.filter((m) => m.status === 'Active').map((m) => m.clubId);
    const fromClubExecs = clubs
      .filter((c) => (c.executives || []).some((e) => e.studentId === currentUser?.studentId || e.name === currentUser?.name))
      .map((c) => c.id);
    return Array.from(new Set([...fromMemberships, ...fromClubExecs]));
  }, [currentUser, clubs, selectedRole]);

  const userModeratedClubs = useMemo(() => {
    return clubs.filter((c) => userModeratedClubIds.includes(c.id));
  }, [clubs, userModeratedClubIds]);

  const isModeratorForClub = (clubId: string) => {
    if (selectedRole === 'System_Admin') return true;
    return userModeratedClubIds.includes(clubId);
  };

  // Filtered applications
  const filteredApplications = useMemo(() => {
    return (applications ?? []).filter((app) => {
      if (!app) return false;
      const matchesClub = selectedClubId === 'All' || app.clubId === selectedClubId;
      const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
      const matchesOnlyMyClubs = !filterOnlyMyClubs || isModeratorForClub(app.clubId);
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        app.applicantName.toLowerCase().includes(query) ||
        app.studentId.toLowerCase().includes(query) ||
        app.department.toLowerCase().includes(query) ||
        app.clubName.toLowerCase().includes(query);

      return matchesClub && matchesStatus && matchesOnlyMyClubs && matchesSearch;
    });
  }, [applications, selectedClubId, statusFilter, filterOnlyMyClubs, searchQuery, userModeratedClubIds, selectedRole]);

  // Student's own applications
  const myApplications = useMemo(() => {
    return (applications ?? []).filter(
      (app) => app.userId === currentUser.id || app.studentId === currentUser.studentId
    );
  }, [applications, currentUser]);

  const pendingCount = (applications ?? []).filter((a) => a.status === 'Pending').length;
  const actionRequiredCount = (applications ?? []).filter((a) => a.status === 'Action Required').length;
  const approvedCount = (applications ?? []).filter((a) => a.status === 'Approved').length;

  const handleDecision = (status: 'Approved' | 'Rejected') => {
    if (!selectedApp) return;
    if (selectedApp.status === 'Approved' || selectedApp.status === 'Rejected') {
      alert(`This application has already received a permanent final decision (${selectedApp.status}) and cannot be modified.`);
      return;
    }
    if (!isModeratorForClub(selectedApp.clubId)) {
      alert(`Only designated moderators of ${selectedApp.clubName} or System Administrators can take decisions on this application.`);
      return;
    }

    setIsSubmittingReview(true);
    soundFx.playClick();

    if (status === 'Approved') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#38bdf8', '#fbbf24']
        });
      } catch {}
      soundFx.playSuccess();
    }

    onReviewApplication(selectedApp.id, status, reviewRemarks);
    setIsSubmittingReview(false);
    setSelectedApp(null);
    setReviewRemarks('');
    setIsAskingQuestion(false);
    setModeratorQuestion('');
  };

  const handleSendQuestion = async () => {
    if (!selectedApp || !moderatorQuestion.trim()) return;
    if (!isModeratorForClub(selectedApp.clubId)) {
      alert(`Only designated moderators of ${selectedApp.clubName} can request clarification.`);
      return;
    }

    setIsSubmittingQuestion(true);
    soundFx.playClick(600);

    try {
      if (onRequestApplicationInfo) {
        await onRequestApplicationInfo(selectedApp.id, moderatorQuestion.trim());
      }
      soundFx.playSuccess();
      setSelectedApp(null);
      setModeratorQuestion('');
      setIsAskingQuestion(false);
    } catch (e: any) {
      alert(e.message || 'Unable to dispatch question.');
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  const handleStudentSubmitAnswer = async (appId: string) => {
    const text = studentAnswerDrafts[appId];
    if (!text || !text.trim() || !onRespondQna) return;

    setSubmittingAnswers((prev) => ({ ...prev, [appId]: true }));
    soundFx.playSuccess();

    try {
      await onRespondQna(appId, text.trim());
      setStudentAnswerDrafts((prev) => ({ ...prev, [appId]: '' }));
    } catch (e: any) {
      alert(e.message || 'Failed to submit response.');
    } finally {
      setSubmittingAnswers((prev) => ({ ...prev, [appId]: false }));
    }
  };

  const exportRosterCsv = () => {
    soundFx.playSuccess();
    const club = clubs.find((c) => c.id === selectedClubId);
    const clubTitle = club ? club.name : 'All_Clubs';

    const header = 'Application ID,Club Name,Student Name,Student ID,Department,Batch,Email,Phone,Role,Status,Application Date,Decision Date\n';
    const rows = filteredApplications
      .map((a) =>
        `"${a.id}","${a.clubName}","${a.applicantName}","${a.studentId}","${a.department}","${a.batch}","${a.email}","${a.phone || ''}","${a.roleName}","${a.status}","${a.applicationDate}","${a.decisionDate || ''}"`
      )
      .join('\n');

    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + header + rows);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BUP_Membership_Roster_${clubTitle.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl glass-panel-glow p-6 sm:p-8 border border-emerald-500/30">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <UserCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>Membership Operations & Verification Lifecycle</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-heading">
              BUP Membership Hub
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Recruitment screening, candidate Q&A inquiries, executive moderation workflows, and official society rosters.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-3 rounded-2xl bg-slate-900/80 border border-white/10 text-center">
              <span className="text-[11px] text-amber-400 font-bold block">Pending Review</span>
              <span className="text-xl font-black text-amber-300 font-mono">{pendingCount}</span>
            </div>
            {actionRequiredCount > 0 && (
              <div className="px-4 py-3 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 text-center">
                <span className="text-[11px] text-cyan-300 font-bold block">In Q&A</span>
                <span className="text-xl font-black text-cyan-200 font-mono">{actionRequiredCount}</span>
              </div>
            )}
            <div className="px-4 py-3 rounded-2xl bg-slate-900/80 border border-white/10 text-center">
              <span className="text-[11px] text-emerald-400 font-bold block">Approved</span>
              <span className="text-xl font-black text-emerald-400 font-mono">{approvedCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-wrap space-x-1 bg-slate-900/80 p-1 rounded-xl border border-white/5 w-full md:w-auto">
          {isExecutiveOrAdmin && (
            <button
              onClick={() => {
                soundFx.playClick();
                setActiveTab('applications');
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'applications'
                  ? 'bg-emerald-400 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Executive Review Queue</span>
              {pendingCount > 0 && (
                <span className="bg-amber-400 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-extrabold">
                  {pendingCount}
                </span>
              )}
            </button>
          )}

          {isExecutiveOrAdmin && (
            <button
              onClick={() => {
                soundFx.playClick();
                setActiveTab('roster');
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'roster'
                  ? 'bg-emerald-400 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Society Roster</span>
            </button>
          )}

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('my-applications');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'my-applications'
                ? 'bg-emerald-400 text-slate-950 font-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>My Applications ({myApplications.length})</span>
            {myApplications.some((a) => a.status === 'Action Required') && (
              <span className="bg-amber-400 text-slate-950 text-[9px] px-1.5 py-0.2 rounded-full font-mono font-black animate-pulse">
                Action Needed
              </span>
            )}
          </button>
        </div>

        {activeTab !== 'my-applications' && (
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={exportRosterCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold border border-emerald-500/30 transition-all shadow-sm cursor-pointer"
              title="Export roster to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        )}
      </div>

      {/* Moderator Role Context Bar (for Executives & Admins) */}
      {isExecutiveOrAdmin && activeTab === 'applications' && (
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-300">
                {selectedRole === 'System_Admin' ? (
                  <span className="text-emerald-300 font-bold">
                    System Admin Access: Full authority to moderate and approve applications for all campus societies.
                  </span>
                ) : userModeratedClubs.length > 0 ? (
                  <span>
                    You are designated Moderator for:{' '}
                    <strong className="text-emerald-300">
                      {userModeratedClubs.map((c) => c.name).join(', ')}
                    </strong>
                  </span>
                ) : (
                  <span className="text-amber-300">
                    You do not currently moderate any clubs. You can view applications, but decisions are reserved for designated club executives.
                  </span>
                )}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Moderators can accept, decline, or ask clarification questions directly to applicants via their notification bar.
              </p>
            </div>
          </div>

          {userModeratedClubs.length > 0 && selectedRole !== 'System_Admin' && (
            <button
              onClick={() => {
                soundFx.playClick();
                setFilterOnlyMyClubs(!filterOnlyMyClubs);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shrink-0 cursor-pointer ${
                filterOnlyMyClubs
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white border-white/10'
              }`}
            >
              {filterOnlyMyClubs ? '✓ Showing My Moderated Clubs' : 'Show Only My Clubs'}
            </button>
          )}
        </div>
      )}

      {/* Filter and Search Bar for Review Queue & Roster */}
      {activeTab !== 'my-applications' && (
        <div className="glass-panel p-4 rounded-2xl border border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search candidate name, ID, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl glass-input placeholder-slate-400 focus:outline-none"
            />
          </div>

          {/* Club Filter */}
          <div>
            <select
              value={selectedClubId}
              onChange={(e) => setSelectedClubId(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl glass-input text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="All">All Societies & Clubs</option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name} {isModeratorForClub(c.id) ? '★ (Your Club)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex gap-1.5 overflow-x-auto">
            {(['All', 'Pending', 'Action Required', 'Approved', 'Rejected'] as const).map((st) => (
              <button
                key={st}
                onClick={() => {
                  soundFx.playClick();
                  setStatusFilter(st);
                }}
                className={`flex-1 py-2 px-2 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === st
                    ? 'bg-emerald-400 text-slate-950 font-black shadow'
                    : 'bg-slate-900/70 text-slate-400 hover:bg-slate-800 border border-white/5'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 1: EXECUTIVE REVIEW QUEUE */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {filteredApplications.length === 0 ? (
            <div className="glass-panel rounded-3xl p-12 text-center border border-white/10">
              <UserCheck className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h3 className="text-white font-bold text-base">No Applications Found</h3>
              <p className="text-slate-400 text-xs mt-1">There are no candidate applications matching the current filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredApplications.map((app) => {
                const canModerate = isModeratorForClub(app.clubId);

                return (
                  <motion.div
                    key={app.id}
                    whileHover={{ y: -3 }}
                    className={`glass-panel p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                      app.status === 'Pending'
                        ? 'border-amber-500/30 bg-slate-900/90 shadow-lg shadow-amber-950/20'
                        : app.status === 'Action Required'
                        ? 'border-cyan-500/40 bg-slate-900/90 shadow-lg shadow-cyan-950/20'
                        : app.status === 'Approved'
                        ? 'border-emerald-500/30 bg-slate-900/70'
                        : 'border-red-500/20 bg-slate-900/50 opacity-80'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-extrabold text-sm">{app.applicantName}</span>
                            <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                              {app.studentId}
                            </span>
                          </div>
                          <p className="text-slate-400 text-[11px] font-medium mt-0.5">
                            {app.department} • Batch {app.batch}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {canModerate ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Moderator</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded-md bg-slate-800/80 border border-white/5">
                              {app.clubName} Execs
                            </span>
                          )}

                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                              app.status === 'Pending'
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : app.status === 'Action Required'
                                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                                : app.status === 'Approved'
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-red-500/15 text-red-300 border-red-500/30'
                            }`}
                          >
                            {app.status === 'Action Required' ? 'Q&A Pending' : app.status}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1.5 text-xs">
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>Target Society:</span>
                          <strong className="text-white">{app.clubName}</strong>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>Designation Sought:</span>
                          <span className="text-emerald-400 font-semibold">{app.roleName}</span>
                        </div>
                        {(app.applicationType === 'Executive' || app.applicationType === 'Moderator' || /executive|moderator|president|secretary|treasurer/i.test(app.roleName)) && (
                          <div className="pt-0.5">
                            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black inline-flex items-center gap-1">
                              <Award className="w-3 h-3 text-amber-400" />
                              <span>👑 Executive / Moderator Candidate</span>
                            </span>
                          </div>
                        )}
                        <div className="text-[11px] text-slate-300 line-clamp-2 italic pt-1 border-t border-white/5">
                          "{app.statementOfPurpose}"
                        </div>
                        {app.skillsInterests && (
                          <div className="text-[10px] text-teal-300 font-mono pt-1">
                            Skills: {app.skillsInterests}
                          </div>
                        )}
                      </div>

                      {/* Active Q&A Clarification Callout */}
                      {app.questionPrompt && (
                        <div className="p-3 rounded-2xl bg-slate-900 border border-cyan-500/30 space-y-1.5 text-xs">
                          <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-[11px]">
                            <MessageSquareQuote className="w-3.5 h-3.5" />
                            <span>Moderator Inquiry:</span>
                          </div>
                          <p className="text-slate-200 text-xs italic bg-slate-950/60 p-2 rounded-xl border border-white/5">
                            "{app.questionPrompt}"
                          </p>

                          {app.studentAnswer ? (
                            <div className="pt-1 space-y-1">
                              <span className="text-emerald-400 font-bold text-[11px] block">
                                ✓ Candidate's Response:
                              </span>
                              <p className="text-slate-200 text-xs bg-emerald-950/30 p-2 rounded-xl border border-emerald-500/20">
                                "{app.studentAnswer}"
                              </p>
                              <span className="text-[10px] text-slate-400 block font-mono">
                                Answered on {app.answerDate || 'Recently'}
                              </span>
                            </div>
                          ) : (
                            <p className="text-[10px] text-amber-300 font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Awaiting candidate reply on their notification bar...</span>
                            </p>
                          )}
                        </div>
                      )}

                      {app.decisionRemarks && !app.questionPrompt && (
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-white/10 text-[11px] text-slate-300">
                          <span className="text-slate-400 font-semibold">Executive Remarks: </span>
                          {app.decisionRemarks}
                          <span className="block text-[10px] text-slate-500 mt-0.5">
                            Reviewed by {app.decisionBy} on {app.decisionDate}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 mt-3 border-t border-white/10 flex justify-between items-center text-xs">
                      <span className="text-[10px] text-slate-500 font-mono">
                        Applied: {app.applicationDate}
                      </span>

                      {app.status === 'Approved' ? (
                        <button
                          onClick={() => {
                            soundFx.playClick();
                            setSelectedApp(app);
                            setReviewRemarks(app.decisionRemarks || '');
                            setIsAskingQuestion(false);
                            setModeratorQuestion('');
                          }}
                          className="flex items-center gap-1.5 text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-xs px-3.5 py-1.5 rounded-xl transition-all cursor-pointer font-bold"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Decided: Approved</span>
                        </button>
                      ) : app.status === 'Rejected' ? (
                        <button
                          onClick={() => {
                            soundFx.playClick();
                            setSelectedApp(app);
                            setReviewRemarks(app.decisionRemarks || '');
                            setIsAskingQuestion(false);
                            setModeratorQuestion('');
                          }}
                          className="flex items-center gap-1.5 text-red-300 bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-xs px-3.5 py-1.5 rounded-xl transition-all cursor-pointer font-bold"
                        >
                          <XCircle className="w-3.5 h-3.5 text-red-400" />
                          <span>Decided: Rejected</span>
                        </button>
                      ) : canModerate ? (
                        <button
                          onClick={() => {
                            soundFx.playClick();
                            setSelectedApp(app);
                            setReviewRemarks(app.decisionRemarks || '');
                            setIsAskingQuestion(false);
                            setModeratorQuestion('');
                          }}
                          className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl shadow-md transition-all cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Moderate Candidate</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            soundFx.playClick();
                            setSelectedApp(app);
                            setReviewRemarks('');
                            setIsAskingQuestion(false);
                          }}
                          className="flex items-center gap-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1.5 rounded-xl border border-white/10 transition-all cursor-pointer"
                        >
                          <span>View Details</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ROSTER DIRECTORY */}
      {activeTab === 'roster' && (
        <div className="space-y-6">
          {/* Executive Leadership Section */}
          <div className="glass-panel rounded-3xl border border-white/10 p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Executive Leadership & Moderation Roster</span>
                  </span>
                </div>
                <h3 className="text-white font-extrabold text-base mt-1">
                  Accredited Club Executives & Designated Moderators
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Official members granted governance, moderation, and event management authority.
                </p>
              </div>

              {(currentUser.role === 'System_Admin' || isExecutiveOrAdmin) && onAppointExecutive && (
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setIsAppointModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-950/40 flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Appoint Executive / Moderator</span>
                </button>
              )}
            </div>

            {/* List of Executives by Club */}
            <div className="space-y-4">
              {clubs
                .filter((c) => selectedClubId === 'All' || c.id === selectedClubId)
                .map((club) => {
                  const execs = club.executives || [];
                  return (
                    <div key={club.id} className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <img
                            src={club.logoUrl}
                            alt={club.name}
                            className="w-6 h-6 rounded-lg object-cover ring-1 ring-white/10"
                          />
                          <span className="font-extrabold text-white text-xs">{club.name}</span>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            {club.code}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {execs.length} Designated Executive{execs.length === 1 ? '' : 's'}
                        </span>
                      </div>

                      {execs.length === 0 ? (
                        <div className="py-4 px-3 rounded-xl bg-slate-950/40 border border-dashed border-white/10 text-center">
                          <p className="text-xs text-slate-400">
                            No executives or moderators assigned for {club.code} yet.
                          </p>
                          {(currentUser.role === 'System_Admin' || isExecutiveOrAdmin) && (
                            <button
                              type="button"
                              onClick={() => {
                                soundFx.playClick();
                                setAppointClubId(club.id);
                                setIsAppointModalOpen(true);
                              }}
                              className="mt-2 text-xs text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                            >
                              Appoint first executive for {club.code} →
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {execs.map((exec, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl bg-slate-950/70 border border-white/10 flex items-center justify-between gap-3 group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={exec.avatar}
                                  alt={exec.name}
                                  className="w-10 h-10 rounded-xl object-cover ring-1 ring-amber-500/30 bg-slate-800 shrink-0"
                                />
                                <div className="min-w-0">
                                  <p className="font-bold text-white text-xs truncate">{exec.name}</p>
                                  <p className="text-[10px] text-amber-300 font-semibold truncate flex items-center gap-1">
                                    <Award className="w-3 h-3 text-amber-400 shrink-0" />
                                    <span>{exec.designation}</span>
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-mono truncate">ID: {exec.studentId}</p>
                                </div>
                              </div>

                              {currentUser.role === 'System_Admin' && onRemoveExecutive && (
                                <button
                                  type="button"
                                  title="Remove from Executive Roster"
                                  onClick={() => {
                                    if (confirm(`Remove ${exec.name} from ${club.name} executive committee?`)) {
                                      onRemoveExecutive(club.id, exec.studentId);
                                    }
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all cursor-pointer shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* General Members Directory Table */}
          <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-xl">
            <div className="p-5 border-b border-white/10 flex justify-between items-center">
              <div>
                <h3 className="text-white font-extrabold text-sm">Verified Society Member Directory</h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Official list of approved members for accredited BUP societies.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                {filteredApplications.filter((a) => a.status === 'Approved').length} Members
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/70 text-slate-400 font-mono text-[11px] border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">ID & Batch</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Society</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Approval Date</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredApplications
                    .filter((a) => a.status === 'Approved')
                    .map((app) => (
                      <tr key={app.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">
                            {app.applicantName.charAt(0)}
                          </div>
                          <div>
                            <span>{app.applicantName}</span>
                            <span className="block text-[10px] text-slate-400 font-normal">{app.email}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <span className="text-emerald-400 font-semibold">{app.studentId}</span>
                          <span className="text-slate-500 text-[10px] block">Batch {app.batch}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">{app.department}</td>
                        <td className="py-3.5 px-4 font-semibold text-white">{app.clubName}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            app.applicationType === 'Executive' || /executive|moderator|president|secretary/i.test(app.roleName)
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-teal-500/15 text-teal-300 border-teal-500/30'
                          }`}>
                            {app.roleName}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                          {app.decisionDate || app.applicationDate}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MY APPLICATIONS (STUDENT PERSPECTIVE) */}
      {activeTab === 'my-applications' && (
        <div className="space-y-4">
          <div className="glass-panel p-5 rounded-3xl border border-white/10 flex justify-between items-center">
            <div>
              <h3 className="text-white font-extrabold text-sm">My Club Applications & Statuses</h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Track the status of your membership submissions across BUP clubs in real time.
              </p>
            </div>
            {onApplyForClub && (
              <button
                onClick={() => onApplyForClub()}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs transition-all shadow cursor-pointer"
              >
                Apply for More Clubs
              </button>
            )}
          </div>

          {myApplications.length === 0 ? (
            <div className="glass-panel rounded-3xl p-12 text-center border border-white/10">
              <UserCheck className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h3 className="text-white font-bold text-base">You haven't applied to any clubs yet</h3>
              <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto">
                Explore the Clubs & Societies tab, choose an accredited society, and submit your recruitment application!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myApplications.map((app) => (
                <div
                  key={app.id}
                  className={`glass-panel p-5 rounded-3xl border ${
                    app.status === 'Approved'
                      ? 'border-emerald-500/40 bg-slate-900/80 shadow-lg shadow-emerald-950/20'
                      : app.status === 'Action Required'
                      ? 'border-amber-500/60 bg-slate-900/90 shadow-lg shadow-amber-950/30'
                      : app.status === 'Pending'
                      ? 'border-amber-500/40 bg-slate-900/80'
                      : 'border-red-500/30 bg-slate-900/60'
                  } space-y-3.5`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-white font-extrabold text-sm">{app.clubName}</h4>
                      <p className="text-emerald-400 text-xs font-semibold mt-0.5">{app.roleName}</p>
                    </div>

                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        app.status === 'Approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : app.status === 'Action Required'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                          : app.status === 'Pending'
                          ? 'bg-slate-800 text-slate-300 border-white/10'
                          : 'bg-red-500/20 text-red-300 border-red-500/40'
                      }`}
                    >
                      {app.status === 'Action Required'
                        ? 'Action Needed: Moderator Question'
                        : app.status === 'Pending'
                        ? 'Under Review'
                        : app.status}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/5 space-y-1.5 text-xs text-slate-300">
                    <div>
                      <span className="text-slate-400 text-[11px]">Statement of Purpose: </span>
                      <p className="text-xs italic mt-0.5">"{app.statementOfPurpose}"</p>
                    </div>
                    {app.skillsInterests && (
                      <p className="text-[11px] text-teal-300 font-mono">Skills: {app.skillsInterests}</p>
                    )}
                  </div>

                  {/* Interactive Q&A Clarification Section */}
                  {app.questionPrompt && (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-500/40 space-y-2.5 text-xs">
                      <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                        <MessageSquareQuote className="w-4 h-4" />
                        <span>Moderator Clarification Request</span>
                      </div>
                      <p className="text-slate-200 text-xs bg-slate-950/70 p-2.5 rounded-xl border border-white/10 italic">
                        "{app.questionPrompt}"
                      </p>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Asked by {app.questionAskedBy || 'Club Moderator'} on {app.questionDate || 'Recently'}
                      </span>

                      {app.studentAnswer ? (
                        <div className="pt-1 space-y-1">
                          <span className="text-emerald-400 font-bold text-[11px] block">
                            ✓ Your Submitted Response:
                          </span>
                          <p className="text-slate-200 text-xs bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-500/20">
                            "{app.studentAnswer}"
                          </p>
                          <span className="text-[10px] text-emerald-300/80 block font-mono">
                            Delivered to moderator on {app.answerDate || 'Recently'}
                          </span>
                        </div>
                      ) : (
                        <div className="pt-2 space-y-2">
                          <label className="text-slate-300 text-xs font-semibold block">
                            Type your answer to help the moderator accept your request:
                          </label>
                          <textarea
                            rows={2}
                            value={studentAnswerDrafts[app.id] || ''}
                            onChange={(e) =>
                              setStudentAnswerDrafts((prev) => ({ ...prev, [app.id]: e.target.value }))
                            }
                            placeholder="e.g. I am applying for the Robotics Software sub-team and available for Sunday workshops..."
                            className="w-full text-xs p-2.5 rounded-xl glass-input placeholder-slate-500 focus:outline-none resize-none"
                          />
                          <button
                            type="button"
                            disabled={submittingAnswers[app.id] || !studentAnswerDrafts[app.id]?.trim()}
                            onClick={() => handleStudentSubmitAnswer(app.id)}
                            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-xs transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <SendHorizontal className="w-3.5 h-3.5" />
                            <span>
                              {submittingAnswers[app.id] ? 'Submitting...' : 'Send Answer to Moderator'}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {app.decisionRemarks && !app.questionPrompt && (
                    <div className="p-3 rounded-2xl bg-slate-900 border border-white/10 text-xs space-y-1">
                      <span className="text-emerald-400 font-bold block">Executive Feedback:</span>
                      <p className="text-slate-200">{app.decisionRemarks}</p>
                      <span className="text-[10px] text-slate-500 block">
                        Reviewed by {app.decisionBy} on {app.decisionDate}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[11px] text-slate-500 pt-2 border-t border-white/5 font-mono">
                    <span>Applied on: {app.applicationDate}</span>
                    <span>App ID: {app.id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REVIEW APPLICATION MODAL */}
      <AnimatePresence>
        {selectedApp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setSelectedApp(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel-glow border border-emerald-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 bg-[#0b111e] shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 text-[11px] font-mono font-bold uppercase tracking-wider">
                      {isModeratorForClub(selectedApp.clubId) ? 'Executive Decision Panel' : 'Application Preview'}
                    </span>
                    {isModeratorForClub(selectedApp.clubId) && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                        ★ You Moderate This Club
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-extrabold text-white mt-1">Review Candidate</h3>
                  <p className="text-slate-400 text-xs">{selectedApp.clubName}</p>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-1 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Moderator Check Notice if Not a Moderator */}
              {!isModeratorForClub(selectedApp.clubId) && (
                <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-amber-300">Viewing Only Mode</strong>
                    You are not a designated moderator of {selectedApp.clubName}. Only registered executives of this society (or System Administrators) can approve, decline, or request clarification.
                  </div>
                </div>
              )}

              {/* Executive Candidacy Banner */}
              {(selectedApp.applicationType === 'Executive' || selectedApp.applicationType === 'Moderator' || /executive|moderator|president|secretary|treasurer/i.test(selectedApp.roleName)) && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/60 to-orange-950/50 border border-amber-500/40 flex items-start gap-2.5 text-xs text-amber-200">
                  <Award className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-amber-300 font-extrabold text-xs">
                      👑 Executive Committee & Moderator Candidacy
                    </strong>
                    <p className="mt-0.5 leading-relaxed text-slate-300">
                      The candidate has applied for <strong>{selectedApp.roleName}</strong> in <strong>{selectedApp.clubName}</strong>. Approving will induct them into the Society Executive Board and grant official moderation permissions.
                    </p>
                  </div>
                </div>
              )}

              {/* Candidate Info */}
              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Applicant:</span>
                    <strong className="text-white text-sm">{selectedApp.applicantName}</strong>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-400">Student ID & Batch:</span>
                    <span className="text-emerald-400">{selectedApp.studentId} (Batch {selectedApp.batch})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Department:</span>
                    <span className="text-slate-200">{selectedApp.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="text-slate-200">{selectedApp.email}</span>
                  </div>
                  {selectedApp.phone && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Phone:</span>
                      <span className="text-slate-200">{selectedApp.phone}</span>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-1.5">
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wide">
                    Statement of Purpose:
                  </span>
                  <p className="text-slate-200 leading-relaxed italic">
                    "{selectedApp.statementOfPurpose}"
                  </p>
                  {selectedApp.skillsInterests && (
                    <div className="pt-2 text-[11px] text-teal-300 font-mono">
                      Skills & Experience: {selectedApp.skillsInterests}
                    </div>
                  )}
                </div>

                {/* Q&A Thread if Active */}
                {selectedApp.questionPrompt && (
                  <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/30 space-y-2">
                    <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs">
                      <MessageSquareQuote className="w-4 h-4" />
                      <span>Clarification Question Asked:</span>
                    </div>
                    <p className="text-slate-200 italic bg-slate-950/60 p-2.5 rounded-xl border border-white/10">
                      "{selectedApp.questionPrompt}"
                    </p>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Asked by {selectedApp.questionAskedBy || 'Moderator'} on {selectedApp.questionDate}
                    </span>

                    {selectedApp.studentAnswer ? (
                      <div className="pt-2 space-y-1 border-t border-white/10 mt-2">
                        <span className="text-emerald-400 font-bold text-xs block">
                          ✓ Student's Response:
                        </span>
                        <p className="text-slate-200 bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-500/30">
                          "{selectedApp.studentAnswer}"
                        </p>
                        <span className="text-[10px] text-emerald-300 font-mono block">
                          Submitted on {selectedApp.answerDate}
                        </span>
                      </div>
                    ) : (
                      <div className="pt-1 text-[11px] text-amber-300 font-mono flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        <span>Awaiting reply from candidate on their notification bar...</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Final Decision Permanent Audit Banner (for settled applications) */}
                {(selectedApp.status === 'Approved' || selectedApp.status === 'Rejected') ? (
                  <div className={`p-4 rounded-2xl border space-y-2.5 ${
                    selectedApp.status === 'Approved'
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : 'bg-red-950/40 border-red-500/40 text-red-200'
                  }`}>
                    <div className="flex items-center gap-2 font-black text-sm">
                      {selectedApp.status === 'Approved' ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span className="text-emerald-300">Decision Finalized: Approved</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-red-400" />
                          <span className="text-red-300">Decision Finalized: Rejected</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-slate-300">
                      Decided by <strong className="text-white">{selectedApp.decisionBy || 'Executive Review Committee'}</strong> on {selectedApp.decisionDate || 'record'}.
                    </p>
                    {selectedApp.decisionRemarks && (
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Review Remarks</span>
                        <p className="text-xs text-slate-200 italic">"{selectedApp.decisionRemarks}"</p>
                      </div>
                    )}
                    <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 pt-1">
                      <span>🔒 Official Decision Finalized: Application status cannot be modified.</span>
                    </div>
                  </div>
                ) : isModeratorForClub(selectedApp.clubId) ? (
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-center">
                      <button
                        type="button"
                        onClick={() => setIsAskingQuestion(!isAskingQuestion)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>{isAskingQuestion ? 'Hide Question Form' : '+ Ask Candidate for More Information / Q&A'}</span>
                      </button>
                    </div>

                    {isAskingQuestion && (
                      <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-2.5 animate-fadeIn">
                        <label className="text-cyan-300 text-xs font-bold block">
                          Inquiry for Candidate (dispatches instant alert to their notification bar):
                        </label>
                        <textarea
                          rows={2}
                          value={moderatorQuestion}
                          onChange={(e) => setModeratorQuestion(e.target.value)}
                          placeholder="e.g. Which sub-team or committee do you want to join? Please provide GitHub or past event experience."
                          className="w-full text-xs p-3 rounded-xl glass-input placeholder-slate-500 focus:outline-none resize-none"
                        />

                        {/* Quick Prompts */}
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            'Which sub-team / committee do you prefer?',
                            'Please provide links to your past projects or portfolio.',
                            'Are you available for weekend workshops & orientation?'
                          ].map((prompt) => (
                            <button
                              key={prompt}
                              type="button"
                              onClick={() => setModeratorQuestion(prompt)}
                              className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 transition-colors cursor-pointer"
                            >
                              {prompt}
                            </button>
                          ))}
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            disabled={isSubmittingQuestion || !moderatorQuestion.trim()}
                            onClick={handleSendQuestion}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 font-black text-xs transition-all shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{isSubmittingQuestion ? 'Dispatching...' : 'Dispatch Question to Student'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Feedback Input */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-slate-300 text-xs font-semibold block">
                        Final Decision Remarks (Optional):
                      </label>
                      <textarea
                        rows={2}
                        value={reviewRemarks}
                        onChange={(e) => setReviewRemarks(e.target.value)}
                        placeholder="e.g. Approved for Line Follower bot team! Orientation this Sunday at IoT Lab."
                        className="w-full text-xs p-3 rounded-xl glass-input placeholder-slate-500 focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                {(selectedApp.status === 'Approved' || selectedApp.status === 'Rejected') ? (
                  <button
                    type="button"
                    onClick={() => setSelectedApp(null)}
                    className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    Close Review Details
                  </button>
                ) : isModeratorForClub(selectedApp.clubId) ? (
                  <>
                    <button
                      type="button"
                      disabled={isSubmittingReview}
                      onClick={() => handleDecision('Rejected')}
                      className="flex-1 py-3 rounded-2xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Application</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSubmittingReview}
                      onClick={() => handleDecision('Approved')}
                      className={`flex-1 py-3 rounded-2xl font-black text-xs transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer ${
                        selectedApp.applicationType === 'Executive' || /executive|moderator|president|secretary|treasurer/i.test(selectedApp.roleName)
                          ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-slate-950 shadow-amber-950/50 hover:brightness-110'
                          : 'bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 shadow-emerald-950/50'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {selectedApp.applicationType === 'Executive' || /executive|moderator|president|secretary|treasurer/i.test(selectedApp.roleName)
                          ? '👑 Approve & Appoint Executive'
                          : 'Approve & Enroll Member'}
                      </span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedApp(null)}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 text-xs font-bold transition-all cursor-pointer"
                  >
                    Close Preview
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DIRECT APPOINT EXECUTIVE MODAL */}
      <AnimatePresence>
        {isAppointModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setIsAppointModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel-glow border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 bg-[#0b111e] shadow-2xl"
            >
              <div className="flex justify-between items-start border-b border-white/10 pb-3">
                <div>
                  <span className="text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider block">
                    Central Governance & Board Nomination
                  </span>
                  <h3 className="text-lg font-extrabold text-white mt-0.5">
                    Appoint Executive / Moderator
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAppointModalOpen(false)}
                  className="p-1 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!appointClubId || !appointUserId) {
                    alert('Please select both a club and a student account.');
                    return;
                  }
                  setIsSubmittingAppoint(true);
                  if (onAppointExecutive) {
                    await onAppointExecutive(appointClubId, appointUserId, appointDesignation);
                  }
                  setIsSubmittingAppoint(false);
                  setIsAppointModalOpen(false);
                }}
                className="space-y-4 text-xs"
              >
                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    Select Target Society *
                  </label>
                  <select
                    value={appointClubId}
                    onChange={(e) => setAppointClubId(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl glass-input text-white focus:outline-none cursor-pointer"
                  >
                    {clubs.map((c) => (
                      <option key={c.id} value={c.id} className="bg-slate-950">
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    Select Student to Appoint *
                  </label>
                  <select
                    value={appointUserId}
                    onChange={(e) => setAppointUserId(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl glass-input text-white focus:outline-none cursor-pointer"
                  >
                    <option value="" className="bg-slate-950">Choose a registered user...</option>
                    {users
                      .filter((u) => u.email !== 'admin@bup.edu.bd')
                      .map((u) => (
                        <option key={u.id} value={u.id} className="bg-slate-950">
                          {u.name} ({u.studentId} • {u.department})
                        </option>
                      ))}
                  </select>
                  {users.filter((u) => u.email !== 'admin@bup.edu.bd').length === 0 && (
                    <p className="text-[10px] text-amber-400 mt-1">
                      No registered students found yet. Register a student account from the login screen first!
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    Executive Designation / Role *
                  </label>
                  <select
                    value={appointDesignation}
                    onChange={(e) => setAppointDesignation(e.target.value)}
                    className="w-full p-2.5 rounded-xl glass-input text-amber-300 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="Club Moderator" className="bg-slate-950 text-white">Club Moderator</option>
                    <option value="Club President" className="bg-slate-950 text-white">Club President</option>
                    <option value="Vice President" className="bg-slate-950 text-white">Vice President</option>
                    <option value="General Secretary" className="bg-slate-950 text-white">General Secretary</option>
                    <option value="Joint Secretary" className="bg-slate-950 text-white">Joint Secretary</option>
                    <option value="Organizing Secretary" className="bg-slate-950 text-white">Organizing Secretary</option>
                    <option value="Treasurer & Finance Lead" className="bg-slate-950 text-white">Treasurer & Finance Lead</option>
                    <option value="Executive Member (Operations)" className="bg-slate-950 text-white">Executive Member (Operations)</option>
                    <option value="Executive Member (Technical & IT)" className="bg-slate-950 text-white">Executive Member (Technical & IT)</option>
                    <option value="Executive Member (Media & PR)" className="bg-slate-950 text-white">Executive Member (Media & PR)</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAppointModalOpen(false)}
                    className="px-4 py-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer font-bold"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingAppoint || !appointUserId}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black transition-all shadow cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingAppoint ? 'Appointing...' : 'Confirm Appointment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
