import React, { Suspense, lazy, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { isMFAEnabled } from '@/lib/flags';
import { AuthGoogleSignInButton } from '@/pages/AuthGoogleSignInButton';
import { useI18n } from '@/i18n';
const DEV_QUICK_LOGIN_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_PREVIEW_QUICK_LOGIN === 'true';
const DevQuickLogin = DEV_QUICK_LOGIN_ENABLED
  ? lazy(() => import('./DevQuickLogin'))
  : null;

interface SignInFormProps {
  onError: (error: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onGoogleSignIn: () => void;
  onMFARequired?: () => void;
}

const SignInForm: React.FC<SignInFormProps> = ({
  onError,
  isLoading,
  setIsLoading,
  onGoogleSignIn,
  onMFARequired,
}) => {
  const { signIn } = useAuth();
  const { t } = useI18n();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<{ email?: string; password?: string; auth?: string } | null>(null);
  const [emailSignInOpen, setEmailSignInOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSignInOpen || isLoading) return;
    setIsLoading(true);

    try {
      const emailTrimmed = formData.email.trim();
      const passwordTrimmed = formData.password.trim();
      const emailValid = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(emailTrimmed);
      const nextErrors: { email?: string; password?: string; auth?: string } = {};

      if (!emailTrimmed) nextErrors.email = t('auth.emailRequired');
      else if (!emailValid) nextErrors.email = t('auth.validEmail');
      if (!passwordTrimmed) nextErrors.password = t('auth.passwordRequired');

      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        return;
      }

      setErrors(null);
      const { error } = await signIn(emailTrimmed, passwordTrimmed);
      if (error) {
        const msg = error.message?.trim() || t('auth.signInFailed');
        setErrors({ auth: msg });
        onError(msg);
        return;
      }

      if (isMFAEnabled() && onMFARequired) {
        try {
          const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          if (data && data.nextLevel === 'aal2' && data.currentLevel === 'aal1') {
            onMFARequired();
            return;
          }
        } catch {
          // MFA status can be re-checked later by the auth flow.
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {DevQuickLogin ? (
        <Suspense fallback={null}>
          <DevQuickLogin onAuthFailure={onError} />
        </Suspense>
      ) : null}
      {emailSignInOpen ? null : (
        <>
          <AuthGoogleSignInButton onClick={onGoogleSignIn} disabled={isLoading} label={t('auth.loginWithGoogle')} />
          <p className="text-center text-xs text-muted-foreground">{t('auth.or')}</p>
          <Button type="button" variant="outline" className="w-full" onClick={() => setEmailSignInOpen(true)}>
            <Mail className="mr-2 h-4 w-4" aria-hidden />
            {t('auth.loginWithEmailPassword')}
          </Button>
        </>
      )}
      {emailSignInOpen ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="signin-email">{t('auth.email')}</Label>
            <Input
              id="signin-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              autoCorrect="off"
              autoCapitalize="none"
              value={formData.email}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, email: e.target.value }));
                setErrors((prev) => {
                  if (!prev?.email && !prev?.auth) return prev;
                  return { ...prev, email: undefined, auth: undefined };
                });
              }}
              required
              aria-invalid={errors?.email ? 'true' : 'false'}
              aria-describedby={errors?.email ? 'signin-email-error' : undefined}
            />
            {errors?.email && <p id="signin-email-error" className="text-sm text-destructive" aria-live="polite">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="signin-password">{t('auth.password')}</Label>
            <Input
              id="signin-password"
              type="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, password: e.target.value }));
                setErrors((prev) => {
                  if (!prev?.password && !prev?.auth) return prev;
                  return { ...prev, password: undefined, auth: undefined };
                });
              }}
              required
              aria-invalid={errors?.password || errors?.auth ? 'true' : 'false'}
              aria-describedby={errors?.password ? 'signin-password-error' : errors?.auth ? 'signin-auth-error' : undefined}
            />
            {errors?.password && <p id="signin-password-error" className="text-sm text-destructive" aria-live="polite">{errors.password}</p>}
            {errors?.auth && <p id="signin-auth-error" className="text-sm text-destructive" aria-live="polite">{errors.auth}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && (
              <div role="status" aria-label={t('common.loading')}>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              </div>
            )}
            {t('auth.signIn')}
          </Button>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 text-sm font-medium text-foreground underline underline-offset-4 hover:text-primary"
            onClick={() => setEmailSignInOpen(false)}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t('auth.backToGoogle')}
          </button>
        </>
      ) : null}
    </form>
  );
};

export default SignInForm;
