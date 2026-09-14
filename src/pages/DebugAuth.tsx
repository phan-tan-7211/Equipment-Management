import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/i18n';

const DebugAuth = () => {
  const { t } = useI18n();
  const { user, session, isLoading, signOut } = useAuth();

  const handleClearStorage = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('authRoutes.debugAuthTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>{t('authRoutes.loadingState')}</strong> {isLoading ? 'true' : 'false'}
            </div>
            
            <div>
              <strong>{t('authRoutes.user')}</strong>
              <pre className="mt-2 p-2 bg-muted rounded text-sm overflow-auto">
                {user ? JSON.stringify(user, null, 2) : 'null'}
              </pre>
            </div>
            
            <div>
              <strong>{t('authRoutes.session')}</strong>
              <pre className="mt-2 p-2 bg-muted rounded text-sm overflow-auto">
                {session ? JSON.stringify(session, null, 2) : 'null'}
              </pre>
            </div>

            <div className="flex gap-2">
              <Button onClick={signOut} variant="outline">
                {t('authRoutes.signOut')}
              </Button>
              <Button onClick={handleClearStorage} variant="destructive">
                {t('authRoutes.clearStorage')}
              </Button>
              <Button onClick={() => window.location.href = '/auth'} variant="secondary">
                {t('authRoutes.goToAuth')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DebugAuth;
