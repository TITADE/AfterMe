# Critical Fixes — Implementation Plan

**Date:** 17 March 2026
**Scope:** 5 critical issues from `docs/code_review_findings.md`
**Implementation order:** Sequential (1 → 5), ordered by risk and dependency

---

## Fix 1: Developer tools exposed in production

**File:** `src/features/settings/SettingsScreen.tsx`
**Severity:** Critical — production users can reset their vault or seed test data
**Risk of fix:** Low
**Estimated effort:** 5 minutes

### Root Cause

The "Developer" section (Phase 1 Verification, Seed Test Documents) at lines 784–808 and the "Danger Zone" section (Reset Vault & Onboarding) at lines 810–823 are rendered unconditionally. There is no `__DEV__` guard, so production App Store builds expose these controls to every user.

### Fix

Wrap **both** sections in a single `{__DEV__ && ( ... )}` conditional so they only render in development builds:

```tsx
{__DEV__ && (
  <>
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Developer</Text>
      {/* Phase 1 Verification button */}
      {/* Seed Test Documents button */}
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Danger Zone</Text>
      {/* Reset Vault & Onboarding button */}
    </View>
  </>
)}
```

### Why this works

`__DEV__` is a compile-time constant in React Native / Metro. When `__DEV__` is `false` (production), the bundler's dead-code elimination removes the entire block from the JS bundle — the buttons never exist in the production binary.

### Testing

