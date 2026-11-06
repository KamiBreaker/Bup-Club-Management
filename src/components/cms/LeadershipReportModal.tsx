import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  X,
  Award,
  ShieldCheck,
  Users,
  Search,
  CheckCircle2,
  Calendar,
  Building,
  GraduationCap,
  MessageSquare,
  UserCheck,
  TrendingUp,
  Activity,
  Layers,
  ChevronRight,
  Sparkles,
  Crown
} from 'lucide-react';
import { Club, ClubEvent, MembershipApplication, AttendanceRecord, ClubAnnouncement, UserProfile } from '../../types/cms';
import {
  buildLeadershipReportData,
  exportLeadershipReportExcel,
  exportLeadershipReportPdf,
  LeadershipReportData,
  OfficerProfile
} from '../../utils/leadershipReportGenerator';
import { soundFx } from '../../utils/audioFx';

interface LeadershipReportModalProps {
  club?: Club | null;
  clubs?: Club[];
  applications?: MembershipApplication[];
  attendance?: AttendanceRecord[];
  events?: ClubEvent[];
  announcements?: ClubAnnouncement[];
  users?: UserProfile[];
  currentUser?: UserProfile;
  initialOfficerStudentId?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'roster' | 'dossier' | 'signoff';

export const LeadershipReportModal: React.FC<LeadershipReportModalProps> = ({
  club,
  clubs = [],
  applications = [],
  attendance = [],
  events = [],
  announcements = [],
  users = [],
  currentUser,
  initialOfficerStudentId = null,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialOfficerStudentId ? 'dossier' : 'overview');
  const [roleFilter, setRoleFilter] = useState<'All' | 'Moderator' | 'Sub-Executive' | 'Executive'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOfficerId, setSelectedOfficerId] = useState<string | null>(initialOfficerStudentId);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Generate Report Data
  const reportData: LeadershipReportData = useMemo(() => {
    return buildLeadershipReportData(
      club,
      clubs,
      applications,
      attendance,
      events,
      announcements,
      users,
      currentUser
    );
  }, [club, clubs, applications, attendance, events, announcements, users, currentUser]);

  // Set default selected officer for dossier if none selected
  const activeDossierOfficer: OfficerProfile | undefined = useMemo(() => {
    if (selectedOfficerId) {
      const found = reportData.officers.find(
        (o) => o.studentId === selectedOfficerId || o.name.toLowerCase() === selectedOfficerId.toLowerCase()
      );
      if (found) return found;
    }
    return reportData.officers[0];
  }, [reportData.officers, selectedOfficerId]);

  // Filtered officers list
  const filteredOfficers = useMemo(() => {
    return reportData.officers.filter((off) => {
      const matchRole =
        roleFilter === 'All' ||
        (roleFilter === 'Moderator' && (off.roleType === 'Moderator' || off.roleType === 'Faculty_Advisor')) ||
        off.roleType === roleFilter;

      const q = searchQuery.toLowerCase();
      const matchSearch =
        off.name.toLowerCase().includes(q) ||
        off.designation.toLowerCase().includes(q) ||
        off.studentId.toLowerCase().includes(q) ||
        (off.department && off.department.toLowerCase().includes(q)) ||
        off.clubName.toLowerCase().includes(q);

      return matchRole && matchSearch;
    });
  }, [reportData.officers, roleFilter, searchQuery]);

  const handleExportExcel = () => {
    setIsExportingExcel(true);
    soundFx.playSuccess();
    try {
      exportLeadershipReportExcel(reportData);
    } finally {
      setTimeout(() => setIsExportingExcel(false), 800);
    }
  };

  const handleExportPdf = () => {
    setIsExportingPdf(true);
    soundFx.playSuccess();
    try {
      exportLeadershipReportPdf(reportData);
    } finally {
      setTimeout(() => setIsExportingPdf(false), 800);
    }
  };

