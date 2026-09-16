/**
 * Vehicle and Mission Configuration Modal
 * Configures flight envelopes, sensor channels, and vehicle mass properties.
 */

import React, { useState } from "react";
import { VehicleProfile } from "../types/telemetry";
import { Sliders, Save, CheckCircle2, X, Rocket } from "lucide-react";

interface VehicleConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: VehicleProfile;
  onSave: (updated: VehicleProfile) => void;
}

export const VehicleConfigModal: React.FC<VehicleConfigModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const [formData, setFormData] = useState<VehicleProfile>(profile);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(formData);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/40">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 font-mono">
                VEHICLE & FLIGHT ENVELOPE CONFIGURATION
              </h2>
              <p className="text-xs text-slate-400">
                Version {formData.version} • {formData.organization}
              </p>
            </div>
          </div>
          <button
            id="btn-close-vehicle-config"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <div className="p-5 space-y-4 text-xs font-mono">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block text-[10px] mb-1">VEHICLE NAME</label>
              <input
                id="input-vehicle-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block text-[10px] mb-1">MOTOR CLASS / PROPULSION</label>
              <input
                id="input-motor-class"
                type="text"
                value={formData.motorClass}
                onChange={(e) => setFormData({ ...formData, motorClass: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-400 block text-[10px] mb-1">DRY MASS (KG)</label>
              <input
                id="input-dry-mass"
                type="number"
                value={formData.dryMassKg}
                onChange={(e) => setFormData({ ...formData, dryMassKg: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block text-[10px] mb-1">PROPELLANT MASS (KG)</label>
              <input
                id="input-prop-mass"
                type="number"
                value={formData.propellantMassKg}
                onChange={(e) =>
                  setFormData({ ...formData, propellantMassKg: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block text-[10px] mb-1">TARGET APOGEE (M)</label>
              <input
                id="input-target-apogee"
                type="number"
                value={formData.expectedApogeeM}
                onChange={(e) =>
                  setFormData({ ...formData, expectedApogeeM: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Envelope Constraints */}
          <div className="p-3.5 bg-slate-900/70 rounded-xl border border-slate-800 space-y-3">
            <div className="text-sky-400 font-bold text-xs">AERODYNAMIC & STRUCTURAL ENVELOPE BOUNDS</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block text-[10px] mb-1">
                  MAX ALLOWABLE ROLL RATE (°/S)
                </label>
                <input
                  id="input-max-roll"
                  type="number"
                  value={formData.maxAllowableRollRateDegS}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxAllowableRollRateDegS: parseFloat(e.target.value) || 360,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-sky-500"
                />
                <span className="text-[9px] text-slate-500">Exceeding flags Roll Resonance Anomaly</span>
              </div>
              <div>
                <label className="text-slate-400 block text-[10px] mb-1">
                  MAX ALLOWABLE G-LOAD (G)
                </label>
                <input
                  id="input-max-g"
                  type="number"
                  value={formData.maxAllowableG}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxAllowableG: parseFloat(e.target.value) || 18,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-sky-500"
                />
                <span className="text-[9px] text-slate-500">Motor ignition & shock cutoff threshold</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-400">
            Configuration version auto-incremented on commit.
          </span>
          <button
            id="btn-save-vehicle-config"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow"
          >
            {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? "Saved & Applied" : "Save Configuration"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
