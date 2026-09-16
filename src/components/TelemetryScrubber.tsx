/**
 * Aerospace Telemetry Timeline Scrubber & Synchronized Mission Replay Controller
 */

import React, { useEffect, useState, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Flag,
  Gauge,
  Clock,
} from "lucide-react";
import {
  AnomalyEvent,
  DetectedEvent,
  FLIGHT_PHASE_INFO,
  FlightPhase,
  SynchronizedTelemetryPoint,
} from "../types/telemetry";

interface TelemetryScrubberProps {
  points: SynchronizedTelemetryPoint[];
  currentIndex: number;
  onIndexChange: (newIndex: number) => void;
  anomalies: AnomalyEvent[];
  events: DetectedEvent[];
  onSelectAnomaly?: (anomaly: AnomalyEvent) => void;
}

export const TelemetryScrubber: React.FC<TelemetryScrubberProps> = ({
  points,
  currentIndex,
  onIndexChange,
  anomalies,
  events,
  onSelectAnomaly,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const intervalRef = useRef<number | null>(null);

  const currentPoint = points[currentIndex] || points[0];
  const minTime = points[0]?.timeMaster ?? -15;
  const maxTime = points[points.length - 1]?.timeMaster ?? 280;
  const totalDuration = maxTime - minTime;

  // Playback Loop
  useEffect(() => {
    if (isPlaying) {
      const stepInterval = Math.max(16, 50 / playbackSpeed);
      intervalRef.current = window.setInterval(() => {
        onIndexChange((prev) => {
          const stepSize = Math.max(1, Math.round(playbackSpeed * 2));
          if (prev + stepSize >= points.length) {
            setIsPlaying(false);
            return points.length - 1;
          }
          return prev + stepSize;
        });
      }, stepInterval);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, playbackSpeed, points.length, onIndexChange]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    onIndexChange(val);
  };

  const jumpToTime = (t: number) => {
    const targetIdx = points.findIndex((p) => p.timeMaster >= t);
    if (targetIdx !== -1) {
      onIndexChange(targetIdx);
    }
  };

  const jumpToNextAnomaly = () => {
    const nextAnom = anomalies.find((a) => a.timestamp > (currentPoint?.timeMaster ?? 0));
    if (nextAnom) {
      jumpToTime(nextAnom.timestamp);
      if (onSelectAnomaly) onSelectAnomaly(nextAnom);
    } else if (anomalies.length > 0) {
      jumpToTime(anomalies[0].timestamp);
      if (onSelectAnomaly) onSelectAnomaly(anomalies[0]);
    }
  };

  // Format Mission Elapsed Time (MET) T- or T+
  const formatMET = (t: number) => {
    const sign = t >= 0 ? "+" : "-";
    const absT = Math.abs(t);
    const mins = Math.floor(absT / 60);
    const secs = (absT % 60).toFixed(2);
    return `T${sign}${mins.toString().padStart(2, "0")}:${secs.padStart(5, "0")}`;
  };

  return (
    <div className="w-full bg-slate-900/95 border border-slate-800 rounded-xl p-3.5 shadow-xl backdrop-blur flex flex-col gap-3">
      {/* Top Playback Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Play/Pause & Stepping */}
        <div className="flex items-center gap-1.5">
          <button
            id="btn-playback-reset"
            onClick={() => onIndexChange(0)}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Rewind to Pad Idle (T-15s)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            id="btn-playback-prev-step"
            onClick={() => onIndexChange(Math.max(0, currentIndex - 10))}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Step Back 0.1s"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            id="btn-playback-play-pause"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md ${
              isPlaying
                ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                : "bg-sky-500 hover:bg-sky-400 text-slate-950"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>REPLAY</span>
              </>
            )}
          </button>
          <button
            id="btn-playback-next-step"
            onClick={() => onIndexChange(Math.min(points.length - 1, currentIndex + 10))}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Step Forward 0.1s"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Speed Selectors */}
          <div className="flex items-center gap-1 ml-2 bg-slate-950/70 p-1 rounded-lg border border-slate-800">
            {[0.25, 0.5, 1, 2, 5].map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition-colors ${
                  playbackSpeed === speed
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Center: Mission Elapsed Time Readout & Current Phase */}
        <div className="flex items-center gap-3 bg-slate-950/80 px-3.5 py-1.5 rounded-lg border border-slate-800 font-mono">
          <div className="flex items-center gap-1.5 text-sky-400">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-bold tracking-wider">{formatMET(currentPoint?.timeMaster ?? 0)}</span>
          </div>

          <div className="h-3 w-px bg-slate-800" />

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase">PHASE:</span>
            <span
              className="text-xs px-2 py-0.5 rounded font-semibold"
              style={{
                backgroundColor: `${FLIGHT_PHASE_INFO[currentPoint?.phase || "PAD_IDLE"].bgHex}44`,
                color: FLIGHT_PHASE_INFO[currentPoint?.phase || "PAD_IDLE"].color,
                border: `1px solid ${FLIGHT_PHASE_INFO[currentPoint?.phase || "PAD_IDLE"].color}66`,
              }}
            >
              {FLIGHT_PHASE_INFO[currentPoint?.phase || "PAD_IDLE"].label}
            </span>
          </div>
        </div>

        {/* Anomaly Jump Shortcuts */}
        <div className="flex items-center gap-2">
          <button
            id="btn-jump-next-anomaly"
            onClick={jumpToNextAnomaly}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 transition-colors shadow-sm"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>JUMP TO ANOMALY</span>
            <span className="text-[10px] bg-rose-900 px-1.5 py-0.2 rounded text-rose-200 font-bold">
              {anomalies.length}
            </span>
          </button>
        </div>
      </div>

      {/* Synchronized Timeline Track with Flight Phase Colored Blocks */}
      <div className="relative w-full pt-1 pb-2">
        {/* Phase Color Bands along Scrubber Track */}
        <div className="relative w-full h-3.5 rounded bg-slate-950 border border-slate-800 overflow-hidden flex">
          {/* Phase bands based on standard trajectory */}
          <div
            className="h-full border-r border-slate-900"
            style={{ width: "5.3%", backgroundColor: FLIGHT_PHASE_INFO.PAD_IDLE.color + "44" }}
            title="Pad Idle (T-15s to T-0)"
          />
          <div
            className="h-full border-r border-slate-900"
            style={{ width: "15%", backgroundColor: FLIGHT_PHASE_INFO.POWERED_ASCENT.color + "55" }}
            title="Powered Ascent (T-0 to T+42s)"
          />
          <div
            className="h-full border-r border-slate-900"
            style={{ width: "24.2%", backgroundColor: FLIGHT_PHASE_INFO.COAST.color + "44" }}
            title="Coast to Apogee (T+42s to T+110s)"
          />
          <div
            className="h-full border-r border-slate-900"
            style={{ width: "26.4%", backgroundColor: FLIGHT_PHASE_INFO.DROGUE_DEPLOY.color + "44" }}
            title="Drogue Descent (T+110s to T+184s)"
          />
          <div
            className="h-full border-r border-slate-900"
            style={{ width: "25%", backgroundColor: FLIGHT_PHASE_INFO.MAIN_DEPLOY.color + "44" }}
            title="Main Chute Terminal Descent (T+184s to T+254s)"
          />
          <div
            className="h-full flex-1"
            style={{ backgroundColor: FLIGHT_PHASE_INFO.TOUCHDOWN.color + "44" }}
            title="Touchdown / Recovery"
          />

          {/* Anomaly Highlight Markers */}
          {anomalies.map((anom) => {
            const pct = Math.max(0, Math.min(100, ((anom.timestamp - minTime) / totalDuration) * 100));
            return (
              <div
                key={anom.id}
                onClick={(e) => {
                  e.stopPropagation();
                  jumpToTime(anom.timestamp);
                  if (onSelectAnomaly) onSelectAnomaly(anom);
                }}
                className="absolute top-0 bottom-0 w-2.5 bg-rose-500 cursor-pointer hover:scale-125 transition-transform z-10 border-x border-rose-300/80 shadow-md animate-pulse"
                style={{ left: `calc(${pct}% - 5px)` }}
                title={`Anomaly: ${anom.title} at T+${anom.timestamp}s`}
              />
            );
          })}

          {/* Milestone Event Flags */}
          {events.map((evt) => {
            const pct = Math.max(0, Math.min(100, ((evt.timeSeconds - minTime) / totalDuration) * 100));
            return (
              <div
                key={evt.id}
                onClick={() => jumpToTime(evt.timeSeconds)}
                className="absolute top-0 bottom-0 w-1 bg-sky-400/90 cursor-pointer hover:bg-white transition-colors z-5"
                style={{ left: `${pct}%` }}
                title={`${evt.name} (T+${evt.timeSeconds}s)`}
              />
            );
          })}
        </div>

        {/* Native Interactive Range Slider */}
        <input
          id="range-flight-timeline"
          type="range"
          min={0}
          max={points.length - 1}
          value={currentIndex}
          onChange={handleSliderChange}
          className="absolute inset-x-0 top-1 w-full h-3.5 opacity-0 cursor-pointer z-20"
        />

        {/* Current Playhead Indicator Needle */}
        <div
          className="absolute top-0 w-0.5 h-6 bg-cyan-400 pointer-events-none z-15 shadow-[0_0_8px_#22d3ee]"
          style={{
            left: `${((currentPoint?.timeMaster - minTime) / totalDuration) * 100}%`,
          }}
        >
          <div className="w-2.5 h-2.5 bg-cyan-300 rounded-full -ml-1 -mt-1 shadow-lg border border-slate-950" />
        </div>
      </div>

      {/* Bottom Timeline Milestones Bar */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
        <button onClick={() => jumpToTime(0)} className="hover:text-amber-400 transition-colors flex items-center gap-1">
          <Flag className="w-3 h-3 text-amber-400" />
          <span>T0 Liftoff (0.0s)</span>
        </button>
        <button onClick={() => jumpToTime(16.2)} className="hover:text-sky-400 transition-colors hidden sm:block">
          Max-Q (16.2s)
        </button>
        <button onClick={() => jumpToTime(42)} className="hover:text-yellow-400 transition-colors">
          MECO (42.0s)
        </button>
        <button onClick={() => jumpToTime(110)} className="hover:text-purple-400 transition-colors">
          Apogee (110.0s)
        </button>
        <button onClick={() => jumpToTime(184)} className="hover:text-emerald-400 transition-colors hidden sm:block">
          Main Chute (184s)
        </button>
        <button onClick={() => jumpToTime(maxTime)} className="hover:text-slate-200 transition-colors">
          Touchdown ({maxTime.toFixed(0)}s)
        </button>
      </div>
    </div>
  );
};
