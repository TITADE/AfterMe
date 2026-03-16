import { documentDirectory, getInfoAsync, makeDirectoryAsync, writeAsStringAsync, readAsStringAsync, deleteAsync, EncodingType } from 'expo-file-system/legacy';
import { CryptoService } from '../crypto/CryptoService';
import { KeyManager } from '../auth/KeyManager';

const VAULT_DIR = `${documentDirectory}vault/`;

export class EncryptedStorageService {
  /**
   * Initializes the vault directory.
   */
  static async initializeVault(): Promise<void> {
    const dirInfo = await getInfoAsync(VAULT_DIR);
    if (!dirInfo.exists) {
      await makeDirectoryAsync(VAULT_DIR, { intermediates: true });
    }
  }

  /**
   * Saves encrypted data to a file.
   * 1. Generates/Retrieves Vault Key (triggers Biometrics).
   * 2. Encrypts data (AES-256-GCM).
   * 3. Writes to disk.
   */
  static async saveFile(filename: string, content: Buffer): Promise<string> {
    const key = await KeyManager.getVaultKey(); // Unlock
    const encrypted = CryptoService.encrypt(content, key);
    
    const filePath = `${VAULT_DIR}${filename}.enc`;
    
    // Write as base64 string (Expo FileSystem handles base64)
    await writeAsStringAsync(filePath, encrypted.toString('base64'), {
      encoding: EncodingType.Base64,
    });
    
    return filePath;
  }

  /**
   * Reads and decrypts a file.
   */
  static async readFile(filename: string): Promise<Buffer> {
    const filePath = `${VAULT_DIR}${filename}.enc`;
    
    // Read encrypted data
    const encryptedBase64 = await readAsStringAsync(filePath, {
      encoding: EncodingType.Base64,
    });
    
    const encryptedBuffer = Buffer.from(encryptedBase64, 'base64');
    const key = await KeyManager.getVaultKey(); // Unlock
    
    return CryptoService.decrypt(encryptedBuffer, key);
  }

  /**
   * Deletes a file.
   */
  static async deleteFile(filename: string): Promise<void> {
    const filePath = `${VAULT_DIR}${filename}.enc`;
    await deleteAsync(filePath, { idempotent: true });
  }
}
