import React, { useState } from 'react';
import { LLMModel } from '../types/vuc';
import { CiWorkflowGenerator } from '../core/ciWorkflowGenerator';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  FileCode, 
  Terminal, 
  FileJson, 
  CheckCircle2,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';

interface CiWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBatches: number;
  models: LLMModel[];
}

export const CiWorkflowModal: React.FC<CiWorkflowModalProps> = ({
  isOpen,
  onClose,
  activeBatches,
  models,
}) => {
  const [activeTab, setActiveTab] = useState<'yaml' | 'pythonHarness' | 'executionLogs'>('yaml');
  const [selectedBatch, setSelectedBatch] = useState<number>(activeBatches);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const yamlContent = CiWorkflowGenerator.generateWorkflowYaml(activeBatches, models);
  const pythonHarness = CiWorkflowGenerator.generatePythonHarnessScript();
  const executionLogsJson = CiWorkflowGenerator.generateBatchExecutionLogsJson(selectedBatch, models);

  let currentContent = yamlContent;
  let currentFileName = '.github/workflows/vuc-livebench.yml';

  if (activeTab === 'pythonHarness') {
    currentContent = pythonHarness;
    currentFileName = 'vuc_harness.py';
  } else if (activeTab === 'executionLogs') {
    currentContent = executionLogsJson;
    currentFileName = `vuc_execution_logs_batch_${selectedBatch}.json`;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const isJson = activeTab === 'executionLogs';
    const blob = new Blob([currentContent], { 
      type: isJson ? 'application/json' : 'text/plain' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportBatchLogsJson = () => {
    const logs = CiWorkflowGenerator.generateBatchExecutionLogsJson(selectedBatch, models);
    const blob = new Blob([logs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vuc_attestation_execution_logs_batch_${selectedBatch}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Available batches list for selector
  const batchNumbers = Array.from({ length: Math.max(1, activeBatches) }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800/60">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">
                  Gerador de CI Workflow &amp; Logs de Execução VUC
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  VUC Spec v1.0.4
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Estratégia de matriz dividida em lotes de 5 modelos • RAM máxima de 7GB por runner
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selector & actions */}
        <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveTab('yaml')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'yaml'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>vuc-livebench.yml</span>
            </button>
            <button
              onClick={() => setActiveTab('pythonHarness')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'pythonHarness'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>vuc_harness.py</span>
            </button>
            <button
              onClick={() => setActiveTab('executionLogs')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'executionLogs'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileJson className="w-3.5 h-3.5 text-emerald-400" />
              <span>Logs do Lote {selectedBatch} (JSON)</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Quick Export Logs button visible in all tabs */}
            <button
              onClick={handleExportBatchLogsJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-xs font-mono cursor-pointer transition-colors shadow-sm"
              title="Exporta o arquivo JSON com a simulação dos logs brutos e atestados VUC do lote atual"
            >
              <FileJson className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exportar Logs JSON</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono cursor-pointer transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Batch selector bar if on executionLogs tab */}
        {activeTab === 'executionLogs' && (
          <div className="px-4 py-2 bg-slate-950/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-xs font-mono text-slate-300">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Selecionar Lote de Execução CI:</span>
              <div className="flex rounded-md bg-slate-900 p-0.5 border border-slate-800">
                {batchNumbers.map((b) => (
                  <button
                    key={b}
                    onClick={() => setSelectedBatch(b)}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                      selectedBatch === b
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Lote {b} (5 LLMs)
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> Atestados VUC: 100% Válidos
              </span>
              <span>•</span>
              <span className="text-cyan-300">RAM do Lote &lt; 7.000 MB</span>
            </div>
          </div>
        )}

        {/* Code / Logs View */}
        <div className="p-4 bg-slate-950 overflow-y-auto flex-1 font-mono text-xs text-slate-300">
          <pre className="whitespace-pre-wrap">{currentContent}</pre>
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-slate-900 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Compatível com runners gratuitos do GitHub Actions (2 CPUs, 7GB RAM)
          </span>
          <div className="flex items-center gap-3">
            <span>Lotes ativos no CI: {activeBatches}</span>
            <span>•</span>
            <span className="text-cyan-400 font-bold">Arquivo: {currentFileName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
