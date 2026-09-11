import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { toast } from 'sonner';

const NATIVE_EXPORT_DIR = 'EquipQR';
const NATIVE_SHARE_DIR = 'equipqr-share';

export function isNativeAndroidFileRuntime(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

function sanitizeFilename(filename: string): string {
  const trimmed = filename.trim() || `equipqr-${Date.now()}`;
  return trimmed.replace(/[\\/:*?"<>|\u0000-\u001F]/g, '_');
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file data.'));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Could not encode file data.'));
        return;
      }
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(blob);
  });
}

async function ensureLegacyStoragePermission(): Promise<void> {
  try {
    const current = await Filesystem.checkPermissions();
    if (current.publicStorage !== 'granted') {
      await Filesystem.requestPermissions();
    }
  } catch {
    // Android 11+ scoped storage does not require the legacy public-storage grant.
  }
}

async function writeBase64(
  directory: Directory,
  path: string,
  data: string,
): Promise<string> {
  await Filesystem.writeFile({
    path,
    data,
    directory,
    recursive: true,
  });
  const { uri } = await Filesystem.getUri({ path, directory });
  return uri;
}

export async function shareNativeFileUri(uri: string, filename?: string): Promise<void> {
  await Share.share({
    title: filename ?? 'EquipQR export',
    files: [uri],
    dialogTitle: filename ? `Share ${filename}` : 'Share EquipQR file',
  });
}

/**
 * Persist an exported Blob to Android Documents/EquipQR and prepare a cache copy
 * for the Android share sheet. If public Documents is unavailable, the file is
 * still written to app cache so the user can immediately share/save it through
 * Android's chooser.
 */
export async function saveBlobToAndroid(
  blob: Blob,
  filename: string,
): Promise<{ persistentUri?: string; shareUri: string; filename: string }> {
  const safeFilename = sanitizeFilename(filename);
  const data = await blobToBase64(blob);
  await ensureLegacyStoragePermission();

  let persistentUri: string | undefined;
  try {
    persistentUri = await writeBase64(
      Directory.Documents,
      `${NATIVE_EXPORT_DIR}/${safeFilename}`,
      data,
    );
  } catch {
    // Some OEM/scoped-storage combinations may not expose Documents directly.
    // A cache copy below still guarantees Share/Save-to-Files functionality.
  }

  const shareUri = await writeBase64(
    Directory.Cache,
    `${NATIVE_SHARE_DIR}/${Date.now()}-${safeFilename}`,
    data,
  );

  return { persistentUri, shareUri, filename: safeFilename };
}

export async function downloadBlobNative(blob: Blob, filename: string): Promise<void> {
  const saved = await saveBlobToAndroid(blob, filename);
  const description = saved.persistentUri
    ? `Saved to Documents/${NATIVE_EXPORT_DIR}`
    : 'File is ready to save or share';

  toast.success(saved.filename, {
    description,
    duration: 8000,
    action: {
      label: 'Share',
      onClick: () => {
        void shareNativeFileUri(saved.shareUri, saved.filename).catch((error) => {
          const message = error instanceof Error ? error.message : 'Could not share file.';
          toast.error(message);
        });
      },
    },
  });
}
