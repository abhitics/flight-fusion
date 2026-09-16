/**
 * Synthetic Fault & Validation Laboratory Modal
 * Interactive aerospace benchmarking workstation for injecting simulated faults and evaluating pipeline precision.
 */

import React, { useState } from "react";
import {
  BenchmarkMetrics,
  FaultInjectionConfig,
  SynchronizedTelemetryPoint,
} from "../types/telemetry";
import {
  DEFAULT_PRESET_SCENARIOS,
  runValidationBenchmark,
} from "../services/syntheticFaultLab";
import {
  FlaskConical,
  Play,
  CheckCircle2,
  AlertOctagon,
  Gauge,
  Clock,
  Zap,
  RotateCcw,
  X,
  Target,
  BarChart3,
} from "lucide-react";

interface SyntheticLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyToFlight: (points: SynchronizedTelemetryPoint[]) => void;
}

export const SyntheticLabModal: React.FC<SyntheticLabModalProps> = ({
  isOpen,
  onClose,
  onApplyToFlight,
}) => {
  const [scenarios, setScenarios] = useState<FaultInjectionConfig[]>(
    DEFAULT_PRESET_SCENARIOS
  );
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkMetrics | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [lastGeneratedPoints, setLastGeneratedPoints] = useState<SynchronizedTelemetryPoint[] | null>(null);

  if (!isOpen) return null;

  const handleRunBenchmark = () => {
    setIsRunning(true);
    setTimeout(() => {
      const { simulatedPoints, metrics } = runValidationBenchmark(scenarios);
      setBenchmarkResult(metrics);
      setLastGeneratedPoints(simulatedPoints);
      setIsRunning(false);
    }, 450);
  };

  const handleToggleScenario = (index: number) => {
    setScenarios((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApplyToWorkspace = () => {
    if (lastGeneratedPoints) {
      onApplyToFlight(lastGeneratedPoints);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/40">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Synthetic Fault & Validation Laboratory
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/60">
                  AEROSPACE BENCHMARK SUITE
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Inject controlled sensor faults, clock drifts, and structural resonance to test algorithm precision.
              </p>
            </div>
          </div>
          <button
            id="btn-close-synthetic-lab"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs font-sans">
          {/* Active Fault Scenarios List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-mono font-semibold uppercase tracking-wider text-[11px]">
                Configured Injected Fault Scenarios ({scenarios.length})
              </span>
              <button
                id="btn-reset-scenarios"
                onClick={() => setScenarios(DEFAULT_PRESET_SCENARIOS)}
                className="text-sky-400 hover:text-sky-300 flex items-center gap-1 font-mono text-[11px]"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Default Suite</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {scenarios.map((sc, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sky-300 text-xs">{sc.type}</span>
                      <span className="font-mono text-[10px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                        T+{sc.startT}s ({sc.durationSeconds}s)
                      </span>
                    </div>
                    <p className="text-slate-300 mt-1 text-[11px] leading-normal">{sc.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
                    <span>Channel: {sc.targetChannel}</span>
                    <button
                      onClick={() => handleToggleScenario(idx)}
                      className="text-rose-400 hover:text-rose-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Benchmark Execution Trigger */}
          <div className="flex justify-center py-1">
            <button
              id="btn-run-benchmark-test"
              onClick={handleRunBenchmark}
              disabled={isRunning}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isRunning ? "Simulating & Evaluating Telemetry..." : "Run Detection Benchmark Suite"}</span>
            </button>
          </div>

          {/* Benchmark Results Dashboard */}
          {benchmarkResult && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2 text-slate-200 font-mono font-semibold text-xs">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                <span>BENCHMARK VALIDATION SCORECARD</span>
              </div>

              {/* Top KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500">PRECISION</div>
                  <div className="text-lg font-bold text-emerald-400">{benchmarkResult.precision}%</div>
                  <div className="text-[10px] text-slate-400">Low false alarms</div>
                </div>
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500">RECALL</div>
                  <div className="text-lg font-bold text-sky-400">{benchmarkResult.recall}%</div>
                  <div className="text-[10px] text-slate-400">Faults captured</div>
                </div>
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500">F1 SCORE</div>
                  <div className="text-lg font-bold text-purple-400">{benchmarkResult.f1Score}%</div>
                  <div className="text-[10px] text-slate-400">Harmonic mean</div>
                </div>
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500">DETECTION LATENCY</div>
                  <div className="text-lg font-bold text-amber-400">{benchmarkResult.meanDetectionLatencyMs} ms</div>
                  <div className="text-[10px] text-slate-400">Mean time to flag</div>
                </div>
              </div>

              {/* Phase Specific Precision Table */}
              <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px] space-y-2">
                <div className="text-slate-300 font-semibold text-xs">Phase-Specific Detection Performance</div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-slate-400">
                  {Object.entries(benchmarkResult.phaseSpecificResults).slice(0, 5).map(([phase, res]: [string, any]) => (
                    <div key={phase} className="p-2 bg-slate-950/80 rounded border border-slate-800">
                      <div className="text-slate-500 text-[9px] truncate">{phase}</div>
                      <div className="text-emerald-400 font-bold">{res.precision}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            Ground-truth fault injection adheres to NASA/AIAA telemetry standards.
          </span>
          {lastGeneratedPoints && (
            <button
              id="btn-apply-lab-to-flight"
              onClick={handleApplyToWorkspace}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-mono text-xs font-bold transition-all shadow-md"
            >
              Apply Faulted Run to Mission Workspace
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
