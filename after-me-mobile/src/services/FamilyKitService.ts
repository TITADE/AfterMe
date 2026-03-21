/**
 * Family Kit import — parse .afterme file and decrypt with QR access key.
 * Per .afterme format spec.
 */
import JSZip from 'jszip';
import { Buffer } from 'buffer';
import { CryptoService } from '../core/crypto/CryptoService';
import { EncryptedStorageService } from '../core/storage/EncryptedStorageService';
import * as DocumentRepository from '../db/DocumentRepository';
import type { DocumentCategory } from '../models/DocumentCategory';
import { VAULT_STORAGE_CAP_PERSONAL_BYTES } from '../constants/storage';

const SALT_SIZE = 32;

const CATEGORY_MAP: Record<string, DocumentCategory> = {
  Identity: 'identity',
  Legal: 'legal',
  Property: 'property',
  Finance: 'finance',
  Insurance: 'insurance',
  Medical: 'medical',
  Digital: 'digital',
  Personal: 'personal',
  Health: 'medical',
};

function toCategory(s: string): DocumentCategory {
  return CATEGORY_MAP[s] ?? 'personal';
}

interface AfterMeDocument {
  id?: string;
  category: string;
  title: string;
  file_data: string;
  mime_type?: string;
  created_at?: string;
  document_date?: string | null;
  expiry_date?: string | null;
  provider_name?: string | null;
}

interface VaultPayload {
  documents: AfterMeDocument[];
  personal_messages?: unknown[];
}

/**
 * Import a Family Kit (.afterme file) using the access key from the QR code.
 */
export async function importFamilyKit(
  fileUri: string,
  accessKey: string
): Promise<{ documentCount: number }> {
  const base64 = await readFileAsBase64(fileUri);
  const zip = await JSZip.loadAsync(base64, { base64: true });

  const keyEncFile = zip.file('key.enc');
  const vaultEncFile = zip.file('vault.enc');

  if (!keyEncFile || !vaultEncFile) {
    throw new Error('Invalid Family Kit: missing key.enc or vault.enc');
  }

  const keyEnc = Buffer.from(await keyEncFile.async('arraybuffer'));
  const vaultEnc = Buffer.from(await vaultEncFile.async('arraybuffer'));

  const salt = keyEnc.subarray(0, SALT_SIZE);
  const wrappedCek = keyEnc.subarray(SALT_SIZE);
  const kek = CryptoService.deriveKey(accessKey, salt);
  const cek = CryptoService.decrypt(wrappedCek, kek);
  const vaultRaw = CryptoService.decrypt(vaultEnc, cek);
  const vault: VaultPayload = JSON.parse(vaultRaw.toString('utf8'));

  if (!Array.isArray(vault.documents)) {
    throw new Error('Invalid Family Kit: documents list is missing or malformed');
  }

  for (let i = 0; i < vault.documents.length; i++) {
    const doc = vault.documents[i];
    if (!doc.file_data || typeof doc.file_data !== 'string') {
      throw new Error(`Invalid Family Kit: document at index ${i} has missing or invalid file_data`);
    }
    if (!doc.title && !doc.category) {
      throw new Error(`Invalid Family Kit: document at index ${i} has no title or category`);
    }
  }

  if (vault.documents.length === 0) {
    return { documentCount: 0 };
  }

  await EncryptedStorageService.initializeVault();

  const totalIncomingBytes = vault.documents.reduce(
    (sum, doc) => sum + Buffer.byteLength(doc.file_data, 'base64'),
    0,
  );
  const currentVaultSize = await EncryptedStorageService.getVaultSizeBytes();
  if (currentVaultSize + totalIncomingBytes > VAULT_STORAGE_CAP_PERSONAL_BYTES) {
    const usedMB = Math.round(currentVaultSize / 1024 / 1024);
    const incomingMB = Math.round(totalIncomingBytes / 1024 / 1024);
    const capGB = VAULT_STORAGE_CAP_PERSONAL_BYTES / 1024 / 1024 / 1024;
    throw new Error(
      `This kit (${incomingMB}MB) would exceed the vault storage limit ` +
      `(${usedMB}MB used of ${capGB}GB). Free space by deleting documents first.`,
    );
  }

  let imported = 0;
  const importedFileRefs: string[] = [];
  const importedDocIds: string[] = [];

  try {
    for (const doc of vault.documents) {
      const content = Buffer.from(doc.file_data, 'base64');
      const fileRef = CryptoService.generateSecureId('fk');
      await EncryptedStorageService.saveFile(fileRef, content);
      importedFileRefs.push(fileRef);

      const format =
        doc.mime_type?.includes('pdf') ? 'pdf' :
        doc.mime_type?.includes('png') ? 'png' : 'jpeg';

      const inserted = await DocumentRepository.insertDocument({
        category: toCategory(doc.category),
        title: doc.title ?? 'Imported Document',
        fileRef,
        format,
        documentDate: doc.document_date ?? null,
        expiryDate: doc.expiry_date ?? null,
        providerName: doc.provider_name ?? null,
      });
      importedDocIds.push(inserted.id);
      imported++;
    }
  } catch (err) {
    for (const ref of importedFileRefs) {
      await EncryptedStorageService.deleteFile(ref).catch(() => {});
    }
    for (const docId of importedDocIds) {
      await DocumentRepository.deleteDocument(docId).catch(() => {});
    }
    throw err;
  }

  return { documentCount: imported };
}

async function readFileAsBase64(uri: string): Promise<string> {
  const { readAsStringAsync, EncodingType } = await import('expo-file-system/legacy');
  return readAsStringAsync(uri, { encoding: EncodingType.Base64 });
}
