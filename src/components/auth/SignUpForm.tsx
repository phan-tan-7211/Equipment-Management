
import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Mail, XCircle } from 'lucide-react';
import HCaptchaComponent from '@/components/ui/HCaptcha';
import { AuthGoogleSignInButton } from '@/pages/AuthGoogleSignInButton';
import { getCurrentAuthSession, signUpWithEmail } from '@/services/authSignupService';
import { validatePasswordComplexity, calculatePasswordStrength } from '@/lib/passwordPolicy';
import { checkPasswordBreachedHibp } from '@/lib/hibpPasswordCheck';
import {
  clearPendingTermsAcceptanceForUser,
  markPendingTermsAcceptanceForUser,
  recordTermsAcceptance,
} from '@/lib/termsAcceptanceRecording';
import SignUpInviteBanner from './SignUpInviteBanner';
import SignUpPrivacyNotice from './SignUpPrivacyNotice';
import SignUpPasswordField from './SignUpPasswordField';
import SignUpConfirmPasswordField from './SignUpConfirmPasswordField';
import SignUpTermsAcceptance from './SignUpTermsAcceptance';
import {
  ALL_SIGNUP_FIELDS_TOUCHED,
  buildSignupUserMetadata,
  canStartGoogleSignup,
  computePasswordMatch,
  getEmailErrorForValue,
  getInvitedOrgNameConflict,
  getSignupAcceptanceError,
  getSignupFieldError,
  isSignupFormValid,
  type SignUpValidationContext,
} from './signUpFormModel';
import { useI18n } from '@/i18n';

