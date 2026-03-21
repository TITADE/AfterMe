import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  deleteAsync,
  getInfoAsync,
  makeDirectoryAsync,
  readDirectoryAsync,
} from 'expo-file-system/legacy';
import { VaultManager } from '../services/VaultManager';

jest.mock('../core/crypto/CryptoService', () => {
  let counter = 0;
  return {
    CryptoService: {
      generateSecureId: jest.fn((prefix: string) => `${prefix}_id${++counter}`),
    },
  };
});

jest.mock('../services/SentryService', () => ({
  captureVaultError: jest.fn(),
  traceVaultOperation: jest.fn((_name: string, fn: () => Promise<unknown>) => fn()),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockGetInfoAsync = getInfoAsync as jest.Mock;
const mockReadDirectoryAsync = readDirectoryAsync as jest.Mock;
const mockDeleteAsync = deleteAsync as jest.Mock;
const mockMakeDirectoryAsync = makeDirectoryAsync as jest.Mock;

const VAULTS_KEY = 'afterme_vaults';
const ACTIVE_VAULT_KEY = 'afterme_active_vault';

describe('VaultManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage as any)._store &&
      Object.keys((AsyncStorage as any)._store).forEach(
        (k) => delete (AsyncStorage as any)._store[k],
      );
    mockGetInfoAsync.mockResolvedValue({ exists: false });
    mockReadDirectoryAsync.mockResolvedValue([]);
  });

  describe('getActiveVaultId', () => {
    it('returns "default" when no active vault is set', async () => {
      const id = await VaultManager.getActiveVaultId();
      expect(id).toBe('default');
    });

    it('returns stored vault ID when set', async () => {
      await AsyncStorage.setItem(ACTIVE_VAULT_KEY, 'vault_custom');
      const id = await VaultManager.getActiveVaultId();
      expect(id).toBe('vault_custom');
    });
  });

  describe('setActiveVault', () => {
    it('stores vault ID for an existing vault', async () => {
      const records = [
        { id: 'default', name: 'My Vault', createdAt: '2024-01-01T00:00:00.000Z' },
        { id: 'vault_2', name: 'Family', createdAt: '2024-06-01T00:00:00.000Z' },
      ];
      await AsyncStorage.setItem(VAULTS_KEY, JSON.stringify(records));

      await VaultManager.setActiveVault('vault_2');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(ACTIVE_VAULT_KEY, 'vault_2');
    });

    it('throws for non-existent vault', async () => {
      await expect(VaultManager.setActiveVault('nonexistent')).rejects.toThrow(
        'Vault not found',
      );
    });
  });

  describe('createVault', () => {
    it('creates a new vault with unique ID', async () => {
      const result = await VaultManager.createVault('Work Vault');

      expect(result.id).toMatch(/^vault_id/);
      expect(result.name).toBe('Work Vault');
      expect(result.isDefault).toBe(false);
      expect(result.documentCount).toBe(0);
      expect(mockMakeDirectoryAsync).toHaveBeenCalledWith(
        expect.stringContaining('vaults/'),
        { intermediates: true },
      );
    });

    it('throws when 5 vaults already exist', async () => {
      const records = Array.from({ length: 5 }, (_, i) => ({
        id: i === 0 ? 'default' : `vault_${i}`,
        name: `Vault ${i}`,
        createdAt: '2024-01-01T00:00:00.000Z',
      }));
      await AsyncStorage.setItem(VAULTS_KEY, JSON.stringify(records));

      await expect(VaultManager.createVault('Sixth')).rejects.toThrow(
        'Maximum of 5 vaults reached',
      );
    });
  });

  describe('renameVault', () => {
    it('updates the vault name', async () => {
      const records = [
        { id: 'default', name: 'My Vault', createdAt: '2024-01-01T00:00:00.000Z' },
        { id: 'vault_x', name: 'Old Name', createdAt: '2024-06-01T00:00:00.000Z' },
      ];
      await AsyncStorage.setItem(VAULTS_KEY, JSON.stringify(records));

      await VaultManager.renameVault('vault_x', 'New Name');

      const saved = JSON.parse(
        (await AsyncStorage.getItem(VAULTS_KEY))!,
      );
      const renamed = saved.find((r: { id: string }) => r.id === 'vault_x');
      expect(renamed.name).toBe('New Name');
    });

    it('throws for non-existent vault', async () => {
      await expect(
        VaultManager.renameVault('nonexistent', 'Name'),
      ).rejects.toThrow('Vault not found');
    });
  });

  describe('deleteVault', () => {
    beforeEach(async () => {
      const records = [
        { id: 'default', name: 'My Vault', createdAt: '2024-01-01T00:00:00.000Z' },
        { id: 'vault_del', name: 'To Delete', createdAt: '2024-06-01T00:00:00.000Z' },
      ];
      await AsyncStorage.setItem(VAULTS_KEY, JSON.stringify(records));
    });

    it('removes vault and deletes files', async () => {
      await VaultManager.deleteVault('vault_del');

      expect(mockDeleteAsync).toHaveBeenCalledWith(
        expect.stringContaining('vaults/vault_del/'),
        { idempotent: true },
      );

      const saved = JSON.parse(
        (await AsyncStorage.getItem(VAULTS_KEY))!,
      );
      expect(saved.find((r: { id: string }) => r.id === 'vault_del')).toBeUndefined();
    });

    it('throws when trying to delete default vault', async () => {
      await expect(VaultManager.deleteVault('default')).rejects.toThrow(
        'Cannot delete the default vault',
      );
    });

    it('switches to default if deleted vault was active', async () => {
      await AsyncStorage.setItem(ACTIVE_VAULT_KEY, 'vault_del');

      await VaultManager.deleteVault('vault_del');

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        ACTIVE_VAULT_KEY,
        'default',
      );
    });

    it('does not switch active vault if a different vault was active', async () => {
      await AsyncStorage.setItem(ACTIVE_VAULT_KEY, 'default');
      jest.clearAllMocks();

      await VaultManager.deleteVault('vault_del');

      const activeVaultCalls = mockAsyncStorage.setItem.mock.calls.filter(
        (call) => call[0] === ACTIVE_VAULT_KEY,
      );
      expect(activeVaultCalls).toHaveLength(0);
    });

    it('throws when vault ID does not exist in records', async () => {
      await expect(VaultManager.deleteVault('nonexistent')).rejects.toThrow(
        'Vault not found',
      );
    });
  });

  describe('getAllVaults', () => {
    it('always includes default vault even with empty storage', async () => {
      const vaults = await VaultManager.getAllVaults();

      expect(vaults.length).toBeGreaterThanOrEqual(1);
      const defaultVault = vaults.find((v) => v.id === 'default');
      expect(defaultVault).toBeDefined();
      expect(defaultVault!.isDefault).toBe(true);
    });

    it('returns all stored vaults with metadata', async () => {
      const records = [
        { id: 'default', name: 'My Vault', createdAt: '2024-01-01T00:00:00.000Z' },
        { id: 'vault_2', name: 'Work', createdAt: '2024-06-01T00:00:00.000Z' },
      ];
      await AsyncStorage.setItem(VAULTS_KEY, JSON.stringify(records));

      mockGetInfoAsync.mockResolvedValue({ exists: false });

      const vaults = await VaultManager.getAllVaults();

      expect(vaults).toHaveLength(2);
      expect(vaults[0].name).toBe('My Vault');
      expect(vaults[1].name).toBe('Work');
    });

    it('calculates document count and size when vault directory exists', async () => {
      mockGetInfoAsync.mockResolvedValue({ exists: true, size: 1024 });
      mockReadDirectoryAsync.mockResolvedValue([
        'doc1.enc',
        'doc2.enc',
        'thumb.jpg',
      ]);

      const vaults = await VaultManager.getAllVaults();
      const defaultVault = vaults.find((v) => v.id === 'default');
      expect(defaultVault!.documentCount).toBe(2);
      expect(defaultVault!.sizeBytes).toBe(3072);
    });

    it('handles corrupted JSON in storage gracefully', async () => {
      await AsyncStorage.setItem(VAULTS_KEY, 'not-valid-json{{{');
      const vaults = await VaultManager.getAllVaults();
      expect(vaults).toHaveLength(1);
      expect(vaults[0].id).toBe('default');
      expect(vaults[0].name).toBe('My Vault');
    });
  });

  describe('getVaultDirectory', () => {
    it('returns vault/ path for default vault', () => {
      const dir = VaultManager.getVaultDirectory('default');
      expect(dir).toBe('/mock/documents/vault/');
    });

    it('returns vaults/<id>/ path for custom vault', () => {
      const dir = VaultManager.getVaultDirectory('vault_custom');
      expect(dir).toBe('/mock/documents/vaults/vault_custom/');
    });
  });
});
