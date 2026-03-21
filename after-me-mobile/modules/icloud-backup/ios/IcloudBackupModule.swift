import ExpoModulesCore
import Foundation

public class IcloudBackupModule: Module {
  public func definition() -> ModuleDefinition {
    Name("IcloudBackup")

    AsyncFunction("getUbiquityContainerPath") { () async -> String? in
      guard let url = FileManager.default.url(forUbiquityContainerIdentifier: nil)?
        .appendingPathComponent("Documents") else {
        return nil
      }
      if !FileManager.default.fileExists(atPath: url.path) {
        try? FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
      }
      return url.path
    }

    AsyncFunction("isICloudAvailable") { () async -> Bool in
      return FileManager.default.ubiquityIdentityToken != nil
    }

    AsyncFunction("writeToICloud") { (relativePath: String, base64Data: String) async throws -> Bool in
      guard let containerUrl = FileManager.default.url(forUbiquityContainerIdentifier: nil)?
        .appendingPathComponent("Documents") else {
        throw NSError(
          domain: "IcloudBackup",
          code: 1,
          userInfo: [NSLocalizedDescriptionKey: "iCloud container unavailable"]
        )
      }

      let fileUrl = containerUrl.appendingPathComponent(relativePath)
      let directory = fileUrl.deletingLastPathComponent()

      if !FileManager.default.fileExists(atPath: directory.path) {
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
      }

      guard let data = Data(base64Encoded: base64Data) else {
        throw NSError(
          domain: "IcloudBackup",
          code: 2,
          userInfo: [NSLocalizedDescriptionKey: "Invalid base64 data"]
        )
      }

      try data.write(to: fileUrl, options: .atomic)
      return true
    }

    AsyncFunction("readFromICloud") { (relativePath: String) async throws -> String? in
      guard let containerUrl = FileManager.default.url(forUbiquityContainerIdentifier: nil)?
        .appendingPathComponent("Documents") else {
        return nil
      }

      let fileUrl = containerUrl.appendingPathComponent(relativePath)

      guard FileManager.default.fileExists(atPath: fileUrl.path) else {
        return nil
      }

      let data = try Data(contentsOf: fileUrl)
      return data.base64EncodedString()
    }

    AsyncFunction("deleteFromICloud") { (relativePath: String) async throws -> Bool in
      guard let containerUrl = FileManager.default.url(forUbiquityContainerIdentifier: nil)?
        .appendingPathComponent("Documents") else {
        return false
      }

      let fileUrl = containerUrl.appendingPathComponent(relativePath)

      guard FileManager.default.fileExists(atPath: fileUrl.path) else {
        return true
      }

      try FileManager.default.removeItem(at: fileUrl)
      return true
    }

    AsyncFunction("listICloudFiles") { (relativePath: String) async throws -> [String] in
      guard let containerUrl = FileManager.default.url(forUbiquityContainerIdentifier: nil)?
        .appendingPathComponent("Documents") else {
        return []
      }

      let dirUrl = containerUrl.appendingPathComponent(relativePath)

      guard FileManager.default.fileExists(atPath: dirUrl.path) else {
        return []
      }

      let contents = try FileManager.default.contentsOfDirectory(
        at: dirUrl,
        includingPropertiesForKeys: nil,
        options: [.skipsHiddenFiles]
      )
      return contents.map { $0.lastPathComponent }
    }
  }
}
