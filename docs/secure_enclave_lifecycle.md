# Vault Key Lifecycle Specification

## Overview

This document defines the lifecycle of the cryptographic vault key used in the "After Me" React Native / Expo application. The security model relies on platform secure hardware — the Secure Enclave on iOS and the Android Keystore on Android — via `expo-secure-store` to protect the vault key at rest. All cryptographic operations (AES-256-GCM encryption, PBKDF2 key derivation, random byte generation) are performed by `react-native-quick-crypto`.

## Key Architecture

After Me uses a **single vault key** model. There is no master key / vault key hierarchy.

- **Vault Key**: A 256-bit (32-byte) symmetric AES key.
  - **Generation**: `react-native-quick-crypto` `randomBytes(32)`.
  - **Storage**: `expo-secure-store` with `requireAuthentication: true` and `keychainAccessible: WHEN_PASSCODE_SET_THIS_DEVICE_ONLY`. On iOS this maps to a Keychain item protected by the Secure Enclave; on Android it maps to the Android Keystore.
  - **Usage**: Encrypts and decrypts document file blobs (via `EncryptedStorageService`) and sensitive metadata fields in the SQLite database (via `DocumentRepository`).
  - **Identifier**: Stored under the tag `com.afterme.keys.vault`.

- **Recovery Key**: A derived key from the user's printed Family Kit or Personal Recovery Kit (QR code). Used to restore the vault key if the device is lost or wiped.

## In-Memory Session Cache

To avoid prompting biometrics on every database or file operation within a single session, the vault key is cached in a module-scoped variable (`cachedVaultKey`) inside `KeyManager`.

- On first access per foreground session, `KeyManager.getVaultKey()` reads from `expo-secure-store`, which triggers the OS biometric/passcode prompt.
- Subsequent calls return the cached key immediately.
- An `AppState` listener evicts the cache (`cachedVaultKey = null`) whenever the app transitions out of the `active` state (background, inactive).
- A manual `clearCache()` method is available for explicit lock (e.g., a "Lock Now" button in settings).

## Lifecycle Procedures

### 1. Key Creation (Onboarding)

1. **Check biometric availability**: `expo-local-authentication` verifies that biometric hardware exists (`hasHardwareAsync`) and that at least one biometric is enrolled (`isEnrolledAsync`). If either check fails, initialization is rejected.
2. **Generate vault key**: `CryptoService.generateKey()` calls `QuickCrypto.randomBytes(32)` to produce a 256-bit key.
3. **Store in platform secure hardware**: `SecureStore.setItemAsync(VAULT_KEY_TAG, key, options)` with:
   - `keychainAccessible: WHEN_PASSCODE_SET_THIS_DEVICE_ONLY` — the item is only accessible when the device has a passcode set, and it does not migrate to backups or new devices.
   - `requireAuthentication: true` — every read triggers the OS authentication prompt (biometric or passcode).
   - `authenticationPrompt: 'Unlock your After Me vault'`.
4. **iCloud Keychain backup (iOS only)**: `KeychainBackupService.backupVaultKey()` stores a copy of the vault key in iCloud Keychain via the native `keychain-sync` module. This is non-blocking — key initialization succeeds even if the backup fails (e.g., iCloud Keychain is disabled).

### 2. Key Access (Unlock)

1. `KeyManager.getVaultKey()` is called by `EncryptedStorageService` or `DocumentRepository` before any vault operation.
2. If the in-memory cache contains the key, it is returned immediately (no biometric prompt).
3. Otherwise, `SecureStore.getItemAsync()` triggers the OS biometric/passcode prompt.
4. On success, the key is decoded from Base64 into a `Buffer` and stored in the in-memory cache.
5. When the app leaves the foreground, the `AppState` listener evicts the cached key.

### 3. Key Rotation

**Trigger**: User explicitly requests rotation, or a security policy update requires it.

1. Retrieve the current vault key via `getVaultKey()` (requires biometric auth if cache is empty).
2. Generate a new 256-bit vault key via `CryptoService.generateKey()`.
3. **Re-encrypt all file blobs**: For every `file_ref` and `thumbnail_ref` in the database, `EncryptedStorageService.reEncryptFile()` decrypts with the old key and re-encrypts with the new key.
4. **Re-encrypt all metadata rows**: `DocumentRepository.reEncryptAllMetadata()` iterates every row and re-encrypts the sensitive fields (`title`, `document_date`, `expiry_date`, `provider_name`, `location_of_original`) with the new key.
5. **Replace the key in SecureStore**: `SecureStore.setItemAsync()` overwrites the stored vault key with the new key, using the same access control options.
6. **Update the iCloud Keychain backup** (iOS only).
7. Update the in-memory cache to the new key.

> **Note**: Key rotation is an expensive operation — it touches every encrypted file and every encrypted metadata field. It should be performed while the device is charged and the app is in the foreground.

### 4. Backup & Recovery

The vault key stored locally in `expo-secure-store` is bound to the device and cannot be synced. Two recovery mechanisms exist:

#### iCloud Keychain Backup (iOS Only)

The native `keychain-sync` Expo module (`KeychainSyncModule.swift`) writes the vault key to iCloud Keychain with:
- `kSecAttrSynchronizable: true` — enables sync across the user's iCloud-connected devices.
- `kSecAttrAccessibleAfterFirstUnlock` — the item is accessible after the first device unlock following a reboot.

**Why `kSecAttrAccessibleAfterFirstUnlock` instead of `kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly`**: The iCloud Keychain copy intentionally uses a broader accessibility level than the local copy. `kSecAttrAccessibleAfterFirstUnlock` is the minimum required for `kSecAttrSynchronizable` items to sync. This is acceptable because:
1. The iCloud Keychain copy exists solely for device migration, not as a primary access path.
2. iCloud Keychain itself is end-to-end encrypted with the user's iCloud security code or device passcode.
3. On the new device, the restored key is immediately re-stored locally with the stricter `WHEN_PASSCODE_SET_THIS_DEVICE_ONLY` protection.

On device migration, `KeyManager.restoreFromCloudKeychain()` retrieves the backup key and re-stores it locally with full biometric protection.

**Android**: iCloud Keychain is not available. No cloud backup is performed. Android users must rely on the manual recovery kits.

#### Manual Recovery (Family Kit / Personal Recovery Kit)

The vault key can also be recovered from the printed QR code included in the Family Kit or Personal Recovery Kit. These kits contain the vault key wrapped with a Key Encryption Key (KEK) derived from the QR code contents via PBKDF2. This path bypasses platform secure hardware entirely.

### 5. Biometric Failure Fallback

If biometrics fail or are unavailable:

1. `expo-secure-store` items created with `requireAuthentication: true` allow the OS to fall back to the device passcode. The biometric prompt is managed entirely by the operating system.
2. If the user cannot authenticate at all (forgotten device passcode, device disabled), the vault key in `expo-secure-store` is inaccessible.
3. **Recovery**: The user must restore from their **Family Kit**, **Personal Recovery Kit**, or (on iOS) from **iCloud Keychain** on a different device signed into the same Apple ID.
