import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/i18n';

type SignUpConfirmPasswordFieldProps = {
  confirmPassword: string;
  passwordMatch: boolean | null;
  onChange: (value: string) => void;
  onBlur: () => void;
};

const SignUpConfirmPasswordField: React.FC<SignUpConfirmPasswordFieldProps> = ({
  confirmPassword,
  passwordMatch,
  onChange,
  onBlur,
}) => {
  const { t } = useI18n();

  return (
    <div className="space-y-2">
      <Label htmlFor="signup-confirm-password">{t('auth.confirmPassword')}</Label>
      <div className="relative">
        <Input
          id="signup-confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          required
          className={
            passwordMatch === false
              ? 'border-destructive'
              : passwordMatch === true
                ? 'border-success/30'
                : ''
          }
        />
        {passwordMatch !== null && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {passwordMatch ? (
              <CheckCircle className="h-4 w-4 text-success" aria-label={t('auth.passwordsMatch')} />
            ) : (
              <XCircle className="h-4 w-4 text-destructive" aria-label={t('auth.passwordsDoNotMatch')} />
            )}
          </div>
        )}
      </div>
      {passwordMatch === false && <p className="text-sm text-destructive">{t('auth.passwordsDoNotMatch')}</p>}
    </div>
  );
};

export default SignUpConfirmPasswordField;
