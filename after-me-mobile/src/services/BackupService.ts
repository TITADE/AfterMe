/**
 * Backup service — iCloud / CloudKit encrypted backup.
 * Bridges onboarding preferences with the actual CloudBackupService.
 */
import { OnboardingStorage } from './OnboardingStorage';
import { CloudBackupService } from './CloudBackupService';

export const BackupService = {
  async enableIcloudBackup(): Promise<void> {
    await OnboardingStorage.setIcloudBackupEnabled(true);
    await CloudBackupService.setAutoBackupEnabled(true);

    const available = await CloudBackupService.isAvailable();
    if (available) {
      CloudBackupService.backupNow().catch(() => {});
    }
  },

  async disableIcloudBackup(): Promise<void> {
    await OnboardingStorage.setIcloudBackupEnabled(false);
    await CloudBackupService.setAutoBackupEnabled(false);
  },

  async isIcloudBackupEnabled(): Promise<boolean> {
    return OnboardingStorage.isIcloudBackupEnabled();
  },

  async isIcloudAvailable(): Promise<boolean> {
    return CloudBackupService.isAvailable();
  },

  async backupNow(): Promise<boolean> {
    return CloudBackupService.backupNow();
  },

  async getLastBackupDate(): Promise<string | null> {
    return CloudBackupService.getLastBackupDate();
  },

  async getBackupInfo(): Promise<{ documentCount: number; createdAt: string } | null> {
    return CloudBackupService.getBackupInfo();
  },
};
