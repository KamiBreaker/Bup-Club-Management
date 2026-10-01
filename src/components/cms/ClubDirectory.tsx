import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Club, UserProfile, UserRole, MembershipApplication } from '../../types/cms';
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
  Filter,
  FileText,
  Target,
  Trophy,
  AlertCircle,
  CheckCircle2,
  Send,
  ShieldCheck
} from 'lucide-react';
import { soundFx } from '../../utils/audioFx';

interface ClubDirectoryProps {
  clubs: Club[];
  currentUser: UserProfile;
  selectedRole: UserRole;
  applications?: MembershipApplication[];
  onApplyForMembership: (
    clubId: string,
    form: {
      statementOfPurpose: string;
      skillsInterests: string;
      phone: string;
      roleName: string;
      applicationType?: 'Member' | 'Executive' | 'Moderator';
    }
  ) => void;
  onJoinClub?: (clubId: string) => void;
  onLeaveClub: (clubId: string) => void;
}

export const ClubDirectory: React.FC<ClubDirectoryProps> = ({
  clubs,
  currentUser,
  selectedRole,
  applications = [],
  onApplyForMembership,
  onJoinClub,
  onLeaveClub
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeClubModal, setActiveClubModal] = useState<Club | null>(null);
  const [applyingClub, setApplyingClub] = useState<Club | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Application Form State
  const [applicationType, setApplicationType] = useState<'Member' | 'Executive'>('Member');
  const [roleName, setRoleName] = useState('General Member');
  const [phone, setPhone] = useState('');
  const [statementOfPurpose, setStatementOfPurpose] = useState('');
  const [skillsInterests, setSkillsInterests] = useState('');
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);

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
    if (membership && membership.status === 'Active') return 'Active';

    // Check pending application in applications list
    const hasPendingApp = applications.some(
      (a) => a.clubId === clubId && (a.userId === currentUser.id || a.studentId === currentUser.studentId) && a.status === 'Pending'
    );
    if (hasPendingApp) return 'Pending';

    return null;
  };

  const handleOpenApplyModal = (club: Club, initialType: 'Member' | 'Executive' = 'Member') => {
    soundFx.playClick();
    setApplyingClub(club);
    setApplicationType(initialType);
    setRoleName(initialType === 'Executive' ? 'Club Moderator' : 'General Member');
    setPhone('');
    setStatementOfPurpose('');
    setSkillsInterests('');
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingClub) return;

    if (!statementOfPurpose.trim()) {
      alert('Please provide a brief statement of purpose for joining.');
      return;
    }

    setIsSubmittingApp(true);
    soundFx.playSuccess();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#10b981', '#06b6d4', '#38bdf8', '#34d399']
      });
    } catch {}

    onApplyForMembership(applyingClub.id, {
      statementOfPurpose,
      skillsInterests,
      phone,
      roleName,
      applicationType
    });

    setIsSubmittingApp(false);
    setApplyingClub(null);
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
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl glass-panel-glow p-6 sm:p-8 border border-emerald-500/30">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Student Affairs Division • Accredited Societies</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-heading">
              BUP Clubs & Societies Directory
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Explore university clubs, check recruitment prerequisites, review executive committee rosters, and submit your official membership application.
            </p>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto p-4 rounded-2xl bg-slate-900/80 border border-white/10 shrink-0">
            <span className="text-[11px] text-slate-400 font-medium">Accredited Societies</span>
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

      {/* Clubs Grid */}
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

                  {club.recruitmentDeadline && (
                    <span className="absolute bottom-2 right-3 text-[9px] font-mono font-bold bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                      Recruitment until {club.recruitmentDeadline}
                    </span>
                  )}
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
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-rose-300 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-white/10 hover:border-rose-500/40 transition-all"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Member (Leave)</span>
                  </button>
                ) : membershipStatus === 'Pending' ? (
                  <span className="bg-amber-500/15 text-amber-300 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-amber-500/30 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Review Pending</span>
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenApplyModal(club, 'Member')}
                      className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] font-bold px-2.5 py-1.5 rounded-xl border border-emerald-500/30 transition-all hover:scale-102 cursor-pointer"
                      title="Apply as General Club Member"
                    >
                      <Users className="w-3 h-3 text-emerald-400" />
                      <span>Join Member</span>
                    </button>
                    <button
                      onClick={() => handleOpenApplyModal(club, 'Executive')}
                      className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-[10px] font-black px-2.5 py-1.5 rounded-xl shadow-md transition-all hover:scale-102 cursor-pointer"
                      title="Apply to become a Club Executive or Moderator"
                    >
                      <Award className="w-3 h-3" />
                      <span>👑 Apply Exec/Mod</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* RECRUITMENT APPLICATION MODAL */}
      <AnimatePresence>
        {applyingClub && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setApplyingClub(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel-glow border border-emerald-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full bg-[#0a101b] shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-start border-b border-white/10 pb-4">
                <div>
                  <span className="text-emerald-400 text-[11px] font-mono font-bold uppercase tracking-wider">
                    Official Student Society Recruitment
                  </span>
                  <h3 className="text-xl font-extrabold text-white mt-0.5">
                    Apply to {applyingClub.name}
                  </h3>
                  <p className="text-slate-400 text-xs">{applyingClub.tagline}</p>
                </div>
                <button
                  onClick={() => setApplyingClub(null)}
                  className="p-1 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Recruitment Requirements */}
              {applyingClub.membershipRequirements && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs space-y-1">
                  <span className="font-bold text-emerald-300 block">Eligibility & Requirements:</span>
                  <ul className="list-disc list-inside text-slate-300 space-y-0.5 text-[11px]">
                    {applyingClub.membershipRequirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmitApplication} className="space-y-4 text-xs">
                {/* Application Category Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    Choose Application Category
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/90 rounded-2xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        setApplicationType('Member');
                        setRoleName('General Member');
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        applicationType === 'Member'
                          ? 'bg-emerald-400 text-slate-950 font-black shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>General Member</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        setApplicationType('Executive');
                        setRoleName('Club Moderator');
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        applicationType === 'Executive'
                          ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 font-black shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>👑 Club Exec / Moderator</span>
                    </button>
                  </div>
                </div>

                {/* Executive Callout */}
                {applicationType === 'Executive' && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/50 to-orange-950/40 border border-amber-500/40 text-[11px] text-amber-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-amber-300">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>Executive Committee & Moderator Position</span>
                    </div>
                    <p className="leading-relaxed text-slate-300">
                      You are applying for official leadership and moderation of <strong>{applyingClub.name}</strong>. Upon governance approval, you will be inducted into the club's Executive Committee with candidate screening, Q&A inquiry, and operational permissions.
                    </p>
                  </div>
                )}

                {/* Pre-filled Student Details */}
                <div className="p-3 rounded-2xl bg-slate-900 border border-white/10 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <div>
                    <span className="text-slate-500 block">Applicant:</span>
                    <strong className="text-white">{currentUser.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Student ID:</span>
                    <span className="text-emerald-400 font-mono font-bold">{currentUser.studentId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Department:</span>
                    <span>{currentUser.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Batch:</span>
                    <span>Batch {currentUser.batch}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      {applicationType === 'Executive' ? 'Target Executive / Moderator Post' : 'Role / Sub-Committee Applied For'}
                    </label>
                    {applicationType === 'Executive' ? (
                      <select
                        value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
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
                    ) : (
                      <select
                        value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                        className="w-full p-2.5 rounded-xl glass-input text-slate-200 focus:outline-none cursor-pointer"
                      >
                        <option value="General Member" className="bg-slate-950 text-white">General Member</option>
                        <option value="Sub-Executive (Technical)" className="bg-slate-950 text-white">Sub-Executive (Technical)</option>
                        <option value="Sub-Executive (Creative & Media)" className="bg-slate-950 text-white">Sub-Executive (Creative & Media)</option>
                        <option value="Sub-Executive (Operations)" className="bg-slate-950 text-white">Sub-Executive (Operations)</option>
                        <option value="Sub-Executive (Research & Publications)" className="bg-slate-950 text-white">Sub-Executive (Research & Publications)</option>
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Contact Phone (WhatsApp)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+880 17XX-XXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-2.5 rounded-xl glass-input text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    {applicationType === 'Executive'
                      ? 'Executive Vision & Leadership Motivation / Why should you lead this club? *'
                      : 'Statement of Purpose / Why do you want to join? *'}
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={statementOfPurpose}
                    onChange={(e) => setStatementOfPurpose(e.target.value)}
                    placeholder={
                      applicationType === 'Executive'
                        ? 'Outline your leadership vision for the society, planned events or initiatives, and how you will effectively moderate and guide members...'
                        : 'Briefly state your motivation, expectations, and how you plan to contribute to this society...'
                    }
                    className="w-full p-3 rounded-xl glass-input text-slate-200 placeholder-slate-500 focus:outline-none resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    {applicationType === 'Executive'
                      ? 'Prior Leadership, Event Management, or Society Coordination Experience'
                      : 'Relevant Skills & Prior Co-Curricular Experience'}
                  </label>
                  <input
                    type="text"
                    value={skillsInterests}
                    onChange={(e) => setSkillsInterests(e.target.value)}
                    placeholder={
                      applicationType === 'Executive'
                        ? 'e.g. Previous General Secretary of debate, organized 3 national fests, team leadership'
                        : 'e.g. Graphic design, Arduino, Debate, Event Hosting, Video editing'
                    }
                    className="w-full p-2.5 rounded-xl glass-input text-slate-200 placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setApplyingClub(null)}
                    className="px-4 py-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingApp}
                    className={`flex items-center gap-2 font-black px-6 py-2.5 rounded-xl shadow-lg transition-all hover:scale-102 cursor-pointer ${
                      applicationType === 'Executive'
                        ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-slate-950 shadow-amber-950/40'
                        : 'bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 shadow-emerald-950/40'
                    }`}
                  >
                    {applicationType === 'Executive' ? <ShieldCheck className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                    <span>{applicationType === 'Executive' ? 'Submit Executive Candidacy' : 'Submit Membership Application'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CLUB DETAILS & EXECUTIVE ROSTER MODAL */}
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

                {/* Objectives & Achievements */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeClubModal.objectives && activeClubModal.objectives.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/10 space-y-2">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px] uppercase tracking-wider">
                        <Target className="w-4 h-4 text-emerald-400" />
                        <span>Core Objectives</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                        {activeClubModal.objectives.map((obj, i) => (
                          <li key={i}>{obj}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {activeClubModal.achievements && activeClubModal.achievements.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/10 space-y-2">
                      <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px] uppercase tracking-wider">
                        <Trophy className="w-4 h-4 text-amber-300" />
                        <span>Key Achievements</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                        {activeClubModal.achievements.map((ach, i) => (
                          <li key={i}>{ach}</li>
                        ))}
                      </ul>
                    </div>
                  )}
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

                {/* Apply Button in Modal */}
                <div className="pt-4 border-t border-white/10 flex justify-end">
                  {getMembershipStatus(activeClubModal.id) === 'Active' ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>You are an official active member</span>
                    </span>
                  ) : getMembershipStatus(activeClubModal.id) === 'Pending' ? (
                    <span className="text-amber-300 font-bold flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>Application submitted and pending review</span>
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const target = activeClubModal;
                          setActiveClubModal(null);
                          handleOpenApplyModal(target, 'Member');
                        }}
                        className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold px-4 py-2.5 rounded-xl border border-emerald-500/30 transition-all cursor-pointer text-xs"
                      >
                        <Users className="w-4 h-4 text-emerald-400" />
                        <span>Join as Member</span>
                      </button>
                      <button
                        onClick={() => {
                          const target = activeClubModal;
                          setActiveClubModal(null);
                          handleOpenApplyModal(target, 'Executive');
                        }}
                        className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 font-black px-5 py-2.5 rounded-xl shadow-lg transition-all hover:scale-102 cursor-pointer text-xs"
                      >
                        <Award className="w-4 h-4" />
                        <span>👑 Apply as Exec / Moderator</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
