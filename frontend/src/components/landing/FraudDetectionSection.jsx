import React from 'react';
import { ShieldCheck, AlertTriangle, Lock, CheckCircle2, Cpu, ArrowRight } from 'lucide-react';

const FraudDetectionSection = ({ onExploreFraud }) => {
  return (
    <div id="fraud" className="w-full">
      {/* Dark Slate Elevated Fraud Card */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white border border-slate-700/70 shadow-2xl relative overflow-hidden">
        
        {/* Ambient Glow */}
        <div 
          className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        {/* Card Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>Real-time Fraud Detection</span>
              <Cpu className="h-4 w-4 text-cyan-400 animate-pulse" />
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-sm">
              Our AI analyzes every transaction to keep you protected from suspicious activity.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold shrink-0">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Protected</span>
          </span>
        </div>

        {/* Central Graphic & Status Pills Stack */}
        <div className="py-6 sm:py-8 flex flex-col items-center justify-center relative">
          
          {/* Glowing Shield Graphic */}
          <div className="relative mb-6">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl bg-gradient-to-tr from-emerald-500/30 to-cyan-500/30 border border-emerald-400/40 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <ShieldCheck className="h-10 w-10 sm:h-12 sm:w-12 text-emerald-400" />
            </div>
            <div className="absolute -inset-2 bg-emerald-400/20 rounded-3xl blur-md -z-10 animate-pulse" />
          </div>

          {/* Interactive Illustrative Scenario Pills */}
          <div className="w-full max-w-md space-y-2.5">
            
            {/* Pill 1: High Risk Detection */}
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-between text-xs backdrop-blur-sm">
              <div className="flex items-center gap-2.5">
                <div className="h-6 w-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="font-bold text-rose-200 block">Unusual activity detected</span>
                  <span className="text-[10px] text-rose-300/80">₹2,00,000 transfer • Risk Score: 87/100 (HIGH)</span>
                </div>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 uppercase font-bold">
                Verification Req.
              </span>
            </div>

            {/* Pill 2: Suspicious Login Blocked */}
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between text-xs backdrop-blur-sm">
              <div className="flex items-center gap-2.5">
                <div className="h-6 w-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Lock className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="font-bold text-amber-200 block">Suspicious login blocked</span>
                  <span className="text-[10px] text-amber-300/80">Unknown device & foreign IP address</span>
                </div>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 uppercase font-bold">
                Prevented
              </span>
            </div>

            {/* Pill 3: Verified Transaction */}
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-xs backdrop-blur-sm">
              <div className="flex items-center gap-2.5">
                <div className="h-6 w-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="font-bold text-emerald-200 block">Transaction verified</span>
                  <span className="text-[10px] text-emerald-300/80">₹45,000 salary inflow • 0.02s latency</span>
                </div>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 uppercase font-bold">
                Cleared
              </span>
            </div>

          </div>

        </div>

        {/* Footer & Action Button */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-[11px] text-slate-400 text-center sm:text-left">
            * Illustrative Demo: Simulated Random Forest ML model running on FastAPI port 8000.
          </span>
          <button
            type="button"
            onClick={onExploreFraud}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-900 bg-white hover:bg-slate-100 transition-colors shrink-0 shadow-sm"
          >
            <span>Explore Fraud Detection</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-900" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default FraudDetectionSection;
