# Vortex Agent Arena

The Agent Arena compares independent candidate implementations under one CI contract.

## Ownership

- **VortexLiveBench**: agent/model profiles, workloads, matrix scheduling, k6 measurements and comparative results.
- **VUC**: GOS3 policy, authorization, execution governance, trace, Merkle evidence, Ed25519 attestation and independent verification.
- **Arena**: Execute → Measure → Prove.

## Hard gates

A candidate is eligible only if every gate passes:

1. GOS3 governance
2. Security invariants
3. Correctness
4. VUC proof verification
5. Adversarial verification
6. Real execution smoke test

Missing evidence is a failure, not an implicit pass.

## Performance is advisory

RPS, latency, error rate, memory and duration come from the benchmark layer. They are comparable only after the hard gates pass.

The Arena score is advisory and never overrides a failed governance, security, correctness or proof gate.

This prevents a faster candidate from winning by weakening authorization or evidence checks.

## Attestation

Each candidate result binds:

- agent profile;
- model identifier;
- candidate commit and baseline commit;
- hard-gate evidence references;
- benchmark measurement provenance;
- VUC attestation reference.

A later integration can place these references under one Merkle root without moving benchmark ownership into VUC.

## Coverage

Line coverage alone is insufficient. The Arena should also cover:

- line/function/branch coverage;
- authorization invariants;
- proof tamper rejection;
- GOS3 identity and policy checks;
- manifest/runtime provenance;
- metric provenance;
- mutation tests for critical guards.

Invariant:

`candidate eligible => every mandatory gate passed`

Never:

`higher performance => eligible`
