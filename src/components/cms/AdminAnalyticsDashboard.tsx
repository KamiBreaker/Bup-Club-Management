import React from 'react';
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
  X
} from 'lucide-react';

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
  const pendingBookings = bookings.filter((b) => b.status === 'Pending');

  const exportCsvReport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Metric,Value\n' +
      `Total Clubs,${analytics.totalClubs}\n` +
      `Total Active Members,${analytics.totalActiveMembers}\n` +
      `Total Events Conducted,${analytics.totalEventsConducted}\n` +
      `Avg Attendance Rate,${analytics.avgAttendanceRate}%\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'BUP_CMS_Executive_Analytics_Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold bg-emerald-950 text-emerald-400 px-3 py-1 rounded-full border border-emerald-800">
            University Oversight & BI
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight mt-1">Admin & Executive Analytics</h2>
          <p className="text-slate-300 text-xs mt-1">
            Real-time co-curricular metrics, venue utilization rates, member engagement scores, and CSV export.
          </p>
        </div>

        <button
          onClick={exportCsvReport}
          className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm border border-emerald-600/50 shrink-0"
        >
          <Download className="w-4 h-4" />
          Export CSV Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Active Clubs</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">{analytics.totalClubs}</span>
            <Building2 className="w-6 h-6 text-emerald-600" />
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold block">100% University Onboarded</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Student Members</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">{analytics.totalActiveMembers}</span>
            <Users className="w-6 h-6 text-teal-600" />
          </div>
          <span className="text-[10px] text-teal-700 font-semibold block">+18% growth this term</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Events Conducted</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">{analytics.totalEventsConducted}</span>
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <span className="text-[10px] text-blue-700 font-semibold block">Average 88% RSVP turnout</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pending Approvals</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-amber-600 font-mono">{pendingBookings.length}</span>
            <TrendingUp className="w-6 h-6 text-amber-600" />
          </div>
          <span className="text-[10px] text-amber-800 font-semibold block">Requires Facilities Sign-off</span>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Venue Utilization Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <span>Venue Utilization (Hours Booked)</span>
            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono">Top Halls</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.venueUtilization}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="hoursBooked" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly RSVPs Growth Line Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <span>Student RSVPs & Engagement Trend</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-mono">Monthly</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.monthlyRegistrations}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="rsvps" stroke="#0D9488" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="newMembers" stroke="#2563EB" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pending Venue Approvals Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800 flex justify-between items-center">
          <span>Pending Facility Booking Requests</span>
          <span className="bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full text-[10px]">
            {pendingBookings.length} Requests Awaiting Sign-off
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Event Purpose</th>
                <th className="p-3">Club</th>
                <th className="p-3">Requested Venue</th>
                <th className="p-3">Date & Hours</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {pendingBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                    All venue booking requests have been reviewed and processed.
                  </td>
                </tr>
              ) : (
                pendingBookings.map((bk) => (
                  <tr key={bk.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-emerald-800">{bk.id}</td>
                    <td className="p-3 font-bold text-slate-900">{bk.eventTitle}</td>
                    <td className="p-3 text-slate-700">{bk.clubName}</td>
                    <td className="p-3 font-medium text-slate-800">{bk.venueName}</td>
                    <td className="p-3 text-slate-600 font-mono text-[11px]">
                      {bk.bookingDate} ({bk.startTime} - {bk.endTime})
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onUpdateBookingStatus(bk.id, 'Approved')}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg text-[11px] flex items-center gap-1 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => onUpdateBookingStatus(bk.id, 'Rejected')}
                          className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1 rounded-lg text-[11px] flex items-center gap-1 shadow-sm"
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
