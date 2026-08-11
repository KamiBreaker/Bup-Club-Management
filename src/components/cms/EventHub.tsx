import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { ClubEvent, Club, Venue, UserProfile, UserRole } from '../../types/cms';
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
  Ticket
} from 'lucide-react';
import { soundFx } from '../../utils/audioFx';

interface EventHubProps {
  events: ClubEvent[];
  clubs: Club[];
  venues: Venue[];
  currentUser: UserProfile;
  selectedRole: UserRole;
  onRSVP: (eventId: string) => void;
  onCreateEvent: (newEvent: Partial<ClubEvent>) => void;
}

export const EventHub: React.FC<EventHubProps> = ({
  events,
  clubs,
  venues,
  currentUser,
  selectedRole,
  onRSVP,
  onCreateEvent
}) => {
  const [activeTab, setActiveTab] = useState<'All' | 'Upcoming' | 'Registered'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeQrModal, setActiveQrModal] = useState<ClubEvent | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);
  const [scanVerified, setScanVerified] = useState(false);

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
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const categories = ['All', 'Workshop', 'Competition', 'Cultural', 'Seminar', 'Recruitment', 'Training'];

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

  const handleSimulateScan = () => {
    setIsSimulatingScan(true);
    setScanVerified(false);
    soundFx.playClick(1200);

    setTimeout(() => {
      setIsSimulatingScan(false);
      setScanVerified(true);
      soundFx.playSuccess();
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.5 }
        });
      } catch {}
    }, 1500);
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
      registeredUserIds: [currentUser.id]
    });

    soundFx.playSuccess();
    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewDescription('');
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
              <span>Campus Calendar & Holographic Passes</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-heading">
              BUP Event Operations Hub
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Discover official workshops, competitions, cultural galas, and guest seminars. Claim your encrypted QR pass instantly.
            </p>
          </div>

          {(selectedRole === 'Club_Exec' || selectedRole === 'System_Admin' || selectedRole === 'Faculty_Advisor') && (
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
                {tab === 'Registered' && 'My Passes'}
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
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50 shadow-sm'
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
          const isRegistered = registeredIds.includes(currentUser?.id || '');
          const maxSeats = evt.maxSeats || 100;
          const regCount = evt.registeredCount || registeredIds.length || 0;
          const isFull = regCount >= maxSeats;
          const fillPercentage = Math.min(100, Math.round((regCount / maxSeats) * 100));

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

                  <span className="absolute top-3 left-3 bg-emerald-500 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow">
                    {evt.category}
                  </span>

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

                  {/* Seat Capacity Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Live Seat Capacity</span>
                      <span className="text-emerald-400">{fillPercentage}% Filled</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${fillPercentage}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full ${
                          fillPercentage >= 90
                            ? 'bg-rose-500'
                            : fillPercentage >= 70
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                      />
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
              <div className="p-4 bg-slate-950/60 border-t border-white/10 flex items-center justify-between">
                {isRegistered ? (
                  <div className="flex items-center gap-2 w-full justify-between">
                    <span className="text-xs font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>RSVP Confirmed</span>
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        soundFx.playClick();
                        setActiveQrModal(evt);
                        setScanVerified(false);
                      }}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-black px-4 py-2 rounded-xl shadow-lg shadow-emerald-950/50"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>View Hologram Pass</span>
                    </motion.button>
                  </div>
                ) : isFull ? (
                  <span className="text-xs font-bold text-rose-300 bg-rose-950/60 border border-rose-800 px-3 py-2 rounded-xl w-full text-center">
                    All Seats Reserved
                  </span>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRSVPWithCelebration(evt.id)}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold py-2.5 rounded-xl shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Claim Digital Seat Pass</span>
                  </motion.button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

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
              {/* Scan beam laser effect */}
              {isSimulatingScan && <div className="scan-beam" />}

              <button
                onClick={() => setActiveQrModal(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-900/60 border border-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/40 uppercase tracking-wider inline-flex items-center gap-1.5">
                  <ShieldCheckIcon className="w-3 h-3 text-emerald-400" />
                  Official BUP Verified Pass
                </span>
                <h3 className="text-base font-black text-white mt-2 font-heading">{activeQrModal.title}</h3>
                <p className="text-xs text-emerald-300/80 font-mono mt-0.5">{activeQrModal.venueName}</p>
              </div>

              {/* QR Hologram Box */}
              <div className="relative inline-block p-4 bg-slate-950/90 rounded-2xl border border-emerald-500/40 shadow-inner">
                <QrCode className="w-36 h-36 text-emerald-400 mx-auto" />
                {scanVerified && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 bg-emerald-950/90 rounded-2xl flex flex-col items-center justify-center p-2 text-emerald-300"
                  >
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-1" />
                    <p className="font-extrabold text-xs">GATE ACCESS GRANTED</p>
                    <p className="text-[10px] font-mono text-emerald-400">Verified by Usher #4</p>
                  </motion.div>
                )}
              </div>

              {/* Attendee Credentials Card */}
              <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-white/10 text-left text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[11px]">Pass Holder:</span>
                  <strong className="text-white font-bold">{currentUser?.name}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[11px]">Student ID:</span>
                  <strong className="font-mono text-emerald-400">{currentUser?.studentId}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[11px]">Event Timing:</span>
                  <span className="text-slate-300 font-mono text-[11px]">{activeQrModal.date} ({activeQrModal.startTime})</span>
                </div>
              </div>

              {/* Scan Simulation Action */}
              <button
                onClick={handleSimulateScan}
                disabled={isSimulatingScan}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/40 font-mono text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <ScanLine className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>{isSimulatingScan ? 'Scanning QR Pass...' : scanVerified ? 'Re-Verify Gate Check-in' : 'Simulate Usher Scanner'}</span>
              </button>
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
              className="glass-panel-glow rounded-3xl max-w-lg w-full p-6 border border-emerald-500/30 shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto space-y-4"
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

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Date</label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full p-2 rounded-xl glass-input"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Start</label>
                    <input
                      type="time"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      className="w-full p-2 rounded-xl glass-input"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">End</label>
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
    </div>
  );
};

function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}
