import ExpoModulesCore
import Security

// MARK: - Keychain Accessibility Design Notes
//
// This module stores the vault key backup in iCloud Keychain with
// kSecAttrSynchronizable = true, enabling automatic migration when the
// user signs into the same Apple ID on a new device.
//
// Accessibility level: kSecAttrAccessibleAfterFirstUnlock
//
// We intentionally do NOT use kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly
// here because iCloud Keychain sync (kSecAttrSynchronizable) requires a
// broader accessibility class. Items marked "ThisDeviceOnly" are excluded
// from iCloud Keychain sync by the system, which would defeat the purpose
// of this module.
//
// The LOCAL vault key stored by expo-secure-store uses the stricter
// WHEN_PASSCODE_SET_THIS_DEVICE_ONLY with biometric authentication.
// This iCloud Keychain backup is deliberately less restrictive than
// that primary copy. This trade-off is acceptable because:
//
//   (a) iCloud Keychain itself is protected by the user's Apple ID
//       credentials plus the device passcode — Apple encrypts the
//       keychain end-to-end in transit and at rest.
//   (b) The backup is only used for device migration scenarios (new
//       iPhone, factory reset). It is not the day-to-day access path.
//   (c) Primary protection of the vault comes from the local
//       SecureStore entry, which requires biometrics on every access.
//       The iCloud Keychain copy is a recovery convenience, not the
//       security boundary.

/**
 * Stores and retrieves vault key backup in iCloud Keychain.
 * kSecAttrSynchronizable = true enables sync across user's devices.
 * Used for device migration (e.g. new iPhone) when user signs into same iCloud.
 */
public class KeychainSyncModule: Module {
  private let service = "com.afterme.keychain.vaultbackup"
  private let account = "vault_key_backup"

  public func definition() -> ModuleDefinition {
    Name("KeychainSync")

    AsyncFunction("setVaultKeyBackup") { (keyBase64: String) async throws in
      guard let data = keyBase64.data(using: .utf8) else {
        throw NSError(domain: "KeychainSync", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid key encoding"])
      }
      var query: [String: Any] = [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrService as String: self.service,
        kSecAttrAccount as String: self.account,
        kSecAttrSynchronizable as String: true,
        kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock,
        kSecValueData as String: data,
      ]
      SecItemDelete(query as CFDictionary)
      let status = SecItemAdd(query as CFDictionary, nil)
      if status != errSecSuccess {
        throw NSError(domain: "KeychainSync", code: Int(status), userInfo: [NSLocalizedDescriptionKey: "SecItemAdd failed: \(status)"])
      }
    }

    AsyncFunction("getVaultKeyBackup") { () async throws -> String? in
      var query: [String: Any] = [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrService as String: self.service,
        kSecAttrAccount as String: self.account,
        kSecAttrSynchronizable as String: true,
        kSecReturnData as String: true,
        kSecMatchLimit as String: kSecMatchLimitOne,
      ]
      var result: AnyObject?
      let status = SecItemCopyMatching(query as CFDictionary, &result)
      if status == errSecItemNotFound {
        return nil
      }
      if status != errSecSuccess {
        throw NSError(domain: "KeychainSync", code: Int(status), userInfo: [NSLocalizedDescriptionKey: "SecItemCopyMatching failed: \(status)"])
      }
      guard let data = result as? Data, let str = String(data: data, encoding: .utf8) else {
        return nil
      }
      return str
    }

    AsyncFunction("deleteVaultKeyBackup") { () async throws in
      let query: [String: Any] = [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrService as String: self.service,
        kSecAttrAccount as String: self.account,
        kSecAttrSynchronizable as String: true,
      ]
      SecItemDelete(query as CFDictionary)
    }
  }
}
