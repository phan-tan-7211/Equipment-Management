import React from 'react';
import { useI18n } from '@/i18n';

type SignUpInviteBannerProps = {
  invitedOrgName: string;
};

const SignUpInviteBanner: React.FC<SignUpInviteBannerProps> = ({ invitedOrgName }) => {
  const { t } = useI18n();

  return (
    <div className="bg-info/10 border border-info/30 rounded-lg p-3 text-sm">
      <p className="text-info">{t('auth.inviteMessage', { name: invitedOrgName })}</p>
    </div>
  );
};

export default SignUpInviteBanner;
