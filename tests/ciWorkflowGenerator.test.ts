import { describe, it, expect } from 'vitest';
import { CiWorkflowGenerator } from '../src/core/ciWorkflowGenerator';
import { INITIAL_MODELS } from '../src/data/modelsCatalog';

describe('CiWorkflowGenerator', () => {
  describe('generateWorkflowYaml', () => {
    it('generates GitHub Actions workflow for 1 batch of 5 models', () => {
      const yaml = CiWorkflowGenerator.generateWorkflowYaml(1, INITIAL_MODELS);
      expect(yaml).toContain('name: VUC LiveBench & 1-Bit Matrix Verification');
      expect(yaml).toContain('batches=["batch-1"]');
      expect(yaml).toContain('runs-on: ubuntu-latest');
      expect(yaml).toContain('Verify 100% CI Test Coverage');
      expect(yaml).toContain('npm run test:coverage');
      expect(yaml).toContain('--ram-guard-mb 7000');
      expect(yaml).toContain('--verify-merkle');
      expect(yaml).toContain('actions/upload-artifact@v4');
    });

    it('generates matrix strategy for multiple batches (e.g. 3 batches)', () => {
      const yaml = CiWorkflowGenerator.generateWorkflowYaml(3, INITIAL_MODELS);
      expect(yaml).toContain('["batch-1","batch-2","batch-3"]');
      expect(yaml).toContain('timeout-minutes: 180');
    });
  });

  describe('generatePythonHarnessScript', () => {
    it('generates full executable python harness script with runner logic', () => {
      const script = CiWorkflowGenerator.generatePythonHarnessScript();
      expect(script).toContain('#!/usr/bin/env python3');
      expect(script).toContain('def sha256_str(data: str) -> str:');
      expect(script).toContain('def compute_merkle_root(leaf_hashes: List[str]) -> str:');
      expect(script).toContain('def run_vuc_inference_proof');
      expect(script).toContain('batch_map = {');
      expect(script).toContain('"batch-1": [');
      expect(script).toContain('"batch-2": [');
      expect(script).toContain('"batch-3": [');
      expect(script).toContain('vuc_spec_version');
      expect(script).toContain('VERIFIED_VALID');
    });
  });

  describe('generateBatchExecutionLogsJson', () => {
    it('generates structured simulated execution logs for batch 1', () => {
      const jsonStr = CiWorkflowGenerator.generateBatchExecutionLogsJson(1, INITIAL_MODELS);
      const parsed = JSON.parse(jsonStr);

      expect(parsed.vuc_spec_version).toBe('1.0.4-livebench');
      expect(parsed.batch_index).toBe(1);
      expect(parsed.batch_tag).toBe('batch-1');
      expect(parsed.models_evaluated_count).toBe(5);
      expect(parsed.batch_merkle_attestations.length).toBe(5);
      expect(parsed.aggregate_summary.all_merkle_roots_verified).toBe(true);
      expect(parsed.aggregate_summary.zero_tampering_detected).toBe(true);
    });

    it('falls back to default slice when an unknown batch index is requested or models without proofId', () => {
      const modelsWithoutProof = INITIAL_MODELS.map((m) => ({ ...m, vucProofId: undefined, batchIndex: 99 }));
      const jsonStr = CiWorkflowGenerator.generateBatchExecutionLogsJson(42, modelsWithoutProof);
      const parsed = JSON.parse(jsonStr);

      expect(parsed.models_evaluated_count).toBe(5);
      expect(parsed.batch_merkle_attestations[0].attestation.proof_id).toContain('vuc_prf_');
      expect(parsed.batch_merkle_attestations[0].attestation.merkle_root).toBe(
        '0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      );
    });
  });
});
