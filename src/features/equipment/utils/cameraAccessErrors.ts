export type CameraAccessErrorCode =
  | 'policy_blocked'
  | 'permission_denied'
  | 'not_found'
  | 'not_readable'
  | 'unknown';

/** Maps getUserMedia / scanner startup failures to a stable semantic code. */
export function getCameraAccessErrorCode(error: unknown): CameraAccessErrorCode {
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';
  const lower = msg.toLowerCase();

  if (
    lower.includes('permissions policy') ||
    lower.includes('not allowed in this document') ||
    lower.includes('permission denied by policy')
  ) {
    return 'policy_blocked';
  }

  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') return 'permission_denied';
    if (error.name === 'NotFoundError') return 'not_found';
    if (error.name === 'NotReadableError') return 'not_readable';
  }

  if (lower.includes('permission denied') || lower.includes('notallowederror')) {
    return 'permission_denied';
  }
  if (lower.includes('notfounderror') || lower.includes('no camera')) {
    return 'not_found';
  }
  if (
    lower.includes('notreadableerror') ||
    lower.includes('could not start video source') ||
    lower.includes('track start error')
  ) {
    return 'not_readable';
  }

  return 'unknown';
}
