/**
 * Console Error Ring Buffer
 *
 * Captures recent console errors plus uncaught browser/WebView errors so bug
 * reports can include useful diagnostics without a third-party crash SDK.
 *
 * Privacy: only short error message strings are stored in memory. No stack
 * traces, tokens, request bodies, or persistent PII are captured here.
 */

const ERROR_BUFFER_SIZE = 10;
const MAX_ERROR_LENGTH = 200;

const errorBuffer: string[] = [];
let initialized = false;

function pushErrorMessage(value: unknown): void {
  try {
    const message = (
      value instanceof Error
        ? value.message
        : typeof value === 'string'
          ? value
          : String(value ?? '')
    ).slice(0, MAX_ERROR_LENGTH);

    if (!message) return;
    errorBuffer.push(message);
    if (errorBuffer.length > ERROR_BUFFER_SIZE) errorBuffer.shift();
  } catch {
    // Diagnostics must never become an application failure.
  }
}

/**
 * Initialize console/global error interception. Safe to call more than once.
 */
export function initConsoleErrorCapture(): void {
  if (initialized) return;
  initialized = true;

  const originalError = console.error;

  console.error = (...args: unknown[]) => {
    try {
      pushErrorMessage(
        args
          .map((a) => {
            if (a instanceof Error) return a.message;
            if (typeof a === 'string') return a;
            try {
              return String(a);
            } catch {
              return '[unstringifiable]';
            }
          })
          .join(' '),
      );
    } catch {
      // Never let the buffer logic break console.error itself.
    }

    originalError.apply(console, args);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      pushErrorMessage(event.error instanceof Error ? event.error : event.message);
    });

    window.addEventListener('unhandledrejection', (event) => {
      pushErrorMessage(event.reason instanceof Error ? event.reason : event.reason);
    });
  }
}

/** Get a copy of the most recent captured errors. */
export function getRecentErrors(): string[] {
  return [...errorBuffer];
}
