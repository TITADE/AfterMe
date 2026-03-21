/**
 * CloudBackupService — encrypts the entire vault and uploads to iCloud Documents.
 *
 * Backup format: a single encrypted blob per backup version, plus a metadata JSON.
 * The vault key itself is backed up separately via KeychainBackupService (iCloud Keychain).
 *
 * Backup flow:
 *   1. Export all document records + encrypted files → single archive
 *   2. Encrypt archive with the vault key
 *   3. Write encrypted archive + metadata to iCloud Documents container
 *
 * Restore flow:
 *   1. Read metadata + encrypted archive from iCloud
 *   2. Decrypt with vault key (which was restored from iCloud Keychain)
 *   3. Import document records + files back into local vault
 */
import { Platform } from 'react-native';
import { Buffer } from 'buffer';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CryptoService } from '../core/crypto/CryptoService';
import { KeyManager } from '../core/auth/KeyManager';
import { EncryptedStorageService } from '../core/storage/EncryptedStorageService';
import * as DocumentRepository from '../db/DocumentRepository';
import { OnboardingStorage } from './OnboardingStorage';
import { AnalyticsService } from './AnalyticsService';
import { captureVaultError } from './SentryService';

const BACKUP_SIZE_LIMIT_BYTES = 200 * 1024 * 1024;

const BACKUP_DIR = 'AfterMe';
const BACKUP_METADATA_FILE = `${BACKUP_DIR}/backup-meta.json`;
const BACKUP_VAULT_FILE = `${BACKUP_DIR}/vault-backup.enc`;

const BACKUP_STATUS_KEY = 'afterme_backup_status';
const LAST_BACKUP_KEY = 'afterme_last_backup_date';
const AUTO_BACKUP_KEY = 'afterme_auto_backup_enabled';

export type BackupStatus = 'idle' | 'backing_up' | 'restoring' | 'success' | 'error';

type BackupMetadata = {
  version: number;
  createdAt: string;
  documentCount: number;
  appVersion: string;
  platform: string;
  skippedFiles?: number;
};

let backupDebounceTimer: ReturnType<typeof setTimeout> | null = null;
const BACKUP_DEBOUNCE_MS = 30_000; // 30 seconds

let ICloudModule: {
  isICloudAvailable: () => Promise<boolean>;
  writeToICloud: (path: string, base64: string) => Promise<boolean>;
  readFromICloud: (path: string) => Promise<string | null>;
  deleteFromICloud: (path: string) => Promise<boolean>;
  listICloudFiles: (path: string) => Promise<string[]>;
} | null = null;

try {
  if (Platform.OS === 'ios') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ICloudModule = require('../../modules/icloud-backup');
  }
} catch {
  ICloudModule = null;
}

export class CloudBackupService {
  static async isAvailable(): Promise<boolean> {
    if (!ICloudModule) return false;
    try {
      return await ICloudModule.isICloudAvailable();
    } catch {
      return false;
    }
  }

  static async isAutoBackupEnabled(): Promise<boolean> {
    const val = await AsyncStorage.getItem(AUTO_BACKUP_KEY);
    return val === 'true';
  }

