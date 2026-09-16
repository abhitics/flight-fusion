/**
 * Interactive 3D Aerospace Vehicle & Attitude Orientation Replay Viewer
 * Uses Three.js for real-time 3D vehicle attitude, trajectory ribbon, and exhaust/chute dynamics.
 */

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { SynchronizedTelemetryPoint, FlightPhase } from "../types/telemetry";
import { RotateCw, Compass, Video, Eye, ShieldAlert, Sparkles } from "lucide-react";

interface ThreeRocketViewerProps {
  currentTelemetry: SynchronizedTelemetryPoint | null;
  allPoints: SynchronizedTelemetryPoint[];
  cameraMode?: "CHASE" | "ORBIT" | "PAD";
}

export const ThreeRocketViewer: React.FC<ThreeRocketViewerProps> = ({
  currentTelemetry,
  allPoints,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cameraMode, setCameraMode] = useState<"CHASE" | "ORBIT" | "PAD">("CHASE");
  const [isHovered, setIsHovered] = useState(false);

  // Three.js instances refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rocketGroupRef = useRef<THREE.Group | null>(null);
  const plumeRef = useRef<THREE.Mesh | null>(null);
  const parachuteRef = useRef<THREE.Group | null>(null);
  const trajectoryLineRef = useRef<THREE.Line | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Mouse orbit state
  const mouseState = useRef({ isDown: false, prevX: 0, prevY: 0, rotX: 0.2, rotY: 0.8, distance: 18 });

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 420;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050813);
    scene.fog = new THREE.FogExp2(0x050813, 0.0035);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 8, 22);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    sunLight.position.set(20, 40, 25);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x06b6d4, 1.4);
    rimLight.position.set(-20, -10, -20);
    scene.add(rimLight);

    // Grid Floor
    const grid = new THREE.GridHelper(80, 40, 0x0284c7, 0x1e293b);
    grid.position.y = -2;
    scene.add(grid);

    // Build Detailed Sounding Rocket 3D Model
    const rocketGroup = new THREE.Group();
    rocketGroupRef.current = rocketGroup;

    // Rocket Body Materials
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.8,
      roughness: 0.25,
    });
    const carbonFinMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.15,
    });
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.6,
      roughness: 0.3,
    });

    // Main Cylindrical Body
    const bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 6.5, 32);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 1.25;
    rocketGroup.add(bodyMesh);

    // High-visibility Roll Stripe
    const stripeGeo = new THREE.CylinderGeometry(0.505, 0.505, 1.2, 32);
    const stripeMesh = new THREE.Mesh(stripeGeo, stripeMat);
    stripeMesh.position.y = 2.4;
    rocketGroup.add(stripeMesh);

    // Ogive Nose Cone
    const noseGeo = new THREE.ConeGeometry(0.5, 2.2, 32);
    const noseMesh = new THREE.Mesh(noseGeo, stripeMat);
    noseMesh.position.y = 5.6;
    rocketGroup.add(noseMesh);

    // Engine Nozzle
    const nozzleGeo = new THREE.CylinderGeometry(0.42, 0.58, 0.9, 24);
    const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9 });
    const nozzleMesh = new THREE.Mesh(nozzleGeo, nozzleMat);
    nozzleMesh.position.y = -2.3;
    rocketGroup.add(nozzleMesh);

    // 4 Aerodynamic Stabilizer Fins
    for (let i = 0; i < 4; i++) {
      const finShape = new THREE.Shape();
      finShape.moveTo(0, 0);
      finShape.lineTo(1.3, -0.6);
      finShape.lineTo(1.3, -1.8);
      finShape.lineTo(0, -1.2);
      finShape.closePath();

      const extrudeSettings = { depth: 0.05, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02 };
      const finGeo = new THREE.ExtrudeGeometry(finShape, extrudeSettings);
      const finMesh = new THREE.Mesh(finGeo, carbonFinMat);
      finMesh.position.y = -0.6;
      finMesh.rotation.y = (i * Math.PI) / 2;
      rocketGroup.add(finMesh);
    }

    // Rocket Exhaust Plume
    const plumeGeo = new THREE.ConeGeometry(0.65, 4.5, 16);
    const plumeMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.85,
    });
    const plumeMesh = new THREE.Mesh(plumeGeo, plumeMat);
    plumeMesh.position.y = -4.9;
    plumeMesh.rotation.x = Math.PI;
    plumeMesh.visible = false;
    rocketGroup.add(plumeMesh);
    plumeRef.current = plumeMesh;

    // Parachute Assembly
    const parachuteGroup = new THREE.Group();
    const canopyGeo = new THREE.SphereGeometry(2.4, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      roughness: 0.7,
    });
    const canopyMesh = new THREE.Mesh(canopyGeo, canopyMat);
    canopyMesh.position.y = 8.5;
    parachuteGroup.add(canopyMesh);

    // Suspension Lines
    const linesMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const lx = Math.cos(angle) * 2.3;
      const lz = Math.sin(angle) * 2.3;
      const points = [new THREE.Vector3(0, 5.5, 0), new THREE.Vector3(lx, 8.5, lz)];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(lineGeo, linesMat);
      parachuteGroup.add(line);
    }
    parachuteGroup.visible = false;
    rocketGroup.add(parachuteGroup);
    parachuteRef.current = parachuteGroup;

    scene.add(rocketGroup);

    // Trajectory Path Ribbon
    if (allPoints && allPoints.length > 0) {
      const trajPoints: THREE.Vector3[] = [];
      const step = Math.max(1, Math.floor(allPoints.length / 300));
      for (let i = 0; i < allPoints.length; i += step) {
        const p = allPoints[i];
        // Scale down altitude for 3D visual coordinates
        const y = (p.altitude / 38400) * 35;
        const x = ((p.yaw || 0) / 180) * 4;
        const z = -((p.pitch - 90) / 90) * 6;
        trajPoints.push(new THREE.Vector3(x, y, z));
      }
      const trajGeo = new THREE.BufferGeometry().setFromPoints(trajPoints);
      const trajMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        linewidth: 2,
        transparent: true,
        opacity: 0.45,
      });
      const trajLine = new THREE.Line(trajGeo, trajMat);
      scene.add(trajLine);
      trajectoryLineRef.current = trajLine;
    }

    // Mouse Interaction for 3D Orbiting
    const handleMouseDown = (e: MouseEvent) => {
      mouseState.current.isDown = true;
      mouseState.current.prevX = e.clientX;
      mouseState.current.prevY = e.clientY;
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseState.current.isDown) return;
      const dx = e.clientX - mouseState.current.prevX;
      const dy = e.clientY - mouseState.current.prevY;
      mouseState.current.prevX = e.clientX;
      mouseState.current.prevY = e.clientY;

      mouseState.current.rotY -= dx * 0.008;
      mouseState.current.rotX = Math.max(
        -Math.PI / 2.2,
        Math.min(Math.PI / 2.2, mouseState.current.rotX - dy * 0.008)
      );
    };
    const handleMouseUp = () => {
      mouseState.current.isDown = false;
    };
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      mouseState.current.distance = Math.max(
        6,
        Math.min(50, mouseState.current.distance + e.deltaY * 0.02)
      );
    };

    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("wheel", handleWheel);

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // Animation Render Loop
    const animate = () => {
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        // Orbit camera positioning
        const d = mouseState.current.distance;
        const rx = mouseState.current.rotX;
        const ry = mouseState.current.rotY;

        const targetY = rocketGroupRef.current ? rocketGroupRef.current.position.y : 0;

        if (cameraMode === "CHASE") {
          cameraRef.current.position.x = Math.sin(ry) * Math.cos(rx) * d;
          cameraRef.current.position.y = targetY + Math.sin(rx) * d + 2;
          cameraRef.current.position.z = Math.cos(ry) * Math.cos(rx) * d;
          cameraRef.current.lookAt(0, targetY, 0);
        } else if (cameraMode === "PAD") {
          cameraRef.current.position.set(12, -0.5, 14);
          cameraRef.current.lookAt(0, targetY, 0);
        } else {
          // Free Orbit
          cameraRef.current.position.x = Math.sin(ry) * Math.cos(rx) * d;
          cameraRef.current.position.y = Math.sin(rx) * d;
          cameraRef.current.position.z = Math.cos(ry) * Math.cos(rx) * d;
          cameraRef.current.lookAt(0, targetY, 0);
        }

        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      resizeObserver.disconnect();
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("wheel", handleWheel);
      if (rendererRef.current?.domElement) {
        container.innerHTML = "";
      }
    };
  }, []);

  // Update Rocket Attitude & State on Telemetry updates
  useEffect(() => {
    if (!rocketGroupRef.current || !currentTelemetry) return;
    const r = rocketGroupRef.current;
    const t = currentTelemetry;

    // Convert attitude Euler angles (Pitch, Yaw, Roll) into radians
    // Standard aerospace coordinate orientation
    const pitchRad = THREE.MathUtils.degToRad(t.pitch - 90); // 90 is vertical upright
    const yawRad = THREE.MathUtils.degToRad(t.yaw);
    const rollRad = THREE.MathUtils.degToRad(t.roll);

    r.rotation.set(pitchRad, yawRad, rollRad);

    // Height position representation
    const visualY = (t.altitude / 38400) * 15;
    r.position.y = Math.min(22, visualY);

    // Exhaust plume visibility & flame flicker
    if (plumeRef.current) {
      if (t.phase === "POWERED_ASCENT") {
        plumeRef.current.visible = true;
        const flicker = 0.9 + Math.random() * 0.25;
        plumeRef.current.scale.set(flicker, flicker, flicker);
      } else {
        plumeRef.current.visible = false;
      }
    }

    // Parachute visibility
    if (parachuteRef.current) {
      if (t.phase === "DROGUE_DEPLOY" || t.phase === "MAIN_DEPLOY" || t.phase === "TERMINAL_DESCENT") {
        parachuteRef.current.visible = true;
      } else {
        parachuteRef.current.visible = false;
      }
    }
  }, [currentTelemetry]);

  return (
    <div
      className="relative w-full h-full min-h-[340px] flex flex-col rounded-xl overflow-hidden border border-slate-800 bg-slate-950/80 shadow-2xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3D WebGL Canvas Mount */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing flex-1" />

      {/* Aerospace Flight Replay HUD Overlay */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none z-10">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900/80 backdrop-blur border border-sky-500/30 text-sky-400 text-xs font-mono">
          <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "12s" }} />
          <span>ATTITUDE 3D GIMBAL</span>
          <span className="text-[10px] text-slate-400">P/Y/R 6-DOF</span>
        </div>

        {currentTelemetry && (
          <div className="px-2.5 py-1.5 rounded bg-slate-950/85 backdrop-blur border border-slate-800 text-[11px] font-mono space-y-0.5 text-slate-300">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">PITCH (θ):</span>
              <span className="text-emerald-400 font-semibold">{currentTelemetry.pitch.toFixed(1)}°</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">YAW (ψ):</span>
              <span className="text-sky-400 font-semibold">{currentTelemetry.yaw.toFixed(1)}°</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">ROLL (ϕ):</span>
              <span className="text-amber-400 font-semibold">{currentTelemetry.roll.toFixed(1)}°</span>
            </div>
            <div className="flex justify-between gap-4 pt-1 border-t border-slate-800">
              <span className="text-slate-500">ROLL RATE:</span>
              <span
                className={`font-semibold ${
                  Math.abs(currentTelemetry.rollRate) > 360 ? "text-rose-400 animate-pulse" : "text-slate-200"
                }`}
              >
                {currentTelemetry.rollRate.toFixed(1)}°/s
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Status Badges / Anomaly Alert */}
      {currentTelemetry?.isAnomaly && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-950/90 border border-rose-500/60 text-rose-300 text-xs font-mono font-semibold animate-pulse z-10 shadow-lg">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>ANOMALY FLIGHT WINDOW</span>
        </div>
      )}

      {/* Camera & Replay Viewport Controls */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-auto z-10">
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur p-1 rounded-lg border border-slate-800">
          <button
            id="btn-cam-chase"
            onClick={() => setCameraMode("CHASE")}
            className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-colors ${
              cameraMode === "CHASE"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Video className="w-3 h-3" />
            <span>Chase</span>
          </button>
          <button
            id="btn-cam-orbit"
            onClick={() => setCameraMode("ORBIT")}
            className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-colors ${
              cameraMode === "ORBIT"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <RotateCw className="w-3 h-3" />
            <span>Orbit</span>
          </button>
          <button
            id="btn-cam-pad"
            onClick={() => setCameraMode("PAD")}
            className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-colors ${
              cameraMode === "PAD"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Launchpad</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-950/80 px-2 py-1 rounded border border-slate-800">
          <Sparkles className="w-3 h-3 text-sky-400" />
          <span>Drag to orbit • Scroll to zoom</span>
        </div>
      </div>
    </div>
  );
};
