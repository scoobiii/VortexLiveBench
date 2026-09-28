import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  limit,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType, testFirestoreConnection } from './config';
import { VucProofAttestation } from '../types/vuc';
import { BootstrapEnvConfig } from '../core/bootstrapConfig';

interface FirebaseContextType {
  user: User | null;
  authReady: boolean;
  isOnline: boolean;
  cloudProofs: VucProofAttestation[];
  publicProofsList: VucProofAttestation[];
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  saveProofToCloud: (attestation: VucProofAttestation, sharePublicly?: boolean) => Promise<{ success: boolean; error?: string }>;
  syncBootstrapToCloud: (config: BootstrapEnvConfig) => Promise<{ success: boolean; error?: string }>;
  loadBootstrapFromCloud: () => Promise<BootstrapEnvConfig | null>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [cloudProofs, setCloudProofs] = useState<VucProofAttestation[]>([]);
  const [publicProofsList, setPublicProofsList] = useState<VucProofAttestation[]>([]);

  // Initial connection test
  useEffect(() => {
    testFirestoreConnection().then((connected) => {
      setIsOnline(connected);
    });
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);

      // Create / update user profile record on sign in
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          await setDoc(
            userRef,
            {
              userId: currentUser.uid,
              email: currentUser.email || 'anonymous@user.com',
              displayName: currentUser.displayName || 'VUC Researcher',
              photoURL: currentUser.photoURL || '',
              createdAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (err) {
          console.warn('Could not sync user profile to Firestore:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen to user private proofs in Firestore
  useEffect(() => {
    if (!user) {
      setCloudProofs([]);
      return;
    }

    const proofsCol = collection(db, 'users', user.uid, 'proofs');
    const unsubscribe = onSnapshot(
      proofsCol,
      (snapshot) => {
        const loaded: VucProofAttestation[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loaded.push({
            vuc_spec_version: '1.0.4-livebench',
            proof_id: data.proofId,
            created_at: data.createdAt,
            model: {
              id: data.modelId,
              name: data.modelName || data.modelId,
              quantization: 'bitnet_b1.58',
              params_b: 0.5,
              weights_sha256: data.merkleRoot,
              tensor_merkle_root: data.merkleRoot,
              public_key_hex: data.publicKeyHex || '0'.repeat(64),
            },
            execution: {
              prompt: data.prompt || '',
              prompt_hash: data.promptHash || '',
              seed: 42,
              temperature: 0.0,
              output_text: data.outputText || '',
              tokens_count: data.tokensCount || 0,
              merkle_root: data.merkleRoot,
              reproducibility_signature: data.signatureEd25519,
              signature_ed25519_hex: data.signatureEd25519,
              execution_time_ms: 120,
              verification_time_ms: 10,
              peak_ram_mb: data.peakRamMb || 350,
              runner_env: 'github-actions-ubuntu-latest (cloud synced)',
            },
            trace: [],
            status: data.status,
          });
        });
        setCloudProofs(loaded);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}/proofs`);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Listen to public verified proofs
  useEffect(() => {
    const publicQuery = query(collection(db, 'publicProofs'), limit(25));
    const unsubscribe = onSnapshot(
      publicQuery,
      (snapshot) => {
        const loaded: VucProofAttestation[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loaded.push({
            vuc_spec_version: '1.0.4-livebench',
            proof_id: data.proofId,
            created_at: data.createdAt,
            model: {
              id: data.modelId,
              name: data.modelName || data.modelId,
              quantization: 'bitnet_b1.58',
              params_b: 0.5,
              weights_sha256: data.merkleRoot,
              tensor_merkle_root: data.merkleRoot,
              public_key_hex: data.publicKeyHex || '0'.repeat(64),
            },
            execution: {
              prompt: data.prompt || '',
              prompt_hash: data.promptHash || '',
              seed: 42,
              temperature: 0.0,
              output_text: data.outputText || '',
              tokens_count: data.tokensCount || 0,
              merkle_root: data.merkleRoot,
              reproducibility_signature: data.signatureEd25519,
              signature_ed25519_hex: data.signatureEd25519,
              execution_time_ms: 120,
              verification_time_ms: 10,
              peak_ram_mb: data.peakRamMb || 350,
              runner_env: 'public benchmark registry',
            },
            trace: [],
            status: data.status,
          });
        });
        setPublicProofsList(loaded);
      },
      (error) => {
        console.warn('Could not read public proofs:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Sign in failed:', err);
      throw err;
    }
  }, []);

  const signOutUser = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out failed:', err);
      throw err;
    }
  }, []);

  const saveProofToCloud = useCallback(
    async (
      attestation: VucProofAttestation,
      sharePublicly: boolean = false
    ): Promise<{ success: boolean; error?: string }> => {
      if (!user) {
        return { success: false, error: 'Faça login com sua conta Google para salvar na nuvem.' };
      }

      const safeProofId = (attestation.proof_id || `vuc_${Date.now()}`).replace(/[^a-zA-Z0-9_\-]/g, '_');
      const payload = {
        proofId: safeProofId,
        userId: user.uid,
        modelId: attestation.model.id,
        modelName: attestation.model.name,
        prompt: attestation.execution.prompt.slice(0, 4000),
        promptHash: attestation.execution.prompt_hash,
        merkleRoot: attestation.execution.merkle_root,
        signatureEd25519: attestation.execution.reproducibility_signature,
        publicKeyHex: attestation.model.public_key_hex || '0'.repeat(64),
        outputText: attestation.execution.output_text.slice(0, 8000),
        tokensCount: attestation.execution.tokens_count,
        peakRamMb: attestation.execution.peak_ram_mb,
        status: attestation.status,
        createdAt: attestation.created_at || new Date().toISOString(),
      };

      try {
        const userProofDoc = doc(db, 'users', user.uid, 'proofs', safeProofId);
        await setDoc(userProofDoc, payload);

        if (sharePublicly && attestation.status === 'VERIFIED_VALID') {
          const publicProofDoc = doc(db, 'publicProofs', safeProofId);
          await setDoc(publicProofDoc, payload);
        }

        return { success: true };
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/proofs/${safeProofId}`);
      }
    },
    [user]
  );

  const syncBootstrapToCloud = useCallback(
    async (config: BootstrapEnvConfig): Promise<{ success: boolean; error?: string }> => {
      if (!user) {
        return { success: false, error: 'Faça login para sincronizar configurações com o Firestore.' };
      }

      const payload = {
        userId: user.uid,
        RUNNER_ARCH_MODE: config.RUNNER_ARCH_MODE,
        GPU_ACCELERATION_ENABLED: Boolean(config.GPU_ACCELERATION_ENABLED),
        VUC_RUNTIME_ENGINE: config.VUC_RUNTIME_ENGINE,
        RAM_GUARD_MB: Number(config.RAM_GUARD_MB),
        BATCH_SIZE: Number(config.BATCH_SIZE),
        QUANTIZE_1BIT_ENFORCED: Boolean(config.QUANTIZE_1BIT_ENFORCED),
        ED25519_STRICT_ASSERT: Boolean(config.ED25519_STRICT_ASSERT),
        MODEL_CACHE_DIR: config.MODEL_CACHE_DIR,
        updatedAt: new Date().toISOString(),
      };

      try {
        const configDoc = doc(db, 'users', user.uid, 'bootstrapConfig', 'current');
        await setDoc(configDoc, payload);
        return { success: true };
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/bootstrapConfig/current`);
      }
    },
    [user]
  );

  const loadBootstrapFromCloud = useCallback(async (): Promise<BootstrapEnvConfig | null> => {
    if (!user) return null;

    try {
      const configDoc = doc(db, 'users', user.uid, 'bootstrapConfig', 'current');
      const snap = await getDoc(configDoc);
      if (!snap.exists()) return null;

      const data = snap.data();
      return {
        RUNNER_ARCH_MODE: data.RUNNER_ARCH_MODE,
        GPU_ACCELERATION_ENABLED: data.GPU_ACCELERATION_ENABLED,
        VUC_RUNTIME_ENGINE: data.VUC_RUNTIME_ENGINE,
        RAM_GUARD_MB: data.RAM_GUARD_MB,
        BATCH_SIZE: data.BATCH_SIZE,
        QUANTIZE_1BIT_ENFORCED: data.QUANTIZE_1BIT_ENFORCED,
        ED25519_STRICT_ASSERT: data.ED25519_STRICT_ASSERT,
        MODEL_CACHE_DIR: data.MODEL_CACHE_DIR,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}/bootstrapConfig/current`);
    }
  }, [user]);

  return (
    <FirebaseContext.Provider
      value={{
        user,
        authReady,
        isOnline,
        cloudProofs,
        publicProofsList,
        signInWithGoogle,
        signOutUser,
        saveProofToCloud,
        syncBootstrapToCloud,
        loadBootstrapFromCloud,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return ctx;
};
