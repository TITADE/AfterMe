/**
 * VaultKeyStore — sole owner of the in-memory vault key cache and the
 * SecureStore retrieval logic.
 *
 * Extracted from KeyManager to break two circular-dependency chains:
 *
 *   Before:
 *     EncryptedStorageService → KeyManager → EncryptedStorageService  (cycle)
 *     DocumentRepository     → KeyManager → DocumentRepository       (cycle)
 *
 *   After:
 *     EncryptedStorageService → VaultKeyStore  (no cycle)
 *     DocumentRepository     → VaultKeyStore  (no cycle)
 *     KeyManager             → VaultKeyStore  (one-way, KeyManager orchestrates rotation)
 *     KeyManager             → EncryptedStorageService  (fine)
 *     KeyManager             → DocumentRepository       (fine)
 *
 * This module has zero imports from the rest of the app — only platform
 * libraries. Keep it that way.
 */
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, type NativeEventSubscription } from 'react-native';

export const VAULT_KEY_TAG = 'com.afterme.keys.vault';
export const BIOMETRIC_PREF_KEY = 'afterme_biometric_enabled';

let cachedVaultKey: Buffer | null = null;
let pendingKeyPromise: Promise<Buffer> | null = null;
let appStateSubscription: NativeEventSubscription | null = null;

function ensureAppStateListener(): void {
  if (appStateSubscription) return;
  appStateSubscription = AppState.addEventListener('change', (state) => {
    if (state === 'background') {
      // Zero-fill before releasing to prevent key material lingering in heap.
      // pendingKeyPromise is NOT cleared here — clearing it during 'inactive'
      // (which fires when Face ID system dialogs appear) caused duplicate
      // biometric prompts. It must resolve naturally.
      if (cachedVaultKey) cachedVaultKey.fill(0);
      cachedVaultKey = null;
    }
  });
}

/**
 * Returns the vault key, prompting biometrics on first call per foreground
 * session. Subsequent calls return the cached key until the app is
 * backgrounded. Concurrent callers share a single pending promise to avoid
 * duplicate prompts.
 */
export async function getVaultKey(): Promise<Buffer> {
  ensureAppStateListener();

  if (cachedVaultKey) return cachedVaultKey;
  if (pendingKeyPromise) return pendingKeyPromise;

  pendingKeyPromise = (async () => {
    try {
      const bioPref = await AsyncStorage.getItem(BIOMETRIC_PREF_KEY);
      const requireAuth = bioPref !== 'false';

      const keyBase64 = await SecureStore.getItemAsync(VAULT_KEY_TAG, {
        requireAuthentication: requireAuth,
        authenticationPrompt: 'Unlock your After Me vault',
      });

      if (!keyBase64) {
        throw new Error('Vault Key not found. Please re-initialize.');
      }

      cachedVaultKey = Buffer.from(keyBase64, 'base64');
      return cachedVaultKey;
    } finally {
      pendingKeyPromise = null;
    }
  })();

  return pendingKeyPromise;
}

/** Zero-fills and evicts the cached key. Safe to call when key is null. */
export function clearCachedKey(): void {
  if (cachedVaultKey) cachedVaultKey.fill(0);
  cachedVaultKey = null;
}

/**
 * Replaces the cached key with a new one, zero-filling the old key first.
 * Used by KeyManager after a successful key rotation so callers immediately
 * use the new key without another biometric prompt.
 */
export function setCachedKey(key: Buffer): void {
  if (cachedVaultKey) cachedVaultKey.fill(0);
  cachedVaultKey = key;
}
