/**
 * Aerospace Primary Flight Display (PFD) & Artificial Horizon HUD
 * Precision avionics flight instrument displaying real-time Pitch, Roll, Heading, and Gs.
 */

import React from "react";
import { SynchronizedTelemetryPoint } from "../types/telemetry";
import { Compass, Gauge, AlertOctagon } from "lucide-react";

interface ArtificialHorizonHUDProps {
  telemetry: SynchronizedTelemetryPoint | null;
}

export const ArtificialHorizonHUD: React.FC<ArtificialHorizonHUDProps> = ({
  telemetry,
}) => {
  if (!telemetry) return null;

  const pitch = telemetry.pitch ?? 90;
  const roll = telemetry.roll ?? 0;
  const rollRate = telemetry.rollRate ?? 0;
  const isHighRoll = Math.abs(rollRate) > 360;

  // Convert pitch relative to horizontal horizon (90 is vertical ascent)
  // Horizon offset: 0 deg pitch = horizon at center
  const horizonPitchOffset = (90 - pitch) * 2.2; // px per degree
  const rollDeg = roll % 360;

  return (
    <div className="flex flex-col bg-slate-950/90 border border-slate-800 rounded-xl p-3 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300 font-semibold">
          <Compass className="w-3.5 h-3.5 text-sky-400" />
          <span>PFD ATTITUDE HORIZON</span>
        </div>
        {isHighRoll && (
          <div className="flex items-center gap-1 text-[10px] font-mono text-rose-400 animate-pulse font-bold">
            <AlertOctagon className="w-3 h-3" />
            <span>ROLL WARNING</span>
          </div>
        )}
      </div>

      {/* Horizon Circular Reticle Screen */}
      <div className="relative w-full aspect-square max-w-[210px] mx-auto rounded-full overflow-hidden border-2 border-slate-700 bg-slate-900 shadow-inner flex items-center justify-center">
        {/* Dynamic Pitch & Roll Sphere Layer */}
        <div
          className="absolute inset-[-60px] transition-transform duration-75 ease-linear pointer-events-none"
          style={{
            transform: `rotate(${-rollDeg}deg) translateY(${horizonPitchOffset}px)`,
          }}
        >
          {/* Sky (Upper Cyan/Blue) */}
          <div className="w-full h-1/2 bg-gradient-to-b from-sky-900 to-sky-600 border-b border-white" />
          {/* Ground (Lower Earth/Brown/Dark) */}
          <div className="w-full h-1/2 bg-gradient-to-b from-amber-950 to-slate-950" />

          {/* Pitch Ladder Marks (-30, -20, -10, 0, 10, 20, 30, 45, 60, 90) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {[-60, -45, -30, -15, 0, 15, 30, 45, 60].map((deg) => (
              <div
                key={deg}
                className="absolute flex items-center justify-center"
                style={{ top: `calc(50% - ${deg * 2.2}px)` }}
              >
                <div className="w-10 h-0.5 bg-white/70" />
                <span className="text-[8px] font-mono text-white/90 px-1 font-bold">
                  {deg}°
                </span>
                <div className="w-10 h-0.5 bg-white/70" />
              </div>
            ))}
          </div>
        </div>

        {/* Fixed Aircraft Reticle / Crosshair Mask */}
        <div className="absolute z-10 flex items-center justify-center pointer-events-none">
          <div className="w-8 h-1 bg-amber-400 rounded shadow" />
          <div className="w-2.5 h-2.5 rounded-full border-2 border-amber-400 mx-1 bg-amber-400/20" />
          <div className="w-8 h-1 bg-amber-400 rounded shadow" />
        </div>

        {/* Outer Roll Pointer Mark */}
        <div
          className="absolute inset-2 border-t-4 border-amber-400 rounded-full pointer-events-none"
          style={{ transform: `rotate(${rollDeg}deg)` }}
        />
      </div>

      {/* Flight Dynamics Tapes Grid */}
      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
        <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
          <div className="text-slate-500 text-[10px]">MACH / VSI</div>
          <div className="text-sky-300 font-bold">M {telemetry.machNumber.toFixed(2)}</div>
          <div className="text-slate-400 text-[10px]">{telemetry.velocity > 0 ? "+" : ""}{telemetry.velocity.toFixed(0)} m/s</div>
        </div>

        <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
          <div className="text-slate-500 text-[10px]">G-FORCE / Q</div>
          <div className="text-amber-300 font-bold">{telemetry.acceleration.toFixed(1)} G</div>
          <div className="text-slate-400 text-[10px]">{telemetry.dynamicPressure.toFixed(1)} kPa</div>
        </div>
      </div>
    </div>
  );
};
