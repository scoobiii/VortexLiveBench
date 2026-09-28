# S0 — Reality Baseline

Status: **BLOCKED FOR REAL BENCHMARK**

This repository currently contains cryptographic proof machinery, but the legacy Python harness does not execute a real LLM.

## Classification

| Area | Status | Evidence |
|---|---|---|
| Proof hashing | PARTIAL | Real SHA-256/Merkle implementation exists |
| Ed25519 | PARTIAL | Real WebCrypto Ed25519 signing/verification exists |
| Token IDs | MOCK | `vuc_harness.py` uses a hard-coded vocabulary and hash fallback |
| Model weights | MOCK | `weights_sha256` is derived from the model id |
| Tensor proof | MOCK | `tensor_merkle_root` is derived from the model id |
| Inference | MOCK | Harness emits a fixed token sequence |
| RAM | MOCK | Peak RAM is calculated from catalog size |
| Runner identity | MOCK | Runner environment is hard-coded |
| Runtime selection | PARTIAL | CLI accepts runtime, but workflow hard-codes Python |
| Real model execution | NOT IMPLEMENTED | No verified end-to-end real-model path in the harness |

## Benchmark gate

A result may only become **VERIFIED_VALID** when all of these are true:

1. Engine binary exists and its SHA-256 is recorded.
2. Model weights were downloaded and their SHA-256 was measured from bytes.
3. Tokenizer was loaded from the declared artifact and its SHA-256 was measured.
4. The runtime loaded the declared model.
5. Generation actually occurred through that runtime.
6. Token IDs in the trace came from the loaded tokenizer.
7. Execution metrics were measured from the runner, not estimated from catalog metadata.
8. The trace and Merkle root recompute successfully.
9. The Ed25519 signature verifies against the declared public key.
10. Task correctness is checked separately from cryptographic validity.

## Explicitly rejected evidence

The following are not evidence of real inference:

- fixed token arrays;
- synthetic vocabulary maps;
- token IDs generated from a string hash;
- model-id-derived weight hashes;
- model-id-derived tensor roots;
- estimated RAM values;
- hard-coded runner descriptions;
- a valid Ed25519 signature over synthetic data.


## VUC governance gates inherited by LiveBench

LiveBench must consume the VUC governance standard rather than create a parallel governance system.

### Mandatory CI gates

1. **Static Mock Detector** — scan the repository, not only `src/`; include source, tests, scripts, CLI, manifests/configuration, workflows and benchmark code. Scan generated benchmark/evidence artifacts when present. Exclusions must be narrow, explicit and auditable.
2. **GOS3 Header Audit** — audit every applicable source, test, script, CLI, adapter, workflow/configuration and generated artifact. Missing or malformed required headers fail the gate.
3. **VUC Conformance** — run applicable VUC conformance checks; LiveBench may add stricter checks but must not weaken them.
4. **100% Quality/Coverage** — typecheck/static analysis and the declared 100% test-coverage gate must pass. Coverage never substitutes for real execution.
5. **Adversarial Verification** — tampered trace, token, metric, manifest, Merkle root or attestation must be rejected.
6. **Evidence/Attestation** — publish machine-readable benchmark reports, proofs and verification output identifying actual engine, weights, tokenizer, runtime and measured runner data.
7. **Real Execution Smoke Test** — CI must execute at least one real model through the declared runtime. Synthetic harness output cannot satisfy this gate.

### Repository-wide anti-mock scope

```
repository/
├── src/                 # scan
├── tests/               # scan
├── scripts/             # scan
├── bin/                 # scan
├── manifests/config     # scan
├── .github/             # scan
├── docs/                # scan where applicable
├── generated/           # scan when present
└── artifacts/           # scan when present
```

Do not create a broad `IGNORED_DIRS` escape hatch. Any exclusion must be narrow, documented and testable.

## Final PR gate

```
PR PASS
=
GOS3 PASS
AND MOCK_DETECTOR PASS
AND TESTS/COVERAGE PASS
AND VUC_CONFORMANCE PASS
AND ADVERSARIAL PASS
AND REAL_SMOKE PASS
AND ATTESTATION_VERIFY PASS
```

## Ownership boundary

```
VUC
├── governance
├── anti-mock
├── GOS3
├── policy/conformance
├── runtime installation/verification
├── execution evidence
└── attestation

VortexLiveBench
├── model registry
├── LiveBench tasks
├── batches
├── benchmark matrix
├── measurements
└── benchmark result

Combined
└── Execute → Measure → Prove
```

LiveBench should invoke these VUC capabilities instead of duplicating their implementation.

## Next sprint

S1 must introduce the VUC runtime contract and a real execution adapter. The first acceptance target is **one real model end-to-end**, before expanding to the five-model matrix.

