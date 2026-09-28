import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  sha256,
  computeMerkleRoot,
  VucAdapter,
  VucLlmRuntimeAdapter,
  Ed25519Engine,
  TokenizerVocabEngine,
} from '../src/core/vucAdapter';
import { LLMModel, VucProofAttestation, ModelSpec } from '../src/types/vuc';

const mockModel: LLMModel = {
  id: 'test-model-0.5b',
  name: 'Test-Model-0.5B',
  org: 'TestOrg',
  family: 'Qwen',
  paramCountText: '0.5B',
  rawParamsBillion: 0.5,
  isSubHalfB: true,
  quantization: 'native_fp16',
  batchIndex: 1,
  nativeSizeFP16MB: 1000,
  quantizedSizeMB: 1000,
  compressionRatio: '1.0x',
  architecture: 'Transformer-Test',
  huggingFaceRepo: 'test/model',
  resourceLimits: {
    minRamMB: 1200,
    diskMB: 1000,
    estRunTimeSec: 10,
    runnerCompatible: true,
  },
  scores: {
    reasoning: 70,
    coding: 70,
    math: 70,
    instruction: 70,
    overall: 70,
    vucVerificationMs: 15,
    tokensPerSec: 60,
  },
  status: 'verified',
};

describe('vucAdapter with strict VUC Rules', () => {
  beforeEach(() => {
    Ed25519Engine.clearCache();
  });

  describe('sha256 & computeMerkleRoot', () => {
    it('computes expected SHA-256 digest for known string', async () => {
      const hash = await sha256('hello vuc');
      expect(hash).toHaveLength(64);
      expect(typeof hash).toBe('string');
      const hash2 = await sha256('hello vuc');
      expect(hash).toBe(hash2);
    });

    it('returns fallback root when leafHashes is empty', async () => {
      const root = await computeMerkleRoot([]);
      expect(root).toBe(await sha256('vuc_empty_execution_tree'));
    });

    it('returns single hash when only 1 leaf is passed', async () => {
      const leaf = await sha256('leaf-0');
      const root = await computeMerkleRoot([leaf]);
      expect(root).toBe(leaf);
    });

    it('combines 2 leaves into a single parent hash', async () => {
      const l1 = await sha256('leaf-1');
      const l2 = await sha256('leaf-2');
      const expected = await sha256(l1 + l2);
      const root = await computeMerkleRoot([l1, l2]);
      expect(root).toBe(expected);
    });

    it('handles odd number of leaves (3 leaves)', async () => {
      const l1 = await sha256('leaf-1');
      const l2 = await sha256('leaf-2');
      const l3 = await sha256('leaf-3');
      const root = await computeMerkleRoot([l1, l2, l3]);
      expect(root).toHaveLength(64);
    });
  });

  describe('Ed25519Engine', () => {
    it('generates real Ed25519 keypair and exports 64-hex-char public key', async () => {
      const { publicKeyHex, keyPair } = await Ed25519Engine.getOrGenerateModelKeyPair('model-test-1');
      expect(publicKeyHex).toHaveLength(64);
      expect(keyPair.privateKey).toBeDefined();

      // Retrieve cached
      const cached = await Ed25519Engine.getOrGenerateModelKeyPair('model-test-1');
      expect(cached.publicKeyHex).toBe(publicKeyHex);
    });

    it('signs and verifies 32-byte merkle root producing 128-hex-char signature', async () => {
      const { publicKeyHex, keyPair } = await Ed25519Engine.getOrGenerateModelKeyPair('model-test-2');
      const testRoot = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const sigHex = await Ed25519Engine.signMerkleRoot(keyPair.privateKey, testRoot);

      expect(sigHex).toHaveLength(128);

      const isValid = await Ed25519Engine.verifySignature(publicKeyHex, sigHex, testRoot);
      expect(isValid).toBe(true);

      // Fails on tampered data
      const isTamperedValid = await Ed25519Engine.verifySignature(publicKeyHex, sigHex, testRoot + '_tampered');
      expect(isTamperedValid).toBe(false);

      // Fails on invalid input lengths or invalid hex
      expect(await Ed25519Engine.verifySignature(undefined, sigHex, testRoot)).toBe(false);
      expect(await Ed25519Engine.verifySignature(publicKeyHex, 'invalid-sig', testRoot)).toBe(false);

      // Throws on WebCrypto error
      const spy = vi.spyOn(crypto.subtle, 'importKey').mockRejectedValueOnce(new Error('Subtle crypto error'));
      expect(await Ed25519Engine.verifySignature(publicKeyHex, sigHex, testRoot)).toBe(false);
      spy.mockRestore();
    });
  });

  describe('TokenizerVocabEngine', () => {
    it('returns known tokenIds for vocab words', () => {
      expect(TokenizerVocabEngine.getTokenId('VERIFIABLE')).toBe(44321);
      expect(TokenizerVocabEngine.getTokenId('STATE')).toBe(19842);
      expect(TokenizerVocabEngine.getTokenId('YES')).toBe(9642);
    });

    it('computes deterministic tokenId for words not in the explicit map', () => {
      const id1 = TokenizerVocabEngine.getTokenId('UnknownWord123', 'qwen');
      const id2 = TokenizerVocabEngine.getTokenId('UnknownWord123', 'qwen');
      expect(id1).toBe(id2);
      expect(id1).toBeGreaterThanOrEqual(0);
      expect(id1).toBeLessThan(151643);
    });

    it('resolves correct vocab sizes per model family', () => {
      expect(TokenizerVocabEngine.getVocabSize('qwen')).toBe(151643);
      expect(TokenizerVocabEngine.getVocabSize('llama')).toBe(128256);
      expect(TokenizerVocabEngine.getVocabSize('smollm')).toBe(49152);
      expect(TokenizerVocabEngine.getVocabSize('bitnet')).toBe(32000);
      expect(TokenizerVocabEngine.getVocabSize('other')).toBe(32000);
    });
  });

  describe('VucAdapter Core & Anti-Mock Rules', () => {
    it('Rule 1: Determinism - same seed produces identical trace and merkle_root', async () => {
      const adapterA = new VucAdapter(mockModel, 42);
      const adapterB = new VucAdapter(mockModel, 42);

      const runA = await adapterA.runVerifiableInference('Deterministic prompt', 4);
      const runB = await adapterB.runVerifiableInference('Deterministic prompt', 4);

      expect(runA.execution.merkle_root).toBe(runB.execution.merkle_root);
      expect(runA.trace.length).toBe(runB.trace.length);

      for (let i = 0; i < runA.trace.length; i++) {
        expect(runA.trace[i].token).toBe(runB.trace[i].token);
        expect(runA.trace[i].tokenId).toBe(runB.trace[i].tokenId);
        expect(runA.trace[i].hash).toBe(runB.trace[i].hash);
        expect(runA.trace[i].parentHash).toBe(runB.trace[i].parentHash);
      }
    });

    it('Rule 2: Chained trace - step 1 parentHash = prompt_hash, each step hashes parentHash + token + tokenId', async () => {
      const adapter = new VucAdapter(mockModel, 100);
      const prompt = 'Test chain prompt';
      const attestation = await adapter.runVerifiableInference(prompt, 3);

      expect(attestation.trace[0].parentHash).toBe(attestation.execution.prompt_hash);
      expect(attestation.trace[1].parentHash).toBe(attestation.trace[0].hash);
      expect(attestation.trace[2].parentHash).toBe(attestation.trace[1].hash);

      // Verify each step hash
      for (const step of attestation.trace) {
        const expected = await sha256(`${step.parentHash}:${step.token.trim()}:${step.tokenId}`);
        expect(step.hash).toBe(expected);
      }
    });

    it('Rule 3: Validade não é correção - validity and correctness are separate checks', async () => {
      const adapter = new VucAdapter(mockModel, 42);
      const attestation = await adapter.runVerifiableInference('Is 2+2=4? Answer YES or NO', 4);

      // Check with keyword present in output
      const firstToken = attestation.trace[0].token.trim();
      const resWithKw = await VucAdapter.verifyProof(attestation, [firstToken]);
      expect(resWithKw.isValid).toBe(true);
      expect(resWithKw.isCorrect).toBe(true);

      // Check with impossible keyword: trace is 100% valid, but output does not meet task quality
      const resMissingKw = await VucAdapter.verifyProof(attestation, ['IMPOSSIBLE_KEYWORD_NOT_IN_OUTPUT']);
      expect(resMissingKw.isValid).toBe(true);
      expect(resMissingKw.isCorrect).toBe(false);
      expect(resMissingKw.checks.outputCorrectness).toBe(false);
      expect(resMissingKw.details).toContain('Quality alert: output does not meet task requirements');
    });

    it('Rule 4: Real Ed25519 signature - signature is 128 hex chars, not synthetic string', async () => {
      const adapter = new VucAdapter(mockModel, 777);
      const attestation = await adapter.runVerifiableInference('Real signature prompt', 3);

      expect(attestation.execution.reproducibility_signature).toHaveLength(128);
      expect(attestation.model.public_key_hex).toHaveLength(64);
      expect(attestation.execution.reproducibility_signature).not.toContain('..._VALID');

      const verification = await VucAdapter.verifyProof(attestation);
      expect(verification.isValid).toBe(true);
      expect(verification.checks.signatureEd25519Valid).toBe(true);
    });

    it('detects tampering when a token or tokenId is altered', async () => {
      const adapter = new VucAdapter(mockModel, 42);
      const attestation = await adapter.runVerifiableInference('Tamper test', 3);

      attestation.trace[0].token = 'TAMPERED';
      const ver = await VucAdapter.verifyProof(attestation);
      expect(ver.isValid).toBe(false);
      expect(ver.checks.merkleTreeValid).toBe(false);
      expect(ver.computedRoot).toContain('MISMATCH_LEAF_0');
    });

    it('detects parentHash chain breakage or out-of-range tokenId', async () => {
      const adapter = new VucAdapter(mockModel, 42);
      const attestation = await adapter.runVerifiableInference('Chain break test', 3);

      // Alter parentHash of step 2 without updating step hash
      attestation.trace[1].parentHash = 'broken_parent_hash';
      const ver = await VucAdapter.verifyProof(attestation);
      expect(ver.isValid).toBe(false);
      expect(ver.checks.parentHashChainValid).toBe(false);

      // Test negative or out of range tokenId with consistent hash
      const attestation2 = await adapter.runVerifiableInference('Vocab test', 1);
      attestation2.trace[0].tokenId = -99;
      attestation2.trace[0].hash = await sha256(
        `${attestation2.trace[0].parentHash}:${attestation2.trace[0].token.trim()}:-99`
      );
      attestation2.execution.merkle_root = attestation2.trace[0].hash;
      const { keyPair } = await Ed25519Engine.getOrGenerateModelKeyPair(mockModel.id);
      attestation2.execution.reproducibility_signature = await Ed25519Engine.signMerkleRoot(
        keyPair.privateKey,
        attestation2.execution.merkle_root
      );
      const ver2 = await VucAdapter.verifyProof(attestation2);
      expect(ver2.isValid).toBe(false);
      expect(ver2.checks.tokenIdsInVocab).toBe(false);
    });

    it('detects when runner RAM exceeds 7168 MB ceiling', async () => {
      const adapter = new VucAdapter(mockModel, 42);
      const attestation = await adapter.runVerifiableInference('RAM limit test', 2);
      attestation.execution.peak_ram_mb = 9500;

      const ver = await VucAdapter.verifyProof(attestation);
      expect(ver.isValid).toBe(false);
      expect(ver.checks.runnerRamFits).toBe(false);
    });

    it('detects step count mismatch', async () => {
      const adapter = new VucAdapter(mockModel, 42);
      const attestation = await adapter.runVerifiableInference('Step count test', 2);
      attestation.execution.tokens_count = 10;

      const ver = await VucAdapter.verifyProof(attestation);
      expect(ver.isValid).toBe(false);
      expect(ver.checks.stepCountMatches).toBe(false);
    });

    it('handles unexpected exceptions and returns error verification result', async () => {
      const corrupted = {
        execution: { merkle_root: 'fake' },
        trace: null,
      } as unknown as VucProofAttestation;

      const verification = await VucAdapter.verifyProof(corrupted);
      expect(verification.isValid).toBe(false);
      expect(verification.computedRoot).toBe('ERROR');
      expect(verification.details).toContain('Verification exception:');

      const throwingNonError = {
        model: { name: 'Qwen' },
        execution: { merkle_root: 'fake', prompt_hash: 'phash' },
        get trace() {
          throw 'custom string exception';
        },
      } as unknown as VucProofAttestation;

      const nonErrorVerification = await VucAdapter.verifyProof(throwingNonError);
      expect(nonErrorVerification.isValid).toBe(false);
      expect(nonErrorVerification.details).toContain('custom string exception');
    });

    it('executes onProgress callback with smooth yield', async () => {
      const adapter = new VucAdapter(mockModel, 42);
      const progressSteps: number[] = [];
      await adapter.runVerifiableInference('Yield test', 2, (step) => {
        progressSteps.push(step.step);
      });
      expect(progressSteps).toEqual([1, 2]);
    });
  });

  describe('VucLlmRuntimeAdapter (Sprint 1 Contract)', () => {
    const validSpec: ModelSpec = {
      id: 'smollm2-135m-instruct',
      name: 'SmolLM2-135M-Instruct',
      repoOrPath: 'HuggingFaceTB/SmolLM2-135M-Instruct',
      runtime: 'transformers',
      device: 'cpu',
      quantization: 'native_fp16',
      paramCountBillion: 0.135,
      weightsSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      tensorMerkleRoot: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
      tokenizerName: 'smollm2',
    };

    it('resolves valid modelSpec and rejects incomplete spec', async () => {
      const adapter = new VucLlmRuntimeAdapter();
      const ok = await adapter.resolveModel(validSpec);
      expect(ok).toBe(true);

      const invalidSpec = { ...validSpec, weightsSha256: '' };
      const fail = await adapter.resolveModel(invalidSpec);
      expect(fail).toBe(false);
    });

    it('loads resolved model and fails on invalid spec', async () => {
      const adapter = new VucLlmRuntimeAdapter();
      const loaded = await adapter.load(validSpec);
      expect(loaded).toBe(true);

      const invalidSpec = { ...validSpec, id: '' };
      const loadedFail = await adapter.load(invalidSpec);
      expect(loadedFail).toBe(false);
    });

    it('tokenizes prompt with real token IDs from tokenizer vocabulary', async () => {
      const adapter = new VucLlmRuntimeAdapter(validSpec);
      const { tokens, tokenIds } = await adapter.tokenize('VERIFIABLE Merkle root');
      expect(tokens).toEqual(['VERIFIABLE', 'Merkle', 'root']);
      expect(tokenIds).toEqual([44321, 21491, 3110]);

      // Fallback for empty text
      const empty = await adapter.tokenize('');
      expect(empty.tokens).toHaveLength(2);
      expect(empty.tokenIds).toHaveLength(2);
    });

    it('executes infer() and returns ExecutionResult with REAL fidelity', async () => {
      const adapter = new VucLlmRuntimeAdapter(validSpec);
      await adapter.load(validSpec);

      const res = await adapter.infer('What is 2+2?', 4, 42);
      expect(res.state).toBe('EXECUTED');
      expect(res.fidelity).toBe('REAL');
      expect(res.model).toEqual(validSpec);
      expect(res.promptHash).toHaveLength(64);
      expect(res.merkleRoot).toHaveLength(64);
      expect(res.signatureEd25519).toHaveLength(128);
      expect(res.trace.length).toBeGreaterThan(0);
      expect(res.metrics.latencyMs).toBeGreaterThanOrEqual(0);
      expect(res.metrics.throughputTokensPerSec).toBeGreaterThan(0);

      // Verify collected metrics
      const metrics = adapter.collectMetrics();
      expect(metrics.totalDurationMs).toBeGreaterThanOrEqual(0);

      // Verify emitExecutionEvidence returns attestation
      const evidence = adapter.emitExecutionEvidence(res);
      expect(evidence.proof_id).toBeDefined();

      // Verify attestation with verifyAttestation()
      const ver = await adapter.verifyAttestation(evidence);
      expect(ver.isValid).toBe(true);
    });

    it('throws error when infer() is called without load/resolve', async () => {
      const adapter = new VucLlmRuntimeAdapter();
      await expect(adapter.infer('prompt')).rejects.toThrow('No ModelSpec resolved before infer()');
    });
  });
});
