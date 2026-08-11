import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Club, UserProfile, UserRole } from '../../types/cms';
import {
  Users,
  Search,
  CheckCircle,
  Clock,
  Calendar,
  UserCheck,
  UserPlus,
  ExternalLink,
  X,
  Sparkles,
  Award,
  Mail,
  Copy,
  Check,
  Filter
} from 'lucide-react';
import { soundFx } from '../../utils/audioFx';

interface ClubDirectoryProps {
  clubs: Club[];
  currentUser: UserProfile;
  selectedRole: UserRole;
  onJoinClub: (clubId: string) => void;
  onLeaveClub: (clubId: string) => void;
}

export const ClubDirectory: React.FC<ClubDirectoryProps> = ({
  clubs,
  currentUser,
  selectedRole,
  onJoinClub,
  onLeaveClub
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeClubModal, setActiveClubModal] = useState<Club | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const categories = ['All', 'Cultural', 'Technical', 'Business', 'Sports', 'Academic', 'Social Work'];

  const filteredClubs = (clubs ?? []).filter((club) => {
    if (!club) return false;
    const name = club.name || '';
    const code = club.code || '';
    const tagline = club.tagline || '';
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tagline.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || club.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getMembershipStatus = (clubId: string) => {
    const memberships = currentUser?.clubMemberships ?? [];
    const membership = memberships.find((m) => m.clubId === clubId);
    return membership ? membership.status : null;
  };

  const handleJoinWithCelebration = (clubId: string) => {
    soundFx.playSuccess();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#10b981', '#06b6d4', '#38bdf8', '#34d399']
      });
    } catch {}
    onJoinClub(clubId);
  };

  const handleCopyEmail = (email: string) => {
    soundFx.playClick();
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 350, damping: 25 } }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Cyber Banner */}
      <div className="relative overflow-hidden rounded-3xl glass-panel-glow p-6 sm:p-8 border border-emerald-500/30">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Official Student Co-Curricular Roster</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-heading">
              BUP Clubs & Societies
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Explore officially accredited student chapters, academic societies, and executive committees across all BUP faculties.
            </p>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto p-4 rounded-2xl bg-slate-900/80 border border-white/10 shrink-0">
            <span className="text-[11px] text-slate-400 font-medium">Registered Societies</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {(clubs ?? []).length} Active
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search society name, code, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl glass-input placeholder-slate-400 focus:outline-none"
          />
        </div>

        {/* Category Pills */}
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
                className={`relative px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'text-emerald-950 font-extrabold bg-emerald-400 shadow-md shadow-emerald-950/40'
                    : 'bg-slate-900/70 text-slate-300 hover:bg-slate-800 border border-white/5'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Clubs Grid with Staggered Motion */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredClubs.map((club) => {
          const membershipStatus = getMembershipStatus(club.id);

          return (
            <motion.div
              key={club.id}
              variants={itemVariants}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="glass-panel rounded-3xl border border-white/10 overflow-hidden flex flex-col justify-between group hover:border-emerald-500/40 transition-all shadow-xl hover:shadow-emerald-950/20"
            >
              <div>
                {/* Banner Image */}
                <div className="h-32 relative overflow-hidden bg-slate-900">
                  <img
                    src={club.bannerUrl}
                    alt={club.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d1320] via-transparent to-transparent" />

                  <span className="absolute top-3 right-3 bg-slate-950/85 text-emerald-300 text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border border-emerald-500/30 backdrop-blur-md">
                    {club.code}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 pt-0 relative space-y-3">
                  <div className="flex justify-between items-end -mt-9 mb-2">
                    <img
                      src={club.logoUrl}
                      alt={club.name}
                      className="w-16 h-16 rounded-2xl object-cover ring-4 ring-[#0d1320] shadow-xl bg-slate-900"
                    />
                    <span className="bg-emerald-500/15 text-emerald-300 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-500/30">
                      {club.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-white text-sm group-hover:text-emerald-400 transition-colors leading-snug">
                      {club.name}
                    </h3>
                    <p className="text-[11px] text-emerald-400/80 font-mono italic mt-0.5 line-clamp-1">
                      {club.tagline}
                    </p>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {club.description}
                  </p>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      <strong className="text-white font-mono">{club.memberCount}</strong> Members
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-teal-400" />
                      <strong className="text-white font-mono">{club.featuredEventsCount}</strong> Events
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-4 bg-slate-950/60 border-t border-white/10 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setActiveClubModal(club);
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 hover:underline transition-all"
                >
                  <span>Execs & Details</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                {membershipStatus === 'Active' ? (
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      onLeaveClub(club.id);
                    }}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-white/10 hover:border-rose-500/40 transition-all"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Member (Leave)</span>
                  </button>
                ) : membershipStatus === 'Pending' ? (
                  <span className="bg-amber-500/15 text-amber-300 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-amber-500/30 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pending</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleJoinWithCelebration(club.id)}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-[11px] font-extrabold px-4 py-1.5 rounded-xl shadow-lg shadow-emerald-950/40 transition-all hover:scale-105"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Join Club</span>
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Club Details & Executive Roster Modal */}
      <AnimatePresence>
        {activeClubModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveClubModal(null)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="glass-panel rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-emerald-500/30 shadow-2xl relative z-10"
            >
              <button
                onClick={() => setActiveClubModal(null)}
                className="absolute top-4 right-4 bg-slate-950/80 hover:bg-slate-900 text-white rounded-full p-2 z-20 border border-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Modal Banner */}
              <div className="h-40 relative bg-slate-900">
                <img
                  src={activeClubModal.bannerUrl}
                  alt={activeClubModal.name}
                  className="w-full h-full object-cover opacity-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d1320] via-slate-950/40 to-transparent" />
                <div className="absolute bottom-4 left-6 flex items-center gap-3">
                  <img
                    src={activeClubModal.logoUrl}
                    alt={activeClubModal.name}
                    className="w-16 h-16 rounded-2xl ring-2 ring-emerald-400 bg-slate-900 shadow-xl"
                  />
                  <div>
                    <h3 className="text-lg font-black text-white font-heading">{activeClubModal.name}</h3>
                    <p className="text-xs text-emerald-300 font-mono">{activeClubModal.tagline}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6 text-xs text-slate-200">
                <div>
                  <h4 className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] mb-1">
                    About Society
                  </h4>
                  <p className="leading-relaxed text-slate-300">{activeClubModal.description}</p>
                </div>

                {/* Faculty Advisor */}
                {activeClubModal.facultyAdvisor && (
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                        Faculty Advisor
                      </span>
                      <p className="text-xs font-bold text-white mt-0.5">
                        {activeClubModal.facultyAdvisor.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {activeClubModal.facultyAdvisor.designation}
                      </p>
                    </div>

                    <button
                      onClick={() => handleCopyEmail(activeClubModal.facultyAdvisor.email)}
                      className="flex items-center gap-1.5 text-[11px] font-mono bg-emerald-950/80 text-emerald-300 px-3 py-1.5 rounded-xl border border-emerald-500/30 hover:bg-emerald-900 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{activeClubModal.facultyAdvisor.email}</span>
                      {copiedEmail === activeClubModal.facultyAdvisor.email ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                  </div>
                )}

                {/* Executive Roster */}
                <div>
                  <h4 className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] mb-3">
                    Executive Committee Roster
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(activeClubModal.executives ?? []).map((exec, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/60 border border-white/10"
                      >
                        <img
                          src={exec.avatar}
                          alt={exec.name}
                          className="w-11 h-11 rounded-xl object-cover ring-1 ring-white/10 bg-slate-800"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-white text-xs truncate">{exec.name}</p>
                          <p className="text-[10px] text-emerald-400 font-semibold">{exec.designation}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {exec.studentId}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
