import React from 'react';
import { X, ExternalLink, Database, Globe, Compass, Radio, BookOpen } from 'lucide-react';

interface NasaDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NasaDataModal: React.FC<NasaDataModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const dataSources = [
    {
      title: 'NASA JPL Horizons Ephemeris System',
      id: '101955 Bennu (1999 RQ36)',
      desc: 'Precision orbital elements, semi-major axis (1.126 AU), eccentricity (0.2037), perihelion/aphelion distances, and light travel delays derived directly from NASA Jet Propulsion Laboratory ephemeris computation tables.',
      badge: 'JPL Horizons ID: 900101955'
    },
    {
      title: 'NASA Deep Space Network (DSN) Telecommunications Model',
      id: 'DSN 34m & 70m Ground Dishes',
      desc: 'Authentic communications calculations modeling RF free-space path loss (FSPL), carrier frequency bands (X-band ~8.4 GHz, S-band ~2.2 GHz), antenna gain (42 dBi parabolic HGA), and cyclic visibility across Goldstone, Madrid, and Canberra stations.',
      badge: 'DSN Downlink Physics'
    },
    {
      title: 'OSIRIS-REx & New Horizons Mission Hardware Heritage',
      id: 'Discovery & New Frontiers Class',
      desc: 'Components, power margins, and radiation tolerance profiles are matched to authentic flown space systems, including UltraFlex solar wings, RAD750 flight computers, hydrazine monopropellant RCS, and Whipple bumper shielding.',
      badge: 'NASA Flight Heritage'
    },
    {
      title: 'First-Principles Orbital & Aerospace Math Engines',
      id: 'Tsiolkovsky, Stefan-Boltzmann, Inverse-Square',
      desc: 'Calculations utilize standard physics: Tsiolkovsky delta-v equation with variable Isp and mass fractions, solar irradiance scaling strictly with 1/r², equilibrium radiation thermal balance with passive MLI insulation, and battery DOD cycling.',
      badge: 'Physics-Grounded Math'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="mission-panel-elevated max-w-2xl w-full p-6 text-txt-primary flex flex-col max-h-[85vh] border border-[#293342]">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#293342]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-nasa-blue/20 border border-nasa-blue/50 flex items-center justify-center text-nasa-cyan">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-nasa-cyan uppercase tracking-widest block">
                Scientific Reference Layer
              </span>
              <h2 className="text-xl font-heading font-bold text-white">
                NASA Datasets & Flight Models
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-txt-muted hover:text-white p-1 rounded-lg hover:bg-space-750 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-4">
          {dataSources.map((d, i) => (
            <div key={i} className="bg-space-850 p-4 rounded-lg border border-[#232D3E]">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-sm font-heading font-semibold text-white">
                  {d.title}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-space-800 text-nasa-cyan border border-[#293342]">
                  {d.badge}
                </span>
              </div>
              <p className="text-xs text-txt-secondary leading-relaxed mb-2">
                {d.desc}
              </p>
              <div className="text-[11px] font-mono text-txt-muted">
                Reference: <span className="text-slate-300">{d.id}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#293342] text-xs font-mono text-txt-muted">
          <span>Target Destination: 101955 Bennu</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-space-750 hover:bg-space-700 text-white font-mono text-xs transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
