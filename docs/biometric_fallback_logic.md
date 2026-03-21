# Biometric Fallback Logic Specification

## Overview

The "After Me" application protects the vault key using the device's secure authentication mechanisms via `expo-secure-store` (backed by the Secure Enclave on iOS and the Android Keystore on Android). Biometric authentication is the primary unlock method, with the device passcode/PIN as a system-managed fallback. This document details the fallback behavior when biometric authentication fails or is unavailable.

## Authentication Hierarchy

1. **Primary**: Biometric authentication (Face ID / Touch ID on iOS; fingerprint / face unlock on Android).
2. **Secondary (System Fallback)**: Device passcode (iOS) or PIN/pattern/password (Android).
3. **Tertiary (Emergency / Device Loss)**: Family Kit (QR code) or Personal Recovery Kit.

## Platform Behavior

### expo-secure-store Configuration

The vault key is stored with the following options:

```typescript
{
  keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
  requireAuthentication: true,
  authenticationPrompt: 'Unlock your After Me vault',
}
```

- **`requireAuthentication: true`**: Every read from SecureStore triggers the OS authentication prompt. On iOS, `expo-secure-store` internally configures the Keychain item to require user presence (biometrics or passcode). On Android, it configures `BiometricPrompt` with device credential fallback.
- **`WHEN_PASSCODE_SET_THIS_DEVICE_ONLY`**: The item is only accessible while the device has a passcode/PIN set, and it is excluded from backups and device migration. On iOS this maps to the corresponding Keychain accessibility class; on Android the key is bound to the device's Keystore and cannot be extracted.

> **Note**: `expo-secure-store` accepts both biometrics and device passcode as valid authentication. It does not support a "current biometrics only" mode (where adding a new fingerprint/face would invalidate the key). This means the vault key remains accessible even after biometric enrollment changes, as long as the user can authenticate by any registered method.

## Failure Scenarios & Handling

### 1. Biometric Failure (Transient)

- **Trigger**: User fails a biometric match (face obscured, wet finger, poor lighting).
- **iOS**: The system automatically offers retry attempts.
- **Android**: `BiometricPrompt` allows retry and shows a "Use PIN" fallback button.
- **App Behavior**: No action required. `KeyManager.getVaultKey()` awaits the OS authentication result. The promise resolves on success or rejects on cancel.

### 2. Biometric Lockout (Multiple Failed Attempts)

- **Trigger**: Multiple consecutive failed biometric attempts (5 on iOS; varies by OEM on Android).
- **iOS**: Biometric authentication is disabled. The system prompt transitions to "Enter Passcode" mode automatically.
- **Android**: `BiometricPrompt` displays the device credential (PIN/pattern/password) input.
- **Key Access**: The vault key remains accessible because `requireAuthentication` permits passcode/PIN fallback. The `KeyManager` does not need to intervene — the OS handles the transition.

### 3. Passcode / PIN Failure

- **Trigger**: User enters the wrong device passcode (iOS) or PIN/pattern (Android).
- **iOS**: Enforces increasing delays between attempts. After 10 failures the device may be wiped (if configured).
- **Android**: Similar escalating lockout behavior, varying by OEM.
- **App Behavior**: The vault key cannot be retrieved. `SecureStore.getItemAsync()` rejects and the app remains locked. No data is lost — the encrypted vault is intact on disk.

### 4. Device Passcode Forgotten (Catastrophic)

- **Trigger**: User forgets the device passcode/PIN and cannot unlock the device or pass the authentication prompt.
- **Impact**: The vault key in `expo-secure-store` is permanently inaccessible on that device. The key is bound to the device and protected by the Secure Enclave (iOS) or Keystore (Android).
- **Recovery paths**:
  1. **iCloud Keychain (iOS only)**: If the user has another Apple device signed into the same iCloud account, `KeyManager.restoreFromCloudKeychain()` can retrieve the backup key and re-store it locally on the new device.
  2. **Family Kit**: The printed QR code contains the vault key wrapped with a PBKDF2-derived KEK. Scanning the kit on a new device restores full access.
  3. **Personal Recovery Kit**: Same mechanism as the Family Kit but intended for the vault owner's personal safekeeping.
- These recovery paths bypass `expo-secure-store` entirely — the recovered key is imported directly and re-stored with biometric protection on the new device.

### 5. Biometrics Changed (Enrollment Update)

- **Trigger**: User adds or removes a face or fingerprint in device settings.
- **iOS**: `expo-secure-store` items remain valid after biometric enrollment changes because the library uses a policy that accepts any registered authentication method. Items would only be invalidated if the library used a "current biometrics only" policy, which it does not.
- **Android**: Keys created with `setUserAuthenticationRequired(true)` and device credential fallback remain valid after fingerprint enrollment changes.
- **Effect**: The vault key remains accessible as long as the user can authenticate by any registered method (biometric or passcode/PIN).
- **Risk**: An attacker who knows the device passcode can enroll their own biometrics and then unlock the vault.
- **Mitigation**: The device passcode is the root of trust. This is consistent with the OS security model — anyone who knows the passcode has full device control.

## Implementation Summary

Authentication is handled entirely by `KeyManager` (`src/core/auth/KeyManager.ts`):

| Concern | Implementation |
|---|---|
| Store vault key | `SecureStore.setItemAsync()` with `requireAuthentication: true` |
| Retrieve vault key | `SecureStore.getItemAsync()` — triggers OS biometric/passcode prompt |
| Session caching | Module-scoped `cachedVaultKey` variable; avoids repeated prompts |
| Cache eviction | `AppState` listener clears cache on any non-`active` state |
| Manual lock | `KeyManager.clearCache()` |
| Biometric check (onboarding) | `LocalAuthentication.hasHardwareAsync()` + `isEnrolledAsync()` |
| Recovery (iOS) | `KeychainBackupService` → native `keychain-sync` module → iCloud Keychain |
| Recovery (manual) | Family Kit / Personal Recovery Kit QR code |
