/**
 * PendingTransferCard - Card for accepting/rejecting ownership transfer
 * 
 * Displays when the current user has a pending incoming transfer request.
 * Allows them to accept (with role selection) or reject the transfer.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { 
  ArrowRightLeft, 
  Check, 
  X, 
  Loader2, 
  Clock,
  Building2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { enUS, ko, vi } from 'date-fns/locale';
import { useI18n } from '@/i18n';
import { 
  useAcceptTransfer, 
  useRejectTransfer,
  type PendingTransferRequest 
} from '@/features/organization/hooks/useOwnershipTransfer';

interface PendingTransferCardProps {
  transfer: PendingTransferRequest;
}

export const PendingTransferCard: React.FC<PendingTransferCardProps> = ({
  transfer,
}) => {
  const { t, language } = useI18n();
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [departingOwnerRole, setDepartingOwnerRole] = useState<'admin' | 'member' | 'remove'>('admin');
  const [rejectReason, setRejectReason] = useState('');

  const acceptTransfer = useAcceptTransfer();
  const rejectTransfer = useRejectTransfer();

  const expiresIn = formatDistanceToNow(new Date(transfer.expires_at), { addSuffix: true, locale: language === 'vi' ? vi : language === 'ko' ? ko : enUS });
  const isExpiringSoon = new Date(transfer.expires_at).getTime() - Date.now() < 24 * 60 * 60 * 1000;

  const handleAccept = async () => {
    try {
      await acceptTransfer.mutateAsync({
        transferId: transfer.id,
        departingOwnerRole,
      });
      setShowAcceptDialog(false);
    } catch {
      // Error handled by mutation
    }
  };

  const handleReject = async () => {
    try {
      await rejectTransfer.mutateAsync({
        transferId: transfer.id,
        responseReason: rejectReason || undefined,
      });
      setShowRejectDialog(false);
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <>
      <Card className="border-primary bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-primary" />
              {t('organizationAdmin.transferRequest')}
            </CardTitle>
            <Badge variant={isExpiringSoon ? 'destructive' : 'secondary'}>
              <Clock className="h-3 w-3 mr-1" />
              {t('organizationAdmin.expires', { time: expiresIn })}
            </Badge>
          </div>
          <CardDescription>
            {t('organizationAdmin.incomingTransfer', { from: transfer.from_user_name, organization: transfer.organization_name })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {transfer.transfer_reason && (
            <div className="text-sm">
              <span className="text-muted-foreground">{t('organizationAdmin.reason', { reason: transfer.transfer_reason })}</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => setShowAcceptDialog(true)}
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-2" />
              {t('organizationAdmin.acceptOwnership')}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(true)}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              {t('organizationAdmin.decline')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Accept Dialog */}
      <AlertDialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t('organizationAdmin.acceptTransfer')}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  {t('organizationAdmin.becomeOwner', { name: transfer.organization_name })}
                </p>

                <div className="space-y-2">
                  <Label>{t('organizationAdmin.departingOwner', { name: transfer.from_user_name })}</Label>
                  <Select 
                    value={departingOwnerRole} 
                    onValueChange={(v) => setDepartingOwnerRole(v as 'admin' | 'member' | 'remove')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex flex-col">
                          <span>{t('organizationAdmin.keepAdmin')}</span>
                          <span className="text-xs text-muted-foreground">
                            {t('organizationAdmin.keepAdminHelp')}
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="member">
                        <div className="flex flex-col">
                          <span>{t('organizationAdmin.demoteMember')}</span>
                          <span className="text-xs text-muted-foreground">
                            {t('organizationAdmin.demoteHelp')}
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="remove">
                        <div className="flex flex-col">
                          <span>{t('organizationAdmin.removeFromOrg')}</span>
                          <span className="text-xs text-muted-foreground">
                            {t('organizationAdmin.removeHelp')}
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <p className="text-sm text-muted-foreground">
                  {t('organizationAdmin.personalOrgNote', { name: transfer.from_user_name })}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('organizationAdmin.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAccept}
              disabled={acceptTransfer.isPending}
            >
              {acceptTransfer.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('organizationAdmin.accepting')}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {t('organizationAdmin.acceptBecomeOwner')}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('organizationAdmin.declineTransfer')}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  {t('organizationAdmin.declineConfirm', { name: transfer.organization_name })}
                </p>
                <p>
                  {t('organizationAdmin.declineNotice', { name: transfer.from_user_name })}
                </p>

                <div className="space-y-2">
                  <Label htmlFor="reject-reason">{t('organizationAdmin.rejectReason')}</Label>
                  <Textarea
                    id="reject-reason"
                    placeholder={t('organizationAdmin.rejectPlaceholder')}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('organizationAdmin.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={rejectTransfer.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {rejectTransfer.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('organizationAdmin.declining')}
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  {t('organizationAdmin.declineButton')}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
