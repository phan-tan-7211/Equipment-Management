import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMountFocus } from '@/components/a11y/keyboard';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useMFA } from '@/hooks/useMFA';
import { useAppToast } from '@/hooks/useAppToast';
import { Loader2, Copy, Check, ShieldPlus } from 'lucide-react';
import { useAuthFlowCopy } from './useAuthFlowCopy';

interface MFAEnrollmentProps {
  onComplete: () => void;
  onSkip?: () => void;
  /** When true, the skip button is hidden and enrollment is mandatory */
  isRequired?: boolean;
}

interface EnrollmentData {
  qrCode: string;
  secret: string;
  factorId: string;
}

const MFAEnrollment: React.FC<MFAEnrollmentProps> = ({
  onComplete,
  onSkip,
  isRequired = false,
}) => {
  const t = useAuthFlowCopy();
  const { enrollTOTP, verifyTOTP } = useMFA();
  const toast = useAppToast();
  const [step, setStep] = useState<'loading' | 'scan' | 'verify'>('loading');
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData | null>(null);
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<'enrollFailed' | 'invalidCode' | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const otpRef = useMountFocus<React.ComponentRef<typeof InputOTP>>(step === 'verify');

  // Clear the "copied" timeout on unmount to prevent state updates after unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  // Initialize enrollment on mount (rule 5.7 — effect for one-time setup, not interaction)
  useEffect(() => {
    let cancelled = false;

    const initEnrollment = async () => {
      const data = await enrollTOTP();
      if (cancelled) return;

      if (data) {
        setEnrollmentData(data);
        setStep('scan');
      } else {
        setError('enrollFailed');
      }
    };

    initEnrollment();
    return () => { cancelled = true; };
    // enrollTOTP is stable via useCallback
  }, [enrollTOTP]);

  const copySecret = useCallback(async () => {
    if (!enrollmentData?.secret) return;

    try {
      await navigator.clipboard.writeText(enrollmentData.secret);
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may not be available in all contexts
      toast.error({ description: t('authFlow.copyFailed') });
    }
  }, [enrollmentData?.secret, toast, t]);

  const handleVerify = useCallback(async (verifyCode: string) => {
    if (!enrollmentData || verifyCode.length !== 6) return;

    setIsVerifying(true);
    setError(null);

    const { error: verifyError } = await verifyTOTP(enrollmentData.factorId, verifyCode);

    setIsVerifying(false);

    if (verifyError) {
      toast.error({
        title: t('authFlow.verificationFailed'),
        description: t('authFlow.invalidCode'),
      });
      setError('invalidCode');
      setCode('');
    } else {
      toast.success({
        title: t('authFlow.enabled'),
        description: t('authFlow.enabledDescription'),
      });
      onComplete();
    }
  }, [enrollmentData, verifyTOTP, toast, onComplete, t]);

  const handleCodeChange = useCallback((value: string) => {
    setCode(value);
    if (value.length === 6) {
      handleVerify(value);
    }
  }, [handleVerify]);

  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div role="status" aria-label={t('authFlow.settingUpLabel')}>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">{t('authFlow.settingUp')}</p>
        {error ? (
          <p className="text-sm text-destructive" role="alert">{t('authFlow.enrollFailed')}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col items-center space-y-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <ShieldPlus className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">
          {t('authFlow.setupTitle')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isRequired
            ? t('authFlow.requiredDescription')
            : t('authFlow.optionalDescription')}
        </p>
      </div>

      {/* Step 1: Scan QR Code */}
      {step === 'scan' && enrollmentData ? (
        <>
          <div className="rounded-lg border bg-card p-4">
            <img
              src={enrollmentData.qrCode}
              alt={t('authFlow.qrAlt')}
              className="h-48 w-48 mx-auto"
            />
          </div>

          <div className="flex flex-col items-center space-y-2 text-center">
            <p className="text-xs text-muted-foreground">
              {t('authFlow.manualCode')}
            </p>
            <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
              <code className="text-xs font-mono break-all select-all">
                {enrollmentData.secret}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={copySecret}
                aria-label={t('authFlow.copySecret')}
              >
                {copied ? (
                  <Check className="h-3 w-3 text-primary" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          <Button onClick={() => setStep('verify')} className="w-full max-w-65">
            {t('authFlow.scanned')}
          </Button>
        </>
      ) : null}

      {/* Step 2: Verify Code */}
      {step === 'verify' ? (
        <>
          <p className="text-sm text-muted-foreground text-center">
            {t('authFlow.enterCode')}
          </p>

          <div className="flex flex-col items-center space-y-4">
            <InputOTP
              ref={otpRef}
              maxLength={6}
              value={code}
              onChange={handleCodeChange}
              disabled={isVerifying}
              aria-label={t('authFlow.verificationCode')}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? 'mfa-enroll-error' : undefined}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            {error ? (
              <p
                id="mfa-enroll-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {t(error === 'enrollFailed' ? 'authFlow.enrollFailed' : 'authFlow.invalidCode')}
              </p>
            ) : null}
          </div>

          <div className="flex gap-2 w-full max-w-65">
            <Button
              variant="outline"
              onClick={() => {
                setStep('scan');
                setCode('');
                setError(null);
              }}
              className="flex-1"
              disabled={isVerifying}
            >
              {t('authFlow.back')}
            </Button>
            <Button
              onClick={() => handleVerify(code)}
              disabled={isVerifying || code.length !== 6}
              className="flex-1"
            >
              {isVerifying ? (
                <div role="status" aria-label={t('authFlow.verifyingCode')}>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                </div>
              ) : null}
              {t('authFlow.verifyEnable')}
            </Button>
          </div>
        </>
      ) : null}

      {/* Skip option (only when not required) */}
      {!isRequired && onSkip ? (
        <Button
          variant="link"
          onClick={onSkip}
          className="text-muted-foreground"
        >
          {t('authFlow.skip')}
        </Button>
      ) : null}
    </div>
  );
};

export default MFAEnrollment;
