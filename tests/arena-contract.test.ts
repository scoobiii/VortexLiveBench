import { describe, expect, it } from 'vitest';
import {
  assertArenaEligible,
  buildArenaAttestation,
  evaluateArenaGates,
  type ArenaGateResult,
} from '../src/arena/arena-contract';

const passedGates = (): ArenaGateResult[] => [
  { gate: 'gos3', passed: true, evidenceRef: 'gos3:1' },
  { gate: 'security', passed: true, evidenceRef: 'security:1' },
  { gate: 'correctness', passed: true, evidenceRef: 'correctness:1' },
  { gate: 'proof', passed: true, evidenceRef: 'vuc:attestation:1' },
  { gate: 'adversarial', passed: true, evidenceRef: 'adversarial:1' },
  { gate: 'real_smoke', passed: true, evidenceRef: 'smoke:1' },
];

describe('Agent Arena hard gates', () => {
  it('keeps performance score advisory and requires every hard gate', () => {
    const attestation = buildArenaAttestation({
      schemaVersion: '1.0',
      candidate: {
        candidateId: 'candidate-a',
        agentProfile: 'performance',
        modelId: 'local-model',
        branch: 'candidate/a',
        commitSha: 'abc123',
      },
      baselineCommitSha: 'baseline123',
      gates: passedGates(),
      measurement: { rps: 1000, p95Ms: 1, source: 'k6' },
      score: 99.9,
    });
    expect(attestation.eligible).toBe(true);
    expect(attestation.scoreIsAdvisory).toBe(true);
    expect(() => assertArenaEligible(attestation)).not.toThrow();
  });

  it('disqualifies a candidate when a security invariant fails', () => {
    const gates = passedGates().map((entry) =>
      entry.gate === 'security' ? { ...entry, passed: false } : entry,
    );
    const result = evaluateArenaGates(gates);
    expect(result.eligible).toBe(false);
    expect(result.failed).toEqual(['security']);
  });

  it('does not let missing evidence become an implicit pass', () => {
    const result = evaluateArenaGates(passedGates().filter((entry) => entry.gate !== 'proof'));
    expect(result.eligible).toBe(false);
    expect(result.missing).toEqual(['proof']);
  });

  it('rejects a forged eligible flag when hard gates do not pass', () => {
    const attestation = {
      ...buildArenaAttestation({
        schemaVersion: '1.0',
        candidate: {
          candidateId: 'rogue',
          agentProfile: 'untrusted',
          modelId: 'local-model',
          branch: 'fork/rogue',
          commitSha: 'deadbeef',
        },
        baselineCommitSha: 'baseline123',
        gates: passedGates().filter((entry) => entry.gate !== 'proof'),
        measurement: { rps: 99999, p95Ms: 0.1, source: 'k6' },
        score: 99999,
      }),
      eligible: true,
    };
    expect(() => assertArenaEligible(attestation)).toThrow(/failed|missing/);
  });
});
