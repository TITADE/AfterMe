/**
 * Backup service — iCloud / CloudKit encrypted backup.
 * Phase 1: Sets persisted flag. Full CloudKit integration TBD.
 */
import { OnboardingStorage } from './OnboardingStorage';

export const BackupService = {
  /**
   * Enable encrypted iCloud backup.
   * TODO: Wire to CloudKit setup (encrypted vault key sync).
   */
  async enableIcloudBackup(): Promise<void> {
    await OnboardingStorage.setIcloudBackupEnabled(true);
    // Placeholder for future: CloudKit encrypted record creation
  },

  async isIcloudBackupEnabled(): Promise<boolean> {
    return OnboardingStorage.isIcloudBackupEnabled();
  },
};
