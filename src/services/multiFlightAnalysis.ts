/**
 * Multi-Flight Telemetry Regression & Comparison Service
 */

import { FlightComparisonData } from "../types/telemetry";

export const SAMPLE_HISTORICAL_FLIGHTS: FlightComparisonData[] = [
  {
    flightId: "FLIGHT-01",
    missionName: "Astraea-IV Suborbital Test 01",
    date: "2026-03-12",
    vehicle: "Astraea-IV Mk1",
    apogeeAltitudeM: 38400,
    maxVelocityMps: 1045,
    maxGForce: 13.8,
    flightDurationSec: 268,
    anomaliesCount: 2,
    dataQualityScore: 98.2,
    color: "#38bdf8", // sky-400
    points: generateHistoricalCurve(38400, 1045, 268, 1.0),
  },
  {
    flightId: "FLIGHT-02",
    missionName: "Astraea-IV Test 02 (High Roll Flutter Event)",
    date: "2026-05-24",
    vehicle: "Astraea-IV Mk1 (Standard Fins)",
    apogeeAltitudeM: 34120,
    maxVelocityMps: 968,
    maxGForce: 15.2,
    flightDurationSec: 254,
    anomaliesCount: 4,
    dataQualityScore: 95.4,
    color: "#f43f5e", // rose-500
    points: generateHistoricalCurve(34120, 968, 254, 1.4),
  },
  {
    flightId: "FLIGHT-03",
    missionName: "Astraea-IV Test 03 (Stiffened Carbon Fins)",
    date: "2026-08-08",
    vehicle: "Astraea-IV Mk2 (Optimized Aero)",
    apogeeAltitudeM: 41850,
    maxVelocityMps: 1120,
    maxGForce: 12.9,
    flightDurationSec: 282,
    anomaliesCount: 0,
    dataQualityScore: 99.6,
    color: "#10b981", // emerald-500
    points: generateHistoricalCurve(41850, 1120, 282, 0.7),
  },
];

function generateHistoricalCurve(
  peakAlt: number,
  peakVel: number,
  duration: number,
  rollNoiseFactor: number
) {
  const points = [];
  for (let t = 0; t <= duration; t += 4) {
    const norm = t / duration;
    // Parabolic-like suborbital trajectory approximation
    let alt = 0;
    if (norm <= 0.45) {
      alt = peakAlt * Math.sin((norm / 0.45) * (Math.PI / 2));
    } else {
      alt = peakAlt * Math.cos(((norm - 0.45) / 0.55) * (Math.PI / 2));
    }
    const vel = peakVel * (1 - norm * 1.8);
    const rollRate = (120 + Math.sin(t * 0.15) * 40) * rollNoiseFactor;

    points.push({
      t,
      alt: Math.max(0, Math.round(alt)),
      vel: Math.round(vel),
      rollRate: Math.round(rollRate),
      phase: norm < 0.15 ? ("POWERED_ASCENT" as const) : norm < 0.45 ? ("COAST" as const) : ("TERMINAL_DESCENT" as const),
    });
  }
  return points;
}
