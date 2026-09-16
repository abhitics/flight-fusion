import React, { useState, useEffect, ReactNode } from "react";
import { ShieldAlert, Cpu, MonitorX } from "lucide-react";

export function InspectBlocker({ children }: { children: ReactNode }) {
  const [inspectDetected, setInspectDetected] = useState(false);

  useEffect(() => {
    const checkDevTools = () => {
      let isDevToolsOpen = false;

      // 1. Dimensions check (Detects Docked DevTools)
      const threshold = 160;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const outerWidth = window.outerWidth;
      const outerHeight = window.outerHeight;

      if (
        outerWidth - windowWidth > threshold ||
        outerHeight - windowHeight > threshold
      ) {
        isDevToolsOpen = true;
      }

      // 2. Execution time check via debugger (Detects Undocked DevTools)
      const start = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
      const duration = performance.now() - start;
      if (duration > 100) {
        isDevToolsOpen = true;
      }

      setInspectDetected(isDevToolsOpen);
    };

    window.addEventListener("resize", checkDevTools);
    // Increased frequency to quickly catch debugger state changes
    const interval = setInterval(checkDevTools, 500);
    checkDevTools();

    return () => {
      window.removeEventListener("resize", checkDevTools);
      clearInterval(interval);
    };
  }, []);

  if (!inspectDetected) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[99999] bg-[#05070B] flex items-center justify-center p-4 selection:bg-rose-500/30 font-sans backdrop-blur-sm bg-black/90" style={{ backgroundImage: 'radial-gradient(circle at center, #111a24 0%, #05070b 100%)' }}>
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgc3Ryb2tlPSIjMWUyOTNiIiBzdHJva2Utd2lkdGg9IjAuNSIgZmlsbD0ibm9uZSI+PHBhdGggZD0iTTAgNDBoNDBNNDAgMHY0MCIvPjwvZz48L3N2Zz4=')] opacity-20" />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-[600px] bg-[#1e1e24] rounded-xl shadow-2xl overflow-hidden border border-slate-700/50 flex flex-col">

        {/* Modal Header */}
        <div className="bg-[#2a2a35] px-4 py-2 flex items-center justify-between border-b border-[#3f3f4e]">
          <span className="text-slate-300 text-sm font-semibold tracking-wide">Security Protocol</span>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-slate-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-rose-500 flex items-center justify-center">
              <MonitorX className="w-2 h-2 text-rose-900" />
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-8 flex flex-col items-center text-center">

          <h1 className="text-3xl font-bold text-white mb-4">Developer Mode Detected</h1>

          <p className="text-slate-400 text-sm mb-8 max-w-md mx-auto leading-relaxed">
            A debugger hook (DevTools inspector) has been attached to this context. Please disconnect active tools to resume browsing.
          </p>

          {/* Diagnostics Box */}
          <div className="w-full bg-[#18181c] rounded-xl border border-slate-700/60 p-5 mb-8 text-left">
            <div className="flex items-center justify-between mb-6 border-b border-slate-700/60 pb-3">
              <span className="text-xs font-mono text-slate-400 tracking-widest uppercase">Security Diagnostics</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                <span className="text-xs font-mono text-rose-500 font-bold uppercase tracking-widest">Locked</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm font-mono">
              <div className="flex justify-between items-center text-slate-500">
                <span>Host:</span>
                <span className="text-slate-200 font-semibold"></span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Mode:</span>
                <span className="text-slate-200 font-semibold">Secure</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Trigger:</span>
                <span className="text-slate-200 font-semibold">DevTools</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Bypass:</span>
                <span className="text-rose-500 font-semibold">Blocked</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center gap-3 text-xs font-mono text-slate-500">
              <Cpu className="w-4 h-4 text-slate-400 animate-pulse" />
              <span>Checking debugger state continuously...</span>
            </div>
          </div>

          {/* Footer Info */}
          <div className="flex items-center justify-center gap-2 text-slate-500 text-xs font-mono mb-2">
            <ShieldAlert className="w-4 h-4" />
            <span>Close the DevTools window to restore access automatically.</span>
          </div>

        </div>

      </div>
    </div>
  );
}
