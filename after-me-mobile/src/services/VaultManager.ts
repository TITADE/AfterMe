/**
 * VaultManager — manages multiple vaults for the Family plan.
 * Each vault has its own encryption key, storage directory, and metadata.
 * The "default" vault is the user's personal vault created during onboarding.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  documentDirectory,
  makeDirectoryAsync,
  getInfoAsync,
  readDirectoryAsync,
  deleteAsync,
} from 'expo-file-system/legacy';
import { CryptoService } from '../core/crypto/CryptoService';

const VAULTS_KEY = 'afterme_vaults';
const ACTIVE_VAULT_KEY = 'afterme_active_vault';
const DEFAULT_VAULT_ID = 'default';

export interface VaultInfo {
  id: string;
  name: string;
  createdAt: string;
  isDefault: boolean;
  documentCount: number;
  sizeBytes: number;
}

interface VaultRecord {
  id: string;
  name: string;
  createdAt: string;
}

export class VaultManager {
  static async getAllVaults(): Promise<VaultInfo[]> {
    const records = await this.getVaultRecords();
    const result: VaultInfo[] = [];

    for (const record of records) {
      const vaultDir = this.getVaultDirectory(record.id);
      let sizeBytes = 0;
      let documentCount = 0;

      try {
        const dirInfo = await getInfoAsync(vaultDir);
        if (dirInfo.exists) {
          const files = await readDirectoryAsync(vaultDir);
          documentCount = files.filter((f) => f.endsWith('.enc') && !f.startsWith('thumb_')).length;
          for (const file of files) {
            const fileInfo = await getInfoAsync(`${vaultDir}${file}`);
            if (fileInfo.exists && 'size' in fileInfo) {
              sizeBytes += (fileInfo as { size: number }).size;
            }
          }
        }
      } catch {
        // vault directory might not exist yet
      }

      result.push({
        id: record.id,
        name: record.name,
        createdAt: record.createdAt,
        isDefault: record.id === DEFAULT_VAULT_ID,
        documentCount,
        sizeBytes,
      });
    }

    return result;
  }

  static async getActiveVaultId(): Promise<string> {
    const active = await AsyncStorage.getItem(ACTIVE_VAULT_KEY);
    return active || DEFAULT_VAULT_ID;
  }

  static async setActiveVault(vaultId: string): Promise<void> {
    const records = await this.getVaultRecords();
    if (!records.find((r) => r.id === vaultId)) {
      throw new Error('Vault not found');
    }
    await AsyncStorage.setItem(ACTIVE_VAULT_KEY, vaultId);
  }

  static async createVault(name: string): Promise<VaultInfo> {
    const records = await this.getVaultRecords();

    if (records.length >= 5) {
      throw new Error('Maximum of 5 vaults reached.');
    }

    const id = CryptoService.generateSecureId('vault');
    const vaultDir = this.getVaultDirectory(id);
    await makeDirectoryAsync(vaultDir, { intermediates: true });

    const newRecord: VaultRecord = {
      id,
      name,
      createdAt: new Date().toISOString(),
    };

    records.push(newRecord);
    await this.saveVaultRecords(records);

    return {
      id,
      name,
      createdAt: newRecord.createdAt,
      isDefault: false,
      documentCount: 0,
      sizeBytes: 0,
    };
  }

  static async renameVault(vaultId: string, newName: string): Promise<void> {
    const records = await this.getVaultRecords();
    const record = records.find((r) => r.id === vaultId);
    if (!record) throw new Error('Vault not found');
    record.name = newName;
    await this.saveVaultRecords(records);
  }

  static async deleteVault(vaultId: string): Promise<void> {
    if (vaultId === DEFAULT_VAULT_ID) {
      throw new Error('Cannot delete the default vault.');
    }

    const records = await this.getVaultRecords();
    const filtered = records.filter((r) => r.id !== vaultId);

    if (filtered.length === records.length) {
      throw new Error('Vault not found');
    }

    const vaultDir = this.getVaultDirectory(vaultId);
    await deleteAsync(vaultDir, { idempotent: true });

    await this.saveVaultRecords(filtered);

    const activeId = await this.getActiveVaultId();
    if (activeId === vaultId) {
      await AsyncStorage.setItem(ACTIVE_VAULT_KEY, DEFAULT_VAULT_ID);
    }
  }

  static getVaultDirectory(vaultId: string): string {
    if (vaultId === DEFAULT_VAULT_ID) {
      return `${documentDirectory}vault/`;
    }
    return `${documentDirectory}vaults/${vaultId}/`;
  }

  private static async getVaultRecords(): Promise<VaultRecord[]> {
    const raw = await AsyncStorage.getItem(VAULTS_KEY);
    if (!raw) {
      const defaultRecords: VaultRecord[] = [{
        id: DEFAULT_VAULT_ID,
        name: 'My Vault',
        createdAt: new Date().toISOString(),
      }];
      await this.saveVaultRecords(defaultRecords);
      return defaultRecords;
    }
    try {
      const records = JSON.parse(raw) as VaultRecord[];
      if (!records.find((r) => r.id === DEFAULT_VAULT_ID)) {
        records.unshift({
          id: DEFAULT_VAULT_ID,
          name: 'My Vault',
          createdAt: new Date().toISOString(),
        });
        await this.saveVaultRecords(records);
      }
      return records;
    } catch {
      const defaultRecords: VaultRecord[] = [{
        id: DEFAULT_VAULT_ID,
        name: 'My Vault',
        createdAt: new Date().toISOString(),
      }];
      await this.saveVaultRecords(defaultRecords);
      return defaultRecords;
    }
  }

  private static async saveVaultRecords(records: VaultRecord[]): Promise<void> {
    await AsyncStorage.setItem(VAULTS_KEY, JSON.stringify(records));
  }
}
