import { describe, it, expect } from 'vitest';
import { INITIAL_MODELS, GITHUB_ACTIONS_RUNNER_LIMITS } from '../src/data/modelsCatalog';
import { LIVEBENCH_TASKS } from '../src/data/liveBenchTasks';

describe('modelsCatalog', () => {
  it('contains exactly 15 models partitioned in 3 batches of 5', () => {
    expect(INITIAL_MODELS.length).toBe(15);

    const batch1 = INITIAL_MODELS.filter((m) => m.batchIndex === 1);
    const batch2 = INITIAL_MODELS.filter((m) => m.batchIndex === 2);
    const batch3 = INITIAL_MODELS.filter((m) => m.batchIndex === 3);

    expect(batch1).toHaveLength(5);
    expect(batch2).toHaveLength(5);
    expect(batch3).toHaveLength(5);
  });

  it('correctly classifies sub-0.5B models as native and >0.5B models as 1-bit quantized', () => {
    for (const model of INITIAL_MODELS) {
      if (model.rawParamsBillion <= 0.5) {
        expect(model.isSubHalfB).toBe(true);
        expect(model.quantization).toBe('native_fp16');
      } else {
        expect(model.isSubHalfB).toBe(false);
        expect(['bitnet_b1.58', 'w1a8_ternary']).toContain(model.quantization);
        expect(model.quantizedSizeMB).toBeLessThan(model.nativeSizeFP16MB);
      }
    }
  });

  it('ensures all models fit within GitHub Actions runner 7GB limit', () => {
    for (const model of INITIAL_MODELS) {
      expect(model.quantizedSizeMB).toBeLessThan(GITHUB_ACTIONS_RUNNER_LIMITS.maxRamMB);
    }
  });
});

describe('liveBenchTasks', () => {
  it('provides all 4 core LiveBench benchmark categories', () => {
    expect(LIVEBENCH_TASKS.length).toBeGreaterThanOrEqual(4);
    const categories = LIVEBENCH_TASKS.map((t) => t.category);
    expect(categories).toContain('reasoning');
    expect(categories).toContain('coding');
    expect(categories).toContain('math');
    expect(categories).toContain('instruction');
  });

  it('contains expected prompt and keywords in every task', () => {
    for (const task of LIVEBENCH_TASKS) {
      expect(task.prompt.length).toBeGreaterThan(10);
      expect(task.expectedKeywords.length).toBeGreaterThan(0);
      expect(task.referenceOutputSnippet.length).toBeGreaterThan(0);
    }
  });
});
