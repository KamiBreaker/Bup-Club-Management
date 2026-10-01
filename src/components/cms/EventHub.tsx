import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { ClubEvent, Club, Venue, UserProfile, UserRole, EventRegistration, AttendanceRecord } from '../../types/cms';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  QrCode,
  Sparkles,
  Plus,
  CheckCircle2,
  X,
  Share2,
  Tag,
  Download,
  ScanLine,
  Check,
  Zap,
  Ticket,
  FileSpreadsheet,
  Search,
  ShieldCheck,
  UserCheck,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { soundFx } from '../../utils/audioFx';

interface EventHubProps {
  events: ClubEvent[];
  clubs: Club[];
  venues: Venue[];
  currentUser: UserProfile;
  selectedRole: UserRole;
  registrations?: EventRegistration[];
  attendance?: AttendanceRecord[];
  onRSVP: (eventId: string) => void;
  onCreateEvent: (newEvent: Partial<ClubEvent>) => void;
  onRecordAttendance?: (eventId: string, studentId?: string, passCode?: string) => void;
  onDeleteEvent?: (eventId: string) => void;
}

export const EventHub: React.FC<EventHubProps> = ({
  events,
  clubs,
  venues,
  currentUser,
  selectedRole,
  registrations = [],
  attendance = [],
  onRSVP,
  onCreateEvent,
  onRecordAttendance,
  onDeleteEvent
}) => {
  const [activeTab, setActiveTab] = useState<'All' | 'Upcoming' | 'Registered'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeQrModal, setActiveQrModal] = useState<ClubEvent | null>(null);
  const [activeRosterModal, setActiveRosterModal] = useState<ClubEvent | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDownloadingQr, setIsDownloadingQr] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<ClubEvent | null>(null);

  // Live Usher Check-in input
  const [checkInInput, setCheckInInput] = useState('');
  const [rosterSearch, setRosterSearch] = useState('');

  // New Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newClubId, setNewClubId] = useState(clubs?.[0]?.id || 'CLUB-01');
  const [newCategory, setNewCategory] = useState<'Workshop' | 'Competition' | 'Cultural' | 'Seminar' | 'Recruitment' | 'Training'>('Workshop');
  const [newDescription, setNewDescription] = useState('');
  const [newPosterUrl, setNewPosterUrl] = useState('https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80');
  const [newDate, setNewDate] = useState('2026-08-25');
  const [newStartTime, setNewStartTime] = useState('10:00');
  const [newEndTime, setNewEndTime] = useState('13:00');
  const [newVenueId, setNewVenueId] = useState(venues?.[0]?.id || 'VEN-01');
  const [newMaxSeats, setNewMaxSeats] = useState(150);
  const [newDeadline, setNewDeadline] = useState('2026-08-24');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const categories = ['All', 'Workshop', 'Competition', 'Cultural', 'Seminar', 'Recruitment', 'Training'];

  const isExecutiveOrAdmin =
    selectedRole === 'Club_Exec' ||
    selectedRole === 'Faculty_Advisor' ||
    selectedRole === 'System_Admin';

  const filteredEvents = (events ?? []).filter((evt) => {
    if (!evt) return false;
    const matchesCategory = selectedCategory === 'All' || evt.category === selectedCategory;
    const isUserRegistered = (evt.registeredUserIds ?? []).includes(currentUser?.id || '');

    if (activeTab === 'Upcoming') return matchesCategory && evt.status === 'Upcoming';
    if (activeTab === 'Registered') return matchesCategory && isUserRegistered;

    return matchesCategory;
  });

  const handleRSVPWithCelebration = (eventId: string) => {
    soundFx.playSuccess();
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#f59e0b', '#3b82f6']
      });
    } catch {}
    onRSVP(eventId);
  };

  const handleManualCheckIn = (eventId: string, studentIdOrPass: string) => {
    if (!studentIdOrPass.trim() || !onRecordAttendance) return;
    soundFx.playSuccess();
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.5 }
      });
    } catch {}

    const isPass = studentIdOrPass.toUpperCase().includes('BUP-');
    if (isPass) {
      onRecordAttendance(eventId, undefined, studentIdOrPass.trim());
    } else {
      onRecordAttendance(eventId, studentIdOrPass.trim(), undefined);
    }
    setCheckInInput('');
  };

  const handleConfirmDeleteEvent = () => {
    if (!eventToDelete || !onDeleteEvent) return;
    soundFx.playSuccess();
    onDeleteEvent(eventToDelete.id);
    setEventToDelete(null);
    if (activeRosterModal?.id === eventToDelete.id) {
      setActiveRosterModal(null);
    }
  };

  const handleDownloadQrTicket = async (passCode: string, title: string, qrUrl: string) => {
    soundFx.playSuccess();
    setIsDownloadingQr(true);
    try {
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const objUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = `BUP_Pass_${passCode}_${title.slice(0, 15).replace(/\s+/g, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(objUrl);
    } catch {
      window.open(qrUrl, '_blank');
    } finally {
      setIsDownloadingQr(false);
    }
  };

  const handleGenerateAiDescription = async () => {
    if (!newTitle) {
      alert('Please enter an event title first so AI can craft a tailored description!');
      return;
    }

    soundFx.playClick();
    setIsGeneratingAi(true);

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Generate a high-impact 3-sentence university campus event announcement for "${newTitle}" under category "${newCategory}" for Bangladesh University of Professionals (BUP). Include participant takeaways and excitement.`
        })
      });

      const data = await response.json();
      if (data.text) {
        setNewDescription(data.text);
      } else {
        setNewDescription(`Join us for ${newTitle}! An official ${newCategory} organized at BUP to cultivate technical mastery, hands-on collaboration, and academic distinction.`);
      }
      soundFx.playSuccess();
    } catch (error) {
      console.error(error);
      setNewDescription(`Join us for ${newTitle}! An official ${newCategory} organized at BUP to cultivate technical mastery, hands-on collaboration, and academic distinction.`);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedClub = (clubs ?? []).find((c) => c.id === newClubId);
    const selectedVenue = (venues ?? []).find((v) => v.id === newVenueId);

    onCreateEvent({
      clubId: newClubId,
      clubName: selectedClub?.name || 'BUP Society',
      clubLogo: selectedClub?.logoUrl || '',
      title: newTitle,
      category: newCategory,
      description: newDescription,
      posterUrl: newPosterUrl,
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      venueId: newVenueId,
      venueName: selectedVenue?.name || 'BUP Venue',
      maxSeats: Number(newMaxSeats),
      registeredCount: 1,
      status: 'Upcoming',
      isRSVPAllowed: true,
      registeredUserIds: [currentUser.id],
      registrationDeadline: newDeadline
    });

    soundFx.playSuccess();
    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewDescription('');
  };

  const exportEventRosterCsv = (event: ClubEvent) => {
    soundFx.playSuccess();
    const eventRegs = registrations.filter((r) => r.eventId === event.id);
    const eventAtts = attendance.filter((a) => a.eventId === event.id);

    const header = 'Event ID,Event Title,Student Name,Student ID,Department,Email,Pass Code,Registration Date,Attendance Status,Marked At\n';
    const rows = eventRegs
      .map((r) => {
        const att = eventAtts.find((a) => a.studentId === r.studentId || a.userId === r.userId);
        const isPresent = att ? 'Present' : r.attended ? 'Present' : 'Unchecked';
        const markedAt = att?.markedAt || '';
        return `"${r.eventId}","${r.eventTitle}","${r.studentName}","${r.studentId}","${r.department}","${r.email}","${r.passCode}","${r.registrationDate}","${isPresent}","${markedAt}"`;
      })
      .join('\n');

    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + header + rows);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BUP_Attendance_Roster_${event.title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl glass-panel-glow p-6 sm:p-8 border border-emerald-500/30">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <Ticket className="w-3.5 h-3.5 text-amber-300" />
              <span>Campus Calendar, RSVPs & Gate Attendance</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-heading">
              BUP Event Operations Hub
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Official university workshops, competitions, cultural festivals, and seminars. Register with instant digital QR passes and automated gate check-in.
            </p>
          </div>

          {isExecutiveOrAdmin && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                soundFx.playClick();
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-xs px-5 py-3 rounded-2xl shadow-xl shadow-emerald-950/40 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Club Event</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Tabs & Category Filter */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div className="flex space-x-1 bg-slate-900/80 p-1 rounded-xl border border-white/5">
          {(['All', 'Upcoming', 'Registered'] as const).map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => {
                  soundFx.playClick();
                  setActiveTab(tab);
                }}
                className={`relative px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  isSelected ? 'text-emerald-950 font-black bg-emerald-400 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'All' && `All Events (${(events ?? []).length})`}
                {tab === 'Upcoming' && 'Upcoming Calendar'}
                {tab === 'Registered' && 'My Registered Passes'}
              </button>
            );
          })}
        </div>

        {/* Category Selector */}
        <div className="flex flex-wrap gap-1.5 w-full lg:w-auto">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  soundFx.playClick();
                  setSelectedCategory(cat);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-emerald-400 text-slate-950 font-black shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 border border-white/5'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredEvents.map((evt) => {
          const registeredIds = evt.registeredUserIds ?? [];
          const attendeeIds = evt.attendeeUserIds ?? [];
          const isRegistered = registeredIds.includes(currentUser?.id || '');
          const isAttended = attendeeIds.includes(currentUser?.id || '');
          const maxSeats = evt.maxSeats || 100;
          const regCount = evt.registeredCount || registeredIds.length || 0;
          const isFull = regCount >= maxSeats;
          const fillPercentage = Math.min(100, Math.round((regCount / maxSeats) * 100));

          // User's registration record if exists
          const myReg = registrations.find((r) => r.eventId === evt.id && (r.userId === currentUser.id || r.studentId === currentUser.studentId));

          return (
            <motion.div
              key={evt.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="glass-panel rounded-3xl border border-white/10 hover:border-emerald-500/40 transition-all shadow-xl overflow-hidden flex flex-col justify-between group"
            >
              <div>
                {/* Poster */}
                <div className="h-48 relative bg-slate-900 overflow-hidden">
                  <img
                    src={evt.posterUrl}
                    alt={evt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d1320] via-slate-950/30 to-transparent" />

                  <span className="absolute top-3 left-3 bg-emerald-500 text-emerald-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow">
                    {evt.category}
                  </span>

                  {(() => {
                    const isSystemAdmin = selectedRole === 'System_Admin' || currentUser?.role === 'System_Admin';
                    const canDeleteThisEvent = isSystemAdmin || (
                      selectedRole === 'Club_Exec' &&
                      Array.isArray(currentUser?.clubMemberships) &&
                      currentUser.clubMemberships.some((m) => m.clubId === evt.clubId && m.status === 'Active')
                    );

                    return (
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                        {evt.registrationDeadline && (
                          <span className="text-[10px] font-mono font-bold bg-slate-950/85 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/30 backdrop-blur-md">
                            Deadline: {evt.registrationDeadline}
                          </span>
                        )}
                        {canDeleteThisEvent && onDeleteEvent && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              soundFx.playClick();
                              setEventToDelete(evt);
                            }}
                            className="p-1.5 rounded-lg bg-rose-950/90 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-500/40 transition-all cursor-pointer shadow-md"
                            title={`Delete Event "${evt.title}"`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })()}

                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={evt.clubLogo}
                        alt={evt.clubName}
                        className="w-7 h-7 rounded-xl ring-2 ring-emerald-400 bg-slate-900"
                      />
                      <span className="text-xs font-bold text-white drop-shadow">{evt.clubName}</span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-300 bg-slate-950/85 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                      {regCount} / {maxSeats} Seats
                    </span>
                  </div>
                </div>

                {/* Event Info */}
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="font-black text-white text-base leading-snug group-hover:text-emerald-400 transition-colors">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mt-1.5">
                      {evt.description}
                    </p>
                  </div>

                  {/* Seat Capacity Progress Bar & Detailed Statistics */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/5 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-bold text-white">
                          {maxSeats - regCount > 0 ? (
                            <span className="text-emerald-400 font-extrabold">{maxSeats - regCount} Seats Available</span>
                          ) : (
                            <span className="text-rose-400 font-extrabold">0 Seats Left (Housefull)</span>
                          )}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-300">
                        {regCount} / {maxSeats} Booked ({fillPercentage}%)
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${fillPercentage}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full ${
                          fillPercentage >= 100
                            ? 'bg-rose-500'
                            : fillPercentage >= 80
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-0.5">
                      <span>Total Venue Capacity: <strong>{maxSeats} Seats</strong></span>
                      <span className={isFull ? 'text-rose-400 font-bold' : 'text-emerald-400 font-semibold'}>
                        {isFull ? 'Registration Full' : `${maxSeats - regCount} Seats Left to Reserve`}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 font-medium pt-3 border-t border-white/10">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{evt.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span>{evt.startTime} - {evt.endTime}</span>
                    </div>
                    <div className="col-span-2 flex items-center gap-1.5 text-slate-300 truncate">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="truncate">{evt.venueName}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-4 bg-slate-950/60 border-t border-white/10 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  {isRegistered ? (
                    <div className="flex items-center gap-2 w-full justify-between">
                      <span className="text-xs font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{isAttended ? 'Verified Present' : 'Pass Confirmed'}</span>
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          soundFx.playClick();
                          setActiveQrModal(evt);
                        }}
                        className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-black px-4 py-2 rounded-xl shadow-lg shadow-emerald-950/50"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>View Digital Pass</span>
                      </motion.button>
                    </div>
                  ) : isFull ? (
                    <span className="text-xs font-bold text-rose-300 bg-rose-950/60 border border-rose-800 px-3 py-2 rounded-xl w-full text-center">
                      All Seats Reserved (Full)
                    </span>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleRSVPWithCelebration(evt.id)}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold py-2.5 rounded-xl shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>Register for this event</span>
                    </motion.button>
                  )}
                </div>

                {/* Executive Attendance Management Button */}
                {isExecutiveOrAdmin && (
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setActiveRosterModal(evt);
                      setCheckInInput('');
                      setRosterSearch('');
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-300 text-[11px] font-bold border border-emerald-500/20 transition-all"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      Gate Check-in & Roster ({attendeeIds.length} attended / {regCount} registered)
                    </span>
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* EXECUTIVE ROSTER & GATE CHECK-IN MODAL */}
      <AnimatePresence>
        {activeRosterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveRosterModal(null)}
              className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="glass-panel rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-emerald-500/40 shadow-2xl relative z-10 p-6 sm:p-8 space-y-5 bg-[#090e18]"
            >
              {/* Header */}
              <div className="flex justify-between items-start border-b border-white/10 pb-4">
                <div>
                  <span className="text-emerald-400 text-[11px] font-mono font-bold uppercase tracking-wider">
                    Executive Gate Control & Attendance Verification
                  </span>
                  <h3 className="text-xl font-extrabold text-white mt-1">
                    {activeRosterModal.title}
                  </h3>
                  <p className="text-slate-400 text-xs">
                    {activeRosterModal.venueName} • {activeRosterModal.date} ({activeRosterModal.startTime} - {activeRosterModal.endTime})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {onDeleteEvent && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = activeRosterModal;
                        setActiveRosterModal(null);
                        setEventToDelete(target);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold transition-all cursor-pointer shadow"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Event</span>
                    </button>
                  )}
                  <button
                    onClick={() => setActiveRosterModal(null)}
                    className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Attendance Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 text-center">
                  <span className="text-[11px] text-slate-400 block font-medium">Registered Attendees</span>
                  <span className="text-xl font-black text-white font-mono">
                    {activeRosterModal.registeredCount || 0}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 text-center">
                  <span className="text-[11px] text-emerald-400 block font-medium">Verified Checked In</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">
                    {(activeRosterModal.attendeeUserIds ?? []).length}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-amber-500/30 text-center">
                  <span className="text-[11px] text-amber-300 block font-medium">Pending Check-in</span>
                  <span className="text-xl font-black text-amber-300 font-mono">
                    {Math.max(0, (activeRosterModal.registeredCount || 0) - (activeRosterModal.attendeeUserIds ?? []).length)}
                  </span>
                </div>
              </div>

              {/* Usher Fast Scanner Bar */}
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-2">
                <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <ScanLine className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>Usher Gate Scanner (Enter Student ID or Pass Code)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 21041001 or BUP-ROBO-9412"
                    value={checkInInput}
                    onChange={(e) => setCheckInInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleManualCheckIn(activeRosterModal.id, checkInInput);
                      }
                    }}
                    className="flex-1 text-xs px-3.5 py-2.5 rounded-xl glass-input placeholder-slate-500 font-mono focus:outline-none"
                  />
                  <button
                    onClick={() => handleManualCheckIn(activeRosterModal.id, checkInInput)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black text-xs shadow-md transition-all"
                  >
                    Log Gate Attendance
                  </button>
                </div>
              </div>

              {/* Search & Export Bar */}
              <div className="flex justify-between items-center gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-emerald-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search attendee by name, student ID, department..."
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl glass-input placeholder-slate-400 focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => exportEventRosterCsv(activeRosterModal)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold border border-emerald-500/30 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Attendance CSV</span>
                </button>
              </div>

              {/* Roster Table */}
              <div className="rounded-2xl border border-white/10 overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 font-mono text-[11px] border-b border-white/10">
                    <tr>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Student ID</th>
                      <th className="py-2.5 px-3">Department</th>
                      <th className="py-2.5 px-3">Pass Code</th>
                      <th className="py-2.5 px-3 text-right">Gate Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {registrations
                      .filter((r) => r.eventId === activeRosterModal.id)
                      .filter(
                        (r) =>
                          r.studentName.toLowerCase().includes(rosterSearch.toLowerCase()) ||
                          r.studentId.toLowerCase().includes(rosterSearch.toLowerCase()) ||
                          r.passCode.toLowerCase().includes(rosterSearch.toLowerCase())
                      )
                      .map((reg) => {
                        const isPresent =
                          reg.attended ||
                          (activeRosterModal.attendeeUserIds ?? []).includes(reg.userId);

                        return (
                          <tr key={reg.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-3 px-3 font-bold text-white">{reg.studentName}</td>
                            <td className="py-3 px-3 font-mono text-emerald-400">{reg.studentId}</td>
                            <td className="py-3 px-3 text-slate-300">{reg.department}</td>
                            <td className="py-3 px-3 font-mono text-teal-300">{reg.passCode}</td>
                            <td className="py-3 px-3 text-right">
                              {isPresent ? (
                                <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px] bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Present</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleManualCheckIn(activeRosterModal.id, reg.studentId)}
                                  className="px-3 py-1 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-[11px] shadow transition-all"
                                >
                                  Mark Present
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Holographic 3D QR Ticket Pass Modal */}
      <AnimatePresence>
        {activeQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveQrModal(null)}
              className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.85, rotateX: 15 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.85, rotateX: 15 }}
              transition={{ type: 'spring', damping: 24, stiffness: 300 }}
              className="relative max-w-sm w-full glass-panel-glow rounded-3xl p-6 text-center border border-emerald-500/40 shadow-2xl z-10 space-y-4 hologram-foil overflow-hidden"
            >

              <button
                onClick={() => setActiveQrModal(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-900/60 border border-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

            {(() => {
              const currentReg = registrations.find(
                (r) => r.eventId === activeQrModal.id && (r.userId === currentUser?.id || r.studentId === currentUser?.studentId)
              );
              const currentPassCode = currentReg?.passCode || `BUP-PASS-${activeQrModal.id.slice(-4)}`;
              const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
                `BUP-EVENT-PASS:${activeQrModal.id}:${currentUser?.studentId}:${currentPassCode}`
              )}`;

              return (
                <>
                  <div>
                    <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/40 uppercase tracking-wider inline-flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Official BUP Digital Entry Pass
                    </span>
                    <h3 className="text-base font-black text-white mt-2 font-heading">{activeQrModal.title}</h3>
                    <p className="text-xs text-emerald-300/80 font-mono mt-0.5">{activeQrModal.venueName}</p>
                  </div>

                  {/* QR Image Box */}
                  <div className="relative inline-block p-4 bg-white rounded-3xl shadow-2xl mx-auto">
                    <img
                      src={qrImageUrl}
                      alt="QR Entry Pass"
                      className="w-44 h-44 mx-auto object-contain"
                    />
                  </div>

                  {/* Attendee Credentials Card */}
                  <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-white/10 text-left text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px]">Pass Code:</span>
                      <strong className="text-emerald-400 font-extrabold text-sm tracking-wider">{currentPassCode}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px]">Holder:</span>
                      <strong className="text-white font-bold">{currentUser?.name}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px]">Student ID:</span>
                      <span className="text-emerald-300">{currentUser?.studentId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px]">Timing:</span>
                      <span className="text-slate-300 text-[11px]">{activeQrModal.date} ({activeQrModal.startTime} - {activeQrModal.endTime})</span>
                    </div>
                  </div>

                  {/* Gate Instructions Notice */}
                  <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-[10px] text-slate-300 space-y-1 text-left">
                    <span className="font-bold text-emerald-300 block">Gate Verification Process:</span>
                    <p className="text-slate-400 leading-relaxed">
                      Download this QR pass or save it to your phone. At the auditorium/venue entrance, gate moderators and ushers will scan it to verify and log your attendance server-side.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleDownloadQrTicket(currentPassCode, activeQrModal.title, qrImageUrl)}
                      disabled={isDownloadingQr}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-xs transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isDownloadingQr ? 'Saving Ticket...' : 'Download QR Ticket'}</span>
                    </button>
                    <button
                      onClick={() => setActiveQrModal(null)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
                    >
                      Close
                    </button>
                  </div>
                </>
              );
            })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Event Modal with AI Copilot */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="glass-panel-glow rounded-3xl max-w-lg w-full p-6 border border-emerald-500/30 shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto space-y-4 bg-[#090e18]"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white font-heading">
                      Create BUP Campus Event
                    </h3>
                    <p className="text-[11px] text-slate-400">Society Event Operations & RSVP Publishing</p>
                  </div>
                </div>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Hosting Society</label>
                  <select
                    value={newClubId}
                    onChange={(e) => setNewClubId(e.target.value)}
                    className="w-full p-2.5 rounded-xl glass-input font-medium"
                  >
                    {(clubs ?? []).map((c) => (
                      <option key={c.id} value={c.id} className="bg-slate-950 text-white">
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Event Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BUP Autonomous Robotics Expo 2026"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl glass-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl glass-input"
                    >
                      <option value="Workshop" className="bg-slate-950">Workshop</option>
                      <option value="Competition" className="bg-slate-950">Competition</option>
                      <option value="Cultural" className="bg-slate-950">Cultural</option>
                      <option value="Seminar" className="bg-slate-950">Seminar</option>
                      <option value="Recruitment" className="bg-slate-950">Recruitment</option>
                      <option value="Training" className="bg-slate-950">Training</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Max Seats</label>
                    <input
                      type="number"
                      value={newMaxSeats}
                      onChange={(e) => setNewMaxSeats(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl glass-input"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-300">Description</label>
                    <button
                      type="button"
                      onClick={handleGenerateAiDescription}
                      disabled={isGeneratingAi}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 px-2.5 py-1 rounded-lg border border-emerald-500/30 transition-all"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400 animate-spin" />
                      <span>{isGeneratingAi ? 'Synthesizing...' : 'AI Auto-Draft'}</span>
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    required
                    placeholder="Enter event details or click AI Auto-Draft..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full p-2.5 rounded-xl glass-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Event Date</label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full p-2 rounded-xl glass-input"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Registration Deadline</label>
                    <input
                      type="date"
                      value={newDeadline}
                      onChange={(e) => setNewDeadline(e.target.value)}
                      className="w-full p-2 rounded-xl glass-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Start Time</label>
                    <input
                      type="time"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      className="w-full p-2 rounded-xl glass-input"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">End Time</label>
                    <input
                      type="time"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      className="w-full p-2 rounded-xl glass-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Allocated Venue</label>
                  <select
                    value={newVenueId}
                    onChange={(e) => setNewVenueId(e.target.value)}
                    className="w-full p-2.5 rounded-xl glass-input font-medium"
                  >
                    {(venues ?? []).map((v) => (
                      <option key={v.id} value={v.id} className="bg-slate-950">
                        {v.name} (Cap: {v.capacity})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black py-3 rounded-2xl transition-all shadow-xl shadow-emerald-950/50 text-xs"
                >
                  Publish Campus Event
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EVENT DELETION CONFIRMATION MODAL */}
      <AnimatePresence>
        {eventToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEventToDelete(null)}
              className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="glass-panel rounded-3xl max-w-md w-full p-6 sm:p-7 border border-rose-500/40 shadow-2xl relative z-10 space-y-5 bg-[#10070a]"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-rose-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                    Administrative Event Action
                  </span>
                  <h3 className="text-lg font-black text-white mt-0.5 font-heading">
                    Permanently Delete Event?
                  </h3>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-rose-500/20 space-y-2 text-xs">
                <p className="text-slate-200">
                  You are about to cancel and delete <strong className="text-rose-300 font-bold">{eventToDelete.title}</strong> hosted by {eventToDelete.clubName}.
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] pt-1">
                  <li>Permanently removes the event from the campus calendar</li>
                  <li>Cancels all {eventToDelete.registeredCount || 0} user registrations & issued digital passes</li>
                  <li>Releases the booked venue reservation and purges gate check-in logs</li>
                </ul>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEventToDelete(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteEvent}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-xl shadow-rose-950/60 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Event</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
