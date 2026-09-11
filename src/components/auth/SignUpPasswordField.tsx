import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PASSWORD_POLICY } from '@/lib/passwordPolicy';
import { useI18n } from '@/i18n';

type PasswordComplexity = {
  valid: boolean;
  hasMinLength: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  errors: string[];
};

type SignUpPasswordFieldProps = {
  password: string;
  complexity: PasswordComplexity;
  strength: number;
  error: string | null;
  onChange: (value: string) => void;
  onBlur: () => void;
};

const SignUpPasswordField: React.FC<SignUpPasswordFieldProps> = ({
  password,
  complexity,
  strength,
  error,
  onChange,
  onBlur,
}) => {
  const { t } = useI18n();
  const strengthKeys = [
    'auth.strengthVeryWeak',
    'auth.strengthWeak',
    'auth.strengthFair',
    'auth.strengthGood',
    'auth.strengthStrong',
  ];
  const strengthLabel = t(strengthKeys[Math.max(0, Math.min(strength, 4))]);

  return (
    <div className="space-y-2">
      <Label htmlFor="signup-password">{t('auth.password')}</Label>
      <Input
        id="signup-password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        required
        minLength={PASSWORD_POLICY.minLength}
        aria-invalid={!!error}
        aria-describedby={error ? 'signup-password-hint signup-password-error' : 'signup-password-hint'}
      />
      <div id="signup-password-hint" className="space-y-2 text-sm">
        <p className="text-muted-foreground">{t('auth.passwordMustHave')}</p>
        <ul className="space-y-1">
          <li className={complexity.hasMinLength ? 'text-success' : 'text-muted-foreground'}>
            {complexity.hasMinLength ? <CheckCircle className="inline h-3 w-3 mr-1" /> : <XCircle className="inline h-3 w-3 mr-1" />}
            {t('auth.minCharacters', { count: PASSWORD_POLICY.minLength })}
          </li>
          <li className={complexity.hasNumber ? 'text-success' : 'text-muted-foreground'}>
            {complexity.hasNumber ? <CheckCircle className="inline h-3 w-3 mr-1" /> : <XCircle className="inline h-3 w-3 mr-1" />}
            {t('auth.oneNumber')}
          </li>
          <li className={complexity.hasSymbol ? 'text-success' : 'text-muted-foreground'}>
            {complexity.hasSymbol ? <CheckCircle className="inline h-3 w-3 mr-1" /> : <XCircle className="inline h-3 w-3 mr-1" />}
            {t('auth.oneSymbol')}
          </li>
        </ul>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t('auth.strength')}</span>
            <span>{strengthLabel}</span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(seg => (
              <div
                key={seg}
                className={`h-1.5 flex-1 rounded-full ${strength >= seg ? 'bg-primary' : 'bg-muted'}`}
              />
            ))}
          </div>
        </div>
      </div>
      {error && (
        <p id="signup-password-error" className="text-sm text-destructive" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
};

export default SignUpPasswordField;
