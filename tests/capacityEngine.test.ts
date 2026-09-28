import { describe, it, expect } from 'vitest';
import { CapacityEngine } from '../src/core/capacityEngine';

describe('CapacityEngine', () => {
  it('calculates hardware specifications for GitHub CI runner', () => {
    const specs = CapacityEngine.getHardwareSpecs('github-ci');
    expect(specs.totalRamMB).toBe(7168);
    expect(specs.safeLimitPercent).toBe(85);
    expect(specs.safeRamCeilingMB).toBe(6092);
    expect(specs.netAvailableRamMB).toBeGreaterThan(5000);
    expect(specs.vCPUs).toBe(2);
    expect(specs.diskScratchMB).toBe(14336);
  });

  it('calculates hardware specifications for GAIS sandbox container', () => {
    const specs = CapacityEngine.getHardwareSpecs('gais-sandbox');
    expect(specs.totalRamMB).toBe(4000);
    expect(specs.safeLimitPercent).toBe(85);
    expect(specs.safeRamCeilingMB).toBe(3400);
    expect(specs.netAvailableRamMB).toBeGreaterThan(2500);
    expect(specs.vCPUs).toBe(2);
    expect(specs.diskScratchMB).toBe(5120);
  });

  it('computes model capacity for both GitHub CI and GAIS sandbox environments', () => {
    const ghCapacity = CapacityEngine.calculateModelCapacity('github-ci');
    expect(ghCapacity.length).toBeGreaterThanOrEqual(5);

    // SmolLM 135M (~270MB) in GitHub runner should allow >= 15 concurrent instances
    const smolItemGh = ghCapacity.find((m) => m.modelId === 'smollm2-135m');
    expect(smolItemGh).toBeDefined();
    expect(smolItemGh!.maxConcurrentInstances).toBeGreaterThanOrEqual(15);

    // BitNet 1B (~215MB) in GitHub runner should allow >= 20 concurrent instances
    const bitnetGh = ghCapacity.find((m) => m.modelId === 'bitnet-b1.58-1b');
    expect(bitnetGh).toBeDefined();
    expect(bitnetGh!.maxConcurrentInstances).toBeGreaterThanOrEqual(20);

    const gaisCapacity = CapacityEngine.calculateModelCapacity('gais-sandbox');
    const smolItemGais = gaisCapacity.find((m) => m.modelId === 'smollm2-135m');
    expect(smolItemGais).toBeDefined();
    expect(smolItemGais!.maxConcurrentInstances).toBeGreaterThanOrEqual(8);
  });

  it('provides valid Bend / HVM runtime specifications', () => {
    const spec = CapacityEngine.getBendHvmSpec();
    expect(spec.name).toContain('Bend / HVM');
    expect(spec.memoryOverheadMB).toBe(120);
    expect(spec.installCommand).toContain('cargo install');
    expect(spec.runCommand).toContain('bend run');
  });
});
