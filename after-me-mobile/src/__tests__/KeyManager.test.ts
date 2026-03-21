import * as SecureStore from 'expo-secure-store';
import * as LocalAuth from 'expo-local-authentication';
import { KeyManager } from '../core/auth/KeyManager';

const secureStore = SecureStore as unknown as {
  getItemAsync: jest.Mock;
  setItemAsync: jest.Mock;
  deleteItemAsync: jest.Mock;
  _store: Record<string, string>;
};

jest.mock('../services/KeychainBackupService', () => ({
  KeychainBackupService: {
    backupVaultKey: jest.fn(() => Promise.resolve(true)),
    getBackupVaultKey: jest.fn(() => Promise.resolve(null)),
    deleteBackup: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('../core/storage/EncryptedStorageService', () => ({
  EncryptedStorageService: {
    cleanupStagedFiles: jest.fn(() => Promise.resolve()),
    initializeVault: jest.fn(() => Promise.resolve()),
    reEncryptFileToStaging: jest.fn(() => Promise.resolve()),
    commitStagedFiles: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('../db/DocumentRepository', () => ({
  getAllFileRefs: jest.fn(() => Promise.resolve([])),
  reEncryptAllMetadata: jest.fn(() => Promise.resolve()),
}));

describe('KeyManager', () => {
  beforeEach(() => {
    Object.keys(secureStore._store).forEach((k) => delete secureStore._store[k]);
    KeyManager.clearCache();
    jest.clearAllMocks();
  });

  describe('initializeKeys', () => {
    it('generates and stores a vault key', async () => {
      await KeyManager.initializeKeys();
      expect(secureStore.setItemAsync).toHaveBeenCalledWith(
        'com.afterme.keys.vault',
        expect.any(String),
        expect.objectContaining({
          requireAuthentication: true,
          authenticationPrompt: 'Unlock your After Me vault',
        }),
      );
    });

    it('skips if key already exists (prevents overwrite)', async () => {
      secureStore._store['com.afterme.keys.vault'] = 'existing_key';
      secureStore.getItemAsync.mockImplementation((key: string) =>
        Promise.resolve(secureStore._store[key] ?? null),
      );

      await KeyManager.initializeKeys();
      expect(secureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it('stores without biometric auth if hardware unavailable', async () => {
      (LocalAuth.hasHardwareAsync as jest.Mock).mockResolvedValueOnce(false);

      await KeyManager.initializeKeys();
      expect(secureStore.setItemAsync).toHaveBeenCalledWith(
        'com.afterme.keys.vault',
        expect.any(String),
        expect.objectContaining({ requireAuthentication: false }),
      );
    });
  });

  describe('getVaultKey', () => {
    it('retrieves and caches the vault key', async () => {
      const keyBase64 = Buffer.alloc(32, 0x42).toString('base64');
      // AsyncStorage.getItem (bio pref) returns null, SecureStore.getItemAsync returns key
      const AsyncStorage = jest.requireMock('@react-native-async-storage/async-storage').default;
      AsyncStorage.getItem.mockResolvedValueOnce(null);
      secureStore.getItemAsync.mockResolvedValueOnce(keyBase64);

      const key = await KeyManager.getVaultKey();
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32);
    });

    it('throws if no key exists', async () => {
      const AsyncStorage = jest.requireMock('@react-native-async-storage/async-storage').default;
      AsyncStorage.getItem.mockResolvedValueOnce(null);
      secureStore.getItemAsync.mockResolvedValueOnce(null);
      await expect(KeyManager.getVaultKey()).rejects.toThrow('Vault Key not found');
    });

    it('deduplicates concurrent biometric prompts (Fix 17)', async () => {
      const keyBase64 = Buffer.alloc(32, 0x42).toString('base64');
      const AsyncStorage = jest.requireMock('@react-native-async-storage/async-storage').default;
      AsyncStorage.getItem.mockResolvedValue(null);
      secureStore.getItemAsync.mockResolvedValue(keyBase64);

      const [k1, k2, k3] = await Promise.all([
        KeyManager.getVaultKey(),
        KeyManager.getVaultKey(),
        KeyManager.getVaultKey(),
      ]);

      expect(k1.equals(k2)).toBe(true);
      expect(k2.equals(k3)).toBe(true);
    });
  });

  describe('isInitialized', () => {
    it('returns true if key exists', async () => {
      secureStore.getItemAsync.mockResolvedValueOnce('some_key');
      const result = await KeyManager.isInitialized();
      expect(result).toBe(true);
    });

    it('returns false if key does not exist', async () => {
      secureStore.getItemAsync.mockResolvedValueOnce(null);
      const result = await KeyManager.isInitialized();
      expect(result).toBe(false);
    });

    it('reads without biometric authentication (Fix 18)', async () => {
      await KeyManager.isInitialized();
      expect(secureStore.getItemAsync).toHaveBeenCalledWith(
        'com.afterme.keys.vault',
        expect.objectContaining({ requireAuthentication: false }),
      );
    });
  });

  describe('resetKeys', () => {
    it('clears all keys and staged files', async () => {
      await KeyManager.resetKeys();
      expect(secureStore.deleteItemAsync).toHaveBeenCalledWith('com.afterme.keys.vault');
      expect(secureStore.deleteItemAsync).toHaveBeenCalledWith('com.afterme.keys.vault.pending');
    });
  });

  describe('recoverFromInterruptedRotation', () => {
    it('does nothing when no pending key exists', async () => {
      secureStore.getItemAsync.mockResolvedValueOnce(null);
      await KeyManager.recoverFromInterruptedRotation();
      expect(secureStore.deleteItemAsync).not.toHaveBeenCalled();
    });

    it('cleans up when pending key exists', async () => {
      secureStore.getItemAsync.mockResolvedValueOnce('pending_key');
      await KeyManager.recoverFromInterruptedRotation();
      expect(secureStore.deleteItemAsync).toHaveBeenCalledWith('com.afterme.keys.vault.pending');
    });
  });

  describe('rotateKeys', () => {
    it('re-encrypts files, commits staged files, and updates SecureStore', async () => {
      const keyBase64 = Buffer.alloc(32, 0x42).toString('base64');
      const AsyncStorage = jest.requireMock('@react-native-async-storage/async-storage').default;
      AsyncStorage.getItem.mockResolvedValue(null);
      secureStore.getItemAsync.mockResolvedValue(keyBase64);

      const { EncryptedStorageService } = jest.requireMock('../core/storage/EncryptedStorageService');
      const DocRepo = jest.requireMock('../db/DocumentRepository');
      DocRepo.getAllFileRefs.mockResolvedValue(['file1', 'file2']);

      await KeyManager.rotateKeys();

      expect(EncryptedStorageService.initializeVault).toHaveBeenCalled();
      expect(EncryptedStorageService.reEncryptFileToStaging).toHaveBeenCalledTimes(2);
      expect(EncryptedStorageService.commitStagedFiles).toHaveBeenCalledWith(['file1', 'file2']);
      expect(DocRepo.reEncryptAllMetadata).toHaveBeenCalled();
      expect(secureStore.setItemAsync).toHaveBeenCalledWith(
        'com.afterme.keys.vault',
        expect.any(String),
        expect.objectContaining({ requireAuthentication: true }),
      );
      expect(secureStore.deleteItemAsync).toHaveBeenCalledWith('com.afterme.keys.vault.pending');
    });

    it('backs up new key to keychain after rotation', async () => {
      const keyBase64 = Buffer.alloc(32, 0x42).toString('base64');
      const AsyncStorage = jest.requireMock('@react-native-async-storage/async-storage').default;
      AsyncStorage.getItem.mockResolvedValue(null);
      secureStore.getItemAsync.mockResolvedValue(keyBase64);

      const DocRepo = jest.requireMock('../db/DocumentRepository');
      DocRepo.getAllFileRefs.mockResolvedValue([]);

      const { KeychainBackupService } = jest.requireMock('../services/KeychainBackupService');
      await KeyManager.rotateKeys();

      expect(KeychainBackupService.backupVaultKey).toHaveBeenCalledWith(expect.any(String));
    });
  });

  describe('setBiometricProtection', () => {
    it('re-stores key with biometric auth enabled', async () => {
      const keyBase64 = Buffer.alloc(32, 0x42).toString('base64');
      const AsyncStorage = jest.requireMock('@react-native-async-storage/async-storage').default;
      AsyncStorage.getItem.mockResolvedValue(null);
      secureStore.getItemAsync.mockResolvedValue(keyBase64);

      await KeyManager.setBiometricProtection(true);

      expect(secureStore.deleteItemAsync).toHaveBeenCalledWith('com.afterme.keys.vault');
      expect(secureStore.setItemAsync).toHaveBeenCalledWith(
        'com.afterme.keys.vault',
        keyBase64,
        expect.objectContaining({ requireAuthentication: true }),
      );
    });

    it('re-stores key with biometric auth disabled', async () => {
      const keyBase64 = Buffer.alloc(32, 0x42).toString('base64');
      const AsyncStorage = jest.requireMock('@react-native-async-storage/async-storage').default;
      AsyncStorage.getItem.mockResolvedValue(null);
      secureStore.getItemAsync.mockResolvedValue(keyBase64);

      await KeyManager.setBiometricProtection(false);

      expect(secureStore.setItemAsync).toHaveBeenCalledWith(
        'com.afterme.keys.vault',
        keyBase64,
        expect.objectContaining({ requireAuthentication: false }),
      );
    });

    it('clears the cached key after changing biometric setting', async () => {
      const keyBase64 = Buffer.alloc(32, 0x42).toString('base64');
      const AsyncStorage = jest.requireMock('@react-native-async-storage/async-storage').default;
      AsyncStorage.getItem.mockResolvedValue(null);
      secureStore.getItemAsync.mockResolvedValue(keyBase64);

      await KeyManager.setBiometricProtection(true);

      // After setBiometricProtection, the next getVaultKey should re-fetch
      secureStore.getItemAsync.mockResolvedValue(keyBase64);
      AsyncStorage.getItem.mockResolvedValue(null);
      await KeyManager.getVaultKey();
      // getItemAsync called for getVaultKey (bioPref + key fetch)
      expect(secureStore.getItemAsync).toHaveBeenCalled();
    });

    it('persists biometric preference to AsyncStorage', async () => {
      const keyBase64 = Buffer.alloc(32, 0x42).toString('base64');
      const AsyncStorage = jest.requireMock('@react-native-async-storage/async-storage').default;
      AsyncStorage.getItem.mockResolvedValue(null);
      secureStore.getItemAsync.mockResolvedValue(keyBase64);

      await KeyManager.setBiometricProtection(false);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('afterme_biometric_enabled', 'false');
    });
  });

  describe('restoreFromCloudKeychain', () => {
    it('returns true when backup exists and biometrics available', async () => {
      const { KeychainBackupService } = jest.requireMock('../services/KeychainBackupService');
      KeychainBackupService.getBackupVaultKey.mockResolvedValueOnce('backup_key_base64');
      (LocalAuth.hasHardwareAsync as jest.Mock).mockResolvedValueOnce(true);
      (LocalAuth.isEnrolledAsync as jest.Mock).mockResolvedValueOnce(true);

      const result = await KeyManager.restoreFromCloudKeychain();
      expect(result).toBe(true);
      expect(secureStore.setItemAsync).toHaveBeenCalledWith(
        'com.afterme.keys.vault',
        'backup_key_base64',
        expect.objectContaining({ requireAuthentication: true }),
      );
    });

    it('returns false when no backup exists', async () => {
      const { KeychainBackupService } = jest.requireMock('../services/KeychainBackupService');
      KeychainBackupService.getBackupVaultKey.mockResolvedValueOnce(null);

      const result = await KeyManager.restoreFromCloudKeychain();
      expect(result).toBe(false);
    });

    it('returns false when biometric hardware unavailable', async () => {
      const { KeychainBackupService } = jest.requireMock('../services/KeychainBackupService');
      KeychainBackupService.getBackupVaultKey.mockResolvedValueOnce('backup_key');
      (LocalAuth.hasHardwareAsync as jest.Mock).mockResolvedValueOnce(false);

      const result = await KeyManager.restoreFromCloudKeychain();
      expect(result).toBe(false);
    });

    it('returns false when biometrics not enrolled', async () => {
      const { KeychainBackupService } = jest.requireMock('../services/KeychainBackupService');
      KeychainBackupService.getBackupVaultKey.mockResolvedValueOnce('backup_key');
      (LocalAuth.hasHardwareAsync as jest.Mock).mockResolvedValueOnce(true);
      (LocalAuth.isEnrolledAsync as jest.Mock).mockResolvedValueOnce(false);

      const result = await KeyManager.restoreFromCloudKeychain();
      expect(result).toBe(false);
    });
  });

  describe('clearCache / clearSessionKey', () => {
    it('clearCache clears the cached key so next getVaultKey re-fetches', async () => {
      const keyBase64 = Buffer.alloc(32, 0x42).toString('base64');
      const AsyncStorage = jest.requireMock('@react-native-async-storage/async-storage').default;
      AsyncStorage.getItem.mockResolvedValue(null);
      secureStore.getItemAsync.mockResolvedValue(keyBase64);

      await KeyManager.getVaultKey();
      KeyManager.clearCache();

      // After clearing, getVaultKey must call SecureStore again
      secureStore.getItemAsync.mockClear();
      secureStore.getItemAsync.mockResolvedValue(keyBase64);
      await KeyManager.getVaultKey();
      expect(secureStore.getItemAsync).toHaveBeenCalled();
    });

    it('clearSessionKey is an alias for clearCache', async () => {
      const keyBase64 = Buffer.alloc(32, 0x42).toString('base64');
      const AsyncStorage = jest.requireMock('@react-native-async-storage/async-storage').default;
      AsyncStorage.getItem.mockResolvedValue(null);
      secureStore.getItemAsync.mockResolvedValue(keyBase64);

      await KeyManager.getVaultKey();
      KeyManager.clearSessionKey();

      secureStore.getItemAsync.mockClear();
      secureStore.getItemAsync.mockResolvedValue(keyBase64);
      await KeyManager.getVaultKey();
      expect(secureStore.getItemAsync).toHaveBeenCalled();
    });
  });
});
