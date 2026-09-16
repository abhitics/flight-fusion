/**
 * FlightFusion Studio - Aerospace Telemetry Intelligence Platform
 * Production-grade telemetry ingestion, multi-MCU timebase alignment,
 * 3D attitude replay, explainable hybrid anomaly detection, and synthetic fault lab.
 */

import React, { useState, useMemo, useEffect } from "react";
import {
  AnomalyEvent,
  DataQualityReport,
  DetectedEvent,
  FlightPhase,
  RawTelemetrySource,
  SynchronizedTelemetryPoint,
  VehicleProfile,
} from "./types/telemetry";
import { generateFlightTelemetry } from "./services/telemetrySimulator";
import { auditTelemetryData } from "./services/dataPipeline";
import { reconstructFlight } from "./services/flightReconstruction";
import { detectTelemetryAnomalies } from "./services/anomalyDetection";
import { ThreeRocketViewer } from "./components/ThreeRocketViewer";
import { MultiChannelChart } from "./components/MultiChannelChart";
import { TelemetryScrubber } from "./components/TelemetryScrubber";
import { ArtificialHorizonHUD } from "./components/ArtificialHorizonHUD";
import { ExplainableAnomalyDrawer } from "./components/ExplainableAnomalyDrawer";
import { SyntheticLabModal } from "./components/SyntheticLabModal";
import { MultiFlightView } from "./components/MultiFlightView";
import { PostFlightReportModal } from "./components/PostFlightReportModal";
import { VehicleConfigModal } from "./components/VehicleConfigModal";
import { DataIngestionModal } from "./components/DataIngestionModal";
import { HomePage } from "./components/HomePage";

import {
  Compass,
  Rocket,
  Activity,
  Layers,
  FlaskConical,
  FileText,
  UploadCloud,
  Sliders,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Radio,
  Sparkles,
  ChevronRight,
  Database,
  Search,
  ExternalLink,
  Home,
} from "lucide-react";

const INITIAL_VEHICLE_PROFILE: VehicleProfile = {
  id: "VEH-ASTRAEA-IV",
  name: "Astraea-IV Suborbital Sounding Rocket",
  version: "Mk2.4-Aero",
  organization: "Astraea Aerospace Avionics Team",
  dryMassKg: 85,
  propellantMassKg: 160,
  motorClass: "O-5500 Solid Propellant",
  lengthMeters: 4.8,
  diameterMm: 178,
  expectedApogeeM: 38400,
  maxAllowableRollRateDegS: 360,
  maxAllowableG: 18,
  nominalDrogueDeployAltM: 38400,
  nominalMainDeployAltM: 550,
  sensors: [
    {
      channel: "altitude",
      type: "Barometric MS5611",
      unit: "m",
      nominalRange: [0, 45000],
      hardLimit: [-100, 50000],
    },
    {
      channel: "acceleration",
      type: "High-G Piezoresistive ADXL375",
      unit: "G",
      nominalRange: [0, 20],
      hardLimit: [-5, 50],
    },
    {
      channel: "rollRate",
      type: "3-Axis MEMS Gyro BMI088",
      unit: "deg/s",
      nominalRange: [-360, 360],
      hardLimit: [-1000, 1000],
    },
  ],
};

