package expo.modules.keychainsync

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * iCloud Keychain sync is iOS-only. On Android, this module provides no-op stubs.
 * Android device migration would use a different mechanism (e.g. encrypted backup file).
 */
class KeychainSyncModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("KeychainSync")

    AsyncFunction("setVaultKeyBackup") { _keyBase64: String ->
      // No-op on Android; iCloud Keychain is iOS-specific
    }

    AsyncFunction("getVaultKeyBackup") {
      null as String?
    }

    AsyncFunction("deleteVaultKeyBackup") {
      // No-op on Android
    }
  }
}
