# VortexLiveBench

VortexLiveBench is the benchmark and measurement layer for VUC-governed LLM execution.

## Reality status

The current repository baseline is **not yet a real-model benchmark**. The legacy `vuc_harness.py` is retained only as experimental/mock material and must not be used as benchmark evidence.

The production path is intended to become:

VortexLiveBench model/task registry → VUC LLM adapter → real runtime → VUC trace/Merkle/Ed25519 attestation → benchmark result.

Cryptographic verification of an artifact does not, by itself, prove that real model weights, tokenizer and runtime were executed.

## Development

- Node.js 22+
- npm 10+

The repository requires a committed npm lockfile for CI. Dependency installation without a lockfile is intentionally rejected.

## CLI

`vortex-livebench verify <proof.json>` verifies trace integrity, Merkle recomputation and Ed25519 signature validity. It does not upgrade synthetic evidence into real-execution evidence.

