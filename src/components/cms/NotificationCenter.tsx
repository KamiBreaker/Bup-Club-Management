import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SystemNotification, UserRole } from '../../types/cms';
import { Bell, CheckCircle2, Clock, CheckCheck, Sparkles, Filter } from 'lucide-react';
import { soundFx } from '../../utils/audioFx';

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
  const [filterType, setFilterType] = useState<'All' | 'Approval' | 'Event' | 'Reminder'>('All');

  const filtered = (notifications ?? []).filter((notif) => {
    if (!notif) return false;
    if (filterType === 'All') return true;
    return notif.type === filterType;
  });

  const unreadCount = (notifications ?? []).filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl glass-panel-glow p-6 sm:p-8 border border-emerald-500/30">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Real-Time Campus Dispatch Hub</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-heading">
              Announcements & Approval Alerts
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Live updates regarding club executive sign-offs, venue approvals, and upcoming event passes.
            </p>
          </div>

          <button
            onClick={() => {
              soundFx.playSuccess();
              onClearAll();
            }}
            className="flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-white/10 transition-all shrink-0"
          >
            <CheckCheck className="w-4 h-4 text-emerald-400" />
            <span>Mark All as Read</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="glass-panel p-2 rounded-2xl border border-white/10 flex space-x-2 overflow-x-auto">
        {(['All', 'Approval', 'Event', 'Reminder'] as const).map((tab) => {
          const isSelected = filterType === tab;
          return (
            <button
              key={tab}
              onClick={() => {
                soundFx.playClick();
                setFilterType(tab);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isSelected
                  ? 'bg-emerald-400 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'All' ? `All Alerts (${notifications.length})` : `${tab}s`}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      <div className="glass-panel rounded-3xl border border-white/10 p-6 space-y-3 shadow-2xl">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs space-y-3">
            <Bell className="w-10 h-10 mx-auto text-slate-600 animate-pulse" />
            <p className="text-slate-300 font-semibold">No notifications under this category.</p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((notif) => (
              <motion.div
                key={notif.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => {
                  soundFx.playClick();
                  onMarkAsRead(notif.id);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                  notif.read
                    ? 'bg-slate-950/40 border-white/5 opacity-70 hover:opacity-100'
                    : 'bg-slate-900/90 border-emerald-500/40 shadow-lg shadow-emerald-950/20 hover:border-emerald-400'
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl border mt-0.5 shrink-0 ${
                    notif.read
                      ? 'bg-slate-800 border-white/5 text-slate-400'
                      : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>

                <div className="flex-1 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-white text-xs">{notif.title}</h3>
                    <span className="text-[10px] font-mono text-emerald-400/80 bg-slate-950/80 px-2 py-0.5 rounded-md border border-white/5">
                      {notif.timestamp}
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{notif.message}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
