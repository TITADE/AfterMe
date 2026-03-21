import { captureVaultError, traceVaultOperation, initSentry } from '../services/SentryService';
import * as Sentry from '@sentry/react-native';

describe('SentryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('captureVaultError', () => {
    it('does not throw when not initialized', () => {
      expect(() => captureVaultError(new Error('test'), 'testOp')).not.toThrow();
    });

    it('handles Error objects', () => {
      jest.resetModules();
      process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://fake@sentry.io/1';
      const fresh = require('../services/SentryService');
      const freshSentry = require('@sentry/react-native');
      fresh.initSentry();
      jest.clearAllMocks();

      const err = new Error('vault broke');
      fresh.captureVaultError(err, 'decrypt');
      expect(freshSentry.withScope).toHaveBeenCalled();
      expect(freshSentry.captureException).toHaveBeenCalledWith(err);

      delete process.env.EXPO_PUBLIC_SENTRY_DSN;
    });

    it('handles string errors', () => {
      jest.resetModules();
      process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://fake@sentry.io/1';
      const fresh = require('../services/SentryService');
      const freshSentry = require('@sentry/react-native');
      fresh.initSentry();
      jest.clearAllMocks();

      fresh.captureVaultError('something went wrong', 'encrypt');
      expect(freshSentry.withScope).toHaveBeenCalled();
      expect(freshSentry.captureMessage).toHaveBeenCalledWith('something went wrong');

      delete process.env.EXPO_PUBLIC_SENTRY_DSN;
    });
  });

  describe('traceVaultOperation', () => {
    it('returns operation result when not initialized', async () => {
      const result = await traceVaultOperation('test', async () => 42);
      expect(result).toBe(42);
    });

    it('propagates errors', async () => {
      await expect(
        traceVaultOperation('test', async () => {
          throw new Error('op failed');
        }),
      ).rejects.toThrow('op failed');
    });

    it('passes through async values', async () => {
      const obj = { key: 'value', nested: [1, 2, 3] };
      const result = await traceVaultOperation('test', async () => obj);
      expect(result).toEqual(obj);
    });

    it('calls Sentry.startSpan when initialized', async () => {
      jest.resetModules();
      process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://fake@sentry.io/1';
      const fresh = require('../services/SentryService');
      const freshSentry = require('@sentry/react-native');
      fresh.initSentry();
      jest.clearAllMocks();

      const result = await fresh.traceVaultOperation('test-op', async () => 99);
      expect(freshSentry.startSpan).toHaveBeenCalledWith(
        { name: 'test-op', op: 'vault' },
        expect.any(Function),
      );
      expect(result).toBe(99);

      delete process.env.EXPO_PUBLIC_SENTRY_DSN;
    });
  });

  describe('initSentry', () => {
    it('does not initialize without DSN', () => {
      initSentry();
      expect(Sentry.init).not.toHaveBeenCalled();
    });

    it('does not double-initialize', () => {
      jest.resetModules();
      process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://fake@sentry.io/1';
      const fresh = require('../services/SentryService');
      const freshSentry = require('@sentry/react-native');

      fresh.initSentry();
      fresh.initSentry();
      expect(freshSentry.init).toHaveBeenCalledTimes(1);

      delete process.env.EXPO_PUBLIC_SENTRY_DSN;
    });
  });

  describe('initSentry callbacks', () => {
    let fresh: any;
    let freshSentry: any;

    beforeEach(() => {
      jest.resetModules();
      process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://test@sentry.io/123';
      fresh = require('../services/SentryService');
      freshSentry = require('@sentry/react-native');
      fresh.initSentry();
    });

    afterEach(() => {
      delete process.env.EXPO_PUBLIC_SENTRY_DSN;
    });

    it('calls Sentry.init with the DSN', () => {
      expect(freshSentry.init).toHaveBeenCalledWith(
        expect.objectContaining({ dsn: 'https://test@sentry.io/123' }),
      );
    });

    describe('beforeSend', () => {
      let beforeSend: (event: any) => any;

      beforeEach(() => {
        beforeSend = freshSentry.init.mock.calls[0][0].beforeSend;
      });

      it('strips user PII (email, username, ip_address)', () => {
        const event = {
          user: { email: 'a@b.com', username: 'alice', ip_address: '1.2.3.4', id: '42' },
        };
        const result = beforeSend(event);
        expect(result.user.email).toBeUndefined();
        expect(result.user.username).toBeUndefined();
        expect(result.user.ip_address).toBeUndefined();
        expect(result.user.id).toBe('42');
      });

      it('filters console breadcrumbs containing key, password, or vault', () => {
        const event = {
          breadcrumbs: [
            { category: 'console', message: 'loaded vault key' },
            { category: 'console', message: 'password reset requested' },
            { category: 'console', message: 'vault unlocked' },
            { category: 'console', message: 'normal log message' },
            { category: 'navigation', message: '/settings' },
          ],
        };
        const result = beforeSend(event);
        expect(result.breadcrumbs).toHaveLength(2);
        expect(result.breadcrumbs[0]).toEqual({ category: 'console', message: 'normal log message' });
        expect(result.breadcrumbs[1]).toEqual({ category: 'navigation', message: '/settings' });
      });

      it('redacts long base64-like strings in exception values', () => {
        const longBase64 = 'A'.repeat(40);
        const event = {
          exception: {
            values: [{ value: `Error: key was ${longBase64} end` }],
          },
        };
        const result = beforeSend(event);
        expect(result.exception.values[0].value).toContain('[REDACTED_KEY_OR_DATA]');
        expect(result.exception.values[0].value).not.toContain(longBase64);
      });

      it('returns event unchanged when no user or breadcrumbs', () => {
        const event = { message: 'simple event' };
        const result = beforeSend(event);
        expect(result).toEqual({ message: 'simple event' });
      });
    });

    describe('beforeBreadcrumb', () => {
      let beforeBreadcrumb: (breadcrumb: any) => any;

      beforeEach(() => {
        beforeBreadcrumb = freshSentry.init.mock.calls[0][0].beforeBreadcrumb;
      });

      it('redacts fetch URLs containing key', () => {
        const bc = { category: 'fetch', data: { url: 'https://api.example.com/key/rotate' } };
        const result = beforeBreadcrumb(bc);
        expect(result.data.url).toBe('[REDACTED_URL]');
      });

      it('redacts xhr URLs containing vault', () => {
        const bc = { category: 'xhr', data: { url: 'https://api.example.com/vault/data' } };
        const result = beforeBreadcrumb(bc);
        expect(result.data.url).toBe('[REDACTED_URL]');
      });

      it('redacts fetch URLs containing backup', () => {
        const bc = { category: 'fetch', data: { url: 'https://api.example.com/backup/latest' } };
        const result = beforeBreadcrumb(bc);
        expect(result.data.url).toBe('[REDACTED_URL]');
      });

      it('passes through non-fetch breadcrumbs unchanged', () => {
        const bc = { category: 'navigation', data: { url: '/home/vault' } };
        const result = beforeBreadcrumb(bc);
        expect(result.data.url).toBe('/home/vault');
      });

      it('passes through fetch breadcrumbs with safe URLs', () => {
        const bc = { category: 'fetch', data: { url: 'https://api.example.com/users' } };
        const result = beforeBreadcrumb(bc);
        expect(result.data.url).toBe('https://api.example.com/users');
      });
    });
  });
});
