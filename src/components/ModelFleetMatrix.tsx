import React, { useState } from 'react';
import { LLMModel } from '../types/vuc';
import { 
  Sparkles, 
  Binary, 
  ExternalLink, 
  CheckCircle2, 
  Layers, 
  Play, 
  AlertTriangle,
  ArrowDownRight,
  Filter,
  Info
} from 'lucide-react';

interface ModelFleetMatrixProps {
  models: LLMModel[];
  onSelectModelForRunner: (model: LLMModel) => void;
  onScaleBatch: () => void;
  maxRunnerRamMB: number;
}

export const ModelFleetMatrix: React.FC<ModelFleetMatrixProps> = ({
  models,
  onSelectModelForRunner,
  onScaleBatch,
  maxRunnerRamMB,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'sub05' | 'quantized1bit'>('all');
  const [activeBatchTab, setActiveBatchTab] = useState<number | 'all'>('all');

  const availableBatches = Array.from(new Set(models.map((m) => m.batchIndex))).sort();

  const filteredModels = models.filter((m) => {
    if (filterType === 'sub05' && !m.isSubHalfB) return false;
    if (filterType === 'quantized1bit' && m.quantization === 'native_fp16') return false;
    if (activeBatchTab !== 'all' && m.batchIndex !== activeBatchTab) return false;
    return true;
  });

  const totalQuantized = models.filter((m) => m.quantization !== 'native_fp16').length;
  const totalSub05B = models.filter((m) => m.isSubHalfB).length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Explanation of User Prompt Requirement */}
      <div className="rounded-2xl border border-cyan-900/40 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-[11px] font-mono font-medium">
                VUC Matrix Architecture
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Sub-0.5B Clones &gt; 1-Bit Ternary BitNet Quantization
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Catálogo de LLMs Verificáveis para Runner CI GitHub
            </h2>
            <p className="text-sm text-slate-300 max-w-3xl mt-1 leading-relaxed">
              Modelos nativos de até <strong>0.5B parâmetros</strong> são mantidos sem perda. Modelos maiores são convertidos via{' '}
              <strong className="text-amber-300">1-Bit BitNet b1.58 (W1A8)</strong> com pesos ternários &#123;-1, 0, +1&#125;,
              reduzindo o consumo de RAM em até <strong>~90%</strong> para caber no limite de <strong>7GB</strong> dos runners padrão do GitHub.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full lg:w-auto">
            <button
              onClick={onScaleBatch}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-medium text-xs tracking-wide shadow-lg shadow-cyan-900/30 transition-all cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>Ampliar +5 Modelos</span>
            </button>
          </div>
        </div>

        {/* Filters and Batch switcher */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
              <Filter className="w-3.5 h-3.5 text-slate-400" /> Filtro:
            </span>
            <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  filterType === 'all' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos ({models.length})
              </button>
              <button
                onClick={() => setFilterType('sub05')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  filterType === 'sub05' ? 'bg-cyan-900/70 text-cyan-200 font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Nativos ≤ 0.5B ({totalSub05B})
              </button>
              <button
                onClick={() => setFilterType('quantized1bit')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  filterType === 'quantized1bit' ? 'bg-amber-950/70 text-amber-300 font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Quantizados 1-Bit ({totalQuantized})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Lotes CI (5 em 5):</span>
            <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setActiveBatchTab('all')}
                className={`px-2.5 py-1 rounded-md ${
                  activeBatchTab === 'all' ? 'bg-indigo-900/60 text-indigo-200' : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos
              </button>
              {availableBatches.map((b) => (
                <button
                  key={b}
                  onClick={() => setActiveBatchTab(b)}
                  className={`px-2.5 py-1 rounded-md ${
                    activeBatchTab === b ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Lote {b}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModels.map((model) => {
          const is1Bit = model.quantization !== 'native_fp16';
          const memorySavedPct = is1Bit
            ? Math.round((1 - model.quantizedSizeMB / model.nativeSizeFP16MB) * 100)
            : 0;

          return (
            <div
              key={model.id}
              className={`rounded-xl border transition-all duration-200 p-4.5 flex flex-col justify-between ${
                is1Bit
                  ? 'border-amber-900/40 bg-slate-900/80 hover:border-amber-600/50'
                  : 'border-cyan-900/40 bg-slate-900/80 hover:border-cyan-500/50'
              } hover:shadow-xl hover:shadow-black/50`}
            >
              <div>
                {/* Header tags */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    Lote {model.batchIndex}
                  </span>
                  {is1Bit ? (
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 flex items-center gap-1">
                      <Binary className="w-3 h-3 text-amber-400" />
                      1-Bit Quantized
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      Nativo ≤ 0.5B
                    </span>
                  )}
                </div>

                {/* Model Title */}
                <div className="mb-2">
                  <h3 className="font-bold text-white text-base tracking-tight flex items-center gap-1.5">
                    {model.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                    <span>{model.org}</span>
                    <span>•</span>
                    <span className="text-cyan-400 font-bold">{model.paramCountText}</span>
                  </div>
                </div>

                {/* Architecture spec */}
                <p className="text-xs text-slate-300 line-clamp-2 mb-3 bg-slate-950/60 rounded-md p-2 border border-slate-800/80 font-mono text-[11px]">
                  {model.architecture}
                </p>

                {/* Memory footprint comparison */}
                <div className="space-y-1.5 mb-3 bg-slate-950/90 rounded-lg p-2.5 border border-slate-800/60 text-xs font-mono">
                  <div className="flex justify-between items-center text-slate-400 text-[11px]">
                    <span>Tamanho FP16:</span>
                    <span className={is1Bit ? 'line-through text-slate-500' : 'text-slate-200'}>
                      {model.nativeSizeFP16MB} MB
                    </span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-slate-200">
                    <span className="flex items-center gap-1">
                      {is1Bit && <ArrowDownRight className="w-3.5 h-3.5 text-amber-400" />}
                      RAM no Runner:
                    </span>
                    <span className={is1Bit ? 'text-amber-300' : 'text-cyan-300'}>
                      {model.quantizedSizeMB} MB
                      {is1Bit && (
                        <span className="text-[10px] ml-1.5 text-emerald-400 font-normal">
                          (-{memorySavedPct}%)
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                    <span>Velocidade de Inferência:</span>
                    <span className="text-emerald-400 font-medium">
                      {model.scores.tokensPerSec} tok/s
                    </span>
                  </div>
                </div>

                {/* Warning if model would otherwise exceed runner limit */}
                {model.resourceLimits.warnings && model.resourceLimits.warnings.length > 0 && (
                  <div className="flex items-start gap-1.5 text-[10px] text-amber-300/90 bg-amber-950/30 border border-amber-900/40 rounded p-1.5 mb-3">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{model.resourceLimits.warnings[0]}</span>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <a
                  href={`https://huggingface.co/${model.huggingFaceRepo}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 font-mono transition-colors"
                >
                  <span>HuggingFace</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  onClick={() => onSelectModelForRunner(model)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs transition-all shadow shadow-cyan-600/20 active:scale-95 cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Testar no VUC</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
