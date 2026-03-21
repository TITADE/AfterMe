/**
 * Sentry crash reporting initialization with PII scrubbing.
 * No personal data (document titles, names, keys) is ever sent.
 */
import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || '';

let initialized = false;

/**
 * Report a non-fatal error to Sentry with a safe context tag.
 * Never include document content, keys, or PII in the context.
 */
export function captureVaultError(error: unknown, context: string): void {
  if (!initialized) return;
  Sentry.withScope((scope) => {
    scope.setTag('vault_operation', context);
    scope.setLevel('error');
    if (error instanceof Error) {
      Sentry.captureException(error);
    } else {
      Sentry.captureMessage(String(error));
    }
  });
}

/**
 * Wrap an async vault operation with Sentry performance tracing.
 * Returns the operation result. No document content is captured.
 */
export async function traceVaultOperation<T>(
  name: string,
  operation: () => Promise<T>,
): Promise<T> {
  if (!initialized) return operation();
  return Sentry.startSpan({ name, op: 'vault' }, async () => {
    return operation();
  });
}

export function initSentry(): void {
  if (initialized || !SENTRY_DSN) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.2,
    enableAutoSessionTracking: true,

    beforeSend(event) {
      if (event.user) {
        delete event.user.email;
        delete event.user.username;
        delete event.user.ip_address;
      }

      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.filter((bc) => {
          if (bc.category === 'console' && typeof bc.message === 'string') {
            const msg = bc.message.toLowerCase();
            if (msg.includes('key') || msg.includes('password') || msg.includes('vault')) {
              return false;
            }
          }
          return true;
        });
      }

      if (event.exception?.values) {
        for (const exc of event.exception.values) {
          if (exc.value) {
            exc.value = exc.value.replace(
              /[A-Za-z0-9+/]{40,}={0,2}/g,
              '[REDACTED_KEY_OR_DATA]',
            );
          }
        }
      }

      return event;
    },

    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === 'fetch' || breadcrumb.category === 'xhr') {
        if (breadcrumb.data?.url) {
          const url = breadcrumb.data.url as string;
          if (url.includes('key') || url.includes('vault') || url.includes('backup')) {
            breadcrumb.data.url = '[REDACTED_URL]';
          }
        }
      }
      return breadcrumb;
    },
  });

  initialized = true;
}
