import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Venue, VenueBooking, Club, UserProfile, UserRole } from '../../types/cms';
import {
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  ShieldCheck,
  Search,
  Check,
  X,
  Sparkles,
  Zap,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { soundFx } from '../../utils/audioFx';

interface VenueBookingEngineProps {
  venues: Venue[];
  bookings: VenueBooking[];
  clubs: Club[];
  currentUser: UserProfile;
  selectedRole: UserRole;
  onNewBooking: (booking: Partial<VenueBooking>) => void;
  onUpdateBookingStatus: (bookingId: string, status: 'Approved' | 'Rejected') => void;
}

export const VenueBookingEngine: React.FC<VenueBookingEngineProps> = ({
  venues,
  bookings,
  clubs,
  currentUser,
  selectedRole,
  onNewBooking,
  onUpdateBookingStatus
}) => {
  const [selectedVenueId, setSelectedVenueId] = useState<string>(venues?.[0]?.id || 'VEN-01');
  const [bookingDate, setBookingDate] = useState<string>('2026-08-20');
  const [startTime, setStartTime] = useState<string>('10:00');
  const [endTime, setEndTime] = useState<string>('12:00');
  const [eventTitle, setEventTitle] = useState<string>('');
  const [selectedClubId, setSelectedClubId] = useState<string>(clubs?.[0]?.id || 'CLUB-01');
  const [expectedAttendance, setExpectedAttendance] = useState<number>(100);
  const [purpose, setPurpose] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'calendar' | 'my-bookings' | 'approvals'>('calendar');

  // Conflict Detection Engine Logic
  const checkVenueConflict = (venueId: string, date: string, start: string, end: string) => {
    return (bookings ?? []).some((b) => {
      if (!b || b.venueId !== venueId || b.bookingDate !== date || b.status === 'Rejected') return false;

      // Overlap calculation
      const bStart = b.startTime;
      const bEnd = b.endTime;
      return (start >= bStart && start < bEnd) || (end > bStart && end <= bEnd) || (start <= bStart && end >= bEnd);
    });
  };

  const isCurrentConflict = checkVenueConflict(selectedVenueId, bookingDate, startTime, endTime);

  const applySlotPreset = (start: string, end: string) => {
    soundFx.playClick();
    setStartTime(start);
    setEndTime(end);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCurrentConflict) {
      soundFx.playClick(300);
      alert('Cannot submit booking! Overlapping reservation detected for this venue and time slot.');
      return;
    }

    const selectedVenue = (venues ?? []).find((v) => v.id === selectedVenueId);
    const selectedClub = (clubs ?? []).find((c) => c.id === selectedClubId);

    onNewBooking({
      eventTitle: eventTitle || 'Club General Body Meeting',
      clubId: selectedClubId,
      clubName: selectedClub?.name || 'BUP Society',
      venueId: selectedVenueId,
      venueName: selectedVenue?.name || 'BUP Hall',
      bookingDate,
      startTime,
      endTime,
      expectedAttendance: Number(expectedAttendance),
      requestedEquipment: ['PA System', 'Projector & Screen'],
      purpose: purpose || 'Official Club Workshop and Seminar',
      status: 'Pending',
      conflictDetected: false,
      submittedBy: `${currentUser?.name || 'Student'} (${selectedRole.replace('_', ' ')})`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    });

    soundFx.playSuccess();
    setEventTitle('');
    setPurpose('');
  };

  const pendingBookings = (bookings ?? []).filter((b) => b.status === 'Pending');

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl glass-panel-glow p-6 sm:p-8 border border-emerald-500/30">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>BUP Facilities Operations & Timetable Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-heading">
              Smart Venue Booking & Conflict Engine
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Real-time timetable conflict avoidance for Multipurpose Hall, Auditoriums, and Advanced Robotics Labs.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-white/10 shrink-0">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Automated Conflict Checking</p>
              <p className="text-[10px] text-emerald-400 font-mono">Status: ACTIVE & ENFORCED</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="glass-panel p-2 rounded-2xl border border-white/10 flex space-x-2">
        <button
          onClick={() => {
            soundFx.playClick();
            setActiveTab('calendar');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'calendar'
              ? 'bg-emerald-400 text-slate-950 font-black shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Reserve Venue
        </button>
        <button
          onClick={() => {
            soundFx.playClick();
            setActiveTab('my-bookings');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'my-bookings'
              ? 'bg-emerald-400 text-slate-950 font-black shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          All Reservations ({(bookings ?? []).length})
        </button>
        {(selectedRole === 'Venue_Admin' ||
          selectedRole === 'System_Admin' ||
          selectedRole === 'Faculty_Advisor') && (
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('approvals');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'approvals'
                ? 'bg-emerald-400 text-slate-950 font-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Approval Queue</span>
            {pendingBookings.length > 0 && (
              <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                {pendingBookings.length}
              </span>
            )}
          </button>
        )}
      </div>

      {activeTab === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Reservation Form */}
          <div className="lg:col-span-2 glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
            <div className="flex items-center gap-2 border-b border-white/10 pb-4">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white font-heading">
                  Facility Reservation Request
                </h3>
                <p className="text-[11px] text-slate-400">Direct integration with BUP Facilities Office</p>
              </div>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Target Facility</label>
                  <select
                    value={selectedVenueId}
                    onChange={(e) => setSelectedVenueId(e.target.value)}
                    className="w-full p-2.5 rounded-xl glass-input font-medium"
                  >
                    {(venues ?? []).map((v) => (
                      <option key={v.id} value={v.id} className="bg-slate-950">
                        {v.name} (Capacity: {v.capacity})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Organizing Society</label>
                  <select
                    value={selectedClubId}
                    onChange={(e) => setSelectedClubId(e.target.value)}
                    className="w-full p-2.5 rounded-xl glass-input font-medium"
                  >
                    {(clubs ?? []).map((c) => (
                      <option key={c.id} value={c.id} className="bg-slate-950">{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Event / Meeting Purpose</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual General Body Strategy Session"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl glass-input"
                />
              </div>

              {/* Quick Slot Presets */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
                  Quick Time Slot Presets:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applySlotPreset('09:00', '12:00')}
                    className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 font-mono text-[11px]"
                  >
                    Morning (09:00 - 12:00)
                  </button>
                  <button
                    type="button"
                    onClick={() => applySlotPreset('13:30', '16:30')}
                    className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 font-mono text-[11px]"
                  >
                    Afternoon (13:30 - 16:30)
                  </button>
                  <button
                    type="button"
                    onClick={() => applySlotPreset('17:00', '20:30')}
                    className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 font-mono text-[11px]"
                  >
                    Evening Gala (17:00 - 20:30)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full p-2 rounded-xl glass-input font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-2 rounded-xl glass-input font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full p-2 rounded-xl glass-input font-mono"
                  />
                </div>
              </div>

              {/* Dynamic Conflict Status Alert */}
              <motion.div
                layout
                className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
                  isCurrentConflict
                    ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                    : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                }`}
              >
                {isCurrentConflict ? (
                  <>
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-xs text-rose-300">Schedule Conflict Detected!</p>
                      <p className="text-[11px] text-rose-400/90 leading-relaxed mt-0.5">
                        An active reservation already occupies this hall during this window. Please select an alternate slot.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-xs text-emerald-300">Facility Slot Available</p>
                      <p className="text-[11px] text-emerald-400/90 leading-relaxed mt-0.5">
                        No overlapping bookings found for {(venues ?? []).find((v) => v.id === selectedVenueId)?.name} on {bookingDate}.
                      </p>
                    </div>
                  </>
                )}
              </motion.div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Equipment & Setup Specifications</label>
                <textarea
                  rows={2}
                  placeholder="Specify AV requirements: Wireless Mics, Dual Projectors, VIP Seating..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full p-2.5 rounded-xl glass-input"
                />
              </div>

              <motion.button
                type="submit"
                disabled={isCurrentConflict}
                whileHover={isCurrentConflict ? {} : { scale: 1.02 }}
                whileTap={isCurrentConflict ? {} : { scale: 0.98 }}
                className={`w-full py-3.5 rounded-2xl font-black text-xs transition-all shadow-xl ${
                  isCurrentConflict
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 shadow-emerald-950/50'
                }`}
              >
                Submit Venue Request to Facilities Office
              </motion.button>
            </form>
          </div>

          {/* Venue Profiles Cards */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-white font-heading">
              BUP Campus Facilities Directory
            </h3>
            {(venues ?? []).map((v) => (
              <motion.div
                key={v.id}
                whileHover={{ y: -3 }}
                className="glass-panel p-4 rounded-2xl border border-white/10 space-y-2.5 text-xs hover:border-emerald-500/40 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white text-xs">{v.name}</h4>
                    <p className="text-[10px] text-slate-400">{v.location}</p>
                  </div>
                  <span className="bg-emerald-500/15 text-emerald-300 font-mono font-bold px-2.5 py-0.5 rounded-lg border border-emerald-500/30 text-[10px]">
                    Cap: {v.capacity}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {(v.facilities ?? []).map((fac, idx) => (
                    <span key={idx} className="bg-slate-900/80 text-slate-300 px-2 py-0.5 rounded-md text-[10px] border border-white/5">
                      {fac}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {(activeTab === 'my-bookings' || activeTab === 'approvals') && (
        <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="p-4 bg-slate-950/80 border-b border-white/10 font-bold text-xs text-white flex justify-between items-center">
            <span>
              {activeTab === 'approvals' ? 'Facilities Office Approval Queue' : 'Facility Reservations Register'}
            </span>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
              Live Database
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-300 font-bold uppercase text-[10px] font-mono">
                <tr>
                  <th className="p-3.5">ID</th>
                  <th className="p-3.5">Event Purpose</th>
                  <th className="p-3.5">Society</th>
                  <th className="p-3.5">Venue</th>
                  <th className="p-3.5">Date & Hours</th>
                  <th className="p-3.5">Status</th>
                  {activeTab === 'approvals' && <th className="p-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(bookings ?? [])
                  .filter((b) => (activeTab === 'approvals' ? b.status === 'Pending' : true))
                  .map((bk) => (
                    <tr key={bk.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-emerald-400">{bk.id}</td>
                      <td className="p-3.5 font-bold text-white">{bk.eventTitle}</td>
                      <td className="p-3.5 text-slate-300">{bk.clubName}</td>
                      <td className="p-3.5 font-medium text-slate-300">{bk.venueName}</td>
                      <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                        {bk.bookingDate} ({bk.startTime} - {bk.endTime})
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-[10px] font-mono ${
                            bk.status === 'Approved'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : bk.status === 'Rejected'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {bk.status}
                        </span>
                      </td>

                      {activeTab === 'approvals' && (
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                soundFx.playSuccess();
                                onUpdateBookingStatus(bk.id, 'Approved');
                              }}
                              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-1 shadow-md shadow-emerald-950/40"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => {
                                soundFx.playClick(400);
                                onUpdateBookingStatus(bk.id, 'Rejected');
                              }}
                              className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-1 shadow-md shadow-rose-950/40"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
