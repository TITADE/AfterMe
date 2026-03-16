import zipfile
import json
import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend

def decrypt_vault(afterme_file_path, access_key, output_dir):
    """
    Decrypts an .afterme file using the provided access key.
    """
    
    # 1. Unzip the archive
    with zipfile.ZipFile(afterme_file_path, 'r') as zip_ref:
        zip_ref.extractall("temp_extracted")
        
    print("Files extracted.")
    
    # 2. Read manifest
    with open("temp_extracted/manifest.json", "r") as f:
        manifest = json.load(f)
        print(f"Manifest loaded. Vault ID: {manifest.get('vault_id')}")

    # 3. Read key.enc and derive KEK
    with open("temp_extracted/key.enc", "rb") as f:
        key_enc_data = f.read()
        
    # Format of key.enc: [Salt (32 bytes)] [Nonce (12 bytes)] [Ciphertext (Key Size + Tag Size)]
    salt = key_enc_data[:32]
    nonce_kek = key_enc_data[32:44]
    ciphertext_cek = key_enc_data[44:]
    
    # Derive KEK from Access Key
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=600000,
        backend=default_backend()
    )
    kek = kdf.derive(access_key.encode())
    
    # Decrypt CEK
    aesgcm_kek = AESGCM(kek)
    try:
        cek = aesgcm_kek.decrypt(nonce_kek, ciphertext_cek, None)
        print("Content Encryption Key (CEK) successfully decrypted.")
    except Exception as e:
        print("Failed to decrypt key. Incorrect Access Key?")
        return

    # 4. Decrypt vault.enc
    with open("temp_extracted/vault.enc", "rb") as f:
        vault_enc_data = f.read()
        
    # Format of vault.enc: [Nonce (12 bytes)] [Ciphertext (Payload + Tag)]
    nonce_vault = vault_enc_data[:12]
    ciphertext_vault = vault_enc_data[12:]
    
    aesgcm_cek = AESGCM(cek)
    try:
        decrypted_data = aesgcm_cek.decrypt(nonce_vault, ciphertext_vault, None)
        print("Vault payload successfully decrypted.")
    except Exception as e:
        print("Failed to decrypt vault payload.")
        return
        
    # 5. Extract Documents
    vault_content = json.loads(decrypted_data)
    documents = vault_content.get("documents", [])
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    for doc in documents:
        file_name = f"{doc['title']}.{doc['mime_type'].split('/')[-1]}" # simplistic extension
        file_path = os.path.join(output_dir, file_name)
        
        file_data = base64.b64decode(doc['file_data'])
        with open(file_path, "wb") as f:
            f.write(file_data)
            print(f"Restored: {file_name}")

    print("Recovery Complete.")

# Example Usage (Commented out)
# decrypt_vault("my_archive.afterme", "my-secret-access-key", "restored_docs")
