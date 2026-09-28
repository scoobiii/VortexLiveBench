import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProofStorageEngine, VUC_STORAGE_KEY } from '../src/core/proofStorage';

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
    return Object.keys(this.store)[index] ?? null;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
}

describe('ProofStorageEngine', () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
  });

  describe('resolveStorage', () => {
    it('returns customStorage if provided', () => {
      expect(ProofStorageEngine.resolveStorage(mockStorage)).toBe(mockStorage);
    });

    it('returns null if window is undefined and no customStorage is provided', () => {
      const origWindow = globalThis.window;
      // @ts-expect-error simulating node environment
      delete globalThis.window;

      expect(ProofStorageEngine.resolveStorage()).toBeNull();

      globalThis.window = origWindow;
    });

    it('returns window.localStorage if window is defined and no customStorage provided', () => {
      const origWindow = globalThis.window;
      // @ts-expect-error simulating browser window
      globalThis.window = { localStorage: mockStorage };

      expect(ProofStorageEngine.resolveStorage()).toBe(mockStorage);

      globalThis.window = origWindow;
    });
  });

  describe('getStoredProofs', () => {
    it('returns empty array when storage is empty', () => {
      const proofs = ProofStorageEngine.getStoredProofs(mockStorage);
      expect(proofs).toEqual([]);
    });

    it('returns empty array if storage is undefined and window is unavailable', () => {
      // Pass null as storage
      const proofs = ProofStorageEngine.getStoredProofs(null as unknown as Storage);
      expect(proofs).toEqual([]);
    });

    it('returns stored proofs array when valid data exists in storage', () => {
      const sample = [
        {
          id: 'test-1',
          savedAt: '2026-09-28T03:00:00Z',
          modelName: 'SmolLM2',
          modelId: 'smollm2',
          proofId: 'vuc_123',
          merkleRoot: '0xabc',
          status: 'VERIFIED_VALID',
          rawJson: '{}',
          isValid: true,
          tokensCount: 4,
        },
      ];
      mockStorage.setItem(VUC_STORAGE_KEY, JSON.stringify(sample));

      const retrieved = ProofStorageEngine.getStoredProofs(mockStorage);
      expect(retrieved).toHaveLength(1);
      expect(retrieved[0].proofId).toBe('vuc_123');
    });

    it('returns empty array if stored data is not an array or corrupted JSON', () => {
      mockStorage.setItem(VUC_STORAGE_KEY, '{"notAnArray": true}');
      expect(ProofStorageEngine.getStoredProofs(mockStorage)).toEqual([]);

      mockStorage.setItem(VUC_STORAGE_KEY, 'invalid-json{{');
      expect(ProofStorageEngine.getStoredProofs(mockStorage)).toEqual([]);
    });

    it('handles storage throwing an error gracefully', () => {
      const throwingStorage = {
        getItem: () => {
          throw new Error('Access denied');
        },
      } as unknown as Storage;

      expect(ProofStorageEngine.getStoredProofs(throwingStorage)).toEqual([]);
    });
  });

  describe('saveProofToStorage', () => {
    it('saves valid VUC proof JSON with all metadata extracted', () => {
      const validProofJson = JSON.stringify({
        status: 'VERIFIED_VALID',
        proof_id: 'vuc_prf_qwen_123',
        model: {
          id: 'qwen2.5-0.5b',
          name: 'Qwen2.5-0.5B-Instruct',
        },
        execution: {
          merkle_root: '0x123456789abcdef',
          tokens_count: 8,
        },
        trace: [{}, {}, {}, {}, {}, {}, {}, {}],
      });

      const saved = ProofStorageEngine.saveProofToStorage(validProofJson, true, mockStorage);
      expect(saved.modelName).toBe('Qwen2.5-0.5B-Instruct');
      expect(saved.modelId).toBe('qwen2.5-0.5b');
      expect(saved.proofId).toBe('vuc_prf_qwen_123');
      expect(saved.merkleRoot).toBe('0x123456789abcdef');
      expect(saved.tokensCount).toBe(8);
      expect(saved.isValid).toBe(true);
      expect(saved.status).toBe('VERIFIED_VALID');

      // Verify persisted in mockStorage
      const inStorage = ProofStorageEngine.getStoredProofs(mockStorage);
      expect(inStorage).toHaveLength(1);
      expect(inStorage[0].proofId).toBe('vuc_prf_qwen_123');
    });

    it('handles corrupted JSON input gracefully and assigns fallback values', () => {
      const saved = ProofStorageEngine.saveProofToStorage('not-valid-json', false, mockStorage);
      expect(saved.modelName).toBe('LLM Model');
      expect(saved.merkleRoot).toBe('N/A');
      expect(saved.isValid).toBe(false);
      expect(saved.status).toBe('INVALID');
    });

    it('deduplicates previous proof with the same proofId and caps at 50', () => {
      const makeProofJson = (proofId: string) =>
        JSON.stringify({
          proof_id: proofId,
          model: { id: 'test-model' },
          execution: { merkle_root: '0x111', tokens_count: 2 },
        });

      // Save initial
      ProofStorageEngine.saveProofToStorage(makeProofJson('vuc_dup_1'), true, mockStorage);
      expect(ProofStorageEngine.getStoredProofs(mockStorage)).toHaveLength(1);

      // Save again with same proofId (updates it, no duplicate)
      ProofStorageEngine.saveProofToStorage(makeProofJson('vuc_dup_1'), true, mockStorage);
      expect(ProofStorageEngine.getStoredProofs(mockStorage)).toHaveLength(1);

      // Save 55 different proofs to test cap of 50
      for (let i = 0; i < 55; i++) {
        ProofStorageEngine.saveProofToStorage(makeProofJson(`vuc_prf_num_${i}`), true, mockStorage);
      }
      expect(ProofStorageEngine.getStoredProofs(mockStorage).length).toBe(50);
    });

    it('handles storage throwing an error during save', () => {
      const throwingStorage = {
        getItem: () => null,
        setItem: () => {
          throw new Error('Quota exceeded');
        },
      } as unknown as Storage;

      // Should not throw
      const result = ProofStorageEngine.saveProofToStorage('{}', true, throwingStorage);
      expect(result.id).toBeTruthy();
    });

    it('handles null storage during save without throwing', () => {
      const result = ProofStorageEngine.saveProofToStorage('{}', true, null as unknown as Storage);
      expect(result.id).toBeTruthy();
    });
  });

  describe('deleteProofFromStorage', () => {
    it('removes item with matching id from storage', () => {
      const item1 = ProofStorageEngine.saveProofToStorage(
        JSON.stringify({ proof_id: 'p1' }),
        true,
        mockStorage
      );
      const item2 = ProofStorageEngine.saveProofToStorage(
        JSON.stringify({ proof_id: 'p2' }),
        true,
        mockStorage
      );

      expect(ProofStorageEngine.getStoredProofs(mockStorage)).toHaveLength(2);

      const remaining = ProofStorageEngine.deleteProofFromStorage(item1.id, mockStorage);
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(item2.id);
    });

    it('handles null storage or throwing storage gracefully on delete', () => {
      expect(ProofStorageEngine.deleteProofFromStorage('any-id', null as unknown as Storage)).toEqual([]);

      const throwingStorage = {
        getItem: () => {
          throw new Error('Storage error');
        },
      } as unknown as Storage;

      expect(ProofStorageEngine.deleteProofFromStorage('any-id', throwingStorage)).toEqual([]);
    });
  });

  describe('clearAllStoredProofs', () => {
    it('removes all saved proofs from storage', () => {
      ProofStorageEngine.saveProofToStorage('{}', true, mockStorage);
      expect(ProofStorageEngine.getStoredProofs(mockStorage)).toHaveLength(1);

      ProofStorageEngine.clearAllStoredProofs(mockStorage);
      expect(ProofStorageEngine.getStoredProofs(mockStorage)).toHaveLength(0);
    });

    it('handles null storage or throwing storage gracefully on clear', () => {
      // Null storage
      expect(() => ProofStorageEngine.clearAllStoredProofs(null as unknown as Storage)).not.toThrow();

      // Throwing storage
      const throwingStorage = {
        removeItem: () => {
          throw new Error('Storage error');
        },
      } as unknown as Storage;

      expect(() => ProofStorageEngine.clearAllStoredProofs(throwingStorage)).not.toThrow();
    });
  });
});
