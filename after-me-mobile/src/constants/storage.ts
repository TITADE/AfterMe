/**
 * Storage limits per PRD - iOS Implementation Plan Phase 2
 */
export const MAX_SINGLE_DOCUMENT_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
export const VAULT_STORAGE_CAP_PERSONAL_BYTES = 5 * 1024 * 1024 * 1024; // 5GB
export const VAULT_STORAGE_CAP_FAMILY_BYTES = 25 * 1024 * 1024 * 1024; // 25GB

export const ALLOWED_DOCUMENT_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'] as const;
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'] as const;
