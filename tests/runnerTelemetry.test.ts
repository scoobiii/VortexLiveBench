import { describe, it, expect } from 'vitest';
import { RunnerTelemetryEngine } from '../src/core/runnerTelemetry';

describe('RunnerTelemetryEngine', () => {
  it('returns comprehensive resource metrics for runner models', () => {
    const profiles = RunnerTelemetryEngine.getRunnerResourceProfiles();
    expect(profiles.length).toBeGreaterThanOrEqual(5);

    for (const p of profiles) {
      expect(p.modelId).toBeTruthy();
      expect(p.modelName).toBeTruthy();
      expect(p.binaryRuntime).toBeTruthy();
      expect(p.peakRamMB).toBeGreaterThan(0);
      expect(p.rssRamMB).toBeGreaterThan(0);
      expect(p.cpuPercent2Cores).toBeGreaterThan(0);
      expect(p.diskFootprintMB).toBeGreaterThan(0);
      expect(p.executionSec).toBeGreaterThan(0);
      expect(p.safeLimitPassed).toBe(true);
      expect(p.peakRamMB).toBeLessThan(7168); // within runner ceiling
    }
  });

  it('generates valid Prometheus Alert Rules with safe RAM thresholds', () => {
    const rules = RunnerTelemetryEngine.generatePrometheusAlertRules();
    expect(rules).toContain('groups:');
    expect(rules).toContain('RunnerMemoryWarningThreshold');
    expect(rules).toContain('> 75');
    expect(rules).toContain('RunnerMemoryCriticalCircuitBreaker');
    expect(rules).toContain('> 85');
    expect(rules).toContain('RunnerCpuThrottling');
  });

  it('generates valid Grafana scrape configuration with remote_write', () => {
    const config = RunnerTelemetryEngine.generateGrafanaScrapeConfig();
    expect(config).toContain('scrape_configs:');
    expect(config).toContain('job_name: \'vuc-github-runner\'');
    expect(config).toContain('localhost:9100');
    expect(config).toContain('remote_write:');
    expect(config).toContain('grafana.net');
  });

  it('provides complete Git repo and architectural specifications', () => {
    const specs = RunnerTelemetryEngine.getGitRepoAndExecutionSpecs();
    expect(specs.repoName).toBe('scoobiii/vuc-livebench-matrix');
    expect(specs.canonicalUrl).toContain('github.com/scoobiii/vuc-livebench-matrix');
    expect(specs.installationSequence.length).toBeGreaterThan(3);
    expect(specs.executionCommand).toContain('vuc_harness.py');
    expect(specs.apiAuthenticationMechanics.endpoint).toContain('/actions/workflows/');
    expect(specs.designPatterns.length).toBe(5);

    const patternNames = specs.designPatterns.map((p) => p.name);
    expect(patternNames).toContain('Adapter Pattern');
    expect(patternNames).toContain('Circuit Breaker / RAM Guard Pattern');
  });
});
