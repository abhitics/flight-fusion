/**
 * Aerospace Telemetry Simulator
 * Generates high-fidelity, physics-based multi-MCU sounding rocket telemetry
 * representing multiple asynchronous flight computers, clock offsets, and aerospace dynamics.
 */

import {
  RawTelemetrySource,
  SynchronizedTelemetryPoint,
  FlightPhase,
  FaultInjectionConfig,
} from "../types/telemetry";

export interface SimulationOptions {
  totalDurationSeconds?: number;
  padIdleSeconds?: number;
  sampleCountTarget?: number; // e.g. 50,000 to 120,000
  targetApogeeMeters?: number;
  burnoutTimeSeconds?: number;
  injectedFaults?: FaultInjectionConfig[];
}

export function generateFlightTelemetry(options: SimulationOptions = {}) {
  const {
    totalDurationSeconds = 280,
    padIdleSeconds = 15,
    sampleCountTarget = 28000,
    targetApogeeMeters = 38400, // 38.4 km suborbital
    burnoutTimeSeconds = 42,
    injectedFaults = [],
  } = options;

  // Time step for master timeline (e.g. 100Hz = 0.01s)
  const dt = totalDurationSeconds / sampleCountTarget;
  const synchronizedPoints: SynchronizedTelemetryPoint[] = [];

  // Rocket Physical Parameters
  const dryMass = 85; // kg
  const fuelMass = 160; // kg
  const wetMass = dryMass + fuelMass;
  const burnDuration = burnoutTimeSeconds;
  const burnRate = fuelMass / burnDuration; // kg/s
  const avgThrust = 16500; // N (~1.65kN)
  const crossSectionArea = Math.PI * Math.pow(0.178 / 2, 2); // 178mm diameter

  // State variables
  let altitude = 142; // Pad elevation 142m MSL
  let velocity = 0; // m/s
  let pitch = 89.2; // Launch rail angle 89.2 deg
  let yaw = 0.5;
  let roll = 0;
  let rollRate = 0;
  let pitchRate = 0;
  let yawRate = 0;

  // Independent MCU clock offsets
  const mcuB_InitialOffsetMs = 142.5; // +142.5 ms clock offset
  const mcuB_DriftPpm = 22.4; // 22.4 parts-per-million thermal drift

  // Trajectory generation
  for (let t = -padIdleSeconds; t <= totalDurationSeconds; t += dt) {
    const met = Number(t.toFixed(3)); // Mission Elapsed Time (seconds from T0)
    let phase: FlightPhase = "PAD_IDLE";
    let thrust = 0;
    let currentMass = dryMass;

    // Atmospheric calculations (US Standard Atmosphere approx)
    const altAbovePad = Math.max(0, altitude - 142);
    const T_kelvin = Math.max(216.65, 288.15 - 0.0065 * altitude);
    const pressureHpa = Math.max(
      0.1,
      1013.25 * Math.pow(1 - (0.0065 * altitude) / 288.15, 5.25588)
    );
    const airDensity = (pressureHpa * 100) / (287.05 * T_kelvin);
    const speedOfSound = Math.sqrt(1.4 * 287.05 * T_kelvin);
    const mach = Math.abs(velocity) / speedOfSound;
    const dynamicPressureKPa = 0.5 * airDensity * velocity * velocity * 0.001;

    // Determine Phase and Dynamics
    if (met < 0) {
      phase = "PAD_IDLE";
      velocity = 0;
      altitude = 142 + (Math.sin(met * 2) * 0.15); // Sensor noise at pad
      thrust = 0;
      currentMass = wetMass;
      rollRate = (Math.random() - 0.5) * 0.4;
      pitchRate = (Math.random() - 0.5) * 0.2;
      yawRate = (Math.random() - 0.5) * 0.2;
    } else if (met <= burnDuration) {
      phase = "POWERED_ASCENT";
      const burnProgress = met / burnDuration;
      // Progressive thrust curve with progressive chamber pressure
      thrust = avgThrust * (1 + 0.18 * Math.sin(burnProgress * Math.PI));
      currentMass = wetMass - burnRate * met;

      // Pitch-over program (gravity turn)
      if (met > 4) {
        pitch = Math.max(78, 89.2 - (met - 4) * 0.28);
      }

      // Induced roll for stabilization (nominal 120-180 deg/s)
      rollRate = 80 + met * 4.2;

      // INJECTED AERODYNAMIC ANOMALY at T+34s to T+39s:
      // High-speed roll resonance / fin flutter under high dynamic pressure
      if (met >= 33.8 && met <= 39.4) {
        const anomalyPeak = Math.sin(((met - 33.8) / (39.4 - 33.8)) * Math.PI);
        rollRate += anomalyPeak * 310; // Spikes up to ~480 deg/s! Exceeds 360 deg/s limit
        pitchRate += Math.sin(met * 28) * 14.5 * anomalyPeak; // Transverse flutter
        yawRate += Math.cos(met * 28) * 12.0 * anomalyPeak;
      }
    } else if (met <= burnDuration + 3.0) {
      phase = "BURNOUT";
      thrust = 0;
      currentMass = dryMass;
      rollRate *= 0.96;
    } else if (velocity > 5.0) {
      phase = "COAST";
      thrust = 0;
      currentMass = dryMass;
      rollRate = Math.max(12, rollRate * 0.992);
      pitchRate *= 0.98;
      yawRate *= 0.98;
    } else if (velocity <= 5.0 && velocity >= -15.0 && altitude > targetApogeeMeters * 0.9) {
      phase = "APOGEE";
      thrust = 0;
    } else if (altitude > 580) {
      phase = "DROGUE_DEPLOY";
      // Drogue chute deployed at apogee
      // Terminal descent speed under drogue ~28-32 m/s
    } else if (altitude > 146) {
      phase = "MAIN_DEPLOY";
      // Main chute deployed at ~550m
      // Steady descent speed ~6.2 m/s
    } else {
      phase = "TOUCHDOWN";
      velocity = 0;
      altitude = 142;
      rollRate = 0;
      pitchRate = 0;
      yawRate = 0;
    }

    // Aero Drag Coefficient with Transonic drag rise (Mach 0.8 - 1.4)
    let cd = 0.38;
    if (mach > 0.8 && mach < 1.3) {
      cd += 0.42 * Math.exp(-Math.pow((mach - 1.05) / 0.22, 2)); // Wave drag peak
    } else if (mach >= 1.3) {
      cd = 0.52 / Math.sqrt(mach * mach - 1);
    }

    if (phase === "DROGUE_DEPLOY") {
      cd = 1.6; // High drag drogue
    } else if (phase === "MAIN_DEPLOY") {
      cd = 5.8; // Huge main parachute canopy
    }

    const dragForce = 0.5 * airDensity * velocity * Math.abs(velocity) * cd * crossSectionArea;
    const gravity = 9.80665 * Math.pow(6371000 / (6371000 + altitude), 2);

    let netForce = thrust - dragForce - currentMass * gravity;
    if (phase === "PAD_IDLE" || phase === "TOUCHDOWN") {
      netForce = 0;
    }

    const accelZ_mps2 = netForce / currentMass;
    const accelZ_g = accelZ_mps2 / 9.80665;

    // Update Kinematics
    if (phase !== "PAD_IDLE" && phase !== "TOUCHDOWN") {
      velocity += accelZ_mps2 * dt;
      altitude += velocity * dt;
    }

    // Deploy shock G-load spikes
    let deployShockG = 0;
    if (met >= 110.0 && met <= 110.8) {
      deployShockG = -6.4 * Math.sin(((met - 110.0) / 0.8) * Math.PI);
    } else if (met >= 184.2 && met <= 185.2) {
      deployShockG = -4.1 * Math.sin(((met - 184.2) / 1.0) * Math.PI);
    }

    // Attitude updates
    roll = (roll + rollRate * dt) % 360;
    if (roll < 0) roll += 360;
    pitch += pitchRate * dt;
    yaw += yawRate * dt;

    // Body frame accelerations
    const lateralNoise = (Math.random() - 0.5) * 1.8;
    const accelX = pitchRate * 0.4 + lateralNoise;
    const accelY = yawRate * 0.4 + lateralNoise;
    const totalAccelG = Math.sqrt(
      Math.pow(accelZ_g + deployShockG, 2) +
        Math.pow(accelX / 9.8, 2) +
        Math.pow(accelY / 9.8, 2)
    );

    // Primary & Secondary Raw Timestamps (simulating independent MCU clocks)
    const rawTimePrimary = Math.round((met + padIdleSeconds) * 1000);
    const mcuB_DriftSec = (met + padIdleSeconds) * (mcuB_DriftPpm / 1000000);
    const rawTimeSecondary = Math.round(
      rawTimePrimary + mcuB_InitialOffsetMs + mcuB_DriftSec * 1000
    );

    // Apply any dynamic fault injections
    let finalAltitude = altitude;
    let finalRollRate = rollRate;
    let finalAccel = totalAccelG;
    let isAnomalyPoint = false;
    const anomalyIds: string[] = [];

    // Natural flight anomalies (Roll flutter at T+34s to T+39s)
    if (met >= 34.0 && met <= 39.2) {
      isAnomalyPoint = true;
      anomalyIds.push("ANOM-ROLL-RESONANCE");
    }

    // Barometric supersonic pressure lag during high transonic ascent
    if (met >= 17.5 && met <= 21.0) {
      isAnomalyPoint = true;
      anomalyIds.push("ANOM-TRANSONIC-BUFFET");
    }

    for (const fault of injectedFaults) {
      if (met >= fault.startT && met <= fault.startT + fault.durationSeconds) {
        isAnomalyPoint = true;
        anomalyIds.push(`INJECTED-${fault.type}`);
        if (fault.type === "HIGH_ROLL_INSTABILITY") {
          finalRollRate += 350 * fault.intensity;
        } else if (fault.type === "NOISE_BURST") {
          finalAccel += (Math.random() - 0.5) * 12 * fault.intensity;
        } else if (fault.type === "SENSOR_DROPOUT") {
          finalAltitude = -999; // Dropout code
        } else if (fault.type === "STUCK_SENSOR") {
          finalAltitude = 2450; // Frozen value
        }
      }
    }

    const point: SynchronizedTelemetryPoint = {
      timeMaster: met,
      rawTimePrimary,
      rawTimeSecondary,
      altitude: Math.round(finalAltitude * 10) / 10,
      altitudeFused: Math.round((altitude + (Math.random() - 0.5) * 0.8) * 10) / 10,
      velocity: Math.round(velocity * 10) / 10,
      machNumber: Math.round(mach * 100) / 100,
      dynamicPressure: Math.round(dynamicPressureKPa * 10) / 10,
      acceleration: Math.round(finalAccel * 100) / 100,
      accelX: Math.round(accelX * 100) / 100,
      accelY: Math.round(accelY * 100) / 100,
      accelZ: Math.round(accelZ_mps2 * 100) / 100,
      rollRate: Math.round(finalRollRate * 10) / 10,
      pitchRate: Math.round(pitchRate * 10) / 10,
      yawRate: Math.round(yawRate * 10) / 10,
      pitch: Math.round(pitch * 10) / 10,
      yaw: Math.round(yaw * 10) / 10,
      roll: Math.round(roll * 10) / 10,
      pressure: Math.round(pressureHpa * 10) / 10,
      temperature: Math.round((T_kelvin - 273.15) * 10) / 10,
      batteryVoltage: Number((12.6 - (met > 0 ? (met / totalDurationSeconds) * 0.9 : 0)).toFixed(2)),
      rssi: Math.round(-62 - (altitude / 1000) * 0.8 + (Math.random() - 0.5) * 4),
      pyroContinuity: met < 185, // Pyro armed until main deployed
      phase,
      isAnomaly: isAnomalyPoint,
      anomalyIds: anomalyIds.length > 0 ? anomalyIds : undefined,
    };

    synchronizedPoints.push(point);
  }

  // Generate metadata for independent raw files
  const rawSources: RawTelemetrySource[] = [
    {
      id: "src-mcu-primary",
      name: "Flight Computer A (Primary Avionics)",
      sourceType: "AVIONICS_PRIMARY",
      samplingRateHz: 100,
      totalRecords: synchronizedPoints.length,
      timeRange: [0, totalDurationSeconds * 1000],
      estimatedClockOffsetMs: 0.0,
      estimatedClockDriftPpm: 0.0,
      dataQualityScore: 99.4,
      issues: ["Transient sensor jitter on barometric channel near Mach 1.05"],
    },
    {
      id: "src-mcu-secondary",
      name: "Flight Computer B (IMU / High-Rate Redundant)",
      sourceType: "IMU_HIGH_RATE",
      samplingRateHz: 250,
      totalRecords: Math.round(synchronizedPoints.length * 2.5),
      timeRange: [mcuB_InitialOffsetMs, totalDurationSeconds * 1000 + mcuB_InitialOffsetMs],
      estimatedClockOffsetMs: mcuB_InitialOffsetMs,
      estimatedClockDriftPpm: mcuB_DriftPpm,
      dataQualityScore: 96.8,
      issues: [
        "Identified +142.5ms initial clock offset relative to primary avionics",
        "Estimated linear thermal clock drift rate of 22.4 ppm",
        "2 timestamp non-monotonic sequences detected and chronologically sorted",
      ],
    },
    {
      id: "src-ground-rf",
      name: "Ground Station Telemetry Receiver (915MHz RF)",
      sourceType: "GROUND_STATION_RF",
      samplingRateHz: 10,
      totalRecords: Math.round(synchronizedPoints.length * 0.1),
      timeRange: [0, totalDurationSeconds * 1000],
      estimatedClockOffsetMs: -18.2,
      estimatedClockDriftPpm: 4.1,
      dataQualityScore: 92.1,
      issues: [
        "14 dropped telemetry packets during motor exhaust plume attenuation (T+12s - T+16s)",
        "Packet sequence gap repaired via master timeline interpolation",
      ],
    },
  ];

  return {
    synchronizedPoints,
    rawSources,
  };
}

