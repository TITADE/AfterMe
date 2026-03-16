import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { CryptoService } from '../crypto/CryptoService';

const MASTER_KEY_TAG = 'com.afterme.keys.master';
const VAULT_KEY_TAG = 'com.afterme.keys.vault';

export class KeyManager {
  /**
   * Initializes the vault keys.
   * Generates a Master Key (stored in SecureStore) and a Vault Key (encrypted by Master Key).
   */
  static async initializeKeys(): Promise<void> {
    // Check biometric availability
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      throw new Error('Biometric authentication is required.');
    }

    // 1. Generate Vault Key (AES-256)
    const vaultKey = CryptoService.generateKey();

    // 2. Store Vault Key in SecureStore
    // SecureStore encrypts data using the device's Secure Enclave / Keystore.
    // We set `requireAuthentication: true` to force biometric unlock.
    await SecureStore.setItemAsync(VAULT_KEY_TAG, vaultKey.toString('base64'), {
      keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
      requireAuthentication: true, // Forces FaceID / TouchID / Passcode
      authenticationPrompt: 'Unlock your After Me vault',
    });
  }

  /**
   * Retrieves the Vault Key.
   * Triggers the OS Biometric Prompt.
   */
  static async getVaultKey(): Promise<Buffer> {
    try {
      const keyBase64 = await SecureStore.getItemAsync(VAULT_KEY_TAG, {
        requireAuthentication: true,
        authenticationPrompt: 'Unlock your After Me vault',
      });

      if (!keyBase64) {
        throw new Error('Vault Key not found. Please re-initialize.');
      }

      return Buffer.from(keyBase64, 'base64');
    } catch (error) {
      console.error('Failed to retrieve vault key:', error);
      throw error;
    }
  }

  /**
   * Checks if the vault is initialized.
   */
  static async isInitialized(): Promise<boolean> {
    const key = await SecureStore.getItemAsync(VAULT_KEY_TAG, {
        requireAuthentication: false // Just checking existence
    });
    return !!key;
  }

  /**
   * Deletes keys (Vault Reset).
   */
  static async resetKeys(): Promise<void> {
    await SecureStore.deleteItemAsync(VAULT_KEY_TAG);
  }
}
