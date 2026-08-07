import React, { useState } from 'react';
import { Club, UserProfile, UserRole } from '../../types/cms';
import {
  Users,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Building2,
  Calendar,
  DollarSign,
  UserCheck,
  UserPlus,
  LogOut,
  ExternalLink,
  X
} from 'lucide-react';

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

  const categories = ['All', 'Cultural', 'Technical', 'Business', 'Sports', 'Academic', 'Social Work'];

  const filteredClubs = clubs.filter((club) => {
    const matchesSearch =
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.tagline.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || club.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getMembershipStatus = (clubId: string) => {
    const membership = currentUser.clubMemberships.find((m) => m.clubId === clubId);
    return membership ? membership.status : null;
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-linear-to-r from-emerald-900 via-slate-900 to-teal-900 text-white p-6 rounded-2xl shadow-md border border-emerald-800/40">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
              Central Directory
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight mt-1">BUP Clubs & Societies</h2>
            <p className="text-emerald-200/80 text-xs mt-1">
              Explore officially recognized student societies, departmental chapters, and executive committees at BUP.
            </p>
          </div>

          <div className="bg-slate-800/90 px-4 py-2 rounded-xl border border-slate-700 text-right">
            <span className="text-[10px] text-slate-400 font-medium block">Active Registered Clubs</span>
            <span className="text-xl font-bold text-emerald-400 font-mono">{clubs.length} Societies</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search club name, code, or focus area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Clubs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClubs.map((club) => {
          const membershipStatus = getMembershipStatus(club.id);

          return (
            <div
              key={club.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
            >
              <div>
                {/* Banner Image */}
                <div className="h-28 relative overflow-hidden bg-slate-800">
                  <img
                    src={club.bannerUrl}
                    alt={club.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-transparent to-transparent"></div>

                  <span className="absolute top-3 right-3 bg-slate-900/80 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30 backdrop-blur-sm">
                    {club.code}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 pt-0 relative space-y-3">
                  <div className="flex justify-between items-end -mt-8 mb-2">
                    <img
                      src={club.logoUrl}
                      alt={club.name}
                      className="w-14 h-14 rounded-xl object-cover ring-4 ring-white shadow-md bg-white"
                    />
                    <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                      {club.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                      {club.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1 italic mt-0.5">{club.tagline}</p>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{club.description}</p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      {club.memberCount} Members
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" />
                      {club.featuredEventsCount} Events
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setActiveClubModal(club)}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 hover:underline"
                >
                  View Details & Execs
                  <ExternalLink className="w-3 h-3" />
                </button>

                {membershipStatus === 'Active' ? (
                  <button
                    onClick={() => onLeaveClub(club.id)}
                    className="flex items-center gap-1 bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Member (Leave)
                  </button>
                ) : membershipStatus === 'Pending' ? (
                  <span className="bg-amber-100 text-amber-900 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Pending Approval
                  </span>
                ) : (
                  <button
                    onClick={() => onJoinClub(club.id)}
                    className="flex items-center gap-1 bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-lg transition-all shadow-sm"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Join Club
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Club Details Modal */}
      {activeClubModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setActiveClubModal(null)}
              className="absolute top-4 right-4 bg-slate-900/60 hover:bg-slate-900 text-white rounded-full p-1.5 z-10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header Image */}
            <div className="h-36 relative bg-slate-900">
              <img
                src={activeClubModal.bannerUrl}
                alt={activeClubModal.name}
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-950/90 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-6 flex items-center gap-3">
                <img
                  src={activeClubModal.logoUrl}
                  alt={activeClubModal.name}
                  className="w-14 h-14 rounded-xl ring-2 ring-emerald-500 bg-white"
                />
                <div>
                  <h3 className="text-lg font-bold text-white">{activeClubModal.name}</h3>
                  <p className="text-xs text-emerald-300 font-mono">{activeClubModal.tagline}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6 text-xs text-slate-700">
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">
                  About Society
                </h4>
                <p className="leading-relaxed">{activeClubModal.description}</p>
              </div>

              {/* Faculty Advisor */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-900 uppercase block">
                    Faculty Advisor
                  </span>
                  <p className="text-xs font-bold text-slate-900">{activeClubModal.facultyAdvisor.name}</p>
                  <p className="text-[11px] text-slate-600">{activeClubModal.facultyAdvisor.designation}</p>
                </div>
                <span className="text-[10px] font-mono bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                  {activeClubModal.facultyAdvisor.email}
                </span>
              </div>

              {/* Executive Roster */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3">
                  Executive Committee Roster
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {activeClubModal.executives.map((exec, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <img src={exec.avatar} alt={exec.name} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{exec.name}</p>
                        <p className="text-[10px] text-emerald-700 font-medium">{exec.designation}</p>
                        <p className="text-[10px] text-slate-400 font-mono">ID: {exec.studentId}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
