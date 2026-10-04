import React from 'react';
import { Rocket, BookOpen, Database, Sparkles, ChevronRight, ShieldAlert } from 'lucide-react';
import type { ScenarioDefinition } from '../../types/mission.ts';

interface LandingScreenProps {
  scenario: ScenarioDefinition;
  onStartMission: () => void;
  onOpenHowToPlay: () => void;
  onOpenNasaData: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  scenario,
  onStartMission,
  onOpenHowToPlay,
  onOpenNasaData
}) => {
  return (
    <div className="min-h-screen bg-[#080B12] text-[#F3F6FA] flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background Subtle Space Horizon & Starfield */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Subtle radial glow representing sunlit asteroid horizon */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-sky-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-sky-950/20 rounded-full blur-3xl" />
        
        {/* Geometric constellation lines */}
        <svg className="absolute inset-0 w-full h-full opacity-15" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20%" cy="30%" r="1" fill="#38BDF8" />
          <circle cx="45%" cy="18%" r="1.5" fill="#FFFFFF" />
          <circle cx="75%" cy="35%" r="1.2" fill="#38BDF8" />
          <circle cx="85%" cy="65%" r="1" fill="#FFFFFF" />
          <line x1="20%" y1="30%" x2="45%" y2="18%" stroke="#38BDF8" strokeWidth="0.5" strokeDasharray="3 3" />
          <line x1="45%" y1="18%" x2="75%" y2="35%" stroke="#38BDF8" strokeWidth="0.5" strokeDasharray="3 3" />
        </svg>
      </div>

      {/* Top Status Bar */}
      <header className="relative z-10 px-8 py-5 flex items-center justify-between border-b border-[#293342]/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-950/80 border border-sky-500/30 flex items-center justify-center font-mono font-bold text-sky-400 text-xs">
            LL
          </div>
          <div>
            <span className="text-xs font-heading font-semibold text-white tracking-wider block">
              NASA SPACE APPS CHALLENGE
            </span>
            <span className="text-[10px] font-mono text-[#6F7B8C]">
              JPL ASTEROID EXPLORATION INITIATIVE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-telemetry-pulse" />
          <span className="text-xs font-mono text-emerald-400 font-medium">
            SIMULATION ENGINE ONLINE
          </span>
        </div>
      </header>

      {/* Center Hero Section */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 text-center flex flex-col items-center">
        {/* Target Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#151B26] border border-[#293342] text-xs font-mono text-sky-300 mb-8 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
          <span>PRIMARY TARGET: 101955 BENNU (NEAR-EARTH ASTEROID)</span>
        </div>

        {/* Main Title */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white tracking-tight mb-4">
          MISSION: LAST LIGHT
        </h1>

        {/* Tagline */}
        <div className="flex items-center justify-center gap-3 text-base md:text-lg font-mono text-sky-400/90 font-medium tracking-wide mb-6">
          <span>Design.</span>
          <span className="text-[#6F7B8C]">•</span>
          <span>Stress-test.</span>
          <span className="text-[#6F7B8C]">•</span>
          <span>Adapt.</span>
          <span className="text-[#6F7B8C]">•</span>
          <span className="text-emerald-400">Survive.</span>
        </div>

        {/* Short Clean Description */}
        <p className="max-w-xl text-sm md:text-base text-[#AAB4C3] leading-relaxed mb-10">
          Build and command a robotic asteroid mission where every engineering decision has consequences. Balance power, mass, thermal limits, and deep-space communications against real spaceflight hazards.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          {/* Primary Action */}
          <button
            type="button"
            onClick={onStartMission}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-mono text-sm font-bold flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-sky-950/60 active:scale-95 group cursor-pointer"
          >
            <Rocket className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
            <span>START MISSION</span>
            <ChevronRight className="w-4 h-4 opacity-75" />
          </button>

          {/* Secondary Action */}
          <button
            type="button"
            onClick={onOpenHowToPlay}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#151B26] hover:bg-[#1B2330] text-[#F3F6FA] border border-[#293342] hover:border-sky-500/40 font-mono text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-sky-400" />
            <span>HOW TO PLAY</span>
          </button>

          {/* Tertiary Action */}
          <button
            type="button"
            onClick={onOpenNasaData}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#151B26] hover:bg-[#1B2330] text-[#AAB4C3] hover:text-white border border-[#293342] font-mono text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Database className="w-4 h-4 text-slate-400" />
            <span>NASA DATA</span>
          </button>
        </div>

        {/* Quick Spec Highlights */}
        <div className="mt-14 pt-8 border-t border-[#293342]/60 grid grid-cols-2 md:grid-cols-4 gap-6 text-left max-w-2xl w-full">
          <div>
            <span className="text-[10px] font-mono text-[#6F7B8C] uppercase block">Mission Target</span>
            <span className="text-xs font-mono font-semibold text-white">Asteroid Bennu</span>
          </div>
          <div>
            <span className="text-[10px] font-mono text-[#6F7B8C] uppercase block">Transfer Distance</span>
            <span className="text-xs font-mono font-semibold text-sky-300">1.13 - 1.42 AU</span>
          </div>
          <div>
            <span className="text-[10px] font-mono text-[#6F7B8C] uppercase block">Discovery Budget</span>
            <span className="text-xs font-mono font-semibold text-emerald-400">${scenario.budgetCapM}M Cap</span>
          </div>
          <div>
            <span className="text-[10px] font-mono text-[#6F7B8C] uppercase block">Flight Engine</span>
            <span className="text-xs font-mono font-semibold text-white">First-Principles Physics</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-8 py-4 border-t border-[#293342]/40 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-[#6F7B8C] gap-2">
        <div>
          MISSION: LAST LIGHT © 2026 — NASA Space Apps Challenge
        </div>
        <div className="flex items-center gap-4">
          <span>JPL HORIZONS EPHEMERIS</span>
          <span>•</span>
          <span>DEEP SPACE NETWORK</span>
          <span>•</span>
          <span>TSIOLKOVSKY ROCKET EQUATION</span>
        </div>
      </footer>
    </div>
  );
};
