import Foundation
import Security
import LocalAuthentication
import CryptoKit

enum KeyManagerError: Error {
    case secureEnclaveKeyGenerationFailed
    case vaultKeyGenerationFailed
    case keyStorageFailed
    case keyRetrievalFailed
    case decryptionFailed
    case keyNotFound
}

class KeyManager {
    static let shared = KeyManager()
    
    private let masterKeyTag = "com.afterme.keys.master"
    private let vaultKeyTag = "com.afterme.keys.vault"
    
    // 1. Generate Master Key in Secure Enclave
    func generateMasterKey() throws -> SecKey {
        // Delete existing key if any
        deleteMasterKey()
        
        let accessControlError: UnsafeMutablePointer<Unmanaged<CFError>?>? = nil
        guard let accessControl = SecAccessControlCreateWithFlags(
            kCFAllocatorDefault,
            kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly,
            .userPresence, // Requires FaceID/TouchID or Passcode
            accessControlError
        ) else {
            throw KeyManagerError.secureEnclaveKeyGenerationFailed
        }
        
        let attributes: [String: Any] = [
            kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
            kSecAttrKeySizeInBits as String: 256,
            kSecAttrTokenID as String: kSecAttrTokenIDSecureEnclave,
            kSecPrivateKeyAttrs as String: [
                kSecAttrIsPermanent as String: true,
                kSecAttrApplicationTag as String: masterKeyTag.data(using: .utf8)!,
                kSecAttrAccessControl as String: accessControl
            ]
        ]
        
        var error: Unmanaged<CFError>?
        guard let privateKey = SecKeyCreateRandomKey(attributes as CFDictionary, &error) else {
            throw KeyManagerError.secureEnclaveKeyGenerationFailed
        }
        
        return privateKey
    }
    
    // 2. Retrieve Master Key
    func getMasterKey() throws -> SecKey {
        let query: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrApplicationTag as String: masterKeyTag.data(using: .utf8)!,
            kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
            kSecReturnRef as String: true
        ]
        
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        
        guard status == errSecSuccess, let key = item as! SecKey? else {
            throw KeyManagerError.keyNotFound
        }
        
        return key
    }
    
    // 3. Generate and Store Vault Key (Wrapped)
    func generateAndStoreVaultKey() throws {
        // Generate random 32-byte Vault Key
        var vaultKey = Data(count: 32)
        let result = vaultKey.withUnsafeMutableBytes {
            SecRandomCopyBytes(kSecRandomDefault, 32, $0.baseAddress!)
        }
        guard result == errSecSuccess else { throw KeyManagerError.vaultKeyGenerationFailed }
        
        // Get Master Key (Public Key for Encryption)
        let masterKey = try getMasterKey()
        guard let publicKey = SecKeyCopyPublicKey(masterKey) else { throw KeyManagerError.keyRetrievalFailed }
        
        // Encrypt Vault Key with Master Public Key
        var error: Unmanaged<CFError>?
        guard let encryptedVaultKey = SecKeyCreateEncryptedData(
            publicKey,
            .eciesEncryptionStandardX963SHA256AESGCM,
            vaultKey as CFData,
            &error
        ) else {
            throw KeyManagerError.keyStorageFailed
        }
        
        // Store Encrypted Vault Key in Keychain
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: vaultKeyTag,
            kSecValueData as String: encryptedVaultKey
        ]
        
        SecItemDelete(query as CFDictionary) // Delete old if exists
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else { throw KeyManagerError.keyStorageFailed }
    }
    
    // 4. Retrieve and Unwrap Vault Key
    // This triggers the FaceID/TouchID prompt because accessing Master Private Key requires .userPresence
    func getVaultKey() throws -> SymmetricKey {
        // Fetch Encrypted Vault Key from Keychain
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: vaultKeyTag,
            kSecReturnData as String: true
        ]
        
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        guard status == errSecSuccess, let encryptedData = item as? Data else {
            throw KeyManagerError.keyNotFound
        }
        
        // Get Master Private Key
        let masterKey = try getMasterKey()
        
        // Decrypt Vault Key using Master Private Key (Triggers Biometrics)
        var error: Unmanaged<CFError>?
        guard let vaultKeyData = SecKeyCreateDecryptedData(
            masterKey,
            .eciesEncryptionStandardX963SHA256AESGCM,
            encryptedData as CFData,
            &error
        ) as Data? else {
            throw KeyManagerError.decryptionFailed
        }
        
        return SymmetricKey(data: vaultKeyData)
    }
    
    // Helper: Delete Keys (Reset)
    func deleteKeys() {
        deleteMasterKey()
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: vaultKeyTag
        ]
        SecItemDelete(query as CFDictionary)
    }
    
    private func deleteMasterKey() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrApplicationTag as String: masterKeyTag.data(using: .utf8)!
        ]
        SecItemDelete(query as CFDictionary)
    }
}
