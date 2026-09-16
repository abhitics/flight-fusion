/**
 * Multi-Flight Engineering Regression & Dynamics Comparison View
 * Normalizes and compares trajectories, phase durations, and stability envelopes across flights.
 */

import React, { useState } from "react";
import { SAMPLE_HISTORICAL_FLIGHTS } from "../services/multiFlightAnalysis";
import { FlightComparisonData } from "../types/telemetry";
import {
  Layers,
  ArrowUpRight,
  Gauge,
  Activity,
  CheckCircle2,
  TrendingUp,
  Sliders,
} from "lucide-react";

export const MultiFlightView: React.FC = () => {
  const [flights, setFlights] = useState<FlightComparisonData[]>(SAMPLE_HISTORICAL_FLIGHTS);
  const [selectedMetric, setSelectedMetric] = useState<"ALTITUDE" | "VELOCITY" | "ROLL_RATE">("ALTITUDE");

  const maxAlt = 45000;
  const maxVel = 1200;
  const maxRoll = 500;

  return (
    <div className="w-full flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800 backdrop-blur">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-slate-100 font-mono">
              MULTI-FLIGHT TELEMETRY REGRESSION & COMPARISON
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare vehicle aerodynamic modifications, firmware fixes, and envelope changes across suborbital launches.
          </p>
        </div>

        {/* Metric Selector Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 font-mono text-xs">
          <button
            id="btn-metric-alt"
            onClick={() => setSelectedMetric("ALTITUDE")}
            className={`px-3 py-1.5 rounded transition-colors ${
              selectedMetric === "ALTITUDE"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Altitude Trajectory
          </button>
          <button
            id="btn-metric-vel"
            onClick={() => setSelectedMetric("VELOCITY")}
            className={`px-3 py-1.5 rounded transition-colors ${
              selectedMetric === "VELOCITY"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Velocity Profile
          </button>
          <button
            id="btn-metric-roll"
            onClick={() => setSelectedMetric("ROLL_RATE")}
            className={`px-3 py-1.5 rounded transition-colors ${
              selectedMetric === "ROLL_RATE"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Roll Stability Envelope
          </button>
        </div>
      </div>

      {/* Comparison Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
        {flights.map((flight) => (
          <div
            key={flight.flightId}
            className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3"
            style={{ borderTop: `3px solid ${flight.color}` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block">{flight.date}</span>
                <span className="font-bold text-slate-200 text-sm">{flight.missionName}</span>
              </div>
              <span
                className="text-[10px] px-2 py-0.5 rounded font-bold"
                style={{ backgroundColor: `${flight.color}22`, color: flight.color }}
              >
                {flight.flightId}
              </span>
            </div>

            <div className="text-slate-400 text-[11px]">{flight.vehicle}</div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
              <div>
                <span className="text-slate-500 text-[9px] block">PEAK APOGEE</span>
                <span className="text-sky-300 font-bold">{flight.apogeeAltitudeM.toLocaleString()} m</span>
              </div>
              <div>
                <span className="text-slate-500 text-[9px] block">MAX VELOCITY</span>
                <span className="text-emerald-300 font-bold">{flight.maxVelocityMps} m/s</span>
              </div>
              <div>
                <span className="text-slate-500 text-[9px] block">MAX G-LOAD</span>
                <span className="text-amber-300 font-bold">{flight.maxGForce} G</span>
              </div>
              <div>
                <span className="text-slate-500 text-[9px] block">ANOMALIES</span>
                <span className={`font-bold ${flight.anomaliesCount === 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {flight.anomaliesCount} detected
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Normalized Overlay Trajectory Plot Canvas/SVG */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-300 font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            NORMALIZED TRAJECTORY OVERLAY (T+ 0 to 280 SECONDS)
          </span>

          <div className="flex items-center gap-4">
            {flights.map((f) => (
              <div key={f.flightId} className="flex items-center gap-1.5">
                <div className="w-3 h-1 rounded" style={{ backgroundColor: f.color }} />
                <span className="text-slate-300 text-[11px]">{f.missionName}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scalable Vector Graphic Plot for Pixel-Perfect Crosshair and Visual Overlay */}
        <div className="w-full h-64 bg-slate-900/60 rounded-lg p-2 relative overflow-hidden border border-slate-800">
          <svg className="w-full h-full" viewBox="0 0 1000 240" preserveAspectRatio="none">
            {/* Grid Lines */}
            {[0, 60, 120, 180, 240].map((y) => (
              <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="#1e293b" strokeWidth="1" />
            ))}
            {[0, 200, 400, 600, 800, 1000].map((x) => (
              <line key={x} x1={x} y1="0" x2={x} y2="240" stroke="#1e293b" strokeWidth="1" />
            ))}

            {/* Flight Curves */}
            {flights.map((flight) => {
              const pts = flight.points;
              if (!pts.length) return null;

              const maxVal =
                selectedMetric === "ALTITUDE"
                  ? maxAlt
                  : selectedMetric === "VELOCITY"
                  ? maxVel
                  : maxRoll;

              const pathD = pts
                .map((p, idx) => {
                  const x = (p.t / 282) * 1000;
                  const val =
                    selectedMetric === "ALTITUDE"
                      ? p.alt
                      : selectedMetric === "VELOCITY"
                      ? Math.max(0, p.vel)
                      : p.rollRate;
                  const y = 220 - (val / maxVal) * 200;
                  return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
                })
                .join(" ");

              return (
                <path
                  key={flight.flightId}
                  d={pathD}
                  fill="none"
                  stroke={flight.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              );
            })}
          </svg>

          {/* Y-Axis Label */}
          <div className="absolute top-2 left-3 font-mono text-[10px] text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
            {selectedMetric === "ALTITUDE" && "Altitude: 0 to 45,000 m"}
            {selectedMetric === "VELOCITY" && "Velocity: 0 to 1,200 m/s"}
            {selectedMetric === "ROLL_RATE" && "Roll Rate: 0 to 500 deg/s"}
          </div>
        </div>

        {/* Engineering Findings & Regression Verdict */}
        <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-xs font-mono space-y-1.5">
          <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>AERODYNAMIC REGRESSION CONCLUSION</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Comparing Flight 02 (unmodified fins, 4 anomalies, roll flutter at Mach 1.6) vs Flight 03 (carbon stiffener gussets):
            peak roll rate was successfully suppressed by 72% within nominal bounds, increasing suborbital apogee by +7,730 m (+22.6%) due to reduced induced drag.
          </p>
        </div>
      </div>
    </div>
  );
};
