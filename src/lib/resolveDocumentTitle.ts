export function resolveDocumentTitle(title: string, path?: string): string {
  if (path === '/' || /\bZNTEQR\b/.test(title)) {
    return title;
  }

  return `${title} | ZNTEQR`;
}
