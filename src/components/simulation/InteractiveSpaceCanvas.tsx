import React, { useRef, useEffect, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Compass, Info, Radio, Eye } from 'lucide-react';
import type { MissionTelemetry, ScenarioDefinition } from '../../types/mission.ts';
import type { SpacecraftDesign } from '../../types/subsystems.ts';
import { playTelemetryClick } from '../../utils/audio.ts';

interface InteractiveSpaceCanvasProps {
  telemetry: MissionTelemetry;
  design: SpacecraftDesign;
  scenario: ScenarioDefinition;
  viewMode: 'heliocentric' | 'proximity';
  onToggleViewMode: (mode: 'heliocentric' | 'proximity') => void;
  onInspectEntity: (entity: 'spacecraft' | 'bennu' | 'earth' | 'sun') => void;
}

export const InteractiveSpaceCanvas: React.FC<InteractiveSpaceCanvasProps> = ({
  telemetry,
  design,
  scenario,
  viewMode,
  onToggleViewMode,
  onInspectEntity
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedEntity, setSelectedEntity] = useState<'spacecraft' | 'bennu' | 'earth' | 'sun' | null>('spacecraft');

  const animOffsetRef = useRef(0);

  // Canvas interaction handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsPanning(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPanning) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const centerX = canvas.width / 2 + panOffset.x;
    const centerY = canvas.height / 2 + panOffset.y;

    // Check hit test for sun
    const distToSun = Math.hypot(mouseX - centerX, mouseY - centerY);
    if (distToSun < 30) {
      setSelectedEntity('sun');
      onInspectEntity('sun');
      playTelemetryClick();
      return;
    }

    // Check hit test for spacecraft
    const totalDays = scenario.baselineTimelineDays;
    const progress = Math.min(1.0, telemetry.missionElapsedTimeDays / totalDays);
    const scale = Math.min(canvas.width, canvas.height) * 0.33 * zoomLevel;

    // Approximate heliocentric transfer angle
    const angle = progress * Math.PI * 0.85;
    const scR = (1.0 + (scenario.target.distanceAuMax - 1.0) * progress) * scale;
    const scX = centerX + Math.cos(angle) * scR;
    const scY = centerY - Math.sin(angle) * scR;

    if (Math.hypot(mouseX - scX, mouseY - scY) < 25) {
      setSelectedEntity('spacecraft');
      onInspectEntity('spacecraft');
      playTelemetryClick();
      return;
    }

    // Check hit test for Bennu
    const bennuAngle = Math.PI * 0.85;
    const bennuR = scenario.target.distanceAuMax * scale;
    const bennuX = centerX + Math.cos(bennuAngle) * bennuR;
    const bennuY = centerY - Math.sin(bennuAngle) * bennuR;

    if (Math.hypot(mouseX - bennuX, mouseY - bennuY) < 25) {
      setSelectedEntity('bennu');
      onInspectEntity('bennu');
      playTelemetryClick();
      return;
    }
  };

  const resetView = () => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
    setSelectedEntity('spacecraft');
  };

  // Render loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      animId = requestAnimationFrame(render);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2 + panOffset.x;
      const centerY = height / 2 + panOffset.y;

      ctx.clearRect(0, 0, width, height);

      // Deep space void
      ctx.fillStyle = '#080B12';
      ctx.fillRect(0, 0, width, height);

      animOffsetRef.current = (animOffsetRef.current + 0.03) % 1.0;

      if (viewMode === 'heliocentric') {
        const scale = Math.min(width, height) * 0.33 * zoomLevel;

        // Draw AU Distance Rings
        [0.5, 1.0, 1.5].forEach((au) => {
          ctx.beginPath();
          ctx.arc(centerX, centerY, au * scale, 0, Math.PI * 2);
          ctx.strokeStyle = '#1B2330';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = '#6F7B8C';
          ctx.font = '10px IBM Plex Mono';
          ctx.fillText(`${au} AU`, centerX + au * scale + 4, centerY - 4);
        });

        // 1. Central Sun
        const sunRadius = 18 * zoomLevel;
        const sunGrad = ctx.createRadialGradient(centerX, centerY, 3, centerX, centerY, sunRadius * 2);
        sunGrad.addColorStop(0, '#FEF08A');
        sunGrad.addColorStop(0.35, '#F59E0B');
        sunGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, sunRadius * 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FDE047';
        ctx.beginPath();
        ctx.arc(centerX, centerY, sunRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px IBM Plex Sans';
        ctx.fillText('Sol (Sun)', centerX - 22, centerY + sunRadius + 14);

        // 2. Earth Orbit & Position (1.0 AU)
        const earthAngle = animOffsetRef.current * 0.1; // Slow Earth revolution
        const earthR = 1.0 * scale;
        const earthX = centerX + Math.cos(earthAngle) * earthR;
        const earthY = centerY - Math.sin(earthAngle) * earthR;

        ctx.beginPath();
        ctx.arc(earthX, earthY, 6 * zoomLevel, 0, Math.PI * 2);
        ctx.fillStyle = '#38BDF8';
        ctx.fill();

        ctx.fillStyle = '#AAB4C3';
        ctx.font = '10px IBM Plex Mono';
        ctx.fillText('Earth', earthX + 8, earthY - 6);

        // 3. Asteroid 101955 Bennu Target Position (1.42 AU max)
        const bennuAngle = Math.PI * 0.85;
        const bennuR = scenario.target.distanceAuMax * scale;
        const bennuX = centerX + Math.cos(bennuAngle) * bennuR;
        const bennuY = centerY - Math.sin(bennuAngle) * bennuR;

        // Target marker diamond
        ctx.save();
        ctx.translate(bennuX, bennuY);
        ctx.rotate(Math.PI / 4);
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-6, -6, 12, 12);
        ctx.restore();

        ctx.fillStyle = '#F59E0B';
        ctx.font = '10px IBM Plex Mono';
        ctx.fillText('101955 Bennu', bennuX + 10, bennuY - 6);

        // 4. Heliocentric Transfer Ellipse (Earth -> Bennu)
        ctx.beginPath();
        ctx.moveTo(earthX, earthY);
        ctx.quadraticCurveTo(centerX + scale * 0.5, centerY - scale * 1.5, bennuX, bennuY);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]);

        // 5. Spacecraft Current Position Along Trajectory
        const totalDays = scenario.baselineTimelineDays;
        const progress = Math.min(1.0, telemetry.missionElapsedTimeDays / totalDays);
        const scAngle = progress * Math.PI * 0.85;
        const scR = (1.0 + (scenario.target.distanceAuMax - 1.0) * progress) * scale;
        const scX = centerX + Math.cos(scAngle) * scR;
        const scY = centerY - Math.sin(scAngle) * scR;

        // Microwave DSN communication link to Earth
        if (telemetry.isInDsnWindow) {
          ctx.beginPath();
          ctx.moveTo(scX, scY);
          ctx.lineTo(earthX, earthY);
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 5]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Spacecraft icon & radar pulse
        ctx.beginPath();
        ctx.arc(scX, scY, 9, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(scX, scY, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#38BDF8';
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '11px IBM Plex Mono';
        ctx.fillText('ASTERIA-1', scX + 8, scY - 6);

        // Selected Entity Target Box
        if (selectedEntity === 'spacecraft') {
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 1;
          ctx.strokeRect(scX - 12, scY - 12, 24, 24);
        } else if (selectedEntity === 'bennu') {
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 1;
          ctx.strokeRect(bennuX - 12, bennuY - 12, 24, 24);
        }
      } else {
        // ==================== PROXIMITY SURVEY VIEW ====================
        // Centered asteroid rubble pile Bennu
        const bennuRadius = 60 * zoomLevel;

        const asteroidGrad = ctx.createRadialGradient(
          centerX - 15,
          centerY - 15,
          10,
          centerX,
          centerY,
          bennuRadius
        );
        asteroidGrad.addColorStop(0, '#64748B');
        asteroidGrad.addColorStop(0.7, '#334155');
        asteroidGrad.addColorStop(1, '#0F172A');

        ctx.fillStyle = asteroidGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, bennuRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Orbital survey standoff corridor (1.5 km orbit)
        const orbitRadius = bennuRadius + 80 * zoomLevel;
        ctx.beginPath();
        ctx.arc(centerX, centerY, orbitRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Spacecraft in survey orbit
        const scOrbitAngle = animOffsetRef.current * Math.PI * 2;
        const scX = centerX + Math.cos(scOrbitAngle) * orbitRadius;
        const scY = centerY + Math.sin(scOrbitAngle) * orbitRadius;

        // LIDAR / Instrument ground track cone
        ctx.beginPath();
        ctx.moveTo(scX, scY);
        ctx.lineTo(centerX - 12, centerY - 12);
        ctx.lineTo(centerX + 12, centerY + 12);
        ctx.closePath();
        ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(scX, scY, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#38BDF8';
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '11px IBM Plex Mono';
        ctx.fillText('ASTERIA-1 (2.4 km/s)', scX + 8, scY - 6);
      }
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [telemetry, design, scenario, viewMode, zoomLevel, panOffset, selectedEntity]);

  return (
    <div className="relative w-full h-full min-h-[460px] rounded-xl overflow-hidden border border-[#293342] bg-[#080B12] select-none">
      <canvas
        ref={canvasRef}
        width={860}
        height={540}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Top Left: Orbit View Mode Switcher */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
        <button
          type="button"
          onClick={() => {
            playTelemetryClick();
            onToggleViewMode('heliocentric');
          }}
          className={`px-2.5 py-1 rounded text-xs font-mono border transition-all cursor-pointer ${
            viewMode === 'heliocentric'
              ? 'bg-sky-500/20 text-sky-200 border-sky-400 font-bold'
              : 'bg-[#151B26]/85 text-[#AAB4C3] border-[#293342] hover:text-white hover:border-[#37465B]'
          }`}
        >
          Heliocentric Orbit
        </button>

        <button
          type="button"
          onClick={() => {
            playTelemetryClick();
            onToggleViewMode('proximity');
          }}
          className={`px-2.5 py-1 rounded text-xs font-mono border transition-all cursor-pointer ${
            viewMode === 'proximity'
              ? 'bg-sky-500/20 text-sky-200 border-sky-400 font-bold'
              : 'bg-[#151B26]/85 text-[#AAB4C3] border-[#293342] hover:text-white hover:border-[#37465B]'
          }`}
        >
          Bennu Proximity
        </button>
      </div>

      {/* Top Right: Zoom & Center Controls */}
      <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#151B26]/90 border border-[#293342] p-1 rounded-lg backdrop-blur-sm z-10">
        <button
          type="button"
          onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
          className="p-1 rounded text-[#AAB4C3] hover:text-white hover:bg-space-750"
          title="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.25))}
          className="p-1 rounded text-[#AAB4C3] hover:text-white hover:bg-space-750"
          title="Zoom out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={resetView}
          className="p-1 rounded text-[#AAB4C3] hover:text-white hover:bg-space-750"
          title="Reset View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Left: Contextual Entity HUD Overlay */}
      <div className="absolute bottom-3 left-3 bg-[#151B26]/95 border border-[#293342] p-3 rounded-lg text-xs font-mono flex flex-col gap-1 backdrop-blur-md shadow-xl z-10 min-w-[210px]">
        <div className="flex items-center justify-between text-[#6F7B8C] pb-1 border-b border-[#293342]">
          <span className="font-bold text-white uppercase">{selectedEntity || 'SPACECRAFT'}</span>
          <span className="text-[10px] text-sky-400">TELEMETRY</span>
        </div>
        <div className="flex justify-between text-[#AAB4C3]">
          <span>Sun Distance:</span>
          <span className="text-white font-semibold">{telemetry.distanceFromSunAu} AU</span>
        </div>
        <div className="flex justify-between text-[#AAB4C3]">
          <span>Earth Distance:</span>
          <span className="text-white font-semibold">{telemetry.distanceFromEarthAu} AU</span>
        </div>
        <div className="flex justify-between text-[#AAB4C3]">
          <span>Target Range:</span>
          <span className="text-sky-300 font-semibold">
            {(telemetry.distanceToTargetKm / 1000000).toFixed(1)}M km
          </span>
        </div>
        <div className="flex justify-between text-[#AAB4C3]">
          <span>DSN Delay:</span>
          <span className="text-amber-300 font-semibold">
            {Math.round(telemetry.oneWayLightTimeSec)}s
          </span>
        </div>
      </div>
    </div>
  );
};
