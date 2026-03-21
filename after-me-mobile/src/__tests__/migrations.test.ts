jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: '/mock/documents/',
  cacheDirectory: '/mock/cache/',
  readAsStringAsync: jest.fn(() => Promise.resolve('')),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: false })),
  deleteAsync: jest.fn(() => Promise.resolve()),
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  readDirectoryAsync: jest.fn(() => Promise.resolve([])),
  moveAsync: jest.fn(() => Promise.resolve()),
  copyAsync: jest.fn(() => Promise.resolve()),
  EncodingType: { Base64: 'base64', UTF8: 'utf8' },
}));

import { runMigrations, checkAndRecoverMigrationFailure } from '../db/migrations';

const mockFS = jest.requireMock('expo-file-system/legacy') as {
  getInfoAsync: jest.Mock;
  readAsStringAsync: jest.Mock;
  writeAsStringAsync: jest.Mock;
  deleteAsync: jest.Mock;
  copyAsync: jest.Mock;
  makeDirectoryAsync: jest.Mock;
};

function makeMockDb(userVersion = 0) {
  return {
    getFirstAsync: jest.fn(() => Promise.resolve({ user_version: userVersion })),
    execAsync: jest.fn(() => Promise.resolve()),
    runAsync: jest.fn(() => Promise.resolve()),
    getAllAsync: jest.fn(() => Promise.resolve([])),
  };
}

