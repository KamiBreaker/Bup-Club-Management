import React from 'react';
import { SystemNotification, UserRole } from '../../types/cms';
import { Bell, CheckCircle, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

interface NotificationCenterProps {
  notifications: SystemNotification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  selectedRole: UserRole;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onClearAll,
  selectedRole
}) => {
  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs font-bold bg-emerald-950 text-emerald-400 px-3 py-1 rounded-full border border-emerald-800">
              Notification Hub
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight mt-1">Announcements & Approval Alerts</h2>
            <p className="text-slate-300 text-xs mt-1">
              Real-time updates regarding club membership sign-offs, venue approvals, and upcoming event reminders.
            </p>
          </div>

          <button
            onClick={onClearAll}
            className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-all"
          >
            Mark All Read
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs space-y-2">
            <Bell className="w-8 h-8 mx-auto text-slate-300" />
            <p>No unread notifications at this time.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => onMarkAsRead(notif.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  notif.read
                    ? 'bg-slate-50 border-slate-200 opacity-75'
                    : 'bg-emerald-50/50 border-emerald-200 shadow-sm'
                }`}
              >
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 mt-0.5">
                  <Bell className="w-4 h-4" />
                </div>

                <div className="flex-1 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-slate-900">{notif.title}</h3>
                    <span className="text-[10px] text-slate-400 font-mono">{notif.timestamp}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{notif.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
