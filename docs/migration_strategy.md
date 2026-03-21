# Versioned Migration Strategy Specification

## Overview

As the "After Me" application evolves, the database schema and the encryption format may need to change. This document defines the strategy for handling these migrations securely and reliably. The app uses `expo-sqlite` for local storage and `react-native-quick-crypto` for all cryptographic operations. Schema versioning is tracked with SQLite's `PRAGMA user_version`, and all migration logic lives in `src/db/migrations.ts`.

## Version Identifiers

1. **Schema Version**: Tracked by `PRAGMA user_version` in the SQLite database.
   - Current version: `1` (defined by `CURRENT_SCHEMA_VERSION` in `migrations.ts`).
   - Each migration entry in the `MIGRATIONS` array has an integer `version` and an array of SQL statements.

2. **Encryption Format Version**: Implicit in the `CryptoService` implementation.
   - Current format: AES-256-GCM with 12-byte IV, 16-byte auth tag, 600 000-iteration PBKDF2-SHA256 for derived keys.
   - Wire format: `[IV 12B][AuthTag 16B][Ciphertext]`.

## Migration Procedures

### 1. Schema Migration (expo-sqlite)

**Trigger**: On every app launch, `getDb()` in `DocumentRepository` opens the database and calls `runMigrations(db)`. The function reads `PRAGMA user_version` and compares it against the `MIGRATIONS` array.

**Process**:

1. **Recovery check**: Before running any migration, `checkAndRecoverMigrationFailure()` looks for a lock file (`afterme_migration_in_progress.txt` in the app's document directory). If found, the previous migration was interrupted — see Failure Recovery below.
2. **Determine pending migrations**: Filter the `MIGRATIONS` array for entries whose `version` exceeds the current `user_version`.
3. **For each pending migration**:
   a. **Backup**: `backupDatabaseBeforeMigration()` copies the database file to `migration_backup/{DB_NAME}.bak.{timestamp}`.
   b. **Write lock file**: A JSON file containing `{ targetVersion, backupPath }` is written to the document directory. This acts as a crash-recovery sentinel.
   c. **Execute SQL**: Each statement in the migration's `sql` array is executed via `db.execAsync()`.
   d. **Bump version**: `PRAGMA user_version = {version}` is set.
   e. **Cleanup**: The lock file and backup are deleted on success.

**Migration definitions** are declarative SQL arrays:

```typescript
const MIGRATIONS: Array<{ version: number; sql: string[] }> = [
  {
    version: 1,
    sql: [
      `CREATE TABLE IF NOT EXISTS documents (...)`,
      `CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category)`,
      `CREATE INDEX IF NOT EXISTS idx_documents_expiry ON documents(expiry_date)`,
      `CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(created_at)`,
    ],
  },
  // Future migrations append here with version: 2, 3, etc.
];
```

For lightweight migrations (adding nullable columns, creating indexes), a single `ALTER TABLE` or `CREATE INDEX` statement suffices. For heavy migrations (renaming columns, changing types, restructuring data), the SQL array can contain multiple statements including temporary table creation, data copying, and table replacement.

**Critical constraint**: Encrypted fields (sensitive metadata stored as Base64 ciphertext) are opaque `TEXT` columns. Schema migrations must never attempt to parse, cast, or transform these values — they are binary blobs that can only be processed through `CryptoService`.

### 2. Encryption Format Migration (Re-Encryption)

**Trigger**: A security vulnerability is discovered, an algorithm upgrade is needed (e.g., post-quantum), or the wire format changes.

**Process**:

1. **Backup**: Create a full backup of the database and the vault directory.
2. **Decrypt**: Read all encrypted file blobs and metadata using the current algorithm and key.
3. **Re-encrypt**: Encrypt all items using the new algorithm and/or new key.
4. **Verify**: Perform integrity checks (decrypt a sample and compare to the original plaintext).
5. **Commit**: Replace old data with re-encrypted data.
6. **Cleanup**: Delete backups.

This process is structurally identical to key rotation (see below) but may also involve changes to `CryptoService` constants (algorithm, IV size, iteration count, etc.).

### 3. Key Rotation

Key rotation is a specialized form of re-encryption where the algorithm stays the same but the vault key changes. It is implemented in `KeyManager.rotateKeys()`:

1. Retrieve the current vault key (biometric auth required).
2. Generate a new 256-bit key via `CryptoService.generateKey()`.
3. Re-encrypt every file blob on disk via `EncryptedStorageService.reEncryptFile()`.
4. Re-encrypt every sensitive metadata field in every database row via `DocumentRepository.reEncryptAllMetadata()`. The affected fields are: `title`, `document_date`, `expiry_date`, `provider_name`, `location_of_original`.
5. Store the new key in `expo-secure-store`, replacing the old key.
6. Update the iCloud Keychain backup (iOS only).
7. Update the in-memory cache.

> **Note**: Key rotation does not involve a schema migration — `PRAGMA user_version` is unchanged. The schema is the same; only the encrypted contents of certain columns change.

## Failure Recovery (Rollback)

The migration system uses a **lock file + backup** mechanism for crash recovery:

### Lock File

- **Path**: `{documentDirectory}/afterme_migration_in_progress.txt`
- **Contents**: JSON with `targetVersion` (the migration being applied) and `backupPath` (path to the pre-migration database copy).
- **Written**: Before each migration begins.
- **Deleted**: After the migration completes successfully.

### Recovery Flow

On every app launch, before running migrations, `checkAndRecoverMigrationFailure()` executes:

1. Check if the lock file exists. If not, no recovery is needed.
2. Parse the lock file to extract `backupPath`.
3. If the backup file exists, copy it over the current database (restoring the pre-migration state).
4. Delete both the lock file and the backup.
5. If the backup is missing (e.g., disk was full), throw an error directing the user to restore from their Family Kit or Personal Recovery Kit.

After recovery, migrations will re-run normally on the next `getDb()` call, since `user_version` was not bumped (the crash occurred before or during the `PRAGMA user_version` write).

### Edge Cases

- **Crash after SQL execution but before `PRAGMA user_version` update**: The migration SQL is re-executed. Migrations should use `IF NOT EXISTS` / `IF EXISTS` guards to be idempotent.
- **Crash after `PRAGMA user_version` but before lock file cleanup**: The lock file exists but the migration succeeded. Recovery restores the backup unnecessarily. On next launch, the migration re-runs — again, idempotency guards prevent errors. This is a conservative "restore and retry" strategy that prioritizes data integrity over avoiding redundant work.
- **Power loss during file re-encryption (key rotation)**: Key rotation does not currently use the lock file mechanism. A partial rotation leaves some files encrypted with the old key and some with the new key. The user should be warned that key rotation requires adequate battery and a stable foreground session. Future improvement: wrap rotation in a similar backup/lock pattern.

## Testing Strategy

- Maintain a set of test database files at each schema version (e.g., `v0_empty.db`, `v1_with_data.db`).
- In CI, run migration tests that:
  1. Open a database at version N.
  2. Run `runMigrations()` to bring it to the current version.
  3. Verify `PRAGMA user_version` matches `CURRENT_SCHEMA_VERSION`.
  4. Verify table structure and indexes exist.
  5. Insert and retrieve data to confirm schema correctness.
- For encryption migration tests:
  1. Create a database with encrypted metadata using key A.
  2. Run `reEncryptAllMetadata(keyA, keyB)`.
  3. Verify all rows decrypt correctly with key B and fail with key A.
- For crash recovery tests:
  1. Create a lock file with a valid backup path.
  2. Call `runMigrations()`.
  3. Verify the database was restored from backup and migrations re-ran cleanly.
