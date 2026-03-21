import { requireNativeModule } from 'expo-modules-core';

const IcloudBackupModule = requireNativeModule('IcloudBackup');

/**
 * Returns the path to the iCloud Documents container, or null if unavailable.
 * On Android, always returns null.
 */
export async function getUbiquityContainerPath(): Promise<string | null> {
  return IcloudBackupModule.getUbiquityContainerPath();
}

/**
 * Writes data (base64-encoded) to a file inside the iCloud Documents container.
 * Returns true on success.
 */
export async function writeToICloud(relativePath: string, base64Data: string): Promise<boolean> {
  return IcloudBackupModule.writeToICloud(relativePath, base64Data);
}

/**
 * Reads a file from the iCloud Documents container.
 * Returns base64-encoded data, or null if the file doesn't exist.
 */
export async function readFromICloud(relativePath: string): Promise<string | null> {
  return IcloudBackupModule.readFromICloud(relativePath);
}

/**
 * Deletes a file from the iCloud Documents container.
 */
export async function deleteFromICloud(relativePath: string): Promise<boolean> {
  return IcloudBackupModule.deleteFromICloud(relativePath);
}

/**
 * Checks if iCloud is available (user signed in, container accessible).
 */
export async function isICloudAvailable(): Promise<boolean> {
  return IcloudBackupModule.isICloudAvailable();
}

/**
 * Lists files at a relative path inside the iCloud Documents container.
 */
export async function listICloudFiles(relativePath: string): Promise<string[]> {
  return IcloudBackupModule.listICloudFiles(relativePath);
}