  const handlePrint = () => {
    soundFx.playClick();
    window.print();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-10 font-sans"
        >
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-900 p-5 sm:p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {reportData.reportRef}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    Governance & Leadership
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Active Term Audit
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mt-1 leading-snug">
                  {club ? `${club.name} (${club.code})` : 'BUP Campus Societies'} • Leadership & Moderator Activity Audit
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>Faculty Advisor: {club?.facultyAdvisor?.name || 'Academic Governance Committee'}</span>
                  <span>•</span>
                  <span>Total Officers: {reportData.summaryMetrics.totalOfficers}</span>
                  <span>•</span>
                  <span>Audited on: {reportData.generatedAt}</span>
                </p>
              </div>
            </div>

            {/* Quick Export Actions */}
            <div className="flex items-center gap-2 flex-wrap sm:self-center">
              <button
                onClick={handleExportExcel}
                disabled={isExportingExcel}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Download complete multi-sheet Excel spreadsheet"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{isExportingExcel ? 'Exporting...' : 'Export Excel (.xlsx)'}</span>
              </button>

              <button
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-950/40 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Download formal BUP PDF report"
              >
                <FileText className="w-4 h-4" />
                <span>{isExportingPdf ? 'Exporting...' : 'Export PDF (.pdf)'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition active:scale-95 cursor-pointer"
                title="Print or save as PDF"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tab Bar */}
          <div className="bg-slate-900/90 px-6 py-2 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Governance Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('roster')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'roster'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Officers Roster ({reportData.officers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('dossier')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'dossier'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Individual Activity Dossier</span>
            </button>

            <button
              onClick={() => setActiveTab('signoff')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'signoff'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Compliance & Sign-Off</span>
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-slate-200">
            {/* ======================================================== */}
            {/* TAB 1: GOVERNANCE OVERVIEW */}
            {/* ======================================================== */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* 4 KPI Summary Metric Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                      <span>Total Accredited Officers</span>
                      <Users className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="mt-2">
                      <div className="text-2xl font-bold text-white">
                        {reportData.summaryMetrics.totalOfficers}
                        <span className="text-xs font-normal text-slate-400 ml-1">officers</span>
                      </div>
                      <span className="text-[11px] text-amber-400/90 font-mono mt-1 block">
                        {reportData.summaryMetrics.moderatorCount} Moderators • {reportData.summaryMetrics.subExecCount} Sub-Execs
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                      <span>Applications Audited</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="mt-2">
                      <div className="text-2xl font-bold text-white">
                        {reportData.summaryMetrics.totalApplicationsProcessed}
                        <span className="text-xs font-normal text-slate-400 ml-1">evaluations</span>
                      </div>
                      <span className="text-[11px] text-emerald-400/90 font-mono mt-1 block">
                        Decided by panel moderators
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                      <span>Gate Verifications Logged</span>
                      <UserCheck className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="mt-2">
                      <div className="text-2xl font-bold text-white">
                        {reportData.summaryMetrics.totalGateVerifications}
                        <span className="text-xs font-normal text-slate-400 ml-1">check-ins</span>
                      </div>
                      <span className="text-[11px] text-cyan-400/90 font-mono mt-1 block">
                        Logged by ushers & executives
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                      <span>Events Supervised</span>
                      <Calendar className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="mt-2">
                      <div className="text-2xl font-bold text-white">
                        {reportData.summaryMetrics.totalEventsSupervised}
                        <span className="text-xs font-normal text-slate-400 ml-1">events</span>
                      </div>
                      <span className="text-[11px] text-purple-400/90 font-mono mt-1 block">
                        Under executive committee oversight
                      </span>
                    </div>
                  </div>
                </div>

                {/* Role Composition Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-800/40 border border-amber-500/30 rounded-xl p-5 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Moderators & Advisors ({reportData.summaryMetrics.moderatorCount})</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Faculty Advisors and designated Club Moderators hold final veto, approval, candidate Q&A inquiry, and constitution compliance authorities.
                    </p>
                  </div>

                  <div className="bg-slate-800/40 border border-cyan-500/30 rounded-xl p-5 space-y-2">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                      <Layers className="w-4 h-4" />
                      <span>Sub-Executives ({reportData.summaryMetrics.subExecCount})</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Specialized functional sub-executives leading technical, PR & media, research, logistics, and event management operations.
                    </p>
                  </div>

                  <div className="bg-slate-800/40 border border-emerald-500/30 rounded-xl p-5 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                      <Award className="w-4 h-4" />
                      <span>Executive Committee ({reportData.summaryMetrics.execCount})</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Presidents, Vice Presidents, General Secretaries, and Treasurers managing day-to-day club governance and gate attendance rosters.
                    </p>
                  </div>
                </div>

                {/* Quick Officer Highlight Cards */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                    <span>Leadership & Moderation Panel</span>
                    <button
                      onClick={() => setActiveTab('roster')}
                      className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All Officers ({reportData.officers.length})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {reportData.officers.slice(0, 6).map((off, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setSelectedOfficerId(off.studentId);
                          setActiveTab('dossier');
                        }}
                        className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/40 rounded-xl p-4 transition-all cursor-pointer flex items-center gap-3.5 group"
                      >
                        <img
                          src={off.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                          alt={off.name}
                          className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/10 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                            {off.name}
                          </h4>
                          <p className="text-[11px] text-slate-400 font-mono truncate">{off.designation}</p>
                          <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                            <span className="px-1.5 py-0.2 rounded bg-slate-700 text-slate-300 font-mono">
                              {off.roleType}
                            </span>
                            <span className="text-amber-400 font-mono font-bold">
                              Score: {off.stats.activityScore}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: OFFICERS ROSTER */}
            {/* ======================================================== */}
            {activeTab === 'roster' && (
              <div className="space-y-6">
                {/* Search & Role Filter Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search officer by name, role, student ID, department, or club..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto overflow-x-auto">
                    {(['All', 'Moderator', 'Sub-Executive', 'Executive'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setRoleFilter(r)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                          roleFilter === r
                            ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Officers Table */}
                <div className="bg-slate-800/30 border border-slate-700/60 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto max-h-[460px]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800/90 text-slate-300 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-10 border-b border-slate-700">
                        <tr>
                          <th className="py-2.5 px-3">Officer</th>
                          <th className="py-2.5 px-3">Official Role / Designation</th>
                          <th className="py-2.5 px-3">Role Type</th>
                          <th className="py-2.5 px-3">ID / Ref</th>
                          <th className="py-2.5 px-3">Club</th>
                          <th className="py-2.5 px-3 text-center">Decisions</th>
                          <th className="py-2.5 px-3 text-center">Gate Shifts</th>
                          <th className="py-2.5 px-3 text-center">Events</th>
                          <th className="py-2.5 px-3 text-center">Score</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {filteredOfficers.length > 0 ? (
                          filteredOfficers.map((off, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/50 transition">
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={off.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                                    alt={off.name}
                                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-white/10 shrink-0"
                                  />
                                  <span className="font-semibold text-white">{off.name}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 font-medium text-slate-200">{off.designation}</td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                    off.roleType === 'Moderator' || off.roleType === 'Faculty_Advisor'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      : off.roleType === 'Sub-Executive'
                                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  }`}
                                >
                                  {off.roleType}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">{off.studentId}</td>
                              <td className="py-2.5 px-3 text-slate-300 text-[11px] truncate max-w-[120px]">{off.clubName}</td>
                              <td className="py-2.5 px-3 text-center font-mono text-emerald-400 font-bold">{off.stats.totalDecisions}</td>
                              <td className="py-2.5 px-3 text-center font-mono text-cyan-400 font-bold">{off.stats.totalGateVerifications}</td>
                              <td className="py-2.5 px-3 text-center font-mono text-purple-400 font-bold">{off.stats.totalEventsCoordinated}</td>
                              <td className="py-2.5 px-3 text-center font-mono text-amber-400 font-black">{off.stats.activityScore}</td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  onClick={() => {
                                    setSelectedOfficerId(off.studentId);
                                    setActiveTab('dossier');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-bold transition cursor-pointer"
                                >
                                  View Dossier →
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={10} className="py-8 text-center text-slate-400">
                              No officers match the current filter or search criteria.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 3: INDIVIDUAL ACTIVITY DOSSIER */}
            {/* ======================================================== */}
            {activeTab === 'dossier' && (
              <div className="space-y-6">
                {/* Officer Picker Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs font-semibold text-slate-300">Select Officer to Inspect:</span>
                  </div>

                  <select
                    value={activeDossierOfficer?.studentId || ''}
                    onChange={(e) => setSelectedOfficerId(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs outline-none cursor-pointer max-w-md"
                  >
                    {reportData.officers.map((off) => (
                      <option key={off.studentId} value={off.studentId} className="bg-slate-950">
                        {off.name} — {off.designation} ({off.roleType})
                      </option>
                    ))}
                  </select>
                </div>

                {activeDossierOfficer ? (
                  <div className="space-y-6">
                    {/* Officer Hero Profile Card */}
                    <div className="bg-gradient-to-r from-slate-800/80 via-slate-800/50 to-slate-900/80 border border-amber-500/30 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                      <div className="flex items-center gap-4">
                        <img
                          src={activeDossierOfficer.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                          alt={activeDossierOfficer.name}
                          className="w-16 h-16 rounded-2xl object-cover ring-2 ring-amber-500/40 bg-slate-800 shrink-0 shadow-lg"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {activeDossierOfficer.roleType}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              ID: {activeDossierOfficer.studentId}
                            </span>
                          </div>
                          <h3 className="text-lg font-extrabold text-white mt-0.5">
                            {activeDossierOfficer.name}
                          </h3>
                          <p className="text-xs text-amber-300 font-medium">
                            {activeDossierOfficer.designation} • {activeDossierOfficer.clubName}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {activeDossierOfficer.department} • {activeDossierOfficer.email}
                          </p>
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div className="bg-slate-900/90 border border-amber-500/40 rounded-xl p-3.5 flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-mono">GOVERNANCE SCORE</span>
                          <span className="text-2xl font-black text-amber-400 font-mono">
                            {activeDossierOfficer.stats.activityScore}
                          </span>
                        </div>
                        <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
                      </div>
                    </div>

                    {/* Detailed Historical Activity Logs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Membership Decisions Log */}
                      <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-700/40 pb-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Membership Decisions Rendered ({activeDossierOfficer.activities.applicationsDecided.length})</span>
                          </h4>
                        </div>
                        {activeDossierOfficer.activities.applicationsDecided.length > 0 ? (
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {activeDossierOfficer.activities.applicationsDecided.map((dec, i) => (
                              <div key={i} className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5 text-xs">
                                <div className="flex justify-between font-semibold">
                                  <span className="text-white">{dec.applicantName}</span>
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                      dec.status === 'Approved'
                                        ? 'bg-emerald-500/20 text-emerald-300'
                                        : 'bg-red-500/20 text-red-300'
                                    }`}
                                  >
                                    {dec.status}
                                  </span>
                                </div>
                                <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-0.5">
                                  <span>Role: {dec.roleName}</span>
                                  <span>{dec.date}</span>
                                </div>
                                {dec.remarks && (
                                  <p className="text-[11px] text-slate-300 mt-1 italic">"{dec.remarks}"</p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic py-4 text-center">
                            No membership decisions logged for this officer yet.
                          </p>
                        )}
                      </div>

                      {/* Gate Attendance Verification Shifts */}
                      <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-700/40 pb-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Gate Check-in Shifts Logged ({activeDossierOfficer.activities.attendanceCheckIns.length})</span>
                          </h4>
                        </div>
                        {activeDossierOfficer.activities.attendanceCheckIns.length > 0 ? (
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {activeDossierOfficer.activities.attendanceCheckIns.map((att, i) => (
                              <div key={i} className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5 text-xs flex justify-between items-center">
                                <div>
                                  <span className="font-semibold text-white block">{att.studentName}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">{att.eventTitle} • ID: {att.studentId}</span>
                                </div>
                                <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                                  {att.markedAt}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic py-4 text-center">
                            No gate attendance check-ins logged by this officer yet.
                          </p>
                        )}
                      </div>

                      {/* Clarification Q&As Dispatched */}
                      <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-700/40 pb-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Candidate Clarification Inquiries ({activeDossierOfficer.activities.questionsDispatched.length})</span>
                          </h4>
                        </div>
                        {activeDossierOfficer.activities.questionsDispatched.length > 0 ? (
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {activeDossierOfficer.activities.questionsDispatched.map((q, i) => (
                              <div key={i} className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5 text-xs space-y-1">
                                <div className="flex justify-between font-semibold">
                                  <span className="text-white">Candidate: {q.applicantName}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">{q.date}</span>
                                </div>
                                <p className="text-[11px] text-amber-300/90 font-medium">Q: "{q.questionPrompt}"</p>
                                {q.studentAnswer && (
                                  <p className="text-[11px] text-slate-300 italic">Ans: "{q.studentAnswer}"</p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic py-4 text-center">
                            No candidate inquiries dispatched by this officer.
                          </p>
                        )}
                      </div>

                      {/* Supervised Events & Announcements */}
                      <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-700/40 pb-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Events Coordinated & Supervised ({activeDossierOfficer.activities.eventsOrganized.length})</span>
                          </h4>
                        </div>
                        {activeDossierOfficer.activities.eventsOrganized.length > 0 ? (
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {activeDossierOfficer.activities.eventsOrganized.map((ev, i) => (
                              <div key={i} className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5 text-xs flex justify-between items-center">
                                <div>
                                  <span className="font-semibold text-white block">{ev.title}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">{ev.date} • {ev.venueName}</span>
                                </div>
                                <span className="text-[10px] text-purple-300 font-mono bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                                  {ev.category}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic py-4 text-center">
                            No events directly linked to this officer yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 4: COMPLIANCE & SIGN-OFF */}
            {/* ======================================================== */}
            {activeTab === 'signoff' && (
              <div className="space-y-6">
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                        Leadership & Moderation Governance Sign-Off
                      </h4>
                      <p className="text-xs text-slate-400">
                        Official institutional verification certifying executive committee tenure and accreditation.
                      </p>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/30">
                      GOVERNANCE VERIFIED
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                    {/* Sign-off box 1 */}
                    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex flex-col justify-between h-40">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">
                          PREPARED BY
                        </span>
                        <p className="text-xs font-semibold text-white">
                          Club President / General Secretary
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {club?.name || 'Club Executive Secretariat'}
                        </p>
                      </div>
                      <div className="border-t border-slate-700 pt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>Digital Signature</span>
                        <span className="text-emerald-400">Authenticated ✓</span>
                      </div>
                    </div>

                    {/* Sign-off box 2 */}
                    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex flex-col justify-between h-40">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">
                          VERIFIED & AUDITED BY
                        </span>
                        <p className="text-xs font-semibold text-white">
                          {club?.facultyAdvisor?.name || 'Faculty Advisor & Chief Moderator'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {club?.facultyAdvisor?.designation || 'Club Faculty Moderator'}
                        </p>
                      </div>
                      <div className="border-t border-slate-700 pt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>Digital Signature</span>
                        <span className="text-emerald-400">Authenticated ✓</span>
                      </div>
                    </div>

                    {/* Sign-off box 3 */}
                    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex flex-col justify-between h-40">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">
                          ARCHIVED & ACCREDITED BY
                        </span>
                        <p className="text-xs font-semibold text-white">
                          Directorate of Students Welfare
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Office of Student Affairs, BUP
                        </p>
                      </div>
                      <div className="border-t border-slate-700 pt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>Audit Status</span>
                        <span className="text-cyan-400">Institutional Record</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Bar */}
          <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono text-[11px]">
              Document ID: {reportData.reportRef} • BUP Leadership Audit
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportExcel}
                className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Excel (.xlsx)</span>
              </button>
              <span>•</span>
              <button
                onClick={handleExportPdf}
                className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export PDF (.pdf)</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
