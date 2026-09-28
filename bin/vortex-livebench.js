#!/usr/bin/env node

/**
 * VortexLiveBench CLI.
 *
 * Important: cryptographic integrity of an artifact is not proof that a real
 * model/runtime executed. Real benchmark evidence is accepted only after S1-S5.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const sha256 = (value) => crypto.createHash('sha256').update(value, 'utf8').digest('hex');

function computeMerkleRoot(leafHashes) {
  if (!leafHashes.length) return sha256('vuc_empty_execution_tree');
  let level = [...leafHashes];
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      const right = level[i + 1] ?? level[i];
      next.push(sha256(level[i] + right));
    }
    level = next;
  }
  return level[0];
}

function verifyEd25519(publicKeyHex, signatureHex, message) {
  const rawPublicKey = Buffer.from(publicKeyHex, 'hex');
  const signature = Buffer.from(signatureHex, 'hex');
  if (rawPublicKey.length !== 32 || signature.length !== 64) return false;
  const spki = Buffer.concat([
    Buffer.from('302a300506032b6570032100', 'hex'),
    rawPublicKey,
  ]);
  const publicKey = crypto.createPublicKey({ key: spki, format: 'der', type: 'spki' });
  return crypto.verify(null, Buffer.from(message, 'utf8'), publicKey, signature);
}

function verifyProof(filePath) {
  const raw = fs.readFileSync(path.resolve(process.cwd(), filePath), 'utf8');
  const proof = JSON.parse(raw);
  const trace = proof.trace;
  if (!Array.isArray(trace) || trace.length === 0) throw new Error('Proof trace is missing or empty');

  const execution = proof.execution ?? {};
  const model = proof.model ?? {};
  const promptHash = execution.prompt_hash;
  if (!promptHash || sha256(execution.prompt ?? '') !== promptHash) {
    throw new Error('prompt_hash does not match prompt');
  }

  let parentHash = promptHash;
  const leafHashes = [];
  for (const step of trace) {
    const expectedHash = sha256(`${parentHash}:${step.token}:${step.tokenId}`);
    if (step.parentHash !== parentHash || step.hash !== expectedHash) {
      throw new Error(`Trace integrity failure at step ${step.step}`);
    }
    parentHash = step.hash;
    leafHashes.push(step.hash);
  }

  const merkleRoot = computeMerkleRoot(leafHashes);
  if (merkleRoot !== execution.merkle_root) throw new Error('Merkle root mismatch');

  const publicKeyHex = model.public_key_hex;
  const signatureHex = execution.signature_ed25519_hex ?? execution.reproducibility_signature;
  if (!verifyEd25519(publicKeyHex, signatureHex, merkleRoot)) {
    throw new Error('Ed25519 signature verification failed');
  }

  return {
    proofId: proof.proof_id ?? path.basename(filePath),
    modelId: model.id,
    traceSteps: trace.length,
    merkleRoot,
    signatureValid: true,
    realExecutionProven: proof.evidence?.real_execution === true,
  };
}

async function runCli() {
  const args = process.argv.slice(2);
  const command = args[0] ?? '--help';

  if (command === '--help' || command === '-h' || command === 'help') {
    console.log(`
VortexLiveBench CLI

  verify <proof.json>    Verify trace, Merkle root and Ed25519 signature.
                         This does NOT prove real model/runtime execution.
  capacity [--env ...]   Planning estimate only; not a measured benchmark.
  matrix                 Model registry metadata only; not execution evidence.
`);
    return;
  }

  if (command === '--version' || command === '-v') {
    console.log('vortex-livebench v1.0.0');
    return;
  }

  if (command === 'verify') {
    const filePath = args[1];
    if (!filePath) throw new Error('Usage: vortex-livebench verify <proof.json>');
    const result = verifyProof(filePath);
    console.log(JSON.stringify({
      status: result.realExecutionProven ? 'CRYPTOGRAPHICALLY_VERIFIED_REAL_EVIDENCE' : 'CRYPTOGRAPHICALLY_VERIFIED_INTEGRITY_ONLY',
      ...result,
    }, null, 2));
    return;
  }

  if (command === 'capacity') {
    console.log('CAPACITY_STATUS=PLANNING_ESTIMATE_ONLY');
    console.log('No RAM capacity claim is emitted as measured evidence.');
    return;
  }

  if (command === 'matrix') {
    console.log('MATRIX_STATUS=REGISTRY_METADATA_ONLY');
    console.log('No model is marked executed, verified, or benchmarked by this command.');
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

runCli().catch((err) => {
  console.error(`ERROR: ${err.message}`);
  process.exit(1);
});
