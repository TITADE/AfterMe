import QuickCrypto from 'react-native-quick-crypto';

// Constants
const ALGORITHM = 'aes-256-gcm';
const KEY_SIZE = 32; // 256 bits
const IV_SIZE = 12; // 96 bits (Standard for GCM)
const ITERATIONS = 600000;
const DIGEST = 'sha256';

export class CryptoService {
  /**
   * Generates a random 256-bit key
   */
  static generateKey(): Buffer {
    return QuickCrypto.randomBytes(KEY_SIZE) as any;
  }

  /**
   * Generates a random IV (Nonce)
   */
  static generateIV(): Buffer {
    return QuickCrypto.randomBytes(IV_SIZE) as any;
  }

  /**
   * Derives a key from a password/secret using PBKDF2
   */
  static deriveKey(password: string, salt: Buffer): Buffer {
    return QuickCrypto.pbkdf2Sync(
      password,
      salt,
      ITERATIONS,
      KEY_SIZE,
      DIGEST
    ) as any;
  }

  /**
   * Encrypts data using AES-256-GCM
   * Returns: [IV (12 bytes)] + [Auth Tag (16 bytes)] + [Ciphertext]
   */
  static encrypt(data: Buffer, key: Buffer): Buffer {
    const iv = this.generateIV();
    const cipher = QuickCrypto.createCipheriv(ALGORITHM, key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(data),
      cipher.final(),
    ]);
    
    const authTag = cipher.getAuthTag(); // 16 bytes

    // Pack: IV + Tag + Ciphertext
    return Buffer.concat([iv, authTag, encrypted]);
  }

  /**
   * Decrypts data using AES-256-GCM
   * Input format: [IV (12 bytes)] + [Auth Tag (16 bytes)] + [Ciphertext]
   */
  static decrypt(encryptedData: Buffer, key: Buffer): Buffer {
    // Unpack
    const iv = encryptedData.subarray(0, IV_SIZE);
    const authTag = encryptedData.subarray(IV_SIZE, IV_SIZE + 16);
    const ciphertext = encryptedData.subarray(IV_SIZE + 16);

    const decipher = QuickCrypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag as any);

    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
  }
}
