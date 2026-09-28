import React, { useState } from 'react';
import { Info, X } from 'lucide-react';
import { AEROSPACE_GLOSSARY } from '../../data/glossary.ts';

export const EducationalTooltip: React.FC<{ termKey: keyof typeof AEROSPACE_GLOSSARY }> = ({ termKey }) => {
  const [isOpen, setIsOpen] = useState(false);
  const data = AEROSPACE_GLOSSARY[termKey];

  if (!data) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center text-cyan-400 hover:text-cyan-200 transition-colors ml-1 p-0.5 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500"
        title={`Learn about ${data.title}`}
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel glass-panel-glow max-w-lg w-full rounded-xl p-6 text-slate-100 relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
                NASA Educational Concept
              </span>
            </div>

            <h3 className="text-lg font-heading font-semibold text-white mb-2">
              {data.title}
            </h3>

            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              {data.explanation}
            </p>

            {data.formula && (
              <div className="bg-slate-950/80 border border-cyan-500/20 rounded-lg p-3 mb-4 font-mono text-xs text-cyan-300 flex items-center justify-between">
                <span>{data.formula}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">Formula</span>
              </div>
            )}

            {data.nasaContext && (
              <div className="bg-blue-950/30 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-200/90 leading-relaxed">
                <span className="font-semibold text-blue-300 block mb-1">Authentic Aerospace Context:</span>
                {data.nasaContext}
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 text-xs font-mono bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors shadow-lg shadow-cyan-900/30"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
