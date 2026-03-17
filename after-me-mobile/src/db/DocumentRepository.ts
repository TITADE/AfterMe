import * as SQLite from 'expo-sqlite';
import { DOCUMENTS_TABLE } from './schema';
import type { Document, DocumentInsert } from '../models/Document';

const DB_NAME = 'afterme-vault.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
  await dbInstance.execAsync(DOCUMENTS_TABLE);
  return dbInstance;
}

function rowToDocument(row: Record<string, unknown>): Document {
  return {
    id: row.id as string,
    category: row.category as Document['category'],
    title: row.title as string,
    documentDate: (row.document_date as string) || null,
    expiryDate: (row.expiry_date as string) || null,
    providerName: (row.provider_name as string) || null,
    locationOfOriginal: (row.location_of_original as string) || null,
    fileRef: row.file_ref as string,
    thumbnailRef: (row.thumbnail_ref as string) || null,
    format: row.format as Document['format'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function insertDocument(doc: DocumentInsert): Promise<Document> {
  const db = await getDb();
  const id = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO documents (id, category, title, document_date, expiry_date, provider_name, location_of_original, file_ref, thumbnail_ref, format, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      doc.category,
      doc.title,
      doc.documentDate ?? null,
      doc.expiryDate ?? null,
      doc.providerName ?? null,
      doc.locationOfOriginal ?? null,
      doc.fileRef,
      doc.thumbnailRef ?? null,
      doc.format,
      now,
      now,
    ]
  );

  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM documents WHERE id = ?',
    [id]
  );
  if (!row) throw new Error('Failed to fetch inserted document');
  return rowToDocument(row);
}

export async function getAllDocuments(): Promise<Document[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM documents ORDER BY created_at DESC'
  );
  return rows.map(rowToDocument);
}

export async function getDocumentsByCategory(category: string): Promise<Document[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM documents WHERE category = ? ORDER BY created_at DESC',
    [category]
  );
  return rows.map(rowToDocument);
}

export async function getDocumentById(id: string): Promise<Document | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM documents WHERE id = ?',
    [id]
  );
  return row ? rowToDocument(row) : null;
}

export async function updateDocument(
  id: string,
  updates: Partial<Pick<Document, 'title' | 'documentDate' | 'expiryDate' | 'providerName' | 'locationOfOriginal'>>
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
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
    values.push(updates.providerName);
  }
  if (updates.locationOfOriginal !== undefined) {
    fields.push('location_of_original = ?');
    values.push(updates.locationOfOriginal);
  }

  if (fields.length === 0) return;

  fields.push('updated_at = ?');
  values.push(now);
  values.push(id);

  await db.runAsync(`UPDATE documents SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteDocument(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM documents WHERE id = ?', [id]);
}

export async function getDocumentCountByCategory(): Promise<Record<string, number>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ category: string; count: number }>(
    'SELECT category, COUNT(*) as count FROM documents GROUP BY category'
  );
  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row.category] = row.count;
  }
  return result;
}
