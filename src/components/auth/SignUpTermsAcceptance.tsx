import React from 'react';
import { Link } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { useI18n } from '@/i18n';

type SignUpTermsAcceptanceProps = {
  termsAccepted: boolean;
  error: string | null;
  onCheckedChange: (accepted: boolean) => void;
};

const SignUpTermsAcceptance: React.FC<SignUpTermsAcceptanceProps> = ({
  termsAccepted,
  error,
  onCheckedChange,
}) => {
  const { t } = useI18n();

  return (
    <>
      <div className="flex items-start gap-2 rounded-md border border-border p-3">
        <Checkbox
          id="terms-accept"
          checked={termsAccepted}
          onCheckedChange={v => onCheckedChange(v === true)}
          aria-invalid={!!error}
        />
        <label htmlFor="terms-accept" className="text-sm leading-snug cursor-pointer">
          {t('auth.termsPrefix')}{' '}
          <Link to="/terms-of-service" className="text-primary underline underline-offset-2" target="_blank" rel="noreferrer">
            {t('auth.termsOfService')}
          </Link>{' '}
          {t('auth.and')}{' '}
          <Link to="/privacy-policy" className="text-primary underline underline-offset-2" target="_blank" rel="noreferrer">
            {t('auth.privacyPolicy')}
          </Link>
          .
        </label>
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </>
  );
};

export default SignUpTermsAcceptance;
