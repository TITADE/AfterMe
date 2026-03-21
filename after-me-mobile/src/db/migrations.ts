/**
 * Versioned schema migration system with failure recovery.
 * Uses SQLite PRAGMA user_version for schema version tracking.
 * Migrations run in order; each upgrades the schema by one version.
 * On migration failure (app crash mid-migration), detects and attempts recovery.
 */
import * as SQLite from 'expo-sqlite';
import {
  documentDirectory,
  makeDirectoryAsync,
  getInfoAsync,
  copyAsync,
  deleteAsync,
  readAsStringAsync,
  writeAsStringAsync,
  EncodingType,
} from 'expo-file-system/legacy';
import { SCHEMA_V1_STATEMENTS } from './schema';

const DB_NAME = 'afterme-vault.db';
const CURRENT_SCHEMA_VERSION = 1;
const MIGRATION_LOCK_KEY = 'afterme_migration_in_progress';
const MIGRATION_BACKUP_DIR = 'migration_backup';

const MIGRATIONS: { version: number; sql: string[] }[] = [
  { version: 1, sql: SCHEMA_V1_STATEMENTS },
];

/**
 * Detects migration failure from previous run and attempts restore from backup.
 * Call before runMigrations. Uses AsyncStorage-compatible file for lock.
 */
async function checkAndRecoverMigrationFailure(): Promise<void> {
  const lockPath = `${documentDirectory}${MIGRATION_LOCK_KEY}.txt`;
  try {
    const info = await getInfoAsync(lockPath);
    if (!info.exists) return;

    const content = await readAsStringAsync(lockPath, {
      encoding: EncodingType.UTF8,
    });
    const { backupPath } = JSON.parse(content || '{}');
    if (!backupPath) {
      await deleteAsync(lockPath, { idempotent: true });
      throw new Error(
        'Migration failed previously. Please restore from your Family Kit or Recovery Kit.'
      );
    }

    const backupInfo = await getInfoAsync(backupPath);
    if (backupInfo.exists) {
      const dbPath = `${documentDirectory}SQLite/${DB_NAME}`;
      const dbInfo = await getInfoAsync(dbPath);
      if (dbInfo.exists) {
        await copyAsync({ from: backupPath, to: dbPath });
      }
    }
    await deleteAsync(lockPath, { idempotent: true });
    await deleteAsync(backupPath, { idempotent: true });
  } catch (e) {
    console.warn('Migration recovery check:', e);
  }
}

/**
 * Creates a backup of the database before migration.
 * Returns the backup path, or null if backup is not possible.
 */
async function backupDatabaseBeforeMigration(): Promise<string | null> {
  try {
    const dbPath = `${documentDirectory}SQLite/${DB_NAME}`;
    const info = await getInfoAsync(dbPath);
    if (!info.exists) return null;

    const backupDir = `${documentDirectory}${MIGRATION_BACKUP_DIR}`;
    const dirInfo = await getInfoAsync(backupDir);
    if (!dirInfo.exists) {
      await makeDirectoryAsync(backupDir, { intermediates: true });
    }

    const backupPath = `${backupDir}/${DB_NAME}.bak.${Date.now()}`;
    await copyAsync({ from: dbPath, to: backupPath });
    return backupPath;
  } catch {
    return null;
  }
}

/**
 * Runs all pending migrations on the database.
 * Call this before any other DB operations.
 * Implements backup and failure recovery per migration_strategy.md.
 */
export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  const versionResult = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const currentVersion = versionResult?.user_version ?? 0;

  const pending = MIGRATIONS.filter((m) => m.version > currentVersion);
  if (pending.length === 0) return;

  for (const migration of pending) {
    const backupPath = await backupDatabaseBeforeMigration();
    const lockPath = `${documentDirectory}${MIGRATION_LOCK_KEY}.txt`;
    try {
      await writeAsStringAsync(
        lockPath,
        JSON.stringify({
          targetVersion: migration.version,
          backupPath: backupPath ?? '',
        }),
        { encoding: EncodingType.UTF8 }
      );
    } catch {}

    try {
      for (const stmt of migration.sql) {
        await db.execAsync(stmt);
      }
      await db.execAsync(`PRAGMA user_version = ${migration.version}`);

      // Cleanup only on success — lock + backup are preserved on failure
      // so checkAndRecoverMigrationFailure can restore on next launch.
      await deleteAsync(lockPath, { idempotent: true });
      if (backupPath) {
        await deleteAsync(backupPath, { idempotent: true });
      }
    } catch (e) {
      console.error('Migration failed:', e);
      throw e;
    }
  }
}

export { CURRENT_SCHEMA_VERSION, checkAndRecoverMigrationFailure };
