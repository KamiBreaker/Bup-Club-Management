import React, { useState } from 'react';
import { ClubEvent, Club, Venue, UserProfile, UserRole } from '../../types/cms';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  QrCode,
  Sparkles,
  Plus,
  CheckCircle,
  X,
  Share2,
  Tag
} from 'lucide-react';

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

  // New Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newClubId, setNewClubId] = useState(clubs[0]?.id || '');
  const [newCategory, setNewCategory] = useState<'Workshop' | 'Competition' | 'Cultural' | 'Seminar' | 'Recruitment' | 'Training'>('Workshop');
  const [newDescription, setNewDescription] = useState('');
  const [newPosterUrl, setNewPosterUrl] = useState('https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80');
  const [newDate, setNewDate] = useState('2026-08-25');
  const [newStartTime, setNewStartTime] = useState('10:00');
  const [newEndTime, setNewEndTime] = useState('13:00');
  const [newVenueId, setNewVenueId] = useState(venues[0]?.id || '');
  const [newMaxSeats, setNewMaxSeats] = useState(150);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const categories = ['All', 'Workshop', 'Competition', 'Cultural', 'Seminar', 'Recruitment', 'Training'];

  const filteredEvents = events.filter((evt) => {
    const matchesCategory = selectedCategory === 'All' || evt.category === selectedCategory;
    const isUserRegistered = evt.registeredUserIds.includes(currentUser.id);

    if (activeTab === 'Upcoming') return matchesCategory && evt.status === 'Upcoming';
    if (activeTab === 'Registered') return matchesCategory && isUserRegistered;

    return matchesCategory;
  });

  const handleGenerateAiDescription = async () => {
    if (!newTitle) {
      alert('Please enter an event title first so AI can generate a description!');
      return;
    }

    setIsGeneratingAi(true);

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Generate an engaging 3-sentence university club event description for "${newTitle}" under category "${newCategory}" for Bangladesh University of Professionals (BUP). Focus on learning outcomes and student participation.`,
          systemInstruction: 'You are an expert BUP Club Event Coordinator.'
        })
      });

      const data = await response.json();
      if (data.text) {
        setNewDescription(data.text);
      } else {
        setNewDescription(`Join us for ${newTitle}! An official ${newCategory} hosted at BUP designed to foster practical skills, peer collaboration, and student excellence.`);
      }
    } catch (error) {
      console.error(error);
      setNewDescription(`Join us for ${newTitle}! An official ${newCategory} hosted at BUP designed to foster practical skills, peer collaboration, and student excellence.`);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedClub = clubs.find((c) => c.id === newClubId);
    const selectedVenue = venues.find((v) => v.id === newVenueId);

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
      registeredCount: 0,
      status: 'Upcoming',
      isRSVPAllowed: true,
      registeredUserIds: [currentUser.id]
    });

    setIsCreateModalOpen(false);
    // Reset
    setNewTitle('');
    setNewDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-linear-to-r from-emerald-900 via-slate-900 to-teal-900 text-white p-6 rounded-2xl shadow-md border border-emerald-800/40">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
              Campus Calendar & RSVPs
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight mt-1">BUP Event Management</h2>
            <p className="text-emerald-200/80 text-xs mt-1">
              Discover upcoming workshops, seminars, competitions, and national conventions. RSVP to claim digital pass.
            </p>
          </div>

          {(selectedRole === 'Club_Exec' || selectedRole === 'System_Admin' || selectedRole === 'Faculty_Advisor') && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shrink-0"
            >
              <Plus className="w-4 h-4" />
              Create Club Event
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Category Filter */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('All')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'All' ? 'bg-emerald-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Events ({events.length})
          </button>
          <button
            onClick={() => setActiveTab('Upcoming')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'Upcoming' ? 'bg-emerald-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab('Registered')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'Registered' ? 'bg-emerald-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My RSVPs
          </button>
        </div>

        {/* Category Selector */}
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredEvents.map((evt) => {
          const isRegistered = evt.registeredUserIds.includes(currentUser.id);
          const isFull = evt.registeredCount >= evt.maxSeats;

          return (
            <div
              key={evt.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Poster */}
                <div className="h-44 relative bg-slate-900 overflow-hidden">
                  <img src={evt.posterUrl} alt={evt.title} className="w-full h-full object-cover opacity-90" />
                  <div className="absolute inset-0 bg-linear-to-t from-slate-950/90 via-slate-950/20 to-transparent"></div>

                  <span className="absolute top-3 left-3 bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                    {evt.category}
                  </span>

                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={evt.clubLogo} alt={evt.clubName} className="w-7 h-7 rounded-lg ring-2 ring-emerald-400 bg-white" />
                      <span className="text-xs font-bold text-white drop-shadow">{evt.clubName}</span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-300 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
                      {evt.registeredCount} / {evt.maxSeats} Registered
                    </span>
                  </div>
                </div>

                {/* Event Info */}
                <div className="p-5 space-y-3">
                  <h3 className="font-extrabold text-slate-900 text-base leading-snug">{evt.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{evt.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 font-medium pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{evt.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>{evt.startTime} - {evt.endTime}</span>
                    </div>
                    <div className="col-span-2 flex items-center gap-1.5 text-slate-800">
                      <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="truncate">{evt.venueName}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                {isRegistered ? (
                  <div className="flex items-center gap-2 w-full justify-between">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      RSVP Confirmed
                    </span>
                    <button
                      onClick={() => setActiveQrModal(evt)}
                      className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all shadow-sm"
                    >
                      <QrCode className="w-3.5 h-3.5 text-amber-300" />
                      View QR Pass
                    </button>
                  </div>
                ) : isFull ? (
                  <span className="text-xs font-bold text-rose-700 bg-rose-100 px-3 py-1.5 rounded-lg w-full text-center">
                    Event Seats Full
                  </span>
                ) : (
                  <button
                    onClick={() => onRSVP(evt.id)}
                    className="w-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold py-2 rounded-xl transition-all shadow"
                  >
                    RSVP & Claim Pass
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* QR Code Pass Modal */}
      {activeQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center border border-slate-200 shadow-2xl relative space-y-4">
            <button
              onClick={() => setActiveQrModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-block p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
              <QrCode className="w-32 h-32 text-emerald-800 mx-auto" />
            </div>

            <div>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded uppercase">
                Official BUP Verified Pass
              </span>
              <h3 className="text-base font-extrabold text-slate-900 mt-1">{activeQrModal.title}</h3>
              <p className="text-xs text-slate-500">{activeQrModal.venueName}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left text-[11px] space-y-1">
              <p className="flex justify-between">
                <span className="text-slate-500">Attendee:</span>
                <strong className="text-slate-900">{currentUser.name}</strong>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-500">Student ID:</span>
                <strong className="font-mono text-emerald-800">{currentUser.studentId}</strong>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-500">Date & Time:</span>
                <span>{activeQrModal.date} ({activeQrModal.startTime})</span>
              </p>
            </div>

            <p className="text-[10px] text-slate-400 italic">
              Present this encrypted QR code to the Club Usher at the hall entrance for instant scan check-in.
            </p>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Create New BUP Club Event</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Hosting Club</label>
                <select
                  value={newClubId}
                  onChange={(e) => setNewClubId(e.target.value)}
                  className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 font-medium"
                >
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BUP Tech Summit 2026"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <option value="Workshop">Workshop</option>
                    <option value="Competition">Competition</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Recruitment">Recruitment</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Max Seats</label>
                  <input
                    type="number"
                    value={newMaxSeats}
                    onChange={(e) => setNewMaxSeats(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-slate-800">Description</label>
                  <button
                    type="button"
                    onClick={handleGenerateAiDescription}
                    disabled={isGeneratingAi}
                    className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    {isGeneratingAi ? 'Generating...' : 'Auto-Generate with AI'}
                  </button>
                </div>
                <textarea
                  rows={3}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Start</label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">End</label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Venue Location</label>
                <select
                  value={newVenueId}
                  onChange={(e) => setNewVenueId(e.target.value)}
                  className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 font-medium"
                >
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>{v.name} ({v.capacity} seats)</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2.5 rounded-xl transition-all shadow"
              >
                Publish Event
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
