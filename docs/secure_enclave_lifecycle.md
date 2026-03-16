# Secure Enclave Key Lifecycle Specification

## Overview
This document defines the lifecycle of the cryptographic keys used in the "After Me" iOS application. The security model relies on the Apple Secure Enclave (SE) to protect the Master Key, ensuring that it never leaves the device in plaintext.

## Key Hierarchy

1.  **Master Key (MK)**: A 256-bit key stored in the Secure Enclave.
    -   **Type**: ECC (Elliptic Curve) or AES key (depending on implementation, usually we wrap a raw key).
    -   **Access Control**: UserPresence (Biometrics or Passcode).
    -   **Usage**: Wraps (encrypts) the Vault Key.

2.  **Vault Key (VK)**: A 256-bit symmetric key (AES-256).
    -   **Storage**: Encrypted by the Master Key and stored in the iOS Keychain.
    -   **Usage**: Encrypts/Decrypts the actual vault data (documents).

3.  **Recovery Key (RK)**: A derived key from the user's manual backup (e.g., printed QR code).
    -   **Usage**: Can decrypt a backup of the Vault Key if the device is lost.

## Lifecycle Procedures

### 1. Key Creation (Onboarding)
1.  **Generate Vault Key (VK)**:
    -   Generate 32 bytes of random data using `SecRandomCopyBytes`.
2.  **Generate Master Key (MK)** in Secure Enclave:
    -   Create a `SecAccessControl` object with `.userPresence` policy.
    -   Generate a key pair (if asymmetric) or symmetric key in the SE.
3.  **Wrap Vault Key**:
    -   Encrypt `VK` using `MK`.
    -   Store the encrypted `VK` in the Keychain (`kSecClassGenericPassword`).

### 2. Key Access (Unlock)
1.  User authenticates via Face ID / Touch ID.
2.  App requests the Secure Enclave to decrypt the `VK` using the `MK`.
3.  If successful, `VK` is held in memory *only while the app is in the foreground*.
4.  On backgrounding, `VK` is wiped from memory.

### 3. Key Rotation
**Trigger**: User explicitly requests it, or security policy update.
1.  Generate new `VK_new`.
2.  Re-encrypt all vault data with `VK_new` (expensive operation).
3.  Wrap `VK_new` with `MK`.
4.  Replace encrypted `VK` in Keychain.

*Note: Rotating `MK` (Secure Enclave key) usually happens automatically if the user resets Face ID. In that case, the Keychain item becomes invalid. We must implement a fallback recovery mechanism.*

### 4. Backup & Recovery (CloudKit)
Since the `MK` is bound to the specific device's Secure Enclave, it cannot be synced to iCloud.
To support device migration:
1.  **CloudKit Keychain**: We store a copy of the `VK` wrapped with a *different* key that is syncable (e.g., standard iCloud Keychain protection).
2.  **Manual Recovery**: The `VK` is also wrapped by the Key Encryption Key (KEK) derived from the QR code (as defined in the .afterme spec). This allows restoring from the printed kit.

### 5. Biometric Failure Fallback
If Biometrics fail (or are unavailable):
1.  The `.userPresence` flag allows fallback to the Device Passcode.
2.  If the user forgets the device passcode, the Secure Enclave key is inaccessible.
3.  **Recovery**: User must use the printed QR code (Family Kit) or the Personal Recovery Kit to restore the vault.
