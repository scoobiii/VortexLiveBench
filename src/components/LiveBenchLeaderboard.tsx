import React, { useState } from 'react';
import { LLMModel } from '../types/vuc';
import { 
  Trophy, 
  Binary, 
  Sparkles, 
  ArrowUpDown, 
  CheckCircle2, 
  Zap, 
  Cpu, 
  Clock 
} from 'lucide-react';

interface LiveBenchLeaderboardProps {
  models: LLMModel[];
}

type SortField = 'overall' | 'reasoning' | 'coding' | 'math' | 'instruction' | 'vucVerificationMs' | 'tokensPerSec' | 'quantizedSizeMB';

export const LiveBenchLeaderboard: React.FC<LiveBenchLeaderboardProps> = ({ models }) => {
  const [sortField, setSortField] = useState<SortField>('overall');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      // For verification latency and RAM, lower is better, so default asc
      if (field === 'vucVerificationMs' || field === 'quantizedSizeMB') {
        setSortAsc(true);
      } else {
        setSortAsc(false);
      }
    }
  };

  const sortedModels = [...models].sort((a, b) => {
    let valA = 0;
    let valB = 0;

    switch (sortField) {
      case 'overall':
        valA = a.scores.overall;
        valB = b.scores.overall;
        break;
      case 'reasoning':
        valA = a.scores.reasoning;
        valB = b.scores.reasoning;
        break;
      case 'coding':
        valA = a.scores.coding;
        valB = b.scores.coding;
        break;
      case 'math':
        valA = a.scores.math;
        valB = b.scores.math;
        break;
      case 'instruction':
        valA = a.scores.instruction;
        valB = b.scores.instruction;
        break;
      case 'vucVerificationMs':
        valA = a.scores.vucVerificationMs;
        valB = b.scores.vucVerificationMs;
        break;
      case 'tokensPerSec':
        valA = a.scores.tokensPerSec;
        valB = b.scores.tokensPerSec;
        break;
      case 'quantizedSizeMB':
        valA = a.quantizedSizeMB;
        valB = b.quantizedSizeMB;
        break;
    }

    return sortAsc ? valA - valB : valB - valA;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800/60 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                LiveBench Evaluator
              </span>
              <span className="text-xs text-slate-400 font-mono">
                LiveBench Suite + VUC Cryptographic Metric Matrix
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Placar LiveBench de Modelos &lt;= 0.5B &amp; 1-Bit BitNet
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Compara acurácia de raciocínio, geração de código, velocidade de inferência (tok/s) e latência de validação Merkle no runner CI.
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4"># Pos</th>
                <th className="py-3 px-4">Modelo &amp; Família</th>
                <th className="py-3 px-4">Tipo &amp; Lote</th>
                <th
                  onClick={() => handleSort('overall')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Overall</span>
                    <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('reasoning')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Reasoning</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('coding')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Coding</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('tokensPerSec')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Tok/s</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('vucVerificationMs')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>VUC Verif.</span>
                    <ArrowUpDown className="w-3 h-3 text-emerald-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('quantizedSizeMB')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>RAM Runner</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {sortedModels.map((model, idx) => {
                const is1Bit = model.quantization !== 'native_fp16';
                return (
                  <tr
                    key={model.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-500">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      <div className="flex flex-col">
                        <span>{model.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {model.org} • {model.paramCountText}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          Lote {model.batchIndex}
                        </span>
                        {is1Bit ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/50">
                            1-Bit
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                            Sub-0.5B
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-cyan-300 text-sm">
                      {model.scores.overall}
                    </td>
                    <td className="py-3.5 px-4 text-slate-200">
                      {model.scores.reasoning}%
                    </td>
                    <td className="py-3.5 px-4 text-slate-200">
                      {model.scores.coding}%
                    </td>
                    <td className="py-3.5 px-4 text-emerald-400 font-medium">
                      {model.scores.tokensPerSec}
                    </td>
                    <td className="py-3.5 px-4 text-cyan-400">
                      {model.scores.vucVerificationMs} ms
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {model.quantizedSizeMB} MB
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
