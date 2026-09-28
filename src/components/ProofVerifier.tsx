import React, { useState, useEffect } from 'react';
import { VucProofAttestation } from '../types/vuc';
import { VucAdapter } from '../core/vucAdapter';
import { ProofStorageEngine, SavedVucProofItem } from '../core/proofStorage';
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  FileCheck, 
  AlertTriangle,
  Terminal,
  BookmarkPlus,
  BookmarkCheck,
  History,
  Trash2,
  Copy,
  Check,
  FolderOpen,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ProofVerifierProps {
  initialProof: VucProofAttestation | null;
}

export const ProofVerifier: React.FC<ProofVerifierProps> = ({ initialProof }) => {
  const [jsonInput, setJsonInput] = useState<string>(
    initialProof ? JSON.stringify(initialProof, null, 2) : ''
  );
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    computedRoot: string;
    expectedRoot: string;
    details: string;
    checks: {
      merkleTreeValid: boolean;
      weightsValid: boolean;
      runnerRamFits: boolean;
      stepCountMatches: boolean;
    };
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [savedProofs, setSavedProofs] = useState<SavedVucProofItem[]>([]);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState<boolean>(true);

  // Load saved proofs from browser local storage on mount
  useEffect(() => {
    const loaded = ProofStorageEngine.getStoredProofs();
    setSavedProofs(loaded);
  }, []);

  // If initialProof changed externally (e.g. sent from Runner)
  useEffect(() => {
    if (initialProof) {
      setJsonInput(JSON.stringify(initialProof, null, 2));
      setVerificationResult(null);
    }
  }, [initialProof]);

  const handleVerify = async (textToVerify = jsonInput) => {
    setIsVerifying(true);
    try {
      const parsed: VucProofAttestation = JSON.parse(textToVerify);
      const res = await VucAdapter.verifyProof(parsed);
      setVerificationResult(res);
      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const errRes = {
        isValid: false,
        computedRoot: 'JSON_SYNTAX_ERROR',
        expectedRoot: 'INVALID',
        details: `Falha ao processar arquivo JSON da prova: ${msg}`,
        checks: {
          merkleTreeValid: false,
          weightsValid: false,
          runnerRamFits: false,
          stepCountMatches: false,
        },
      };
      setVerificationResult(errRes);
      return errRes;
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveCurrentProof = () => {
    if (!jsonInput.trim()) return;

    const isValid = verificationResult ? verificationResult.isValid : true;
    const newItem = ProofStorageEngine.saveProofToStorage(jsonInput, isValid);
    
    // Refresh state
    const updated = ProofStorageEngine.getStoredProofs();
    setSavedProofs(updated);

    setSaveNotice(`Prova "${newItem.proofId}" salva no armazenamento local com sucesso!`);
    setTimeout(() => setSaveNotice(null), 3500);
  };

  const handleLoadSavedProof = (item: SavedVucProofItem) => {
    setJsonInput(item.rawJson);
    handleVerify(item.rawJson);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteSavedProof = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = ProofStorageEngine.deleteProofFromStorage(id);
    setSavedProofs(updated);
  };

  const handleClearAllSavedProofs = () => {
    if (window.confirm('Tem certeza de que deseja remover todas as provas salvas no navegador?')) {
      ProofStorageEngine.clearAllStoredProofs();
      setSavedProofs([]);
    }
  };

  const handleCopyJson = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSimulateTamper = () => {
    try {
      const parsed: VucProofAttestation = JSON.parse(jsonInput);
      if (parsed.trace && parsed.trace.length > 0) {
        // Tamper with a token in the trace
        parsed.trace[0].token = parsed.trace[0].token + '_TAMPERED';
        const tamperedStr = JSON.stringify(parsed, null, 2);
        setJsonInput(tamperedStr);
        handleVerify(tamperedStr);
      }
    } catch {
      alert('Carregue uma prova válida primeiro antes de simular adulteração.');
    }
  };

  const handleLoadSampleValidProof = async () => {
    // Generate fresh valid proof for SmolLM2-135M
    const dummyModel = {
      id: 'smollm2-135m-instruct',
      name: 'SmolLM2-135M-Instruct',
      org: 'Hugging Face',
      family: 'SmolLM',
      paramCountText: '135M',
      rawParamsBillion: 0.135,
      isSubHalfB: true,
      quantization: 'native_fp16' as const,
      batchIndex: 1,
      nativeSizeFP16MB: 270,
      quantizedSizeMB: 270,
      compressionRatio: '1.0x',
      architecture: 'Llama-style',
      huggingFaceRepo: 'HuggingFaceTB/SmolLM2-135M-Instruct',
      resourceLimits: { minRamMB: 480, diskMB: 350, estRunTimeSec: 6, runnerCompatible: true },
      scores: { reasoning: 60, coding: 55, math: 50, instruction: 65, overall: 58, vucVerificationMs: 8, tokensPerSec: 140 },
      status: 'verified' as const,
    };
    const adapter = new VucAdapter(dummyModel, 42);
    const proof = await adapter.runVerifiableInference('LiveBench Test Validation Sample', 16);
    const jsonStr = JSON.stringify(proof, null, 2);
    setJsonInput(jsonStr);
    handleVerify(jsonStr);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                VUC Cryptographic Attestation Auditor
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Merkle Tree &amp; Determinism Integrity Validator
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Verificador Independente de Provas VUC
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Valida se a inferência do modelo no GitHub runner foi gerada de forma reprodutível, recalculando a árvore Merkle de cada token.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSaveCurrentProof}
              disabled={!jsonInput.trim()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                !jsonInput.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 shadow-sm active:scale-95'
              }`}
              title="Salva a prova atual no armazenamento local do navegador para persistência entre sessões"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Salvar no Local Storage</span>
            </button>

            <button
              onClick={handleLoadSampleValidProof}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono cursor-pointer transition-colors"
            >
              Carregar Prova Exemplo
            </button>
            <button
              onClick={handleSimulateTamper}
              className="px-3 py-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 border border-rose-800/50 text-xs font-mono cursor-pointer transition-colors"
              title="Altera um bit de token no trace para verificar se o Merkle Tree rejeita imediatamente"
            >
              Simular Adulteração
            </button>
          </div>
        </div>

        {/* Save confirmation toast notice */}
        {saveNotice && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-xs font-mono flex items-center justify-between gap-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <BookmarkCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveNotice}</span>
            </div>
            <span className="text-[10px] text-emerald-400/80 font-bold">PERSISTIDO NO NAVEGADOR</span>
          </div>
        )}

        {/* Verification Result Banner */}
        {verificationResult && (
          <div
            className={`mt-4 p-4 rounded-xl border text-xs font-mono transition-all ${
              verificationResult.isValid
                ? 'bg-emerald-950/40 border-emerald-600/60 text-emerald-200'
                : 'bg-rose-950/40 border-rose-600/60 text-rose-200'
            }`}
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                {verificationResult.isValid ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>STATUS: PROVA VUC VERIFICADA COM SUCESSO [100% VÁLIDA]</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                    <span>STATUS: FALHA DE VERIFICAÇÃO / PROVA ADULTERADA [INVÁLIDA]</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveCurrentProof}
                  className="px-2 py-0.5 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <BookmarkPlus className="w-3 h-3 text-emerald-400" />
                  <span>Salvar Resultado</span>
                </button>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                  Auditoria Concluída
                </span>
              </div>
            </div>

            <p className="text-slate-300 text-[11px] leading-relaxed mb-3">
              {verificationResult.details}
            </p>

            {/* Check grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
              <div className="flex items-center gap-1.5">
                {verificationResult.checks.merkleTreeValid ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                )}
                <span>Árvore Merkle</span>
              </div>
              <div className="flex items-center gap-1.5">
                {verificationResult.checks.weightsValid ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                )}
                <span>Checksum Pesos</span>
              </div>
              <div className="flex items-center gap-1.5">
                {verificationResult.checks.runnerRamFits ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                )}
                <span>Limite 7GB Runner</span>
              </div>
              <div className="flex items-center gap-1.5">
                {verificationResult.checks.stepCountMatches ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                )}
                <span>Integridade de Tokens</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* JSON Payload Editor & Action */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-white font-bold">
            <Terminal className="w-4 h-4 text-cyan-400" />
            Payload de Atestação Criptográfica (.vuc.json)
          </span>
          <span className="text-slate-400 text-[11px]">
            Edite ou cole qualquer atestação gerada pelo runner CI
          </span>
        </div>

        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          rows={12}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-emerald-400/90 font-mono focus:outline-none focus:border-cyan-500 leading-normal"
          placeholder="Cole aqui o conteúdo JSON do arquivo de prova VUC..."
        />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <span className="text-xs text-slate-400 font-mono">
            VUC Core Protocol v1.0.4 • SHA-256 Merkle Proofing
          </span>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSaveCurrentProof}
              disabled={!jsonInput.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition-colors"
            >
              <BookmarkPlus className="w-4 h-4 text-emerald-400" />
              <span>Salvar no Armazenamento Local</span>
            </button>

            <button
              onClick={() => handleVerify()}
              disabled={isVerifying || !jsonInput.trim()}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg ${
                isVerifying || !jsonInput.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20 active:scale-95 cursor-pointer'
              }`}
            >
              {isVerifying ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Auditando Prova...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Auditar Prova Criptograficamente</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Cross-session Local Storage Saved Proofs History Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white text-sm">
              Provas VUC Salvas no Navegador (Persistência Cross-Session)
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
              {savedProofs.length} {savedProofs.length === 1 ? 'prova salva' : 'provas salvas'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {savedProofs.length > 0 && (
              <button
                onClick={handleClearAllSavedProofs}
                className="text-slate-400 hover:text-rose-400 text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
                title="Remove todas as provas salvas no localStorage deste navegador"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Todas</span>
              </button>
            )}

            <button
              onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
            >
              {isHistoryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isHistoryExpanded && (
          <div>
            {savedProofs.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-slate-500 border border-dashed border-slate-800 rounded-xl space-y-2">
                <BookmarkPlus className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="text-slate-400 font-bold">Nenhuma prova salva no armazenamento local ainda</div>
                <p className="max-w-md mx-auto text-slate-500">
                  Clique em &quot;Salvar no Local Storage&quot; após carregar ou auditar uma prova para mantê-la salva no navegador entre sessões.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {savedProofs.map((item) => {
                  const dateStr = new Date(item.savedAt).toLocaleString();
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleLoadSavedProof(item)}
                      className="p-3 bg-slate-950 hover:bg-slate-800/60 border border-slate-800 hover:border-slate-700 rounded-xl transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono group"
                    >
                      <div className="space-y-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white group-hover:text-cyan-300 transition-colors">
                            {item.modelName}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              item.isValid
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-rose-950 text-rose-300 border border-rose-800'
                            }`}
                          >
                            {item.status}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {item.tokensCount} tokens
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                          <span>
                            ID: <span className="text-slate-300">{item.proofId}</span>
                          </span>
                          <span>•</span>
                          <span>
                            Merkle: <span className="text-cyan-400/90">{item.merkleRoot.slice(0, 16)}...</span>
                          </span>
                          <span>•</span>
                          <span className="text-slate-500">{dateStr}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={(e) => handleCopyJson(item.rawJson, item.id, e)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 cursor-pointer transition-colors"
                          title="Copiar JSON"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={(e) => handleDeleteSavedProof(item.id, e)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800 cursor-pointer transition-colors"
                          title="Excluir prova do armazenamento local"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleLoadSavedProof(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <FolderOpen className="w-3 h-3" />
                          <span>Carregar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
