import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

interface AutoAssignmentBannerProps {
  unassignedCount: number;
  onAssignAll: () => void;
  isAssigning: boolean;
}

export const AutoAssignmentBanner: React.FC<AutoAssignmentBannerProps> = ({
  unassignedCount,
  onAssignAll,
  isAssigning
}) => {
  const { t } = useI18n();
  if (unassignedCount === 0) return null;

  return (
    <Card className="border-info/30 bg-info/10 dark:border-info/40 dark:bg-info/15">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-info dark:text-info">
              {t(unassignedCount === 1 ? 'workOrderMobile.unassignedOne' : 'workOrderMobile.unassignedMany', { count: unassignedCount })}
            </h3>
            <p className="text-sm text-info dark:text-info mt-1">
              {t('workOrderMobile.autoAssignDescription')}
            </p>
          </div>
          <Button
            onClick={onAssignAll}
            disabled={isAssigning}
            className="bg-info hover:bg-info/90 text-primary-foreground"
          >
            {t(isAssigning ? 'workOrderMobile.assigning' : 'workOrderMobile.assignAll')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};


