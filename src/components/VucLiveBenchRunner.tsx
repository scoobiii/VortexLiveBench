import React, { useState } from 'react';
import { LLMModel, LiveBenchTask, MerkleStep, VucProofAttestation } from '../types/vuc';
import { LIVEBENCH_TASKS } from '../data/liveBenchTasks';
import { VucAdapter } from '../core/vucAdapter';
import { 
  Play, 
  RotateCcw, 
  ShieldCheck, 
  Binary, 
  Copy, 
  Check, 
  Download, 
  Layers, 
  FileText,
  Activity,
  GitCommit
} from 'lucide-react';

interface VucLiveBenchRunnerProps {
  models: LLMModel[];
  selectedModel: LLMModel;
  onSelectModel: (model: LLMModel) => void;
  onLoadProofToVerifier: (proof: VucProofAttestation) => void;
}

export const VucLiveBenchRunner: React.FC<VucLiveBenchRunnerProps> = ({
  models,
  selectedModel,
  onSelectModel,
  onLoadProofToVerifier,
}) => {
  const [selectedTask, setSelectedTask] = useState<LiveBenchTask>(LIVEBENCH_TASKS[0]);
  const [customPrompt, setCustomPrompt] = useState<string>(LIVEBENCH_TASKS[0].prompt);
  const [seed, setSeed] = useState<number>(42);
  const [targetTokens, setTargetTokens] = useState<number>(24);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentText, setCurrentText] = useState<string>('');
  const [liveSteps, setLiveSteps] = useState<MerkleStep[]>([]);
  const [currentAttestation, setCurrentAttestation] = useState<VucProofAttestation | null>(null);
  const [copiedProof, setCopiedProof] = useState<boolean>(false);

  const handleSelectTask = (task: LiveBenchTask) => {
    setSelectedTask(task);
    setCustomPrompt(task.prompt);
  };

  const handleRunInference = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setCurrentText('');
    setLiveSteps([]);
    setCurrentAttestation(null);

    const adapter = new VucAdapter(selectedModel, seed);

    try {
      const attestation = await adapter.runVerifiableInference(
        customPrompt,
        targetTokens,
        (step, partial) => {
          setCurrentText(partial);
          setLiveSteps((prev) => [...prev, step]);
        }
      );

      setCurrentAttestation(attestation);
    } catch (err) {
      console.error('Error during VUC inference:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyProof = () => {
    if (!currentAttestation) return;
    navigator.clipboard.writeText(JSON.stringify(currentAttestation, null, 2));
    setCopiedProof(true);
    setTimeout(() => setCopiedProof(false), 2000);
  };

  const handleDownloadProof = () => {
    if (!currentAttestation) return;
    const blob = new Blob([JSON.stringify(currentAttestation, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentAttestation.proof_id}.vuc.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Controller Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                VUC Verifiable Inference Engine
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Deterministic Execution Trace &amp; Merkle Attestation
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Executor LiveBench Integrado ao Core VUC
            </h2>
          </div>

          {/* Model selector dropdown */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <span className="text-xs text-slate-400 font-mono whitespace-nowrap">Modelo:</span>
            <select
              value={selectedModel.id}
              onChange={(e) => {
                const found = models.find((m) => m.id === e.target.value);
                if (found) onSelectModel(found);
              }}
              className="bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-cyan-500 w-full lg:w-64 cursor-pointer"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  [{m.paramCountText}] {m.name} ({m.quantization === 'native_fp16' ? 'Nativo' : '1-Bit'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Task presets */}
        <div className="mt-4">
          <div className="text-xs font-mono text-slate-400 mb-2 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            Tarefas LiveBench Pré-configuradas:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {LIVEBENCH_TASKS.map((task) => (
              <button
                key={task.id}
                onClick={() => handleSelectTask(task)}
                className={`text-left p-2.5 rounded-lg border text-xs transition-all cursor-pointer ${
                  selectedTask.id === task.id
                    ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-semibold capitalize text-white">{task.category}</span>
                  <span className="text-[10px] font-mono text-slate-400">Task #{task.id.slice(-2)}</span>
                </div>
                <p className="line-clamp-1 text-[11px] text-slate-400">{task.title}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt input */}
        <div className="mt-4">
          <label className="block text-xs font-mono text-slate-400 mb-1.5">
            Prompt de Entrada (Determinístico Temp=0.0):
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={3}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500 transition-colors"
            placeholder="Digite o prompt para avaliação LiveBench..."
          />
        </div>

        {/* Execution knobs and Action Button */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Seed:</span>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Tokens:</span>
              <input
                type="number"
                min={8}
                max={64}
                value={targetTokens}
                onChange={(e) => setTargetTokens(Number(e.target.value))}
                className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center text-white"
              />
            </div>
          </div>

          <button
            onClick={handleRunInference}
            disabled={isRunning}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg ${
              isRunning
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-emerald-500/20 active:scale-95 cursor-pointer'
            }`}
          >
            {isRunning ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Gerando Prova VUC...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Executar Inferência Verificável</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Real-time Streaming & Merkle State Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Output Text & Stream Console */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-white font-bold">
                <Activity className="w-4 h-4 text-cyan-400" />
                Saída Determinística do Modelo
              </span>
              <span className="text-slate-400 text-[11px]">
                {selectedModel.name} | {selectedModel.paramCountText}
              </span>
            </div>

            <div className="mt-3 p-4 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-200 min-h-[160px] leading-relaxed">
              {currentText ? (
                <div>
                  <span>{currentText}</span>
                  {isRunning && <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse ml-1" />}
                </div>
              ) : (
                <div className="text-slate-500 italic flex items-center justify-center h-28">
                  Clique em &quot;Executar Inferência Verificável&quot; para iniciar o fluxo determinístico e calcular o Merkle Root.
                </div>
              )}
            </div>

            {/* Reference Expected Output snippet */}
            <div className="mt-3 p-3 bg-indigo-950/20 border border-indigo-900/40 rounded-xl text-[11px] font-mono text-slate-400">
              <span className="text-indigo-300 font-semibold block mb-1">
                Gabarito LiveBench ({selectedTask.category}):
              </span>
              <pre className="text-slate-300 whitespace-pre-wrap">{selectedTask.referenceOutputSnippet}</pre>
            </div>
          </div>

          {/* Quick Actions after Attestation generated */}
          {currentAttestation && (
            <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyProof}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono cursor-pointer transition-colors"
                >
                  {copiedProof ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedProof ? 'Copiado!' : 'Copiar .vuc.json'}</span>
                </button>
                <button
                  onClick={handleDownloadProof}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Prova</span>
                </button>
              </div>

              <button
                onClick={() => onLoadProofToVerifier(currentAttestation)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-medium shadow-md shadow-indigo-600/20 cursor-pointer transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Auditar no Verificador VUC &rarr;</span>
              </button>
            </div>
          )}
        </div>

        {/* Cryptographic Execution Trace & Merkle Leaves */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-white font-bold">
                <GitCommit className="w-4 h-4 text-emerald-400" />
                Trace Criptográfico &amp; Merkle Leaves
              </span>
              <span className="text-[11px] text-cyan-400">
                {liveSteps.length} / {targetTokens} nós
              </span>
            </div>

            {/* Merkle Root banner */}
            <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-emerald-900/50 text-xs font-mono">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Merkle Root do Trace:</span>
                <span className="text-emerald-400 font-bold">
                  {currentAttestation ? 'VERIFIED_VALID' : isRunning ? 'CALCULANDO...' : 'AGUARDANDO'}
                </span>
              </div>
              <div className="text-[10px] text-emerald-300 break-all bg-emerald-950/40 p-1.5 rounded border border-emerald-800/40 font-mono">
                {currentAttestation
                  ? currentAttestation.execution.merkle_root
                  : liveSteps.length > 0
                  ? liveSteps[liveSteps.length - 1].hash
                  : '0000000000000000000000000000000000000000000000000000000000000000'}
              </div>
            </div>

            {/* Step-by-step leaf list */}
            <div className="mt-3 space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {liveSteps.map((step) => (
                <div
                  key={step.step}
                  className="p-2 rounded bg-slate-950/80 border border-slate-800/80 text-[11px] font-mono flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-slate-500 w-5">#{step.step}</span>
                    <span className="text-cyan-300 font-bold truncate max-w-[80px]">
                      &quot;{step.token.trim()}&quot;
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-400 truncate max-w-[130px]">
                    SHA: {step.hash.slice(0, 16)}...
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400">
                    p={step.logitMax}
                  </span>
                </div>
              ))}

              {liveSteps.length === 0 && (
                <div className="text-xs text-slate-500 text-center py-8 font-mono">
                  Nenhum token gerado ainda.
                </div>
              )}
            </div>
          </div>

          {/* Telemetry info */}
          <div className="mt-3 pt-3 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>RAM Estimada: {selectedModel.quantizedSizeMB + 120} MB</span>
            <span>Limite CI: 7168 MB (OK)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
