# HIGH Severity Fixes — Implementation Plan

**Date:** 17 March 2026
**Scope:** Issues 6–16 from `docs/code_review_findings.md`
**Implementation order:** Sequential, ordered by dependency and complexity

---

## Fix 6: `hasSafetyNet` logic is inverted for deferred users

**File:** `src/context/AppContext.tsx` (line 100)
**Risk of fix:** Low
**Estimated effort:** 5 minutes

### Root Cause

The current formula:
```typescript
const hasSafetyNet = (icloudEnabled || hasKitBeenCreated) && !safetyNetDeferred;
```

This means: if a user has iCloud enabled (`true`) but previously deferred the safety net prompt during onboarding (`safetyNetDeferred` is `true`), the result is `false`. The user actually **has** a safety net (iCloud is on), but the dashboard shows "No safety net yet."

The `safetyNetDeferred` flag records that the user **chose to skip** the safety net during onboarding. It should not negate the fact that they later enabled iCloud or created a kit.

### Fix

Remove the `!safetyNetDeferred` condition. `hasSafetyNet` should be purely factual — does a safety net actually exist?

```typescript
// BEFORE:
const hasSafetyNet = (icloudEnabled || hasKitBeenCreated) && !safetyNetDeferred;

// AFTER:
const hasSafetyNet = icloudEnabled || hasKitBeenCreated;
```

The `safetyNetDeferred` flag is still stored and exposed via AppContext (for the dashboard to show a "set up your safety net" nudge when **neither** backup exists and the user previously deferred). It just no longer suppresses a truthful `hasSafetyNet`.

### Testing

1. Enable iCloud backup, then confirm `hasSafetyNet` is `true` regardless of `safetyNetDeferred`.
2. Create a Family Kit without enabling iCloud — confirm `hasSafetyNet` is `true`.
3. Defer during onboarding with no backup — confirm `hasSafetyNet` is `false` and dashboard shows the nudge.

---

## Fix 7: Placeholder TestFlight URL shipped

**File:** `src/features/settings/SettingsScreen.tsx` (line 772)
**Risk of fix:** Low
**Estimated effort:** 5 minutes

### Root Cause

The TestFlight invite button uses a hardcoded placeholder:
```typescript
Linking.openURL('https://testflight.apple.com/join/REPLACE_WITH_LINK');
```

This was never replaced with a real TestFlight link, so users get a 404.

### Fix

Hide the button entirely until a real TestFlight link is configured. Use a constant that can be checked:

```typescript
const TESTFLIGHT_URL: string | null = null; // Set to real URL when available
```

Then conditionally render the button only when the URL exists:

```tsx
{Platform.OS === 'ios' && TESTFLIGHT_URL && (
  <TouchableOpacity
    style={styles.devRow}
    onPress={() => {
      Linking.openURL(TESTFLIGHT_URL);
    }}
    ...
  >
    ...
  </TouchableOpacity>
)}
```

This prevents a dead link while making it trivial to re-enable later by setting the constant.

### Testing

1. Verify the "Invite Beta Testers" button is not visible.
2. Set `TESTFLIGHT_URL = 'https://example.com'` → verify the button appears and opens the URL.

---

## Fix 8: Encrypted `expiry_date` makes database index useless

**File:** `src/db/DocumentRepository.ts`
**Also touches:** `src/db/schema.ts` (informational — the index `idx_documents_expiry` exists)
**Risk of fix:** Medium (data migration concern for existing encrypted rows)
**Estimated effort:** 25 minutes

### Root Cause

The code comment at line 18-21 says:

> Sensitive fields are encrypted at rest. **Structural/queryable fields (id, category, format, dates for expiry alerts) stay plaintext** so we can filter and index.

But in practice, `expiry_date`, `document_date`, and `provider_name` are all encrypted via `encryptField()` in `insertDocument` and `updateDocument`. The `idx_documents_expiry` index in `schema.ts` is useless on encrypted ciphertext — it cannot support range queries or sorting.

