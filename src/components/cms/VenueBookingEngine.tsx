import React, { useState } from 'react';
import { Venue, VenueBooking, Club, UserProfile, UserRole } from '../../types/cms';
import {
  Building2,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  ShieldCheck,
  Search,
  Check,
  X
} from 'lucide-react';

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
  const [selectedVenueId, setSelectedVenueId] = useState<string>(venues[0]?.id || '');
  const [bookingDate, setBookingDate] = useState<string>('2026-08-20');
  const [startTime, setStartTime] = useState<string>('10:00');
  const [endTime, setEndTime] = useState<string>('12:00');
  const [eventTitle, setEventTitle] = useState<string>('');
  const [selectedClubId, setSelectedClubId] = useState<string>(clubs[0]?.id || '');
  const [expectedAttendance, setExpectedAttendance] = useState<number>(100);
  const [requestedEquipment, setRequestedEquipment] = useState<string[]>(['PA System', 'Projector']);
  const [purpose, setPurpose] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'calendar' | 'my-bookings' | 'approvals'>('calendar');

  // Conflict Detection Engine Logic
  const checkVenueConflict = (venueId: string, date: string, start: string, end: string) => {
    return bookings.some((b) => {
      if (b.venueId !== venueId || b.bookingDate !== date || b.status === 'Rejected') return false;

      // Time Overlap Check
      const bStart = b.startTime;
      const bEnd = b.endTime;

      const hasOverlap = (start >= bStart && start < bEnd) || (end > bStart && end <= bEnd) || (start <= bStart && end >= bEnd);
      return hasOverlap;
    });
  };

  const isCurrentConflict = checkVenueConflict(selectedVenueId, bookingDate, startTime, endTime);

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCurrentConflict) {
      alert('Cannot submit booking! Overlapping reservation detected for this venue and time slot.');
      return;
    }

    const selectedVenue = venues.find((v) => v.id === selectedVenueId);
    const selectedClub = clubs.find((c) => c.id === selectedClubId);

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
      requestedEquipment,
      purpose: purpose || 'Official Club Workshop and Seminar',
      status: 'Pending',
      conflictDetected: false,
      submittedBy: `${currentUser.name} (${selectedRole.replace('_', ' ')})`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    });

    setEventTitle('');
    setPurpose('');
    alert('Venue reservation request submitted! The Facilities Office will review.');
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs font-bold bg-emerald-950 text-emerald-400 px-3 py-1 rounded-full border border-emerald-800">
              Facilities Management Engine
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight mt-1">BUP Venue Booking & Conflict Resolver</h2>
            <p className="text-slate-300 text-xs mt-1">
              Automated timetable conflict detection engine for Multipurpose Hall, Auditoriums, and Advanced Labs.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-800 p-2.5 rounded-xl border border-slate-700">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold text-white">Automated Conflict Checking: ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex space-x-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'calendar' ? 'bg-emerald-800 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Reserve Venue
        </button>
        <button
          onClick={() => setActiveTab('my-bookings')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'my-bookings' ? 'bg-emerald-800 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Reservations ({bookings.length})
        </button>
        {(selectedRole === 'Venue_Admin' || selectedRole === 'System_Admin' || selectedRole === 'Faculty_Advisor') && (
          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'approvals' ? 'bg-emerald-800 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Approval Queue ({bookings.filter((b) => b.status === 'Pending').length})
          </button>
        )}
      </div>

      {activeTab === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Reservation Form */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 border-b pb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-700" />
              New Venue Reservation Form
            </h3>

            <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Select Facility / Venue</label>
                  <select
                    value={selectedVenueId}
                    onChange={(e) => setSelectedVenueId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-medium"
                  >
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} (Cap: {v.capacity})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Organizing Club</label>
                  <select
                    value={selectedClubId}
                    onChange={(e) => setSelectedClubId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-medium"
                  >
                    {clubs.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Event / Meeting Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual General Meeting & Strategy Session"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Booking Date</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-2 bg-slate-50 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full p-2 bg-slate-50 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {/* Conflict Status Banner */}
              <div
                className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                  isCurrentConflict
                    ? 'bg-rose-50 border-rose-300 text-rose-900'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                }`}
              >
                {isCurrentConflict ? (
                  <>
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <div>
                      <p className="font-bold">Schedule Conflict Flagged!</p>
                      <p className="text-[11px] text-rose-700">
                        Another event has an approved or pending reservation at this venue during these hours. Please pick another time slot.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold">Facility Slot Available</p>
                      <p className="text-[11px] text-emerald-700">
                        No overlapping bookings found for {venues.find((v) => v.id === selectedVenueId)?.name} on {bookingDate}.
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Purpose & AV Equipment Needed</label>
                <textarea
                  rows={2}
                  placeholder="Describe event scope and equipment needs (Mics, Projector, Stage)..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200"
                />
              </div>

              <button
                type="submit"
                disabled={isCurrentConflict}
                className={`w-full py-3 rounded-xl font-bold text-xs transition-all shadow ${
                  isCurrentConflict
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-800 hover:bg-emerald-900 text-white'
                }`}
              >
                Submit Venue Request to Facilities Office
              </button>
            </form>
          </div>

          {/* Venue Profiles Cards */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">BUP Campus Facilities</h3>
            {venues.map((v) => (
              <div key={v.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900">{v.name}</h4>
                    <p className="text-[10px] text-slate-500">{v.location}</p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                    Cap: {v.capacity}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {v.facilities.map((fac, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px]">
                      {fac}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(activeTab === 'my-bookings' || activeTab === 'approvals') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800">
            {activeTab === 'approvals' ? 'Facilities Office Approval Queue' : 'Facility Reservations History'}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
                <tr>
                  <th className="p-3">Booking ID</th>
                  <th className="p-3">Event / Purpose</th>
                  <th className="p-3">Organizing Club</th>
                  <th className="p-3">Venue</th>
                  <th className="p-3">Date & Hours</th>
                  <th className="p-3">Status</th>
                  {activeTab === 'approvals' && <th className="p-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {bookings
                  .filter((b) => (activeTab === 'approvals' ? b.status === 'Pending' : true))
                  .map((bk) => (
                    <tr key={bk.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-emerald-800">{bk.id}</td>
                      <td className="p-3 font-bold text-slate-900">{bk.eventTitle}</td>
                      <td className="p-3 text-slate-700">{bk.clubName}</td>
                      <td className="p-3 font-medium text-slate-800">{bk.venueName}</td>
                      <td className="p-3 text-slate-600 font-mono text-[11px]">
                        {bk.bookingDate} ({bk.startTime} - {bk.endTime})
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded font-bold text-[10px] ${
                            bk.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : bk.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {bk.status}
                        </span>
                      </td>

                      {activeTab === 'approvals' && (
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onUpdateBookingStatus(bk.id, 'Approved')}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded text-[11px] flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Approve
                            </button>
                            <button
                              onClick={() => onUpdateBookingStatus(bk.id, 'Rejected')}
                              className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-2.5 py-1 rounded text-[11px] flex items-center gap-1"
                            >
                              <X className="w-3 h-3" /> Reject
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