interface SignUpFormProps {
  onSuccess: (message: string, email?: string) => void;
  onBeforeSignupSubmit?: () => void;
  onGoogleSignUp: (organizationName: string) => void;
  onError: (error: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  prefillEmail?: string;
  invitedOrgId?: string;
  invitedOrgName?: string;
}

const SignUpForm: React.FC<SignUpFormProps> = ({
  onSuccess,
  onBeforeSignupSubmit,
  onGoogleSignUp,
  onError,
  isLoading,
  setIsLoading,
  prefillEmail,
  invitedOrgId,
  invitedOrgName,
}) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    name: '',
    email: prefillEmail || '',
    password: '',
    confirmPassword: '',
    organizationName: '',
  });
  const [hcaptchaToken, setHcaptchaToken] = useState<string | null>(null);
  const hcaptchaEnabled = Boolean(import.meta.env.VITE_HCAPTCHA_SITEKEY);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null);
  const [orgNameError, setOrgNameError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [acceptanceTouched, setAcceptanceTouched] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [showRetryAcceptance, setShowRetryAcceptance] = useState(false);
  const [emailSignupOpen, setEmailSignupOpen] = useState(Boolean(prefillEmail));

  const complexity = validatePasswordComplexity(formData.password);
  const strength = calculatePasswordStrength(formData.password);

  const validationContext = useMemo<SignUpValidationContext>(
    () => ({
      formData,
      touched,
      emailError,
      orgNameError,
      passwordMatch,
      complexity,
      termsAccepted,
      acceptanceTouched,
      submitAttempted,
      hcaptchaEnabled,
      hcaptchaToken,
    }),
    [
      formData,
      touched,
      emailError,
      orgNameError,
      passwordMatch,
      complexity,
      termsAccepted,
      acceptanceTouched,
      submitAttempted,
      hcaptchaEnabled,
      hcaptchaToken,
    ],
  );

  useEffect(() => {
    if (!prefillEmail) return;
    setEmailSignupOpen(true);
    setFormData(prev => {
      if (prefillEmail === prev.email) return prev;
      setEmailError(getEmailErrorForValue(prefillEmail));
      return { ...prev, email: prefillEmail };
    });
  }, [prefillEmail]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'password' || field === 'confirmPassword') {
        setPasswordMatch(
          computePasswordMatch(
            field === 'password' ? value : prev.password,
            field === 'confirmPassword' ? value : prev.confirmPassword,
            field,
            prev.password,
            prev.confirmPassword,
          ),
        );
      }
      return next;
    });

    if (field === 'email') setEmailError(getEmailErrorForValue(value));
    if (field === 'organizationName' && invitedOrgName) {
      setOrgNameError(getInvitedOrgNameConflict(value, invitedOrgName));
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const getFieldError = (field: string) => getSignupFieldError(field, validationContext);
  const getAcceptanceError = () =>
    getSignupAcceptanceError(termsAccepted, acceptanceTouched, submitAttempted);
  const formIsValid = () => isSignupFormValid(validationContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSignupOpen) return;

    setSubmitAttempted(true);
    setAcceptanceTouched(true);

    if (!termsAccepted) {
      onError(t('auth.acceptTermsRequired'));
      return;
    }

    if (!formIsValid()) {
      setTouched(ALL_SIGNUP_FIELDS_TOUCHED);
      onError(t('auth.fillFieldsCorrectly'));
      return;
    }

    setIsLoading(true);
    onBeforeSignupSubmit?.();

    try {
      const hibp = await checkPasswordBreachedHibp(formData.password);
      if (hibp.status === 'error') {
        onError(t('auth.passwordSafetyUnavailable'));
        setIsLoading(false);
        return;
      }
      if (hibp.breached) {
        onError(t('auth.passwordBreached'));
        setIsLoading(false);
        return;
      }

      const redirectUrl = `${window.location.origin}/`;
      const submittedEmail = formData.email.trim();
      const signUpData = buildSignupUserMetadata(formData, { invitedOrgId, invitedOrgName });

      const { data, error } = await signUpWithEmail({
        email: submittedEmail,
        password: formData.password,
        emailRedirectTo: redirectUrl,
        data: signUpData,
        ...(hcaptchaEnabled && hcaptchaToken ? { captchaToken: hcaptchaToken } : {}),
      });

      if (error) {
        onError(error.message);
        setHcaptchaToken(null);
        setIsLoading(false);
        return;
      }

      const accessToken = data.session?.access_token;
      const newUserId = data.user?.id;

      if (accessToken) {
        try {
          const recorded = await recordTermsAcceptance(accessToken);
          if (!recorded) {
            if (newUserId) markPendingTermsAcceptanceForUser(newUserId);
            setShowRetryAcceptance(true);
            onError(t('auth.legalAcceptanceSaveFailed'));
            setHcaptchaToken(null);
            setIsLoading(false);
            return;
          }
        } catch {
          if (newUserId) markPendingTermsAcceptanceForUser(newUserId);
          setShowRetryAcceptance(true);
          onError(t('auth.legalAcceptanceServerFailed'));
          setHcaptchaToken(null);
          setIsLoading(false);
          return;
        }
      } else if (newUserId) {
        markPendingTermsAcceptanceForUser(newUserId);
      }

      onSuccess(
        accessToken ? t('auth.accountCreated') : t('auth.accountCreatedPendingVerification'),
        submittedEmail,
      );
    } catch (error) {
      onError(error instanceof Error ? error.message : t('auth.signupFailed'));
      setHcaptchaToken(null);
    }

    setIsLoading(false);
  };

  const handleRetryAcceptance = async () => {
    setIsLoading(true);
    try {
      const { session } = await getCurrentAuthSession();
      const token = session?.access_token;
      if (!token) {
        onError(t('auth.signInFirstForAcceptance'));
        setIsLoading(false);
        return;
      }
      const ok = await recordTermsAcceptance(token);
      if (ok) {
        setShowRetryAcceptance(false);
        const uid = session?.user?.id;
        if (uid) clearPendingTermsAcceptanceForUser(uid);
        onSuccess(t('auth.acceptanceRecorded'));
      } else {
        onError(t('auth.acceptanceRecordFailed'));
      }
    } catch (e) {
      onError(e instanceof Error ? e.message : t('auth.retryFailed'));
    }
    setIsLoading(false);
  };

  const handleHCaptchaVerify = (token: string) => setHcaptchaToken(token);

  const handleHCaptchaError = () => {
    setHcaptchaToken(null);
    onError(t('auth.captchaFailed'));
  };

  const handleHCaptchaExpire = () => {
    setHcaptchaToken(null);
    onError(t('auth.captchaExpired'));
  };

  const googleSignupReady = canStartGoogleSignup(formData.organizationName, orgNameError);

  const handleGoogleSignUp = () => {
    setTouched(prev => ({ ...prev, organizationName: true }));
    const conflict = invitedOrgName
      ? getInvitedOrgNameConflict(formData.organizationName, invitedOrgName)
      : null;
    if (conflict) {
      setOrgNameError(conflict);
      return;
    }
    const organizationName = formData.organizationName.trim();
    if (!organizationName) return;
    onGoogleSignUp(organizationName);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {invitedOrgName && <SignUpInviteBanner invitedOrgName={invitedOrgName} />}
      <SignUpPrivacyNotice />

      <div className="space-y-2">
        <Label htmlFor="signup-organization">{t('auth.organizationName')}</Label>
        <Input
          id="signup-organization"
          type="text"
          value={formData.organizationName}
          onChange={e => handleInputChange('organizationName', e.target.value)}
          onBlur={() => handleBlur('organizationName')}
          placeholder={
            invitedOrgName
              ? t('auth.organizationPlaceholderInvite', { name: invitedOrgName })
              : t('auth.organizationPlaceholder')
          }
          required
          aria-invalid={!!getFieldError('organizationName')}
          aria-describedby={getFieldError('organizationName') ? 'signup-org-error' : undefined}
        />
        {getFieldError('organizationName') && (
          <p id="signup-org-error" className="text-sm text-destructive flex items-center gap-1" aria-live="polite">
            <XCircle className="h-3 w-3" />
            {getFieldError('organizationName')}
          </p>
        )}
      </div>

      {emailSignupOpen ? null : (
        <>
          <AuthGoogleSignInButton
            onClick={handleGoogleSignUp}
            disabled={isLoading || !googleSignupReady}
            label={t('auth.signUpWithGoogle')}
          />
          <p className="text-center text-xs text-muted-foreground">{t('auth.or')}</p>
          <Button type="button" variant="outline" className="w-full" onClick={() => setEmailSignupOpen(true)}>
            <Mail className="mr-2 h-4 w-4" aria-hidden />
            {t('auth.signUpWithEmail')}
          </Button>
        </>
      )}

      {emailSignupOpen ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="signup-name">{t('auth.fullName')}</Label>
            <Input
              id="signup-name"
              type="text"
              autoComplete="name"
              value={formData.name}
              onChange={e => handleInputChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              required
              aria-invalid={!!getFieldError('name')}
              aria-describedby={getFieldError('name') ? 'signup-name-error' : undefined}
            />
            {getFieldError('name') && (
              <p id="signup-name-error" className="text-sm text-destructive" aria-live="polite">
                {getFieldError('name')}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-email">{t('auth.email')}</Label>
            <Input
              id="signup-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              autoCorrect="off"
              autoCapitalize="none"
              value={formData.email}
              onChange={e => handleInputChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              required
              aria-invalid={!!(emailError || (touched.email && !formData.email.trim()))}
              aria-describedby={getFieldError('email') ? 'signup-email-error' : undefined}
            />
            {getFieldError('email') && (
              <p id="signup-email-error" className="text-sm text-destructive" aria-live="polite">
                {getFieldError('email')}
              </p>
            )}
          </div>

          <SignUpPasswordField
            password={formData.password}
            complexity={complexity}
            strength={strength}
            error={getFieldError('password')}
            onChange={value => handleInputChange('password', value)}
            onBlur={() => handleBlur('password')}
          />

          <SignUpConfirmPasswordField
            confirmPassword={formData.confirmPassword}
            passwordMatch={passwordMatch}
            onChange={value => handleInputChange('confirmPassword', value)}
            onBlur={() => handleBlur('confirmPassword')}
          />

          <SignUpTermsAcceptance
            termsAccepted={termsAccepted}
            error={getAcceptanceError()}
            onCheckedChange={accepted => {
              setTermsAccepted(accepted);
              setAcceptanceTouched(true);
            }}
          />

          {hcaptchaEnabled && (
            <HCaptchaComponent
              onSuccess={handleHCaptchaVerify}
              onError={handleHCaptchaError}
              onExpire={handleHCaptchaExpire}
            />
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !formIsValid()}
            onClick={() => {
              setSubmitAttempted(true);
              if (!formIsValid()) {
                setTouched(ALL_SIGNUP_FIELDS_TOUCHED);
                setAcceptanceTouched(true);
              }
            }}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-label={t('auth.creatingAccount')} />}
            {t('auth.createAccountOrganization')}
          </Button>

          {showRetryAcceptance && (
            <Button type="button" variant="outline" className="w-full" onClick={handleRetryAcceptance} disabled={isLoading}>
              {t('auth.retryLegalAcceptance')}
            </Button>
          )}

          {!formIsValid() && Object.keys(touched).length > 0 && (
            <p className="text-xs text-muted-foreground text-center">{t('auth.fillRequiredFields')}</p>
          )}

          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 text-sm font-medium text-foreground underline underline-offset-4 hover:text-primary"
            onClick={() => setEmailSignupOpen(false)}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t('auth.backToGoogleSignup')}
          </button>
        </>
      ) : null}
    </form>
  );
};

export default SignUpForm;
