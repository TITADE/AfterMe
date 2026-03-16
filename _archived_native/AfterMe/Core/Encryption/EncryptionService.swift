import Foundation
import CryptoKit

enum EncryptionError: Error {
    case encryptionFailed
    case decryptionFailed
    case keyUnavailable
    case invalidDataFormat
}

class EncryptionService {
    static let shared = EncryptionService()
    
    // Encrypt Data
    func encrypt(_ data: Data) throws -> Data {
        // 1. Get Vault Key (Triggers Biometric Prompt if not cached)
        // Note: In a real app, we might cache the key in memory after first unlock
        let key = try KeyManager.shared.getVaultKey()
        
        // 2. Encrypt
        do {
            let sealedBox = try AES.GCM.seal(data, using: key)
            guard let combinedData = sealedBox.combined else {
                throw EncryptionError.encryptionFailed
            }
            return combinedData
        } catch {
            throw EncryptionError.encryptionFailed
        }
    }
    
    // Decrypt Data
    func decrypt(_ data: Data) throws -> Data {
        // 1. Get Vault Key
        let key = try KeyManager.shared.getVaultKey()
        
        // 2. Decrypt
        do {
            let sealedBox = try AES.GCM.SealedBox(combined: data)
            let decryptedData = try AES.GCM.open(sealedBox, using: key)
            return decryptedData
        } catch {
            throw EncryptionError.decryptionFailed
        }
    }
    
    // Encrypt File
    func encryptFile(at sourceURL: URL, to destinationURL: URL) throws {
        let data = try Data(contentsOf: sourceURL)
        let encryptedData = try encrypt(data)
        try encryptedData.write(to: destinationURL)
    }
    
    // Decrypt File
    func decryptFile(at sourceURL: URL, to destinationURL: URL) throws {
        let data = try Data(contentsOf: sourceURL)
        let decryptedData = try decrypt(data)
        try decryptedData.write(to: destinationURL)
    }
}