describe('migrations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFS.getInfoAsync.mockResolvedValue({ exists: false });
  });

  describe('runMigrations', () => {
    it('skips when DB is at current version', async () => {
      const db = makeMockDb(1);

      await runMigrations(db as any);

      expect(db.execAsync).not.toHaveBeenCalled();
    });

    it('executes pending SQL statements', async () => {
      const db = makeMockDb(0);

      await runMigrations(db as any);

      expect(db.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS documents'),
      );
      expect(db.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('idx_documents_category'),
      );
    });

    it('sets PRAGMA user_version after each migration', async () => {
      const db = makeMockDb(0);

      await runMigrations(db as any);

      expect(db.execAsync).toHaveBeenCalledWith('PRAGMA user_version = 1');
    });

    it('cleans up lock file on success', async () => {
      const db = makeMockDb(0);

      await runMigrations(db as any);

      expect(mockFS.deleteAsync).toHaveBeenCalledWith(
        expect.stringContaining('afterme_migration_in_progress.txt'),
        { idempotent: true },
      );
    });

    it('preserves lock file on failure', async () => {
      const db = makeMockDb(0);
      db.execAsync.mockRejectedValueOnce(new Error('SQL error'));

      await expect(runMigrations(db as any)).rejects.toThrow('SQL error');

      const deleteCalls = mockFS.deleteAsync.mock.calls.filter((call: unknown[]) =>
        (call[0] as string).includes('afterme_migration_in_progress'),
      );
      expect(deleteCalls).toHaveLength(0);
    });

    it('creates backup before migration and cleans up on success', async () => {
      const db = makeMockDb(0);

      mockFS.getInfoAsync
        .mockResolvedValueOnce({ exists: true })
        .mockResolvedValueOnce({ exists: true });

      await runMigrations(db as any);

      expect(mockFS.copyAsync).toHaveBeenCalledWith({
        from: '/mock/documents/SQLite/afterme-vault.db',
        to: expect.stringContaining('migration_backup/afterme-vault.db.bak.'),
      });

      expect(mockFS.deleteAsync).toHaveBeenCalledWith(
        expect.stringContaining('migration_backup/afterme-vault.db.bak.'),
        { idempotent: true },
      );
    });

    it('creates backup directory if it does not exist', async () => {
      const db = makeMockDb(0);

      mockFS.getInfoAsync
        .mockResolvedValueOnce({ exists: true })
        .mockResolvedValueOnce({ exists: false });

      await runMigrations(db as any);

      expect(mockFS.makeDirectoryAsync).toHaveBeenCalledWith(
        '/mock/documents/migration_backup',
        { intermediates: true },
      );
    });

    it('skips backup when DB file does not exist', async () => {
      const db = makeMockDb(0);

      await runMigrations(db as any);

      expect(mockFS.copyAsync).not.toHaveBeenCalled();
    });

    it('proceeds with migration when backup creation fails', async () => {
      const db = makeMockDb(0);

      mockFS.getInfoAsync
        .mockResolvedValueOnce({ exists: true })
        .mockResolvedValueOnce({ exists: true });
      mockFS.copyAsync.mockRejectedValueOnce(new Error('disk full'));

      await runMigrations(db as any);

      expect(db.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE'),
      );
    });
  });

  describe('checkAndRecoverMigrationFailure', () => {
    it('does nothing when no lock file exists', async () => {
      mockFS.getInfoAsync.mockResolvedValueOnce({ exists: false });

      await checkAndRecoverMigrationFailure();

      expect(mockFS.copyAsync).not.toHaveBeenCalled();
      expect(mockFS.deleteAsync).not.toHaveBeenCalled();
    });

    it('restores from backup when lock exists with backup path', async () => {
      mockFS.getInfoAsync
        .mockResolvedValueOnce({ exists: true })
        .mockResolvedValueOnce({ exists: true })
        .mockResolvedValueOnce({ exists: true });

      mockFS.readAsStringAsync.mockResolvedValueOnce(
        JSON.stringify({
          targetVersion: 1,
          backupPath: '/mock/documents/migration_backup/afterme-vault.db.bak.123',
        }),
      );

      await checkAndRecoverMigrationFailure();

      expect(mockFS.copyAsync).toHaveBeenCalledWith({
        from: '/mock/documents/migration_backup/afterme-vault.db.bak.123',
        to: '/mock/documents/SQLite/afterme-vault.db',
      });
    });

    it('cleans up lock and backup after recovery', async () => {
      mockFS.getInfoAsync
        .mockResolvedValueOnce({ exists: true })
        .mockResolvedValueOnce({ exists: true })
        .mockResolvedValueOnce({ exists: true });

      mockFS.readAsStringAsync.mockResolvedValueOnce(
        JSON.stringify({
          targetVersion: 1,
          backupPath: '/mock/documents/migration_backup/afterme-vault.db.bak.123',
        }),
      );

      await checkAndRecoverMigrationFailure();

      expect(mockFS.deleteAsync).toHaveBeenCalledWith(
        expect.stringContaining('afterme_migration_in_progress.txt'),
        { idempotent: true },
      );
      expect(mockFS.deleteAsync).toHaveBeenCalledWith(
        '/mock/documents/migration_backup/afterme-vault.db.bak.123',
        { idempotent: true },
      );
    });

    it('deletes lock and warns when backupPath is empty', async () => {
      mockFS.getInfoAsync.mockResolvedValueOnce({ exists: true });
      mockFS.readAsStringAsync.mockResolvedValueOnce(
        JSON.stringify({ targetVersion: 1, backupPath: '' }),
      );

      await checkAndRecoverMigrationFailure();

      expect(mockFS.deleteAsync).toHaveBeenCalledWith(
        expect.stringContaining('afterme_migration_in_progress.txt'),
        { idempotent: true },
      );
    });

    it('catches errors from failed restore attempt', async () => {
      mockFS.getInfoAsync
        .mockResolvedValueOnce({ exists: true })
        .mockResolvedValueOnce({ exists: true })
        .mockResolvedValueOnce({ exists: true });

      mockFS.readAsStringAsync.mockResolvedValueOnce(
        JSON.stringify({
          targetVersion: 1,
          backupPath: '/mock/documents/migration_backup/afterme-vault.db.bak.456',
        }),
      );
      mockFS.copyAsync.mockRejectedValueOnce(new Error('copy failed'));

      await checkAndRecoverMigrationFailure();

      expect(mockFS.deleteAsync).not.toHaveBeenCalled();
    });
  });
});