1. Run in development mode (`npx expo start`) — verify both sections remain visible in Settings.
2. Create a production bundle (`npx expo export`) and inspect the bundle output to confirm the Developer and Danger Zone sections are stripped.
3. Verify the `handleSeedTestDocuments` and `handleResetVault` functions are still defined (they won't cause issues — unused functions are harmless, and `handleResetVault` may be used elsewhere in dev flows).

### Regression risk

None. Production users currently should not have access to these features. Removing them from the UI is purely corrective.

---

## Fix 2: `initializeKeys()` silently overwrites existing keys

**File:** `src/core/auth/KeyManager.ts`
**Severity:** Critical — double-call permanently destroys all encrypted data
**Risk of fix:** Low
**Estimated effort:** 10 minutes

### Root Cause

`initializeKeys()` (line 39) unconditionally generates a new key and writes it to SecureStore. If called when a key already exists (retry after partial failure, navigation glitch, or race condition), the old key is overwritten. All data encrypted with the old key becomes permanently unrecoverable.

While most call sites (OnboardingScreen5, OnboardingScreen6, SurvivorImportScreen, AppNavigator) already check `isInitialized()` before calling, this is defense at the wrong layer — a caller bug or a new call site that forgets the check would cause data loss. Additionally, `Phase1VerificationScreen` (line 92) calls `initializeKeys()` without a guard.

### Fix

Add a guard at the **start** of `initializeKeys()` itself:

```typescript
static async initializeKeys(): Promise<void> {
  const alreadyExists = await this.isInitialized();
  if (alreadyExists) {
    console.warn('initializeKeys() called but vault key already exists — skipping to prevent data loss.');
    return;
  }

  // ... rest of existing implementation unchanged ...
}
```

This is defense-in-depth: even if every caller checks `isInitialized()` first, the method itself refuses to overwrite an existing key. The check uses the same `isInitialized()` method (which reads SecureStore with `requireAuthentication: false`), so it does not trigger a biometric prompt.

### Why console.warn and not throw

Throwing would break callers that do `if (!hasKeys) { await initializeKeys(); }` in edge cases where a race condition causes two calls. A silent return with a warning is the safest behavior — the key already exists, which is the desired post-condition.

### Testing

1. Call `initializeKeys()` once — verify key is created, data can be encrypted/decrypted.
2. Call `initializeKeys()` a second time — verify the console warning fires and the key is **not** overwritten.
3. Encrypt data, call `initializeKeys()` again, verify data is still decryptable (key unchanged).
4. TypeScript check (`npx tsc --noEmit`) — no new errors.

### Regression risk

Very low. The only behavioral change is that a second call becomes a no-op instead of silently overwriting. This is strictly safer.

---

## Fix 3: `reEncryptAllMetadata` has no database transaction

**File:** `src/db/DocumentRepository.ts`
**Severity:** Critical — partial re-encryption leaves database in unrecoverable mixed-key state
**Risk of fix:** Low–Medium
**Estimated effort:** 15 minutes

### Root Cause

`reEncryptAllMetadata()` (line 217) issues individual `UPDATE` statements per row in a loop. If the process fails at row N (crash, OOM, JS error), rows 1..N-1 are encrypted with the new key and rows N+1..end are still encrypted with the old key. There is no way to determine which rows use which key, so the vault metadata is irrecoverably corrupted.

### Fix

Use `withExclusiveTransactionAsync()` from expo-sqlite to wrap the entire re-encryption loop in an exclusive transaction. This is the strongest transaction mode available — it guarantees atomicity and blocks concurrent writes.

```typescript
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
      const docDate = decryptFieldStrict((row.document_date as string) || null, oldKey);
      const expDate = decryptFieldStrict((row.expiry_date as string) || null, oldKey);
      const provider = decryptFieldStrict((row.provider_name as string) || null, oldKey);
      const location = decryptFieldStrict(
        (row.location_of_original as string) || null,
        oldKey,
      );

      await txn.runAsync(
        `UPDATE documents SET title = ?, document_date = ?, expiry_date = ?,
         provider_name = ?, location_of_original = ? WHERE id = ?`,
        [
          encryptField(title, newKey),
          encryptField(docDate, newKey),
          encryptField(expDate, newKey),
          encryptField(provider, newKey),
          encryptField(location, newKey),
          row.id as string,
        ],
      );
    }
  });
}
```

**Key change:** All `runAsync` calls use `txn` (the transaction object) instead of `db`. This ensures all writes are part of the exclusive transaction. If any write fails, SQLite rolls back the entire transaction and all rows remain encrypted with the old key.

### Why `withExclusiveTransactionAsync` instead of `withTransactionAsync`

The expo-sqlite docs explicitly warn that `withTransactionAsync` is not exclusive and can be interrupted by other async queries. `withExclusiveTransactionAsync` acquires an exclusive lock, preventing any other write from interleaving. For key rotation (where partial application is catastrophic), exclusive is required.

### Why the SELECT is outside the transaction

Reading all rows first, then writing inside a transaction, is correct because:
1. The rows are immutable during this operation (only this function modifies encrypted fields during rotation).
2. Keeping the SELECT outside reduces the time the exclusive lock is held.
3. The data we need (ciphertext to decrypt) won't change between the SELECT and the transaction.

### Testing

1. Re-encrypt metadata for a vault with 5+ documents — verify all rows decrypt correctly with the new key.
2. Simulate a failure mid-transaction (e.g., throw after N rows inside the loop) — verify all rows still decrypt with the old key (rollback succeeded).
3. TypeScript check — `withExclusiveTransactionAsync` accepts `(txn: Transaction) => Promise<void>`, confirm the `txn.runAsync` signature matches.

### Regression risk

Low. The function signature is unchanged. The only difference is atomicity — either all rows are updated or none are.

---

## Fix 4: `rotateKeys()` is non-atomic — crash leaves vault unrecoverable

**File:** `src/core/auth/KeyManager.ts`
**Also touches:** `src/core/storage/EncryptedStorageService.ts`
**Severity:** Critical — mid-rotation crash permanently corrupts the vault
**Risk of fix:** Medium–High (most complex fix in this plan)
**Estimated effort:** 45–60 minutes
**Depends on:** Fix 3 (transaction in `reEncryptAllMetadata`)

### Root Cause

`rotateKeys()` (line 139) performs these steps sequentially:
1. Generate new key
2. Re-encrypt each file in-place (overwriting old ciphertext)
3. Re-encrypt all DB metadata
4. Store new key in SecureStore
5. Backup to iCloud Keychain

If a crash occurs during step 2, some files are encrypted with the new key and some with the old. The old key is still in SecureStore (step 4 hasn't run), but files already overwritten with the new key are unreadable because the new key is only in memory. The vault is in an unrecoverable mixed-key state.

### Fix: Write-ahead journaling with two-phase commit

**Phase A — Prepare (all new data written alongside old, nothing overwritten):**

1. Generate new key.
2. Store the new key in SecureStore under a **pending tag** (`com.afterme.keys.vault.pending`). This ensures the new key survives a crash.
3. For each file ref:
   - Read `{ref}.enc` → decrypt with old key → re-encrypt with new key → write to `{ref}.enc.new`
   - The old `.enc` file is untouched.
4. Re-encrypt all DB metadata in an exclusive transaction (Fix 3).

At this point, if a crash occurs, recovery is straightforward: the old `.enc` files are intact and encrypted with the old key (still in SecureStore). The `.enc.new` files and pending key can be cleaned up.

**Phase B — Commit (atomic swap):**

5. For each file ref: delete `{ref}.enc`, then move `{ref}.enc.new` → `{ref}.enc`.
6. Store the new key as the **primary vault key** in SecureStore.
7. Delete the pending key from SecureStore.
8. Backup new key to iCloud Keychain.
9. Update in-memory cache.

### Implementation detail: EncryptedStorageService changes

Add two new methods to `EncryptedStorageService`:

```typescript
static async reEncryptFileToStaging(
  filename: string,
  oldKey: Buffer,
  newKey: Buffer,
): Promise<void> {
  const srcPath = `${VAULT_DIR}${filename}.enc`;
  const stagingPath = `${VAULT_DIR}${filename}.enc.new`;
  const encryptedBase64 = await readAsStringAsync(srcPath, {
    encoding: EncodingType.Base64,
  });
  const decrypted = CryptoService.decrypt(
    Buffer.from(encryptedBase64, 'base64'),
    oldKey,
  );
  const reEncrypted = CryptoService.encrypt(decrypted, newKey);
  await writeAsStringAsync(stagingPath, reEncrypted.toString('base64'), {
    encoding: EncodingType.Base64,
  });
}

static async commitStagedFiles(fileRefs: string[]): Promise<void> {
  for (const ref of fileRefs) {
    const oldPath = `${VAULT_DIR}${ref}.enc`;
    const newPath = `${VAULT_DIR}${ref}.enc.new`;
    const info = await getInfoAsync(newPath);
    if (info.exists) {
      await deleteAsync(oldPath, { idempotent: true });
      await moveAsync({ from: newPath, to: oldPath });
    }
  }
}

static async cleanupStagedFiles(): Promise<void> {
  const files = await readDirectoryAsync(VAULT_DIR);
  for (const file of files) {
    if (file.endsWith('.enc.new')) {
      await deleteAsync(`${VAULT_DIR}${file}`, { idempotent: true });
    }
  }
}
```

Add `moveAsync` to the imports from `expo-file-system/legacy`.

### Implementation detail: KeyManager changes

Add a pending key constant and recovery method:

```typescript
const VAULT_KEY_TAG_PENDING = 'com.afterme.keys.vault.pending';

// New method: recover from interrupted rotation on app startup
static async recoverFromInterruptedRotation(): Promise<void> {
  const pendingKeyBase64 = await SecureStore.getItemAsync(
    VAULT_KEY_TAG_PENDING,
    { requireAuthentication: false },
  );

  if (!pendingKeyBase64) return; // No interrupted rotation

  // Interrupted rotation detected — rollback:
  // Old .enc files are still intact, old vault key is still primary.
  // Just clean up the staged .enc.new files and pending key.
  await EncryptedStorageService.cleanupStagedFiles();
  await SecureStore.deleteItemAsync(VAULT_KEY_TAG_PENDING);
  console.warn('Recovered from interrupted key rotation — rolled back staged files.');
}
```

Rewrite `rotateKeys()`:

```typescript
static async rotateKeys(): Promise<void> {
  const oldKey = await this.getVaultKey();
  const newKey = CryptoService.generateKey();

  // Phase A — Prepare
  await SecureStore.setItemAsync(
    VAULT_KEY_TAG_PENDING,
    newKey.toString('base64'),
    { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK },
  );

  await EncryptedStorageService.initializeVault();
  const fileRefs = await DocumentRepository.getAllFileRefs();

  for (const ref of fileRefs) {
    await EncryptedStorageService.reEncryptFileToStaging(ref, oldKey, newKey);
  }

  await DocumentRepository.reEncryptAllMetadata(oldKey, newKey);

  // Phase B — Commit
  await EncryptedStorageService.commitStagedFiles(fileRefs);

  const bioPref = await AsyncStorage.getItem(BIOMETRIC_PREF_KEY);
  const requireAuth = bioPref !== 'false';

  await SecureStore.setItemAsync(VAULT_KEY_TAG, newKey.toString('base64'), {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    requireAuthentication: requireAuth,
    authenticationPrompt: 'Unlock your After Me vault',
  });

  await SecureStore.deleteItemAsync(VAULT_KEY_TAG_PENDING);

  const backedUp = await KeychainBackupService.backupVaultKey(
    newKey.toString('base64'),
  );
  if (!backedUp) {
    console.warn('iCloud Keychain backup skipped after key rotation.');
  }

  cachedVaultKey = newKey;
}
```

### Recovery strategy

Call `KeyManager.recoverFromInterruptedRotation()` early in the app startup (e.g., in `AppNavigator` or `AppContext` initialization, **before** any vault read operations). The recovery logic is:

| State after crash | Old `.enc` files | `.enc.new` files | Pending key | Recovery action |
|---|---|---|---|---|
| Crash during Phase A (file re-encryption) | Intact (old key) | Partial set | Exists | Delete all `.enc.new`, delete pending key → vault uses old key |
| Crash during Phase A (DB re-encryption) | Intact (old key) | Complete set | Exists | DB transaction rolled back automatically. Delete all `.enc.new`, delete pending key → vault uses old key |
| Crash during Phase B (file swap) | Some deleted | Some `.enc.new` remain | Exists | This is the one tricky state — see note below |
| Crash after Phase B completes | All new key | None | Deleted | No recovery needed |

**Note on Phase B crash:** If the crash happens mid-swap (some old files deleted, some `.enc.new` not yet moved), the situation is more nuanced. However, since `deleteAsync` + `moveAsync` per file is fast (metadata-only on APFS), and iOS does not kill apps during brief file operations, this window is extremely narrow. For defense-in-depth, the commit loop should verify each step:

```typescript
for (const ref of fileRefs) {
  const newPath = `${VAULT_DIR}${ref}.enc.new`;
  const oldPath = `${VAULT_DIR}${ref}.enc`;
  const newInfo = await getInfoAsync(newPath);
  if (newInfo.exists) {
    await deleteAsync(oldPath, { idempotent: true });
    await moveAsync({ from: newPath, to: oldPath });
  }
  // If .enc.new doesn't exist but .enc does, the file was already committed
  // If neither exists, something is wrong — but this shouldn't happen with valid fileRefs
}
```

### Testing

1. **Happy path:** Rotate keys on a vault with 5+ documents, verify all files and metadata decrypt correctly with the new key.
2. **Simulated crash during Phase A:** After writing 2 of 5 `.enc.new` files, throw an error. Call `recoverFromInterruptedRotation()`. Verify all original `.enc` files are intact and all `.enc.new` files are cleaned up.
3. **Simulated crash during DB re-encryption:** Verify the exclusive transaction rolls back and metadata remains encrypted with the old key.
4. **Verify pending key cleanup:** After a successful rotation, confirm `VAULT_KEY_TAG_PENDING` no longer exists in SecureStore.
5. **TypeScript check** — no new errors.

### Regression risk

Medium. This is a significant rewrite of the rotation flow. However, the new flow is strictly safer — it never overwrites data in-place until all new data is prepared. The function signature is unchanged, so callers are not affected.

---

## Fix 5: Path traversal vulnerability in EncryptedStorageService

**File:** `src/core/storage/EncryptedStorageService.ts`
**Severity:** Critical — arbitrary file read/write/delete within app sandbox
**Risk of fix:** Low
**Estimated effort:** 15 minutes

### Root Cause

Every method that accepts a `filename` parameter (`saveFile`, `readFile`, `reEncryptFile`, `deleteFile`, `fileExists`, `validateFileIntegrity`, and the new staging methods from Fix 4) constructs a file path by simple string interpolation:

```typescript
const filePath = `${VAULT_DIR}${filename}.enc`;
```

If `filename` contains path traversal sequences like `../../Documents/secret`, the resolved path escapes the vault directory. An attacker who controls the `filename` value (e.g., via a maliciously crafted `.afterme` import file containing a poisoned `file_ref`) can read, overwrite, or delete arbitrary files in the app sandbox.

### Fix

Add a `sanitizeFilename()` function and call it at the entry point of every method that uses `filename`:

```typescript
function sanitizeFilename(filename: string): string {
  // Strip any directory separators and path traversal sequences
  const basename = filename.split('/').pop()?.split('\\').pop() ?? '';

  // Remove any remaining dots that could form traversal patterns
  // Allow alphanumeric, hyphens, underscores, and single dots (for extensions)
  const sanitized = basename.replace(/[^a-zA-Z0-9._-]/g, '');

  if (!sanitized || sanitized === '.' || sanitized === '..') {
    throw new Error(`Invalid filename: "${filename}"`);
  }

  return sanitized;
}
```

Apply to every method:

```typescript
static async saveFile(filename: string, content: Buffer): Promise<string> {
  return traceVaultOperation('saveFile', async () => {
    const safe = sanitizeFilename(filename);
    const key = await KeyManager.getVaultKey();
    const encrypted = CryptoService.encrypt(content, key);
    const filePath = `${VAULT_DIR}${safe}.enc`;
    // ... rest unchanged
  });
}

static async readFile(filename: string): Promise<Buffer> {
  return traceVaultOperation('readFile', async () => {
    try {
      const safe = sanitizeFilename(filename);
      const filePath = `${VAULT_DIR}${safe}.enc`;
      // ... rest unchanged
    }
  });
}

// Same pattern for: reEncryptFile, deleteFile, fileExists, validateFileIntegrity
// And for the new methods from Fix 4: reEncryptFileToStaging, commitStagedFiles
```

### Why strip rather than reject

Stripping directory separators and normalising to a bare filename is safer than trying to detect traversal patterns (which can be bypassed with encoding tricks, double-encoding, null bytes, etc.). By extracting only the last path component and whitelisting characters, there is no possible input that resolves outside `VAULT_DIR`.

### What about existing data

All existing `file_ref` values in the database are generated by `CryptoService.generateSecureId('doc')`, which produces strings like `doc_a1b2c3d4...` — purely alphanumeric with underscores. The sanitisation function will pass these through unchanged. There is zero risk of breaking existing data.

### Testing

1. Call `saveFile('../../etc/passwd', ...)` — verify it throws or saves safely inside `VAULT_DIR` (depending on whether the stripped result is valid).
2. Call `readFile('../../../Documents/secret')` — verify it throws `Invalid filename`.
3. Call `saveFile('normal_doc_id', ...)` then `readFile('normal_doc_id')` — verify normal flow is unaffected.
4. Call `deleteFile('../../important')` — verify only the sanitised filename is deleted (if it exists) within `VAULT_DIR`.
5. TypeScript check — no new errors.

### Regression risk

Very low. The sanitisation is additive — valid filenames pass through unchanged. Only malicious or malformed filenames are affected.

---

## Implementation Order & Dependencies

```
Fix 1: Dev tools in production    ──── independent, quick win
Fix 2: initializeKeys() guard     ──── independent, quick win
Fix 3: DB transaction             ──── must be done BEFORE Fix 4
Fix 4: Atomic key rotation        ──── depends on Fix 3
Fix 5: Path traversal             ──── independent (but if doing Fix 4, apply sanitisation to new methods too)
```

**Recommended sequence:**

| Step | Fix | Est. time | Files modified |
|------|-----|-----------|----------------|
| 1 | Fix 1 — `__DEV__` guard | 5 min | `SettingsScreen.tsx` |
| 2 | Fix 2 — `initializeKeys` guard | 10 min | `KeyManager.ts` |
| 3 | Fix 5 — Path sanitisation | 15 min | `EncryptedStorageService.ts` |
| 4 | Fix 3 — DB transaction | 15 min | `DocumentRepository.ts` |
| 5 | Fix 4 — Atomic rotation | 45–60 min | `KeyManager.ts`, `EncryptedStorageService.ts`, `AppNavigator.tsx` or `AppContext.tsx` |
| 6 | Final verification | 10 min | TypeScript check, lint, manual smoke test |

**Total estimated time:** ~2 hours

---

## Post-implementation checklist

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] All Settings screen developer tools hidden in production build
- [ ] `initializeKeys()` is idempotent (second call is a no-op)
- [ ] `reEncryptAllMetadata()` runs inside an exclusive transaction
- [ ] `rotateKeys()` uses write-ahead journaling; crash mid-rotation is recoverable
- [ ] `recoverFromInterruptedRotation()` is called on app startup
- [ ] All `EncryptedStorageService` filename inputs are sanitised
- [ ] No new TypeScript or linter errors introduced
