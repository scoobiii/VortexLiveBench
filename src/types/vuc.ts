export type QuantizationType = 'native_fp16' | 'bitnet_b1.58' | 'w1a8_ternary' | 'int4';

export interface ModelResourceLimit {
  minRamMB: number;
  diskMB: number;
  estRunTimeSec: number;
  runnerCompatible: boolean;
  warnings?: string[];
}

export interface LiveBenchScore {
  reasoning: number;      // 0-100
  coding: number;         // 0-100
  math: number;           // 0-100
  instruction: number;    // 0-100
  overall: number;        // weighted average
  vucVerificationMs: number; // latency to cryptographically verify trace
  tokensPerSec: number;
}

export interface LLMModel {
  id: string;
  name: string;
  org: string;
  family: string;
  paramCountText: string;
  rawParamsBillion: number;
  isSubHalfB: boolean; // <= 0.5B
  quantization: QuantizationType;
  batchIndex: number;  // 1 for first 5, 2 for next 5, 3 for next 5...
  nativeSizeFP16MB: number;
  quantizedSizeMB: number;
  compressionRatio: string;
  architecture: string;
  huggingFaceRepo: string;
  resourceLimits: ModelResourceLimit;
  scores: LiveBenchScore;
  status: 'verified' | 'ready' | 'running' | 'completed';
  sampleOutput?: string;
  vucProofId?: string;
}

export interface MerkleStep {
  step: number;
  token: string;
  tokenId: number;
  logitMax: number;
  hash: string;
  parentHash: string;
}

export interface VucProofAttestation {
  vuc_spec_version: string;
  proof_id: string;
  created_at: string;
  model: {
    id: string;
    name: string;
    quantization: QuantizationType;
    params_b: number;
    weights_sha256: string;
    tensor_merkle_root: string;
    public_key_hex?: string;
  };
  execution: {
    prompt: string;
    prompt_hash: string;
    seed: number;
    temperature: number;
    output_text: string;
    tokens_count: number;
    merkle_root: string;
    reproducibility_signature: string;
    signature_ed25519_hex?: string;
    execution_time_ms: number;
    verification_time_ms: number;
    peak_ram_mb: number;
    runner_env: string;
  };
  trace: MerkleStep[];
  status: 'VERIFIED_VALID' | 'TAMPERED_INVALID' | 'UNVERIFIED';
}

export interface LiveBenchTask {
  id: string;
  title: string;
  category: 'reasoning' | 'coding' | 'math' | 'instruction';
  prompt: string;
  expectedKeywords: string[];
  referenceOutputSnippet: string;
}

export interface CiRunnerConfig {
  runnerType: 'ubuntu-latest' | 'ubuntu-22.04' | 'self-hosted-arm64';
  maxRunnerRamMB: number; // 7168 MB standard GitHub runner
  maxDiskMB: number;      // 14336 MB
  batchSize: number;      // 5
  activeBatchCount: number;
  enable1BitQuantization: boolean;
  enableVucVerificationAssert: boolean;
  parallelJobs: number;
}

// ==========================================
// VUC LLM RUNTIME ADAPTER CONTRACT (SPRINT 1)
// ==========================================

export type ExecutionState =
  | 'DISCOVERED'
  | 'DOWNLOADED'
  | 'LOADED'
  | 'EXECUTED'
  | 'MEASURED'
  | 'VERIFIED'
  | 'FAILED';

export type ComponentFidelity = 'REAL' | 'PARTIAL' | 'MOCK' | 'UNVERIFIED';

export type RuntimeType = 'transformers' | 'llamacpp' | 'bitnet' | 'bend' | 'onnx';
export type DeviceTarget = 'cpu' | 'cuda' | 'metal' | 'bend';

export interface ModelSpec {
  id: string;
  name: string;
  repoOrPath: string;
  runtime: RuntimeType;
  device: DeviceTarget;
  quantization: QuantizationType;
  paramCountBillion: number;
  weightsSha256: string;
  tensorMerkleRoot: string;
  tokenizerName: string;
}

export interface ExecutionMetrics {
  latencyMs: number;
  throughputTokensPerSec: number;
  timeToFirstTokenMs: number;
  totalDurationMs: number;
  peakRamMb: number;
  peakVramMb?: number;
  cpuUtilizationPercent?: number;
}

export interface ExecutionResult {
  state: ExecutionState;
  fidelity: ComponentFidelity;
  model: ModelSpec;
  prompt: string;
  promptHash: string;
  seed: number;
  temperature: number;
  outputText: string;
  tokens: { token: string; tokenId: number }[];
  trace: MerkleStep[];
  merkleRoot: string;
  signatureEd25519: string;
  publicKeyHex: string;
  metrics: ExecutionMetrics;
  attestation: VucProofAttestation;
  taskScore?: number;
  error?: string;
}

export interface IVucLlmAdapter {
  resolveModel(modelSpec: ModelSpec): Promise<boolean>;
  load(modelSpec: ModelSpec): Promise<boolean>;
  tokenize(text: string): Promise<{ tokens: string[]; tokenIds: number[] }>;
  infer(prompt: string, maxTokens?: number, seed?: number): Promise<ExecutionResult>;
  collectMetrics(): ExecutionMetrics;
  emitExecutionEvidence(result: ExecutionResult): VucProofAttestation;
  verifyAttestation(attestation: VucProofAttestation): Promise<{ isValid: boolean; details: string }>;
}

