import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserProfile,
  Club,
  ClubEvent,
  EventRegistration,
  MembershipApplication,
  AttendanceRecord
} from '../../types/cms';
import {
  Sparkles,
  Ticket,
  Users,
  Award,
  CheckCircle2,
  Clock,
  QrCode,
  Calendar,
  MapPin,
  Download,
  Building,
  GraduationCap,
  ExternalLink,
  X,
  FileCheck2,
  Share2,
  ShieldCheck
} from 'lucide-react';
import { soundFx } from '../../utils/audioFx';

interface MyCampusHubProps {
  currentUser: UserProfile;
  clubs: Club[];
  events: ClubEvent[];
  registrations: EventRegistration[];
  applications: MembershipApplication[];
  attendance: AttendanceRecord[];
  onNavigateToTab?: (tab: 'clubs' | 'events' | 'membership-hub') => void;
}

export const MyCampusHub: React.FC<MyCampusHubProps> = ({
  currentUser,
  clubs,
  events,
  registrations,
  applications,
  attendance,
  onNavigateToTab
}) => {
  const [activeTab, setActiveTab] = useState<'passes' | 'memberships' | 'applications' | 'history'>('passes');
  const [selectedPass, setSelectedPass] = useState<EventRegistration | null>(null);
  const [isDownloadingPass, setIsDownloadingPass] = useState(false);

  const handleDownloadPassTicket = async (pass: EventRegistration) => {
    soundFx.playSuccess();
    setIsDownloadingPass(true);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
      `BUP-EVENT-PASS:${pass.eventId}:${currentUser.studentId}:${pass.passCode}`
    )}`;
    try {
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const objUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = `BUP_Pass_${pass.passCode}_${(pass.eventTitle || 'Event').slice(0, 15).replace(/\s+/g, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(objUrl);
    } catch {
      window.open(qrUrl, '_blank');
    } finally {
      setIsDownloadingPass(false);
    }
  };

  // Filter registrations for current student
  const myRegistrations = (registrations ?? []).filter(
    (r) => r.userId === currentUser.id || r.studentId === currentUser.studentId
  );

  // Filter applications for current student
  const myApplications = (applications ?? []).filter(
    (a) => a.userId === currentUser.id || a.studentId === currentUser.studentId
  );

  // Filter attendance records for current student
  const myAttendance = (attendance ?? []).filter(
    (att) => att.userId === currentUser.id || att.studentId === currentUser.studentId
  );

  // Find full club entities for memberships
  const myEnrolledClubs = (currentUser.clubMemberships ?? []).map((membership) => {
    const club = clubs.find((c) => c.id === membership.clubId);
    return {
      membership,
      club
    };
  });

  const exportParticipationTranscript = () => {
    soundFx.playSuccess();
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'BUP Co-Curricular & Student Engagement Transcript\n' +
      `Student Name,${currentUser.name}\n` +
      `Student ID,${currentUser.studentId}\n` +
      `Department,${currentUser.department}\n` +
      `Batch,${currentUser.batch}\n\n` +
      'Attended Event Title,Date,Verification Status,Verified By\n' +
      myAttendance
        .map((a) => `"${a.eventTitle || 'Campus Event'}","${a.markedAt}","${a.status}","${a.markedBy}"`)
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BUP_Transcript_${currentUser.studentId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Student Profile Identity Card */}
      <div className="relative overflow-hidden rounded-3xl glass-panel-glow p-6 sm:p-8 border border-emerald-500/30">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-emerald-500/30 shadow-2xl bg-slate-900"
              />
              <span className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 text-slate-950 p-1 rounded-lg shadow">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                <GraduationCap className="w-3 h-3 text-amber-300" />
                <span>BUP Student Co-Curricular Portal</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-heading">
                {currentUser.name}
              </h2>
              <p className="text-slate-300 text-xs font-mono">
                ID: <strong className="text-emerald-400 font-bold">{currentUser.studentId}</strong> • {currentUser.department} (Batch {currentUser.batch})
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex-1 md:flex-initial px-4 py-3 rounded-2xl bg-slate-900/80 border border-white/10 text-center">
              <span className="text-[11px] text-slate-400 font-semibold block">Clubs Joined</span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                {(currentUser.clubMemberships ?? []).filter((m) => m.status === 'Active').length}
              </span>
            </div>

            <div className="flex-1 md:flex-initial px-4 py-3 rounded-2xl bg-slate-900/80 border border-white/10 text-center">
              <span className="text-[11px] text-slate-400 font-semibold block">Event Passes</span>
              <span className="text-xl font-black text-teal-400 font-mono">
                {myRegistrations.length}
              </span>
            </div>

            <div className="flex-1 md:flex-initial px-4 py-3 rounded-2xl bg-slate-900/80 border border-white/10 text-center">
              <span className="text-[11px] text-slate-400 font-semibold block">Verified Attended</span>
              <span className="text-xl font-black text-amber-300 font-mono">
                {myAttendance.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex space-x-1 bg-slate-900/80 p-1 rounded-xl border border-white/5 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('passes');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'passes'
                ? 'bg-emerald-400 text-slate-950 font-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>My Digital Passes ({myRegistrations.length})</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('memberships');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'memberships'
                ? 'bg-emerald-400 text-slate-950 font-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>My Societies</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('applications');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'applications'
                ? 'bg-emerald-400 text-slate-950 font-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Application Tracker ({myApplications.length})</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('history');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-emerald-400 text-slate-950 font-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Attendance Transcript</span>
          </button>
        </div>

        {activeTab === 'history' && (
          <button
            onClick={exportParticipationTranscript}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold border border-emerald-500/30 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Co-Curricular Record</span>
          </button>
        )}
      </div>

      {/* TAB 1: DIGITAL EVENT PASSES */}
      {activeTab === 'passes' && (
        <div className="space-y-4">
          {myRegistrations.length === 0 ? (
            <div className="glass-panel rounded-3xl p-12 text-center border border-white/10">
              <Ticket className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h3 className="text-white font-bold text-base">No Event Passes Found</h3>
              <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto">
                You haven't registered for any upcoming events yet. Visit the Event Hub to reserve your seat and claim a digital entry pass!
              </p>
              {onNavigateToTab && (
                <button
                  onClick={() => onNavigateToTab('events')}
                  className="mt-4 px-4 py-2 rounded-xl bg-emerald-400 text-slate-950 font-bold text-xs shadow-md"
                >
                  Browse Campus Events
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myRegistrations.map((reg) => {
                const event = events.find((e) => e.id === reg.eventId);
                const isAttended = reg.attended || (event?.attendeeUserIds ?? []).includes(currentUser.id);

                return (
                  <motion.div
                    key={reg.id}
                    whileHover={{ y: -4 }}
                    className="relative glass-panel rounded-3xl border border-white/10 overflow-hidden flex flex-col justify-between shadow-xl group hover:border-emerald-500/40 transition-all"
                  >
                    {/* Ticket Header Graphic */}
                    <div className="h-28 relative overflow-hidden bg-slate-950">
                      {event?.posterUrl && (
                        <img
                          src={event.posterUrl}
                          alt={reg.eventTitle}
                          className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d1320] via-transparent to-transparent" />
                      
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] text-slate-300 font-mono">
                        <Calendar className="w-3 h-3 text-emerald-400" />
                        <span>{event?.date || 'Upcoming'}</span>
                      </div>

                      <span
                        className={`absolute top-3 right-3 text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg border backdrop-blur-md ${
                          isAttended
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        {isAttended ? 'Verified Present' : 'Confirmed RSVP'}
                      </span>
                    </div>

                    {/* Ticket Body */}
                    <div className="p-5 space-y-3">
                      <div>
                        <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider block">
                          {reg.clubName || event?.clubName || 'BUP Society'}
                        </span>
                        <h4 className="text-white font-extrabold text-sm leading-snug mt-0.5 line-clamp-2">
                          {reg.eventTitle}
                        </h4>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/5 space-y-1.5 text-xs font-mono">
                        <div className="flex justify-between items-center text-slate-400">
                          <span>Pass ID:</span>
                          <strong className="text-emerald-400">{reg.passCode}</strong>
                        </div>
                        <div className="flex justify-between items-center text-slate-400">
                          <span>Venue:</span>
                          <span className="text-slate-200">{event?.venueName || 'Campus Venue'}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400">
                          <span>Time:</span>
                          <span className="text-slate-200">{event?.startTime || '10:00'} - {event?.endTime || '13:00'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Pass Action Footer */}
                    <div className="p-4 bg-slate-950/60 border-t border-white/10 flex items-center gap-2">
                      <button
                        onClick={() => {
                          soundFx.playClick();
                          setSelectedPass(reg);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-xs transition-all shadow-md"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Display Digital QR Pass</span>
                      </button>
                      <button
                        onClick={() => handleDownloadPassTicket(reg)}
                        title="Download Pass as PNG"
                        disabled={isDownloadingPass}
                        className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 transition-all shadow-sm flex items-center justify-center"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY SOCIETIES */}
      {activeTab === 'memberships' && (
        <div className="space-y-4">
          {myEnrolledClubs.length === 0 ? (
            <div className="glass-panel rounded-3xl p-12 text-center border border-white/10">
              <Users className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h3 className="text-white font-bold text-base">No Active Society Memberships</h3>
              <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto">
                You are currently not enrolled in any BUP student societies. Browse clubs and apply for recruitment!
              </p>
              {onNavigateToTab && (
                <button
                  onClick={() => onNavigateToTab('clubs')}
                  className="mt-4 px-4 py-2 rounded-xl bg-emerald-400 text-slate-950 font-bold text-xs shadow-md"
                >
                  Browse Club Directory
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myEnrolledClubs.map(({ membership, club }) => (
                <div
                  key={membership.clubId}
                  className="glass-panel p-6 rounded-3xl border border-emerald-500/30 flex flex-col justify-between space-y-4 shadow-xl"
                >
                  <div className="flex items-start gap-4">
                    {club?.logoUrl ? (
                      <img
                        src={club.logoUrl}
                        alt={club.name}
                        className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-500/30 bg-slate-900 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-lg shrink-0">
                        {club?.name?.charAt(0) || 'C'}
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                          {club?.code || 'CLUB'}
                        </span>
                        <span className="text-[10px] text-teal-400 font-bold">{club?.category}</span>
                      </div>
                      <h4 className="text-white font-black text-base">{club?.name || membership.clubId}</h4>
                      <p className="text-emerald-400 text-xs font-semibold">{membership.roleName}</p>
                    </div>
                  </div>

                  <p className="text-slate-300 text-xs line-clamp-2 leading-relaxed">
                    {club?.description}
                  </p>

                  <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/5 flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Faculty Advisor:</span>
                    <span className="text-slate-200 font-semibold">{club?.facultyAdvisor?.name || 'Assigned'}</span>
                  </div>

                  <div className="pt-2 flex justify-between items-center text-xs border-t border-white/5">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Official Active Member</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">BUP Accredited</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: APPLICATION TRACKER */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {myApplications.length === 0 ? (
            <div className="glass-panel rounded-3xl p-12 text-center border border-white/10">
              <Clock className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h3 className="text-white font-bold text-base">No Applications Submitted</h3>
              <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto">
                You haven't submitted any club recruitment applications. Check out the Club Directory to apply!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myApplications.map((app) => (
                <div
                  key={app.id}
                  className="glass-panel p-5 rounded-3xl border border-white/10 space-y-4 shadow-xl"
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

                  {/* Lifecycle Tracker Visual */}
                  <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3 h-3" /> 1. Submitted
                      </span>
                      <span className="text-slate-600">→</span>
                      <span className={`flex items-center gap-1 ${app.status === 'Action Required' ? 'text-amber-300 font-bold animate-pulse' : app.status === 'Pending' ? 'text-cyan-300 font-bold' : 'text-emerald-400'}`}>
                        2. {app.status === 'Action Required' ? 'Q&A Clarification' : 'Screening'}
                      </span>
                      <span className="text-slate-600">→</span>
                      <span className={`flex items-center gap-1 ${app.status === 'Approved' ? 'text-emerald-400 font-bold' : app.status === 'Rejected' ? 'text-red-400 font-bold' : 'text-slate-600'}`}>
                        3. Final Decision
                      </span>
                    </div>

                    <p className="text-xs italic text-slate-300 pt-1">"{app.statementOfPurpose}"</p>
                  </div>

                  {/* Active Q&A Clarification Highlight */}
                  {app.questionPrompt && (
                    <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-xs space-y-1.5">
                      <div className="flex justify-between items-center text-amber-300 font-bold text-[11px]">
                        <span>Moderator Inquiry:</span>
                        <span className="text-[10px] text-slate-400 font-mono">{app.questionDate || 'Recently'}</span>
                      </div>
                      <p className="text-slate-200 italic">"{app.questionPrompt}"</p>

                      {app.studentAnswer ? (
                        <div className="pt-1.5 border-t border-white/10 text-emerald-400 text-[11px]">
                          <strong>✓ You replied:</strong> "{app.studentAnswer}"
                        </div>
                      ) : (
                        <div className="pt-1 flex justify-between items-center">
                          <span className="text-[10px] text-amber-300">Reply required to accept membership</span>
                          {onNavigateToTab && (
                            <button
                              onClick={() => onNavigateToTab('membership-hub')}
                              className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[10px] transition-colors cursor-pointer"
                            >
                              Reply in Applications Tab →
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {app.decisionRemarks && !app.questionPrompt && (
                    <div className="p-3 rounded-2xl bg-slate-900 border border-white/10 text-xs space-y-1">
                      <span className="text-emerald-400 font-bold block">Executive Review Note:</span>
                      <p className="text-slate-200">{app.decisionRemarks}</p>
                      <span className="text-[10px] text-slate-500 block">
                        Reviewed by {app.decisionBy} on {app.decisionDate}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono pt-1">
                    <span>Applied: {app.applicationDate}</span>
                    <span>App #{app.id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ATTENDANCE HISTORY TRANSCRIPT */}
      {activeTab === 'history' && (
        <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-xl">
          <div className="p-5 border-b border-white/10 flex justify-between items-center">
            <div>
              <h3 className="text-white font-extrabold text-sm">Verified Co-Curricular Attendance Transcript</h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Official audit log of campus workshops, competitions, and seminars verified at venue doors.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
              {myAttendance.length} Verified Events
            </span>
          </div>

          {myAttendance.length === 0 ? (
            <div className="p-12 text-center">
              <Award className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h4 className="text-white font-bold text-sm">No Attendance Logged Yet</h4>
              <p className="text-slate-400 text-xs mt-1">
                When you attend an event and present your digital QR pass, your verified attendance will appear here!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/70 text-slate-400 font-mono text-[11px] border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">Event Title</th>
                    <th className="py-3 px-4">Check-in Timestamp</th>
                    <th className="py-3 px-4">Verified By</th>
                    <th className="py-3 px-4 text-right">Accreditation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {myAttendance.map((att) => (
                    <tr key={att.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                        <FileCheck2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{att.eventTitle || 'BUP Campus Event'}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">{att.markedAt}</td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">{att.markedBy}</td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px] bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Verified Present</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* QR DIGITAL PASS MODAL */}
      <AnimatePresence>
        {selectedPass && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setSelectedPass(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel-glow border border-emerald-500/40 rounded-3xl p-6 sm:p-8 max-w-sm w-full bg-[#090e17] shadow-2xl text-center space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">
                  BUP Digital Event Pass
                </span>
                <button
                  onClick={() => setSelectedPass(null)}
                  className="p-1 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-white leading-snug">
                  {selectedPass.eventTitle}
                </h3>
                <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                  {selectedPass.clubName || 'BUP Society'}
                </p>
              </div>

              {/* QR Code Container */}
              <div className="p-4 bg-white rounded-3xl mx-auto w-48 h-48 flex flex-col items-center justify-center shadow-xl">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    `BUP-PASS:${selectedPass.passCode}:${selectedPass.eventId}:${currentUser.studentId}`
                  )}`}
                  alt="Entry QR"
                  className="w-40 h-40 object-contain"
                />
              </div>

              <div className="space-y-1">
                <span className="font-mono text-lg font-black tracking-widest text-emerald-400 block">
                  {selectedPass.passCode}
                </span>
                <p className="text-[11px] text-slate-300 font-mono">
                  Holder: {currentUser.name} ({currentUser.studentId})
                </p>
                <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-[10px] text-slate-300 text-left space-y-1 mt-2">
                  <span className="font-bold text-emerald-300 block flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Gate Verification Notice:
                  </span>
                  <p className="text-slate-400 leading-relaxed">
                    Download this pass or keep it open on your mobile screen. Present it to the gate moderators at the auditorium entrance. Scanning is performed server-side by the gate ushers.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleDownloadPassTicket(selectedPass)}
                  disabled={isDownloadingPass}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 text-xs font-black transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>{isDownloadingPass ? 'Saving Ticket...' : 'Download QR Ticket'}</span>
                </button>
                <button
                  onClick={() => setSelectedPass(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
                >
                  Close Pass
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
