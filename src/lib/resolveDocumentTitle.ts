export function resolveDocumentTitle(title: string, path?: string): string {
  if (path === '/' || /\bCEV.PhanTan\b/.test(title)) {
    return title;
  }

  return `${title} | CEV.PhanTan`;
}

