/**
 * Global test setup — mocks for native modules that don't exist in the Jest environment.
 * This file runs BEFORE each test suite via jest.config.ts `setupFiles`.
 */

// ── Expo winter runtime (must come first) ──
// Expo SDK 55 lazily defines several globals via Object.defineProperty getters
// that trigger require() calls which fail in Jest. Pre-define them all so
// the lazy getters never fire.
const expoGlobals: Record<string, unknown> = {
  __ExpoImportMetaRegistry: { register: () => {}, get: () => ({}) },
};
for (const [key, value] of Object.entries(expoGlobals)) {
  Object.defineProperty(globalThis, key, { value, writable: true, configurable: true });
}

// Mock the entire expo winter runtime module to prevent it from running
jest.mock('expo/src/winter/runtime.native', () => ({}));
jest.mock('expo/src/winter/runtime', () => ({}));
jest.mock('expo/src/winter/installGlobal', () => ({
  installGlobal: jest.fn(),
}));
jest.mock('expo/src/winter/FormData', () => ({
  installFormDataPatch: jest.fn(),
}));

// ── react-native-nitro-modules (must come before react-native-quick-crypto) ──
jest.mock('react-native-nitro-modules', () => ({}));

// ── react-native-quick-crypto (uses Node crypto under the hood in tests) ──
jest.mock('react-native-quick-crypto', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockCrypto = require('crypto');
  return {
    __esModule: true,
    default: {
      randomBytes: (size: number) => mockCrypto.randomBytes(size),
      createCipheriv: (alg: string, key: Buffer, iv: Buffer) =>
        mockCrypto.createCipheriv(alg, key, iv),
      createDecipheriv: (alg: string, key: Buffer, iv: Buffer) =>
        mockCrypto.createDecipheriv(alg, key, iv),
      pbkdf2Sync: (
        password: string,
        salt: Buffer,
        iterations: number,
        keyLen: number,
        digest: string,
      ) => mockCrypto.pbkdf2Sync(password, salt, iterations, keyLen, digest),
    },
  };
});

// ── AsyncStorage ──
const asyncStore: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn((key: string) => Promise.resolve(asyncStore[key] ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      asyncStore[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      delete asyncStore[key];
      return Promise.resolve();
    }),
    multiRemove: jest.fn((keys: string[]) => {
      keys.forEach((k) => delete asyncStore[k]);
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      Object.keys(asyncStore).forEach((k) => delete asyncStore[k]);
      return Promise.resolve();
    }),
    getAllKeys: jest.fn(() => Promise.resolve(Object.keys(asyncStore))),
    _store: asyncStore,
  },
}));

// ── expo-secure-store ──
const secureStoreData: Record<string, string> = {};
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn((key: string, _opts?: unknown) =>
    Promise.resolve(secureStoreData[key] ?? null),
  ),
  setItemAsync: jest.fn((key: string, value: string) => {
    secureStoreData[key] = value;
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn((key: string) => {
    delete secureStoreData[key];
    return Promise.resolve();
  }),
  AFTER_FIRST_UNLOCK: 6,
  _store: secureStoreData,
}));

// ── expo-local-authentication ──
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  authenticateAsync: jest.fn(() =>
    Promise.resolve({ success: true, error: null }),
  ),
}));

// ── expo-file-system/legacy ──
jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: '/mock/documents/',
  cacheDirectory: '/mock/cache/',
  readAsStringAsync: jest.fn(() => Promise.resolve('')),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, size: 1024 })),
  deleteAsync: jest.fn(() => Promise.resolve()),
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  readDirectoryAsync: jest.fn(() => Promise.resolve([])),
  moveAsync: jest.fn(() => Promise.resolve()),
  EncodingType: { Base64: 'base64', UTF8: 'utf8' },
}));

// ── expo-image-manipulator ──
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(() => Promise.resolve({ uri: '/mock/thumb.jpg' })),
  SaveFormat: { JPEG: 'jpeg', PNG: 'png' },
}));

// ── expo-sqlite ──
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() =>
    Promise.resolve({
      runAsync: jest.fn(() => Promise.resolve()),
      getFirstAsync: jest.fn(() => Promise.resolve(null)),
      getAllAsync: jest.fn(() => Promise.resolve([])),
      withExclusiveTransactionAsync: jest.fn(
        async (cb: (txn: unknown) => Promise<void>) => {
          await cb({
            runAsync: jest.fn(() => Promise.resolve()),
            getFirstAsync: jest.fn(() => Promise.resolve(null)),
            getAllAsync: jest.fn(() => Promise.resolve([])),
          });
        },
      ),
    }),
  ),
}));

// ── expo-constants ──
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: { version: '1.0.0-test', name: 'After Me' },
  },
}));

// ── @sentry/react-native ──
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  withScope: jest.fn((cb: (scope: unknown) => void) => {
    cb({ setTag: jest.fn(), setLevel: jest.fn() });
  }),
  startSpan: jest.fn((_: unknown, cb: () => unknown) => cb()),
}));

// ── keychain-sync ──
jest.mock('keychain-sync', () => ({
  setVaultKeyBackup: jest.fn(() => Promise.resolve()),
  getVaultKeyBackup: jest.fn(() => Promise.resolve(null)),
  deleteVaultKeyBackup: jest.fn(() => Promise.resolve()),
}));

// ── native modules (virtual) ──
jest.mock('../../modules/storekit', () => ({
  getProducts: jest.fn(() => Promise.resolve([])),
  purchase: jest.fn(() =>
    Promise.resolve({ status: 'success', transactionId: 'tx_123' }),
  ),
  getPurchasedProducts: jest.fn(() => Promise.resolve([])),
  restore: jest.fn(() => Promise.resolve()),
}), { virtual: true });

jest.mock('../../modules/icloud-backup', () => ({
  isICloudAvailable: jest.fn(() => Promise.resolve(false)),
  writeToICloud: jest.fn(() => Promise.resolve(true)),
  readFromICloud: jest.fn(() => Promise.resolve(null)),
  deleteFromICloud: jest.fn(() => Promise.resolve(true)),
  listICloudFiles: jest.fn(() => Promise.resolve([])),
}), { virtual: true });

// ── expo-haptics ──
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// ── react-native Modal (avoids loading native component ESM chain) ──
jest.mock('react-native/Libraries/Modal/Modal', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) =>
      props.visible ? React.createElement('View', null, props.children as React.ReactNode) : null,
  };
});

// ── react-native platform ──
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn((specifics: Record<string, unknown>) => specifics.ios),
}));

// Silence console.warn during tests (runs before jest globals are available in setupFiles)
console.warn = () => {};
