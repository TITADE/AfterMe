const mockLoadAsync = jest.fn();

jest.mock('jszip', () => {
  const mockGenerateAsync = jest.fn(() => Promise.resolve('mockbase64zip'));
  return {
    __esModule: true,
    default: {
      loadAsync: (...args: unknown[]) => mockLoadAsync(...args),
    },
    prototype: { file: jest.fn(), generateAsync: mockGenerateAsync },
  };
});

jest.mock('../core/crypto/CryptoService', () => ({
  CryptoService: {
    deriveKey: jest.fn(() => Buffer.alloc(32, 0xAA)),
    decrypt: jest.fn(() => Buffer.from('{}')),
    generateSecureId: jest.fn(() => 'fk_mock123'),
  },
}));

jest.mock('../core/storage/EncryptedStorageService', () => ({
  EncryptedStorageService: {
    initializeVault: jest.fn(() => Promise.resolve()),
    saveFile: jest.fn(() => Promise.resolve('/mock/vault/fk_mock123.enc')),
    getVaultSizeBytes: jest.fn(() => Promise.resolve(0)),
    deleteFile: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('../db/DocumentRepository', () => ({
  insertDocument: jest.fn(() =>
    Promise.resolve({ id: 'doc_imported_1' }),
  ),
  deleteDocument: jest.fn(() => Promise.resolve()),
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

import { CryptoService } from '../core/crypto/CryptoService';
import { EncryptedStorageService } from '../core/storage/EncryptedStorageService';
import * as DocumentRepository from '../db/DocumentRepository';
import { importFamilyKit } from '../services/FamilyKitService';

function makeVaultPayload(docs: Record<string, unknown>[]): string {
  return JSON.stringify({ documents: docs });
}

function makeMockDoc(overrides: Partial<{
  id: string;
  category: string;
  title: string;
  file_data: string;
  mime_type: string;
  document_date: string | null;
  expiry_date: string | null;
  provider_name: string | null;
}> = {}): Record<string, unknown> {
  return {
    id: 'orig_1',
    category: 'Identity',
    title: 'Test Passport',
    file_data: Buffer.from('fake-pdf-data').toString('base64'),
    mime_type: 'application/pdf',
    document_date: '2024-01-01',
    expiry_date: '2034-01-01',
    provider_name: 'Gov Agency',
    ...overrides,
  };
}

function setupZipMock(payload: string) {
  const mockArrayBuffer = (content: string) => {
    const buf = Buffer.from(content);
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  };

  const saltPlusWrappedKey = Buffer.alloc(64, 0xBB);

  mockLoadAsync.mockResolvedValue({
    file: (name: string) => {
      if (name === 'key.enc') {
        return { async: () => Promise.resolve(mockArrayBuffer(saltPlusWrappedKey.toString('binary'))) };
      }
      if (name === 'vault.enc') {
        return { async: () => Promise.resolve(mockArrayBuffer('encrypted-vault')) };
      }
      return null;
    },
  });

  (CryptoService.decrypt as jest.Mock)
    .mockReturnValueOnce(Buffer.alloc(32, 0xCC))
    .mockReturnValueOnce(Buffer.from(payload));
}

describe('FamilyKitService — importFamilyKit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (EncryptedStorageService.getVaultSizeBytes as jest.Mock).mockResolvedValue(0);
    (EncryptedStorageService.saveFile as jest.Mock).mockResolvedValue('/mock/path');
    (DocumentRepository.insertDocument as jest.Mock).mockResolvedValue({ id: 'doc_imported_1' });
  });

  it('throws for invalid zip missing key.enc', async () => {
    mockLoadAsync.mockResolvedValue({
      file: (name: string) => (name === 'vault.enc' ? { async: jest.fn() } : null),
    });

    await expect(importFamilyKit('file:///kit.afterme', 'access-key'))
      .rejects.toThrow('missing key.enc or vault.enc');
  });

  it('throws for invalid zip missing vault.enc', async () => {
    mockLoadAsync.mockResolvedValue({
      file: (name: string) => (name === 'key.enc' ? { async: jest.fn() } : null),
    });

    await expect(importFamilyKit('file:///kit.afterme', 'access-key'))
      .rejects.toThrow('missing key.enc or vault.enc');
  });

  it('throws when payload has no documents array (Fix 38)', async () => {
    setupZipMock(JSON.stringify({ personal_messages: [] }));
    (CryptoService.decrypt as jest.Mock)
      .mockReset()
      .mockReturnValueOnce(Buffer.alloc(32, 0xCC))
      .mockReturnValueOnce(Buffer.from(JSON.stringify({ personal_messages: [] })));

    await expect(importFamilyKit('file:///kit.afterme', 'access-key'))
      .rejects.toThrow('documents list is missing or malformed');
  });

  it('throws when a document has missing file_data (Fix 38)', async () => {
    const payload = makeVaultPayload([
      { id: '1', category: 'Identity', title: 'Passport' },
    ]);
    setupZipMock(payload);
    (CryptoService.decrypt as jest.Mock)
      .mockReset()
      .mockReturnValueOnce(Buffer.alloc(32, 0xCC))
      .mockReturnValueOnce(Buffer.from(payload));

    await expect(importFamilyKit('file:///kit.afterme', 'access-key'))
      .rejects.toThrow('document at index 0 has missing or invalid file_data');
  });

  it('throws when vault capacity would be exceeded (Fix 12)', async () => {
    const doc = makeMockDoc();
    const payload = makeVaultPayload([doc]);
    setupZipMock(payload);
    (CryptoService.decrypt as jest.Mock)
      .mockReset()
      .mockReturnValueOnce(Buffer.alloc(32, 0xCC))
      .mockReturnValueOnce(Buffer.from(payload));

    const almostFull = 5 * 1024 * 1024 * 1024 - 1;
    (EncryptedStorageService.getVaultSizeBytes as jest.Mock).mockResolvedValue(almostFull);

    await expect(importFamilyKit('file:///kit.afterme', 'access-key'))
      .rejects.toThrow('would exceed the vault storage limit');
  });

  it('imports documents preserving metadata (Fix 11 — document_date, expiry_date, provider_name)', async () => {
    const doc = makeMockDoc({
      document_date: '2023-06-15',
      expiry_date: '2033-06-15',
      provider_name: 'Department of State',
    });
    const payload = makeVaultPayload([doc]);
    setupZipMock(payload);
    (CryptoService.decrypt as jest.Mock)
      .mockReset()
      .mockReturnValueOnce(Buffer.alloc(32, 0xCC))
      .mockReturnValueOnce(Buffer.from(payload));

    await importFamilyKit('file:///kit.afterme', 'access-key');

    expect(DocumentRepository.insertDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        documentDate: '2023-06-15',
        expiryDate: '2033-06-15',
        providerName: 'Department of State',
      }),
    );
  });

  it('rolls back on partial failure (Fix 39)', async () => {
    const docs = [makeMockDoc({ id: '1' }), makeMockDoc({ id: '2' })];
    const payload = makeVaultPayload(docs);
    setupZipMock(payload);
    (CryptoService.decrypt as jest.Mock)
      .mockReset()
      .mockReturnValueOnce(Buffer.alloc(32, 0xCC))
      .mockReturnValueOnce(Buffer.from(payload));

    (DocumentRepository.insertDocument as jest.Mock)
      .mockResolvedValueOnce({ id: 'doc_ok' })
      .mockRejectedValueOnce(new Error('DB insert failed'));

    await expect(importFamilyKit('file:///kit.afterme', 'access-key'))
      .rejects.toThrow('DB insert failed');

    expect(EncryptedStorageService.deleteFile).toHaveBeenCalled();
    expect(DocumentRepository.deleteDocument).toHaveBeenCalledWith('doc_ok');
  });

  it('returns correct document count on success', async () => {
    const docs = [makeMockDoc({ id: '1' }), makeMockDoc({ id: '2' })];
    const payload = makeVaultPayload(docs);
    setupZipMock(payload);
    (CryptoService.decrypt as jest.Mock)
      .mockReset()
      .mockReturnValueOnce(Buffer.alloc(32, 0xCC))
      .mockReturnValueOnce(Buffer.from(payload));

    const result = await importFamilyKit('file:///kit.afterme', 'access-key');
    expect(result).toEqual({ documentCount: 2 });
  });
});
