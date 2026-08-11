import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sliders,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  X,
  Gauge,
  Layers,
  Flame,
  Activity
} from 'lucide-react';
import { soundFx } from '../../utils/audioFx';

export interface MotionSettings {
  speed: number;
  springPreset: 'gentle' | 'snappy' | 'bouncy' | 'kinetic';
  particleDensity: number;
  glowTheme: 'subtle' | 'vivid' | 'cyber';
  soundEnabled: boolean;
}

interface MotionControllerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: MotionSettings;
  onUpdateSettings: (newSettings: Partial<MotionSettings>) => void;
}

export const MotionController: React.FC<MotionControllerProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings
}) => {
  const presets: Record<
    MotionSettings['springPreset'],
    { label: string; desc: string; stiffness: number; damping: number }
  > = {
    gentle: { label: 'Gentle & Smooth', desc: 'Relaxed transitions (motion.dev standard)', stiffness: 180, damping: 24 },
    snappy: { label: 'Snappy Precision', desc: 'Instant feedback with crisp settle', stiffness: 350, damping: 28 },
    bouncy: { label: 'Playful Elastic', desc: 'Spring overshoot physics', stiffness: 420, damping: 18 },
    kinetic: { label: 'Anime.js Kinetic', desc: 'High velocity staggered acceleration', stiffness: 500, damping: 20 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative max-w-md w-full glass-panel-glow rounded-3xl p-6 border border-emerald-500/30 z-10 shadow-2xl space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Motion & Physics Studio</h3>
                  <p className="text-[11px] text-emerald-400/80 font-mono">Anime.js & Motion.dev Engine Controls</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Controls */}
            <div className="space-y-4 text-xs">
              {/* Physics Spring Profile */}
              <div>
                <label className="font-bold text-slate-200 block mb-2 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Spring Physics Profile
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(presets) as Array<MotionSettings['springPreset']>).map((key) => {
                    const active = settings.springPreset === key;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          soundFx.playClick( active ? 600 : 950 );
                          onUpdateSettings({ springPreset: key });
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          active
                            ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border-emerald-500 text-white shadow-sm'
                            : 'bg-slate-900/60 border-white/5 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        <p className="font-bold text-xs">{presets[key].label}</p>
                        <p className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">{presets[key].desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Speed Multiplier */}
              <div>
                <div className="flex justify-between items-center mb-1.5 font-bold text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                    Animation Speed Scale
                  </span>
                  <span className="font-mono text-emerald-400">{settings.speed}x</span>
                </div>
                <div className="flex gap-2">
                  {[0.5, 1, 1.5, 2].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        soundFx.playClick(700 + s * 200);
                        onUpdateSettings({ speed: s });
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                        settings.speed === s
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-900/60 border-white/10 text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Particle Canvas Density */}
              <div>
                <div className="flex justify-between items-center mb-1.5 font-bold text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    Kinetic Particle Nodes
                  </span>
                  <span className="font-mono text-cyan-400">{settings.particleDensity} nodes</span>
                </div>
                <div className="flex gap-2">
                  {[15, 35, 60].map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        soundFx.playClick();
                        onUpdateSettings({ particleDensity: d });
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        settings.particleDensity === d
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                          : 'bg-slate-900/60 border-white/10 text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      {d === 15 ? 'Minimal' : d === 35 ? 'Balanced' : 'Ultra Flow'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio Feedback Toggle */}
              <div className="p-3 bg-slate-900/80 rounded-xl border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {settings.soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-500" />
                  )}
                  <div>
                    <p className="font-bold text-slate-200">Synthesized Audio Feedback</p>
                    <p className="text-[10px] text-slate-400">Web Audio API micro-tones for clicks & actions</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const isMuted = soundFx.toggleMute();
                    onUpdateSettings({ soundEnabled: !isMuted });
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all ${
                    settings.soundEnabled
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400 border border-white/10'
                  }`}
                >
                  {settings.soundEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            {/* Test Trigger Button */}
            <button
              onClick={() => {
                soundFx.playSuccess();
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Test Spring & Audio Chime
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
