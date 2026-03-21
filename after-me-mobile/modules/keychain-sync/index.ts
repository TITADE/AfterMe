import { requireNativeModule } from 'expo-modules-core';

const KeychainSyncModule = requireNativeModule('KeychainSync');

export async function setVaultKeyBackup(keyBase64: string): Promise<void> {
  return KeychainSyncModule.setVaultKeyBackup(keyBase64);
}

export async function getVaultKeyBackup(): Promise<string | null> {
  return KeychainSyncModule.getVaultKeyBackup();
}

export async function deleteVaultKeyBackup(): Promise<void> {
  return KeychainSyncModule.deleteVaultKeyBackup();
}
