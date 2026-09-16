import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, PerspectiveCamera, Float, Stars, Grid } from "@react-three/drei";
import * as THREE from "three";
import { Rocket, Sparkles, Crosshair, Cpu, Radio, ShieldAlert } from "lucide-react";

/**
 * Procedural 3D Rocket Model - built with basic Three.js shapes
 * to represent a high-power student sounding rocket.
 */
function SyntheticRocket() {
  const rocketRef = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (rocketRef.current) {
      rocketRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group ref={rocketRef} position={[6, -4, -2]} scale={1.2}>
      {/* Engine Nozzle */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.4, 0.8, 32]} />
        <meshStandardMaterial color="#111" metalness={0.9} roughness={0.4} />
      </mesh>

      {/* Engine Glow & Exhaust */}
      <pointLight position={[0, -0.6, 0]} color="#fb923c" intensity={5} distance={15} decay={2} />
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.2, 0.5, 1.2, 16]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.5} />
      </mesh>

      {/* Lower Airframe (White) */}
      <mesh position={[0, 3.4, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 6, 32]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.4} roughness={0.3} />
      </mesh>

      {/* Crimson Fins */}
      {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((rot, idx) => (
        <group key={idx} rotation={[0, rot, 0]}>
          <mesh position={[0.7, 0.8, 0]}>
            <boxGeometry args={[1, 1.4, 0.04]} />
            <meshStandardMaterial color="#991b1b" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Roll Pattern / Strut (Black) */}
      <mesh position={[0, 5.4, 0]}>
        <cylinderGeometry args={[0.505, 0.505, 1, 32]} />
        <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.5} />
      </mesh>

      {/* Avionics Bay Ring (Illuminated Cyan) */}
      <mesh position={[0, 6.6, 0]}>
        <cylinderGeometry args={[0.51, 0.51, 0.25, 32]} />
        <meshStandardMaterial color="#0ea5e9" metalness={0.9} roughness={0.2} emissive="#0284c7" emissiveIntensity={0.8} />
      </mesh>

      {/* Upper Airframe (Carbon) */}
      <mesh position={[0, 7.8, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 2.2, 32]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.4} />
      </mesh>

      {/* Payload Access Panel */}
      <mesh position={[0.51, 7.8, 0]}>
        <boxGeometry args={[0.02, 1.2, 0.2]} />
        <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Nose Cone (Black) */}
      <mesh position={[0, 8.9 + 1.5, 0]}>
        <coneGeometry args={[0.5, 3, 32]} />
        <meshStandardMaterial color="#000" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

function AtmosphericEnvironment() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2, 14]} fov={45} />
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 10, 5]} intensity={2} color="#e0f2fe" />
      <directionalLight position={[-10, 5, -5]} intensity={0.5} color="#38bdf8" />
      <Stars radius={100} depth={50} count={4000} factor={4} saturation={0} fade speed={0.5} />
      
      {/* Launchpad / Ground Grid */}
      <Grid 
        position={[0, -4, 0]} 
        args={[60, 60]} 
        cellSize={1} 
        cellThickness={0.5} 
        cellColor="#1e293b" 
        sectionSize={5} 
        sectionThickness={1.5} 
        sectionColor="#334155" 
        fadeDistance={40} 
        fadeStrength={1.5} 
      />
      <fog attach="fog" args={["#05070B", 8, 45]} />
    </>
  );
}

const BOOT_SEQUENCE = [
  "Establishing secure workspace...",
  "Loading flight-data engine...",
  "Synchronizing telemetry channels...",
  "Preparing anomaly intelligence...",
  "Mission workspace ready."
];

