# Estate Access Procedures

## Overview

This document defines how an estate executor, trusted contact, or family member gains access to an After Me vault when the vault owner is deceased or incapacitated.

## Trusted Contact Model

After Me uses a **proactive sharing** model. The vault owner designates trusted persons by creating and sharing a **Family Kit** while alive. There is no in-app "trusted contact" list—the act of sharing the Family Kit is the designation.

### Designation

- **Family Kit creation** = The owner has chosen a trusted person (or persons) by giving them the kit.
- **Kit contains**: (1) Encrypted .afterme file, (2) Key Card with QR code (access key).
- **No death verification** = The trusted person can open the vault at any time. We assume the owner shared intentionally.

## Estate Executor Access

### When the Owner Is Deceased

1. **Executor** locates the Family Kit materials (printed or digital).
2. **Executor** uses the After Me app: "I Have a Legacy Kit" → Scan QR code → Select .afterme file.
3. Vault opens with full access to documents and personal messages.
4. Executor can export, print, or share documents as needed for probate and estate administration.

### When the Owner Is Incapacitated

- Same process. The trusted contact (e.g., power of attorney, family member with the kit) uses the Family Kit to access the vault.
- No medical verification or court order is required by the app.
- Responsibility for proper authorization rests with the trusted contact.

### When the Owner Did Not Create a Family Kit

- **Vault is not recoverable** through normal means.
- The vault key is stored in the device's Secure Enclave and requires biometrics or device passcode.
- If the device is unlocked, an executor could use the app if they have device access—but this is a device-access issue, not an After Me procedure.

## Emergency Access Protocols

### Break-Glass Scenarios

| Scenario | Protocol |
|----------|----------|
| Owner incapacitated, family has kit | Use Family Kit to open vault. No additional steps. |
| Owner deceased, executor has kit | Use Family Kit. Export documents for probate. |
| Owner lost device, has Recovery Kit | Use "Restore My Vault" flow with QR code and backup file. |
| Owner lost device, has iCloud Keychain | New device restores from iCloud Keychain automatically (if same Apple ID). |
| No kit, device lost | Vault is not recoverable. Emphasize creating a kit during onboarding. |

### Trusted Contact Responsibilities

- **Safeguard the kit** — Store the printed Key Card and .afterme file in a secure location (safe, solicitor's office).
- **Know how to use it** — Test opening the vault once when the owner is alive (optional but recommended).
- **Do not share the QR code** — The Key Card grants full access. Treat it like a master key.

### Limitations

- After Me does **not** verify death or incapacity. We rely on the owner's choice of who receives the kit.
- We do **not** implement "break-glass" with time delays or multi-party authorization. The Family Kit is the single break-glass mechanism.
- Legal authority (e.g., court order for estate access) is outside the app's scope. Executors must ensure they act within their legal authority.

## Open-Source Decoder (App-Independent Access)

If the After Me app is unavailable, corrupted, or the company has ceased operations, estate executors can decrypt the vault independently using the open-source decoder.

- **Decoder location**: `decoder_reference/decoder.py` in the project repository.
- **Format specification**: See the `.afterme` format spec at `web/format-spec.html` (also published at https://afterme.app/format-spec).
- **Requirements**: Python 3 with the `cryptography` library; the `.afterme` file and the Access Key (from the QR code on the Key Card).
- **Usage**: Run `python decoder.py --key <ACCESS_KEY> --input <FILE.afterme>` to extract all documents to a local folder.

This ensures long-term access to vault contents even if the app or company no longer exists.
