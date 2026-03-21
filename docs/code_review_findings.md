# After Me — Code Review Findings

**Date:** 17 March 2026
**Version reviewed:** 1.0.1 (app.json) / 1.0.0 (native)
**Scope:** Full codebase review — security, logic, UX, performance, configuration

---

## CRITICAL

### 1. Developer tools exposed in production
**File:** `src/features/settings/SettingsScreen.tsx`
The "Developer" section (Phase 1 Verification, Seed Test Documents) and "Danger Zone" (Reset Vault) are not gated behind `__DEV__`. Any production user can see and use these, including seeding test data or completely resetting their vault.

### 2. `rotateKeys()` is non-atomic — crash leaves vault unrecoverable
**File:** `src/core/auth/KeyManager.ts`
Key rotation iterates through all files, re-encrypting with a new key. If the process crashes mid-way, some files are encrypted with the new key and some with the old. There is no journal, rollback, or resume mechanism. The vault is left in a corrupted, mixed-key state.

### 3. `reEncryptAllMetadata` has no database transaction
**File:** `src/db/DocumentRepository.ts`
Individual `UPDATE` statements run per row without a `BEGIN TRANSACTION` / `COMMIT` wrapper. A failure at row N leaves rows 1..N-1 encrypted with the new key and the rest with the old — unrecoverable mixed-key state.

### 4. `initializeKeys()` silently overwrites existing keys
**File:** `src/core/auth/KeyManager.ts`
No guard checks whether a vault key already exists. If called twice (e.g. retry after partial failure), the old key is overwritten, rendering all previously encrypted data permanently unrecoverable.

### 5. Path traversal vulnerability in EncryptedStorageService
**File:** `src/core/storage/EncryptedStorageService.ts`
The `filename` parameter is interpolated directly into file paths with zero sanitisation. A value like `../../Documents/sensitive` resolves outside the vault directory, allowing reads/writes/deletes of arbitrary files within the app sandbox.

---

## HIGH

### 6. `hasSafetyNet` logic is inverted for deferred users
**File:** `src/context/AppContext.tsx`
The formula `(icloudEnabled || hasKitBeenCreated) && !safetyNetDeferred` means if a user has iCloud backup enabled but also deferred the safety net prompt, `hasSafetyNet` is `false`. The dashboard shows "No safety net yet" even though they actually have one.

### 7. Placeholder TestFlight URL shipped
**File:** `src/features/settings/SettingsScreen.tsx`
`'https://testflight.apple.com/join/REPLACE_WITH_LINK'` is a TODO that was never completed. Users tapping "Invite Beta Testers" get a 404.

### 8. Encrypted `expiry_date` makes database index useless
**File:** `src/db/DocumentRepository.ts`
The comment says expiry dates stay plaintext for querying, and `schema.ts` creates `idx_documents_expiry`, but the code actually encrypts `expiry_date`. The index is completely useless on encrypted data — range queries and expiry sorting are impossible.

### 9. `OnboardingStorage.setIcloudBackupEnabled` never called during onboarding
**File:** `src/features/onboarding/OnboardingScreen6.tsx`
When the user chooses iCloud backup, only `BackupService.enableIcloudBackup()` is called. `OnboardingStorage.setIcloudBackupEnabled(true)` is never invoked, so `isIcloudBackupEnabled()` always returns `false`, feeding incorrect state into `AppContext`.

### 10. Deleting the active vault has no fallback
**File:** `src/features/vault/VaultSwitcherScreen.tsx`
If the user deletes the currently active vault, the code never switches to the default vault. `activeVaultId` still points to the deleted vault, which could cause crashes or data-not-found errors throughout the app.

### 11. Family Kit import drops metadata
**File:** `src/services/FamilyKitService.ts`
The export includes `document_date`, `expiry_date`, and `provider_name`, but the import function ignores all of them. Imported documents lose their dates and provider info — silent data loss.

### 12. No vault capacity check on Family Kit import
**File:** `src/services/FamilyKitService.ts`
Unlike `DocumentService.importFromFilePath`, there is no `assertVaultCapacity` call. Importing a large kit could exceed the storage cap with no warning.

### 13. Migration recovery copies over an open database
**File:** `src/db/migrations.ts`
`checkAndRecoverMigrationFailure` is called from within `runMigrations`, which runs after the database is already opened. Copying a file over an open SQLite database can corrupt it.

### 14. No manual key entry fallback in Survivor flow
**File:** `src/features/survivor/SurvivorImportScreen.tsx`
If the QR code is damaged or the camera cannot focus, there is no way to manually type the access key. For a bereaved family member, this is a critical dead end.

