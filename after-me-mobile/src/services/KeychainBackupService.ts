/**
 * Keychain Backup Service — iCloud Keychain sync for device migration.
 * Stores a copy of the vault key in iCloud Keychain (kSecAttrSynchronizable)
 * so it can be restored on a new device when the user signs in with the same Apple ID.
 *
 * iOS: Uses native KeychainSync module with kSecAttrSynchronizable = true.
 * Android: No-op (iCloud Keychain is iOS-only).
 */
import { Platform } from 'react-native';

let keychainSync: typeof import('keychain-sync') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  keychainSync = require('keychain-sync');
} catch {
  keychainSync = null;
}

export const KeychainBackupService = {
  /**
   * Backs up the vault key to iCloud Keychain.
   * Call after KeyManager.initializeKeys() succeeds.
   */
  async backupVaultKey(vaultKeyBase64: string): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;
    if (!keychainSync) return false;
    try {
      await keychainSync.setVaultKeyBackup(vaultKeyBase64);
      return true;
    } catch (e) {
      console.warn('Keychain backup failed (iCloud Keychain may be disabled):', e);
      return false;
    }
  },

  /**
   * Restores the vault key from iCloud Keychain (e.g. on new device).
   * Returns null if no backup exists or on Android.
   */
  async getBackupVaultKey(): Promise<string | null> {
    if (Platform.OS !== 'ios') return null;
    if (!keychainSync) return null;
    try {
      return await keychainSync.getVaultKeyBackup();
    } catch {
      return null;
    }
  },

  /**
   * Removes the iCloud Keychain backup (e.g. on vault reset).
   */
  async deleteBackup(): Promise<void> {
    if (Platform.OS !== 'ios') return;
    if (!keychainSync) return;
    try {
      await keychainSync.deleteVaultKeyBackup();
    } catch {}
  },
};
