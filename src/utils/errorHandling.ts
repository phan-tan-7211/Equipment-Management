import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import {
  formatErrorHandlingCopy,
  getErrorHandlingCopy,
} from '@/i18n/errorHandlingResources';

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';
export type ErrorCategory = 'network' | 'permission' | 'validation' | 'server' | 'unknown';

export interface StandardError {
  id: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  action?: string;
  retryable?: boolean;
  context?: Record<string, unknown>;
}

// Common error patterns for Supabase. These are protocol/server matching tokens,
// not user-facing copy, so they intentionally remain in their source language.
const SUPABASE_ERROR_PATTERNS: Record<
  string,
  { category: ErrorCategory; severity: ErrorSeverity }
> = {
  'Invalid input': { category: 'validation', severity: 'warning' },
  'Permission denied': { category: 'permission', severity: 'error' },
  'Network error': { category: 'network', severity: 'error' },
  'Failed to fetch': { category: 'network', severity: 'error' },
  'Load failed': { category: 'network', severity: 'error' },
  'NetworkError': { category: 'network', severity: 'error' },
  'ERR_INTERNET_DISCONNECTED': { category: 'network', severity: 'error' },
  'ERR_NETWORK': { category: 'network', severity: 'error' },
  'JWT expired': { category: 'permission', severity: 'warning' },
  'Row level security': { category: 'permission', severity: 'error' },
  'duplicate key': { category: 'validation', severity: 'warning' },
  'foreign key': { category: 'validation', severity: 'warning' },
};

/**
 * Fast, reliable check for network-related errors.
 * Uses navigator.onLine as primary signal (instant, no string matching)
 * and falls back to regex pattern matching on error messages.
 *
 * This is the canonical check used by the offline queue to decide
 * whether to save data locally instead of losing it.
 */
export const isNetworkError = (error?: unknown): boolean => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  return /Failed to fetch|Load failed|NetworkError|ERR_INTERNET|ERR_NETWORK|net::|TypeError: Failed|Operation failed/i.test(msg);
};

export const classifyError = (error: unknown): StandardError => {
  const errorMessage = getErrorMessage(error);
  const errorId = generateErrorId();

  if (isNetworkError(error)) {
    return {
      id: errorId,
      message: errorMessage,
      category: 'network',
      severity: 'error',
      action: getActionForError('network'),
      retryable: true,
      context: { originalError: error },
    };
  }

  for (const [pattern, classification] of Object.entries(SUPABASE_ERROR_PATTERNS)) {
    if (errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
      return {
        id: errorId,
        message: errorMessage,
        category: classification.category,
        severity: classification.severity,
        action: getActionForError(classification.category),
        retryable: isRetryable(classification.category),
        context: { originalError: error },
      };
    }
  }

  return {
    id: errorId,
    message: errorMessage,
    category: 'unknown',
    severity: 'error',
    action: getErrorHandlingCopy().retryOrSupport,
    retryable: true,
    context: { originalError: error },
  };
};

export const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return getErrorHandlingCopy().unexpected;
};

export const generateErrorId = (): string => {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const getActionForError = (category: ErrorCategory): string => {
  const copy = getErrorHandlingCopy();
  switch (category) {
    case 'network':
      return copy.networkAction;
    case 'permission':
      return copy.permissionAction;
    case 'validation':
      return copy.validationAction;
    case 'server':
      return copy.serverAction;
    default:
      return copy.retryOrSupport;
  }
};

export const isRetryable = (category: ErrorCategory): boolean => {
  return ['network', 'server', 'unknown'].includes(category);
};

export const showErrorToast = (error: unknown, context?: string): StandardError => {
  const standardError = classifyError(error);
  const copy = getErrorHandlingCopy();
  const title = context
    ? formatErrorHandlingCopy(copy.contextFailed, context)
    : copy.operationFailed;
  const description = `${standardError.message}${standardError.action ? ` ${standardError.action}` : ''}`;

  switch (standardError.severity) {
    case 'critical':
    case 'error':
      toast.error(title, { description });
      break;
    case 'warning':
      toast.warning(title, { description });
      break;
    case 'info':
      toast.info(title, { description });
      break;
  }

  logger.error(`[${standardError.id}] ${context || 'Error'}`, {
    ...standardError,
    timestamp: new Date().toISOString(),
  });

  return standardError;
};

export const createRetryFunction = <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000,
): (() => Promise<T>) => {
  return async (): Promise<T> => {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        const standardError = classifyError(error);

        if (!standardError.retryable || attempt === maxRetries) {
          throw error;
        }

        await new Promise((resolve) =>
          setTimeout(resolve, delay * Math.pow(2, attempt - 1)),
        );
      }
    }

    throw lastError;
  };
};