The design intent was clearly that dates should stay plaintext for querying. The only fields that genuinely need encryption are `title`, `provider_name`, and `location_of_original` (personally identifying text). Dates are structural data (ISO-8601 strings) that don't leak personal information.

### Fix

**Stop encrypting `expiry_date` and `document_date`.** Keep `provider_name` and `location_of_original` encrypted since they contain personal names/addresses.

In `insertDocument`:
```typescript
// BEFORE:
encryptField(doc.documentDate ?? null, key),
encryptField(doc.expiryDate ?? null, key),
encryptField(doc.providerName ?? null, key),

// AFTER:
doc.documentDate ?? null,                    // plaintext — structural, for querying/sorting
doc.expiryDate ?? null,                      // plaintext — structural, for idx_documents_expiry
encryptField(doc.providerName ?? null, key), // encrypted — contains personal name
```

In `updateDocument`:
```typescript
// BEFORE:
if (updates.documentDate !== undefined) {
  fields.push('document_date = ?');
  values.push(encryptField(updates.documentDate, key));
}
if (updates.expiryDate !== undefined) {
  fields.push('expiry_date = ?');
  values.push(encryptField(updates.expiryDate, key));
}

// AFTER:
if (updates.documentDate !== undefined) {
  fields.push('document_date = ?');
  values.push(updates.documentDate);            // plaintext
}
if (updates.expiryDate !== undefined) {
  fields.push('expiry_date = ?');
  values.push(updates.expiryDate);              // plaintext
}
```

In `rowToDocument`:
```typescript
// BEFORE:
documentDate: decryptField((row.document_date as string) || null, key),
expiryDate: decryptField((row.expiry_date as string) || null, key),

// AFTER:
documentDate: (row.document_date as string) || null,   // plaintext — no decrypt needed
expiryDate: (row.expiry_date as string) || null,       // plaintext — no decrypt needed
```

In `reEncryptAllMetadata` — stop re-encrypting dates:
```typescript
// BEFORE:
const docDate = decryptFieldStrict((row.document_date as string) || null, oldKey);
const expDate = decryptFieldStrict((row.expiry_date as string) || null, oldKey);
// ...
await txn.runAsync(
  `UPDATE documents SET title = ?, document_date = ?, expiry_date = ?,
   provider_name = ?, location_of_original = ? WHERE id = ?`,
  [encryptField(title, newKey), encryptField(docDate, newKey), encryptField(expDate, newKey), ...]
);

// AFTER — only re-encrypt title, provider_name, location_of_original:
await txn.runAsync(
  `UPDATE documents SET title = ?,
   provider_name = ?, location_of_original = ? WHERE id = ?`,
  [encryptField(title, newKey), encryptField(provider, newKey), encryptField(location, newKey), row.id as string]
);
```

### Migration for existing encrypted date rows

Existing rows have encrypted dates. Add a one-time migration that decrypts them:

In `reEncryptAllMetadata` or as a separate migration step: for any row where `document_date` or `expiry_date` appears to be ciphertext (starts with the AES-GCM prefix — base64 encoded, longer than a typical ISO date string of ~24 chars), attempt to decrypt it and write it back as plaintext. Use `decryptField()` (the lenient version) which returns the raw value if decryption fails — this naturally handles rows that are already plaintext.

A simpler approach: add a schema migration (version 2) that runs once:

```typescript
{
  version: 2,
  sql: [], // No schema DDL changes — handled in code
}
```

And add a post-migration code step that reads all rows, attempts to decrypt the date fields with the vault key, and writes them back as plaintext. This should run once after the app updates.

### Testing

1. Insert a new document with `expiryDate` set → verify `expiry_date` column is plaintext in SQLite.
2. Query `SELECT * FROM documents WHERE expiry_date < '2026-06-01'` → verify it returns expected rows.
3. Existing documents with encrypted dates → verify they are migrated to plaintext on first launch.
4. `AppContext.refreshDocuments()` → `expiringSoonCount` is correct.

