import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SystemNotification, UserRole, MembershipApplication, UserProfile } from '../../types/cms';
import {
  Bell,
  CheckCircle2,
  Clock,
  CheckCheck,
  Sparkles,
  Filter,
  MessageSquareQuote,
  SendHorizontal,
  AlertCircle,
  HelpCircle,
  ShieldAlert
} from 'lucide-react';
import { soundFx } from '../../utils/audioFx';

interface NotificationCenterProps {
  notifications: SystemNotification[];
  applications?: MembershipApplication[];
  currentUser?: UserProfile;
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  selectedRole: UserRole;
  onRespondQna?: (applicationId: string, answer: string) => Promise<void> | void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications = [],
  applications = [],
  currentUser,
  onMarkAsRead,
  onClearAll,
  selectedRole,
  onRespondQna
}) => {
  const [filterType, setFilterType] = useState<'All' | 'Action_Required' | 'Approval' | 'Event' | 'Reminder'>('All');
  const [replyDrafts, setReplyDrafts] = useState<{ [notifId: string]: string }>({});
  const [submittingReplies, setSubmittingReplies] = useState<{ [notifId: string]: boolean }>({});

  const filtered = (notifications ?? []).filter((notif) => {
    if (!notif) return false;
    if (filterType === 'All') return true;
    return notif.type === filterType;
  });

  const unreadCount = (notifications ?? []).filter((n) => !n.read).length;
  const actionRequiredCount = (notifications ?? []).filter((n) => n.type === 'Action_Required' || n.actionType === 'qna_reply').length;

  const handleSendQnaReply = async (notif: SystemNotification) => {
    const draft = replyDrafts[notif.id];
    const targetAppId = notif.applicationId;
    if (!draft || !draft.trim() || !targetAppId || !onRespondQna) return;

    setSubmittingReplies((prev) => ({ ...prev, [notif.id]: true }));
    soundFx.playSuccess();

    try {
      await onRespondQna(targetAppId, draft.trim());
      onMarkAsRead(notif.id);
      setReplyDrafts((prev) => ({ ...prev, [notif.id]: '' }));
    } catch (e: any) {
      alert(e.message || 'Unable to submit reply.');
    } finally {
      setSubmittingReplies((prev) => ({ ...prev, [notif.id]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl glass-panel-glow p-6 sm:p-8 border border-emerald-500/30">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Real-Time Campus Dispatch & Q&A Hub</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-heading">
              Announcements & Approval Alerts
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Live updates regarding club executive sign-offs, interactive moderator inquiries, and upcoming event passes.
            </p>
          </div>

          <button
            onClick={() => {
              soundFx.playSuccess();
              onClearAll();
            }}
            className="flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-white/10 transition-all shrink-0 cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 text-emerald-400" />
            <span>Mark All as Read</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="glass-panel p-2 rounded-2xl border border-white/10 flex space-x-2 overflow-x-auto">
        {(['All', 'Action_Required', 'Approval', 'Event', 'Reminder'] as const).map((tab) => {
          const isSelected = filterType === tab;
          let label = `${tab}s`;
          if (tab === 'All') label = `All Alerts (${notifications.length})`;
          if (tab === 'Action_Required') label = `Action Needed (${actionRequiredCount})`;

          return (
            <button
              key={tab}
              onClick={() => {
                soundFx.playClick();
                setFilterType(tab);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-emerald-400 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {label}
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
            {filtered.map((notif) => {
              const isQna = notif.actionType === 'qna_reply' || notif.type === 'Action_Required' || Boolean(notif.questionPrompt);
              const relatedApp = applications.find((a) => a.id === notif.applicationId);
              const hasAnswered = relatedApp?.studentAnswer;

              return (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => {
                    if (!isQna) {
                      soundFx.playClick();
                      onMarkAsRead(notif.id);
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all ${
                    isQna
                      ? 'bg-slate-900 border-amber-500/50 shadow-lg shadow-amber-950/20'
                      : notif.read
                      ? 'bg-slate-950/40 border-white/5 opacity-70 hover:opacity-100 cursor-pointer'
                      : 'bg-slate-900/90 border-emerald-500/40 shadow-lg shadow-emerald-950/20 hover:border-emerald-400 cursor-pointer'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2.5 rounded-xl border mt-0.5 shrink-0 ${
                        isQna
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse'
                          : notif.read
                          ? 'bg-slate-800 border-white/5 text-slate-400'
                          : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      }`}
                    >
                      {isQna ? <MessageSquareQuote className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-xs">{notif.title}</h3>
                          {isQna && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                              Action Needed
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400/80 bg-slate-950/80 px-2 py-0.5 rounded-md border border-white/5">
                          {notif.timestamp}
                        </span>
                      </div>

                      <p className="text-slate-300 leading-relaxed">{notif.message}</p>

                      {/* Interactive Q&A Input Box on the Notification Card */}
                      {isQna && (
                        <div className="mt-3 p-3.5 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-2.5">
                          <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>Clarification Inquiry from Moderator:</span>
                          </div>

                          <p className="text-slate-200 text-xs italic bg-slate-900/90 p-2.5 rounded-xl border border-white/5">
                            "{notif.questionPrompt || notif.message}"
                          </p>

                          {hasAnswered ? (
                            <div className="pt-1 space-y-1">
                              <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Response Delivered to Moderator:</span>
                              </span>
                              <p className="text-slate-200 text-xs bg-emerald-950/30 p-2 rounded-xl border border-emerald-500/20">
                                "{relatedApp?.studentAnswer}"
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                Awaiting final decision from the club executive committee.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2 pt-1">
                              <label className="text-slate-300 text-xs font-semibold block">
                                Reply to Moderator to complete your membership verification:
                              </label>

                              <textarea
                                rows={2}
                                value={replyDrafts[notif.id] || ''}
                                onChange={(e) =>
                                  setReplyDrafts((prev) => ({ ...prev, [notif.id]: e.target.value }))
                                }
                                placeholder="Type your answer / clarification here..."
                                className="w-full text-xs p-2.5 rounded-xl glass-input placeholder-slate-500 focus:outline-none resize-none"
                              />

                              {/* Quick Reply Chips */}
                              <div className="flex flex-wrap gap-1.5">
                                {[
                                  'Yes, I am available on weekends.',
                                  'I have relevant project experience.',
                                  'I am applying for Software / Technical team.'
                                ].map((chip) => (
                                  <button
                                    key={chip}
                                    type="button"
                                    onClick={() =>
                                      setReplyDrafts((prev) => ({ ...prev, [notif.id]: chip }))
                                    }
                                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 transition-colors cursor-pointer"
                                  >
                                    {chip}
                                  </button>
                                ))}
                              </div>

                              <div className="flex justify-end pt-1">
                                <button
                                  type="button"
                                  disabled={submittingReplies[notif.id] || !replyDrafts[notif.id]?.trim()}
                                  onClick={() => handleSendQnaReply(notif)}
                                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-xs transition-all shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                  <SendHorizontal className="w-3.5 h-3.5" />
                                  <span>
                                    {submittingReplies[notif.id] ? 'Submitting...' : 'Send Answer to Moderator'}
                                  </span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
