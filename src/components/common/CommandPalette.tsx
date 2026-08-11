import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Building2,
  Calendar,
  Users,
  ShieldCheck,
  LayoutDashboard,
  Sparkles,
  Volume2,
  VolumeX,
  Sliders,
  ArrowRight,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { Club, ClubEvent, Venue, UserRole } from '../../types/cms';
import { soundFx } from '../../utils/audioFx';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  clubs: Club[];
  events: ClubEvent[];
  venues: Venue[];
  onNavigateTab: (tab: 'clubs' | 'events' | 'venues' | 'notifications' | 'analytics') => void;
  onRoleChange: (role: UserRole) => void;
  onOpenMotionSettings: () => void;
  onExportCsv?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  clubs,
  events,
  venues,
  onNavigateTab,
  onRoleChange,
  onOpenMotionSettings,
  onExportCsv
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      soundFx.playClick(900);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Generate command actions
  const allActions: Array<{
    id: string;
    title: string;
    subtitle: string;
    category: 'Navigation' | 'Clubs' | 'Events' | 'Venues' | 'Role Switch' | 'Tools';
    icon: any;
    action: () => void;
  }> = [
    // Navigation
    {
      id: 'nav-clubs',
      title: 'Go to Club Directory',
      subtitle: 'Browse all student societies and executive rosters',
      category: 'Navigation',
      icon: Users,
      action: () => {
        onNavigateTab('clubs');
        onClose();
      }
    },
    {
      id: 'nav-events',
      title: 'Go to Event Hub & RSVPs',
      subtitle: 'View upcoming workshops, contests & your passes',
      category: 'Navigation',
      icon: Calendar,
      action: () => {
        onNavigateTab('events');
        onClose();
      }
    },
    {
      id: 'nav-venues',
      title: 'Go to Venue Booking Engine',
      subtitle: 'Reserve campus auditoriums, halls & labs',
      category: 'Navigation',
      icon: Building2,
      action: () => {
        onNavigateTab('venues');
        onClose();
      }
    },
    {
      id: 'nav-analytics',
      title: 'Go to Admin & Executive Analytics',
      subtitle: 'View BI metrics, venue utilization & engagement',
      category: 'Navigation',
      icon: LayoutDashboard,
      action: () => {
        onNavigateTab('analytics');
        onClose();
      }
    },

    // Tools
    {
      id: 'tool-motion',
      title: 'Motion & Physics Controller',
      subtitle: 'Adjust animation speed, spring stiffness & ambient glow',
      category: 'Tools',
      icon: Sliders,
      action: () => {
        onOpenMotionSettings();
        onClose();
      }
    },
    {
      id: 'tool-sound',
      title: soundFx.getIsMuted() ? 'Unmute Sound Effects' : 'Mute Sound Effects',
      subtitle: 'Toggle synthesized tactile audio feedback',
      category: 'Tools',
      icon: soundFx.getIsMuted() ? VolumeX : Volume2,
      action: () => {
        soundFx.toggleMute();
        onClose();
      }
    },
    ...(onExportCsv
      ? [
          {
            id: 'tool-export',
            title: 'Export Executive Analytics CSV',
            subtitle: 'Download complete report of co-curricular metrics',
            category: 'Tools' as const,
            icon: FileSpreadsheet,
            action: () => {
              onExportCsv();
              onClose();
            }
          }
        ]
      : []),

    // Role Switchers
    {
      id: 'role-student',
      title: 'Switch Role: Student',
      subtitle: 'Standard student view for joining clubs & RSVP passes',
      category: 'Role Switch',
      icon: ShieldCheck,
      action: () => {
        onRoleChange('Student');
        onClose();
      }
    },
    {
      id: 'role-exec',
      title: 'Switch Role: Club Executive',
      subtitle: 'Executive permissions to publish events & book venues',
      category: 'Role Switch',
      icon: ShieldCheck,
      action: () => {
        onRoleChange('Club_Exec');
        onClose();
      }
    },
    {
      id: 'role-advisor',
      title: 'Switch Role: Faculty Advisor',
      subtitle: 'Society advisor oversight and review permissions',
      category: 'Role Switch',
      icon: ShieldCheck,
      action: () => {
        onRoleChange('Faculty_Advisor');
        onClose();
      }
    },
    {
      id: 'role-venue',
      title: 'Switch Role: Venue Administrator',
      subtitle: 'Facilities Office sign-off queue & schedule management',
      category: 'Role Switch',
      icon: ShieldCheck,
      action: () => {
        onRoleChange('Venue_Admin');
        onClose();
      }
    },
    {
      id: 'role-admin',
      title: 'Switch Role: System Administrator',
      subtitle: 'Full university oversight & BI analytics dashboard',
      category: 'Role Switch',
      icon: ShieldCheck,
      action: () => {
        onRoleChange('System_Admin');
        onClose();
      }
    },

    // Dynamic Clubs
    ...clubs.map((c) => ({
      id: `club-${c.id}`,
      title: `${c.name} (${c.code})`,
      subtitle: `${c.category} • ${c.memberCount} Members • ${c.tagline}`,
      category: 'Clubs' as const,
      icon: Users,
      action: () => {
        onNavigateTab('clubs');
        onClose();
      }
    })),

    // Dynamic Events
    ...events.map((e) => ({
      id: `evt-${e.id}`,
      title: e.title,
      subtitle: `${e.category} • ${e.date} (${e.startTime}) • ${e.venueName}`,
      category: 'Events' as const,
      icon: Calendar,
      action: () => {
        onNavigateTab('events');
        onClose();
      }
    })),

    // Dynamic Venues
    ...venues.map((v) => ({
      id: `ven-${v.id}`,
      title: v.name,
      subtitle: `Capacity: ${v.capacity} • ${v.location}`,
      category: 'Venues' as const,
      icon: Building2,
      action: () => {
        onNavigateTab('venues');
        onClose();
      }
    }))
  ];

  const filtered = allActions.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      soundFx.playHover();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
      soundFx.playHover();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        soundFx.playClick();
        filtered[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Palette Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="relative w-full max-w-2xl glass-panel-glow rounded-3xl overflow-hidden shadow-2xl z-10 border border-emerald-500/30"
          >
            {/* Search Input Bar */}
            <div className="relative flex items-center px-5 py-4 border-b border-white/10 bg-slate-900/60">
              <Search className="w-5 h-5 text-emerald-400 mr-3 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search commands, clubs, events, venues, switch roles..."
                className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
              />
              <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-white/10">
                <span>ESC</span>
              </div>
            </div>

            {/* Results List */}
            <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No matching commands or entities found for "{query}".
                </div>
              ) : (
                filtered.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        soundFx.playClick();
                        item.action();
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-transparent border border-emerald-500/40 text-white'
                          : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-2 rounded-xl border ${
                            isSelected
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                              : 'bg-slate-800/60 border-white/5 text-slate-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate leading-tight">{item.title}</p>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.subtitle}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400 border border-white/5">
                          {item.category}
                        </span>
                        {isSelected && <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Hints */}
            <div className="px-5 py-2.5 bg-slate-950/80 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <div className="flex items-center gap-3">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
              </div>
              <div className="flex items-center gap-1 text-emerald-400">
                <Sparkles className="w-3 h-3" />
                <span>BUP Intelligent Command HUD</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
