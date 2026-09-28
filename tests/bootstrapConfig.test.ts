import { describe, it, expect, beforeEach } from 'vitest';
import {
  BootstrapConfigEngine,
  DEFAULT_BOOTSTRAP_CONFIG,
  BOOTSTRAP_STORAGE_KEY,
  BootstrapEnvConfig,
} from '../src/core/bootstrapConfig';

class MockStorage implements Storage {
  private store: Record<string, string> = {};

  get length(): number {
    return Object.keys(this.store).length;
  }

  clear(): void {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
}

describe('BootstrapConfigEngine', () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
  });

  describe('resolveStorage', () => {
    it('returns customStorage when provided', () => {
      const resolved = BootstrapConfigEngine.resolveStorage(mockStorage);
      expect(resolved).toBe(mockStorage);
    });

    it('returns null if window is undefined and no customStorage is provided', () => {
      const origWindow = globalThis.window;
      // @ts-expect-error simulating node environment
      delete globalThis.window;

      expect(BootstrapConfigEngine.resolveStorage()).toBeNull();

      globalThis.window = origWindow;
    });

    it('returns window.localStorage if window is defined and no customStorage provided', () => {
      const origWindow = globalThis.window;
      // @ts-expect-error simulating browser window
      globalThis.window = { localStorage: mockStorage };

      expect(BootstrapConfigEngine.resolveStorage()).toBe(mockStorage);

      globalThis.window = origWindow;
    });
  });

  describe('getStoredConfig', () => {
    it('returns default config when storage has no entry', () => {
      const config = BootstrapConfigEngine.getStoredConfig(mockStorage);
      expect(config).toEqual(DEFAULT_BOOTSTRAP_CONFIG);
    });

    it('returns default config when storage is null', () => {
      const nullStorage = {
        resolveStorage: () => null,
      };
      // Pass a storage mock that returns null
      const config = BootstrapConfigEngine.getStoredConfig(null as unknown as Storage);
      expect(config.RUNNER_ARCH_MODE).toBe('x86_64_avx2');
    });

    it('returns default config when storage item is invalid JSON', () => {
      mockStorage.setItem(BOOTSTRAP_STORAGE_KEY, 'invalid-json{{');
      const config = BootstrapConfigEngine.getStoredConfig(mockStorage);
      expect(config).toEqual(DEFAULT_BOOTSTRAP_CONFIG);
    });

    it('returns default config when parsed content is not an object', () => {
      mockStorage.setItem(BOOTSTRAP_STORAGE_KEY, JSON.stringify('string-value'));
      const config = BootstrapConfigEngine.getStoredConfig(mockStorage);
      expect(config).toEqual(DEFAULT_BOOTSTRAP_CONFIG);
    });

    it('parses valid stored config with all custom options', () => {
      const custom: BootstrapEnvConfig = {
        RUNNER_ARCH_MODE: 'cuda_sm80',
        GPU_ACCELERATION_ENABLED: true,
        VUC_RUNTIME_ENGINE: 'hvm',
        RAM_GUARD_MB: 7000,
        BATCH_SIZE: 10,
        QUANTIZE_1BIT_ENFORCED: false,
        ED25519_STRICT_ASSERT: false,
        MODEL_CACHE_DIR: '/tmp/custom_models',
      };
      mockStorage.setItem(BOOTSTRAP_STORAGE_KEY, JSON.stringify(custom));

      const retrieved = BootstrapConfigEngine.getStoredConfig(mockStorage);
      expect(retrieved).toEqual(custom);
    });

    it('parses valid arm64_neon and bend options', () => {
      const custom = {
        RUNNER_ARCH_MODE: 'arm64_neon',
        VUC_RUNTIME_ENGINE: 'bend',
      };
      mockStorage.setItem(BOOTSTRAP_STORAGE_KEY, JSON.stringify(custom));

      const retrieved = BootstrapConfigEngine.getStoredConfig(mockStorage);
      expect(retrieved.RUNNER_ARCH_MODE).toBe('arm64_neon');
      expect(retrieved.VUC_RUNTIME_ENGINE).toBe('bend');
    });

    it('falls back to default values for invalid fields inside object', () => {
      const partialInvalid = {
        RUNNER_ARCH_MODE: 'invalid_arch',
        VUC_RUNTIME_ENGINE: 'invalid_engine',
        RAM_GUARD_MB: -100,
        BATCH_SIZE: 'not_a_number',
        MODEL_CACHE_DIR: '   ',
      };
      mockStorage.setItem(BOOTSTRAP_STORAGE_KEY, JSON.stringify(partialInvalid));

      const retrieved = BootstrapConfigEngine.getStoredConfig(mockStorage);
      expect(retrieved.RUNNER_ARCH_MODE).toBe('x86_64_avx2');
      expect(retrieved.VUC_RUNTIME_ENGINE).toBe('python');
      expect(retrieved.RAM_GUARD_MB).toBe(DEFAULT_BOOTSTRAP_CONFIG.RAM_GUARD_MB);
      expect(retrieved.BATCH_SIZE).toBe(DEFAULT_BOOTSTRAP_CONFIG.BATCH_SIZE);
      expect(retrieved.MODEL_CACHE_DIR).toBe(DEFAULT_BOOTSTRAP_CONFIG.MODEL_CACHE_DIR);
    });
  });

  describe('saveConfig', () => {
    it('saves updated configuration successfully to storage', () => {
      const res = BootstrapConfigEngine.saveConfig(
        {
          RUNNER_ARCH_MODE: 'arm64_neon',
          GPU_ACCELERATION_ENABLED: true,
        },
        mockStorage
      );

      expect(res.success).toBe(true);
      expect(res.config.RUNNER_ARCH_MODE).toBe('arm64_neon');
      expect(res.config.GPU_ACCELERATION_ENABLED).toBe(true);
      expect(res.config.RAM_GUARD_MB).toBe(DEFAULT_BOOTSTRAP_CONFIG.RAM_GUARD_MB);

      // Verify stored value in mockStorage
      const raw = mockStorage.getItem(BOOTSTRAP_STORAGE_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.RUNNER_ARCH_MODE).toBe('arm64_neon');
    });

    it('handles storage failure gracefully and returns success: false', () => {
      const failingStorage = {
        ...mockStorage,
        setItem: () => {
          throw new Error('Quota exceeded');
        },
      } as unknown as Storage;

      const res = BootstrapConfigEngine.saveConfig({ BATCH_SIZE: 8 }, failingStorage);
      expect(res.success).toBe(false);
      expect(res.config.BATCH_SIZE).toBe(8);
    });

    it('returns success: false when storage backend is unavailable', () => {
      const res = BootstrapConfigEngine.saveConfig(
        { BATCH_SIZE: 8 },
        null as unknown as Storage
      );
      expect(res.success).toBe(false);
    });
  });

  describe('resetToDefaults', () => {
    it('removes stored key and returns default configuration', () => {
      mockStorage.setItem(BOOTSTRAP_STORAGE_KEY, JSON.stringify({ RAM_GUARD_MB: 9999 }));
      const reset = BootstrapConfigEngine.resetToDefaults(mockStorage);

      expect(reset).toEqual(DEFAULT_BOOTSTRAP_CONFIG);
      expect(mockStorage.getItem(BOOTSTRAP_STORAGE_KEY)).toBeNull();
    });

    it('handles null storage when resetting', () => {
      const reset = BootstrapConfigEngine.resetToDefaults(null as unknown as Storage);
      expect(reset).toEqual(DEFAULT_BOOTSTRAP_CONFIG);
    });
  });

  describe('formatAsEnvString', () => {
    it('formats configuration into standard key=value .env format', () => {
      const envText = BootstrapConfigEngine.formatAsEnvString(DEFAULT_BOOTSTRAP_CONFIG);
      expect(envText).toContain('RUNNER_ARCH_MODE=x86_64_avx2');
      expect(envText).toContain('GPU_ACCELERATION_ENABLED=false');
      expect(envText).toContain('VUC_RUNTIME_ENGINE=python');
      expect(envText).toContain('RAM_GUARD_MB=6092');
      expect(envText).toContain('BATCH_SIZE=5');
      expect(envText).toContain('QUANTIZE_1BIT_ENFORCED=true');
      expect(envText).toContain('ED25519_STRICT_ASSERT=true');
      expect(envText).toContain('MODEL_CACHE_DIR="~/.cache/vuc_models"');
    });
  });
});
