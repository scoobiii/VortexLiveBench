import React, { useState } from 'react';
import { LLMModel, VucProofAttestation } from './types/vuc';
import { INITIAL_MODELS, GITHUB_ACTIONS_RUNNER_LIMITS } from './data/modelsCatalog';
import { Navbar } from './components/Navbar';
import { ModelFleetMatrix } from './components/ModelFleetMatrix';
import { VucLiveBenchRunner } from './components/VucLiveBenchRunner';
import { QuantizationStudio } from './components/QuantizationStudio';
import { ProofVerifier } from './components/ProofVerifier';
import { LiveBenchLeaderboard } from './components/LiveBenchLeaderboard';
import { CiWorkflowModal } from './components/CiWorkflowModal';
import { CiTestCoverageDashboard } from './components/CiTestCoverageDashboard';
import { ArchitectureAndTelemetryDashboard } from './components/ArchitectureAndTelemetryDashboard';
import { 
  Layers, 
  Play, 
  Binary, 
  ShieldCheck, 
  Trophy, 
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Github,
  Award,
  Server
} from 'lucide-react';

export default function App() {
  const [activeBatches, setActiveBatches] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'matrix' | 'runner' | 'quantizer' | 'verifier' | 'leaderboard' | 'coverage' | 'architecture'>('matrix');
  const [selectedModel, setSelectedModel] = useState<LLMModel>(INITIAL_MODELS[0]);
  const [verifiedProofToAudit, setVerifiedProofToAudit] = useState<VucProofAttestation | null>(null);
  const [isCiModalOpen, setIsCiModalOpen] = useState<boolean>(false);
  const [scaleToast, setScaleToast] = useState<string | null>(null);

  // Available models based on active batches (batch 1 = first 5, batch 2 = first 10, batch 3 = first 15)
  const currentVisibleModels = INITIAL_MODELS.filter((m) => m.batchIndex <= activeBatches);

  // Calculate runner RAM footprint for the heaviest model in active batches
  const maxModelRamMB = Math.max(...currentVisibleModels.map((m) => m.quantizedSizeMB));
  // Total batch memory overhead
  const activeBatchModels = currentVisibleModels.filter((m) => m.batchIndex === activeBatches);
  const currentBatchTotalRamMB = activeBatchModels.reduce((acc, m) => acc + m.quantizedSizeMB, 0);

  const handleScaleBatch = () => {
    const maxBatches = Math.ceil(INITIAL_MODELS.length / 5);
    if (activeBatches < maxBatches) {
      const nextBatch = activeBatches + 1;
      setActiveBatches(nextBatch);
      setScaleToast(`🚀 Lote ${nextBatch} ativado! +5 LLMs adicionadas à matriz do GitHub CI.`);
      setTimeout(() => setScaleToast(null), 4000);
    } else {
      // Dynamic generation of custom models if user scales past batch 3
      setScaleToast('⚠️ Capacidade máxima demonstrativa de 15 modelos atingida para os limites do runner GitHub!');
      setTimeout(() => setScaleToast(null), 4000);
    }
  };

  const handleSelectModelForRunner = (model: LLMModel) => {
    setSelectedModel(model);
    setActiveTab('runner');
  };

  const handleLoadProofToVerifier = (proof: VucProofAttestation) => {
    setVerifiedProofToAudit(proof);
    setActiveTab('verifier');
  };

  const totalQuantized = currentVisibleModels.filter((m) => m.quantization !== 'native_fp16').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeBatches={activeBatches}
        totalModels={currentVisibleModels.length}
        totalQuantized={totalQuantized}
        onScaleBatch={handleScaleBatch}
        onOpenCiModal={() => setIsCiModalOpen(true)}
        runnerRamUsedMB={maxModelRamMB + 350} // including python overhead
        maxRunnerRamMB={GITHUB_ACTIONS_RUNNER_LIMITS.maxRamMB}
      />

      {/* Floating scale toast */}
      {scaleToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 border border-cyan-500/60 text-cyan-200 text-xs font-mono shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom duration-300">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>{scaleToast}</span>
        </div>
      )}

      {/* Main navigation tabs */}
      <div className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-sm sticky top-[69px] z-30 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar py-2">
          <nav className="flex space-x-1 sm:space-x-2 text-xs font-mono">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Matriz de Modelos ({currentVisibleModels.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('runner')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'runner'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Executor VUC LiveBench</span>
            </button>

            <button
              onClick={() => setActiveTab('quantizer')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'quantizer'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Binary className="w-3.5 h-3.5" />
              <span>Quantizador 1-Bit (BitNet)</span>
            </button>

            <button
              onClick={() => setActiveTab('verifier')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'verifier'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Auditor de Provas VUC</span>
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'leaderboard'
                  ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Placar LiveBench</span>
            </button>

            <button
              onClick={() => setActiveTab('coverage')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'coverage'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>Testes CI (100% Cobertura)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/70 font-bold">
                100%
              </span>
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'architecture'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              <span>Arquitetura &amp; Grafana</span>
            </button>
          </nav>

          {/* Quick info tag */}
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Runner GitHub: 2-Core / 7GB RAM Limit OK</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 lg:px-8 py-6 flex-1">
        {activeTab === 'matrix' && (
          <ModelFleetMatrix
            models={currentVisibleModels}
            onSelectModelForRunner={handleSelectModelForRunner}
            onScaleBatch={handleScaleBatch}
            maxRunnerRamMB={GITHUB_ACTIONS_RUNNER_LIMITS.maxRamMB}
          />
        )}

        {activeTab === 'runner' && (
          <VucLiveBenchRunner
            models={currentVisibleModels}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            onLoadProofToVerifier={handleLoadProofToVerifier}
          />
        )}

        {activeTab === 'quantizer' && <QuantizationStudio />}

        {activeTab === 'verifier' && (
          <ProofVerifier initialProof={verifiedProofToAudit} />
        )}

        {activeTab === 'leaderboard' && (
          <LiveBenchLeaderboard models={currentVisibleModels} />
        )}

        {activeTab === 'coverage' && <CiTestCoverageDashboard />}

        {activeTab === 'architecture' && <ArchitectureAndTelemetryDashboard />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 px-4 lg:px-8 text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>
              VUC (Verifiable Universal Computation) &amp; LiveBench CI Integration Suite
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <a
              href="https://github.com/scoobiii/vuc"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              <Github className="w-3.5 h-3.5" />
              <span>scoobiii/vuc</span>
            </a>
            <span>•</span>
            <a
              href="https://github.com/scoobiii/LiveBench"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              <Github className="w-3.5 h-3.5" />
              <span>scoobiii/LiveBench</span>
            </a>
            <span>•</span>
            <span className="text-emerald-400">Deterministic BitNet b1.58 v1.0.4</span>
          </div>
        </div>
      </footer>

      {/* CI Workflow Modal */}
      <CiWorkflowModal
        isOpen={isCiModalOpen}
        onClose={() => setIsCiModalOpen(false)}
        activeBatches={activeBatches}
        models={currentVisibleModels}
      />
    </div>
  );
}
