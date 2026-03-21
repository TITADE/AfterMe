import AsyncStorage from '@react-native-async-storage/async-storage';
import { CloudBackupService } from '../services/CloudBackupService';

jest.mock('../core/auth/KeyManager', () => ({
  KeyManager: {
    getVaultKey: jest.fn(() => Promise.resolve(Buffer.alloc(32, 0x42))),
    isInitialized: jest.fn(() => Promise.resolve(true)),
    restoreFromCloudKeychain: jest.fn(() => Promise.resolve(false)),
  },
}));

jest.mock('../core/crypto/CryptoService', () => ({
  CryptoService: {
    encrypt: jest.fn(() => Buffer.from('encrypted-vault')),
    decrypt: jest.fn(() => Buffer.from(JSON.stringify({ documents: [], files: {} }))),
  },
}));

jest.mock('../core/storage/EncryptedStorageService', () => ({
  EncryptedStorageService: {
    readFile: jest.fn(() => Promise.resolve(Buffer.from('file-content'))),
    saveFile: jest.fn(() => Promise.resolve()),
    initializeVault: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('../db/DocumentRepository', () => ({
  getAllDocuments: jest.fn(() => Promise.resolve([])),
  insertDocument: jest.fn(() => Promise.resolve({ id: 'restored_1' })),
}));

jest.mock('../services/OnboardingStorage', () => ({
  OnboardingStorage: {
    setIcloudBackupEnabled: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('../services/AnalyticsService', () => ({
  AnalyticsService: {
    trackEvent: jest.fn(() => Promise.resolve()),
    Events: {
      BACKUP_COMPLETED: 'backup_completed',
      BACKUP_RESTORED: 'backup_restored',
    },
  },
}));

jest.mock('../services/SentryService', () => ({
  captureVaultError: jest.fn(),
  traceVaultOperation: jest.fn((_: string, fn: () => Promise<unknown>) => fn()),
}));

describe('CloudBackupService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  describe('isAvailable', () => {
    it('returns false when iCloud module is not available', async () => {
      const available = await CloudBackupService.isAvailable();
      expect(available).toBe(false);
    });
  });

  describe('auto-backup settings', () => {
    it('defaults to disabled', async () => {
      const enabled = await CloudBackupService.isAutoBackupEnabled();
      expect(enabled).toBe(false);
    });

    it('persists enabled state', async () => {
      await CloudBackupService.setAutoBackupEnabled(true);
      const enabled = await CloudBackupService.isAutoBackupEnabled();
      expect(enabled).toBe(true);
    });

    it('persists disabled state', async () => {
      await CloudBackupService.setAutoBackupEnabled(true);
      await CloudBackupService.setAutoBackupEnabled(false);
      const enabled = await CloudBackupService.isAutoBackupEnabled();
      expect(enabled).toBe(false);
    });
  });

  describe('autoBackupIfEnabled (Fix 22 - debounce)', () => {
    it('does not backup when disabled', async () => {
      await CloudBackupService.autoBackupIfEnabled();
      const backupNowSpy = jest.spyOn(CloudBackupService, 'backupNow');
      expect(backupNowSpy).not.toHaveBeenCalled();
      backupNowSpy.mockRestore();
    });
  });

  describe('getLastBackupDate', () => {
    it('returns null when no backup has been made', async () => {
      const date = await CloudBackupService.getLastBackupDate();
      expect(date).toBeNull();
    });
  });

  describe('getBackupStatus', () => {
    it('defaults to idle', async () => {
      const status = await CloudBackupService.getBackupStatus();
      expect(status).toBe('idle');
    });
  });

  describe('backupNow', () => {
    it('returns false when iCloud module reports unavailable', async () => {
      const result = await CloudBackupService.backupNow();
      expect(result).toBe(false);
    });
  });

  describe('getBackupInfo', () => {
    it('returns null when no iCloud module is available', async () => {
      const info = await CloudBackupService.getBackupInfo();
      expect(info).toBeNull();
    });
  });

  describe('restore', () => {
    it('returns { success: false, documentCount: 0 } when no iCloud module', async () => {
      const result = await CloudBackupService.restore();
      expect(result).toEqual({ success: false, documentCount: 0 });
    });
  });

  describe('deleteBackup', () => {
    it('returns true when iCloud module is available and delete succeeds', async () => {
      const result = await CloudBackupService.deleteBackup();
      expect(result).toBe(true);
    });
  });

  describe('auto-backup round-trip', () => {
    it('setAutoBackupEnabled(true) then isAutoBackupEnabled() returns true', async () => {
      await CloudBackupService.setAutoBackupEnabled(true);
      const enabled = await CloudBackupService.isAutoBackupEnabled();
      expect(enabled).toBe(true);
    });

    it('setAutoBackupEnabled(false) then isAutoBackupEnabled() returns false', async () => {
      await CloudBackupService.setAutoBackupEnabled(true);
      await CloudBackupService.setAutoBackupEnabled(false);
      const enabled = await CloudBackupService.isAutoBackupEnabled();
      expect(enabled).toBe(false);
    });
  });

  describe('backupNow (iCloud available)', () => {
    let ICloudMock: any;
    let DocRepo: any;
    let ESS: any;
    let KM: any;
    let CS: any;

    beforeEach(() => {
      ICloudMock = require('../../modules/icloud-backup');
      DocRepo = require('../db/DocumentRepository');
      ESS = require('../core/storage/EncryptedStorageService').EncryptedStorageService;
      KM = require('../core/auth/KeyManager').KeyManager;
      CS = require('../core/crypto/CryptoService').CryptoService;
      ICloudMock.isICloudAvailable.mockResolvedValue(true);
    });

    afterEach(() => {
      ICloudMock.isICloudAvailable.mockResolvedValue(false);
    });

    it('succeeds and writes vault + metadata to iCloud', async () => {
      DocRepo.getAllDocuments.mockResolvedValueOnce([
        { id: 'doc1', fileRef: 'ref1', thumbnailRef: null, category: 'identity', title: 'Passport', format: 'jpeg', createdAt: '2025-01-01', documentDate: null, expiryDate: null, providerName: null },
      ]);

      const result = await CloudBackupService.backupNow();
      expect(result).toBe(true);
      expect(ICloudMock.writeToICloud).toHaveBeenCalledTimes(2);
      expect(ICloudMock.writeToICloud).toHaveBeenCalledWith('AfterMe/vault-backup.enc', expect.any(String));
      expect(ICloudMock.writeToICloud).toHaveBeenCalledWith('AfterMe/backup-meta.json', expect.any(String));
      expect(KM.getVaultKey).toHaveBeenCalled();
      expect(CS.encrypt).toHaveBeenCalled();
    });

    it('returns false on encryption error', async () => {
      DocRepo.getAllDocuments.mockResolvedValueOnce([]);
      CS.encrypt.mockImplementationOnce(() => { throw new Error('encryption failed'); });

      const result = await CloudBackupService.backupNow();
      expect(result).toBe(false);
    });

    it('tracks skipped files when readFile throws for a doc', async () => {
      DocRepo.getAllDocuments.mockResolvedValueOnce([
        { id: 'doc1', fileRef: 'ref1', thumbnailRef: null, category: 'identity', title: 'Doc', format: 'jpeg', createdAt: '2025-01-01', documentDate: null, expiryDate: null, providerName: null },
      ]);
      ESS.readFile.mockRejectedValueOnce(new Error('file not found'));

      const result = await CloudBackupService.backupNow();
      expect(result).toBe(true);
      expect(ICloudMock.writeToICloud).toHaveBeenCalledTimes(2);
      const metaCall = ICloudMock.writeToICloud.mock.calls[1];
      const metaJson = JSON.parse(Buffer.from(metaCall[1], 'base64').toString('utf-8'));
      expect(metaJson.skippedFiles).toBe(1);
    });

    it('includes thumbnails in backup when document has thumbnailRef', async () => {
      DocRepo.getAllDocuments.mockResolvedValueOnce([
        { id: 'doc1', fileRef: 'ref1', thumbnailRef: 'thumb1', category: 'identity', title: 'Passport', format: 'jpeg', createdAt: '2025-01-01', documentDate: null, expiryDate: null, providerName: null },
      ]);
      ESS.readFile
        .mockResolvedValueOnce(Buffer.from('file-content'))
        .mockResolvedValueOnce(Buffer.from('thumb-content'));

      const result = await CloudBackupService.backupNow();
      expect(result).toBe(true);
      expect(ESS.readFile).toHaveBeenCalledWith('ref1');
      expect(ESS.readFile).toHaveBeenCalledWith('thumb1');
      const vaultCall = ICloudMock.writeToICloud.mock.calls[0];
      const vaultJson = JSON.parse(Buffer.from(CS.encrypt.mock.calls[0][0]).toString('utf-8'));
      expect(vaultJson.files['ref1']).toBeDefined();
      expect(vaultJson.files['thumb1']).toBeDefined();
    });

    it('returns false when vault exceeds size limit', async () => {
      DocRepo.getAllDocuments.mockResolvedValueOnce([
        { id: 'doc1', fileRef: 'ref1', thumbnailRef: null, category: 'identity', title: 'Big', format: 'jpeg', createdAt: '2025-01-01', documentDate: null, expiryDate: null, providerName: null },
      ]);
      ESS.readFile.mockResolvedValueOnce({ length: 201 * 1024 * 1024, toString: () => 'x' });

      const result = await CloudBackupService.backupNow();
      expect(result).toBe(false);
    });
  });

  describe('getBackupInfo (iCloud available)', () => {
    let ICloudMock: any;

    beforeEach(() => {
      ICloudMock = require('../../modules/icloud-backup');
      ICloudMock.isICloudAvailable.mockResolvedValue(true);
    });

    afterEach(() => {
      ICloudMock.isICloudAvailable.mockResolvedValue(false);
    });

    it('returns null when metadata JSON is corrupted', async () => {
      ICloudMock.readFromICloud.mockResolvedValueOnce(
        Buffer.from('this is not valid json!!!', 'utf-8').toString('base64'),
      );
      const info = await CloudBackupService.getBackupInfo();
      expect(info).toBeNull();
    });

    it('returns metadata when iCloud has backup data', async () => {
      const meta = {
        version: 1,
        createdAt: '2025-06-01T00:00:00.000Z',
        documentCount: 3,
        appVersion: '1.0.0',
        platform: 'ios',
      };
      ICloudMock.readFromICloud.mockResolvedValueOnce(
        Buffer.from(JSON.stringify(meta), 'utf-8').toString('base64'),
      );

      const info = await CloudBackupService.getBackupInfo();
      expect(info).toEqual(meta);
    });
  });

  describe('restore (iCloud available)', () => {
    let ICloudMock: any;
    let KM: any;
    let CS: any;
    let ESS: any;
    let DocRepo: any;

    beforeEach(() => {
      ICloudMock = require('../../modules/icloud-backup');
      KM = require('../core/auth/KeyManager').KeyManager;
      CS = require('../core/crypto/CryptoService').CryptoService;
      ESS = require('../core/storage/EncryptedStorageService').EncryptedStorageService;
      DocRepo = require('../db/DocumentRepository');
      ICloudMock.isICloudAvailable.mockResolvedValue(true);
    });

    afterEach(() => {
      ICloudMock.isICloudAvailable.mockResolvedValue(false);
    });

    it('succeeds with valid backup data', async () => {
      const vaultData = {
        documents: [
          { id: 'doc1', fileRef: 'ref1', thumbnailRef: null, category: 'identity', title: 'Passport', format: 'jpeg' },
        ],
        files: { ref1: Buffer.from('file-data').toString('base64') },
      };
      ICloudMock.readFromICloud.mockResolvedValueOnce(
        Buffer.from('encrypted-data').toString('base64'),
      );
      CS.decrypt.mockReturnValueOnce(Buffer.from(JSON.stringify(vaultData), 'utf-8'));

      const result = await CloudBackupService.restore();
      expect(result.success).toBe(true);
      expect(result.documentCount).toBe(1);
      expect(ESS.initializeVault).toHaveBeenCalled();
      expect(ESS.saveFile).toHaveBeenCalledWith('ref1', expect.any(Buffer));
      expect(DocRepo.insertDocument).toHaveBeenCalled();
    });

    it('returns failure when no backup data in iCloud', async () => {
      ICloudMock.readFromICloud.mockResolvedValueOnce(null);

      const result = await CloudBackupService.restore();
      expect(result).toEqual({ success: false, documentCount: 0 });
    });

    it('attempts keychain recovery when local key missing', async () => {
      ICloudMock.readFromICloud.mockResolvedValueOnce(
        Buffer.from('encrypted').toString('base64'),
      );
      KM.isInitialized.mockResolvedValueOnce(false);
      KM.restoreFromCloudKeychain.mockResolvedValueOnce(false);

      const result = await CloudBackupService.restore();
      expect(result).toEqual({ success: false, documentCount: 0 });
      expect(KM.restoreFromCloudKeychain).toHaveBeenCalled();
    });
  });

  describe('autoBackupIfEnabled (debounce behavior)', () => {
    let ICloudMock: any;

    beforeEach(async () => {
      jest.useFakeTimers();
      ICloudMock = require('../../modules/icloud-backup');
      ICloudMock.isICloudAvailable.mockResolvedValue(true);
    });

    afterEach(() => {
      jest.useRealTimers();
      ICloudMock.isICloudAvailable.mockResolvedValue(false);
    });

    it('calls backupNow after debounce when enabled and available', async () => {
      await CloudBackupService.setAutoBackupEnabled(true);
      const spy = jest.spyOn(CloudBackupService, 'backupNow').mockResolvedValue(true);

      await CloudBackupService.autoBackupIfEnabled();
      jest.advanceTimersByTime(30_000);

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('does not call backupNow when disabled', async () => {
      await CloudBackupService.setAutoBackupEnabled(false);
      const spy = jest.spyOn(CloudBackupService, 'backupNow').mockResolvedValue(true);

      await CloudBackupService.autoBackupIfEnabled();
      jest.advanceTimersByTime(30_000);

      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('deleteBackup (failure path)', () => {
    it('returns false when deleteFromICloud throws', async () => {
      const ICloudMock = require('../../modules/icloud-backup');
      ICloudMock.deleteFromICloud.mockRejectedValueOnce(new Error('iCloud error'));

      const result = await CloudBackupService.deleteBackup();
      expect(result).toBe(false);
    });
  });

  describe('deleteBackup (success path)', () => {
    it('deletes both vault and metadata files', async () => {
      const ICloudMock = require('../../modules/icloud-backup');

      const result = await CloudBackupService.deleteBackup();
      expect(result).toBe(true);
      expect(ICloudMock.deleteFromICloud).toHaveBeenCalledTimes(2);
      expect(ICloudMock.deleteFromICloud).toHaveBeenCalledWith('AfterMe/vault-backup.enc');
      expect(ICloudMock.deleteFromICloud).toHaveBeenCalledWith('AfterMe/backup-meta.json');
    });
  });
});
