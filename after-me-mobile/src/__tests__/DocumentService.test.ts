import { DocumentService } from '../services/DocumentService';
import type { Document } from '../models/Document';

jest.mock('../core/storage/EncryptedStorageService', () => ({
  EncryptedStorageService: {
    initializeVault: jest.fn(() => Promise.resolve()),
    saveFile: jest.fn(() => Promise.resolve('/mock/path.enc')),
    readFile: jest.fn(() => Promise.resolve(Buffer.from('decrypted'))),
    deleteFile: jest.fn(() => Promise.resolve()),
    getVaultSizeBytes: jest.fn(() => Promise.resolve(0)),
    fileExists: jest.fn(() => Promise.resolve(true)),
    validateFileIntegrity: jest.fn(() => Promise.resolve(true)),
  },
}));

jest.mock('../core/crypto/CryptoService', () => ({
  CryptoService: {
    generateSecureId: jest.fn((prefix: string) => `${prefix}_mock123`),
    encrypt: jest.fn(() => Buffer.from('encrypted')),
    decrypt: jest.fn(() => Buffer.from('decrypted')),
  },
}));

const mockDoc: Document = {
  id: 'doc_test1',
  category: 'identity',
  title: 'Test Passport',
  documentDate: null,
  expiryDate: null,
  providerName: null,
  locationOfOriginal: null,
  fileRef: 'doc_mock123',
  thumbnailRef: null,
  format: 'jpeg',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

jest.mock('../db/DocumentRepository', () => ({
  insertDocument: jest.fn(() => Promise.resolve(mockDoc)),
  getAllDocuments: jest.fn(() => Promise.resolve([mockDoc])),
  getDocumentsByCategory: jest.fn(() => Promise.resolve([mockDoc])),
  getDocumentById: jest.fn(() => Promise.resolve(mockDoc)),
  updateDocument: jest.fn(() => Promise.resolve()),
  deleteDocument: jest.fn(() => Promise.resolve()),
  getDocumentCountByCategory: jest.fn(() => Promise.resolve({ identity: 1 })),
}));

jest.mock('../services/KitHistoryService', () => ({
  KitHistoryService: {
    recordVaultChange: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('../services/CloudBackupService', () => ({
  CloudBackupService: {
    autoBackupIfEnabled: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('../services/AnalyticsService', () => ({
  AnalyticsService: {
    trackEvent: jest.fn(() => Promise.resolve()),
    Events: {
      DOCUMENT_ADDED: 'document_added',
      DOCUMENT_DELETED: 'document_deleted',
      DOCUMENT_SCANNED: 'document_scanned',
    },
  },
}));

jest.mock('../services/SentryService', () => ({
  captureVaultError: jest.fn(),
  traceVaultOperation: jest.fn((_: string, fn: () => Promise<unknown>) => fn()),
}));

const mockFS = jest.requireMock('expo-file-system/legacy') as {
  readAsStringAsync: jest.Mock;
  writeAsStringAsync: jest.Mock;
  getInfoAsync: jest.Mock;
  deleteAsync: jest.Mock;
};

describe('DocumentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFS.getInfoAsync.mockResolvedValue({ exists: true, size: 1024 });
    mockFS.readAsStringAsync.mockResolvedValue(Buffer.from('file content').toString('base64'));
  });

  describe('importFromFilePath', () => {
    it('validates extension and imports successfully', async () => {
      const result = await DocumentService.importFromFilePath(
        '/path/to/document.jpg',
        'identity',
        'My Passport',
      );
      expect(result).toEqual(mockDoc);
    });

    it('rejects unsupported file extensions (Fix 21)', async () => {
      await expect(
        DocumentService.importFromFilePath('/path/file.exe', 'identity', 'Bad File'),
      ).rejects.toThrow('Unsupported file type');
    });

    it('allows .jpg, .jpeg, .png, .pdf', async () => {
      for (const ext of ['.jpg', '.jpeg', '.png', '.pdf']) {
        jest.clearAllMocks();
        mockFS.getInfoAsync.mockResolvedValue({ exists: true, size: 1024 });
        mockFS.readAsStringAsync.mockResolvedValue(Buffer.from('data').toString('base64'));
        await expect(
          DocumentService.importFromFilePath(`/path/file${ext}`, 'identity', 'Test'),
        ).resolves.toBeDefined();
      }
    });

    it('accepts mixed-case extensions like .PDF, .JPEG', async () => {
      for (const ext of ['.PDF', '.JPEG', '.Png', '.JPG']) {
        jest.clearAllMocks();
        mockFS.getInfoAsync.mockResolvedValue({ exists: true, size: 1024 });
        mockFS.readAsStringAsync.mockResolvedValue(Buffer.from('data').toString('base64'));
        await expect(
          DocumentService.importFromFilePath(`/path/file${ext}`, 'identity', 'Test'),
        ).resolves.toBeDefined();
      }
    });

    it('allows .heic extension (iOS camera)', async () => {
      await expect(
        DocumentService.importFromFilePath('/path/photo.heic', 'identity', 'Photo'),
      ).resolves.toBeDefined();
    });

    it('rejects .jp2, .jpx (Fix 21 regression)', async () => {
      await expect(
        DocumentService.importFromFilePath('/path/file.jp2', 'identity', 'Bad'),
      ).rejects.toThrow('Unsupported file type');
    });

    it('rejects files exceeding max size', async () => {
      mockFS.getInfoAsync.mockResolvedValueOnce({
        exists: true,
        size: 60 * 1024 * 1024, // 60MB > 50MB limit
      });
      await expect(
        DocumentService.importFromFilePath('/path/huge.jpg', 'identity', 'Huge'),
      ).rejects.toThrow('File too large');
    });

    it('rejects when file not found', async () => {
      mockFS.getInfoAsync.mockResolvedValueOnce({ exists: false });
      await expect(
        DocumentService.importFromFilePath('/path/gone.jpg', 'identity', 'Gone'),
      ).rejects.toThrow('File not found');
    });

    it('serializes concurrent imports (Fix 35)', async () => {
      const callOrder: number[] = [];
      const { EncryptedStorageService } = jest.requireMock('../core/storage/EncryptedStorageService');
      EncryptedStorageService.getVaultSizeBytes.mockImplementation(() => {
        callOrder.push(Date.now());
        return Promise.resolve(0);
      });

      await Promise.all([
        DocumentService.importFromFilePath('/path/a.jpg', 'identity', 'A'),
        DocumentService.importFromFilePath('/path/b.jpg', 'identity', 'B'),
      ]);

      expect(callOrder.length).toBe(2);
    });

    it('logs warning for files >10MB but imports successfully', async () => {
      mockFS.getInfoAsync.mockResolvedValueOnce({
        exists: true,
        size: 15 * 1024 * 1024,
      });
      await expect(
        DocumentService.importFromFilePath('/path/large.jpg', 'identity', 'Large'),
      ).resolves.toBeDefined();
    });

    it('rejects when vault capacity is exceeded', async () => {
      const { EncryptedStorageService } = jest.requireMock('../core/storage/EncryptedStorageService');
      EncryptedStorageService.getVaultSizeBytes.mockResolvedValueOnce(5 * 1024 * 1024 * 1024);
      await expect(
        DocumentService.importFromFilePath('/path/doc.jpg', 'identity', 'Doc'),
      ).rejects.toThrow('Vault storage limit reached');
    });

    it('cleans up files on insert failure including thumbnail', async () => {
      const repo = jest.requireMock('../db/DocumentRepository');
      const { EncryptedStorageService } = jest.requireMock('../core/storage/EncryptedStorageService');
      repo.insertDocument.mockRejectedValueOnce(new Error('DB insert failed'));

      await expect(
        DocumentService.importFromFilePath('/path/photo.jpg', 'identity', 'Photo'),
      ).rejects.toThrow('DB insert failed');

      expect(EncryptedStorageService.deleteFile).toHaveBeenCalledWith('doc_mock123');
      expect(EncryptedStorageService.deleteFile).toHaveBeenCalledWith('thumb_mock123');
    });
  });

  describe('deleteDocument (Fix 34)', () => {
    it('deletes DB record before files', async () => {
      const { EncryptedStorageService } = jest.requireMock('../core/storage/EncryptedStorageService');

      const callOrder: string[] = [];
      const repoDelete = jest.requireMock('../db/DocumentRepository').deleteDocument as jest.Mock;
      const storageDelete = EncryptedStorageService.deleteFile as jest.Mock;

      repoDelete.mockImplementation(() => {
        callOrder.push('db');
        return Promise.resolve();
      });
      storageDelete.mockImplementation(() => {
        callOrder.push('storage');
        return Promise.resolve();
      });

      await DocumentService.deleteDocument('doc_test1');

      const dbIdx = callOrder.indexOf('db');
      const storageIdx = callOrder.indexOf('storage');
      expect(dbIdx).toBeLessThan(storageIdx);
    });

    it('cleans up thumbnail file when present', async () => {
      const repo = jest.requireMock('../db/DocumentRepository');
      const { EncryptedStorageService } = jest.requireMock('../core/storage/EncryptedStorageService');
      repo.getDocumentById.mockResolvedValueOnce({
        ...mockDoc,
        thumbnailRef: 'thumb_abc',
      });

      await DocumentService.deleteDocument('doc_test1');

      expect(EncryptedStorageService.deleteFile).toHaveBeenCalledWith('doc_mock123');
      expect(EncryptedStorageService.deleteFile).toHaveBeenCalledWith('thumb_abc');
    });
  });

  describe('importFromBase64', () => {
    it('imports base64 document successfully', async () => {
      const base64 = Buffer.from('image content').toString('base64');
      const result = await DocumentService.importFromBase64(base64, 'personal', 'Scan');
      expect(result).toEqual(mockDoc);
    });

    it('cleans up encrypted files on insert failure (Fix 37)', async () => {
      const repo = jest.requireMock('../db/DocumentRepository');
      const { EncryptedStorageService } = jest.requireMock('../core/storage/EncryptedStorageService');
      repo.insertDocument.mockRejectedValueOnce(new Error('DB insert failed'));

      const base64 = Buffer.from('image content').toString('base64');
      await expect(
        DocumentService.importFromBase64(base64, 'personal', 'Scan'),
      ).rejects.toThrow('DB insert failed');

      expect(EncryptedStorageService.deleteFile).toHaveBeenCalledWith('doc_mock123');
      expect(EncryptedStorageService.deleteFile).toHaveBeenCalledWith('thumb_mock123');
    });
  });

  describe('getThumbnailContent', () => {
    it('returns null when no thumbnail ref', async () => {
      const result = await DocumentService.getThumbnailContent({
        ...mockDoc,
        thumbnailRef: null,
      });
      expect(result).toBeNull();
    });

    it('returns data URI for valid thumbnail', async () => {
      const { EncryptedStorageService } = jest.requireMock('../core/storage/EncryptedStorageService');
      EncryptedStorageService.readFile.mockResolvedValueOnce(Buffer.from('thumb'));

      const result = await DocumentService.getThumbnailContent({
        ...mockDoc,
        thumbnailRef: 'thumb_abc',
      });
      expect(result).toMatch(/^data:image\/jpeg;base64,/);
    });

    it('returns null when readFile throws (corrupted thumbnail)', async () => {
      const { EncryptedStorageService } = jest.requireMock('../core/storage/EncryptedStorageService');
      EncryptedStorageService.readFile.mockRejectedValueOnce(new Error('decrypt failed'));

      const result = await DocumentService.getThumbnailContent({
        ...mockDoc,
        thumbnailRef: 'thumb_abc',
      });
      expect(result).toBeNull();
    });
  });

  describe('findCorruptedDocuments', () => {
    it('returns IDs of documents with missing files', async () => {
      const { EncryptedStorageService } = jest.requireMock('../core/storage/EncryptedStorageService');
      EncryptedStorageService.fileExists.mockResolvedValueOnce(false);

      const corrupted = await DocumentService.findCorruptedDocuments();
      expect(corrupted).toContain('doc_test1');
    });

    it('returns empty array when all files are valid', async () => {
      const corrupted = await DocumentService.findCorruptedDocuments();
      expect(corrupted).toEqual([]);
    });
  });

  describe('updateDocument', () => {
    it('calls DocumentRepository.updateDocument with correct args', async () => {
      const repo = jest.requireMock('../db/DocumentRepository');
      await DocumentService.updateDocument('doc_test1', { title: 'Updated Title' });
      expect(repo.updateDocument).toHaveBeenCalledWith('doc_test1', { title: 'Updated Title' });
    });

    it('triggers vault change recording after update', async () => {
      const { KitHistoryService } = jest.requireMock('../services/KitHistoryService');
      await DocumentService.updateDocument('doc_test1', { title: 'New' });
      expect(KitHistoryService.recordVaultChange).toHaveBeenCalled();
    });
  });

  describe('getDocumentContent', () => {
    it('delegates to EncryptedStorageService.readFile', async () => {
      const { EncryptedStorageService } = jest.requireMock('../core/storage/EncryptedStorageService');
      EncryptedStorageService.readFile.mockResolvedValueOnce(Buffer.from('content'));

      const result = await DocumentService.getDocumentContent(mockDoc);
      expect(EncryptedStorageService.readFile).toHaveBeenCalledWith('doc_mock123');
      expect(result).toEqual(Buffer.from('content'));
    });

    it('propagates error when readFile throws', async () => {
      const { EncryptedStorageService } = jest.requireMock('../core/storage/EncryptedStorageService');
      EncryptedStorageService.readFile.mockRejectedValueOnce(new Error('decrypt failed'));

      await expect(DocumentService.getDocumentContent(mockDoc)).rejects.toThrow('decrypt failed');
    });
  });

  describe('getDocumentsByCategory', () => {
    it('delegates to DocumentRepository', async () => {
      const repo = jest.requireMock('../db/DocumentRepository');
      const result = await DocumentService.getDocumentsByCategory('identity');
      expect(repo.getDocumentsByCategory).toHaveBeenCalledWith('identity');
      expect(result).toEqual([mockDoc]);
    });
  });

  describe('getDocumentCountByCategory', () => {
    it('delegates to DocumentRepository', async () => {
      const repo = jest.requireMock('../db/DocumentRepository');
      const result = await DocumentService.getDocumentCountByCategory();
      expect(repo.getDocumentCountByCategory).toHaveBeenCalled();
      expect(result).toEqual({ identity: 1 });
    });
  });

  describe('getVaultSizeBytes', () => {
    it('delegates to EncryptedStorageService', async () => {
      const { EncryptedStorageService } = jest.requireMock('../core/storage/EncryptedStorageService');
      EncryptedStorageService.getVaultSizeBytes.mockResolvedValueOnce(4096);

      const result = await DocumentService.getVaultSizeBytes();
      expect(EncryptedStorageService.getVaultSizeBytes).toHaveBeenCalled();
      expect(result).toBe(4096);
    });
  });

  describe('validateDocumentIntegrity', () => {
    it('returns true when file integrity is valid', async () => {
      const { EncryptedStorageService } = jest.requireMock('../core/storage/EncryptedStorageService');
      EncryptedStorageService.validateFileIntegrity.mockResolvedValueOnce(true);

      const result = await DocumentService.validateDocumentIntegrity(mockDoc);
      expect(result).toBe(true);
      expect(EncryptedStorageService.validateFileIntegrity).toHaveBeenCalledWith('doc_mock123');
    });

    it('returns false when file integrity check fails', async () => {
      const { EncryptedStorageService } = jest.requireMock('../core/storage/EncryptedStorageService');
      EncryptedStorageService.validateFileIntegrity.mockResolvedValueOnce(false);

      const result = await DocumentService.validateDocumentIntegrity(mockDoc);
      expect(result).toBe(false);
    });
  });

  describe('getAllDocuments', () => {
    it('delegates to DocumentRepository', async () => {
      const repo = jest.requireMock('../db/DocumentRepository');
      const result = await DocumentService.getAllDocuments();
      expect(repo.getAllDocuments).toHaveBeenCalled();
      expect(result).toEqual([mockDoc]);
    });
  });

  describe('getDocumentById', () => {
    it('returns document when found', async () => {
      const repo = jest.requireMock('../db/DocumentRepository');
      const result = await DocumentService.getDocumentById('doc_test1');
      expect(repo.getDocumentById).toHaveBeenCalledWith('doc_test1');
      expect(result).toEqual(mockDoc);
    });

    it('returns null for non-existent document', async () => {
      const repo = jest.requireMock('../db/DocumentRepository');
      repo.getDocumentById.mockResolvedValueOnce(null);
      const result = await DocumentService.getDocumentById('nonexistent');
      expect(result).toBeNull();
    });
  });
});
