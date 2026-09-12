import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';

interface RestrictedOrganizationAccessProps {
  currentOrganizationName: string;
}

const RestrictedOrganizationAccess: React.FC<RestrictedOrganizationAccessProps> = ({
  currentOrganizationName
}) => {
  const { t } = useI18n();
  const { organizations, switchOrganization } = useOrganization();
  const navigate = useNavigate();

  // Find organizations where user is an owner
  const ownedOrganizations = organizations.filter(org => org.userRole === 'owner');

  const handleSwitchToOwnedOrganization = () => {
    if (ownedOrganizations.length > 0) {
      const firstOwnedOrg = ownedOrganizations[0];
      switchOrganization(firstOwnedOrg.id);
      // Navigate to organization page for the organization they own
      navigate('/dashboard/organization');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('organizationHub.restrictedTitle')}</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          {t('organizationHub.restrictedFor', { name: currentOrganizationName })}
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-4">
            <AlertCircle className="h-6 w-6 text-warning mt-0.5 flex-shrink-0" />
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground">
                  {t('organizationHub.adminRequired')}
                </h3>
                <p className="text-muted-foreground mt-2">
                  {t('organizationHub.adminExplanation')}
                  {ownedOrganizations.length > 0 && (
                    <>
                      {t('organizationHub.or')}
                      <Button
                        variant="link"
                        className="p-0 h-auto font-normal text-primary underline"
                        onClick={handleSwitchToOwnedOrganization}
                      >
                        {t('organizationHub.switchToOwn')}
                      </Button>
                      .
                    </>
                  )}
                  {ownedOrganizations.length === 0 && '.'}
                </p>
              </div>
              
              {ownedOrganizations.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  {t('organizationHub.memberWithoutOwn', { name: currentOrganizationName })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RestrictedOrganizationAccess;
