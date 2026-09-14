import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { persistDashboardOrganizationSelection } from '@/utils/organizationSelection';
import { useI18n } from '@/i18n';

interface InvitationData {
  id: string;
  email: string;
  role: 'admin' | 'member';
  status: string;
  organization_id: string;
  organization_name: string;
  inviter_name: string;
  message?: string;
  expires_at: string;
}

interface AcceptInvitationResponse {
  success: boolean;
  error?: string;
  organization_id?: string;
  organization_name?: string;
  role?: string;
}

const InvitationAccept = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isLoading: sessionLoading, refreshSession, switchOrganization } = useSession();
  const { user } = useAuth();
  const { t, language } = useI18n();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) {
        setError(t('invitationAccept.invalidLink'));
        setLoading(false);
        return;
      }

      try {
        // Use the secure function to fetch invitation details
        const { data: invitationData, error: invitationError } = await supabase
          .rpc('get_invitation_by_token_secure', {
            p_token: token
          });

        if (invitationError) throw invitationError;

        if (!invitationData || invitationData.length === 0) {
          setError(t('invitationAccept.notFound'));
          setLoading(false);
          return;
        }

        const invitation = invitationData[0];
        
        setInvitation({
          id: invitation.id,
          email: invitation.email,
          role: invitation.role as 'admin' | 'member',
          status: invitation.status,
          organization_id: invitation.organization_id,
          organization_name: invitation.organization_name || t('invitationAccept.unknownOrganization'),
          inviter_name: invitation.invited_by_name || t('invitationAccept.unknownUser'),
          message: invitation.message,
          expires_at: invitation.expires_at
        });

      } catch (err: unknown) {
        logger.error('Error fetching invitation', err);
        setError(err instanceof Error ? err.message : t('invitationAccept.loadFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token, t]);

  const handleAcceptInvitation = async () => {
    if (!invitation || !user || !token) return;

    setAccepting(true);
    
    try {
      // Use the atomic function to accept the invitation
      const { data, error } = await supabase.rpc('accept_invitation_atomic', {
        p_invitation_token: token
      });

      if (error) throw error;

      const result = data as unknown as AcceptInvitationResponse;
      
      if (!result?.success) {
        toast.error(result?.error || t('invitationAccept.acceptFailed'));
        return;
      }

      toast.success(t('invitationAccept.welcome', { organization: result.organization_name ?? invitation.organization_name }));

      const invitedOrganizationId = result.organization_id ?? invitation.organization_id;

      if (invitedOrganizationId) {
        persistDashboardOrganizationSelection(invitedOrganizationId);
      }

      await refreshSession(true);

      if (invitedOrganizationId) {
        try {
          await switchOrganization(invitedOrganizationId);
        } catch (switchError) {
          logger.warn('Could not switch session to invited organization after accept', switchError);
        }
      }

      navigate('/dashboard', { replace: true });

    } catch (err: unknown) {
      logger.error('Error accepting invitation', err);
      toast.error(err instanceof Error ? err.message : t('invitationAccept.acceptFailed'));
    } finally {
      setAccepting(false);
    }
  };

  const handleDeclineInvitation = async () => {
    if (!invitation || !token) return;

    try {
      const { error } = await supabase
        .from('organization_invitations')
        .update({ 
          status: 'declined',
          declined_at: new Date().toISOString()
        })
        .eq('invitation_token', token);

      if (error) throw error;

      toast.success(t('invitationAccept.declined'));
      navigate('/');

    } catch (err: unknown) {
      console.error('Error declining invitation:', err);
      toast.error(t('invitationAccept.declineFailed'));
    }
  };

  if (loading || sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
            <p className="text-center text-muted-foreground mt-4">{t('invitationAccept.loading')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>{t('invitationAccept.invalid')}</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              {error || t('invitationAccept.invalidOrExpired')}
            </p>
            <Button onClick={() => navigate('/')}>
              {t('invitationAccept.dashboard')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if invitation is expired
  const isExpired = new Date(invitation.expires_at) < new Date();
  const isAlreadyProcessed = invitation.status !== 'pending';

  if (isExpired || isAlreadyProcessed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle>
              {isExpired ? t('invitationAccept.expired') : t('invitationAccept.processed')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              {isExpired 
                ? t('invitationAccept.expiredDescription')
                : t('invitationAccept.processedDescription', { status: invitation.status === 'accepted' ? t('invitationAccept.accepted') : invitation.status === 'declined' ? t('invitationAccept.declinedStatus') : invitation.status })
              }
            </p>
            <Button onClick={() => navigate('/')}>
              {t('invitationAccept.dashboard')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    // Store pending redirect back to this invitation URL
    const currentPath = window.location.pathname + window.location.search;
    sessionStorage.setItem('pendingRedirect', currentPath);

    // Build auth URL with signup tab and prefilled email
    const authParams = new URLSearchParams();
    authParams.set('tab', 'signup');
    if (invitation.email) authParams.set('email', invitation.email);
    if (invitation.organization_id) authParams.set('invitedOrgId', invitation.organization_id);
    if (invitation.organization_name) authParams.set('invitedOrgName', invitation.organization_name);

    navigate(`/auth?${authParams.toString()}`, { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-2xl">{t('invitationAccept.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">
              {t('invitationAccept.invitedToJoin')}
            </h3>
            <p className="text-2xl font-bold text-primary mb-2">
              {invitation.organization_name}
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-muted-foreground">{t('invitationAccept.asA')}</span>
              <Badge variant="outline" className="capitalize">
                {t(`invitationAccept.${invitation.role}`)}
              </Badge>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">{t('invitationAccept.invitedBy')}</p>
            <p className="font-medium">{invitation.inviter_name}</p>
            {invitation.message && (
              <>
                <p className="text-sm text-muted-foreground mt-3 mb-1">{t('invitationAccept.personalMessage')}</p>
                <p className="text-sm italic bg-background p-3 rounded border-l-4 border-primary">
                  "{invitation.message}"
                </p>
              </>
            )}
          </div>

          <div className="bg-info/10 rounded-lg p-4">
            <h4 className="font-semibold text-info mb-2">{t('invitationAccept.accessTitle')}</h4>
            <ul className="text-sm text-info space-y-1">
              <li>• {t('invitationAccept.equipment')}</li>
              <li>• {t('invitationAccept.workOrders')}</li>
              <li>• {t('invitationAccept.teams')}</li>
              <li>• {t('invitationAccept.qr')}</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={handleAcceptInvitation}
              disabled={accepting}
              className="flex-1"
            >
              {accepting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  {t('invitationAccept.accepting')}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t('invitationAccept.accept')}
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDeclineInvitation}
              disabled={accepting}
            >
              {t('invitationAccept.decline')}
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            {t('invitationAccept.expiresOn', { date: new Date(invitation.expires_at).toLocaleDateString(language === 'vi' ? 'vi-VN' : language === 'ko' ? 'ko-KR' : 'en-US') })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvitationAccept;
