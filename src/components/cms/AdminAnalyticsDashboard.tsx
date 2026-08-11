import React from 'react';
import { motion } from 'motion/react';
import { AnalyticsSummary, UserRole, VenueBooking } from '../../types/cms';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Building2,
  Download,
  TrendingUp,
  Check,
  X,
  Sparkles,
  Zap,
  Activity,
  Award
} from 'lucide-react';
import { soundFx } from '../../utils/audioFx';

interface AdminAnalyticsDashboardProps {
  analytics: AnalyticsSummary;
  bookings: VenueBooking[];
  selectedRole: UserRole;
  onUpdateBookingStatus: (bookingId: string, status: 'Approved' | 'Rejected') => void;
}

export const AdminAnalyticsDashboard: React.FC<AdminAnalyticsDashboardProps> = ({
  analytics,
  bookings,
  selectedRole,
  onUpdateBookingStatus
}) => {
  const pendingBookings = (bookings ?? []).filter((b) => b.status === 'Pending');

  const exportCsvReport = () => {
    soundFx.playSuccess();
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Metric,Value\n' +
      `Total Clubs,${analytics.totalClubs}\n` +
      `Total Active Members,${analytics.totalActiveMembers}\n` +
      `Total Events Conducted,${analytics.totalEventsConducted}\n` +
      `Avg Attendance Rate,${analytics.avgAttendanceRate}%\n` +
      `Pending Venue Approvals,${pendingBookings.length}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'BUP_CMS_Executive_Analytics_Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-3 rounded-xl border border-emerald-500/40 text-xs shadow-xl space-y-1">
          <p className="font-bold text-white">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="font-mono text-[11px]">
              {entry.name}: <strong>{entry.value}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl glass-panel-glow p-6 sm:p-8 border border-emerald-500/30">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>University Executive BI & Analytics</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-heading">
              Admin & Co-Curricular Intelligence
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Real-time student participation metrics, facility load analytics, and automated compliance reports.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={exportCsvReport}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs px-5 py-3 rounded-2xl shadow-xl shadow-emerald-950/40 transition-all shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Intelligence Report</span>
          </motion.button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ y: -4 }}
          className="glass-panel p-5 rounded-3xl border border-white/10 space-y-2 shadow-xl"
        >
          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
            Accredited Societies
          </span>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-black text-white font-mono">{analytics.totalClubs}</span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold block">100% University Onboarded</span>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="glass-panel p-5 rounded-3xl border border-white/10 space-y-2 shadow-xl"
        >
          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
            Active Members
          </span>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-black text-cyan-400 font-mono">{analytics.totalActiveMembers}</span>
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[10px] text-cyan-300 font-semibold block">+18% growth this term</span>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="glass-panel p-5 rounded-3xl border border-white/10 space-y-2 shadow-xl"
        >
          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
            Events Conducted
          </span>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-black text-teal-400 font-mono">{analytics.totalEventsConducted}</span>
            <div className="p-2.5 rounded-2xl bg-teal-500/20 text-teal-400">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[10px] text-teal-300 font-semibold block">Average 88% RSVP turnout</span>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="glass-panel p-5 rounded-3xl border border-white/10 space-y-2 shadow-xl"
        >
          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
            Pending Facility Queues
          </span>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-black text-amber-400 font-mono">{pendingBookings.length}</span>
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[10px] text-amber-300 font-semibold block">Awaiting Facilities Sign-off</span>
        </motion.div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Venue Utilization Bar Chart */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Facility Utilization (Hours Booked)</h3>
              <p className="text-[11px] text-slate-400">Top BUP Venues & Multipurpose Facilities</p>
            </div>
            <span className="text-[10px] bg-slate-900 text-emerald-400 font-mono px-2.5 py-1 rounded-lg border border-white/10">
              Hours Logged
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.venueUtilization ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="hoursBooked" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly RSVPs Growth Line Chart */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Student Engagement & RSVP Trajectory</h3>
              <p className="text-[11px] text-slate-400">Monthly Passes Claimed vs New Club Enrollments</p>
            </div>
            <span className="text-[10px] bg-slate-900 text-cyan-400 font-mono px-2.5 py-1 rounded-lg border border-white/10">
              2026 Term
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.monthlyRegistrations ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="rsvps" name="Event RSVPs" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                <Line type="monotone" dataKey="newMembers" name="New Members" stroke="#38bdf8" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3, fill: '#38bdf8' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pending Venue Approvals Table */}
      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="p-4 bg-slate-950/80 border-b border-white/10 font-bold text-xs text-white flex justify-between items-center">
          <span>Pending Facility Booking Applications</span>
          <span className="bg-amber-500/20 text-amber-300 font-mono text-[10px] px-3 py-1 rounded-full border border-amber-500/40">
            {pendingBookings.length} Awaiting Sign-off
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase text-[10px] font-mono">
              <tr>
                <th className="p-3.5">ID</th>
                <th className="p-3.5">Event Title</th>
                <th className="p-3.5">Society</th>
                <th className="p-3.5">Venue</th>
                <th className="p-3.5">Date & Hours</th>
                <th className="p-3.5 text-right">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {pendingBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                    All venue reservation requests have been processed and signed off.
                  </td>
                </tr>
              ) : (
                pendingBookings.map((bk) => (
                  <tr key={bk.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-emerald-400">{bk.id}</td>
                    <td className="p-3.5 font-bold text-white">{bk.eventTitle}</td>
                    <td className="p-3.5 text-slate-300">{bk.clubName}</td>
                    <td className="p-3.5 font-medium text-slate-300">{bk.venueName}</td>
                    <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                      {bk.bookingDate} ({bk.startTime} - {bk.endTime})
                    </td>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
