import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { useAuthFlowCopy } from './useAuthFlowCopy';

export default function IdleSessionTimeoutGuard() {
  const t = useAuthFlowCopy();
  const { user, signOut } = useAuth();

  const { isWarningOpen, secondsRemaining, staySignedIn, signOutNow } = useIdleTimeout({
    enabled: !!user,
    onTimeout: async () => {
      await signOut();
      window.location.assign('/auth');
    },
  });

  return (
    <AlertDialog open={isWarningOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('authFlow.sessionExpiring')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t(secondsRemaining === 1 ? 'authFlow.inactivityOne' : 'authFlow.inactivityMany', { count: secondsRemaining })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={staySignedIn}>{t('authFlow.staySignedIn')}</AlertDialogCancel>
          <AlertDialogAction onClick={() => void signOutNow()}>{t('authFlow.signOutNow')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
