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

#### manifest.json Privacy Note
The `owner_name` field is stored **unencrypted** intentionally. It exists so that survivors who receive an `.afterme` file can identify whose vault it is before attempting decryption. This is important for scenarios where a family member may possess multiple `.afterme` files from different relatives or associates.

The `owner_name` field is **optional**. If the user omits it, the field should be absent from the JSON (or set to `null`). Implementations must not require this field to be present.

### 3. vault.enc
The encrypted payload. This file contains the actual documents and sensitive data.
- **Algorithm**: AES-256-GCM (Galois/Counter Mode).
- **Key Size**: 256 bits.
- **Nonce/IV**: 12 bytes (96 bits).
- **Auth Tag**: 16 bytes (128 bits).

**Wire format (byte-level layout):**
```
[IV (12 bytes)][Auth Tag (16 bytes)][Ciphertext]
```

| Offset | Length | Field |
|--------|--------|-------|
| 0 | 12 | IV (nonce) |
| 12 | 16 | GCM authentication tag |
| 28 | variable | Ciphertext (encrypted JSON payload) |

> **Note:** The authentication tag appears **before** the ciphertext in this format. This differs from many common library conventions where the tag is appended after the ciphertext. See [Implementation Notes](#implementation-notes) for guidance on adapting for different cryptographic libraries.

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

**Binary format (byte-level layout):**
```
[Salt (32 bytes)][IV (12 bytes)][Auth Tag (16 bytes)][Encrypted CEK (32 bytes)]
```

| Offset | Length | Field |
|--------|--------|-------|
| 0 | 32 | PBKDF2 salt |
| 32 | 12 | IV (nonce) for AES-256-GCM key wrap |
| 44 | 16 | GCM authentication tag |
| 60 | 32 | Encrypted Content Encryption Key |

Total file size: **92 bytes** (fixed).

> **Note:** As with `vault.enc`, the authentication tag precedes the ciphertext (the encrypted CEK). See [Implementation Notes](#implementation-notes) for library-specific guidance.

## QR Code Access Key
The Access Key is the secret credential used to derive the Key Encryption Key (KEK) via PBKDF2. It is delivered to the user as a QR code.

- **Format**: A high-entropy random string, minimum 32 characters, composed of alphanumeric characters and symbols (printable ASCII, excluding whitespace control characters).
- **Encoding**: The QR code payload is the Access Key encoded as a plain UTF-8 string. No additional framing, URL scheme, or binary encoding is applied.
- **Error Correction**: QR codes must use **error correction level H** (High), which tolerates up to ~30% damage. This is critical because the QR code may be printed on paper and stored for years or decades before use.
- **Display**: The Access Key is never displayed as raw text in the app UI. Users interact with it exclusively through the QR code.

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
   a. Reads the salt (first 32 bytes) from `key.enc`.
   b. Derives the KEK from the Access Key using PBKDF2-HMAC-SHA256 (600,000 iterations, salt from step a).
   c. Reads IV (12 bytes), Auth Tag (16 bytes), and Encrypted CEK (32 bytes) from `key.enc`.
   d. Decrypts `key.enc` to obtain the CEK.
   e. Reads IV (12 bytes) and Auth Tag (16 bytes) from the start of `vault.enc`.
   f. Decrypts the remaining ciphertext of `vault.enc` using the CEK, IV, and Auth Tag.
   g. Parses the resulting JSON and extracts the documents.

## Implementation Notes

### Tag-Before-Ciphertext Convention
The `.afterme` v1.0 wire format places the GCM authentication tag **before** the ciphertext in both `vault.enc` and `key.enc`. This is a deliberate design choice baked into the reference implementation and all existing encrypted files.

Many cryptographic libraries use a different convention where the authentication tag is **appended after** the ciphertext (e.g., Python's `cryptography.hazmat.primitives.ciphers.aead.AESGCM`, Go's `crypto/cipher` GCM, and WebCrypto). When working with such libraries, implementors must rearrange the bytes:

**Reading (decryption):**
1. Parse the wire format: `[IV][Tag][Ciphertext]`
2. Rearrange for the library: pass `[Ciphertext][Tag]` (concatenated) as the "ciphertext" input, with the IV/nonce separately.

**Writing (encryption):**
1. The library returns `[Ciphertext][Tag]` (concatenated) or separate ciphertext and tag values.
2. Rearrange to the wire format: write `[IV][Tag][Ciphertext]` to the file.

**Example (Python, using `cryptography` library):**
```python
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# Decrypting vault.enc:
data = open("vault.enc", "rb").read()
iv = data[:12]
tag = data[12:28]
ciphertext = data[28:]
# AESGCM.decrypt() expects nonce and ciphertext+tag appended:
plaintext = AESGCM(cek).decrypt(iv, ciphertext + tag, None)

# Decrypting key.enc:
data = open("key.enc", "rb").read()
salt = data[:32]
iv = data[32:44]
tag = data[44:60]
encrypted_cek = data[60:92]
# Derive KEK from salt, then:
cek = AESGCM(kek).decrypt(iv, encrypted_cek + tag, None)
```

**Example (Node.js, using `crypto` module):**
```javascript
const crypto = require('crypto');

// Decrypting vault.enc:
const data = fs.readFileSync('vault.enc');
const iv = data.subarray(0, 12);
const tag = data.subarray(12, 28);
const ciphertext = data.subarray(28);
const decipher = crypto.createDecipheriv('aes-256-gcm', cek, iv);
decipher.setAuthTag(tag);
const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
```

> **Note:** Node.js `crypto.createDecipheriv` for GCM accepts the tag separately via `setAuthTag()`, so no rearrangement is needed — simply slice the tag and ciphertext from the wire format and pass them independently.

## Future Compatibility
- The `version` field in `manifest.json` determines the parsing logic, including the encryption algorithm, KDF parameters, and the wire format byte layout convention.
- New encryption algorithms will be added as new version identifiers.
- Future versions may adopt a different tag placement convention; implementations should always check the version field before assuming a wire format.
- The `README.txt` will always be present and backward-compatible (plain text).
