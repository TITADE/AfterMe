# Data Handling Procedures for App Store Review

This document describes how the After Me application collects, stores, and handles user data for App Store review compliance. This document applies to both iOS and Android versions of the app.

## 1. Data We Collect

### 1.1 User Documents

- **What**: Scanned or imported documents (wills, passports, insurance policies, etc.)
- **Storage**: Encrypted locally on the device using AES-256-GCM. Keys are protected by the device Secure Enclave (Face ID / Touch ID).
- **Transmission**: Documents do not leave the device unless the user explicitly creates and shares a Family Kit. No documents are uploaded to our servers.
- **Access**: We (the developer) cannot access document content. Zero-knowledge architecture.

### 1.2 Biometric Data

- **What**: Face ID / Touch ID used to unlock the vault key.
- **Storage**: Biometric data is processed by the operating system for authentication. The app never receives, stores, or transmits biometric data.
- **Usage**: Required for app access. Users can enable it during onboarding.
- **Purpose**: Unlock the encrypted vault key stored in the device Keychain.

### 1.3 App Usage Data

- **Crash reports**: The app does not collect analytics data. Sentry is used for crash reporting only, with PII scrubbing enabled. We do not log document titles, categories, or any vault contents. Crash reports contain only technical metadata (device model, OS version, stack traces).
- **Analytics**: None. We do not use analytics libraries that track user behavior or content.

## 2. Data We Do NOT Collect

- Document content or metadata (titles, categories) beyond local storage
- Location data
- Contact list
- Email addresses (except if user shares a Family Kit via email—handled by the system Share Sheet)
- Advertising identifiers

## 3. Data Storage & Security

| Data Type         | Location           | Encryption                 | Key Storage            |
|-------------------|--------------------|---------------------------|------------------------|
| Documents         | Device file system | AES-256-GCM               | Secure Enclave         |
| Vault key         | Keychain           | OS-managed                | Secure Enclave         |
| Metadata (SQLite) | Device             | AES-256-GCM (encrypted columns) | Secure Enclave   |
| iCloud Keychain   | Optional backup    | Apple iCloud Keychain     | User's Apple ID        |

Sensitive metadata fields—including document titles, provider names, and notes—are encrypted within the SQLite database using AES-256-GCM, the same encryption applied to document file blobs. This ensures that metadata is protected at rest even if the device file system is compromised.

## 4. User Control

- **Delete all data**: User can reset the vault from Settings → Phase 1 Verification → Reset. This deletes keys and instructs the user to re-onboard.
- **Export**: User creates a Family Kit to export their vault. Export is user-initiated.
- **No account**: There is no server-side account. All data is device-local.

## 5. Third-Party Services

- **Apple App Store / Google Play**: In-app purchase transactions. Apple's and Google's respective privacy policies apply.
- **Sentry**: Crash reporting only. We configure Sentry to exclude document content and PII. PII scrubbing is enabled; only crash metadata (device model, OS version, stack traces) is transmitted.
- **Expo**: Build and tooling. No runtime data collection by Expo in production builds.

## 6. Children

After Me is not directed at children under 13. We do not knowingly collect data from children.

## 7. App Store Privacy Labels

When completing the App Store privacy nutrition label, use:

- **Data Linked to You**: None.
- **Data Collected**: Biometric data (for authentication)—not used for tracking.
- **Data Not Collected**: We do not collect contact info, identifiers, or usage data beyond what is necessary for app function.

## 8. Sensitive Content

The app deals with end-of-life planning and estate documents. Content may include:

- Wills and legal documents
- Medical records
- Financial information

All such content is encrypted and stored locally. We do not have access to it. The Legal Disclaimer screen informs users that After Me is not a substitute for professional legal or financial advice.
