import React, { useState } from 'react';
import { QuantizationEngine } from '../core/quantizationEngine';
import { 
  Binary, 
  Cpu, 
  Zap, 
  Layers, 
  ArrowRight, 
  Copy, 
  Check, 
  CheckCircle2, 
  AlertCircle,
  Sliders
} from 'lucide-react';

export const QuantizationStudio: React.FC = () => {
  const [paramsBillion, setParamsBillion] = useState<number>(1.58);
  const [sampleWeights, setSampleWeights] = useState<number[]>([
    0.82, -0.45, 0.05, -0.91, 0.33, -0.12, 0.74, -0.02, 0.65, -0.58, 0.11, -0.77
  ]);
  const [copiedCode, setCopiedCode] = useState(false);

  const savings = QuantizationEngine.analyzeModelSavings(paramsBillion);
  const quantizedSlice = QuantizationEngine.quantizeTensorSlice(sampleWeights);

  const pyTorchCode = QuantizationEngine.generatePyTorchBitLinearCode(
    `VucModel-${paramsBillion}B-BitNet1Bit`
  );

  const fitsInGitHubRunner = savings.quantizedSize1BitMB < 6500;
  const fp16FitsInRunner = savings.originalSizeFP16MB < 6500;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pyTorchCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleGenerateNewWeights = () => {
    const newWeights = Array.from({ length: 12 }, () =>
      Number(((Math.random() - 0.5) * 2).toFixed(2))
    );
    setSampleWeights(newWeights);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="rounded-2xl border border-amber-900/40 bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 text-[11px] font-mono font-medium flex items-center gap-1">
                <Binary className="w-3.5 h-3.5" />
                BitNet b1.58 (1-Bit LLM) Engine
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Regra VUC: Modelos &gt; 0.5B são quantizados em 1-Bit Ternário
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Motor de Quantização 1-Bit Ternária &#123;-1, 0, +1&#125;
            </h2>
            <p className="text-sm text-slate-300 max-w-3xl mt-1 leading-relaxed">
              O VUC transforma os tensores contínuos de modelos maiores que 0.5B (ex: 1B, 2B, 3.8B, 7B) em pesos ternários discretos. 
              Isso elimina multiplicações em ponto flutuante na CPU do GitHub runner, reduz a memória em ~89.8% e viabiliza a execução no CI.
            </p>
          </div>
        </div>
      </div>

      {/* Simulator: Parameter Slider & Runner Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-white font-bold">
              <Sliders className="w-4 h-4 text-amber-400" />
              Simulador de Escala de Parâmetros
            </span>
            <span className="text-amber-300 font-bold text-sm">{paramsBillion.toFixed(2)}B Parâmetros</span>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-mono flex justify-between mb-2">
              <span>Tamanho do Modelo:</span>
              <span className="text-cyan-400 font-bold">{paramsBillion} Bilhões</span>
            </label>
            <input
              type="range"
              min={0.6}
              max={8.0}
              step={0.1}
              value={paramsBillion}
              onChange={(e) => setParamsBillion(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>0.6B (Mínimo pós-0.5B)</span>
              <span>1.5B (Distill)</span>
              <span>3.8B (Phi-3)</span>
              <span>7.0B (Mistral)</span>
              <span>8.0B</span>
            </div>
          </div>

          {/* Comparison Cards: FP16 vs 1-Bit BitNet */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
              <div className="text-slate-400 text-[11px] mb-1">Original FP16</div>
              <div className="text-lg font-extrabold text-slate-300">
                {savings.originalSizeFP16MB} MB
              </div>
              <div className="mt-2 text-[10px] flex items-center gap-1 font-medium">
                {fp16FitsInRunner ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Cabe no Runner CI
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Excede limite 7GB (OOM)!
                  </span>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/60 text-xs font-mono">
              <div className="text-amber-400 text-[11px] mb-1 font-bold">1-Bit BitNet b1.58</div>
              <div className="text-lg font-extrabold text-amber-300">
                {savings.quantizedSize1BitMB} MB
              </div>
              <div className="mt-2 text-[10px] flex items-center gap-1 font-medium text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>-{savings.reductionPercentage}% de RAM</span>
              </div>
            </div>
          </div>

          {/* Energy & Speed metrics */}
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs font-mono space-y-2">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Zap className="w-3.5 h-3.5" /> Eficiência Aritmética (CPU):
              </span>
              <span className="font-bold text-emerald-400">71.4x Menos Energia</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Substitui computação $X \times W$ por somas binárias inteiras $\sum \pm X_i$. Elimina multiplicadores FP16.
            </p>
          </div>
        </div>

        {/* Live Tensor Slice Discretization */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-white font-bold">
                <Binary className="w-4 h-4 text-cyan-400" />
                Discretização Absmean em Tempo Real
              </span>
              <button
                onClick={handleGenerateNewWeights}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 cursor-pointer"
              >
                Gerar Novos Pesos
              </button>
            </div>

            {/* Formula display */}
            <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
              <div className="text-cyan-400 font-semibold">Fórmula de Quantização BitNet:</div>
              <div>&gamma; = mean(|W|) = {quantizedSlice.gamma}</div>
              <div>W_quant = Clip(Round(W / &gamma;), -1, +1) &isin; &#123;-1, 0, +1&#125;</div>
            </div>

            {/* Visual mapping: Continuous -> Ternary */}
            <div className="mt-3 space-y-2">
              <div className="text-xs font-mono text-slate-400">Amostra de 12 Pesos do Tensor:</div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {sampleWeights.map((w, idx) => {
                  const q = quantizedSlice.quantized[idx];
                  return (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-center font-mono text-[11px]"
                    >
                      <div className="text-slate-400 text-[10px]">{w}</div>
                      <div className="my-0.5 text-slate-600">&darr;</div>
                      <div
                        className={`font-bold px-1.5 py-0.5 rounded text-xs ${
                          q === 1
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : q === -1
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {q > 0 ? '+1' : q}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Distribution balance */}
          <div className="pt-3 border-t border-slate-800 text-xs font-mono flex items-center justify-between text-slate-400">
            <span>Distribuição Ternária:</span>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-rose-400">-1: {quantizedSlice.distribution.neg}%</span>
              <span className="text-slate-400">0: {quantizedSlice.distribution.zero}%</span>
              <span className="text-emerald-400">+1: {quantizedSlice.distribution.pos}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* PyTorch BitLinear Code Block */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-white font-bold">
            <Cpu className="w-4 h-4 text-emerald-400" />
            Código do Módulo PyTorch BitLinear para Runner CI
          </span>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono cursor-pointer transition-colors"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Copiado!' : 'Copiar PyTorch'}</span>
          </button>
        </div>

        <pre className="mt-3 p-4 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-xs text-cyan-300/90 overflow-x-auto max-h-72">
          {pyTorchCode}
        </pre>
      </div>
    </div>
  );
};
