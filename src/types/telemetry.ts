/**
 * Aerospace Telemetry Intelligence Platform Types
 */

export type FlightPhase =
  | "PAD_IDLE"
  | "POWERED_ASCENT"
  | "BURNOUT"
  | "COAST"
  | "APOGEE"
  | "DROGUE_DEPLOY"
  | "MAIN_DEPLOY"
  | "TERMINAL_DESCENT"
  | "TOUCHDOWN";

export interface FlightPhaseMeta {
  phase: FlightPhase;
  label: string;
  shortLabel: string;
  color: string;
  bgHex: string;
  nominalDurationRange: [number, number]; // [minSec, maxSec]
}

export const FLIGHT_PHASE_INFO: Record<FlightPhase, FlightPhaseMeta> = {
  PAD_IDLE: {
    phase: "PAD_IDLE",
    label: "Pad Idle / Pre-Launch",
    shortLabel: "PAD IDLE",
    color: "#94a3b8", // slate-400
    bgHex: "#334155",
    nominalDurationRange: [5, 30],
  },
  POWERED_ASCENT: {
    phase: "POWERED_ASCENT",
    label: "Powered Ascent (Boost)",
    shortLabel: "BOOST",
    color: "#f97316", // orange-500
    bgHex: "#c2410c",
    nominalDurationRange: [20, 60],
  },
  BURNOUT: {
    phase: "BURNOUT",
    label: "Main Engine Cutoff (MECO)",
    shortLabel: "MECO",
    color: "#eab308", // yellow-500
    bgHex: "#a16207",
    nominalDurationRange: [1, 5],
  },
  COAST: {
    phase: "COAST",
    label: "Unpowered Coast",
    shortLabel: "COAST",
    color: "#38bdf8", // sky-400
    bgHex: "#0284c7",
    nominalDurationRange: [30, 90],
  },
  APOGEE: {
    phase: "APOGEE",
    label: "Apogee Event",
    shortLabel: "APOGEE",
    color: "#a855f7", // purple-500
    bgHex: "#7e22ce",
    nominalDurationRange: [2, 8],
  },
  DROGUE_DEPLOY: {
    phase: "DROGUE_DEPLOY",
    label: "Drogue Parachute Deploy",
    shortLabel: "DROGUE",
    color: "#06b6d4", // cyan-500
    bgHex: "#0891b2",
    nominalDurationRange: [10, 80],
  },
  MAIN_DEPLOY: {
    phase: "MAIN_DEPLOY",
    label: "Main Parachute Deploy",
    shortLabel: "MAIN",
    color: "#10b981", // emerald-500
    bgHex: "#059669",
    nominalDurationRange: [20, 100],
  },
  TERMINAL_DESCENT: {
    phase: "TERMINAL_DESCENT",
    label: "Terminal Descent",
    shortLabel: "DESCENT",
    color: "#34d399", // emerald-400
    bgHex: "#047857",
    nominalDurationRange: [30, 200],
  },
  TOUCHDOWN: {
    phase: "TOUCHDOWN",
    label: "Touchdown & Recovery",
    shortLabel: "LANDED",
    color: "#64748b", // slate-500
    bgHex: "#475569",
    nominalDurationRange: [0, 999],
  },
};

export interface RawTelemetrySource {
  id: string;
  name: string;
  sourceType: "AVIONICS_PRIMARY" | "IMU_HIGH_RATE" | "GROUND_STATION_RF";
  samplingRateHz: number;
  totalRecords: number;
  timeRange: [number, number]; // [rawMinMs, rawMaxMs]
  estimatedClockOffsetMs: number;
  estimatedClockDriftPpm: number;
  dataQualityScore: number;
  issues: string[];
}

export interface SynchronizedTelemetryPoint {
  timeMaster: number; // Synchronized Mission Elapsed Time (seconds relative to T0)
  rawTimePrimary: number; // ms
  rawTimeSecondary?: number; // ms
  
  // Navigation & Dynamics
  altitude: number; // Barometric altitude (m)
  altitudeFused: number; // Kalman / state-estimate altitude (m)
  velocity: number; // Vertical velocity (m/s)
  machNumber: number;
  dynamicPressure: number; // kPa (q = 0.5 * rho * v^2)
  
  // 3-Axis Acceleration
  acceleration: number; // Total resultant Gs or m/s²
  accelX: number; // Lateral X (m/s²)
  accelY: number; // Lateral Y (m/s²)
  accelZ: number; // Axial Z (thrust axis, m/s²)
  
  // 3-Axis Angular Rates (deg/s)
  rollRate: number; // deg/s
  pitchRate: number; // deg/s
  yawRate: number; // deg/s
  
  // Attitude Orientation (deg)
  pitch: number; // deg (-90 to +90)
  yaw: number; // deg (-180 to +180)
  roll: number; // deg (0 to 360 continuous)
  
