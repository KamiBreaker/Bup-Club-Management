import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  EventFeedback,
  ClubEvent,
  Club,
  UserProfile,
  UserRole,
  EventRegistration
} from '../../types/cms';
import {
  Star,
  MessageSquareQuote,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Building,
  GraduationCap,
  Send,
  Trash2,
  Award,
  AlertCircle,
  ThumbsUp,
  X,
  ExternalLink,
  Lock,
  LogIn
} from 'lucide-react';
import { soundFx } from '../../utils/audioFx';

interface EventFeedbackHubProps {
  feedbacks: EventFeedback[];
  events: ClubEvent[];
  clubs: Club[];
  currentUser: UserProfile;
  selectedRole: UserRole;
  registrations?: EventRegistration[];
  isGuest?: boolean;
  selectedEventId?: string | null;
  onSelectEventId?: (eventId: string | null) => void;
  onSubmitFeedback: (
    eventId: string,
    rating: number,
    comment: string,
    category?: 'Organization' | 'Content' | 'Venue & Hospitality' | 'General'
  ) => Promise<void> | void;
  onDeleteFeedback?: (feedbackId: string) => Promise<void> | void;
  onRequireAuth?: () => void;
}

export const EventFeedbackHub: React.FC<EventFeedbackHubProps> = ({
  feedbacks = [],
  events = [],
  clubs = [],
  currentUser,
  selectedRole,
  registrations = [],
  isGuest = false,
  selectedEventId = null,
  onSelectEventId,
  onSubmitFeedback,
  onDeleteFeedback,
  onRequireAuth
}) => {
  const [filterEventId, setFilterEventId] = useState<string>(selectedEventId || 'All');
  const [filterClubId, setFilterClubId] = useState<string>('All');
  const [filterRating, setFilterRating] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // New Feedback Form State
  const [targetEventId, setTargetEventId] = useState<string>(
    selectedEventId || events[0]?.id || ''
  );
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [category, setCategory] = useState<'Organization' | 'Content' | 'Venue & Hospitality' | 'General'>('General');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);

  // Sync external selectedEventId
  React.useEffect(() => {
    if (selectedEventId) {
      setFilterEventId(selectedEventId);
      setTargetEventId(selectedEventId);
      setIsFormOpen(true);
    }
  }, [selectedEventId]);

  // Check if current user is registered for the selected target event
  const isUserRegisteredForTarget = useMemo(() => {
    if (isGuest) return false;
    if (selectedRole === 'System_Admin') return true;

    const targetEvent = events.find((e) => e.id === targetEventId);
    if (!targetEvent) return false;

    // Check in event.registeredUserIds
    const inRegisteredIds = (targetEvent.registeredUserIds || []).some(
      (id) => id === currentUser.id || id === currentUser.studentId
    );

    // Check in registrations list
    const inRegistrations = (registrations || []).some(
      (r) =>
        r.eventId === targetEventId &&
        (r.userId === currentUser.id || r.studentId === currentUser.studentId) &&
        r.status === 'Confirmed'
    );

    return inRegisteredIds || inRegistrations;
  }, [targetEventId, events, registrations, currentUser, selectedRole, isGuest]);

  // Check existing feedback by user for target event
  const existingUserFeedback = useMemo(() => {
    if (isGuest) return null;
    return feedbacks.find(
      (f) =>
        f.eventId === targetEventId &&
        (f.userId === currentUser.id || f.studentId === currentUser.studentId)
    );
  }, [feedbacks, targetEventId, currentUser, isGuest]);

  // Prepopulate form if existing feedback found
  React.useEffect(() => {
    if (existingUserFeedback) {
      setRating(existingUserFeedback.rating);
      setComment(existingUserFeedback.comment);
      if (existingUserFeedback.category) {
        setCategory(existingUserFeedback.category);
      }
    }
  }, [existingUserFeedback, targetEventId]);

  // Filtered feedbacks
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((fb) => {
      const matchesEvent = filterEventId === 'All' || fb.eventId === filterEventId;
      const matchesClub = filterClubId === 'All' || fb.clubId === filterClubId;
      const matchesRating = filterRating === 'All' || fb.rating === Number(filterRating);

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        fb.eventTitle.toLowerCase().includes(q) ||
        fb.studentName.toLowerCase().includes(q) ||
        fb.department.toLowerCase().includes(q) ||
        fb.comment.toLowerCase().includes(q) ||
        fb.clubName.toLowerCase().includes(q);

      return matchesEvent && matchesClub && matchesRating && matchesSearch;
    });
  }, [feedbacks, filterEventId, filterClubId, filterRating, searchQuery]);

  // Rating metrics
  const stats = useMemo(() => {
    const list = filterEventId === 'All' ? feedbacks : feedbacks.filter((f) => f.eventId === filterEventId);
    const count = list.length;
    if (count === 0) return { avg: 0, count: 0, counts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };

    const sum = list.reduce((acc, f) => acc + f.rating, 0);
    const counts = {
      5: list.filter((f) => f.rating === 5).length,
      4: list.filter((f) => f.rating === 4).length,
      3: list.filter((f) => f.rating === 3).length,
      2: list.filter((f) => f.rating === 2).length,
      1: list.filter((f) => f.rating === 1).length
    };

    return {
      avg: Number((sum / count).toFixed(1)),
      count,
      counts
    };
  }, [feedbacks, filterEventId]);

  const ratingDescriptions: { [key: number]: string } = {
    5: '⭐ 5 Stars — Outstanding & Exceptional!',
    4: '⭐ 4 Stars — Very Good & Engaging!',
    3: '⭐ 3 Stars — Satisfactory / Average',
    2: '⭐ 2 Stars — Needs Improvement',
    1: '⭐ 1 Star — Poor Experience'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      if (onRequireAuth) onRequireAuth();
      return;
    }

    if (!targetEventId) {
      alert('Please select an event to review.');
      return;
    }

    if (!comment.trim()) {
      alert('Please write your feedback comment.');
      return;
    }

    setIsSubmitting(true);
    soundFx.playClick(800);

    try {
      await onSubmitFeedback(targetEventId, rating, comment.trim(), category);
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#38bdf8']
        });
      } catch {}
      soundFx.playSuccess();
      setIsFormOpen(false);
      setComment('');
    } catch (err: any) {
      alert(err.message || 'Failed to submit feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedEventObj = events.find((e) => e.id === targetEventId);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Campus Experience & Event Reviews</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-heading tracking-tight">
              Event Feedbacks & Quality Ratings
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Official student feedbacks, ratings, and verified peer evaluations across BUP campus events.
              {isGuest
                ? ' Guest users can explore and read all reviews freely.'
                : ' Registered event attendees can submit ratings to help improve future societies.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isGuest ? (
              <button
                type="button"
                onClick={onRequireAuth}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-950/40 flex items-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Give Feedback</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setIsFormOpen(!isFormOpen);
                }}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-950/40 flex items-center gap-2 cursor-pointer"
              >
                <Star className="w-4 h-4 fill-slate-950" />
                <span>{isFormOpen ? 'Close Feedback Form' : '+ Give Event Feedback'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Review Form Drawer (for Registered Users) */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="overflow-hidden"
          >
            <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-amber-500/30 bg-slate-900/90 shadow-2xl relative space-y-5">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-extrabold text-sm sm:text-base">
                      {existingUserFeedback ? 'Update Your Event Feedback' : 'Submit Event Feedback & Review'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Share your genuine feedback to help organizing teams elevate campus activities.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isGuest ? (
                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-3">
                  <Lock className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="text-xs text-slate-300 font-medium">
                    You are exploring as a <strong className="text-amber-300">Guest Viewer</strong>. Guest users can browse all reviews, but feedback submission requires an active BUP student session.
                  </p>
                  <button
                    type="button"
                    onClick={onRequireAuth}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition cursor-pointer"
                  >
                    Sign In with Student ID →
                  </button>
                </div>
              ) : !isUserRegisteredForTarget ? (
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <p className="font-bold text-white">Verified Registration Required</p>
                    <p className="text-slate-300 mt-0.5 leading-relaxed">
                      You are not registered for <strong className="text-amber-300">{selectedEventObj?.title || 'this event'}</strong>. To maintain high credibility, reviews can only be submitted by registered attendees. Select an event you registered for or RSVP on the calendar!
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <label className="text-[11px] text-slate-400">Select another event:</label>
                      <select
                        value={targetEventId}
                        onChange={(e) => setTargetEventId(e.target.value)}
                        className="bg-slate-900 border border-white/15 text-white rounded-lg px-2.5 py-1 text-xs outline-none"
                      >
                        {events.map((ev) => (
                          <option key={ev.id} value={ev.id}>
                            {ev.title} ({ev.date})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Event Selection */}
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Select Event</label>
                      <select
                        value={targetEventId}
                        onChange={(e) => setTargetEventId(e.target.value)}
                        className="w-full rounded-xl glass-input px-3 py-2 text-xs text-white outline-none cursor-pointer"
                      >
                        {events.map((ev) => (
                          <option key={ev.id} value={ev.id} className="bg-slate-950">
                            {ev.title} — {ev.clubName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Feedback Category */}
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Feedback Category</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(['General', 'Organization', 'Content', 'Venue & Hospitality'] as const).map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              soundFx.playClick();
                              setCategory(cat);
                            }}
                            className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition cursor-pointer truncate ${
                              category === cat
                                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow'
                                : 'bg-slate-950/60 text-slate-300 border-white/10 hover:border-white/20'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 5-Star Interactive Rating */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="block text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        Your Overall Star Rating
                      </span>
                      <p className="text-amber-300 font-semibold text-xs mt-0.5">
                        {ratingDescriptions[hoverRating || rating]}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((starVal) => {
                        const isFilled = (hoverRating || rating) >= starVal;
                        return (
                          <button
                            key={starVal}
                            type="button"
                            onMouseEnter={() => setHoverRating(starVal)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => {
                              soundFx.playClick(600 + starVal * 80);
                              setRating(starVal);
                            }}
                            className="p-1 rounded-lg transition-transform hover:scale-125 cursor-pointer focus:outline-none"
                          >
                            <Star
                              className={`w-7 h-7 transition-colors ${
                                isFilled
                                  ? 'fill-amber-400 text-amber-400 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                                  : 'text-slate-600'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Feedback Comment */}
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Detailed Review & Constructive Suggestions
                    </label>
                    <textarea
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your experience: What went well? How was the venue and speaker? What can the organizing committee do better next time?"
                      className="w-full rounded-2xl glass-input p-3.5 text-xs text-white placeholder-slate-500 outline-none resize-none"
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-950/40 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Submitting...' : existingUserFeedback ? 'Update Review' : 'Publish Review'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ratings Overview Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Metric summary card */}
        <div className="glass-panel p-5 rounded-3xl border border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/40 flex flex-col items-center justify-center text-amber-300 shadow-inner">
              <span className="text-2xl font-black">{stats.avg}</span>
              <span className="text-[9px] font-mono text-slate-400">/ 5.0</span>
            </div>
            <div>
              <div className="flex items-center gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${s <= Math.round(stats.avg) ? 'fill-amber-400' : 'text-slate-600'}`}
                  />
                ))}
              </div>
              <p className="text-white font-extrabold text-sm mt-1">
                {stats.count} Verified Feedback{stats.count === 1 ? '' : 's'}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                {filterEventId === 'All' ? 'Across all BUP events' : 'For selected event'}
              </p>
            </div>
          </div>
        </div>

        {/* Rating Breakdown Bars */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-3xl border border-white/10 flex flex-col justify-center space-y-1.5">
          {[5, 4, 3, 2, 1].map((stars) => {
            const starCount = stats.counts[stars as keyof typeof stats.counts] || 0;
            const percentage = stats.count > 0 ? Math.round((starCount / stats.count) * 100) : 0;
            return (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <span className="w-10 text-slate-400 font-mono font-bold flex items-center gap-1 shrink-0">
                  <span>{stars}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </span>
                <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                  />
                </div>
                <span className="w-12 text-right font-mono text-slate-400 text-[11px]">
                  {percentage}% ({starCount})
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search feedback by keyword, student, or event..."
              className="w-full rounded-xl glass-input pl-8 pr-3 py-2 text-xs outline-none"
            />
          </div>

          {/* Event Filter */}
          <select
            value={filterEventId}
            onChange={(e) => {
              setFilterEventId(e.target.value);
              if (onSelectEventId) {
                onSelectEventId(e.target.value === 'All' ? null : e.target.value);
              }
            }}
            className="rounded-xl glass-input px-3 py-2 text-xs text-white outline-none cursor-pointer max-w-[200px] truncate"
          >
            <option value="All" className="bg-slate-950">All Events</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id} className="bg-slate-950">
                {ev.title}
              </option>
            ))}
          </select>

          {/* Club Filter */}
          <select
            value={filterClubId}
            onChange={(e) => setFilterClubId(e.target.value)}
            className="rounded-xl glass-input px-3 py-2 text-xs text-white outline-none cursor-pointer max-w-[180px] truncate"
          >
            <option value="All" className="bg-slate-950">All Societies</option>
            {clubs.map((c) => (
              <option key={c.id} value={c.id} className="bg-slate-950">
                {c.name}
              </option>
            ))}
          </select>

          {/* Star Filter */}
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="rounded-xl glass-input px-3 py-2 text-xs text-white outline-none cursor-pointer"
          >
            <option value="All" className="bg-slate-950">All Ratings</option>
            <option value="5" className="bg-slate-950">5 Stars</option>
            <option value="4" className="bg-slate-950">4 Stars</option>
            <option value="3" className="bg-slate-950">3 Stars</option>
            <option value="2" className="bg-slate-950">2 Stars</option>
            <option value="1" className="bg-slate-950">1 Star</option>
          </select>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing <strong className="text-white">{filteredFeedbacks.length}</strong> reviews
        </span>
      </div>

      {/* Feedbacks Grid */}
      {filteredFeedbacks.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border border-white/10 text-center space-y-3">
          <MessageSquareQuote className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-white font-bold text-base">No Feedbacks Found</h3>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            {searchQuery || filterEventId !== 'All' || filterRating !== 'All'
              ? 'No reviews match your selected filters. Try resetting the search or filter options.'
              : 'Be the first registered attendee to share an honest review about a BUP campus event!'}
          </p>
          {(searchQuery || filterEventId !== 'All' || filterRating !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setFilterEventId('All');
                setFilterClubId('All');
                setFilterRating('All');
                setSearchQuery('');
              }}
              className="mt-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFeedbacks.map((fb) => {
            const isAuthor = !isGuest && (fb.userId === currentUser.id || fb.studentId === currentUser.studentId);
            const canDelete = isAuthor || selectedRole === 'System_Admin';

            return (
              <motion.div
                key={fb.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="glass-panel p-5 rounded-3xl border border-white/10 bg-slate-900/60 hover:border-amber-500/30 transition-all shadow-lg space-y-3.5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Bar: Event Title, Club, and Rating */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block truncate">
                        {fb.clubName}
                      </span>
                      <h4 className="text-white font-extrabold text-sm truncate" title={fb.eventTitle}>
                        {fb.eventTitle}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-full shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-black text-amber-300 text-xs font-mono">{fb.rating}.0</span>
                    </div>
                  </div>

                  {/* Category Pill */}
                  {fb.category && (
                    <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-teal-300 border border-white/10">
                      {fb.category}
                    </span>
                  )}

                  {/* Comment Body */}
                  <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/5 text-xs text-slate-200 leading-relaxed italic">
                    "{fb.comment}"
                  </div>
                </div>

                {/* Bottom Bar: Reviewer info and timestamp */}
                <div className="flex items-center justify-between border-t border-white/5 pt-3 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-[10px]">
                      {fb.studentName.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-white block">{fb.studentName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {fb.department} • ID: {fb.studentId}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-500">{fb.createdAt}</span>

                    {canDelete && onDeleteFeedback && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Delete this feedback review?')) {
                            onDeleteFeedback(fb.id);
                          }
                        }}
                        title="Delete Review"
                        className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
