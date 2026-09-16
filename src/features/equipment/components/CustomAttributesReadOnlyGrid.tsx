import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  getLocalizedCustomAttributeKey,
  renderCustomAttributeValue,
} from '@/features/equipment/utils/customAttributeDisplay';
import { useI18n } from '@/i18n';

type CustomAttributesReadOnlyGridProps = {
  attributes: Record<string, unknown>;
};

export function CustomAttributesReadOnlyGrid({ attributes }: CustomAttributesReadOnlyGridProps) {
  const { t } = useI18n();
  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-4">
        {Object.entries(attributes).map(([key, val]) => (
          <div key={key} className="p-3 border rounded-lg min-w-[200px] flex-1 basis-[200px] max-w-full break-words">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-sm font-medium text-muted-foreground mb-1 cursor-default">
                  {getLocalizedCustomAttributeKey(key, t)}
                </div>
              </TooltipTrigger>
              {getLocalizedCustomAttributeKey(key, t) !== key && (
                <TooltipContent side="top">
                  <p>{key}</p>
                </TooltipContent>
              )}
            </Tooltip>
            {renderCustomAttributeValue(val, t)}
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
