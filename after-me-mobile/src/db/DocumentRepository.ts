import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { runMigrations, checkAndRecoverMigrationFailure } from './migrations';
import { CryptoService } from '../core/crypto/CryptoService';
import { KeyManager } from '../core/auth/KeyManager';
import type { Document, DocumentInsert } from '../models/Document';

const DB_NAME = 'afterme-vault.db';
const DATE_MIGRATION_KEY = 'afterme_date_plaintext_migrated';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let dbInitPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = (async () => {
    await checkAndRecoverMigrationFailure();
    const db = await SQLite.openDatabaseAsync(DB_NAME);
    await runMigrations(db);
    dbInstance = db;
    return db;
  })();

  try {
    return await dbInitPromise;
  } finally {
    dbInitPromise = null;
  }
}

// ── Encryption helpers ──────────────────────────────────────────────────
// Sensitive fields (title, provider_name, etc.) are AES-256-GCM encrypted
// at rest. Structural/queryable fields (id, category, format, dates for
// expiry alerts) stay plaintext so we can filter and index.

function encryptField(value: string | null, key: Buffer): string | null {
  if (value === null || value === undefined) return null;
  return CryptoService.encryptString(value, key);
}

function decryptField(value: string | null, key: Buffer): string | null {
  if (value === null || value === undefined) return null;
  try {
    return CryptoService.decryptString(value, key);
  } catch {
    return '[encrypted]';
  }
}

function decryptFieldStrict(value: string | null, key: Buffer): string | null {
  if (value === null || value === undefined) return null;
  return CryptoService.decryptString(value, key);
}

function rowToDocument(row: Record<string, unknown>, key: Buffer): Document {
  return {
    id: row.id as string,
    category: row.category as Document['category'],
    title: decryptField(row.title as string, key) ?? '',
    documentDate: (row.document_date as string) || null,
    expiryDate: (row.expiry_date as string) || null,
    providerName: decryptField((row.provider_name as string) || null, key),
    locationOfOriginal: decryptField(
      (row.location_of_original as string) || null,
      key,
    ),
    fileRef: row.file_ref as string,
    thumbnailRef: (row.thumbnail_ref as string) || null,
    format: row.format as Document['format'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ── Public API ──────────────────────────────────────────────────────────

export async function insertDocument(doc: DocumentInsert): Promise<Document> {
  const db = await getDb();
  const key = await KeyManager.getVaultKey();
  const id = CryptoService.generateSecureId('doc');
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO documents (id, category, title, document_date, expiry_date, provider_name, location_of_original, file_ref, thumbnail_ref, format, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      doc.category,
      encryptField(doc.title, key),
      doc.documentDate ?? null,
      doc.expiryDate ?? null,
      encryptField(doc.providerName ?? null, key),
      encryptField(doc.locationOfOriginal ?? null, key),
      doc.fileRef,
      doc.thumbnailRef ?? null,
      doc.format,
      now,
      now,
    ],
  );

  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM documents WHERE id = ?',
    [id],
  );
  if (!row) throw new Error('Failed to fetch inserted document');
  return rowToDocument(row, key);
}

export async function getAllDocuments(): Promise<Document[]> {
  const db = await getDb();
  const key = await KeyManager.getVaultKey();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM documents ORDER BY created_at DESC',
  );
  return rows.map((r) => rowToDocument(r, key));
}

export async function getDocumentsByCategory(
  category: string,
): Promise<Document[]> {
  const db = await getDb();
  const key = await KeyManager.getVaultKey();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM documents WHERE category = ? ORDER BY created_at DESC',
    [category],
  );
  return rows.map((r) => rowToDocument(r, key));
}

export async function getDocumentById(
  id: string,
): Promise<Document | null> {
  const db = await getDb();
  const key = await KeyManager.getVaultKey();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM documents WHERE id = ?',
    [id],
  );
  return row ? rowToDocument(row, key) : null;
}

