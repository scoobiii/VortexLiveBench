import { describe, it, expect } from 'vitest';
import { sha256, computeMerkleRoot, VucAdapter } from '../src/core/vucAdapter';
import { LLMModel, VucProofAttestation } from '../src/types/vuc';

const mockModel: LLMModel = {
  id: 'test-model-0.5b',
  name: 'Test-Model-0.5B',
  org: 'TestOrg',
  family: 'TestFamily',
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

describe('vucAdapter', () => {
  describe('sha256', () => {
    it('computes expected SHA-256 digest for known string', async () => {
      const hash = await sha256('hello vuc');
      expect(hash).toHaveLength(64);
      expect(typeof hash).toBe('string');
      // Deterministic
      const hash2 = await sha256('hello vuc');
      expect(hash).toBe(hash2);
    });
  });

  describe('computeMerkleRoot', () => {
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

    it('handles odd number of leaves (e.g. 3 leaves)', async () => {
      const l1 = await sha256('leaf-1');
      const l2 = await sha256('leaf-2');
      const l3 = await sha256('leaf-3');
      const root = await computeMerkleRoot([l1, l2, l3]);
      expect(root).toHaveLength(64);
    });
  });

  describe('VucAdapter Class', () => {
    it('initializes with default seed and executes verifiable inference', async () => {
      const adapter = new VucAdapter(mockModel);
      const attestation = await adapter.runVerifiableInference('Test prompt', 4);

      expect(attestation.status).toBe('VERIFIED_VALID');
      expect(attestation.trace).toHaveLength(4);
      expect(attestation.execution.tokens_count).toBe(4);
      expect(attestation.execution.prompt).toBe('Test prompt');
      expect(attestation.model.id).toBe(mockModel.id);
      expect(attestation.execution.merkle_root).toHaveLength(64);
      expect(attestation.execution.reproducibility_signature).toContain('ED25519_VUC_');
    });

    it('executes with custom seed and calls onProgress callback', async () => {
      const adapter = new VucAdapter(mockModel, 12345);
      const progressCalls: Array<{ step: number; text: string }> = [];

      const attestation = await adapter.runVerifiableInference('Another prompt', 2, (step, partial) => {
        progressCalls.push({ step: step.step, text: partial });
      });

      expect(progressCalls.length).toBe(2);
      expect(progressCalls[0].step).toBe(1);
      expect(progressCalls[1].step).toBe(2);
      expect(attestation.trace.length).toBe(2);
    });

    it('verifies a valid proof attestation successfully', async () => {
      const adapter = new VucAdapter(mockModel, 999);
      const attestation = await adapter.runVerifiableInference('Verification prompt', 3);

      const verification = await VucAdapter.verifyProof(attestation);
      expect(verification.isValid).toBe(true);
      expect(verification.checks.merkleTreeValid).toBe(true);
      expect(verification.checks.runnerRamFits).toBe(true);
      expect(verification.checks.stepCountMatches).toBe(true);
      expect(verification.computedRoot).toBe(attestation.execution.merkle_root);
      expect(verification.details).toContain('100% verified');
    });

    it('detects tampering when leaf token hash is altered', async () => {
      const adapter = new VucAdapter(mockModel, 42);
      const attestation = await adapter.runVerifiableInference('Tamper test prompt', 3);

      // Mutate trace token
      attestation.trace[0].token = 'TAMPERED_TOKEN';

      const verification = await VucAdapter.verifyProof(attestation);
      expect(verification.isValid).toBe(false);
      expect(verification.checks.merkleTreeValid).toBe(false);
      expect(verification.computedRoot).toContain('MISMATCH_LEAF_0');
      expect(verification.details).toContain('Possible state tampering');
    });

    it('detects when runner RAM exceeds 7168 MB ceiling', async () => {
      const adapter = new VucAdapter(mockModel, 42);
      const attestation = await adapter.runVerifiableInference('RAM check prompt', 2);

      // Force peak RAM above GitHub runner limit
      attestation.execution.peak_ram_mb = 9500;

      const verification = await VucAdapter.verifyProof(attestation);
      expect(verification.isValid).toBe(false);
      expect(verification.checks.runnerRamFits).toBe(false);
      expect(verification.details).toContain('exceeded runner ceiling');
    });

    it('detects when trace step count does not match tokens_count', async () => {
      const adapter = new VucAdapter(mockModel, 42);
      const attestation = await adapter.runVerifiableInference('Token count check prompt', 3);

      // Alter tokens count
      attestation.execution.tokens_count = 10;

      const verification = await VucAdapter.verifyProof(attestation);
      expect(verification.isValid).toBe(false);
      expect(verification.checks.stepCountMatches).toBe(false);
    });

    it('handles unexpected exceptions and returns error verification result', async () => {
      // Pass corrupted object that will throw Error in iteration
      const corrupted = {
        execution: { merkle_root: 'fake' },
        trace: null,
      } as unknown as VucProofAttestation;

      const verification = await VucAdapter.verifyProof(corrupted);
      expect(verification.isValid).toBe(false);
      expect(verification.computedRoot).toBe('ERROR');
      expect(verification.details).toContain('Verification exception:');

      // Test non-Error thrown (e.g. string thrown)
      const throwingNonError = {
        execution: { merkle_root: 'fake' },
        get trace() {
          throw 'custom string exception';
        },
      } as unknown as VucProofAttestation;

      const nonErrorVerification = await VucAdapter.verifyProof(throwingNonError);
      expect(nonErrorVerification.isValid).toBe(false);
      expect(nonErrorVerification.details).toContain('custom string exception');
    });
  });
});