/**
 * Generates sample CSV strings for drag-and-drop ingestion testing
 */
export function generateRawTelemetryCSV(sourceType: "PRIMARY" | "SECONDARY"): string {
  const sim = generateFlightTelemetry({ sampleCountTarget: 1200 });
  const points = sim.synchronizedPoints;

  if (sourceType === "PRIMARY") {
    let csv = "timestamp_ms,baro_alt_m,vert_vel_mps,total_accel_g,static_press_hpa,temp_c,batt_v,pyro_arm\n";
    for (const p of points) {
      csv += `${p.rawTimePrimary},${p.altitude},${p.velocity},${p.acceleration},${p.pressure},${p.temperature},${p.batteryVoltage},${p.pyroContinuity ? 1 : 0}\n`;
    }
    return csv;
  } else {
    // Secondary IMU with clock offset and 6-axis data
    let csv = "mcu2_epoch_ms,ax_mps2,ay_mps2,az_mps2,gyro_p_dps,gyro_y_dps,gyro_r_dps,pitch_deg,yaw_deg,roll_deg\n";
    for (const p of points) {
      csv += `${p.rawTimeSecondary},${p.accelX},${p.accelY},${p.accelZ},${p.pitchRate},${p.yawRate},${p.rollRate},${p.pitch},${p.yaw},${p.roll}\n`;
    }
    return csv;
  }
}
