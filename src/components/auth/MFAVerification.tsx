import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useMFA } from '@/hooks/useMFA';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useI18n } from '@/i18n';

interface MFAVerificationProps {
  onSuccess: () => void;
  onError?: (error: string) => void;
}

const MFAVerification: React.FC<MFAVerificationProps> = ({ onSuccess, onError }) => {
  const { challengeAndVerify } = useMFA();
  const { t } = useI18n();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const otpContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const firstInput = otpContainerRef.current?.querySelector('input');
    firstInput?.focus();
  }, []);

  const handleVerify = useCallback(async (verifyCode: string) => {
    if (verifyCode.length !== 6) return;

    setIsLoading(true);
    setError(null);

    const { error: verifyError } = await challengeAndVerify(verifyCode);

    setIsLoading(false);

    if (verifyError) {
      const message = t('auth.invalidVerificationCode');
      setError(message);
      onError?.(message);
      setCode('');
    } else {
      onSuccess();
    }
  }, [challengeAndVerify, onSuccess, onError, t]);

  const handleCodeChange = useCallback((value: string) => {
    setCode(value);
    if (value.length === 6) {
      handleVerify(value);
    }
  }, [handleVerify]);

  return (
    <div className="flex flex-col items-center space-y-6 p-6">
      <div className="flex flex-col items-center space-y-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">
          {t('auth.mfaTitle')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('auth.mfaDescription')}
        </p>
      </div>

      <div ref={otpContainerRef} className="flex flex-col items-center space-y-4">
        <InputOTP
          maxLength={6}
          value={code}
          onChange={handleCodeChange}
          disabled={isLoading}
          aria-label={t('auth.verificationCode')}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? 'mfa-verify-error' : undefined}
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
            id="mfa-verify-error"
            className="text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>

      <Button
        onClick={() => handleVerify(code)}
        disabled={isLoading || code.length !== 6}
        className="w-full max-w-65"
      >
        {isLoading ? (
          <div role="status" aria-label={t('auth.verifyingCode')}>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          </div>
        ) : null}
        {t('auth.verify')}
      </Button>
    </div>
  );
};

export default MFAVerification;