---

## Fix 9: `OnboardingStorage.setIcloudBackupEnabled` never called during onboarding

**File:** `src/features/onboarding/OnboardingScreen6.tsx` (line 174–175)
**Risk of fix:** Low
**Estimated effort:** 5 minutes

### Root Cause

When the user chooses iCloud backup during onboarding, only `BackupService.enableIcloudBackup()` is called. Looking at `BackupService.enableIcloudBackup()`:

```typescript
async enableIcloudBackup(): Promise<void> {
  await OnboardingStorage.setIcloudBackupEnabled(true);
  await CloudBackupService.setAutoBackupEnabled(true);
  // ...
}
```

Wait — `BackupService.enableIcloudBackup()` **does** call `OnboardingStorage.setIcloudBackupEnabled(true)` on line 10. Let me re-examine.

**Re-examination:** The `BackupService.enableIcloudBackup()` already calls `OnboardingStorage.setIcloudBackupEnabled(true)`. Additionally, `CloudBackupService.setAutoBackupEnabled(true)` also calls `OnboardingStorage.setIcloudBackupEnabled(enabled)`. So the flag IS being set.

**However**, the issue is timing. In `AppContext.refreshInit()`, `BackupService.isIcloudBackupEnabled()` is called during startup. If the onboarding just completed and the app state hasn't refreshed yet, the first read could return `false`. But `refreshInit` is called again after onboarding completes (via `onComplete` → `refreshInit`).

**Actual issue:** On closer inspection, the real problem is that `refreshInit` doesn't re-run after onboarding completes in `OnboardingScreen6`. The `onComplete` callback navigates away, but `refreshInit` may not be called. The iCloud enabled state is set correctly in AsyncStorage, but `AppContext` doesn't pick it up until the next app launch.

### Fix

After `BackupService.enableIcloudBackup()` completes in the `completeOnboarding` function, the `onComplete` callback should trigger a `refreshInit` to pick up the new iCloud state. This is actually handled by the navigation flow — when onboarding completes, the AppNavigator re-renders and `AppContext` refreshes.

**However**, to be defensive, explicitly call `OnboardingStorage.setIcloudBackupEnabled(true)` before `BackupService.enableIcloudBackup()` in `OnboardingScreen6` so the flag is guaranteed to be set even if the backup service call fails partway:

```typescript
if (choice === 'icloud') {
  await OnboardingStorage.setIcloudBackupEnabled(true);
  await BackupService.enableIcloudBackup();
}
```

This is belt-and-suspenders — the flag is set first, then the backup service does its work. If `BackupService.enableIcloudBackup()` throws after setting the flag, the flag is still set (which is the correct state — the user chose iCloud).

### Testing

1. Complete onboarding with "iCloud Backup" choice → verify `isIcloudBackupEnabled()` returns `true`.
2. Verify `AppContext.hasSafetyNet` is `true` after onboarding.
3. Restart app → confirm `hasSafetyNet` is still `true`.

---

## Fix 10: Deleting the active vault has no fallback

**File:** `src/features/vault/VaultSwitcherScreen.tsx` (lines 110–117)
**Also relevant:** `src/services/VaultManager.ts` (line 142–145)
**Risk of fix:** Low
**Estimated effort:** 5 minutes

### Root Cause

Looking at `VaultManager.deleteVault()`:

```typescript
const activeId = await this.getActiveVaultId();
if (activeId === vaultId) {
  await AsyncStorage.setItem(ACTIVE_VAULT_KEY, DEFAULT_VAULT_ID);
}
```

The `VaultManager` **already handles** switching to the default vault when the active vault is deleted. So the manager layer is correct.

**The actual issue** is in `VaultSwitcherScreen.handleDelete`:

```typescript
onPress: async () => {
  try {
    await VaultManager.deleteVault(vault.id);
    loadVaults();       // refreshes the vault list
    onVaultChanged?.();  // notifies parent
  } catch (err) { ... }
},
```

