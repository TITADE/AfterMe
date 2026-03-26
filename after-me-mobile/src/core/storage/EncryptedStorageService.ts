import {
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  writeAsStringAsync,
  readAsStringAsync,
  deleteAsync,
  readDirectoryAsync,
  moveAsync,
  EncodingType,
} from 'expo-file-system/legacy';
import { CryptoService } from '../crypto/CryptoService';
import { getVaultKey } from '../auth/VaultKeyStore';
import { captureVaultError, traceVaultOperation } from '../../services/SentryService';

const VAULT_DIR = `${documentDirectory}vault/`;

/**
 * Strips directory separators and non-safe characters to prevent path traversal.
 * Only allows alphanumeric, hyphens, underscores, and dots.
 */
function sanitizeFilename(filename: string): string {
  const basename = filename.split('/').pop()?.split('\\').pop() ?? '';
  const sanitized = basename.replace(/[^a-zA-Z0-9._-]/g, '');
  if (!sanitized || sanitized === '.' || sanitized === '..') {
    throw new Error(`Invalid filename: "${filename}"`);
  }
  return sanitized;
}

export class EncryptedStorageService {
  static async initializeVault(): Promise<void> {
    const dirInfo = await getInfoAsync(VAULT_DIR);
    if (!dirInfo.exists) {
      await makeDirectoryAsync(VAULT_DIR, { intermediates: true });
    }
  }

  static async saveFile(filename: string, content: Buffer): Promise<string> {
    return traceVaultOperation('saveFile', async () => {
      const safe = sanitizeFilename(filename);
      const key = await getVaultKey();
      const encrypted = CryptoService.encrypt(content, key);

      const filePath = `${VAULT_DIR}${safe}.enc`;

      await writeAsStringAsync(filePath, encrypted.toString('base64'), {
        encoding: EncodingType.Base64,
      });

      return filePath;
    });
  }

  static async readFile(filename: string): Promise<Buffer> {
    return traceVaultOperation('readFile', async () => {
      try {
        const safe = sanitizeFilename(filename);
        const filePath = `${VAULT_DIR}${safe}.enc`;

        const encryptedBase64 = await readAsStringAsync(filePath, {
          encoding: EncodingType.Base64,
        });

        const encryptedBuffer = Buffer.from(encryptedBase64, 'base64');
        const key = await getVaultKey();

        return CryptoService.decrypt(encryptedBuffer, key);
      } catch (err) {
        captureVaultError(err, 'readFile');
        throw err;
      }
    });
  }

  static async reEncryptFile(
    filename: string,
    oldKey: Buffer,
    newKey: Buffer,
  ): Promise<void> {
    return traceVaultOperation('reEncryptFile', async () => {
      try {
        const safe = sanitizeFilename(filename);
        const filePath = `${VAULT_DIR}${safe}.enc`;
        const encryptedBase64 = await readAsStringAsync(filePath, {
          encoding: EncodingType.Base64,
        });
        const encryptedBuffer = Buffer.from(encryptedBase64, 'base64');
        const decrypted = CryptoService.decrypt(encryptedBuffer, oldKey);
        const reEncrypted = CryptoService.encrypt(decrypted, newKey);
        const tmpPath = `${filePath}.tmp`;
        await writeAsStringAsync(tmpPath, reEncrypted.toString('base64'), {
          encoding: EncodingType.Base64,
        });
        await moveAsync({ from: tmpPath, to: filePath });
      } catch (err) {
        captureVaultError(err, 'reEncryptFile');
        throw err;
      }
    });
  }

  static async deleteFile(filename: string): Promise<void> {
    return traceVaultOperation('deleteFile', async () => {
      const safe = sanitizeFilename(filename);
      const filePath = `${VAULT_DIR}${safe}.enc`;
      await deleteAsync(filePath, { idempotent: true });
    });
  }

  /**
   * Returns total vault size in bytes by summing all .enc files on disk.
   */
  static async getVaultSizeBytes(): Promise<number> {
    return traceVaultOperation('getVaultSizeBytes', async () => {
      await this.initializeVault();
      const files = await readDirectoryAsync(VAULT_DIR);
      const sizes = await Promise.all(
        files.map(async (file) => {
          const info = await getInfoAsync(`${VAULT_DIR}${file}`);
          return info.exists && 'size' in info ? (info as { size: number }).size : 0;
        })
      );
      return sizes.reduce((sum, s) => sum + s, 0);
    });
  }

  /**
   * Checks if a file exists and can be read (not necessarily decrypted).
   */
  static async fileExists(filename: string): Promise<boolean> {
    const safe = sanitizeFilename(filename);
    const filePath = `${VAULT_DIR}${safe}.enc`;
    const info = await getInfoAsync(filePath);
    return info.exists;
  }

  /**
   * Validates file integrity by attempting a full decrypt.
   * Returns true if the file decrypts successfully, false otherwise.
   */
  static async validateFileIntegrity(filename: string): Promise<boolean> {
    try {
      await this.readFile(filename);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Re-encrypts a file to a staging path (.enc.new) without overwriting the original.
   * Used during atomic key rotation (Phase A — prepare).
   */
  static async reEncryptFileToStaging(
    filename: string,
    oldKey: Buffer,
    newKey: Buffer,
  ): Promise<void> {
    return traceVaultOperation('reEncryptFileToStaging', async () => {
      const safe = sanitizeFilename(filename);
      const srcPath = `${VAULT_DIR}${safe}.enc`;
      const stagingPath = `${VAULT_DIR}${safe}.enc.new`;
      const encryptedBase64 = await readAsStringAsync(srcPath, {
        encoding: EncodingType.Base64,
      });
      const decrypted = CryptoService.decrypt(
        Buffer.from(encryptedBase64, 'base64'),
        oldKey,
      );
      const reEncrypted = CryptoService.encrypt(decrypted, newKey);
      await writeAsStringAsync(stagingPath, reEncrypted.toString('base64'), {
        encoding: EncodingType.Base64,
      });
    });
  }

  /**
   * Atomically promotes staged .enc.new files to .enc (Phase B — commit).
   * For each ref: deletes the old .enc, moves .enc.new → .enc.
   */
  static async commitStagedFiles(fileRefs: string[]): Promise<void> {
    for (const ref of fileRefs) {
      const safe = sanitizeFilename(ref);
      const oldPath = `${VAULT_DIR}${safe}.enc`;
      const newPath = `${VAULT_DIR}${safe}.enc.new`;
      const info = await getInfoAsync(newPath);
      if (info.exists) {
        await deleteAsync(oldPath, { idempotent: true });
        await moveAsync({ from: newPath, to: oldPath });
      }
    }
  }

  /**
   * Removes any leftover .enc.new staging files (rollback / cleanup).
   */
  static async cleanupStagedFiles(): Promise<void> {
    await this.initializeVault();
    const files = await readDirectoryAsync(VAULT_DIR);
    for (const file of files) {
      if (file.endsWith('.enc.new')) {
        await deleteAsync(`${VAULT_DIR}${file}`, { idempotent: true });
      }
    }
  }
}
