/**
 * SQLite schema for document metadata.
 * Blob storage is handled by EncryptedStorageService.
 */

export const SCHEMA_V1_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    document_date TEXT,
    expiry_date TEXT,
    provider_name TEXT,
    location_of_original TEXT,
    file_ref TEXT NOT NULL,
    thumbnail_ref TEXT,
    format TEXT NOT NULL CHECK(format IN ('jpeg', 'png', 'pdf')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category)`,
  `CREATE INDEX IF NOT EXISTS idx_documents_expiry ON documents(expiry_date)`,
  `CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(created_at)`,
];

/** @deprecated Use SCHEMA_V1_STATEMENTS for new code. Kept for backward compatibility. */
export const DOCUMENTS_TABLE = SCHEMA_V1_STATEMENTS.join(';\n') + ';';
