import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Rotate3d,
  ZoomIn,
  ZoomOut,
  Flame,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import type { SpacecraftDesign, SubsystemCategory } from '../../types/subsystems.ts';
import { playThrusterPulse, playTelemetryClick } from '../../utils/audio.ts';

interface VisualizerProps {
  design: SpacecraftDesign;
  activeCategory?: SubsystemCategory;
  onSelectCategory?: (category: SubsystemCategory) => void;
}

export const SpacecraftVisualizer3D: React.FC<VisualizerProps> = ({
  design,
  activeCategory,
  onSelectCategory
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [isFiringThruster, setIsFiringThruster] = useState(false);
  const [hoveredSubsystem, setHoveredSubsystem] = useState<SubsystemCategory | null>(null);

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const autoRotateRef = useRef(true);
  autoRotateRef.current = isAutoRotating;

  const thrusterFiringRef = useRef(false);
  thrusterFiringRef.current = isFiringThruster;

  const resetCameraPos = (view: 'iso' | 'instruments' | 'engine' | 'panels') => {
    playTelemetryClick();
    if (!cameraRef.current) return;
    const cam = cameraRef.current;
    if (view === 'iso') {
      cam.position.set(3.6, 2.4, 4.4);
    } else if (view === 'instruments') {
      cam.position.set(0, 4.8, 1.2);
    } else if (view === 'engine') {
      cam.position.set(0, -4.5, 2.2);
    } else if (view === 'panels') {
      cam.position.set(5.5, 0.5, 0);
    }
    cam.lookAt(0, 0, 0);
  };

  const handleZoom = (delta: number) => {
    playTelemetryClick();
    if (!cameraRef.current) return;
    const cam = cameraRef.current;
    const len = cam.position.length();
    const newLen = Math.max(2.5, Math.min(10.0, len + delta));
    cam.position.multiplyScalar(newLen / len);
  };

  const handleTestThruster = () => {
    playThrusterPulse();
    setIsFiringThruster(true);
    setTimeout(() => {
      setIsFiringThruster(false);
    }, 1200);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080b12);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(3.6, 2.4, 4.4);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Deep Space Starfield particles
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 600;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 40;
      starPositions[i + 1] = (Math.random() - 0.5) * 40;
      starPositions[i + 2] = (Math.random() - 0.5) * 40;

      const c = Math.random();
      starColors[i] = c > 0.8 ? 0.9 : 0.4;
      starColors[i + 1] = c > 0.8 ? 0.9 : 0.6;
      starColors[i + 2] = 0.9;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMaterial = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.6
    });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // Subtle coordinate grid plane
    const gridHelper = new THREE.GridHelper(8, 16, 0x0284c7, 0x1b2330);
    gridHelper.position.y = -1.9;
    scene.add(gridHelper);

    // Key & Ambient Lighting
    const ambientLight = new THREE.AmbientLight(0x151b26, 2.0);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 3.0);
    sunLight.position.set(6, 8, 7);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
    rimLight.position.set(-6, -3, -5);
    scene.add(rimLight);

    // Spacecraft Model Group
    const spacecraftGroup = new THREE.Group();
    scene.add(spacecraftGroup);

    // 1. Central Bus Body (Hexagonal Cylinder with Gold MLI)
    const busGeometry = new THREE.CylinderGeometry(0.85, 0.95, 1.65, 6);
    const busMaterial = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.85,
      roughness: 0.25
    });
    const busMesh = new THREE.Mesh(busGeometry, busMaterial);
    busMesh.castShadow = true;
    busMesh.receiveShadow = true;
    spacecraftGroup.add(busMesh);

    // Top & Bottom Avionics Deck Plates
    const deckGeometry = new THREE.CylinderGeometry(0.9, 0.9, 0.06, 6);
    const deckMaterial = new THREE.MeshStandardMaterial({ color: 0x293342, metalness: 0.9, roughness: 0.2 });
    const topDeck = new THREE.Mesh(deckGeometry, deckMaterial);
    topDeck.position.y = 0.85;
    spacecraftGroup.add(topDeck);

    const bottomDeck = new THREE.Mesh(deckGeometry, deckMaterial);
    bottomDeck.position.y = -0.85;
    spacecraftGroup.add(bottomDeck);

    // 2. Solar Arrays (Power)
    const hasSolar = (design.components.power || []).length > 0;
    if (hasSolar) {
      const panelMat = new THREE.MeshStandardMaterial({
        color: 0x0369a1,
        metalness: 0.8,
        roughness: 0.2
      });

      [-1, 1].forEach((dir) => {
        const wingGroup = new THREE.Group();
        wingGroup.position.set(dir * 0.95, 0, 0);

        const boom = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8),
          new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 })
        );
        boom.rotation.z = (Math.PI / 2) * dir;
        boom.position.x = dir * 0.3;
        wingGroup.add(boom);

        const panel1 = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.4, 0.03), panelMat);
        panel1.position.x = dir * 0.9;
        wingGroup.add(panel1);

        const panel2 = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.4, 0.03), panelMat);
        panel2.position.x = dir * 1.9;
        wingGroup.add(panel2);

        spacecraftGroup.add(wingGroup);
      });
    }

    // 3. High-Gain Antenna (Communications)
    const hasComms = (design.components.communications || []).length > 0;
    if (hasComms) {
      const dishGroup = new THREE.Group();
      dishGroup.position.set(0, 1.15, 0);

      const dishMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.7, roughness: 0.2 });
      const dish = new THREE.Mesh(new THREE.SphereGeometry(0.65, 24, 16, 0, Math.PI * 2, 0, Math.PI / 3), dishMat);
      dish.rotation.x = Math.PI;
      dishGroup.add(dish);

      const subreflector = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.45, 8),
        new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9 })
      );
      subreflector.position.y = 0.25;
      dishGroup.add(subreflector);

      spacecraftGroup.add(dishGroup);
    }

    // 4. Main Engine & Thruster Plume (Propulsion)
    const hasProp = (design.components.propulsion || []).length > 0;
    let thrusterPlume: THREE.Mesh | null = null;
    if (hasProp) {
      const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.95, roughness: 0.15 });
      const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.7, 18, 1, true), nozzleMat);
      nozzle.position.set(0, -1.2, 0);
      spacecraftGroup.add(nozzle);

      const plumeGeo = new THREE.ConeGeometry(0.45, 1.8, 16);
      const plumeMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.0
      });
      thrusterPlume = new THREE.Mesh(plumeGeo, plumeMat);
      thrusterPlume.rotation.x = Math.PI;
      thrusterPlume.position.set(0, -2.1, 0);
      spacecraftGroup.add(thrusterPlume);
    }

    // 5. Science Instrument Suite
    const hasScience = (design.components.science || []).length > 0;
    if (hasScience) {
      const cameraBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.35, 0.45),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 })
      );
      cameraBox.position.set(0.45, 0.95, 0.35);
      spacecraftGroup.add(cameraBox);

      const lens = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.1, 16),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.1 })
      );
      lens.rotation.x = Math.PI / 2;
      lens.position.set(0.45, 0.95, 0.6);
      spacecraftGroup.add(lens);
    }

    // Mouse drag rotation
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      spacecraftGroup.rotation.y += deltaX * 0.008;
      spacecraftGroup.rotation.x += deltaY * 0.008;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      if (autoRotateRef.current && !isDragging) {
        spacecraftGroup.rotation.y += 0.003;
      }
      gridHelper.rotation.y -= 0.0004;

      if (thrusterPlume) {
        if (thrusterFiringRef.current) {
          (thrusterPlume.material as THREE.MeshBasicMaterial).opacity = 0.85 + Math.sin(elapsed * 40) * 0.15;
          thrusterPlume.scale.set(
            1.0 + Math.sin(elapsed * 30) * 0.1,
            1.0 + Math.cos(elapsed * 25) * 0.2,
            1.0 + Math.sin(elapsed * 30) * 0.1
          );
        } else {
          (thrusterPlume.material as THREE.MeshBasicMaterial).opacity = 0.0;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newHeight <= 0 || newWidth <= 0) return;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [design]);

  return (
    <div className="relative w-full h-full min-h-[250px] rounded-xl overflow-hidden border border-[#293342] bg-[#080B12]">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left: Subsystem Interactive Shortcuts */}
      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
        {[
          { cat: 'power' as SubsystemCategory, label: 'Power Solar Array' },
          { cat: 'communications' as SubsystemCategory, label: 'High-Gain Dish' },
          { cat: 'propulsion' as SubsystemCategory, label: 'Main Thruster' },
          { cat: 'science' as SubsystemCategory, label: 'Science Suite' }
        ].map((item) => (
          <button
            key={item.cat}
            type="button"
            onClick={() => onSelectCategory?.(item.cat)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all cursor-pointer ${
              activeCategory === item.cat
                ? 'bg-sky-500/20 text-sky-200 border-sky-400 font-bold'
                : 'bg-[#151B26]/80 text-[#AAB4C3] border-[#293342] hover:text-white hover:border-[#37465B]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Top Right: Camera Controls */}
      <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#151B26]/90 border border-[#293342] p-1 rounded-lg backdrop-blur-sm z-10">
        <button
          type="button"
          onClick={() => resetCameraPos('iso')}
          className="px-2 py-0.5 text-[10px] font-mono rounded text-[#AAB4C3] hover:text-white hover:bg-space-750 transition-colors"
          title="Isometric view"
        >
          ISO
        </button>
        <button
          type="button"
          onClick={() => resetCameraPos('instruments')}
          className="px-2 py-0.5 text-[10px] font-mono rounded text-[#AAB4C3] hover:text-white hover:bg-space-750 transition-colors"
          title="Instruments / Nadir view"
        >
          NADIR
        </button>
        <button
          type="button"
          onClick={() => resetCameraPos('engine')}
          className="px-2 py-0.5 text-[10px] font-mono rounded text-[#AAB4C3] hover:text-white hover:bg-space-750 transition-colors"
          title="Engine view"
        >
          ENGINE
        </button>
        <button
          type="button"
          onClick={() => resetCameraPos('panels')}
          className="px-2 py-0.5 text-[10px] font-mono rounded text-[#AAB4C3] hover:text-white hover:bg-space-750 transition-colors"
          title="Solar array view"
        >
          SOLAR
        </button>

        <div className="w-[1px] h-3.5 bg-[#293342] mx-0.5" />

        <button
          type="button"
          onClick={() => handleZoom(-1.0)}
          className="p-1 rounded text-[#AAB4C3] hover:text-white hover:bg-space-750"
          title="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(1.0)}
          className="p-1 rounded text-[#AAB4C3] hover:text-white hover:bg-space-750"
          title="Zoom out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            playTelemetryClick();
            setIsAutoRotating(!isAutoRotating);
          }}
          className={`p-1 rounded transition-colors ${
            isAutoRotating ? 'text-sky-400 bg-sky-950/60' : 'text-[#AAB4C3] hover:text-white'
          }`}
          title="Toggle rotation"
        >
          <Rotate3d className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Left: Thruster Test Fire */}
      <div className="absolute bottom-3 left-3 z-10">
        <button
          type="button"
          onClick={handleTestThruster}
          disabled={isFiringThruster}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151B26] hover:bg-space-750 border border-amber-500/40 text-amber-300 font-mono text-[11px] font-semibold transition-all cursor-pointer"
        >
          <Flame className={`w-3.5 h-3.5 ${isFiringThruster ? 'animate-bounce text-orange-400' : ''}`} />
          <span>{isFiringThruster ? 'BURNING RCS...' : 'TEST THRUSTERS'}</span>
        </button>
      </div>

      {/* Bottom Right: Bus Tag */}
      <div className="absolute bottom-3 right-3 bg-[#151B26]/90 border border-[#293342] px-3 py-1 rounded-md text-right font-mono pointer-events-none z-10">
        <span className="text-[10px] text-[#6F7B8C] block uppercase">Spacecraft Bus</span>
        <span className="text-xs text-white font-semibold">{design.name}</span>
      </div>
    </div>
  );
};
