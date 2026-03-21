/**
 * Pre-defines globals that Expo SDK 55's winter runtime tries to lazily inject.
 * This file MUST run BEFORE jest-expo's setup files.
 *
 * The expo winter runtime uses Object.defineProperty with lazy getters that
 * call require() — which fails inside Jest's module system for certain polyfills.
 * By pre-defining these globals, the lazy getters are never installed.
 */

// structuredClone is already available in Node 17+, but expo tries to polyfill it anyway.
// Ensure it's visible as an own property so expo skips it.
if (typeof globalThis.structuredClone === 'function') {
  Object.defineProperty(globalThis, 'structuredClone', {
    value: globalThis.structuredClone,
    writable: true,
    configurable: true,
    enumerable: false,
  });
}

// __ExpoImportMetaRegistry — expo's import.meta polyfill for Hermes
Object.defineProperty(globalThis, '__ExpoImportMetaRegistry', {
  value: { register() {}, get() { return {}; } },
  writable: true,
  configurable: true,
});
