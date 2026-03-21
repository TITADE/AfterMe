import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('jszip', () => {
  const mockInstance = {
    file: jest.fn(),
    generateAsync: jest.fn(() => Promise.resolve('bW9ja3ppcGJhc2U2NA==')),
  };
  const JSZip = jest.fn(() => mockInstance);
  (JSZip as unknown as Record<string, unknown>).__mockInstance = mockInstance;
  return { __esModule: true, default: JSZip };
});

jest.mock('../core/crypto/CryptoService', () => ({
  CryptoService: {
    generateKey: jest.fn(() => Buffer.alloc(32, 0xAA)),
    encrypt: jest.fn(() => Buffer.from('encrypted-data')),
    deriveKey: jest.fn(() => Buffer.alloc(32, 0xBB)),
    generateSecureId: jest.fn(() => 'vault_mock123'),
  },
}));

jest.mock('../core/storage/EncryptedStorageService', () => ({
  EncryptedStorageService: {
    readFile: jest.fn(() => Promise.resolve(Buffer.from('file-bytes'))),
  },
}));

jest.mock('../db/DocumentRepository', () => ({
  getAllDocuments: jest.fn(() => Promise.resolve([])),
}));

jest.mock('../services/SentryService', () => ({
  captureVaultError: jest.fn(),
  traceVaultOperation: jest.fn((_: string, fn: () => Promise<unknown>) => fn()),
}));

jest.mock('../core/auth/KeyManager', () => ({
  KeyManager: {
    getVaultKey: jest.fn(() => Promise.resolve(Buffer.alloc(32, 0x42))),
  },
}));

import * as DocumentRepository from '../db/DocumentRepository';
import { PersonalRecoveryKitService } from '../services/PersonalRecoveryKitService';
import type { Document } from '../models/Document';

function makeMockDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: 'doc_1',
    category: 'identity',
    title: 'Passport',
    fileRef: 'fk_abc123',
    format: 'pdf',
    documentDate: '2024-01-01',
    expiryDate: '2034-01-01',
    providerName: 'Gov',
    locationOfOriginal: null,
    thumbnailRef: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('PersonalRecoveryKitService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    const { EncryptedStorageService } = jest.requireMock('../core/storage/EncryptedStorageService');
    EncryptedStorageService.readFile.mockResolvedValue(Buffer.from('file-bytes'));
  });

  describe('generateKit', () => {
    it('throws for empty vault', async () => {
      (DocumentRepository.getAllDocuments as jest.Mock).mockResolvedValue([]);

      await expect(PersonalRecoveryKitService.generateKit())
        .rejects.toThrow('Cannot create a Recovery Kit with an empty vault');
    });

    it('throws when doc count exceeds 100', async () => {
      const docs = Array.from({ length: 101 }, (_, i) =>
        makeMockDocument({ id: `doc_${i}` }),
      );
      (DocumentRepository.getAllDocuments as jest.Mock).mockResolvedValue(docs);

      await expect(PersonalRecoveryKitService.generateKit())
        .rejects.toThrow('exceeds the export limit of 100');
    });

    it('throws when total size exceeds 200MB', async () => {
      const docs = [makeMockDocument()];
      (DocumentRepository.getAllDocuments as jest.Mock).mockResolvedValue(docs);

      const { EncryptedStorageService } = jest.requireMock('../core/storage/EncryptedStorageService');
      const largeBuffer = Buffer.alloc(201 * 1024 * 1024, 0xFF);
      EncryptedStorageService.readFile.mockResolvedValue(largeBuffer);

      await expect(PersonalRecoveryKitService.generateKit())
        .rejects.toThrow('exceeds');
    });

    it('returns filePath, accessKey, documentCount on success', async () => {
      const docs = [makeMockDocument()];
      (DocumentRepository.getAllDocuments as jest.Mock).mockResolvedValue(docs);

      const result = await PersonalRecoveryKitService.generateKit();

      expect(result).toEqual(
        expect.objectContaining({
          filePath: expect.stringContaining('.afterme'),
          accessKey: expect.any(String),
          documentCount: 1,
        }),
      );
      expect(result.accessKey.length).toBe(48);
    });

    it('stores last kit info in AsyncStorage', async () => {
      const docs = [makeMockDocument()];
      (DocumentRepository.getAllDocuments as jest.Mock).mockResolvedValue(docs);

      await PersonalRecoveryKitService.generateKit();

      const info = await PersonalRecoveryKitService.getLastKitInfo();
      expect(info).not.toBeNull();
      expect(info!.documentCount).toBe(1);
      expect(info!.createdAt).toBeDefined();
    });
  });

  describe('getLastKitInfo', () => {
    it('returns null by default', async () => {
      const info = await PersonalRecoveryKitService.getLastKitInfo();
      expect(info).toBeNull();
    });
  });

  describe('hasCreatedKit', () => {
    it('returns false by default', async () => {
      const result = await PersonalRecoveryKitService.hasCreatedKit();
      expect(result).toBe(false);
    });

    it('returns true after generation', async () => {
      const docs = [makeMockDocument()];
      (DocumentRepository.getAllDocuments as jest.Mock).mockResolvedValue(docs);

      await PersonalRecoveryKitService.generateKit();

      const result = await PersonalRecoveryKitService.hasCreatedKit();
      expect(result).toBe(true);
    });
  });
});
