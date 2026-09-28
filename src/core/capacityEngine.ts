/**
 * Capacity Calculation & Bend / HVM (Higher-order Virtual Machine) Resource Engine
 * Computes exact RAM, CPU, and Disk capacity for GitHub Actions CI and GAIS Sandbox runtimes
 */

export interface RunnerHardwareSpecs {
  name: string;
  environment: 'github-ci' | 'gais-sandbox';
  totalRamMB: number;
  safeLimitPercent: number;
  safeRamCeilingMB: number;
  baseSystemRamMB: number; // OS + Runtime + Bend/HVM daemon
  netAvailableRamMB: number;
  diskScratchMB: number;
  vCPUs: number;
}

export interface ModelCapacityItem {
  modelId: string;
  modelName: string;
  quantization: string;
  footprintPerModelMB: number;
  maxConcurrentInstances: number;
  sequentialThroughputLimit: string;
}

export interface BendHvmSpec {
  name: string;
  version: string;
  runtimeType: string;
  memoryOverheadMB: number;
  description: string;
  installCommand: string;
  runCommand: string;
}

export class CapacityEngine {
  /**
   * Hardware boundaries for GitHub Actions and GAIS runtimes
   */
  static getHardwareSpecs(env: 'github-ci' | 'gais-sandbox'): RunnerHardwareSpecs {
    if (env === 'github-ci') {
      const totalRamMB = 7168;
      const safeLimitPercent = 85;
      const safeRamCeilingMB = Math.floor(totalRamMB * (safeLimitPercent / 100)); // 6092 MB
      const baseSystemRamMB = 970; // Ubuntu 22.04 + PyTorch CPU + Bend/HVM daemon
      const netAvailableRamMB = safeRamCeilingMB - baseSystemRamMB; // 5122 MB

      return {
        name: 'GitHub Actions Standard Runner (ubuntu-latest)',
        environment: 'github-ci',
        totalRamMB,
        safeLimitPercent,
        safeRamCeilingMB,
        baseSystemRamMB,
        netAvailableRamMB,
        diskScratchMB: 14336, // 14 GB SSD
        vCPUs: 2,
      };
    }

    // Google AI Studio (GAIS) Sandbox Container
    const totalRamMB = 4000;
    const safeLimitPercent = 85;
    const safeRamCeilingMB = Math.floor(totalRamMB * (safeLimitPercent / 100)); // 3400 MB
    const baseSystemRamMB = 550; // Node.js + Vite Web Dev Server + Memory buffers
    const netAvailableRamMB = safeRamCeilingMB - baseSystemRamMB; // 2850 MB

    return {
      name: 'Google AI Studio (GAIS) Sandbox Runtime Container',
      environment: 'gais-sandbox',
      totalRamMB,
      safeLimitPercent,
      safeRamCeilingMB,
      baseSystemRamMB,
      netAvailableRamMB,
      diskScratchMB: 5120, // 5 GB scratch storage
      vCPUs: 2,
    };
  }

  /**
   * Calculates how many native VUC LLMs fit simultaneously in the given environment
   */
  static calculateModelCapacity(env: 'github-ci' | 'gais-sandbox'): ModelCapacityItem[] {
    const specs = this.getHardwareSpecs(env);
    const availableRam = specs.netAvailableRamMB;

    const catalog = [
      { id: 'mobilellm-125m', name: 'MobileLLM-125M', quant: 'native_fp16', ramMB: 250 },
      { id: 'smollm2-135m', name: 'SmolLM2-135M-Instruct', quant: 'native_fp16', ramMB: 270 },
      { id: 'smollm2-360m', name: 'SmolLM2-360M-Instruct', quant: 'native_fp16', ramMB: 720 },
      { id: 'qwen2.5-0.5b', name: 'Qwen2.5-0.5B-Instruct', quant: 'native_fp16', ramMB: 1250 },
      { id: 'bitnet-b1.58-1b', name: 'BitNet-b1.58-1B (1-Bit)', quant: 'bitnet_b1.58', ramMB: 215 },
      { id: 'llama-3.2-1b-1bit', name: 'Llama-3.2-1B (1-Bit)', quant: 'bitnet_b1.58', ramMB: 252 },
      { id: 'mistral-7b-1bit', name: 'Mistral-7B (1-Bit BitNet)', quant: 'bitnet_b1.58', ramMB: 1850 },
    ];

    return catalog.map((item) => {
      const maxConcurrent = Math.max(1, Math.floor(availableRam / item.ramMB));
      return {
        modelId: item.id,
        modelName: item.name,
        quantization: item.quant,
        footprintPerModelMB: item.ramMB,
        maxConcurrentInstances: maxConcurrent,
        sequentialThroughputLimit: 'Ilimitado via particionamento em lotes de 5 e liberação de tensores',
      };
    });
  }

  /**
   * Bend / HVM (Higher-order Virtual Machine) Parallel Specification
   */
  static getBendHvmSpec(): BendHvmSpec {
    return {
      name: 'Bend / HVM (Higher-order Virtual Machine)',
      version: '0.2.37 (HVM2)',
      runtimeType: 'Massively Parallel Interaction Combinators Evaluator',
      memoryOverheadMB: 120,
      description:
        'Executa redução paralela determinística de árvores de interação e Merkle trees no runner CI sem locks ou mutexes.',
      installCommand: 'cargo install hvm bend-lang || curl -sSL https://raw.githubusercontent.com/HigherOrderCO/HVM/master/install.sh | bash',
      runCommand: 'bend run-c vuc_merkle.bend --parallel',
    };
  }
}
