import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, AlertTriangle } from 'lucide-react';
import { getEquipmentDeletionImpact } from '@/features/equipment/services/deleteEquipmentService';
import { useDeleteEquipment } from '@/features/equipment/hooks/useDeleteEquipment';
import { useI18n } from '@/i18n';

interface DeleteEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentId: string;
  equipmentName: string;
  orgId: string;
  onSuccess: () => void;
}

export const DeleteEquipmentDialog = ({ 
  open, 
  onOpenChange, 
  equipmentId, 
  equipmentName,
  orgId,
  onSuccess 
}: DeleteEquipmentDialogProps) => {
  const [step, setStep] = useState<'initial' | 'confirmation'>('initial');
  const [acknowledged, setAcknowledged] = useState(false);
  const { t } = useI18n();
  const deleteEquipmentMutation = useDeleteEquipment();

  useEffect(() => {
    if (!open) {
      setStep('initial');
      setAcknowledged(false);
    }
  }, [open]);

  const { data: impact, isLoading: impactLoading } = useQuery({
    queryKey: ['equipment-deletion-impact', equipmentId],
    queryFn: () => getEquipmentDeletionImpact(equipmentId),
    enabled: open && step === 'initial',
  });

  const handleContinue = () => setStep('confirmation');

  const handleDelete = async () => {
    try {
      await deleteEquipmentMutation.mutateAsync({ equipmentId, orgId });
      onSuccess();
      onOpenChange(false);
      setStep('initial');
      setAcknowledged(false);
    } catch {
      // Error handling is done in the mutation
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setStep('initial');
    setAcknowledged(false);
  };

  const handleDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setStep('initial');
      setAcknowledged(false);
    }
    onOpenChange(nextOpen);
  };

  const totalImages = (impact?.equipmentNoteImages || 0) + (impact?.workOrderImages || 0);

  if (step === 'initial') {
    return (
      <AlertDialog open={open} onOpenChange={handleDialogChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t('equipmentDelete.initialTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>{t('equipmentDelete.initialDescription', { name: equipmentName })}</p>
                {impactLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('equipmentDelete.calculatingImpact')}
                  </div>
                ) : impact ? (
                  <div className="bg-muted rounded-lg p-4 space-y-2">
                    <div className="font-medium">{t('equipmentDelete.willDelete')}</div>
                    <ul className="space-y-1">
                      <li>• {t('equipmentDelete.workOrders')}: <strong>{impact.workOrders}</strong></li>
                      <li>• {t('equipmentDelete.pmRecords')}: <strong>{impact.pmCount}</strong></li>
                      <li>• {t('equipmentDelete.images')}: <strong>{totalImages}</strong></li>
                    </ul>
                  </div>
                ) : null}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>{t('equipmentDelete.cancel')}</AlertDialogCancel>
            <Button onClick={handleContinue} variant="destructive" disabled={impactLoading}>
              {t('equipmentDelete.continue')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {t('equipmentDelete.confirmTitle')}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="font-medium text-destructive mb-2">{t('equipmentDelete.cannotUndo')}</p>
                <p>{t('equipmentDelete.confirmDescription', { name: equipmentName })}</p>
                <ul className="mt-2 space-y-1">
                  <li>• {t('equipmentDelete.equipmentRecord')}</li>
                  <li>• {t('equipmentDelete.allWorkOrders')}</li>
                  <li>• {t('equipmentDelete.allPmRecords')}</li>
                  <li>• {t('equipmentDelete.allImages')}</li>
                </ul>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="acknowledge"
                  checked={acknowledged}
                  onCheckedChange={(checked) => setAcknowledged(checked === true)}
                />
                <label htmlFor="acknowledge" className="leading-5 cursor-pointer">
                  {t('equipmentDelete.acknowledge')}
                </label>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>{t('equipmentDelete.cancel')}</Button>
          <Button 
            variant="destructive"
            onClick={handleDelete}
            disabled={!acknowledged || deleteEquipmentMutation.isPending}
          >
            {deleteEquipmentMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('equipmentDelete.deleting')}
              </>
            ) : t('equipmentDelete.deleteForever')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
