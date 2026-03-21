import QuickCrypto from 'react-native-quick-crypto';
import { captureVaultError } from '../../services/SentryService';

const ALGORITHM = 'aes-256-gcm';
const KEY_SIZE = 32;
const IV_SIZE = 12;
const AUTH_TAG_SIZE = 16;
const ITERATIONS = 600000;
const DIGEST = 'sha256';

export class CryptoService {
  static generateKey(): Buffer {
    return Buffer.from(QuickCrypto.randomBytes(KEY_SIZE));
  }

  static generateIV(): Buffer {
    return Buffer.from(QuickCrypto.randomBytes(IV_SIZE));
  }

  /**
   * Cryptographically secure ID with a prefix for traceability.
   * 12 random bytes → 24 hex chars ≈ 96 bits of entropy.
   */
  static generateSecureId(prefix: string): string {
    const bytes = QuickCrypto.randomBytes(12);
    return `${prefix}_${Buffer.from(bytes).toString('hex')}`;
  }

  static deriveKey(password: string, salt: Buffer): Buffer {
    return Buffer.from(
      QuickCrypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_SIZE, DIGEST)
    );
  }

  /**
   * AES-256-GCM encrypt.
   * Wire format: [IV 12B][AuthTag 16B][Ciphertext]
   */
  static encrypt(data: Buffer, key: Buffer, aad?: Buffer): Buffer {
    if (key.length !== KEY_SIZE) {
      throw new Error('Invalid key: expected 32 bytes');
    }
    try {
      const iv = this.generateIV();
      const cipher = QuickCrypto.createCipheriv(ALGORITHM, key, iv);
      if (aad) cipher.setAAD(aad as any);

      const encrypted = Buffer.concat([
        cipher.update(data),
        cipher.final(),
      ]);

      const authTag = cipher.getAuthTag();

      return Buffer.concat([iv, authTag, encrypted]);
    } catch (err) {
      captureVaultError(err, 'encrypt');
      throw err;
    }
  }

  /**
   * AES-256-GCM decrypt.
   * Expects wire format: [IV 12B][AuthTag 16B][Ciphertext]
   */
  static decrypt(encryptedData: Buffer, key: Buffer, aad?: Buffer): Buffer {
    if (key.length !== KEY_SIZE) {
      throw new Error('Invalid key: expected 32 bytes');
    }
    if (encryptedData.length < IV_SIZE + AUTH_TAG_SIZE) {
      throw new Error(
        `Invalid encrypted data: expected at least ${IV_SIZE + AUTH_TAG_SIZE} bytes (IV + auth tag), got ${encryptedData.length}`
      );
    }
    try {
      const iv = encryptedData.subarray(0, IV_SIZE);
      const authTag = encryptedData.subarray(IV_SIZE, IV_SIZE + AUTH_TAG_SIZE);
      const ciphertext = encryptedData.subarray(IV_SIZE + AUTH_TAG_SIZE);

      const decipher = QuickCrypto.createDecipheriv(ALGORITHM, key, iv);
      if (aad) decipher.setAAD(aad as any);
      decipher.setAuthTag(authTag as any);

      return Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);
    } catch (err) {
      captureVaultError(err, 'decrypt');
      throw err;
    }
  }

  /**
   * Convenience: encrypt a UTF-8 string, return base64.
   * Used for encrypting individual metadata fields.
   */
  static encryptString(plaintext: string, key: Buffer): string {
    const data = Buffer.from(plaintext, 'utf8');
    return this.encrypt(data, key).toString('base64');
  }

  /**
   * Convenience: decrypt a base64 blob back to a UTF-8 string.
   */
  static decryptString(ciphertextBase64: string, key: Buffer): string {
    const data = Buffer.from(ciphertextBase64, 'base64');
    if (data.length < IV_SIZE + AUTH_TAG_SIZE) {
      throw new Error(
        `Invalid ciphertext: decoded length must be at least ${IV_SIZE + AUTH_TAG_SIZE} bytes, got ${data.length}`
      );
    }
    return this.decrypt(data, key).toString('utf8');
  }
}
