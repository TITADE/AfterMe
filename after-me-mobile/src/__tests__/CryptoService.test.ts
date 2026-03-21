import { CryptoService } from '../core/crypto/CryptoService';

describe('CryptoService', () => {
  let testKey: Buffer;

  beforeAll(() => {
    testKey = CryptoService.generateKey();
  });

  describe('generateKey', () => {
    it('generates a 32-byte key', () => {
      const key = CryptoService.generateKey();
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32);
    });

    it('generates unique keys each call', () => {
      const k1 = CryptoService.generateKey();
      const k2 = CryptoService.generateKey();
      expect(k1.equals(k2)).toBe(false);
    });
  });

  describe('generateIV', () => {
    it('generates a 12-byte IV', () => {
      const iv = CryptoService.generateIV();
      expect(iv.length).toBe(12);
    });
  });

  describe('generateSecureId', () => {
    it('returns prefixed hex string with correct format', () => {
      const id = CryptoService.generateSecureId('doc');
      expect(id).toMatch(/^doc_[0-9a-f]{24}$/);
    });

    it('generates unique IDs', () => {
      const ids = new Set(Array.from({ length: 100 }, () => CryptoService.generateSecureId('x')));
      expect(ids.size).toBe(100);
    });
  });

  describe('encrypt / decrypt roundtrip', () => {
    it('encrypts and decrypts arbitrary binary data', () => {
      const plaintext = Buffer.from('Hello, vault!', 'utf-8');
      const encrypted = CryptoService.encrypt(plaintext, testKey);
      const decrypted = CryptoService.decrypt(encrypted, testKey);
      expect(decrypted.toString('utf-8')).toBe('Hello, vault!');
    });

    it('encrypted output differs from plaintext', () => {
      const plaintext = Buffer.from('sensitive data');
      const encrypted = CryptoService.encrypt(plaintext, testKey);
      expect(encrypted.equals(plaintext)).toBe(false);
    });

    it('produces wire format [IV 12B][AuthTag 16B][Ciphertext]', () => {
      const plaintext = Buffer.from('test');
      const encrypted = CryptoService.encrypt(plaintext, testKey);
      expect(encrypted.length).toBeGreaterThanOrEqual(12 + 16 + 1);
    });

    it('different encryptions of same plaintext produce different ciphertext', () => {
      const plaintext = Buffer.from('same content');
      const enc1 = CryptoService.encrypt(plaintext, testKey);
      const enc2 = CryptoService.encrypt(plaintext, testKey);
      expect(enc1.equals(enc2)).toBe(false);
    });

    it('handles empty buffer', () => {
      const plaintext = Buffer.alloc(0);
      const encrypted = CryptoService.encrypt(plaintext, testKey);
      const decrypted = CryptoService.decrypt(encrypted, testKey);
      expect(decrypted.length).toBe(0);
    });

    it('handles large data (1MB)', () => {
      const plaintext = Buffer.alloc(1024 * 1024, 0x42);
      const encrypted = CryptoService.encrypt(plaintext, testKey);
      const decrypted = CryptoService.decrypt(encrypted, testKey);
      expect(decrypted.equals(plaintext)).toBe(true);
    });
  });

  describe('encryptString / decryptString roundtrip', () => {
    it('encrypts and decrypts a UTF-8 string via base64', () => {
      const text = 'My secret document title 🔐';
      const ciphertext = CryptoService.encryptString(text, testKey);
      expect(typeof ciphertext).toBe('string');
      const decrypted = CryptoService.decryptString(ciphertext, testKey);
      expect(decrypted).toBe(text);
    });

    it('ciphertext is valid base64', () => {
      const ciphertext = CryptoService.encryptString('test', testKey);
      expect(() => Buffer.from(ciphertext, 'base64')).not.toThrow();
    });
  });

  describe('deriveKey', () => {
    it('derives deterministic keys from same password + salt', () => {
      const salt = Buffer.from('0123456789abcdef0123456789abcdef', 'hex');
      const key1 = CryptoService.deriveKey('password123', salt);
      const key2 = CryptoService.deriveKey('password123', salt);
      expect(key1.equals(key2)).toBe(true);
    });

    it('different passwords produce different keys', () => {
      const salt = Buffer.from('0123456789abcdef0123456789abcdef', 'hex');
      const key1 = CryptoService.deriveKey('password1', salt);
      const key2 = CryptoService.deriveKey('password2', salt);
      expect(key1.equals(key2)).toBe(false);
    });

    it('different salts produce different keys', () => {
      const salt1 = Buffer.from('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'hex');
      const salt2 = Buffer.from('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'hex');
      const key1 = CryptoService.deriveKey('password', salt1);
      const key2 = CryptoService.deriveKey('password', salt2);
      expect(key1.equals(key2)).toBe(false);
    });

    it('produces 32-byte key', () => {
      const salt = Buffer.alloc(32, 0xff);
      const key = CryptoService.deriveKey('test', salt);
      expect(key.length).toBe(32);
    });
  });

  describe('input validation (Fixes 19-20)', () => {
    it('encrypt() rejects key shorter than 32 bytes', () => {
      const shortKey = Buffer.alloc(16);
      expect(() => CryptoService.encrypt(Buffer.from('test'), shortKey)).toThrow(
        'Invalid key: expected 32 bytes',
      );
    });

    it('encrypt() rejects key longer than 32 bytes', () => {
      const longKey = Buffer.alloc(64);
      expect(() => CryptoService.encrypt(Buffer.from('test'), longKey)).toThrow(
        'Invalid key: expected 32 bytes',
      );
    });

    it('decrypt() rejects key shorter than 32 bytes', () => {
      const encrypted = CryptoService.encrypt(Buffer.from('test'), testKey);
      const shortKey = Buffer.alloc(16);
      expect(() => CryptoService.decrypt(encrypted, shortKey)).toThrow(
        'Invalid key: expected 32 bytes',
      );
    });

    it('decrypt() rejects data shorter than IV + auth tag (28 bytes)', () => {
      const tooShort = Buffer.alloc(20);
      expect(() => CryptoService.decrypt(tooShort, testKey)).toThrow(
        /expected at least 28 bytes/,
      );
    });

    it('decrypt() rejects tampered ciphertext (auth tag check)', () => {
      const encrypted = CryptoService.encrypt(Buffer.from('secret'), testKey);
      encrypted[15] ^= 0xff; // flip a byte in the auth tag
      expect(() => CryptoService.decrypt(encrypted, testKey)).toThrow();
    });

    it('decrypt() rejects wrong key', () => {
      const encrypted = CryptoService.encrypt(Buffer.from('data'), testKey);
      const wrongKey = CryptoService.generateKey();
      expect(() => CryptoService.decrypt(encrypted, wrongKey)).toThrow();
    });

    it('decryptString() rejects too-short base64', () => {
      const shortB64 = Buffer.alloc(10).toString('base64');
      expect(() => CryptoService.decryptString(shortB64, testKey)).toThrow(
        /at least 28 bytes/,
      );
    });
  });
});