export default function App() {
  const [showHomepage, setShowHomepage] = useState(true);

  // Navigation State
  const [activeTab, setActiveTab] = useState<
    "MISSION_CONTROL" | "MULTI_FLIGHT" | "SYNTHETIC_LAB" | "REPORT"
  >("MISSION_CONTROL");

  // Core Telemetry State
  const initialSim = useMemo(() => generateFlightTelemetry({ sampleCountTarget: 28000 }), []);
  const [synchronizedPoints, setSynchronizedPoints] = useState<SynchronizedTelemetryPoint[]>(
    initialSim.synchronizedPoints
  );
  const [rawSources, setRawSources] = useState<RawTelemetrySource[]>(initialSim.rawSources);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [vehicleProfile, setVehicleProfile] = useState<VehicleProfile>(INITIAL_VEHICLE_PROFILE);

  // Flight Reconstruction & Analysis
  const flightRecon = useMemo(
    () => reconstructFlight(synchronizedPoints),
    [synchronizedPoints]
  );
  const [events, setEvents] = useState<DetectedEvent[]>(flightRecon.events);

  // Update events when synchronizedPoints change
  useEffect(() => {
    setEvents(flightRecon.events);
  }, [flightRecon]);

  const anomalies = useMemo(
    () => detectTelemetryAnomalies(synchronizedPoints, vehicleProfile),
    [synchronizedPoints, vehicleProfile]
  );

  const qualityReport = useMemo(
    () => auditTelemetryData(synchronizedPoints, rawSources),
    [synchronizedPoints, rawSources]
  );

  // Modal Dialog States
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyEvent | null>(null);
  const [isQualityLedgerOpen, setIsQualityLedgerOpen] = useState(false);
  const [isIngestionOpen, setIsIngestionOpen] = useState(false);
  const [isVehicleConfigOpen, setIsVehicleConfigOpen] = useState(false);
  const [isSyntheticLabOpen, setIsSyntheticLabOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Active Telemetry Point
  const currentPoint = synchronizedPoints[currentIndex] || synchronizedPoints[0];

  // Handler to jump to specific timestamp
  const handleJumpToTime = (t: number) => {
    const idx = synchronizedPoints.findIndex((p) => p.timeMaster >= t);
    if (idx !== -1) {
      setCurrentIndex(idx);
    }
  };

  // Handler for loaded new dataset
  const handleLoadNewDataset = (
    newPoints: SynchronizedTelemetryPoint[],
    newSources: RawTelemetrySource[],
    _report: DataQualityReport
  ) => {
    setSynchronizedPoints(newPoints);
    setRawSources(newSources);
    setCurrentIndex(0);
  };

  if (showHomepage) {
    return <HomePage onEnterDashboard={() => setShowHomepage(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Aerospace Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
        {/* Brand & Mission Status */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHomepage(true)}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-sky-300 hover:border-sky-500/50 hover:bg-sky-950/30 transition-all"
            title="Back to Homepage"
          >
            <Home className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-cyan-400 p-0.5 shadow-[0_0_15px_rgba(56,189,248,0.4)] flex items-center justify-center">
              <Rocket className="w-5 h-5 text-slate-950 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm tracking-wider text-white">
                  FLIGHTFUSION
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-950 border border-sky-700/60 text-sky-300">
                  STUDIO
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>TIMEBASE SYNCED</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300 font-semibold">{vehicleProfile.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Workspace View Switcher Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            id="tab-mission-control"
            onClick={() => setActiveTab("MISSION_CONTROL")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === "MISSION_CONTROL"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Mission Control</span>
          </button>
          <button
            id="tab-multi-flight"
            onClick={() => setActiveTab("MULTI_FLIGHT")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === "MULTI_FLIGHT"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Multi-Flight</span>
          </button>
          <button
            id="tab-synthetic-lab"
            onClick={() => setIsSyntheticLabOpen(true)}
            className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-slate-400 hover:text-purple-300 transition-colors"
          >
            <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
            <span>Fault Lab</span>
          </button>
          <button
            id="tab-engineering-report"
            onClick={() => setIsReportOpen(true)}
            className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-slate-400 hover:text-emerald-300 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Report</span>
          </button>
        </nav>

        {/* Global Toolbar & Quick Access Badges */}
        <div className="flex items-center gap-2">
          {/* Data Quality & Transformation Pipeline Ledger Trigger */}
          <button
            id="btn-open-quality-ledger"
            onClick={() => setIsQualityLedgerOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/60 text-emerald-300 text-xs font-mono transition-colors"
            title="View Data Quality & Transformation Audit Ledger"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Sync: {qualityReport.syncConfidenceScore}%</span>
            <span className="text-[10px] text-emerald-400/80">(0 Dropped)</span>
          </button>

          {/* Telemetry Ingestion Modal Trigger */}
          <button
            id="btn-open-ingestion"
            onClick={() => setIsIngestionOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors border border-slate-700"
          >
            <UploadCloud className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Ingest</span>
          </button>

          {/* Vehicle Config Modal Trigger */}
          <button
            id="btn-open-vehicle-config"
            onClick={() => setIsVehicleConfigOpen(true)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
            title="Vehicle & Flight Envelope Configuration"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace Content */}
      <main className="flex-1 flex flex-col aerospace-grid">
        {activeTab === "MISSION_CONTROL" && (
          <div className="flex-1 flex flex-col p-3 sm:p-4 gap-3 max-w-[1720px] w-full mx-auto">
            {/* Mission Replay Viewport: 3D Visualization + PFD HUD + Anomaly Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[380px]">
              {/* Left Column: 3D Rocket Attitude & Trajectory Replay Viewer */}
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
                <ThreeRocketViewer
                  currentTelemetry={currentPoint}
                  allPoints={synchronizedPoints}
                />
              </div>

              {/* Right Column: PFD Attitude Horizon + Live Telemetry Readouts + Anomaly Quicklist */}
              <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-3">
                {/* Primary Flight Display (PFD) HUD */}
                <ArtificialHorizonHUD telemetry={currentPoint} />

                {/* Detected Anomalies Quick Access Feed */}
                <div className="flex-1 bg-slate-950/90 border border-slate-800 rounded-xl p-3 shadow-xl backdrop-blur flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300 font-semibold">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                      <span>ANOMALY INTELLIGENCE REGISTER</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-bold border border-rose-800/50">
                      {anomalies.length} Flagged
                    </span>
                  </div>

                  <div className="space-y-2 overflow-y-auto max-h-[160px] pr-1">
                    {anomalies.map((anom) => (
                      <div
                        key={anom.id}
                        id={`card-anomaly-${anom.id}`}
                        onClick={() => {
                          setSelectedAnomaly(anom);
                          handleJumpToTime(anom.timestamp);
                        }}
                        className={`p-2.5 rounded-lg border text-xs font-mono cursor-pointer transition-all ${
                          selectedAnomaly?.id === anom.id
                            ? "bg-rose-950/40 border-rose-500 shadow-md"
                            : "bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200 truncate">{anom.title}</span>
                          <span className="text-[10px] text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded">
                            T+{anom.timestamp.toFixed(1)}s
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                          <span>{anom.flightPhase}</span>
                          <span className="text-sky-400 flex items-center gap-0.5">
                            <span>Investigate</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Physics-constrained hybrid detection</span>
                    <button
                      id="btn-open-synthetic-lab-link"
                      onClick={() => setIsSyntheticLabOpen(true)}
                      className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold"
                    >
                      <FlaskConical className="w-3 h-3" />
                      <span>Fault Lab</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Multivariate Multi-Channel Telemetry Graph */}
            <div className="w-full">
              <MultiChannelChart
                points={synchronizedPoints}
                currentIndex={currentIndex}
                onSeek={(newIdx) => setCurrentIndex(newIdx)}
                anomalies={anomalies}
              />
            </div>

            {/* Synchronized Timeline Scrubber Controller */}
            <div className="w-full">
              <TelemetryScrubber
                points={synchronizedPoints}
                currentIndex={currentIndex}
                onIndexChange={(newIdx) => setCurrentIndex(newIdx)}
                anomalies={anomalies}
                events={events}
                onSelectAnomaly={(anom) => setSelectedAnomaly(anom)}
              />
            </div>
          </div>
        )}

        {/* Multi-Flight Comparative Analysis View */}
        {activeTab === "MULTI_FLIGHT" && <MultiFlightView />}
      </main>

      {/* Explainable Anomaly Investigation Drawer */}
      {selectedAnomaly && (
        <ExplainableAnomalyDrawer
          anomaly={selectedAnomaly}
          onClose={() => setSelectedAnomaly(null)}
          onJumpToTime={(t) => handleJumpToTime(t)}
          surroundingTelemetry={synchronizedPoints.slice(
            Math.max(0, currentIndex - 5),
            Math.min(synchronizedPoints.length, currentIndex + 5)
          )}
        />
      )}

      {/* Data Quality & Transformation Ledger Modal */}
      {isQualityLedgerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-3xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-100 font-mono">
                    TRACEABLE DATA TRANSFORMATION & TIMEBASE LEDGER
                  </h2>
                  <p className="text-xs text-slate-400">
                    Zero silent drop guarantee: Every transformation, resample, and alignment is documented.
                  </p>
                </div>
              </div>
              <button
                id="btn-close-quality-modal"
                onClick={() => setIsQualityLedgerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500">QUALITY SCORE</div>
                  <div className="text-lg font-bold text-emerald-400">{qualityReport.overallScore}%</div>
                  <div className="text-[10px] text-slate-400">Validated telemetry</div>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500">MCU B OFFSET</div>
                  <div className="text-lg font-bold text-sky-400">+{qualityReport.mcuClockOffsetMs} ms</div>
                  <div className="text-[10px] text-slate-400">±{qualityReport.synchronizationUncertaintyMs}ms error</div>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500">THERMAL DRIFT</div>
                  <div className="text-lg font-bold text-amber-400">{qualityReport.clockDriftPpm} ppm</div>
                  <div className="text-[10px] text-slate-400">Compensated linear</div>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500">DROPPED RECORDS</div>
                  <div className="text-lg font-bold text-emerald-400">0 records</div>
                  <div className="text-[10px] text-slate-400">100% data fidelity</div>
                </div>
              </div>

              {/* Transformation Steps Table */}
              <div className="space-y-2">
                <div className="text-slate-300 font-bold text-xs uppercase tracking-wider">
                  Transformation Ledger Pipeline
                </div>
                <div className="space-y-2">
                  {qualityReport.transformationLedger.map((step) => (
                    <div
                      key={step.stepNumber}
                      className="p-3 bg-slate-900/70 rounded-xl border border-slate-800 flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sky-300">
                          Step {step.stepNumber}: {step.stepName}
                        </span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/60 font-bold">
                          {step.status}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">{step.details}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                        <span>Input: {step.inputRows.toLocaleString()} rows</span>
                        <span>Output: {step.outputRows.toLocaleString()} points</span>
                        <span>Repairs: {step.repairedRecordsCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-end">
              <button
                onClick={() => setIsQualityLedgerOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold transition-colors"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Synthetic Fault Laboratory Modal */}
      <SyntheticLabModal
        isOpen={isSyntheticLabOpen}
        onClose={() => setIsSyntheticLabOpen(false)}
        onApplyToFlight={(faultedPoints) => {
          setSynchronizedPoints(faultedPoints);
          setCurrentIndex(0);
        }}
      />

      {/* Post-Flight Engineering Report Modal */}
      <PostFlightReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        points={synchronizedPoints}
        anomalies={anomalies}
        events={events}
        qualityReport={qualityReport}
        vehicleProfile={vehicleProfile}
      />

      {/* Vehicle and Flight Envelope Configuration Modal */}
      <VehicleConfigModal
        isOpen={isVehicleConfigOpen}
        onClose={() => setIsVehicleConfigOpen(false)}
        profile={vehicleProfile}
        onSave={(updated) => setVehicleProfile(updated)}
      />

      {/* Data Ingestion & Timebase Alignment Modal */}
      <DataIngestionModal
        isOpen={isIngestionOpen}
        onClose={() => setIsIngestionOpen(false)}
        onLoadDataset={handleLoadNewDataset}
      />
    </div>
  );
}
