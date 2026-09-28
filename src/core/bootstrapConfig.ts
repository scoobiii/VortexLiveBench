/**
 * Bootstrap Environment Variables & Runner Auto-Configuration Manager
 * Persists bootstrap preferences to localStorage and formats .env export files
 */

export interface BootstrapEnvConfig {
  RUNNER_ARCH_MODE: 'x86_64_avx2' | 'arm64_neon' | 'cuda_sm80';
  GPU_ACCELERATION_ENABLED: boolean;
  VUC_RUNTIME_ENGINE: 'python' | 'hvm' | 'bend';
  RAM_GUARD_MB: number;
  BATCH_SIZE: number;
  QUANTIZE_1BIT_ENFORCED: boolean;
  ED25519_STRICT_ASSERT: boolean;
  MODEL_CACHE_DIR: string;
}

export const DEFAULT_BOOTSTRAP_CONFIG: BootstrapEnvConfig = {
  RUNNER_ARCH_MODE: 'x86_64_avx2',
  GPU_ACCELERATION_ENABLED: false,
  VUC_RUNTIME_ENGINE: 'python',
  RAM_GUARD_MB: 6092,
  BATCH_SIZE: 5,
  QUANTIZE_1BIT_ENFORCED: true,
  ED25519_STRICT_ASSERT: true,
  MODEL_CACHE_DIR: '~/.cache/vuc_models',
};

export const BOOTSTRAP_STORAGE_KEY = 'vuc_bootstrap_env_config';

export class BootstrapConfigEngine {
  /**
   * Resolves storage backend (custom for unit testing, or window.localStorage)
   */
  static resolveStorage(customStorage?: Storage): Storage | null {
    if (customStorage !== undefined) {
      return customStorage;
    }
    if (typeof window !== 'undefined') {
      return window.localStorage;
    }
    return null;
  }

  /**
   * Retrieves stored configuration from localStorage or returns default
   */
  static getStoredConfig(customStorage?: Storage): BootstrapEnvConfig {
    try {
      const storage = this.resolveStorage(customStorage);
      if (!storage) return { ...DEFAULT_BOOTSTRAP_CONFIG };

      const raw = storage.getItem(BOOTSTRAP_STORAGE_KEY);
      if (!raw) return { ...DEFAULT_BOOTSTRAP_CONFIG };

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return { ...DEFAULT_BOOTSTRAP_CONFIG };
      }

      return {
        RUNNER_ARCH_MODE:
          parsed.RUNNER_ARCH_MODE === 'arm64_neon' || parsed.RUNNER_ARCH_MODE === 'cuda_sm80'
            ? parsed.RUNNER_ARCH_MODE
            : 'x86_64_avx2',
        GPU_ACCELERATION_ENABLED: Boolean(parsed.GPU_ACCELERATION_ENABLED),
        VUC_RUNTIME_ENGINE:
          parsed.VUC_RUNTIME_ENGINE === 'hvm' || parsed.VUC_RUNTIME_ENGINE === 'bend'
            ? parsed.VUC_RUNTIME_ENGINE
            : 'python',
        RAM_GUARD_MB:
          typeof parsed.RAM_GUARD_MB === 'number' && parsed.RAM_GUARD_MB > 0
            ? parsed.RAM_GUARD_MB
            : DEFAULT_BOOTSTRAP_CONFIG.RAM_GUARD_MB,
        BATCH_SIZE:
          typeof parsed.BATCH_SIZE === 'number' && parsed.BATCH_SIZE > 0
            ? parsed.BATCH_SIZE
            : DEFAULT_BOOTSTRAP_CONFIG.BATCH_SIZE,
        QUANTIZE_1BIT_ENFORCED:
          parsed.QUANTIZE_1BIT_ENFORCED !== undefined
            ? Boolean(parsed.QUANTIZE_1BIT_ENFORCED)
            : DEFAULT_BOOTSTRAP_CONFIG.QUANTIZE_1BIT_ENFORCED,
        ED25519_STRICT_ASSERT:
          parsed.ED25519_STRICT_ASSERT !== undefined
            ? Boolean(parsed.ED25519_STRICT_ASSERT)
            : DEFAULT_BOOTSTRAP_CONFIG.ED25519_STRICT_ASSERT,
        MODEL_CACHE_DIR:
          typeof parsed.MODEL_CACHE_DIR === 'string' && parsed.MODEL_CACHE_DIR.trim().length > 0
            ? parsed.MODEL_CACHE_DIR.trim()
            : DEFAULT_BOOTSTRAP_CONFIG.MODEL_CACHE_DIR,
      };
    } catch {
      return { ...DEFAULT_BOOTSTRAP_CONFIG };
    }
  }

  /**
   * Saves updated configuration to localStorage
   */
  static saveConfig(
    partial: Partial<BootstrapEnvConfig>,
    customStorage?: Storage
  ): { success: boolean; config: BootstrapEnvConfig } {
    const current = this.getStoredConfig(customStorage);
    const updated: BootstrapEnvConfig = {
      ...current,
      ...partial,
    };

    try {
      const storage = this.resolveStorage(customStorage);
      if (storage) {
        storage.setItem(BOOTSTRAP_STORAGE_KEY, JSON.stringify(updated));
        return { success: true, config: updated };
      }
      return { success: false, config: updated };
    } catch {
      return { success: false, config: updated };
    }
  }

  /**
   * Resets stored configuration to factory defaults
   */
  static resetToDefaults(customStorage?: Storage): BootstrapEnvConfig {
    const storage = this.resolveStorage(customStorage);
    if (storage) {
      storage.removeItem(BOOTSTRAP_STORAGE_KEY);
    }
    return { ...DEFAULT_BOOTSTRAP_CONFIG };
  }

  /**
   * Generates a standard .env format string
   */
  static formatAsEnvString(config: BootstrapEnvConfig): string {
    return [
      '# ============================================================================== #',
      '# VortexLiveBench VUC - Bootstrap Auto-Configuration Environment Variables      #',
      '# ============================================================================== #',
      `RUNNER_ARCH_MODE=${config.RUNNER_ARCH_MODE}`,
      `GPU_ACCELERATION_ENABLED=${config.GPU_ACCELERATION_ENABLED}`,
      `VUC_RUNTIME_ENGINE=${config.VUC_RUNTIME_ENGINE}`,
      `RAM_GUARD_MB=${config.RAM_GUARD_MB}`,
      `BATCH_SIZE=${config.BATCH_SIZE}`,
      `QUANTIZE_1BIT_ENFORCED=${config.QUANTIZE_1BIT_ENFORCED}`,
      `ED25519_STRICT_ASSERT=${config.ED25519_STRICT_ASSERT}`,
      `MODEL_CACHE_DIR="${config.MODEL_CACHE_DIR}"`,
    ].join('\n');
  }
}
