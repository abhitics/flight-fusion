/**
 * Explainable AI Anomaly Investigation & Flight Dynamics Diagnostic Panel
 */

import React, { useState } from "react";
import {
  AnomalyEvent,
  FlightPhase,
  SynchronizedTelemetryPoint,
} from "../types/telemetry";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  BrainCircuit,
  HelpCircle,
  ExternalLink,
  Cpu,
  Flame,
  Wrench,
  Sparkles,
  RefreshCw,
  X,
} from "lucide-react";

interface ExplainableAnomalyDrawerProps {
  anomaly: AnomalyEvent | null;
  onClose: () => void;
  onJumpToTime: (t: number) => void;
  surroundingTelemetry?: SynchronizedTelemetryPoint[];
}

export const ExplainableAnomalyDrawer: React.FC<ExplainableAnomalyDrawerProps> = ({
  anomaly,
  onClose,
  onJumpToTime,
  surroundingTelemetry,
}) => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState<any>(anomaly?.aiDiagnostic || null);
  const [userConfirmed, setUserConfirmed] = useState(false);

  if (!anomaly) return null;

  const handleRunAiDiagnosis = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/ai/diagnose-anomaly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anomaly,
          missionPhase: anomaly.flightPhase,
          surroundingTelemetry: surroundingTelemetry?.slice(0, 10),
          vehicleProfile: { name: "Astraea-IV Sounding Rocket" },
        }),
      });
      const data = await res.json();
      setAiReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-slate-950/95 border-l border-slate-800 shadow-2xl backdrop-blur-xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-lg ${
              anomaly.severity === "CRITICAL"
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {anomaly.id}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-semibold border border-rose-800/60">
                {anomaly.severity}
              </span>
            </div>
            <h2 className="text-sm font-semibold text-slate-100 mt-0.5">{anomaly.title}</h2>
          </div>
        </div>

        <button
          id="btn-close-anomaly-drawer"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
        {/* Metric Overview Card */}
        <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800 font-mono">
          <div>
            <div className="text-[10px] text-slate-500">EVENT TIMESTAMP</div>
            <div className="text-sky-300 font-bold text-sm">
              T+{anomaly.timestamp.toFixed(2)}s
            </div>
            <div className="text-[10px] text-slate-400">{anomaly.durationSeconds}s duration</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500">CONFIDENCE SCORE</div>
            <div className="text-emerald-400 font-bold text-sm">{anomaly.confidence}%</div>
            <div className="text-[10px] text-slate-400">Risk: {anomaly.falsePositiveRisk}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500">FLIGHT PHASE</div>
            <div className="text-amber-400 font-bold text-sm">{anomaly.flightPhase}</div>
            <div className="text-[10px] text-slate-400">Contextual Rule</div>
          </div>
        </div>

        {/* Explainability Section: "Why Was This Flagged?" */}
        <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 space-y-2.5">
          <div className="flex items-center gap-1.5 text-slate-200 font-semibold text-xs">
            <BrainCircuit className="w-4 h-4 text-sky-400" />
            <span>EXPLAINABLE AI REASONING (Why was this flagged?)</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-xs">
            {anomaly.explainabilityRationale}
          </p>
        </div>

        {/* Supporting Quantitative Telemetry Evidence */}
        <div className="space-y-2">
          <div className="text-slate-400 font-semibold font-mono text-[11px] uppercase tracking-wider">
            Quantitative Telemetry Evidence
          </div>
          <div className="space-y-2">
            {anomaly.supportingEvidence.map((ev, idx) => (
              <div
                key={idx}
                className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 font-mono text-xs flex flex-col gap-1.5"
              >
                <div className="flex justify-between items-center">
                  <span className="text-slate-200 font-bold">{ev.channelName}</span>
                  <span className="text-rose-400 font-bold text-[11px]">
                    +{ev.deviationPercent}% DEVIATION
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400 bg-slate-950/70 p-2 rounded">
                  <div>
                    <span className="text-slate-500 block text-[9px]">MEASURED</span>
                    <span className="text-rose-300 font-bold">
                      {ev.measured} {ev.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">NOMINAL EXPECTED</span>
                    <span className="text-slate-300">
                      {ev.expected} {ev.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">CRITICAL LIMIT</span>
                    <span className="text-amber-400">
                      {ev.criticalThreshold} {ev.unit}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Physical Constraints Breached */}
        <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
          <div className="text-slate-300 font-semibold flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Aerospace Physical Constraints Violated</span>
          </div>
          <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
            {anomaly.physicalConstraintsViolated.map((con, idx) => (
              <li key={idx} className="leading-normal text-slate-300">
                {con}
              </li>
            ))}
          </ul>
        </div>

        {/* Recommended Actions & Engineering Corrective Steps */}
        <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
          <div className="text-slate-300 font-semibold flex items-center gap-1.5">
            <Wrench className="w-4 h-4 text-emerald-400" />
            <span>Recommended Engineering Corrective Actions</span>
          </div>
          <p className="text-slate-300 leading-relaxed">{anomaly.recommendedAction}</p>
        </div>

        {/* Gemini Aerospace Copilot Deep Diagnosis */}
        <div className="bg-gradient-to-br from-slate-900 to-sky-950/40 p-3.5 rounded-xl border border-sky-500/30 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sky-300 font-semibold">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>Gemini Aerospace Mission Specialist Copilot</span>
            </div>
            <button
              id="btn-run-ai-diagnostic"
              onClick={handleRunAiDiagnosis}
              disabled={isAiLoading}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-[11px] font-mono transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isAiLoading ? "animate-spin" : ""}`} />
              <span>{isAiLoading ? "Analyzing..." : "Deep Diagnostic"}</span>
            </button>
          </div>

          {aiReport ? (
            <div className="space-y-2 pt-1 font-mono text-[11px] text-slate-300">
              <div className="p-2.5 bg-slate-950/80 rounded border border-slate-800">
                <span className="text-slate-400 block text-[9px] uppercase font-bold text-sky-400">
                  Aerodynamic Assessment:
                </span>
                {aiReport.aerodynamicEvaluation}
              </div>
              <div className="p-2.5 bg-slate-950/80 rounded border border-slate-800">
                <span className="text-slate-400 block text-[9px] uppercase font-bold text-emerald-400">
                  Sensor Integrity Verdict:
                </span>
                {aiReport.sensorIntegrity}
              </div>
              <div className="p-2.5 bg-slate-950/80 rounded border border-slate-800">
                <span className="text-slate-400 block text-[9px] uppercase font-bold text-amber-400">
                  Physics Verification Law:
                </span>
                {aiReport.physicsVerification}
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-[11px]">
              Click "Deep Diagnostic" to synthesize multi-sensor telemetry with Google Gemini flight dynamics intelligence.
            </p>
          )}
        </div>
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between gap-2">
        <button
          id="btn-drawer-jump-replay"
          onClick={() => onJumpToTime(anomaly.timestamp)}
          className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 font-mono text-xs flex items-center gap-1.5 transition-colors"
        >
          <span>Jump Replay to T+{anomaly.timestamp.toFixed(2)}s</span>
        </button>

        <button
          id="btn-confirm-classification"
          onClick={() => setUserConfirmed(true)}
          className={`px-3 py-1.5 rounded-lg font-mono text-xs flex items-center gap-1.5 transition-colors ${
            userConfirmed
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              : "bg-slate-800 hover:bg-slate-700 text-slate-200"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{userConfirmed ? "Verified by Engineer" : "Confirm Anomaly"}</span>
        </button>
      </div>
    </div>
  );
};
