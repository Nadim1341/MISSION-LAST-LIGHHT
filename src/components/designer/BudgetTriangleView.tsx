import React from 'react';
import type { BudgetTriangleCoordinates } from '../../types/readiness.ts';

interface TriangleProps {
  coordinates: BudgetTriangleCoordinates;
}

export const BudgetTriangleView: React.FC<TriangleProps> = ({ coordinates }) => {
  const { science, survivability, affordability } = coordinates;

  // Normalize barycentric coordinates for triangle plotting
  const total = Math.max(1, science + survivability + affordability);
  const wSci = science / total;
  const wSurv = survivability / total;
  const wAff = affordability / total;

  // Triangle vertices in 200x170 SVG space
  const topX = 100, topY = 20; // Science (top)
  const leftX = 25, leftY = 150; // Survivability (bottom-left)
  const rightX = 175, rightY = 150; // Affordability (bottom-right)

  // Barycentric to Cartesian coordinates: P = wSci * Top + wSurv * Left + wAff * Right
  const markerX = wSci * topX + wSurv * leftX + wAff * rightX;
  const markerY = wSci * topY + wSurv * leftY + wAff * rightY;

  return (
    <div className="glass-panel rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1.5">
        <h3 className="text-xs font-heading font-semibold text-white uppercase tracking-wider">
          Mission Strategy Triangle
        </h3>
        <span className="text-[10px] font-mono text-slate-400">
          PHILOSOPHY BALANCE
        </span>
      </div>

      <div className="relative w-full flex items-center justify-center py-1">
        <svg viewBox="0 0 200 170" className="w-48 h-40 overflow-visible">
          {/* Outer Triangle */}
          <polygon
            points={`${topX},${topY} ${leftX},${leftY} ${rightX},${rightY}`}
            fill="rgba(15, 23, 42, 0.6)"
            stroke="rgba(56, 189, 248, 0.3)"
            strokeWidth="1.5"
          />

          {/* Internal Guidance Lines to Center */}
          <line x1={topX} y1={topY} x2={100} y2={107} stroke="rgba(56, 189, 248, 0.15)" strokeDasharray="3 3" />
          <line x1={leftX} y1={leftY} x2={100} y2={107} stroke="rgba(56, 189, 248, 0.15)" strokeDasharray="3 3" />
          <line x1={rightX} y1={rightY} x2={100} y2={107} stroke="rgba(56, 189, 248, 0.15)" strokeDasharray="3 3" />

          {/* Vertex Labels */}
          <text x={topX} y={topY - 8} textAnchor="middle" fill="#c084fc" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
            SCIENCE ({science})
          </text>
          <text x={leftX - 6} y={leftY + 14} textAnchor="start" fill="#38bdf8" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">
            SURVIVABILITY ({survivability})
          </text>
          <text x={rightX + 6} y={rightY + 14} textAnchor="end" fill="#34d399" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">
            AFFORDABILITY ({affordability})
          </text>

          {/* Player Configuration Position Marker */}
          <circle cx={markerX} cy={markerY} r="7" fill="rgba(56, 189, 248, 0.3)" className="animate-ping" />
          <circle cx={markerX} cy={markerY} r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
        </svg>
      </div>

      <div className="text-[10px] text-slate-400 font-mono text-center leading-tight">
        Trade-offs are intrinsic. No mission can maximize all three priorities simultaneously.
      </div>
    </div>
  );
};
