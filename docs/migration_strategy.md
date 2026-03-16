# Versioned Migration Strategy Specification

## Overview
As the "After Me" application evolves, the data schema (SwiftData/CoreData models) and the encryption format (e.g., key wrapping algorithm) may need to change. This document defines the strategy for handling these migrations securely and reliably.

## Version Identifiers

1.  **Schema Version**: Managed by SwiftData/CoreData `SchemaMigrationPlan`.
    -   Current Version: `v1`.
2.  **Encryption Format Version**: Stored in `manifest.json` or Keychain metadata.
    -   Current Version: `v1` (AES-256-GCM, PBKDF2).

## Migration Procedures

### 1. Schema Migration (SwiftData)
-   **Trigger**: App launch detects a mismatch between the stored data model and the current app model.
-   **Process**:
    -   Use `SchemaMigrationPlan` to define lightweight migrations (adding optional properties).
    -   For heavy migrations (renaming, type changes), implement custom `Stage` logic.
    -   **Critical**: Ensure that encrypted fields (`Data` blobs) are not corrupted during migration.

### 2. Encryption Format Migration (Re-Encryption)
-   **Trigger**: Security vulnerability discovered or algorithm upgrade (e.g., moving to Post-Quantum Cryptography).
-   **Process**:
    1.  **Backup**: Before starting, create a temporary backup of the existing vault.
    2.  **Decrypt**: Decrypt all items using the *old* algorithm and *old* key.
    3.  **Re-Encrypt**: Encrypt all items using the *new* algorithm and *new* key.
    4.  **Verify**: Perform integrity check on the new data.
    5.  **Commit**: Replace the old vault data with the new data.
    6.  **Cleanup**: Delete the backup.

### 3. Key Rotation (Manual or Policy-Driven)
-   See `Secure Enclave Key Lifecycle` document.
-   Key rotation is a form of migration where the *data* is re-encrypted with a new key, but the *schema* remains the same.

## Failure Recovery (Rollback)
-   If a migration fails mid-process (e.g., app crash, battery die):
    -   The app must detect the "migration in progress" state on next launch.
    -   It should attempt to restore from the temporary backup created in Step 1.
    -   If restore fails, prompt the user to restore from their **CloudKit Backup** or **Personal Recovery Kit**.

## Testing Strategy
-   Maintain a set of "v1 Vault" test files.
-   In CI/CD, run migration tests that:
    1.  Load v1 data.
    2.  Apply migration to v2.
    3.  Verify data integrity (decrypt and check content).
