# Biometric Fallback Logic Specification

## Overview
The "After Me" application relies on the device's secure authentication mechanisms (Face ID / Touch ID) to protect the Master Key stored in the Secure Enclave. This document details the fallback behavior when biometric authentication fails or is unavailable.

## Authentication Hierarchy

1.  **Primary**: Biometric Authentication (Face ID / Touch ID).
2.  **Secondary (System Fallback)**: Device Passcode.
3.  **Tertiary (Emergency/Loss)**: Family Kit (QR Code) or Personal Recovery Kit.

## Failure Scenarios & Handling

### 1. Biometric Failure (Transient)
-   **Trigger**: User fails Face ID / Touch ID match (e.g., face obscured, wet finger).
-   **System Behavior**: iOS automatically retries.
-   **App Behavior**: No action required. The `KeyManager` waits for the system result.

### 2. Biometric Lockout (5 Failed Attempts)
-   **Trigger**: 5 consecutive failed biometric attempts.
-   **System Behavior**: iOS disables biometric authentication for the device.
-   **Fallback**: The system prompt automatically transitions to "Enter Passcode" mode.
-   **Key Access**: The Secure Enclave key is accessible via the Device Passcode because we use the `.userPresence` access control flag (which includes both biometrics and passcode).

### 3. Passcode Failure
-   **Trigger**: User enters the wrong device passcode.
-   **System Behavior**: iOS enforces a delay (increasing with each failure). Eventually, the device may be disabled.
-   **App Behavior**: The app cannot access the Master Key. The Vault remains encrypted.

### 4. Device Passcode Forgotten (Catastrophic)
-   **Trigger**: User forgets the device passcode and cannot unlock the device or the Secure Enclave key.
-   **Impact**: The Master Key in the Secure Enclave is permanently inaccessible.
-   **Recovery**: The user MUST use their **Personal Recovery Kit** or a **Family Kit** (if they created one) to restore access. These kits contain the `Vault Key` wrapped with a key derived from the QR code, bypassing the Secure Enclave entirely.

### 5. Biometrics Changed (Anti-Spoofing)
-   **Trigger**: User adds a new face or fingerprint to iOS Settings.
-   **System Behavior**: `SecItem` entries protected by `.userPresence` usually remain valid, BUT entries protected by `.biometryCurrentSet` would be invalidated.
-   **Our Policy**: We use `.userPresence` to allow access even after biometric changes (assuming the user knows the passcode to add the new biometric).
-   **Risk**: If an attacker knows the passcode, they can add their face.
-   **Mitigation**: We rely on the device passcode as the root of trust.

## Implementation Details
The `KeyManager` uses `SecAccessControlCreateWithFlags` with `kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly` and `.userPresence`.
This configuration ensures that:
1.  The key is encrypted by the Secure Enclave.
2.  The key is only available when the device is unlocked.
3.  The key requires explicit user interaction (Biometric or Passcode) to be used.