export async function updateDocument(
  id: string,
  updates: Partial<
    Pick<
      Document,
      'title' | 'documentDate' | 'expiryDate' | 'providerName' | 'locationOfOriginal'
    >
  >,
): Promise<void> {
  const db = await getDb();
  const key = await KeyManager.getVaultKey();
  const now = new Date().toISOString();

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(encryptField(updates.title, key));
  }
  if (updates.documentDate !== undefined) {
    fields.push('document_date = ?');
    values.push(updates.documentDate);
  }
  if (updates.expiryDate !== undefined) {
    fields.push('expiry_date = ?');
    values.push(updates.expiryDate);
  }
  if (updates.providerName !== undefined) {
    fields.push('provider_name = ?');
    values.push(encryptField(updates.providerName, key));
  }
  if (updates.locationOfOriginal !== undefined) {
    fields.push('location_of_original = ?');
    values.push(encryptField(updates.locationOfOriginal, key));
  }

  if (fields.length === 0) return;

  fields.push('updated_at = ?');
  values.push(now);
  values.push(id);

  await db.runAsync(
    `UPDATE documents SET ${fields.join(', ')} WHERE id = ?`,
    values,
  );
}

export async function deleteDocument(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM documents WHERE id = ?', [id]);
}

export async function getAllFileRefs(): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ file_ref: string }>(
    'SELECT DISTINCT file_ref FROM documents',
  );
  const refs = rows.map((r) => r.file_ref);
  const thumbRows = await db.getAllAsync<{ thumbnail_ref: string }>(
    'SELECT thumbnail_ref FROM documents WHERE thumbnail_ref IS NOT NULL',
  );
  const thumbs = thumbRows.map((r) => r.thumbnail_ref).filter(Boolean);
  return [...new Set([...refs, ...thumbs])];
}

export async function getDocumentCountByCategory(): Promise<
  Record<string, number>
> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ category: string; count: number }>(
    'SELECT category, COUNT(*) as count FROM documents GROUP BY category',
  );
  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row.category] = row.count;
  }
  return result;
}

/**
 * One-time migration: converts any previously encrypted date fields to plaintext.
 * Uses decryptField (lenient) so already-plaintext values pass through unchanged.
 * Safe to call multiple times — skips if the migration flag is already set.
 */
export async function migrateDatesToPlaintext(): Promise<void> {
  const done = await AsyncStorage.getItem(DATE_MIGRATION_KEY);
  if (done === 'true') return;

  let key: Buffer;
  try {
    key = await KeyManager.getVaultKey();
  } catch {
    return;
  }

  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT id, document_date, expiry_date FROM documents',
  );

  for (const row of rows) {
    const docDate = decryptField((row.document_date as string) || null, key);
    const expDate = decryptField((row.expiry_date as string) || null, key);

    await db.runAsync(
      'UPDATE documents SET document_date = ?, expiry_date = ? WHERE id = ?',
      [docDate, expDate, row.id as string],
    );
  }

  await AsyncStorage.setItem(DATE_MIGRATION_KEY, 'true');
}

/**
 * Re-encrypts all sensitive metadata with a new key (called during key rotation).
 * Only re-encrypts title, provider_name, and location_of_original.
 * Date fields (document_date, expiry_date) are plaintext and not re-encrypted.
 */
export async function reEncryptAllMetadata(
  oldKey: Buffer,
  newKey: Buffer,
): Promise<void> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM documents',
  );

  await db.withExclusiveTransactionAsync(async (txn) => {
    for (const row of rows) {
      const title = decryptFieldStrict(row.title as string, oldKey);
      const provider = decryptFieldStrict((row.provider_name as string) || null, oldKey);
      const location = decryptFieldStrict(
        (row.location_of_original as string) || null,
        oldKey,
      );

      await txn.runAsync(
        `UPDATE documents SET title = ?,
         provider_name = ?, location_of_original = ? WHERE id = ?`,
        [
          encryptField(title, newKey),
          encryptField(provider, newKey),
          encryptField(location, newKey),
          row.id as string,
        ],
      );
    }
  });
}
