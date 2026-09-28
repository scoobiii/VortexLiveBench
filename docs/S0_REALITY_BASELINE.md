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

## Next sprint

S1 must introduce the VUC runtime contract and a real execution adapter. The first acceptance target is **one real model end-to-end**, before expanding to the five-model matrix.

