import React from 'react';
import { useI18n } from '@/i18n';

type SignUpInviteBannerProps = {
  invitedOrgName: string;
  invitationOnly?: boolean;
};

const SignUpInviteBanner: React.FC<SignUpInviteBannerProps> = ({ invitedOrgName, invitationOnly = false }) => {
  const { t } = useI18n();

  return (
    <div className="bg-info/10 border border-info/30 rounded-lg p-3 text-sm">
      <p className="text-info">{t(invitationOnly ? 'auth.inviteOnlyBanner' : 'auth.inviteBanner', { name: invitedOrgName })}</p>
    </div>
  );
};

export default SignUpInviteBanner;
