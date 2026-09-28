import { LiveBenchTask } from '../types/vuc';

export const LIVEBENCH_TASKS: LiveBenchTask[] = [
  {
    id: 'lb_task_reasoning_01',
    title: 'Deterministic Logic: Verifiable Syllogism',
    category: 'reasoning',
    prompt: 'Given: 1) All verified VUC execution traces are deterministic. 2) No unseeded model produces a verifiable VUC trace. 3) Execution trace T is unseeded. Does T have a verifiable VUC trace? Answer STRICTLY in formal logical deduction with conclusion YES or NO.',
    expectedKeywords: ['NO', 'deduction', 'deterministic', 'unseeded'],
    referenceOutputSnippet: 'Premise 1: Verified traces -> deterministic.\nPremise 2: Unseeded -> NOT verified.\nPremise 3: T is unseeded.\nConclusion: NO. Execution trace T cannot have a verifiable VUC trace.',
  },
  {
    id: 'lb_task_coding_01',
    title: 'Core BitLinear 1-Bit Dot Product Kernel',
    category: 'coding',
    prompt: 'Write an optimized C or Rust function for 1-bit BitNet dot product where weights W are ternary {-1, 0, +1} and activations X are INT8. Must avoid floating-point multiplication and only use additions and subtractions.',
    expectedKeywords: ['int8', 'ternary', '+1', '-1', 'acc +=', 'acc -='],
    referenceOutputSnippet: `int32_t bitlinear_dot_1bit(const int8_t* x, const int8_t* w, size_t n) {
    int32_t acc = 0;
    for (size_t i = 0; i < n; ++i) {
        if (w[i] == 1) acc += x[i];
        else if (w[i] == -1) acc -= x[i];
    }
    return acc;
}`,
  },
  {
    id: 'lb_task_math_01',
    title: 'Cryptographic Merkle Root Verification',
    category: 'math',
    prompt: 'Given 4 leaf token hash digests [H0, H1, H2, H3], write the exact 2-level binary Merkle Tree formulation for Root R. If H0 = "0xAA", H1 = "0xBB", H2 = "0xCC", H3 = "0xDD", define R = H(H(H0, H1), H(H2, H3)).',
    expectedKeywords: ['Merkle', 'Root', 'H01', 'H23', 'binary tree'],
    referenceOutputSnippet: 'Level 1: H01 = Hash(H0 || H1), H23 = Hash(H2 || H3)\nLevel 2 (Root): R = Hash(H01 || H23)\nBinary Merkle tree provides O(log N) verification guarantee.',
  },
  {
    id: 'lb_task_instruction_01',
    title: 'Strict VUC JSON Attestation Adherence',
    category: 'instruction',
    prompt: 'Output valid JSON with exactly the keys: "vuc_version", "model_id", "deterministic", "proof_hash", without any extra markdown or conversational text.',
    expectedKeywords: ['"vuc_version"', '"model_id"', '"deterministic"', '"proof_hash"'],
    referenceOutputSnippet: '{"vuc_version": "1.0.4", "model_id": "vuc-core", "deterministic": true, "proof_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}',
  },
];
