let mockPlatformOS = 'ios';

jest.mock('react-native', () => ({
  Platform: {
    get OS() { return mockPlatformOS; },
    select: jest.fn((s: Record<string, unknown>) => s[mockPlatformOS]),
  },
}));

import { KeychainBackupService } from '../services/KeychainBackupService';

describe('KeychainBackupService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPlatformOS = 'ios';
  });

  describe('backupVaultKey', () => {
    it('returns true on iOS', async () => {
      const result = await KeychainBackupService.backupVaultKey('base64key');
      expect(result).toBe(true);
    });

    it('returns false on non-iOS', async () => {
      mockPlatformOS = 'android';
      const result = await KeychainBackupService.backupVaultKey('base64key');
      expect(result).toBe(false);
    });

    it('returns false when keychain-sync throws', async () => {
      const keychainSync = require('keychain-sync');
      keychainSync.setVaultKeyBackup.mockRejectedValueOnce(new Error('keychain error'));
      const result = await KeychainBackupService.backupVaultKey('base64key');
      expect(result).toBe(false);
    });
  });

  describe('getBackupVaultKey', () => {
    it('returns null on non-iOS', async () => {
      mockPlatformOS = 'android';
      const result = await KeychainBackupService.getBackupVaultKey();
      expect(result).toBeNull();
    });

    it('returns value from keychain on iOS', async () => {
      const keychainSync = require('keychain-sync');
      keychainSync.getVaultKeyBackup.mockResolvedValueOnce('stored-vault-key');
      const result = await KeychainBackupService.getBackupVaultKey();
      expect(result).toBe('stored-vault-key');
    });
  });

  describe('deleteBackup', () => {
    it('runs without error', async () => {
      await expect(KeychainBackupService.deleteBackup()).resolves.toBeUndefined();
    });
  });
});
