import React from 'react';
import { X, CheckCircle2, ShieldAlert, Cpu, Radio, Microscope, Rocket } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartMission: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose, onStartMission }) => {
  if (!isOpen) return null;

  const steps = [
    {
      num: 1,
      title: 'Build Your Spacecraft',
      desc: 'Assemble 8 critical subsystems: Power, Propulsion, Comms, Computing, Navigation, Thermal, Science, and Structure. Every component adds mass, cost, and power requirements.',
      icon: Cpu
    },
    {
      num: 2,
      title: 'Watch Engineering Constraints',
      desc: 'Ensure total wet mass fits inside your launch vehicle capacity, power generation exceeds subsystem loads at Bennu (1.4 AU from Sun), and budget stays under the $300M cap.',
      icon: CheckCircle2
    },
    {
      num: 3,
      title: 'Stress-Test Your Architecture',
      desc: 'Run pre-flight simulations against 8 authentic space hazards (solar proton storms, DSN blackouts, thermal extremes, micrometeorite debris). Redesign to eliminate critical single points of failure.',
      icon: ShieldAlert
    },
    {
      num: 4,
      title: 'Launch & Interplanetary Cruise',
      desc: 'Command the spacecraft through liftoff and a 280-day heliocentric transfer orbit. Control simulation speed (1x to 100x) and monitor live telemetry as distances scale.',
      icon: Rocket
    },
    {
      num: 5,
      title: 'Adapt to Real Flight Anomalies',
      desc: 'Make real flight-controller decisions during deep-space crises. Choose safe mode, reroute electrical buses, or burn reaction control propellant to save the spacecraft.',
      icon: Radio
    },
    {
      num: 6,
      title: 'Operate Science Instruments',
      desc: 'Fire multi-spectral cameras, laser altimeters, and spectrometers in proximity ops to acquire high-value planetary science and unlock rare astronomical discoveries.',
      icon: Microscope
    },
    {
      num: 7,
      title: 'Downlink Data Through NASA DSN',
      desc: 'Manage your Solid-State Recorder memory buffer. Transmit telemetry and science through Deep Space Network ground stations (Goldstone, Madrid, Canberra) before buffer overflows.',
      icon: CheckCircle2
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="mission-panel-elevated max-w-2xl w-full p-6 text-txt-primary flex flex-col max-h-[88vh] border border-[#293342]">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#293342]">
          <div>
            <span className="text-[10px] font-mono text-nasa-cyan uppercase tracking-widest block">
              Mission Flight Manual
            </span>
            <h2 className="text-xl font-heading font-bold text-white">
              How to Command the Mission
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-txt-muted hover:text-white p-1 rounded-lg hover:bg-space-750 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-5">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.num} className="bg-space-850 p-3.5 rounded-lg border border-[#232D3E] flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-md bg-space-800 border border-nasa-cyan/40 flex items-center justify-center text-xs font-mono font-bold text-nasa-cyan shrink-0 mt-0.5">
                  {s.num}
                </div>
                <div>
                  <h3 className="text-sm font-heading font-semibold text-white mb-0.5 flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-nasa-cyan" />
                    {s.title}
                  </h3>
                  <p className="text-xs text-txt-secondary leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#293342]">
          <span className="text-xs font-mono text-txt-muted">
            NASA Space Apps Challenge 2026
          </span>
          <button
            type="button"
            onClick={() => {
              onClose();
              onStartMission();
            }}
            className="px-5 py-2 rounded-lg bg-nasa-blue hover:bg-sky-500 text-white font-mono text-xs font-bold transition-all shadow-md active:scale-95"
          >
            BEGIN MISSION CONFIGURATION
          </button>
        </div>
      </div>
    </div>
  );
};
