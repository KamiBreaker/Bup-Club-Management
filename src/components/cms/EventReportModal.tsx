import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  X,
  CheckCircle2,
  AlertCircle,
  Users,
  Award,
  Calendar,
  Clock,
  MapPin,
  Building,
  GraduationCap,
  Star,
  MessageSquareQuote,
  Search,
  ChevronRight,
  ShieldCheck,
  Percent,
  TrendingUp,
  SlidersHorizontal,
  Copy,
  Check
} from 'lucide-react';
import { ClubEvent, Club, Venue, EventRegistration, AttendanceRecord, EventFeedback, UserProfile } from '../../types/cms';
import {
  buildEventReportData,
  exportEventReportExcel,
  exportEventReportPdf,
  EventReportData
} from '../../utils/eventReportGenerator';
import { soundFx } from '../../utils/audioFx';

interface EventReportModalProps {
  event: ClubEvent;
  club?: Club;
  venue?: Venue;
  registrations?: EventRegistration[];
  attendance?: AttendanceRecord[];
  feedbacks?: EventFeedback[];
  currentUser?: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

type ReportTab = 'summary' | 'attendance' | 'feedback' | 'signoff';

export const EventReportModal: React.FC<EventReportModalProps> = ({
  event,
  club,
  venue,
  registrations = [],
  attendance = [],
  feedbacks = [],
  currentUser,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('summary');
  const [rosterSearch, setRosterSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Present' | 'Absent'>('All');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Build complete report data structure
  const reportData: EventReportData = useMemo(() => {
    return buildEventReportData(
      event,
      club,
      venue,
      registrations,
      attendance,
      feedbacks,
      currentUser
    );
  }, [event, club, venue, registrations, attendance, feedbacks, currentUser]);

  // Filtered attendees for the roster tab
  const filteredAttendees = useMemo(() => {
    return reportData.attendees.filter((att) => {
      const matchSearch =
        att.studentName.toLowerCase().includes(rosterSearch.toLowerCase()) ||
        att.studentId.toLowerCase().includes(rosterSearch.toLowerCase()) ||
        att.passCode.toLowerCase().includes(rosterSearch.toLowerCase()) ||
        att.department.toLowerCase().includes(rosterSearch.toLowerCase());

      const matchStatus = statusFilter === 'All' || att.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [reportData.attendees, rosterSearch, statusFilter]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    soundFx.playChime();
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleExportExcel = () => {
    setIsExportingExcel(true);
    soundFx.playSuccess();
    try {
      exportEventReportExcel(reportData);
    } finally {
      setTimeout(() => setIsExportingExcel(false), 800);
    }
  };

  const handleExportPdf = () => {
    setIsExportingPdf(true);
    soundFx.playSuccess();
    try {
      exportEventReportPdf(reportData);
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

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-10 font-sans"
        >
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-900 p-5 sm:p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {reportData.reportRef}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {event.category}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {event.status === 'Completed' ? 'Completed & Audited' : event.status}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mt-1 leading-snug">
                  {event.title}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>{club?.name || event.clubName}</span>
                  <span>•</span>
                  <span>{event.date} ({event.startTime} - {event.endTime})</span>
                  <span>•</span>
                  <span>{event.venueName}</span>
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
              onClick={() => setActiveTab('summary')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'summary'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Executive Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'attendance'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Attendance & Roster ({reportData.attendees.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('feedback')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'feedback'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Feedback & Ratings ({reportData.feedbacks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('signoff')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'signoff'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Logistics & Sign-Off</span>
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-slate-200">
            {/* ======================================================== */}
            {/* TAB 1: EXECUTIVE SUMMARY */}
            {/* ======================================================== */}
            {activeTab === 'summary' && (
              <div className="space-y-6">
                {/* 4 Metric KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                      <span>Registered RSVPs</span>
                      <Users className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="mt-2">
                      <div className="text-2xl font-bold text-white">
                        {reportData.metrics.registeredCount}
                        <span className="text-xs font-normal text-slate-400 ml-1">/ {reportData.metrics.maxSeats} seats</span>
                      </div>
                      <div className="mt-2 w-full bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, reportData.metrics.fillRate)}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-emerald-400/90 font-mono mt-1 block">
                        {reportData.metrics.fillRate}% capacity fill
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                      <span>Verified Turnout</span>
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="mt-2">
                      <div className="text-2xl font-bold text-white">
                        {reportData.metrics.attendedCount}
                        <span className="text-xs font-normal text-slate-400 ml-1">attendees</span>
                      </div>
                      <div className="mt-2 w-full bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-cyan-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, reportData.metrics.turnoutRate)}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-cyan-400/90 font-mono mt-1 block">
                        {reportData.metrics.turnoutRate}% turnout rate
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                      <span>Absentee Count</span>
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="mt-2">
                      <div className="text-2xl font-bold text-white">
                        {reportData.metrics.absentCount}
                        <span className="text-xs font-normal text-slate-400 ml-1">no-shows</span>
                      </div>
                      <div className="mt-2 w-full bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-amber-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, 100 - reportData.metrics.turnoutRate)}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-amber-400/90 font-mono mt-1 block">
                        {100 - reportData.metrics.turnoutRate}% no-show rate
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                      <span>Average Satisfaction</span>
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    </div>
                    <div className="mt-2">
                      <div className="text-2xl font-bold text-white flex items-baseline gap-1">
                        {reportData.metrics.averageRating > 0 ? reportData.metrics.averageRating : 'N/A'}
                        <span className="text-xs font-normal text-slate-400">/ 5.0</span>
                      </div>
                      <div className="mt-2 w-full bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-yellow-400 h-1.5 rounded-full"
                          style={{ width: `${reportData.metrics.satisfactionScore}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-yellow-400/90 font-mono mt-1 block">
                        {reportData.metrics.totalFeedbacks} feedback entries
                      </span>
                    </div>
                  </div>
                </div>

                {/* Event Profile & Club Profile */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Event Profile Details */}
                  <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-3.5">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Event Specifications</span>
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-700/40">
                        <span className="text-slate-400">Event Title</span>
                        <span className="font-semibold text-white text-right">{event.title}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-700/40">
                        <span className="text-slate-400">Category</span>
                        <span className="font-medium text-slate-200">{event.category}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-700/40">
                        <span className="text-slate-400">Date & Timing</span>
                        <span className="font-mono text-slate-200">{event.date} • {event.startTime} - {event.endTime}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-700/40">
                        <span className="text-slate-400">Venue / Location</span>
                        <span className="font-medium text-slate-200">{event.venueName} ({venue?.location || 'Main Campus'})</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-700/40">
                        <span className="text-slate-400">Event Lead / Contact</span>
                        <span className="font-medium text-slate-200">{event.organizingTeam || event.contactPerson || 'Executive Team'}</span>
                      </div>
                      <div className="pt-2">
                        <span className="text-slate-400 block mb-1">Equipment Deployed</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(event.requiredEquipment || ['Auditorium Sound System', 'Digital Projector', 'Stage Microphones']).map((eq, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-700/60 text-slate-300 font-mono">
                              {eq}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Organizing Club & Advisor Profile */}
                  <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-3.5">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      <span>Host Club Governance</span>
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-700/40">
                        <span className="text-slate-400">Club Name</span>
                        <span className="font-semibold text-white text-right">{club?.name || event.clubName}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-700/40">
                        <span className="text-slate-400">Club Code</span>
                        <span className="font-mono text-slate-200">{club?.code || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-700/40">
                        <span className="text-slate-400">Affiliated Department</span>
                        <span className="font-medium text-slate-200">{club?.department || 'Inter-Departmental'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-700/40">
                        <span className="text-slate-400">Faculty Advisor</span>
                        <span className="font-semibold text-white">{club?.facultyAdvisor?.name || 'Assigned Faculty'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-700/40">
                        <span className="text-slate-400">Advisor Designation</span>
                        <span className="font-medium text-slate-300">{club?.facultyAdvisor?.designation || 'Faculty Member'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-700/40">
                        <span className="text-slate-400">Advisor Contact</span>
                        <span className="font-mono text-cyan-400">{club?.facultyAdvisor?.email || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Allocated Annual Budget</span>
                        <span className="font-mono font-bold text-emerald-400">
                          BDT {club?.budgetAllocated ? club.budgetAllocated.toLocaleString() : '150,000'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event Description & Objectives */}
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Executive Narrative & Description
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {event.description}
                  </p>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: ATTENDANCE & ROSTER */}
            {/* ======================================================== */}
            {activeTab === 'attendance' && (
              <div className="space-y-6">
                {/* Department Distribution Progress Bars */}
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    <span>Department Participation Distribution</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {reportData.departmentBreakdown.map((dept, idx) => (
                      <div key={idx} className="bg-slate-800/70 border border-slate-700/50 rounded-lg p-3">
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-white truncate" title={dept.department}>{dept.department}</span>
                          <span className="text-emerald-400 font-mono">{dept.turnoutRate}% turnout</span>
                        </div>
                        <div className="w-full bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, dept.turnoutRate)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-mono">
                          <span>{dept.attended} Attended</span>
                          <span>{dept.registered} Registered</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search attendee by name, student ID, pass code, or department..."
                      value={rosterSearch}
                      onChange={(e) => setRosterSearch(e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    {(['All', 'Present', 'Absent'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          statusFilter === st
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                        }`}
                      >
                        {st}
                        <span className="ml-1 opacity-70">
                          (
                          {st === 'All'
                            ? reportData.attendees.length
                            : st === 'Present'
                            ? reportData.metrics.attendedCount
                            : reportData.metrics.absentCount}
                          )
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Attendees Table */}
                <div className="bg-slate-800/30 border border-slate-700/60 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto max-h-[420px]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800/90 text-slate-300 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-10 border-b border-slate-700">
                        <tr>
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">Student ID</th>
                          <th className="py-2.5 px-3">Student Name</th>
                          <th className="py-2.5 px-3">Department</th>
                          <th className="py-2.5 px-3">Pass Code</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Gate Verification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {filteredAttendees.length > 0 ? (
                          filteredAttendees.map((att, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/50 transition">
                              <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                              <td className="py-2.5 px-3 font-mono font-semibold text-white">{att.studentId}</td>
                              <td className="py-2.5 px-3 text-slate-200 font-medium">{att.studentName}</td>
                              <td className="py-2.5 px-3 text-slate-300">{att.department}</td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1 font-mono text-[11px] text-emerald-400">
                                  <span>{att.passCode}</span>
                                  <button
                                    onClick={() => handleCopyCode(att.passCode)}
                                    className="p-1 hover:text-white transition cursor-pointer"
                                    title="Copy Pass Code"
                                  >
                                    {copiedCode === att.passCode ? (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3 text-slate-400" />
                                    )}
                                  </button>
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    att.status === 'Present'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : 'bg-slate-700/60 text-slate-400 border border-slate-600'
                                  }`}
                                >
                                  {att.status === 'Present' ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                      <span>Verified Present</span>
                                    </>
                                  ) : (
                                    <span>Absent</span>
                                  )}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                                {att.markedAt ? att.markedAt : att.status === 'Present' ? 'Entrance Scanner' : '—'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-400">
                              No attendees matched the current search or status filter.
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
            {/* TAB 3: FEEDBACK & RATINGS */}
            {/* ======================================================== */}
            {activeTab === 'feedback' && (
              <div className="space-y-6">
                {/* Rating Overview Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Overall Score Box */}
                  <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-5 flex flex-col items-center justify-center text-center">
                    <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2">
                      Overall Event Satisfaction
                    </span>
                    <div className="text-5xl font-black text-white font-mono flex items-baseline gap-1">
                      {reportData.metrics.averageRating > 0 ? reportData.metrics.averageRating : '0.0'}
                      <span className="text-base text-slate-400 font-normal">/ 5.0</span>
                    </div>
                    <div className="flex items-center gap-1 my-3 text-yellow-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-5 h-5 ${
                            s <= Math.round(reportData.metrics.averageRating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400">
                      Based on {reportData.feedbacks.length} participant surveys
                    </span>
                  </div>

                  {/* Star Distribution */}
                  <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-5 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Rating Distribution
                    </h4>
                    {reportData.ratingDistribution.map((item) => (
                      <div key={item.star} className="flex items-center gap-2 text-xs">
                        <span className="w-12 text-slate-400 font-mono">{item.star} Stars</span>
                        <div className="flex-1 bg-slate-700/60 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-yellow-400 h-2 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-slate-300 font-mono text-[11px]">
                          {item.count} ({item.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Category Ratings */}
                  <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-5 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Category Breakdown
                    </h4>
                    {reportData.categoryRatings.length > 0 ? (
                      reportData.categoryRatings.map((cat, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-700/40 text-xs">
                          <span className="text-slate-300">{cat.category}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-yellow-400">{cat.average} / 5.0</span>
                            <span className="text-[10px] text-slate-400">({cat.count})</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No category feedback logged yet.</p>
                    )}
                  </div>
                </div>

                {/* Qualitative Feedback Cards */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Participant Testimonials & Comments ({reportData.feedbacks.length})
                  </h4>

                  {reportData.feedbacks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {reportData.feedbacks.map((fb, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between hover:border-slate-600 transition"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="font-semibold text-white text-xs">{fb.studentName}</h5>
                                <p className="text-[10px] text-slate-400 font-mono">{fb.department} • {fb.studentId}</p>
                              </div>
                              <div className="flex items-center gap-0.5 text-yellow-400">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-3.5 h-3.5 ${
                                      s <= fb.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-slate-200 mt-2.5 italic">
                              "{fb.comment}"
                            </p>
                          </div>
                          <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-700/40 text-[10px] text-slate-400 font-mono">
                            <span className="px-2 py-0.5 rounded bg-slate-700/50 text-slate-300">
                              {fb.category || 'General'}
                            </span>
                            <span>{fb.createdAt}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-8 text-center text-slate-400 text-xs">
                      No reviews or qualitative comments recorded for this event yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 4: LOGISTICS & SIGN-OFF */}
            {/* ======================================================== */}
            {activeTab === 'signoff' && (
              <div className="space-y-6">
                {/* Logistics Checklist */}
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Venue Logistics & Facility Audit</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700/50">
                      <span className="text-slate-400 block mb-1">Venue Name</span>
                      <span className="font-semibold text-white">{event.venueName}</span>
                    </div>
                    <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700/50">
                      <span className="text-slate-400 block mb-1">Campus Location</span>
                      <span className="font-medium text-slate-200">{venue?.location || 'BUP Main Complex'}</span>
                    </div>
                    <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700/50">
                      <span className="text-slate-400 block mb-1">Venue Seating Capacity</span>
                      <span className="font-mono font-bold text-white">{venue?.capacity || event.maxSeats}</span>
                    </div>
                    <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700/50">
                      <span className="text-slate-400 block mb-1">Turnout / Capacity Ratio</span>
                      <span className="font-mono font-bold text-cyan-400">
                        {reportData.metrics.attendedCount} / {event.maxSeats} ({reportData.metrics.turnoutRate}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Institutional Compliance & Sign-Off Preview */}
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                        Institutional Governance & Audit Sign-Off
                      </h4>
                      <p className="text-xs text-slate-400">
                        Official validation certifying accurate gate verification and financial compliance.
                      </p>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/30">
                      COMPLIANCE VERIFIED
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
                          {event.organizingTeam || event.contactPerson || 'Club Event Convener'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {club?.name || event.clubName}
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
                          VERIFIED & ENDORSED BY
                        </span>
                        <p className="text-xs font-semibold text-white">
                          {club?.facultyAdvisor?.name || 'Assigned Faculty Advisor'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {club?.facultyAdvisor?.designation || 'Club Advisor'}
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
                          APPROVED & ARCHIVED BY
                        </span>
                        <p className="text-xs font-semibold text-white">
                          Directorate of Students' Welfare
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
              Document ID: {reportData.reportRef} • BUP CMS v2.0
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