  static async setAutoBackupEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(AUTO_BACKUP_KEY, enabled ? 'true' : 'false');
    await OnboardingStorage.setIcloudBackupEnabled(enabled);
  }

  static async getLastBackupDate(): Promise<string | null> {
    return AsyncStorage.getItem(LAST_BACKUP_KEY);
  }

  static async getBackupStatus(): Promise<BackupStatus> {
    const val = await AsyncStorage.getItem(BACKUP_STATUS_KEY);
    return (val as BackupStatus) || 'idle';
  }

  private static async setStatus(status: BackupStatus): Promise<void> {
    await AsyncStorage.setItem(BACKUP_STATUS_KEY, status);
  }

  /**
   * Perform a full vault backup to iCloud.
   * Returns true on success.
   */
  static async backupNow(): Promise<boolean> {
    if (!ICloudModule) return false;

    const available = await this.isAvailable();
    if (!available) return false;

    await this.setStatus('backing_up');

    try {
      const docs = await DocumentRepository.getAllDocuments();

      const vaultData: { documents: typeof docs; files: Record<string, string> } = {
        documents: docs,
        files: {},
      };

      let totalBytes = 0;
      let skippedFiles = 0;
      for (const doc of docs) {
        try {
          const fileContent = await EncryptedStorageService.readFile(doc.fileRef);
          totalBytes += fileContent.length;
          if (totalBytes > BACKUP_SIZE_LIMIT_BYTES) {
            throw new Error(
              'Vault too large for iCloud backup. Total file size exceeds ' +
              `${BACKUP_SIZE_LIMIT_BYTES / 1024 / 1024}MB.`,
            );
          }
          vaultData.files[doc.fileRef] = fileContent.toString('base64');
        } catch (fileErr) {
          if ((fileErr as Error).message?.includes('too large')) throw fileErr;
          skippedFiles++;
        }

        if (doc.thumbnailRef) {
          try {
            const thumbContent = await EncryptedStorageService.readFile(doc.thumbnailRef);
            totalBytes += thumbContent.length;
            vaultData.files[doc.thumbnailRef] = thumbContent.toString('base64');
          } catch {
            skippedFiles++;
          }
        }
      }

      const jsonPayload = JSON.stringify(vaultData);
      const payloadBuffer = Buffer.from(jsonPayload, 'utf-8');

      const vaultKey = await KeyManager.getVaultKey();
      const encrypted = CryptoService.encrypt(payloadBuffer, vaultKey);
      const encryptedBase64 = encrypted.toString('base64');

      await ICloudModule.writeToICloud(BACKUP_VAULT_FILE, encryptedBase64);

      if (skippedFiles > 0) {
        console.warn(
          `[CloudBackupService] Backup completed with ${skippedFiles} file(s) skipped (read failed).`,
        );
      }

      const metadata: BackupMetadata = {
        version: 1,
        createdAt: new Date().toISOString(),
        documentCount: docs.length,
        appVersion: Constants.expoConfig?.version ?? '1.0.0',
        platform: Platform.OS,
        skippedFiles,
      };

      const metaBase64 = Buffer.from(JSON.stringify(metadata), 'utf-8').toString('base64');
      await ICloudModule.writeToICloud(BACKUP_METADATA_FILE, metaBase64);

      const now = new Date().toISOString();
      await AsyncStorage.setItem(LAST_BACKUP_KEY, now);
      await this.setStatus('success');
      AnalyticsService.trackEvent(AnalyticsService.Events.BACKUP_COMPLETED, { documentCount: docs.length }).catch(() => {});
      return true;
    } catch (err) {
      console.error('Backup failed:', err);
      captureVaultError(err, 'backup');
      await this.setStatus('error');
      return false;
    }
  }

  /**
   * Get metadata about the latest iCloud backup without downloading it.
   */
  static async getBackupInfo(): Promise<BackupMetadata | null> {
    if (!ICloudModule) return null;

    try {
      const metaBase64 = await ICloudModule.readFromICloud(BACKUP_METADATA_FILE);
      if (!metaBase64) return null;

      const metaJson = Buffer.from(metaBase64, 'base64').toString('utf-8');
      return JSON.parse(metaJson) as BackupMetadata;
    } catch {
      return null;
    }
  }

  /**
   * Restore vault from iCloud backup.
   * Attempts to restore the vault key from iCloud Keychain if not available locally.
   */
  static async restore(): Promise<{ success: boolean; documentCount: number }> {
    if (!ICloudModule) return { success: false, documentCount: 0 };

    await this.setStatus('restoring');

    try {
      const encryptedBase64 = await ICloudModule.readFromICloud(BACKUP_VAULT_FILE);
      if (!encryptedBase64) {
        await this.setStatus('error');
        return { success: false, documentCount: 0 };
      }

      const encrypted = Buffer.from(encryptedBase64, 'base64');

      const hasLocalKey = await KeyManager.isInitialized();
      if (!hasLocalKey) {
        const restored = await KeyManager.restoreFromCloudKeychain();
        if (!restored) {
          await this.setStatus('error');
          return { success: false, documentCount: 0 };
        }
      }

      const vaultKey = await KeyManager.getVaultKey();
      const decrypted = CryptoService.decrypt(encrypted, vaultKey);
      const jsonPayload = decrypted.toString('utf-8');
      const vaultData = JSON.parse(jsonPayload) as {
        documents: Record<string, unknown>[];
        files: Record<string, string>;
      };

      await EncryptedStorageService.initializeVault();

      for (const [fileRef, base64Content] of Object.entries(vaultData.files)) {
        const content = Buffer.from(base64Content, 'base64');
        await EncryptedStorageService.saveFile(fileRef, content);
      }

      let restoredCount = 0;
      for (const docData of vaultData.documents) {
        try {
          const insert = {
            category: (docData.category as string) ?? 'personal',
            title: (docData.title as string) ?? 'Restored Document',
            fileRef: docData.fileRef as string,
            format: (docData.format as string) ?? 'jpeg',
            thumbnailRef: (docData.thumbnailRef as string) || null,
            documentDate: (docData.documentDate as string) || null,
            expiryDate: (docData.expiryDate as string) || null,
            providerName: (docData.providerName as string) || null,
          };
          if (!insert.fileRef) continue;
          await DocumentRepository.insertDocument(insert as any);
          restoredCount++;
        } catch {
          // document may already exist — skip duplicates
        }
      }

      await this.setStatus('success');
      AnalyticsService.trackEvent(AnalyticsService.Events.BACKUP_RESTORED, { documentCount: restoredCount }).catch(() => {});
      return { success: true, documentCount: restoredCount };
    } catch (err) {
      console.error('Restore failed:', err);
      captureVaultError(err, 'restore');
      await this.setStatus('error');
      return { success: false, documentCount: 0 };
    }
  }

  /**
   * Trigger backup if auto-backup is enabled and conditions are met.
   * Call this after vault changes (document add/delete/update).
   */
  static async autoBackupIfEnabled(): Promise<void> {
    const enabled = await this.isAutoBackupEnabled();
    if (!enabled) return;

    const available = await this.isAvailable();
    if (!available) return;

    if (backupDebounceTimer) clearTimeout(backupDebounceTimer);
    backupDebounceTimer = setTimeout(() => {
      backupDebounceTimer = null;
      this.backupNow().catch(() => {});
    }, BACKUP_DEBOUNCE_MS);
  }

  static async deleteBackup(): Promise<boolean> {
    if (!ICloudModule) return false;
    try {
      await ICloudModule.deleteFromICloud(BACKUP_VAULT_FILE);
      await ICloudModule.deleteFromICloud(BACKUP_METADATA_FILE);
      return true;
    } catch {
      return false;
    }
  }
}
