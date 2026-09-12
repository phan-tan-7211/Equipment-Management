import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Timer } from 'lucide-react';
import {
  usePMIntervalPolicy,
} from '@/features/pm-templates/hooks/usePMIntervalPolicies';
import { policyRowToFormState } from '@/features/pm-templates/services/pmIntervalPolicyService';
import { useI18n } from '@/i18n';

type TeamPMScheduleCardProps = {
  organizationId: string;
  teamId: string;
};

export function TeamPMScheduleCard({ organizationId, teamId }: TeamPMScheduleCardProps) {
  const { t } = useI18n();
  const { data: policy, isLoading } = usePMIntervalPolicy(
    organizationId,
    { scopeType: 'team', teamId }
  );
  const form = policyRowToFormState(policy);

  const summary = isLoading
    ? t('teamsCards.loadingPm')
    : form.mode === 'none'
      ? t('teamsCards.noRecurringPm')
      : form.mode === 'custom'
        ? form.intervalValue !== null && form.intervalValue > 0
          ? t('teamsCards.customInterval', { value: form.intervalValue, unit: t(form.intervalType === 'hours' ? 'teamsCards.workingHours' : 'teamsCards.calendarDays') })
          : t('teamsCards.customConfigured')
        : t('teamsCards.noTeamOverride');

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Timer className="h-4 w-4" />
          {t('teamsCards.pmSchedule')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{summary}</p>
      </CardContent>
    </Card>
  );
}
