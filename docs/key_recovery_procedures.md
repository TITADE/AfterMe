# Key Recovery Procedures for Estate Scenarios

## Overview

This document describes how to recover access to an After Me vault in estate and incapacity scenarios—when the vault owner is deceased, incapacitated, or otherwise unable to authenticate.

## Recovery Methods

### 1. Family Kit (Primary Estate Recovery)

When the vault owner created a **Family Kit** and shared it with a trusted person:

1. **Trusted person** downloads the After Me app.
2. Taps **"I Have a Legacy Kit"** on the welcome screen.
3. Scans the **QR code** from the printed Key Card or digital copy.
4. Selects the **.afterme file** (from the shared Family Kit package).
5. The app decrypts the vault using the access key embedded in the QR code.
6. Full access to all documents and personal messages.

**No death verification required.** The Family Kit grants access immediately. The design assumes the vault owner shared the kit with someone they trust.

### 2. Personal Recovery Kit (Device Loss While Alive)

When the vault owner created a **Personal Recovery Kit** (separate from the Family Kit) for device loss:

1. **Owner** gets a new device (replacement after loss/theft).
2. Downloads the After Me app.
3. Taps **"I Have a Legacy Kit"** on the welcome screen.
4. Selects **"Restore My Vault"** (or equivalent).
5. Scans the QR code from their Personal Recovery Kit.
6. Provides the .afterme backup file (from iCloud Drive, email, or other backup).
7. Vault is restored; new biometrics are set up.

### 3. iCloud Keychain Migration (New Device — iOS Only)

When the vault owner migrates to a new iPhone and is signed into the same Apple ID with iCloud Keychain enabled:

1. **Owner** installs After Me on the new device.
2. On first launch, the app checks for an iCloud Keychain backup of the vault key.
3. If found, prompts to **restore from iCloud Keychain**.
4. User authenticates (Face ID / Touch ID on new device).
5. Vault key is restored; no Family Kit or Recovery Kit required.

> **Android note:** iCloud Keychain migration is not available on Android. Users migrating from iOS to Android (or between Android devices) must use a **Family Kit** or **Personal Recovery Kit** for vault recovery. There is no platform-level keychain sync equivalent on Android. Cross-platform migration always requires an explicit kit.

### 4. Open-Source Decoder (Fallback)

If the app is unavailable, corrupted, or the company has ceased operations:

1. Obtain the **.afterme file** and **Access Key** (QR code string or printed key).
2. Download the **open-source decoder** from the project repository at `decoder_reference/decoder.py`.
3. Follow the **.afterme format specification** at https://afterme.app/format-spec (source: `web/format-spec.html` in the repo).
4. Run the decoder with the access key and .afterme file:
   ```
   python decoder.py --key <ACCESS_KEY> --input <FILE.afterme>
   ```
5. Documents are extracted to a local folder.

The decoder is a standalone Python script with no dependency on After Me infrastructure. It is published alongside the format spec to guarantee long-term access to vault contents.

## Estate Executor Workflow

For solicitors or estate executors handling a deceased person's estate:

1. **Locate the Family Kit** — Check for:
   - Printed materials with QR code (Key Card)
   - Digital .afterme file (USB drive, cloud storage, email)
   - Instructions document (README.txt inside the kit)

2. **Obtain the Access Key** — The QR code contains the key. Options:
   - Scan the QR code with any QR reader; the string is the access key
   - Or use the After Me app to scan and import (simplest)

3. **Access the vault** — Use the After Me app or the open-source decoder (`decoder_reference/decoder.py`).

## Incapacity Scenarios

If the vault owner is incapacitated (e.g., coma, severe illness) but the Family Kit was shared in advance:

- The trusted contact uses the same Family Kit flow—no additional verification.
- The app does not require proof of death or incapacity.
- The design prioritizes access for trusted recipients over gatekeeping.

## Limitations

- **No Family Kit** — If the owner never created or shared a Family Kit, recovery is not possible through the app. The vault key is tied to the device's Secure Enclave.
- **Lost passcode and no kit** — If the device is locked, biometrics fail, and no Family Kit exists, the vault is unrecoverable.
- **Device destroyed** — Recovery requires a backup (Family Kit, Recovery Kit, or iCloud Keychain).
- **Cross-platform migration** — There is no automatic key sync between iOS and Android. Users must rely on a Family Kit or Recovery Kit when switching platforms.
