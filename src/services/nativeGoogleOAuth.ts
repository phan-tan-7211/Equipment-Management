import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { getPendingRedirect } from '@/utils/redirectValidation';
import {
  clearPendingSignupOrganizationName,
  setPendingSignupOrganizationName,
} from '@/services/pendingSignupOrganization';

const NATIVE_GOOGLE_CALLBACK = 'equipqr://auth/callback';

export function shouldUseNativeGoogleOAuth(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

/**
 * Opens Google OAuth in an Android Custom Tab and returns control to the APK
 * through the equipqr://auth/callback deep link. Session restoration is handled
 * by NativeDeepLinkBridge.
 */
export async function signInWithGoogleNative(
  organizationName?: string,
): Promise<{ error: Error | null }> {
  const trimmedOrganizationName = organizationName?.trim();
  if (trimmedOrganizationName) {
    setPendingSignupOrganizationName(trimmedOrganizationName);
  } else {
    clearPendingSignupOrganizationName();
  }

  // Keep pendingRedirect in WebView sessionStorage. NativeDeepLinkBridge consumes
  // it after the OAuth session is restored, so QR/login continuation is preserved.
  void getPendingRedirect();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: NATIVE_GOOGLE_CALLBACK,
      skipBrowserRedirect: true,
    },
  });

  if (error) return { error };
  if (!data.url) return { error: new Error('Google sign-in URL was not returned.') };

  try {
    await Browser.open({
      url: data.url,
      presentationStyle: 'popover',
    });
    return { error: null };
  } catch (browserError) {
    return {
      error:
        browserError instanceof Error
          ? browserError
          : new Error('Could not open Google sign-in.'),
    };
  }
}
