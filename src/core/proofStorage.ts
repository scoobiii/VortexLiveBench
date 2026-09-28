/**
 * VUC Proof Attestation Local Storage Manager
 * Enables cross-session persistence and retrieval of audited VUC proofs
 */

import { VucProofAttestation } from '../types/vuc';

export interface SavedVucProofItem {
  id: string;
  savedAt: string;
  modelName: string;
  modelId: string;
  proofId: string;
  merkleRoot: string;
  status: string;
  rawJson: string;
  isValid: boolean;
  tokensCount: number;
}

export const VUC_STORAGE_KEY = 'vuc_saved_proof_attestations';

export class ProofStorageEngine {
  /**
   * Helper to resolve available storage (custom or window.localStorage)
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
   * Retrieves all saved VUC proofs from storage (defaults to window.localStorage)
   */
  static getStoredProofs(customStorage?: Storage): SavedVucProofItem[] {
    try {
      const storage = this.resolveStorage(customStorage);
      if (!storage) return [];

      const raw = storage.getItem(VUC_STORAGE_KEY);
      if (!raw) return [];

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Parses and saves a VUC proof attestation to local storage
   */
  static saveProofToStorage(
    rawJson: string,
    verificationValid: boolean = true,
    customStorage?: Storage
  ): SavedVucProofItem {
    let parsed: Partial<VucProofAttestation> | null = null;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      parsed = null;
    }

    const now = new Date().toISOString();
    const proofId = parsed?.proof_id || parsed?.model?.id || `vuc_${Date.now()}`;
    const modelName = parsed?.model?.name || parsed?.model?.id || 'LLM Model';
    const modelId = parsed?.model?.id || 'unknown-model';
    const merkleRoot = parsed?.execution?.merkle_root || 'N/A';
    const status = parsed?.status || (verificationValid ? 'VERIFIED_VALID' : 'INVALID');
    const tokensCount = parsed?.trace?.length ?? parsed?.execution?.tokens_count ?? 0;

    const newItem: SavedVucProofItem = {
      id: `saved_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      savedAt: now,
      modelName,
      modelId,
      proofId,
      merkleRoot,
      status,
      rawJson,
      isValid: verificationValid,
      tokensCount,
    };

    try {
      const storage = this.resolveStorage(customStorage);
      if (storage) {
        const existing = this.getStoredProofs(storage);
        const filtered = existing.filter((item) => item.proofId !== proofId);
        const updated = [newItem, ...filtered].slice(0, 50); // Keep last 50 proofs
        storage.setItem(VUC_STORAGE_KEY, JSON.stringify(updated));
      }
    } catch {
      // Storage quota or disabled fallback
    }

    return newItem;
  }

  /**
   * Deletes a specific saved proof by ID
   */
  static deleteProofFromStorage(id: string, customStorage?: Storage): SavedVucProofItem[] {
    try {
      const storage = this.resolveStorage(customStorage);
      if (!storage) return [];

      const existing = this.getStoredProofs(storage);
      const updated = existing.filter((item) => item.id !== id);
      storage.setItem(VUC_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  }

  /**
   * Clears all saved proofs from local storage
   */
  static clearAllStoredProofs(customStorage?: Storage): void {
    try {
      const storage = this.resolveStorage(customStorage);
      if (storage) {
        storage.removeItem(VUC_STORAGE_KEY);
      }
    } catch {
      // Storage access error fallback
    }
  }
}
