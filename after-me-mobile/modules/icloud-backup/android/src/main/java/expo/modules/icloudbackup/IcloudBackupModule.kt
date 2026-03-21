package expo.modules.icloudbackup

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class IcloudBackupModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("IcloudBackup")

    // iCloud is an Apple-only feature. Android stubs return safe defaults.

    AsyncFunction("getUbiquityContainerPath") {
      null
    }

    AsyncFunction("isICloudAvailable") {
      false
    }

    AsyncFunction("writeToICloud") { _: String, _: String ->
      false
    }

    AsyncFunction("readFromICloud") { _: String ->
      null
    }

    AsyncFunction("deleteFromICloud") { _: String ->
      false
    }

    AsyncFunction("listICloudFiles") { _: String ->
      emptyList<String>()
    }
  }
}
