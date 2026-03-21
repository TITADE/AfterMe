import {
  MAX_SINGLE_DOCUMENT_SIZE_BYTES,
  VAULT_STORAGE_CAP_PERSONAL_BYTES,
  VAULT_STORAGE_CAP_FAMILY_BYTES,
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_EXTENSIONS,
} from '../constants/storage';

describe('Storage Constants', () => {
  it('MAX_SINGLE_DOCUMENT_SIZE_BYTES is 50MB', () => {
    expect(MAX_SINGLE_DOCUMENT_SIZE_BYTES).toBe(50 * 1024 * 1024);
  });

  it('VAULT_STORAGE_CAP_PERSONAL_BYTES is 5GB', () => {
    expect(VAULT_STORAGE_CAP_PERSONAL_BYTES).toBe(5 * 1024 * 1024 * 1024);
  });

  it('VAULT_STORAGE_CAP_FAMILY_BYTES is 25GB', () => {
    expect(VAULT_STORAGE_CAP_FAMILY_BYTES).toBe(25 * 1024 * 1024 * 1024);
  });

  it('ALLOWED_DOCUMENT_TYPES includes expected MIME types', () => {
    expect(ALLOWED_DOCUMENT_TYPES).toContain('image/jpeg');
    expect(ALLOWED_DOCUMENT_TYPES).toContain('image/png');
    expect(ALLOWED_DOCUMENT_TYPES).toContain('application/pdf');
  });

  it('ALLOWED_EXTENSIONS includes expected file extensions', () => {
    expect(ALLOWED_EXTENSIONS).toContain('.jpg');
    expect(ALLOWED_EXTENSIONS).toContain('.jpeg');
    expect(ALLOWED_EXTENSIONS).toContain('.png');
    expect(ALLOWED_EXTENSIONS).toContain('.pdf');
  });

  it('ALLOWED_EXTENSIONS does NOT include .heic (handled separately)', () => {
    expect(ALLOWED_EXTENSIONS).not.toContain('.heic');
  });
});
