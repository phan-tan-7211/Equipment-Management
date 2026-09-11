import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n';

const SignUpPrivacyNotice: React.FC = () => {
  const { t } = useI18n();

  return (
    <p className="text-sm text-muted-foreground leading-relaxed">
      {t('auth.privacyNoticePrefix')}{' '}
      <Link to="/privacy-policy#notice-at-collection" className="text-primary underline underline-offset-2">
        {t('auth.privacyNoticeAtCollection')}
      </Link>
      .
    </p>
  );
};

export default SignUpPrivacyNotice;
