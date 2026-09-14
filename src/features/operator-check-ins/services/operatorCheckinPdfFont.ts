import type { jsPDF } from 'jspdf';
import type { Language } from '@/i18n/I18nProvider';
import { getOperatorCheckinExcelLabels } from './operatorCheckinExcelLabels';
import fontUrl from '../assets/ZNTEQR-Report-KR-VI.ttf?url';

const FONT_FILE = 'ZNTEQR-Report-KR-VI.ttf';
const FONT_FAMILY = 'ZNTEQRReport';

/** Keep the 2.8 MB font out of the initial app bundle and fail before writing a broken PDF. */
export async function registerOperatorCheckinPdfFont(doc: jsPDF, language: Language): Promise<string> {
  const fontError = getOperatorCheckinExcelLabels(language).pdfFontLoadError;
  let response: Response;
  try {
    response = await fetch(fontUrl);
  } catch {
    throw new Error(fontError);
  }
  if (!response.ok) throw new Error(fontError);

  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }

  doc.addFileToVFS(FONT_FILE, btoa(binary));
  doc.addFont(FONT_FILE, FONT_FAMILY, 'normal');
  return FONT_FAMILY;
}
