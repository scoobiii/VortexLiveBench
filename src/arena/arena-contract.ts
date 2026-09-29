/**
 * VORTEX AGENT ARENA — execution/measurement/proof contract.
 * GOS3 scope: governance, security, correctness and provenance are hard gates.
 */

export type ArenaGateName =
  | 'gos3' | 'security' | 'correctness' | 'proof' | 'adversarial' | 'real_smoke';

export interface ArenaCandidate {
  candidateId: string;
  agentProfile: string;
  modelId: string;
  branch: string;
  commitSha: string;
}

export interface ArenaMeasurement {
  rps?: number;
  p50Ms?: number;
  p95Ms?: number;
  p99Ms?: number;
  errorRate?: number;
  durationSeconds?: number;
  peakRamMb?: number;
  source: 'k6' | 'runner' | 'none';
}

export interface ArenaGateResult {
  gate: ArenaGateName;
  passed: boolean;
  evidenceRef: string;
}

export interface ArenaAttestation {
  schemaVersion: '1.0';
  candidate: ArenaCandidate;
  baselineCommitSha: string;
  gates: ArenaGateResult[];
  measurement: ArenaMeasurement;
  score?: number;
  scoreIsAdvisory: true;
  eligible: boolean;
}

const REQUIRED_GATES: readonly ArenaGateName[] = [
  'gos3', 'security', 'correctness', 'proof', 'adversarial', 'real_smoke',
];

export function evaluateArenaGates(gates: readonly ArenaGateResult[]) {
  const byGate = new Map(gates.map((entry) => [entry.gate, entry]));
  const missing = REQUIRED_GATES.filter((gate) => !byGate.has(gate));
  const failed = REQUIRED_GATES.filter((gate) => byGate.get(gate)?.passed === false);
  return { eligible: missing.length === 0 && failed.length === 0, missing, failed };
}

export function buildArenaAttestation(
  input: Omit<ArenaAttestation, 'eligible' | 'scoreIsAdvisory'>,
): ArenaAttestation {
  return { ...input, scoreIsAdvisory: true, eligible: evaluateArenaGates(input.gates).eligible };
}

export function assertArenaEligible(attestation: ArenaAttestation): void {
  const evaluation = evaluateArenaGates(attestation.gates);
  if (!evaluation.eligible || !attestation.eligible) {
    const reasons = [
      ...evaluation.missing.map((gate) => 'missing:' + gate),
      ...evaluation.failed.map((gate) => 'failed:' + gate),
    ];
    throw new Error('Arena candidate is not eligible: ' + reasons.join(','));
  }
}