After `deleteVault`, `loadVaults()` is called which re-reads `getActiveVaultId()` — this will now be `DEFAULT_VAULT_ID`. The local `setActiveVaultId` in `loadVaults` is also updated. And `onVaultChanged?.()` notifies the parent to refresh.

**On closer inspection**, the fallback works correctly in `VaultManager` but the UI state in `VaultSwitcherScreen` may be stale for a brief moment because `loadVaults()` is async. The `onVaultChanged` callback is also important for the rest of the app to re-load data for the default vault.

**Remaining gap:** If `onVaultChanged` is not provided (it's optional), the rest of the app keeps reading from the deleted vault until the next refresh cycle. The fix should ensure `onVaultChanged` is always called after deletion, and the `handleDelete` callback should await `loadVaults()`:

### Fix

The `VaultManager.deleteVault()` already falls back to `DEFAULT_VAULT_ID`. But in `VaultSwitcherScreen`, after deleting, we should update local state immediately rather than relying solely on the async `loadVaults`:

```typescript
onPress: async () => {
  try {
    await VaultManager.deleteVault(vault.id);
    setActiveVaultId(DEFAULT_VAULT_ID); // immediate UI update
    await loadVaults();
    onVaultChanged?.();
  } catch (err) {
    Alert.alert('Error', (err as Error).message);
  }
},
```

This ensures the UI immediately reflects the fallback before the full reload completes.

### Testing

1. Create a second vault, switch to it (make it active), then delete it → verify active vault switches to "My Vault" (default).
2. Verify the vault list updates immediately.
3. Verify document library shows documents from the default vault after deletion.

---

## Fix 11: Family Kit import drops metadata

**File:** `src/services/FamilyKitService.ts` (lines 87–92)
**Risk of fix:** Low
**Estimated effort:** 10 minutes

### Root Cause

The export in `FamilyKitExportService` includes these fields per document:
```typescript
document_date: doc.documentDate,
expiry_date: doc.expiryDate,
provider_name: doc.providerName,
```

But the import in `FamilyKitService.importFamilyKit()` ignores them:
```typescript
await DocumentRepository.insertDocument({
  category: toCategory(doc.category),
  title: doc.title ?? 'Imported Document',
  fileRef,
  format,
  // document_date, expiry_date, provider_name are all missing
});
```

The `DocumentInsert` type has optional fields `documentDate`, `expiryDate`, and `providerName`, but the import never passes them. Imported documents lose their dates and provider info — silent data loss.

### Fix

Map the export fields to the insert:

```typescript
await DocumentRepository.insertDocument({
  category: toCategory(doc.category),
  title: doc.title ?? 'Imported Document',
  fileRef,
  format,
  documentDate: (doc as Record<string, unknown>).document_date as string | undefined ?? null,
  expiryDate: (doc as Record<string, unknown>).expiry_date as string | undefined ?? null,
  providerName: (doc as Record<string, unknown>).provider_name as string | undefined ?? null,
});
```

Better: update the `AfterMeDocument` interface to include the optional fields that the export produces:

```typescript
interface AfterMeDocument {
  id?: string;
  category: string;
  title: string;
  file_data: string;
  mime_type?: string;
  created_at?: string;
  document_date?: string | null;
  expiry_date?: string | null;
  provider_name?: string | null;
}
```

Then the import becomes:

```typescript
await DocumentRepository.insertDocument({
  category: toCategory(doc.category),
  title: doc.title ?? 'Imported Document',
  fileRef,
  format,
  documentDate: doc.document_date ?? null,
  expiryDate: doc.expiry_date ?? null,
  providerName: doc.provider_name ?? null,
});
```

### Testing

1. Export a Family Kit with documents that have `documentDate`, `expiryDate`, and `providerName` set.
2. Import the kit → verify all three fields are present in the imported documents.
3. Import a kit from an older version (without these fields) → verify import succeeds with `null` values.

---

## Fix 12: No vault capacity check on Family Kit import

**File:** `src/services/FamilyKitService.ts`
**Risk of fix:** Low
**Estimated effort:** 10 minutes

### Root Cause

`DocumentService.importFromFilePath` calls `assertVaultCapacity(size)` before saving a file. But `FamilyKitService.importFamilyKit()` writes directly to `EncryptedStorageService.saveFile()` without any capacity check. Importing a large kit could exceed the storage cap silently.

### Fix

Import the `assertVaultCapacity` pattern into the Family Kit import. Before writing files, calculate the total incoming size and check against the cap.

```typescript
import { EncryptedStorageService } from '../core/storage/EncryptedStorageService';
import { VAULT_STORAGE_CAP_PERSONAL_BYTES } from '../constants/storage';

// Inside importFamilyKit, after parsing the vault but before writing files:
const totalIncomingBytes = vault.documents.reduce(
  (sum, doc) => sum + Buffer.byteLength(doc.file_data, 'base64'),
  0,
);

const currentVaultSize = await EncryptedStorageService.getVaultSizeBytes();
if (currentVaultSize + totalIncomingBytes > VAULT_STORAGE_CAP_PERSONAL_BYTES) {
  const usedMB = Math.round(currentVaultSize / 1024 / 1024);
  const incomingMB = Math.round(totalIncomingBytes / 1024 / 1024);
  const capGB = VAULT_STORAGE_CAP_PERSONAL_BYTES / 1024 / 1024 / 1024;
  throw new Error(
    `This kit (${incomingMB}MB) would exceed the vault storage limit ` +
    `(${usedMB}MB used of ${capGB}GB). Free space by deleting documents first.`
  );
}
```

### Testing

1. Import a kit within capacity → succeeds normally.
2. Import a kit that would exceed the cap → verify a clear error message is shown (caught by `SurvivorImportScreen`).

---

## Fix 13: Migration recovery copies over an open database

**File:** `src/db/migrations.ts` (lines 53–83, called from line 115)
**Risk of fix:** Medium
**Estimated effort:** 15 minutes

### Root Cause

`runMigrations(db)` is called from `getDb()` after `openDatabaseAsync()`. Inside `runMigrations`, line 115 immediately calls `checkAndRecoverMigrationFailure()` which, on line 75, does:

```typescript
await copyAsync({ from: backupPath, to: dbPath });
```

This copies a backup file over the database file while the `db` handle is already open. Copying over an open SQLite database can corrupt WAL journals or cause the open handle to read stale/inconsistent data.

### Fix

Move the recovery check to run **before** the database is opened. In `DocumentRepository.ts`, the `getDb()` function should call recovery first:

```typescript
async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;

  // Recovery must happen BEFORE opening the database
  await checkAndRecoverMigrationFailure();

  dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
  await runMigrations(dbInstance);
  return dbInstance;
}
```

And remove the `checkAndRecoverMigrationFailure()` call from inside `runMigrations`:

```typescript
export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  // Recovery moved to getDb() — runs before database is opened
  const versionResult = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  // ... rest unchanged
}
```

Export `checkAndRecoverMigrationFailure` from `migrations.ts` so `DocumentRepository` can import it.

### Testing

1. Simulate a failed migration (create the lock file with a valid backup path) → launch the app → verify the database is restored from backup before being opened.
2. Normal launch without a lock file → verify no change in behavior.
3. Verify the migration lock file is cleaned up after recovery.

---

## Fix 14: No manual key entry fallback in Survivor flow

**File:** `src/features/survivor/SurvivorImportScreen.tsx`
**Risk of fix:** Low
**Estimated effort:** 20 minutes

### Root Cause

If the QR code is damaged, smudged, or the camera cannot focus, the survivor has no way to manually type the access key. For a bereaved family member, this is a critical dead end — the printed Family Kit may be their only way in.

### Fix

Add a "Type Key Manually" link below the QR scanner that transitions to a text input screen. The access key is a 48-character string, so a multi-line or scrollable text input works.

In the QR scanner step, add a link:

```tsx
// Below the scan hint text:
<Pressable
  style={styles.manualEntryLink}
  onPress={() => setStep('manualEntry')}
  accessibilityRole="button"
  accessibilityLabel="Enter key manually instead of scanning"
>
  <Text style={styles.manualEntryText}>
    QR code damaged? Enter key manually
  </Text>
</Pressable>
```

Add a new step `'manualEntry'` to the `Step` type:

```typescript
type Step = 'welcome' | 'scan' | 'manualEntry' | 'selectFile' | 'importing' | 'vaultIntro';
```

Add a new `manualEntry` screen:

```tsx
if (step === 'manualEntry') {
  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <BackButton top={insets.top + 12} />
      <ScrollView contentContainerStyle={styles.selectContent}>
        <Text style={styles.selectTitle}>Enter Access Key</Text>
        <Text style={styles.selectBody}>
          Type or paste the access key from your printed Family Kit.
          It's the long text string below the QR code.
        </Text>
        <TextInput
          style={styles.manualKeyInput}
          value={manualKey}
          onChangeText={setManualKey}
          placeholder="Paste or type access key here…"
          placeholderTextColor={colors.textMuted}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          maxFontSizeMultiplier={1.4}
        />
        <Pressable
          style={[styles.continueButton, !manualKey.trim() && { opacity: 0.5 }]}
          onPress={() => {
            if (manualKey.trim()) {
              setAccessKey(manualKey.trim());
              setStep('selectFile');
            }
          }}
          disabled={!manualKey.trim()}
          accessibilityRole="button"
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </Pressable>
        <Pressable
          style={styles.linkButton}
          onPress={() => { setManualKey(''); setStep('scan'); }}
          accessibilityRole="button"
        >
          <Text style={styles.linkText}>Try scanning instead</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
```

Add state: `const [manualKey, setManualKey] = useState('');`

Add styles for the text input:
```typescript
manualKeyInput: {
  backgroundColor: colors.amCard,
  borderRadius: 12,
  padding: 16,
  fontSize: 15,
  color: colors.amWhite,
  minHeight: 100,
  textAlignVertical: 'top',
  alignSelf: 'stretch',
  marginBottom: 20,
  fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
},
manualEntryLink: {
  marginTop: 20,
  padding: 12,
  minHeight: 44,
},
manualEntryText: {
  fontSize: 14,
  color: colors.textMuted,
  textDecorationLine: 'underline',
},
```

### Testing

1. On the QR scan screen, tap "QR code damaged? Enter key manually" → verify the manual entry screen appears.
2. Paste a valid access key, select the .afterme file → verify import succeeds.
3. Enter an invalid key → verify the error is caught and displayed on the selectFile step.
4. Navigate between scan and manual entry → verify state is preserved correctly.

---

## Fix 15: Memory pressure — entire vault loaded into memory

**Files:** `src/services/FamilyKitExportService.ts`, `src/services/CloudBackupService.ts`, `src/services/PersonalRecoveryKitService.ts`
**Risk of fix:** Medium–High (significant architectural change)
**Estimated effort:** 60–90 minutes

### Root Cause

All three services build a single JSON object containing every document's file data as base64 in memory:

```typescript
for (const doc of docs) {
  const content = await EncryptedStorageService.readFile(doc.fileRef);
  vaultPayload.documents.push({
    file_data: content.toString('base64'),
    // ...
  });
}
const vaultJson = Buffer.from(JSON.stringify(vaultPayload), 'utf8');
```

For a vault with 20 documents at 5MB each: `20 × 5MB × 1.33 (base64 overhead)` = ~133MB of base64 strings, plus the JSON structure, plus the Buffer copy, plus encryption overhead. Peak memory can easily exceed 400MB, causing iOS to terminate the app.

### Fix: Stream documents one at a time into the ZIP

Instead of building a single JSON blob with all file data, add each document's file as a separate entry in the ZIP. This means only one file's content is in memory at a time.

**New ZIP structure:**
```
README.txt
manifest.json
key.enc
vault-meta.enc          (encrypted JSON with document metadata only — no file_data)
files/
  doc_abc123.enc        (encrypted raw file — one per document)
  doc_def456.enc
  ...
```

**However**, this changes the .afterme format, which would break backward compatibility with existing kits and the decoder.

### Alternative fix: Process one document at a time, streaming into the vault JSON

Since changing the format is a bigger decision, a pragmatic fix is to reduce peak memory by:

1. **Write the vault JSON to a temp file incrementally** instead of building it all in memory.
2. **Process one document at a time**, writing each to the temp file, then release the buffer.
3. **Encrypt the temp file as a stream** (if possible), or read it in chunks.

Unfortunately, `CryptoService.encrypt()` operates on complete buffers, and JSZip also works in-memory. A fully streaming solution would require significant changes to both the crypto layer and the ZIP generation.

### Pragmatic fix: Cap documents per operation + warn user

For the current architecture, add a document count and estimated size check before starting the export:

```typescript
const MAX_EXPORT_DOCS = 50;
const MAX_EXPORT_SIZE_BYTES = 200 * 1024 * 1024; // 200MB

if (docs.length > MAX_EXPORT_DOCS) {
  throw new Error(
    `Too many documents (${docs.length}) for a single export. ` +
    `Maximum is ${MAX_EXPORT_DOCS}. Consider splitting across multiple kits.`
  );
}
```

Additionally, **null out references as we go** to allow garbage collection:

```typescript
for (let i = 0; i < docs.length; i++) {
  const doc = docs[i];
  const content = await EncryptedStorageService.readFile(doc.fileRef);
  vaultPayload.documents.push({
    id: doc.id,
    category: CATEGORY_LABELS[doc.category],
    title: doc.title,
    file_data: content.toString('base64'),
    // ...
  });
  // Content buffer goes out of scope and can be GC'd here
}
```

And for the cloud backup:

```typescript
for (const doc of docs) {
  try {
    const fileContent = await EncryptedStorageService.readFile(doc.fileRef);
    vaultData.files[doc.fileRef] = fileContent.toString('base64');
    // fileContent goes out of scope here
  } catch {
    // skip corrupted files
  }
}
```

This is already the case in the current code (the `content` variable goes out of scope each iteration), so the real issue is the cumulative size of the `vaultPayload.documents` array itself.

**Best pragmatic fix:** Add the document count cap AND estimate total size upfront, warning before the operation starts. Apply to all three services.

### Testing

1. Export a kit with a small vault (5 docs) → verify it works as before.
2. Attempt to export with 51+ documents → verify the error message is clear.
3. Monitor memory usage during export of a moderately large vault (10 docs × 5MB).

---

## Fix 16: `ITSAppUsesNonExemptEncryption` likely incorrect

**File:** `app.json` (line 19)
**Risk of fix:** Low (configuration change)
**Estimated effort:** 5 minutes

### Root Cause

`ITSAppUsesNonExemptEncryption` is set to `false`, meaning "this app does NOT use non-exempt encryption." But the app uses AES-256-GCM extensively for vault encryption, and PBKDF2-HMAC-SHA256 for key derivation.

Under US export regulations (EAR), apps that use encryption for personal data storage (as opposed to authentication-only) typically **do** use non-exempt encryption and need an export compliance classification. Setting this to `false` may be inaccurate.

**However**, there are exemptions for "personal use" encryption in many jurisdictions, and Apple's guidance says apps that only use encryption for securing the user's own data (not for communication) may qualify for an exemption.

### Fix

Set `ITSAppUsesNonExemptEncryption` to `true` and add the compliance documentation reference:

```json
"infoPlist": {
  "NSFaceIDUsageDescription": "After Me uses Face ID to securely access your encrypted vault.",
  "ITSAppUsesNonExemptEncryption": true,
  "ITSEncryptionExportComplianceCode": ""
}
```

**Note:** The `ITSEncryptionExportComplianceCode` should be set to the code received after filing an annual self-classification report with the US Bureau of Industry and Security (BIS). If not yet filed, leave it empty and file the report before the next App Store submission.

**Alternative:** If legal review confirms that the app's encryption qualifies under the personal data storage exemption (EAR Section 740.17(b)(1)), then `false` may be correct. This needs a legal decision, not a code decision.

### Recommendation

Change to `true` for now (the safer/more honest declaration). Add a TODO comment in `app.json` referencing the need for legal review and BIS filing. This prevents Apple from flagging the app during review for making a false declaration.

### Testing

1. Verify `app.json` parses correctly.
2. Ensure the next `eas build` / `expo prebuild` picks up the change.

---

## Implementation Order & Dependencies

```
Fix 6:  hasSafetyNet logic             ──── independent
Fix 7:  TestFlight URL                  ──── independent
Fix 9:  iCloud onboarding flag          ──── independent (related to Fix 6)
Fix 10: Vault delete fallback           ──── independent
Fix 11: Kit import metadata             ──── independent
Fix 12: Kit import capacity check       ──── independent
Fix 13: Migration recovery timing       ──── independent
Fix 14: Manual key entry in survivor    ──── independent
Fix 8:  Encrypted expiry_date           ──── most complex, needs migration
Fix 15: Memory pressure cap             ──── independent
Fix 16: Encryption compliance           ──── config only, needs legal input
```

**Recommended sequence:**

| Step | Fix | Est. time | Files modified |
|------|-----|-----------|----------------|
| 1 | Fix 6 — hasSafetyNet logic | 5 min | `AppContext.tsx` |
| 2 | Fix 7 — TestFlight URL | 5 min | `SettingsScreen.tsx` |
| 3 | Fix 9 — iCloud onboarding flag | 5 min | `OnboardingScreen6.tsx` |
| 4 | Fix 10 — Vault delete fallback | 5 min | `VaultSwitcherScreen.tsx` |
| 5 | Fix 11 — Kit import metadata | 10 min | `FamilyKitService.ts` |
| 6 | Fix 12 — Kit import capacity | 10 min | `FamilyKitService.ts` |
| 7 | Fix 13 — Migration recovery | 15 min | `migrations.ts`, `DocumentRepository.ts` |
| 8 | Fix 14 — Manual key entry | 20 min | `SurvivorImportScreen.tsx` |
| 9 | Fix 8 — Encrypted dates | 25 min | `DocumentRepository.ts` |
| 10 | Fix 15 — Memory cap | 15 min | `FamilyKitExportService.ts`, `CloudBackupService.ts`, `PersonalRecoveryKitService.ts` |
| 11 | Fix 16 — Encryption compliance | 5 min | `app.json` |
| 12 | Final verification | 10 min | TypeScript check, lint |

**Total estimated time:** ~2.5 hours

---

## Post-implementation checklist

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `hasSafetyNet` is `true` when iCloud or kit exists, regardless of `safetyNetDeferred`
- [ ] TestFlight button is hidden (no dead link)
- [ ] iCloud flag is set during onboarding before navigation
- [ ] Deleting active vault immediately falls back to default
- [ ] Family Kit import preserves `document_date`, `expiry_date`, `provider_name`
- [ ] Family Kit import checks vault capacity before writing
- [ ] Migration recovery runs before database is opened
- [ ] Survivor flow has manual key entry fallback
- [ ] `expiry_date` and `document_date` stored as plaintext (index is usable)
- [ ] Existing encrypted dates migrated to plaintext on first launch
- [ ] Export/backup services cap document count to prevent OOM
- [ ] `ITSAppUsesNonExemptEncryption` set to `true`
- [ ] No new TypeScript or lint errors
