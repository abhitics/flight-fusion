/**
 * High-Performance Multi-Channel Aerospace Telemetry Plotter
 * Uses canvas-accelerated rendering and adaptive downsampling for 100,000+ row datasets.
 */

import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  SynchronizedTelemetryPoint,
  AnomalyEvent,
  FLIGHT_PHASE_INFO,
} from "../types/telemetry";
import { Activity, Gauge, Zap, Wind, Layers } from "lucide-react";

interface MultiChannelChartProps {
  points: SynchronizedTelemetryPoint[];
  currentIndex: number;
  onSeek: (targetIndex: number) => void;
  anomalies: AnomalyEvent[];
}

type ChannelMode = "ALL" | "DYNAMICS" | "ATTITUDE_RATES" | "AVIONICS_ENV";

export const MultiChannelChart: React.FC<MultiChannelChartProps> = ({
  points,
  currentIndex,
  onSeek,
  anomalies,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeChannelMode, setActiveChannelMode] = useState<ChannelMode>("ALL");
  const [hoverTime, setHoverTime] = useState<number | null>(null);

  const currentPoint = points[currentIndex] || points[0];
  const minTime = points[0]?.timeMaster ?? -15;
  const maxTime = points[points.length - 1]?.timeMaster ?? 280;
  const totalDuration = maxTime - minTime;

  // Intelligent Downsampling for crisp 60fps rendering of 100k+ rows
  const downsampledPoints = useMemo(() => {
    if (points.length <= 1200) return points;
    const targetCount = 1200;
    const step = Math.ceil(points.length / targetCount);
    const result: SynchronizedTelemetryPoint[] = [];
    for (let i = 0; i < points.length; i += step) {
      result.push(points[i]);
    }
    // Always include the last point
    if (result[result.length - 1] !== points[points.length - 1]) {
      result.push(points[points.length - 1]);
    }
    return result;
  }, [points]);

  // Main Canvas Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = "#070b14";
    ctx.fillRect(0, 0, width, height);

    // Grid lines & time rulers
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    const gridCols = 12;
    for (let i = 0; i <= gridCols; i++) {
      const x = (i / gridCols) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Timestamp labels
      const timeVal = minTime + (i / gridCols) * totalDuration;
      ctx.fillStyle = "#475569";
      ctx.font = "10px monospace";
      ctx.fillText(`${timeVal.toFixed(0)}s`, x + 3, height - 6);
    }

    // Channel Layout Sub-Panels
    // Panel 1: Altitude & Velocity (Top 35%)
    // Panel 2: Acceleration & G-Load (Middle 30%)
    // Panel 3: Angular Rates & Attitude Flutter (Bottom 35%)
    const p1_Top = 15;
    const p1_Height = height * 0.32;
    const p2_Top = p1_Top + p1_Height + 15;
    const p2_Height = height * 0.28;
    const p3_Top = p2_Top + p2_Height + 15;
    const p3_Height = height - p3_Top - 25;

    // Horizontal division rules
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    [p1_Top + p1_Height, p2_Top + p2_Height].forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(0, y + 7);
      ctx.lineTo(width, y + 7);
      ctx.stroke();
    });

    // Draw Anomaly Shaded Bands
    anomalies.forEach((anom) => {
      const startX = ((anom.timestamp - minTime) / totalDuration) * width;
      const endX = ((anom.timestamp + anom.durationSeconds - minTime) / totalDuration) * width;
      const bandWidth = Math.max(14, endX - startX);

      ctx.fillStyle = "rgba(244, 63, 94, 0.14)";
      ctx.fillRect(startX, 0, bandWidth, height);

      ctx.strokeStyle = "rgba(244, 63, 94, 0.5)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      ctx.lineTo(startX, height);
      ctx.moveTo(startX + bandWidth, 0);
      ctx.lineTo(startX + bandWidth, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Anomaly Label Tag
      ctx.fillStyle = "#fb7185";
      ctx.font = "bold 9px monospace";
      ctx.fillText(`! ${anom.title.slice(0, 22)}`, startX + 3, p1_Top + 12);
    });

    // Max values for normalizations
    const maxAlt = 40000;
    const maxVel = 1200;
    const maxAccel = 18;
    const maxRollRate = 600;

    // Time to X pixel
    const timeToX = (t: number) => ((t - minTime) / totalDuration) * width;

    // --- PANEL 1: Altitude (Sky-400) and Velocity (Emerald-400) ---
    // Altitude Line
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < downsampledPoints.length; i++) {
      const p = downsampledPoints[i];
      const x = timeToX(p.timeMaster);
      const y = p1_Top + p1_Height - (Math.max(0, p.altitude) / maxAlt) * p1_Height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Velocity Line (Dashed Emerald)
    ctx.strokeStyle = "#34d399";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < downsampledPoints.length; i++) {
      const p = downsampledPoints[i];
      const x = timeToX(p.timeMaster);
      const y = p1_Top + p1_Height - (Math.max(0, p.velocity) / maxVel) * p1_Height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Panel 1 Legends
    ctx.fillStyle = "#38bdf8";
    ctx.font = "10px monospace";
    ctx.fillText("■ ALTITUDE (m MSL)", 10, p1_Top + 10);
    ctx.fillStyle = "#34d399";
    ctx.fillText("■ VELOCITY (m/s)", 140, p1_Top + 10);

    // --- PANEL 2: Acceleration (Amber-400) & Lateral Shock (Rose-400) ---
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i < downsampledPoints.length; i++) {
      const p = downsampledPoints[i];
      const x = timeToX(p.timeMaster);
      const y = p2_Top + p2_Height - (Math.max(0, p.acceleration) / maxAccel) * p2_Height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Lateral G (accelX)
    ctx.strokeStyle = "#f43f5e";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < downsampledPoints.length; i++) {
      const p = downsampledPoints[i];
      const x = timeToX(p.timeMaster);
      const latG = Math.abs(p.accelX) / 9.80665;
      const y = p2_Top + p2_Height - (latG / maxAccel) * p2_Height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Panel 2 Legends
    ctx.fillStyle = "#f59e0b";
    ctx.fillText("■ TOTAL ACCELERATION (G)", 10, p2_Top + 10);
    ctx.fillStyle = "#f43f5e";
    ctx.fillText("■ LATERAL STRUCTURAL G", 180, p2_Top + 10);

    // --- PANEL 3: Angular Rates - Roll Rate & Pitch Rate ---
    // Roll rate line
    ctx.strokeStyle = "#c084fc";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i < downsampledPoints.length; i++) {
      const p = downsampledPoints[i];
      const x = timeToX(p.timeMaster);
      const y = p3_Top + p3_Height - (Math.abs(p.rollRate) / maxRollRate) * p3_Height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Aero Roll Stability Envelope Boundary (360 deg/s)
    const envelopeY = p3_Top + p3_Height - (360 / maxRollRate) * p3_Height;
    ctx.strokeStyle = "rgba(244, 63, 94, 0.4)";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, envelopeY);
    ctx.lineTo(width, envelopeY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(244, 63, 94, 0.7)";
    ctx.fillText("CRITICAL ENVELOPE: 360°/s MAX", width - 180, envelopeY - 3);

    // Panel 3 Legends
    ctx.fillStyle = "#c084fc";
    ctx.fillText("■ ROLL RATE (deg/s)", 10, p3_Top + 10);

    // Synchronized Crosshair Playhead
    if (currentPoint) {
      const playheadX = timeToX(currentPoint.timeMaster);

      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "#06b6d4";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Crosshair dots on active curves
      const dotAltY = p1_Top + p1_Height - (Math.max(0, currentPoint.altitude) / maxAlt) * p1_Height;
      const dotAccelY = p2_Top + p2_Height - (Math.max(0, currentPoint.acceleration) / maxAccel) * p2_Height;
      const dotRollY = p3_Top + p3_Height - (Math.abs(currentPoint.rollRate) / maxRollRate) * p3_Height;

      [dotAltY, dotAccelY, dotRollY].forEach((y) => {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(playheadX, y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#0284c7";
        ctx.stroke();
      });
    }

    // Hover tooltip indicator
    if (hoverTime !== null) {
      const hoverX = timeToX(hoverTime);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(hoverX, 0);
      ctx.lineTo(hoverX, height);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [downsampledPoints, currentPoint, anomalies, minTime, totalDuration, hoverTime]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const targetTime = minTime + ratio * totalDuration;

    const targetIdx = points.findIndex((p) => p.timeMaster >= targetTime);
    if (targetIdx !== -1) {
      onSeek(targetIdx);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    setHoverTime(minTime + ratio * totalDuration);
  };

  return (
    <div
      ref={containerRef}
      className="w-full flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl"
    >
      {/* Telemetry Channels Sub-Header */}
      <div className="flex flex-wrap items-center justify-between px-3.5 py-2 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-mono font-semibold text-slate-200">
            MULTIVARIATE TELEMETRY ENGINE
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 border border-sky-800/60 text-sky-300">
            {points.length.toLocaleString()} Synchronized Rows
          </span>
        </div>

        {/* Live Channel Readout Pill */}
        {currentPoint && (
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">ALT:</span>
              <span className="text-sky-300 font-bold">{currentPoint.altitude.toLocaleString()} m</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">VEL:</span>
              <span className="text-emerald-300 font-bold">{currentPoint.velocity.toFixed(0)} m/s</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">ACCEL:</span>
              <span className="text-amber-300 font-bold">{currentPoint.acceleration.toFixed(1)} G</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">ROLL:</span>
              <span
                className={`font-bold ${
                  Math.abs(currentPoint.rollRate) > 360 ? "text-rose-400" : "text-purple-300"
                }`}
              >
                {currentPoint.rollRate.toFixed(1)}°/s
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Accelerometer & Altimeter Interactive Canvas */}
      <div className="relative w-full h-[280px] cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={1000}
          height={280}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverTime(null)}
          className="w-full h-full block"
        />

        {/* Floating Hover Indicator Tooltip */}
        {hoverTime !== null && (
          <div className="absolute top-2 right-3 pointer-events-none bg-slate-900/90 border border-slate-700 px-2 py-1 rounded text-[11px] font-mono text-slate-300 backdrop-blur">
            Hover: T{hoverTime >= 0 ? "+" : ""}{hoverTime.toFixed(2)}s (Click to seek)
          </div>
        )}
      </div>
    </div>
  );
};
