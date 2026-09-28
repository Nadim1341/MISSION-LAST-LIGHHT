import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Rotate3d,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Flame,
  Eye,
  Layers,
  Sparkles
} from 'lucide-react';
import type { SpacecraftDesign } from '../../types/subsystems.ts';
import { playThrusterPulse, playTelemetryClick } from '../../utils/audio.ts';

interface VisualizerProps {
  design: SpacecraftDesign;
}

export const SpacecraftVisualizer3D: React.FC<VisualizerProps> = ({ design }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [showCallouts, setShowCallouts] = useState(true);
  const [isFiringThruster, setIsFiringThruster] = useState(false);

  // References to communicate with Three.js animation loop
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

    // Three.js Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712); // Deep space void

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
    const starCount = 800;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 50;
      starPositions[i + 1] = (Math.random() - 0.5) * 50;
      starPositions[i + 2] = (Math.random() - 0.5) * 50;

      // Color variation from pale blue to warm white
      const c = Math.random();
      starColors[i] = c > 0.8 ? 0.95 : 0.45;
      starColors[i + 1] = c > 0.8 ? 0.95 : 0.75;
      starColors[i + 2] = 1.0;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.75
    });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // Coordinate grid ring
    const gridHelper = new THREE.GridHelper(8, 16, 0x0284c7, 0x1e293b);
    gridHelper.position.y = -1.9;
    scene.add(gridHelper);

    // Lighting (Warm Sun Key + Cool Earth Rim)
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 3.2);
    sunLight.position.set(6, 8, 7);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    rimLight.position.set(-6, -3, -5);
    scene.add(rimLight);

    // Spacecraft Model Group
    const spacecraftGroup = new THREE.Group();
    scene.add(spacecraftGroup);

    // Central Hexagonal Bus Body (MLI Thermal Foil)
    const busGeometry = new THREE.CylinderGeometry(0.85, 0.95, 1.65, 6);
    const busMaterial = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Rich gold thermal blanket
      metalness: 0.88,
      roughness: 0.22,
      bumpScale: 0.05
    });
    const busMesh = new THREE.Mesh(busGeometry, busMaterial);
    busMesh.castShadow = true;
    busMesh.receiveShadow = true;
    spacecraftGroup.add(busMesh);

    // Structural Decks (Top and Bottom Carbon Composite)
    const deckGeometry = new THREE.CylinderGeometry(0.9, 0.9, 0.09, 6);
    const deckMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.7,
      roughness: 0.35
    });
    const topDeck = new THREE.Mesh(deckGeometry, deckMaterial);
    topDeck.position.y = 0.87;
    topDeck.castShadow = true;
    spacecraftGroup.add(topDeck);

    const bottomDeck = new THREE.Mesh(deckGeometry, deckMaterial);
    bottomDeck.position.y = -0.87;
    bottomDeck.castShadow = true;
    spacecraftGroup.add(bottomDeck);

    // 4 Corner RCS Thruster Pods
    const rcsPodGeometry = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    const rcsPodMaterial = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
    const rcsCorners = [
      { x: 0.75, z: 0.45 },
      { x: -0.75, z: 0.45 },
      { x: 0.75, z: -0.45 },
      { x: -0.75, z: -0.45 }
    ];
    rcsCorners.forEach((corner) => {
      const pod = new THREE.Mesh(rcsPodGeometry, rcsPodMaterial);
      pod.position.set(corner.x, 0.75, corner.z);
      spacecraftGroup.add(pod);

      const podBottom = pod.clone();
      podBottom.position.y = -0.75;
      spacecraftGroup.add(podBottom);
    });

    // Main Engine Nozzle (if propulsion equipped)
    const hasPropulsion = (design.components.propulsion || []).length > 0;
    const isIonEngine = (design.components.propulsion || []).some((p) => p.id === 'prop_next_c_ion');
    let thrusterPlume: THREE.Mesh | null = null;

    if (hasPropulsion) {
      const nozzleGeometry = new THREE.ConeGeometry(0.38, 0.75, 20, 1, true);
      const nozzleMaterial = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.92,
        roughness: 0.15,
        side: THREE.DoubleSide
      });
      const nozzle = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
      nozzle.position.y = -1.25;
      spacecraftGroup.add(nozzle);

      // Nozzle interior glow
      const glowGeometry = new THREE.SphereGeometry(0.14, 16, 16);
      const glowColor = isIonEngine ? 0x06b6d4 : 0xf97316;
      const glowMaterial = new THREE.MeshBasicMaterial({ color: glowColor });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.y = -1.05;
      spacecraftGroup.add(glow);

      // Animated Thruster Plume Flame
      const plumeGeo = new THREE.ConeGeometry(0.32, 1.8, 16);
      const plumeMat = new THREE.MeshBasicMaterial({
        color: isIonEngine ? 0x38bdf8 : 0xfbbf24,
        transparent: true,
        opacity: 0.0
      });
      thrusterPlume = new THREE.Mesh(plumeGeo, plumeMat);
      thrusterPlume.rotation.x = Math.PI;
      thrusterPlume.position.y = -2.15;
      spacecraftGroup.add(thrusterPlume);
    }

    // Solar Arrays (Left & Right)
    const hasSolar = (design.components.power || []).some(
      (p) => p.id === 'pwr_ultraflex_solar' || p.id === 'pwr_rigid_silicon'
    );
    const isUltraFlex = (design.components.power || []).some((p) => p.id === 'pwr_ultraflex_solar');

    if (hasSolar) {
      const boomGeometry = new THREE.CylinderGeometry(0.045, 0.045, 0.85, 8);
      const boomMaterial = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });

      // Left Boom
      const leftBoom = new THREE.Mesh(boomGeometry, boomMaterial);
      leftBoom.rotation.z = Math.PI / 2;
      leftBoom.position.set(-1.15, 0, 0);
      spacecraftGroup.add(leftBoom);

      if (isUltraFlex) {
        // UltraFlex Circular Accordion Array
        const panelGeometry = new THREE.CircleGeometry(0.95, 24);
        const panelMaterial = new THREE.MeshStandardMaterial({
          color: 0x1e1b4b, // Dark navy photovoltaic cell
          metalness: 0.75,
          roughness: 0.25,
          side: THREE.DoubleSide
        });
        const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
        leftPanel.rotation.y = Math.PI / 2;
        leftPanel.position.set(-2.1, 0, 0);
        spacecraftGroup.add(leftPanel);

        // Center hub ring
        const hubGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 16);
        const hubMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9 });
        const leftHub = new THREE.Mesh(hubGeo, hubMat);
        leftHub.rotation.z = Math.PI / 2;
        leftHub.position.set(-2.1, 0, 0);
        spacecraftGroup.add(leftHub);

        // Right Array
        const rightBoom = leftBoom.clone();
        rightBoom.position.x = 1.15;
        spacecraftGroup.add(rightBoom);

        const rightPanel = leftPanel.clone();
        rightPanel.position.x = 2.1;
        spacecraftGroup.add(rightPanel);

        const rightHub = leftHub.clone();
        rightHub.position.x = 2.1;
        spacecraftGroup.add(rightHub);
      } else {
        // Rectangular Rigid Silicon Panels with Solar Cell Pattern
        const panelGeometry = new THREE.BoxGeometry(0.06, 1.6, 0.85);
        const panelMaterial = new THREE.MeshStandardMaterial({
          color: 0x172554, // Deep blue silicon
          metalness: 0.65,
          roughness: 0.3
        });
        const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
        leftPanel.position.set(-1.85, 0, 0);
        spacecraftGroup.add(leftPanel);

        const rightBoom = leftBoom.clone();
        rightBoom.position.x = 1.15;
        spacecraftGroup.add(rightBoom);

        const rightPanel = leftPanel.clone();
        rightPanel.position.x = 1.85;
        spacecraftGroup.add(rightPanel);
      }
    }

    // High Gain Antenna (HGA Dish)
    const hasHga = (design.components.communications || []).some(
      (c) => c.id === 'comm_xband_hga_12m' || c.id === 'comm_kaband_dsoc'
    );
    if (hasHga) {
      // White parabolic dish reflector
      const dishGeometry = new THREE.SphereGeometry(0.7, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2.6);
      const dishMaterial = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        metalness: 0.45,
        roughness: 0.28,
        side: THREE.DoubleSide
      });
      const dishMesh = new THREE.Mesh(dishGeometry, dishMaterial);
      dishMesh.rotation.x = -Math.PI / 2 + 0.35; // Point towards Earth
      dishMesh.position.set(0, 1.35, 0.2);
      spacecraftGroup.add(dishMesh);

      // Sub-reflector feed tripod
      const hornGeometry = new THREE.CylinderGeometry(0.03, 0.06, 0.4, 8);
      const hornMaterial = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8 });
      const horn = new THREE.Mesh(hornGeometry, hornMaterial);
      horn.position.set(0, 1.7, 0.38);
      spacecraftGroup.add(horn);
    }

    // Science Instruments (Cameras, LIDAR, Spectrometer)
    const hasCamera = (design.components.science || []).some((s) => s.id === 'sci_multispectral_imager');
    if (hasCamera) {
      const cameraGeometry = new THREE.CylinderGeometry(0.12, 0.15, 0.38, 16);
      const cameraMaterial = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85 });
      const cameraLens = new THREE.Mesh(cameraGeometry, cameraMaterial);
      cameraLens.position.set(0.42, 0.98, 0.42);
      spacecraftGroup.add(cameraLens);

      // Glass front aperture
      const lensGlass = new THREE.Mesh(
        new THREE.CircleGeometry(0.11, 16),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      lensGlass.rotation.x = -Math.PI / 2;
      lensGlass.position.set(0.42, 1.18, 0.42);
      spacecraftGroup.add(lensGlass);
    }

    const hasLidar = (design.components.science || []).some((s) => s.id === 'sci_lidar_altimeter');
    if (hasLidar) {
      const lidarGeometry = new THREE.BoxGeometry(0.24, 0.28, 0.24);
      const lidarMaterial = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 });
      const lidar = new THREE.Mesh(lidarGeometry, lidarMaterial);
      lidar.position.set(-0.42, 0.98, 0.32);
      spacecraftGroup.add(lidar);

      const laserEmitter = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.09, 12),
        new THREE.MeshBasicMaterial({ color: 0x10b981 })
      );
      laserEmitter.position.set(-0.42, 1.14, 0.32);
      spacecraftGroup.add(laserEmitter);
    }

    // Whipple Debris Shield
    const hasWhipple = (design.components.structure || []).some((s) => s.id === 'struct_whipple_debris_shield');
    if (hasWhipple) {
      const whippleGeometry = new THREE.BoxGeometry(1.7, 1.55, 0.045);
      const whippleMaterial = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.85,
        roughness: 0.15
      });
      const whippleMesh = new THREE.Mesh(whippleGeometry, whippleMaterial);
      whippleMesh.position.set(0, 0, 1.0);
      spacecraftGroup.add(whippleMesh);
    }

    // Magnetometer Boom (extends out backwards)
    const hasMag = (design.components.science || []).some((s) => s.id === 'sci_magnetometer_plasma');
    if (hasMag) {
      const boomGeo = new THREE.CylinderGeometry(0.02, 0.02, 2.2, 8);
      const boomMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
      const magBoom = new THREE.Mesh(boomGeo, boomMat);
      magBoom.rotation.x = Math.PI / 2;
      magBoom.position.set(0, -0.2, -1.8);
      spacecraftGroup.add(magBoom);

      const sensorGeo = new THREE.SphereGeometry(0.08, 12, 12);
      const sensorMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
      const sensor = new THREE.Mesh(sensorGeo, sensorMat);
      sensor.position.set(0, -0.2, -2.9);
      spacecraftGroup.add(sensor);
    }

    // Interactive Drag to Rotate Controls
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

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      if (autoRotateRef.current && !isDragging) {
        spacecraftGroup.rotation.y += 0.004; // Smooth idle rotation
      }
      gridHelper.rotation.y -= 0.0006;

      // Handle Thruster Plume Animation
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
    <div className="relative w-full h-full min-h-[440px] rounded-2xl overflow-hidden border border-cyan-500/25 bg-slate-950/90 shadow-2xl hud-corner">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Tactical HUD Header */}
      <div className="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/85 border border-cyan-500/40 px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-300 backdrop-blur-md shadow-lg">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-bold tracking-wider">3D TELEMETRY BUS VISUALIZER</span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono ml-1">
          DRAG TO ROTATE | REAL-TIME MESH RECONSTRUCTION
        </span>
      </div>

      {/* Component Callout Badges Overlay */}
      {showCallouts && (
        <div className="absolute top-14 left-3 flex flex-col gap-1.5 pointer-events-none max-w-[220px]">
          {(design.components.power || []).length > 0 && (
            <div className="bg-slate-950/75 border border-cyan-500/30 px-2 py-0.5 rounded text-[10px] font-mono text-cyan-200">
              ⚡ {(design.components.power || [])[0].name.split(' ')[0]} Solar Array
            </div>
          )}
          {(design.components.communications || []).length > 0 && (
            <div className="bg-slate-950/75 border border-cyan-500/30 px-2 py-0.5 rounded text-[10px] font-mono text-cyan-200">
              📡 {(design.components.communications || [])[0].name.split(' ')[0]} HGA Antenna
            </div>
          )}
          {(design.components.science || []).length > 0 && (
            <div className="bg-slate-950/75 border border-purple-500/30 px-2 py-0.5 rounded text-[10px] font-mono text-purple-200">
              🔬 {(design.components.science || [])[0].name}
            </div>
          )}
          {(design.components.structure || []).some((s) => s.id === 'struct_whipple_debris_shield') && (
            <div className="bg-slate-950/75 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-200">
              🛡 Whipple Debris Shield
            </div>
          )}
        </div>
      )}

      {/* Tactical Camera Controls Toolbar */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-900/85 border border-slate-700/80 p-1 rounded-xl backdrop-blur-md">
        <button
          type="button"
          onClick={() => resetCameraPos('iso')}
          className="px-2 py-1 text-[10px] font-mono rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Isometric view"
        >
          ISO
        </button>
        <button
          type="button"
          onClick={() => resetCameraPos('instruments')}
          className="px-2 py-1 text-[10px] font-mono rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Instruments / Nadir view"
        >
          NADIR
        </button>
        <button
          type="button"
          onClick={() => resetCameraPos('engine')}
          className="px-2 py-1 text-[10px] font-mono rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Engine view"
        >
          ENGINE
        </button>

        <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />

        <button
          type="button"
          onClick={() => handleZoom(-1.0)}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
          title="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(1.0)}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
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
            isAutoRotating ? 'text-cyan-400 bg-cyan-950/60' : 'text-slate-400 hover:text-white'
          }`}
          title="Toggle auto-rotation"
        >
          <Rotate3d className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => {
            playTelemetryClick();
            setShowCallouts(!showCallouts);
          }}
          className={`p-1 rounded transition-colors ${
            showCallouts ? 'text-cyan-400 bg-cyan-950/60' : 'text-slate-400 hover:text-white'
          }`}
          title="Toggle HUD Callouts"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Thruster Test Fire Button */}
      <div className="absolute bottom-3 left-3">
        <button
          type="button"
          onClick={handleTestThruster}
          disabled={isFiringThruster}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900/90 border border-amber-500/40 text-amber-300 font-mono text-[11px] font-semibold backdrop-blur-md transition-all shadow-lg shadow-amber-950/40"
        >
          <Flame className={`w-3.5 h-3.5 ${isFiringThruster ? 'animate-bounce text-orange-400' : ''}`} />
          <span>{isFiringThruster ? 'FIRING RCS...' : 'TEST THRUSTERS'}</span>
        </button>
      </div>

      {/* Architecture Badge */}
      <div className="absolute bottom-3 right-3 bg-slate-900/85 border border-slate-700/80 px-3 py-1.5 rounded-xl text-right font-mono backdrop-blur-md pointer-events-none">
        <span className="text-[10px] text-slate-400 block uppercase">Bus Architecture</span>
        <span className="text-xs text-white font-semibold">
          {design.name}
        </span>
      </div>
    </div>
  );
};