  // Atmospheric & Environmental
  pressure: number; // Static pressure (hPa / mbar)
  temperature: number; // deg C
  
  // Avionics Status
  batteryVoltage: number; // Volts
  rssi: number; // dBm
  pyroContinuity: boolean;
  
  // Mission Context
  phase: FlightPhase;
  isAnomaly: boolean;
  anomalyIds?: string[];
}

export type AnomalySeverity = "CRITICAL" | "WARNING" | "WATCH";

export type AnomalyCategory =
  | "AERODYNAMIC_INSTABILITY"
  | "SENSOR_FAULT"
  | "ATTITUDE_ANOMALY"
  | "TIMING_DRIFT"
  | "STRUCTURAL_VIBRATION"
  | "DEPLOYMENT_ANOMALY"
  | "PROPULSION_ANOMALY";

export interface AnomalyEvidence {
  channel: string;
  channelName: string;
  measured: number;
  expected: number;
  deviationPercent: number;
  unit: string;
  criticalThreshold: number;
}

export interface AnomalyEvent {
  id: string;
  timestamp: number; // Mission seconds T+
  durationSeconds: number;
  flightPhase: FlightPhase;
  title: string;
  category: AnomalyCategory;
  severity: AnomalySeverity;
  affectedChannels: string[];
  anomalyScore: number; // 0 - 100
  confidence: number; // 0 - 100
  supportingEvidence: AnomalyEvidence[];
  physicalConstraintsViolated: string[];
  explainabilityRationale: string;
  suspectedRootCause: string;
  recommendedAction: string;
  falsePositiveRisk: "LOW" | "MODERATE" | "NEGLIGIBLE";
  aiDiagnostic?: {
    summary: string;
    aerodynamicEvaluation: string;
    sensorIntegrity: string;
    aerospaceRecommendation: string;
    physicsVerification: string;
  };
}

export interface DetectedEvent {
  id: string;
  timeSeconds: number;
  name: string;
  flightPhase: FlightPhase;
  type: "AUTOMATIC" | "ENGINEER_CORRECTED";
  confidence: number;
  description: string;
  triggerMetric: string;
  originalTimeSeconds?: number;
  correctionComment?: string;
}

export interface TransformationStep {
  stepNumber: number;
  stepName: string;
  inputRows: number;
  outputRows: number;
  repairedRecordsCount: number;
  details: string;
  status: "APPLIED" | "PASSED" | "FLAGGED";
  timestamp: string;
}

export interface DataQualityReport {
  overallScore: number; // 0 - 100
  totalRawRecords: number;
  synchronizedTimelinePoints: number;
  droppedRecords: number; // 0 - zero silent dropping
  outOfOrderRepaired: number;
  timeDiscontinuitiesFixed: number;
  flatlineSensors: { channel: string; durationSec: number }[];
  saturatedPointsCount: number;
  samplingJitterPercent: number;
  mcuClockOffsetMs: number;
  clockDriftPpm: number;
  syncConfidenceScore: number;
  synchronizationUncertaintyMs: number;
  transformationLedger: TransformationStep[];
}

export interface VehicleProfile {
  id: string;
  name: string;
  version: string;
  organization: string;
  dryMassKg: number;
  propellantMassKg: number;
  motorClass: string;
  lengthMeters: number;
  diameterMm: number;
  expectedApogeeM: number;
  maxAllowableRollRateDegS: number;
  maxAllowableG: number;
  nominalDrogueDeployAltM: number;
  nominalMainDeployAltM: number;
  sensors: {
    channel: string;
    type: string;
    unit: string;
    nominalRange: [number, number];
    hardLimit: [number, number];
  }[];
}

export interface FaultInjectionConfig {
  type:
    | "SENSOR_DROPOUT"
    | "CLOCK_DRIFT"
    | "NOISE_BURST"
    | "BIAS_SHIFT"
    | "STUCK_SENSOR"
    | "HIGH_ROLL_INSTABILITY"
    | "PREMATURE_DROGUE"
    | "IMU_SATURATION";
  targetChannel: string;
  startT: number;
  durationSeconds: number;
  intensity: number; // Multiplier or magnitude
  description: string;
}

export interface BenchmarkMetrics {
  totalInjectedFaults: number;
  detectedCount: number;
  precision: number; // %
  recall: number; // %
  f1Score: number; // %
  falsePositiveCount: number;
  meanDetectionLatencyMs: number;
  phaseSpecificResults: Record<
    FlightPhase,
    { injected: number; detected: number; precision: number }
  >;
}

export interface FlightComparisonData {
  flightId: string;
  missionName: string;
  date: string;
  vehicle: string;
  apogeeAltitudeM: number;
  maxVelocityMps: number;
  maxGForce: number;
  flightDurationSec: number;
  anomaliesCount: number;
  dataQualityScore: number;
  color: string;
  points: { t: number; alt: number; vel: number; rollRate: number; phase: FlightPhase }[];
}