### 15. Memory pressure — entire vault loaded into memory
**Files:** `src/services/FamilyKitExportService.ts`, `src/services/CloudBackupService.ts`, `src/services/PersonalRecoveryKitService.ts`
Kit generation and backup serialise all documents as base64 into a single JSON object in memory. For a vault with 20 documents at 5 MB each, peak memory can exceed 400 MB — a crash risk on mobile devices.

### 16. `ITSAppUsesNonExemptEncryption` likely incorrect
**File:** `app.json`
Set to `false`, but the app uses AES-256-GCM extensively. This needs legal review for App Store compliance. Personal data storage may qualify for an exemption, but the current setting may be inaccurate.

---

## MEDIUM

### 17. `getVaultKey()` double biometric prompt race condition
**File:** `src/core/auth/KeyManager.ts`
Two concurrent callers (e.g. parallel file reads) both trigger `SecureStore.getItemAsync` with biometric, causing duplicate Face ID / Touch ID prompts. Needs a promise-deduplication pattern.

### 18. `isInitialized()` may return false when keys exist
**File:** `src/core/auth/KeyManager.ts`
The key is stored with `requireAuthentication: true`, but `isInitialized` reads without biometric context. On iOS, this can fail and return `null`, incorrectly reporting the vault as uninitialised.

### 19. `encrypt()` missing error handling
**File:** `src/core/crypto/CryptoService.ts`
`decrypt()` has try/catch and calls `captureVaultError`, but `encrypt()` is completely unguarded. Asymmetric telemetry coverage.

### 20. No input validation in CryptoService
**File:** `src/core/crypto/CryptoService.ts`
No verification that key length is 32 bytes, no minimum ciphertext length check before slicing IV/auth tag, no base64 validation on `decryptString`. Wrong-size inputs produce cryptic errors.

### 21. Overly permissive extension validation
**File:** `src/services/DocumentService.ts`
`!ext.startsWith('.jp')` allows `.jp2`, `.jpx`, `.jpm`, etc. Should be an explicit check for `.jpg` and `.jpeg`. Also, `.heic` is silently allowed but not in the schema's CHECK constraint.

### 22. No backup debounce
**File:** `src/services/CloudBackupService.ts`
`autoBackupIfEnabled` is called on every document add/update/delete. Adding 5 documents quickly fires 5 concurrent full vault backups simultaneously.

### 23. Premium status in plaintext AsyncStorage
**File:** `src/services/PurchaseService.ts`
On jailbroken devices, writing `'true'` to `afterme_premium_status` bypasses the paywall. When StoreKit is unavailable, the app falls back to this cache as truth.

### 24. `purchase()` missing try/catch
**File:** `src/services/PurchaseService.ts`
Every other StoreKit call is wrapped in try/catch, but `purchase()` is not. A network error or StoreKit exception propagates unhandled.

### 25. `decryptField` returns raw ciphertext on failure
**File:** `src/db/DocumentRepository.ts`
If decryption fails, the function silently returns the encrypted string as if it were plaintext. The UI could display garbled base64 data.

### 26. Hardcoded break-even maths in PaywallScreen
**File:** `src/features/paywall/PaywallScreen.tsx`
`"Annual × 3 years = £104.97"` is hardcoded. If prices change by locale or currency, this becomes misleading.

### 27. `RECORD_AUDIO` Android permission not needed
**File:** `app.json`
The app does not use audio recording. This unnecessary permission prompts users and could cause store rejections.

