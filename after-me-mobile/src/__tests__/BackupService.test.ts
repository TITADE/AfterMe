jest.mock('../services/OnboardingStorage', () => ({
  OnboardingStorage: {
    setIcloudBackupEnabled: jest.fn(() => Promise.resolve()),
    isIcloudBackupEnabled: jest.fn(() => Promise.resolve(false)),
  },
}));

jest.mock('../services/CloudBackupService', () => ({
  CloudBackupService: {
    setAutoBackupEnabled: jest.fn(() => Promise.resolve()),
    isAvailable: jest.fn(() => Promise.resolve(true)),
    backupNow: jest.fn(() => Promise.resolve(true)),
    getLastBackupDate: jest.fn(() => Promise.resolve('2024-06-01T00:00:00Z')),
    getBackupInfo: jest.fn(() =>
      Promise.resolve({ documentCount: 5, createdAt: '2024-06-01T00:00:00Z' }),
    ),
  },
}));

import { OnboardingStorage } from '../services/OnboardingStorage';
import { CloudBackupService } from '../services/CloudBackupService';
import { BackupService } from '../services/BackupService';

describe('BackupService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('enableIcloudBackup', () => {
    it('sets onboarding storage and auto-backup to true', async () => {
      await BackupService.enableIcloudBackup();

      expect(OnboardingStorage.setIcloudBackupEnabled).toHaveBeenCalledWith(true);
      expect(CloudBackupService.setAutoBackupEnabled).toHaveBeenCalledWith(true);
    });

    it('triggers immediate backup when iCloud is available', async () => {
      await BackupService.enableIcloudBackup();

      expect(CloudBackupService.isAvailable).toHaveBeenCalled();
      expect(CloudBackupService.backupNow).toHaveBeenCalled();
    });
  });

  describe('disableIcloudBackup', () => {
    it('sets onboarding storage and auto-backup to false', async () => {
      await BackupService.disableIcloudBackup();

      expect(OnboardingStorage.setIcloudBackupEnabled).toHaveBeenCalledWith(false);
      expect(CloudBackupService.setAutoBackupEnabled).toHaveBeenCalledWith(false);
    });
  });

  describe('isIcloudBackupEnabled', () => {
    it('delegates to OnboardingStorage', async () => {
      (OnboardingStorage.isIcloudBackupEnabled as jest.Mock).mockResolvedValue(true);

      const result = await BackupService.isIcloudBackupEnabled();

      expect(result).toBe(true);
      expect(OnboardingStorage.isIcloudBackupEnabled).toHaveBeenCalled();
    });
  });

  describe('isIcloudAvailable', () => {
    it('delegates to CloudBackupService', async () => {
      (CloudBackupService.isAvailable as jest.Mock).mockResolvedValue(false);

      const result = await BackupService.isIcloudAvailable();

      expect(result).toBe(false);
      expect(CloudBackupService.isAvailable).toHaveBeenCalled();
    });
  });

  describe('backupNow', () => {
    it('delegates to CloudBackupService', async () => {
      const result = await BackupService.backupNow();

      expect(result).toBe(true);
      expect(CloudBackupService.backupNow).toHaveBeenCalled();
    });
  });

  describe('getLastBackupDate', () => {
    it('delegates to CloudBackupService', async () => {
      const result = await BackupService.getLastBackupDate();

      expect(result).toBe('2024-06-01T00:00:00Z');
      expect(CloudBackupService.getLastBackupDate).toHaveBeenCalled();
    });
  });
});
