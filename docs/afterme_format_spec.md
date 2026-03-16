# .afterme Open Container Format Specification (v1.0)

## Overview
The `.afterme` file format is an open, documented container format designed for long-term archival and secure storage of sensitive personal documents. It prioritizes user ownership, platform independence, and future-proof access. Even if the "After Me" application or company ceases to exist, users with the correct credentials can always access their data using standard open-source tools.

This specification is public and stable. Any changes to the format will be versioned and documented.

## File Structure
An `.afterme` file is a standard ZIP archive (uncompressed or compressed) containing the following file structure:

```
.afterme (ZIP Archive)
├── README.txt           # Human-readable instructions for manual recovery
├── manifest.json        # Metadata about the vault contents (unencrypted)
├── vault.enc            # The core encrypted data payload (AES-256-GCM)
└── key.enc              # The content encryption key, wrapped with the user's access method (e.g., QR code key)
```

### 1. README.txt
A plain text file that explains what this archive is and how to open it. It includes:
- A brief description of the "After Me" service.
- Instructions on how to download the open-source decoder.
- A link to this specification.
- Emergency contact information (if provided by the user).

### 2. manifest.json
A JSON file containing non-sensitive metadata about the vault. This allows the application to display basic information without decrypting the entire vault.

**Schema:**
```json
{
  "version": "1.0",
  "created_at": "2023-10-27T10:00:00Z",
  "vault_id": "uuid-string",
  "owner_name": "John Doe",
  "document_count": 15,
  "categories": ["Identity", "Finance", "Legal"],
  "encryption_algo": "AES-256-GCM",
  "kdf_algo": "PBKDF2-HMAC-SHA256"
}
```

### 3. vault.enc
The encrypted payload. This file contains the actual documents and sensitive data.
- **Algorithm**: AES-256-GCM (Galois/Counter Mode).
- **Key Size**: 256 bits.
- **Nonce/IV**: 12 bytes (96 bits), prepended to the ciphertext.
- **Auth Tag**: 16 bytes (128 bits), appended to the ciphertext.

The content of `vault.enc` (before encryption) is a JSON object or a ZIP stream containing the documents and their metadata. For v1.0, it is a JSON structure:

```json
{
  "documents": [
    {
      "id": "doc-uuid",
      "category": "Identity",
      "title": "Passport",
      "file_data": "base64-encoded-content",
      "mime_type": "application/pdf",
      "created_at": "..."
    },
    ...
  ],
  "personal_messages": [...]
}
```

### 4. key.enc
The Content Encryption Key (CEK) used to encrypt `vault.enc`. This key is itself encrypted (wrapped) using the user's access credential (e.g., the high-entropy key embedded in the QR code).

- **Wrapping Algorithm**: AES-256-GCM (Key Wrap).
- **Key Derivation**: The user's access credential (QR code string) is run through PBKDF2-HMAC-SHA256 with a random salt (stored in `key.enc` header) to derive the Key KEK (Key Encryption Key).
- **Payload**: The 256-bit CEK.

## Encryption Details

### Key Derivation Function (KDF)
- **Algorithm**: PBKDF2
- **PRF**: HMAC-SHA256
- **Iterations**: 600,000 (minimum, tunable for future hardware)
- **Salt**: 32 bytes, random

### Content Encryption
- **Algorithm**: AES-256-GCM
- **Key**: 32 bytes (256 bits) random CEK
- **Nonce**: 12 bytes random
- **Tag**: 16 bytes

## Recovery Process (Manual)
1. Unzip the `.afterme` file.
2. Read `README.txt` for instructions.
3. Locate the decoder tool (or write one based on this spec).
4. Provide the QR code string (the "Access Key").
5. The decoder:
   a. Reads the salt from `key.enc`.
   b. Derives the KEK from the Access Key using PBKDF2.
   c. Decrypts `key.enc` to get the CEK.
   d. Reads the nonce from `vault.enc`.
   e. Decrypts `vault.enc` using the CEK and nonce.
   f. Extracts the documents.

## Future Compatibility
- The `version` field in `manifest.json` determines the parsing logic.
- New encryption algorithms will be added as new version identifiers.
- The `README.txt` will always be present and backward-compatible (plain text).