### 28. Accessibility gaps on WelcomeScreen
**File:** `src/features/welcome/WelcomeScreen.tsx`
All three CTAs (the app's entry point) lack `accessibilityRole` and `accessibilityLabel`. VoiceOver / TalkBack users cannot properly identify the buttons.

### 29. Date inputs are free-text with no validation
**File:** `src/features/documents/DocumentViewerModal.tsx`
Users type dates as raw strings with no format enforcement. `editValues.expiryDate` could be anything.

### 30. Hardcoded app version in backup metadata
**File:** `src/services/CloudBackupService.ts`
`appVersion: '1.0.0'` is hardcoded instead of read from constants. As the app updates, backup metadata is always stale.

### 31. Screen 5 `setTimeout` not cleaned up on unmount
**File:** `src/features/onboarding/OnboardingScreen5.tsx`
The 600ms delay for `onContinue()` is never cleared if the component unmounts, which leaks and could throw.

### 32. Screen 6 mixes `useNativeDriver: true` and `false`
**File:** `src/features/onboarding/OnboardingScreen6.tsx`
Mixing native and JS animation drivers in the same `Animated.sequence` tree can crash on certain React Native versions.

### 33. `'newest'` sort does nothing
**File:** `src/features/documents/DocumentLibraryScreen.tsx`
The `'newest'` sort mode returns `[...result]` without actually sorting. It relies on implicit database ordering which is not guaranteed.

### 34. Delete order risks orphaned database records
**File:** `src/services/DocumentService.ts`
Files are deleted before the database record. If `deleteDocument` fails after the file is deleted, the database record points to a nonexistent file. Safer to delete the database record first.

### 35. Concurrent capacity check bypass
**File:** `src/services/DocumentService.ts`
Two concurrent `importFromFilePath` calls could both pass `assertVaultCapacity` (each seeing enough free space), then both write, exceeding the cap.

### 36. Full file loaded as base64 into memory
**File:** `src/services/DocumentService.ts`
For a 50 MB file (the max allowed), this allocates ~67 MB for the base64 string + ~50 MB for the Buffer = ~117 MB simultaneously. On mobile devices, this is likely to cause memory pressure.

### 37. No cleanup on partial import failure
**File:** `src/services/DocumentService.ts`
If `saveFile` succeeds but thumbnail generation or `insertDocument` fails, the encrypted file is orphaned in storage with no cleanup.

### 38. No input validation on Family Kit import payload
**File:** `src/services/FamilyKitService.ts`
No validation that `vault.documents` is an array, that each document has required fields, or that `file_data` is valid base64. A malformed kit could cause crashes or store garbage.

### 39. No rollback on partial Family Kit import
**File:** `src/services/FamilyKitService.ts`
If the import loop fails at document N, documents 1..N-1 are already persisted. There is no transaction or rollback, leaving the vault in a partial import state.

### 40. `processing` state in Screen 6 never disables buttons
**File:** `src/features/onboarding/OnboardingScreen6.tsx`
`setProcessing(true)` is called but buttons are never disabled based on `processing`. The user can tap multiple times during async operations.

### 41. Corrupted files silently excluded from backup
**File:** `src/services/CloudBackupService.ts`
Files that fail to read are silently skipped. The user thinks they have a complete backup, but restoring it may be missing documents.

### 42. Backup restore uses unsafe type cast
**File:** `src/services/CloudBackupService.ts`
`docData as unknown as ...` double-cast is a type safety escape hatch. If the backup format ever includes fields that conflict with `DocumentInsert`, this will silently do the wrong thing.

### 43. `async` singleton race condition in `getDb()`
**File:** `src/db/DocumentRepository.ts`
Two concurrent callers can both see `null`, both open the database, and both run migrations. The second assignment overwrites the first, leaking a database handle. Should use a shared promise pattern.

### 44. `executeRename` and `confirmDelete` lack error handling
**File:** `src/features/documents/DocumentLibraryScreen.tsx`
If `DocumentService.updateDocument` or `deleteDocument` throws, the error is unhandled, the modal stays stuck, and the user gets no feedback.

### 45. `Stale SCREEN_WIDTH` after rotation
**File:** `src/features/documents/DocumentViewerModal.tsx`
`Dimensions.get('window')` is captured once at module load. After device rotation, the image width will be incorrect.

### 46. Full image base64 stored in React state
**File:** `src/features/documents/DocumentViewerModal.tsx`
Large images (multi-MB) are stored as base64 data URIs in state. This doubles memory usage. Consider writing decrypted content to a temp file and using a `file://` URI.

### 47. `handleIcloudToggle` has no error handling
**File:** `src/features/settings/SettingsScreen.tsx`
If `BackupService.enableIcloudBackup()` throws, local state `icloudEnabled` has already been updated optimistically, leaving UI and actual state out of sync.

### 48. `SurvivorImportScreen` — `processing` overlay never renders
**File:** `src/features/survivor/SurvivorImportScreen.tsx`
`processing` is set to `true` and then `false` synchronously in the same function. React batches these updates, so the processing overlay never appears.

### 49. Fragile base64 detection in AddDocumentModal
**File:** `src/features/documents/AddDocumentModal.tsx`
The check `!img.startsWith('file') && !img.startsWith('/')` does not account for Android `content://` URIs, which would incorrectly be treated as base64.

### 50. Expiry check counts long-expired documents
**File:** `src/context/AppContext.tsx`
The filter `exp <= threshold` captures documents that expired years ago, inflating `expiringSoonCount`. Should add a lower bound to only count documents expiring soon.

---

## LOW

### 51. In-memory vault key not zeroed before eviction
**File:** `src/core/auth/KeyManager.ts`
`cachedVaultKey` is set to `null` without calling `.fill(0)` first. The old Buffer remains in memory until garbage collected.

### 52. No AAD in AES-GCM
**File:** `src/core/crypto/CryptoService.ts`
Without Additional Authenticated Data, encrypted blobs are context-free and could be swapped between files without detection.

### 53. `reEncryptFile` is non-atomic
**File:** `src/core/storage/EncryptedStorageService.ts`
Writes back to the same path. A crash mid-write destroys the file. Should use write-to-temp-then-rename.

### 54. `getVaultSizeBytes` sequential I/O
**File:** `src/core/storage/EncryptedStorageService.ts`
Each file's info is fetched with `await` in a loop. `Promise.all` would be significantly faster for large vaults.

### 55. VaultManager document count counts thumbnails
**File:** `src/services/VaultManager.ts`
Counts all `.enc` files as documents, but thumbnails are also `.enc`. Count could be approximately double the actual document count.

### 56. Default vault `createdAt` changes every call
**File:** `src/services/VaultManager.ts`
When no records exist, `new Date().toISOString()` is returned each time, never persisted.

### 57. OnboardingHowItWorksScreen has 8 progress dots, others have 7
**File:** `src/features/onboarding/OnboardingHowItWorksScreen.tsx`
Progress dots are hardcoded per screen instead of driven by a shared constant. This screen shows 8 dots while all others show 7.

### 58. Version mismatch across config files
`app.json` says `1.0.1`, `package.json` says `1.0.0`, and the Xcode project says `1.0`. These should be kept in sync.

### 59. Schema duplication between `schema.ts` and `migrations.ts`
**Files:** `src/db/schema.ts`, `src/db/migrations.ts`
Both files define the same table schema independently. If one is updated without the other, they will drift.

### 60. Massive style duplication across onboarding screens
**Files:** `src/features/onboarding/OnboardingScreen1–6.tsx`
Container, circle, dots, CTA button, headline styles are copy-pasted across 7+ files. Should be extracted into a shared component.

### 61. iCloud mentioned on Android in HowItWorks screen
**File:** `src/features/onboarding/OnboardingHowItWorksScreen.tsx`
Unlike Screen 6 which gates iCloud to iOS, this screen shows the iCloud path on all platforms.

### 62. SettingsScreen is approximately 1150 lines
**File:** `src/features/settings/SettingsScreen.tsx`
Manages security, subscription, backup, integrity, family kit, vault switching, help, and dev tools in a single component. Should be split into sub-components.

### 63. `buffer` used but not an explicit dependency
**File:** `package.json`
`Buffer` is imported from `'buffer'` in `App.tsx` but `buffer` is not listed as a direct dependency. Works as a transitive dependency, but should be declared explicitly.

### 64. Product cache never expires
**File:** `src/services/PurchaseService.ts`
Once products are fetched, they are cached for the lifetime of the app process. Price changes or new products from App Store Connect are not reflected until the app is killed and restarted.

### 65. AnalyticsService reads/writes full array on every event
**File:** `src/services/AnalyticsService.ts`
Every `trackEvent` call reads the entire events array from AsyncStorage, deserialises it, appends, re-serialises, and writes it back. For frequently fired events, this is expensive. Consider batching events in memory and flushing periodically.

### 66. `escapeHtml` does not escape single quotes
**File:** `src/services/PdfExportService.ts`
If `ownerName` contains a single quote (e.g. "O'Brien"), it will not be escaped. Defensive coding gap.

### 67. Date format hardcoded to `en-AU` locale
**File:** `src/services/PdfExportService.ts`
The date format uses Australian English formatting. Consider using the device locale or `en-GB` since the app uses GBP pricing.

### 68. Console warnings leak security posture
**File:** `src/core/auth/KeyManager.ts`
Messages like `"Vault key stored without biometric protection"` are written to `console.warn`. On Android, these are captured by logcat and accessible via ADB. Consider using Sentry for these instead.

### 69. `startKeySetup` function is dead code
**File:** `src/navigation/AppNavigator.tsx`
This function is defined but never called. The "Setting up your vault..." loading screen is unreachable.

### 70. `handleHaveKit` and `handleRestoreVault` are identical
**File:** `src/navigation/AppNavigator.tsx`
Both call `setShowSurvivorFlow(true)`. The "Restore My Vault" flow should likely have different behaviour from the Survivor QR import flow.

### 71. No back navigation in onboarding
**Files:** `src/features/onboarding/OnboardingScreen1–6.tsx`
Users cannot go back to a previous onboarding screen. If someone taps "Continue" by accident, they are stuck moving forward.

### 72. KitCreationWizard empty vault guard flashes modal
**File:** `src/features/familykit/KitCreationWizard.tsx`
The `useEffect` fires after the first render, so the modal briefly appears before `onDismiss()` is called. Should use a pre-render check.

### 73. PersonalRecoveryWizard QR capture timing issue
**File:** `src/features/recovery/PersonalRecoveryWizard.tsx`
After `generateKit()` completes, the code sets state then waits 500ms to capture the QR ref. The component may not have re-rendered yet. The delay is a fragile workaround.

### 74. Modal swipe-to-dismiss does not reset wizard state
**File:** `src/features/recovery/PersonalRecoveryWizard.tsx`
The `Modal` with `presentationStyle="pageSheet"` allows iOS swipe-to-dismiss, but this does not call `handleDismiss`. On next open, stale state is preserved.

### 75. `generateAccessKey` modulo bias
**Files:** `src/services/FamilyKitExportService.ts`, `src/services/PersonalRecoveryKitService.ts`
`b % charset.length` where charset length is not a power of 2 introduces modulo bias, slightly reducing effective entropy. Use rejection sampling.

### 76. Unbounded kit history growth
**File:** `src/services/KitHistoryService.ts`
Every kit generation appends to the history array stored in AsyncStorage with no cap. Unlike AnalyticsService which caps at 500, there is no limit here.

### 77. Sentry regex redaction may be too aggressive
**File:** `src/services/SentryService.ts`
Any base64 string of 32+ characters in an exception message gets redacted. This could redact legitimate debugging information like stack traces or error identifiers.

### 78. `await` inconsistency on `CryptoService.encrypt`/`decrypt`
**Files:** Various
Some call sites use `await`, others do not. If the function is synchronous, the `await` is harmless. If it is async, missing `await` would assign a Promise instead of the result. Should be consistent based on actual return type.

---

## Suggestions

### Architecture
1. Add a promise-deduplication mutex for `getVaultKey()` to prevent double biometric prompts.
2. Add a transaction journal to `rotateKeys()` so a crash can be detected and resumed or rolled back.
3. Stream documents during kit/backup generation instead of loading everything into memory at once.
4. Extract shared onboarding layout into a reusable component with a `currentStep` prop for progress dots.
5. Split `SettingsScreen` into sub-components (SecuritySection, BackupSection, SubscriptionSection, etc.).
6. Add a centralised error handler for fire-and-forget `.catch(() => {})` patterns across the codebase.

### Security
7. Sanitise `filename` parameters in `EncryptedStorageService` to prevent path traversal.
8. Add input validation to `CryptoService` methods (key length, minimum ciphertext length).
9. Zero out Buffer contents before nulling vault key references.
10. Consider using SecureStore for premium status instead of plaintext AsyncStorage.
11. Add Additional Authenticated Data (AAD) to AES-GCM operations to bind ciphertext to context.
12. Gate developer tools behind `__DEV__` or a hidden activation gesture.

### UX
13. Add a date picker component for document dates instead of free-text input.
14. Add back navigation to the onboarding flow.
15. Add a manual access key entry option to the Survivor import screen.
16. Add accessibility roles and labels to all interactive elements, starting with the WelcomeScreen.
17. Debounce `autoBackupIfEnabled` to prevent concurrent backup storms.
18. Add progress reporting during kit generation for large vaults.
19. Show an error state or retry option when vault loading fails in VaultSwitcherScreen.

### Data Integrity
20. Wrap `reEncryptAllMetadata` in a database transaction.
21. Add a check-before-overwrite guard in `initializeKeys()`.
22. Use write-to-temp-then-rename for `reEncryptFile` to prevent data loss on crash.
23. Close the database before attempting migration recovery file operations.
24. Delete database records before files (not after) to prevent orphaned records.

### Configuration
25. Sync version numbers across `app.json`, `package.json`, and the Xcode project.
26. Remove the unnecessary `RECORD_AUDIO` Android permission.
27. Review `ITSAppUsesNonExemptEncryption` with legal counsel.
28. Read app version dynamically from constants instead of hardcoding in backup metadata.
29. Add `buffer` as an explicit dependency in `package.json`.
30. Replace the placeholder TestFlight URL with the actual link.
