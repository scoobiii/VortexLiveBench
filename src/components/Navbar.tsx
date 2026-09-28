import React from 'react';
import { Cpu, ShieldCheck, GitBranch, Layers, PlusCircle, FileCode } from 'lucide-react';

interface NavbarProps {
  activeBatches: number;
  totalModels: number;
  totalQuantized: number;
  onScaleBatch: () => void;
  onOpenCiModal: () => void;
  runnerRamUsedMB: number;
  maxRunnerRamMB: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeBatches,
  totalModels,
  totalQuantized,
  onScaleBatch,
  onOpenCiModal,
  runnerRamUsedMB,
  maxRunnerRamMB,
}) => {
  const ramPercent = Math.min(100, Math.round((runnerRamUsedMB / maxRunnerRamMB) * 100));

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Core Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-emerald-500 p-0.5 shadow-lg shadow-cyan-500/10">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent">
                VUC LiveBench
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
                1-Bit Matrix CI
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Verifiable Universal Computation for Sub-0.5B & 1-Bit LLMs
            </p>
          </div>
        </div>

        {/* CI Runner Telemetry & Scaling Stats */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Runner RAM Envelope Meter */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400 font-mono">
                <span>GitHub Runner RAM</span>
                <span className={ramPercent > 80 ? 'text-amber-400' : 'text-emerald-400'}>
                  {runnerRamUsedMB} / {maxRunnerRamMB} MB ({ramPercent}%)
                </span>
              </div>
              <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full transition-all duration-500 ${
                    ramPercent > 80 ? 'bg-amber-400' : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                  }`}
                  style={{ width: `${ramPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Batches & Model Fleet */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>
              <strong className="text-white">{activeBatches}</strong> Batches (
              <strong className="text-cyan-400">{totalModels}</strong> Models,{' '}
              <strong className="text-amber-300">{totalQuantized}</strong> 1-Bit)
            </span>
          </div>

          {/* Action: Scale +5 Models */}
          <button
            onClick={onScaleBatch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
            title="Adicionar mais 5 LLMs na matriz de execução CI"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+5 Modelos</span>
          </button>

          {/* Action: Export GitHub CI Workflow */}
          <button
            onClick={onOpenCiModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/40 text-xs font-mono transition-all cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>CI Workflow</span>
          </button>
        </div>
      </div>
    </header>
  );
};