export function HomePage({ onEnterDashboard }: { onEnterDashboard: () => void }) {
  const [isInitializing, setIsInitializing] = useState(false);
  const [bootStep, setBootStep] = useState(0);

  const handleStart = () => {
    setIsInitializing(true);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < BOOT_SEQUENCE.length) {
        setBootStep(step);
      } else {
        clearInterval(interval);
        setTimeout(() => {
          onEnterDashboard();
        }, 800);
      }
    }, 800);
  };

  return (
    <div className="relative w-full h-screen bg-[#05070B] overflow-hidden text-slate-200">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Canvas>
          <AtmosphericEnvironment />
          <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
            <SyntheticRocket />
          </Float>
        </Canvas>
      </div>

      {/* Main Content Overlay */}
      <AnimatePresence>
        {!isInitializing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 z-10 flex flex-col justify-center px-12 md:px-24"
          >
            {/* Top HUD */}
            <div className="absolute top-8 left-12 flex flex-col font-mono text-[10px] text-slate-500 tracking-widest gap-1">
              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> SYSTEM ONLINE</span>
              <span>DATA LINK STABLE</span>
            </div>
            <div className="absolute top-8 right-12 flex flex-col font-mono text-[10px] text-slate-500 tracking-widest gap-1 text-right">
              <span>MISSION PROFILE: HPR</span>
              <span>ENVIRONMENT: SYNTHETIC</span>
            </div>
            
            {/* Bottom HUD */}
            <div className="absolute bottom-8 left-12 font-mono text-[10px] text-slate-500 tracking-widest">
              <span>LIVE SIMULATION</span>
            </div>
            <div className="absolute bottom-8 right-12 font-mono text-[10px] text-slate-500 tracking-widest">
              <span>T-{new Date().getTime().toString().slice(-6)}</span>
            </div>

            {/* Hero Text */}
            <div className="max-w-xl">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="flex items-center gap-3 mb-6"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-sky-500/20 to-cyan-400/20 border border-sky-500/30 flex items-center justify-center backdrop-blur-md">
                  <Rocket className="w-5 h-5 text-sky-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-mono text-cyan-400 tracking-widest font-bold">FLIGHTFUSION</span>
                  <span className="text-[10px] font-mono text-slate-500 tracking-widest">AEROSPACE TELEMETRY INTELLIGENCE</span>
                </div>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.4 }}
                className="text-5xl md:text-7xl font-semibold tracking-tight text-white mb-6 leading-tight"
                style={{ textShadow: "0 4px 20px rgba(0,0,0,0.5)" }}
              >
                Understand <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-500">Every Flight.</span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.6 }}
                className="text-slate-400 text-lg md:text-xl font-light mb-12 max-w-lg leading-relaxed border-l-2 border-sky-500/30 pl-4 py-1"
              >
                Analyze, synchronize, replay, and investigate rocket flight data with physics-aware anomaly detection.
              </motion.p>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.8 }}
                onClick={handleStart}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative overflow-hidden flex items-center gap-3 px-8 py-4 bg-[#0B1118]/80 backdrop-blur-xl border border-sky-500/30 hover:border-sky-400/60 rounded-sm text-sky-100 font-mono text-sm tracking-wide transition-all shadow-[0_0_30px_rgba(14,165,233,0.1)] hover:shadow-[0_0_40px_rgba(14,165,233,0.2)]"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-sky-500/10 to-transparent -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
                <Crosshair className="w-4 h-4 text-sky-400 group-hover:animate-spin-slow" />
                <span>Enter Dashboard</span>
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-sky-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            </div>
            
            {/* Visual telemetry connections */}
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ duration: 2, delay: 1.5 }}
               className="hidden lg:block absolute right-[35%] top-1/3 pointer-events-none"
            >
               <div className="flex items-center gap-2 mb-20 animate-pulse">
                 <div className="w-[80px] h-[1px] bg-gradient-to-l from-sky-500/50 to-transparent" />
                 <span className="text-[10px] font-mono text-sky-400/80 bg-sky-950/30 px-2 py-0.5 border border-sky-500/20 backdrop-blur-sm">PAYLOAD [NOMINAL]</span>
               </div>
               <div className="flex items-center gap-2 mb-20 ml-8">
                 <div className="w-[120px] h-[1px] bg-gradient-to-l from-emerald-500/50 to-transparent" />
                 <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-950/30 px-2 py-0.5 border border-emerald-700/50 backdrop-blur-sm">AVIONICS [LOCKED]</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-[100px] h-[1px] bg-gradient-to-l from-slate-500/50 to-transparent" />
                 <span className="text-[10px] font-mono text-slate-400/80 bg-slate-900/30 px-2 py-0.5 border border-slate-700/50 backdrop-blur-sm">MOTOR SEC [PRIMED]</span>
               </div>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Initialization Overlay */}
      <AnimatePresence>
        {isInitializing && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-[#05070B]/80"
          >
            <div className="flex flex-col items-center max-w-sm w-full">
               <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                 className="relative w-24 h-24 mb-8 flex items-center justify-center"
               >
                 <svg viewBox="0 0 100 100" className="w-full h-full text-sky-500 opacity-20 absolute inset-0">
                    <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                 </svg>
                 <svg viewBox="0 0 100 100" className="w-full h-full text-sky-400 absolute inset-0 transform -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray={`${(bootStep / BOOT_SEQUENCE.length) * 250} 250`} className="transition-all duration-500 ease-out" />
                 </svg>
                 <Rocket className="w-6 h-6 text-sky-300" />
               </motion.div>

               <div className="w-full h-[1px] bg-slate-800 mb-6 relative">
                 <motion.div 
                   className="absolute top-0 left-0 h-full bg-cyan-400"
                   initial={{ width: "0%" }}
                   animate={{ width: `${(bootStep / BOOT_SEQUENCE.length) * 100}%` }}
                   transition={{ duration: 0.5 }}
                 />
                 {/* Scanning line */}
                 <motion.div 
                   className="absolute top-[-2px] w-1 h-[5px] bg-white shadow-[0_0_10px_white]"
                   animate={{ left: ["0%", "100%", "0%"] }}
                   transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                 />
               </div>

               <div className="h-8 flex items-center justify-center w-full">
                 <AnimatePresence mode="wait">
                   <motion.div
                     key={bootStep}
                     initial={{ opacity: 0, y: 5 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -5 }}
                     className="text-xs font-mono tracking-widest uppercase text-sky-200"
                   >
                     {BOOT_SEQUENCE[bootStep] || "Preparing..."}
                   </motion.div>
                 </AnimatePresence>
               </div>
               
               <div className="mt-8 font-mono text-[9px] text-slate-600 flex justify-between w-full">
                  <span>LAT: 32.9902 N</span>
                  <span>SYS: HPT-RX4</span>
                  <span>LNG: -106.9754 W</span>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
