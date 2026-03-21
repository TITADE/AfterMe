jest.mock('jszip', () => {
  const mockInstance = {
    file: jest.fn(),
    generateAsync: jest.fn(() => Promise.resolve('bW9ja3ppcGJhc2U2NA==')),
  };
  const JSZip = jest.fn(() => mockInstance);
  (JSZip as unknown as Record<string, unknown>).__mockInstance = mockInstance;
  (JSZip as unknown as Record<string, unknown>).loadAsync = jest.fn();
  return { __esModule: true, default: JSZip };
});

jest.mock('../core/crypto/CryptoService', () => ({
  CryptoService: {
    generateKey: jest.fn(() => Buffer.alloc(32, 0xAA)),
    encrypt: jest.fn(() => Buffer.from('encrypted-data')),
    decrypt: jest.fn(() => Buffer.alloc(32, 0xCC)),
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

jest.mock('../services/KitHistoryService', () => ({
  KitHistoryService: {
    getNextKitVersion: jest.fn(() => Promise.resolve(1)),
    recordKitGeneration: jest.fn(() => Promise.resolve()),
  },
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
import { KitHistoryService } from '../services/KitHistoryService';
import { FamilyKitExportService } from '../services/FamilyKitExportService';
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

describe('FamilyKitExportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { EncryptedStorageService } = jest.requireMock('../core/storage/EncryptedStorageService');
    EncryptedStorageService.readFile.mockResolvedValue(Buffer.from('file-bytes'));
  });

  it('throws for empty vault', async () => {
    (DocumentRepository.getAllDocuments as jest.Mock).mockResolvedValue([]);

    await expect(FamilyKitExportService.generateKit())
      .rejects.toThrow('Cannot create a Family Kit with an empty vault');
  });

  it('throws when doc count exceeds 100 (Fix 15)', async () => {
    const docs = Array.from({ length: 101 }, (_, i) =>
      makeMockDocument({ id: `doc_${i}` }),
    );
    (DocumentRepository.getAllDocuments as jest.Mock).mockResolvedValue(docs);

    await expect(FamilyKitExportService.generateKit())
      .rejects.toThrow('exceeds the export limit of 100');
  });

  it('throws when total size exceeds 200MB (Fix 15)', async () => {
    const docs = [makeMockDocument()];
    (DocumentRepository.getAllDocuments as jest.Mock).mockResolvedValue(docs);

    const { EncryptedStorageService } = jest.requireMock('../core/storage/EncryptedStorageService');
    const largeBuffer = Buffer.alloc(201 * 1024 * 1024, 0xFF);
    EncryptedStorageService.readFile.mockResolvedValue(largeBuffer);

    await expect(FamilyKitExportService.generateKit())
      .rejects.toThrow('exceeds');
  });

  it('returns filePath, accessKey, documentCount, kitVersion on success', async () => {
    const docs = [makeMockDocument()];
    (DocumentRepository.getAllDocuments as jest.Mock).mockResolvedValue(docs);

    const result = await FamilyKitExportService.generateKit('Alice', 'Bob');

    expect(result).toEqual(
      expect.objectContaining({
        filePath: expect.stringContaining('.afterme'),
        accessKey: expect.any(String),
        documentCount: 1,
        kitVersion: 1,
      }),
    );
    expect(result.accessKey.length).toBe(48);
  });

  it('records kit history on success', async () => {
    const docs = [makeMockDocument()];
    (DocumentRepository.getAllDocuments as jest.Mock).mockResolvedValue(docs);

    await FamilyKitExportService.generateKit();

    expect(KitHistoryService.getNextKitVersion).toHaveBeenCalled();
    expect(KitHistoryService.recordKitGeneration).toHaveBeenCalledWith(
      1,
      1,
      ['identity'],
    );
  });

  describe('validateKit', () => {
    function makeMockZipEntry(data: Buffer) {
      const ab = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
      return { async: jest.fn(() => Promise.resolve(ab)) };
    }

    function makeMockLoadedZip(files: Record<string, unknown>) {
      return { file: jest.fn((name: string) => files[name] ?? null) };
    }

    it('returns true for a valid kit', async () => {
      const keyData = Buffer.alloc(64, 0x11);
      const vaultData = Buffer.from('encrypted-vault');

      const mockZip = makeMockLoadedZip({
        'README.txt': makeMockZipEntry(Buffer.from('readme')),
        'manifest.json': makeMockZipEntry(Buffer.from('{}')),
        'key.enc': makeMockZipEntry(keyData),
        'vault.enc': makeMockZipEntry(vaultData),
      });

      const JSZipMock = jest.requireMock('jszip').default;
      JSZipMock.loadAsync.mockResolvedValue(mockZip);

      const { CryptoService } = jest.requireMock('../core/crypto/CryptoService');
      CryptoService.decrypt
        .mockReturnValueOnce(Buffer.alloc(32, 0xCC))
        .mockReturnValueOnce(
          Buffer.from(JSON.stringify({ documents: [{ id: '1' }] })),
        );

      const result = await FamilyKitExportService.validateKit(
        '/mock/kit.afterme',
        'test-key',
      );
      expect(result).toBe(true);
    });

    it('returns false when zip is missing key.enc', async () => {
      const mockZip = makeMockLoadedZip({
        'README.txt': makeMockZipEntry(Buffer.from('readme')),
        'manifest.json': makeMockZipEntry(Buffer.from('{}')),
        'vault.enc': makeMockZipEntry(Buffer.from('vault')),
      });

      const JSZipMock = jest.requireMock('jszip').default;
      JSZipMock.loadAsync.mockResolvedValue(mockZip);

      const result = await FamilyKitExportService.validateKit(
        '/mock/kit.afterme',
        'test-key',
      );
      expect(result).toBe(false);
    });

    it('returns false when decryption fails', async () => {
      const keyData = Buffer.alloc(64, 0x11);
      const vaultData = Buffer.from('encrypted-vault');

      const mockZip = makeMockLoadedZip({
        'README.txt': makeMockZipEntry(Buffer.from('readme')),
        'manifest.json': makeMockZipEntry(Buffer.from('{}')),
        'key.enc': makeMockZipEntry(keyData),
        'vault.enc': makeMockZipEntry(vaultData),
      });

      const JSZipMock = jest.requireMock('jszip').default;
      JSZipMock.loadAsync.mockResolvedValue(mockZip);

      const { CryptoService } = jest.requireMock('../core/crypto/CryptoService');
      CryptoService.decrypt.mockImplementationOnce(() => {
        throw new Error('Decryption failed');
      });

      const result = await FamilyKitExportService.validateKit(
        '/mock/kit.afterme',
        'test-key',
      );
      expect(result).toBe(false);
    });
  });
});
