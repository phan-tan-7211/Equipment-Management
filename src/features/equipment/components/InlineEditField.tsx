
import React, { useState } from 'react';
import { useMountFocus } from '@/components/a11y/keyboard';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Edit2 } from 'lucide-react';
import { logger } from '@/utils/logger';
import { cn } from '@/lib/utils';
import { useFormatTimestamp } from '@/hooks/useFormatTimestamp';
import { useIsMobile } from '@/hooks/use-mobile';
import { useI18n } from '@/i18n';
import {
  desktopHoverEditIconClassName,
  desktopInlineEditRowClassName,
  inlineEditIconClassName,
  mobileInlineEditRowClassName,
  mobileInlineEditValueClassName,
} from './inlineEditStyles';

function EmptyFieldDisplay({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <span
      className={cn('text-muted-foreground/50 not-italic font-sans', className)}
      aria-label={t('equipmentInline.noValueSet')}
    >
      —
    </span>
  );
}

interface InlineEditFieldProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  canEdit: boolean;
  fieldId?: string;
  type?: 'text' | 'textarea' | 'date' | 'select' | 'number';
  selectOptions?: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  displayNode?: React.ReactNode;
  editAriaLabel?: string;
}

const InlineEditField: React.FC<InlineEditFieldProps> = ({
  value,
  onSave,
  canEdit,
  fieldId,
  type = 'text',
  selectOptions,
  placeholder,
  className = '',
  displayNode,
  editAriaLabel
}) => {
  const { t } = useI18n();
  const { formatDate } = useFormatTimestamp();
  const isMobile = useIsMobile();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const textInputRef = useMountFocus<HTMLInputElement>(isEditing && type !== 'textarea' && type !== 'select');
  const textareaRef = useMountFocus<HTMLTextAreaElement>(isEditing && type === 'textarea');

  React.useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      if (import.meta.env.DEV) {
        logger.debug('InlineEditField saving', { type, oldValue: value, newValue: editValue });
      }
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      if (import.meta.env.DEV) {
        logger.error('Error saving field', error);
      }
      setEditValue(value);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && type !== 'textarea') {
      void handleSave();
    } else if (event.key === 'Escape') {
      handleCancel();
    }
  };

  const getDisplayContent = (): React.ReactNode => {
    if (!value) {
      return <EmptyFieldDisplay />;
    }

    if (type === 'select' && selectOptions) {
      const option = selectOptions.find((item) => item.value === value);
      return option ? option.label : value;
    }

    if (type === 'date') {
      try {
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) {
          return formatDate(date);
        }
      } catch (error) {
        logger.error('Error formatting date for display', error);
      }
    }

    return value;
  };

  const resolvedDisplayNode = displayNode ?? getDisplayContent();

  if (!canEdit) {
    return <span className={className}>{resolvedDisplayNode}</span>;
  }

  const editLabel = editAriaLabel ?? t('equipmentInline.edit');

  if (!isEditing) {
    return (
      <div
        className={cn(
          isMobile ? mobileInlineEditRowClassName : desktopInlineEditRowClassName,
          className,
        )}
      >
        <span className={cn(isMobile && mobileInlineEditValueClassName, !isMobile && 'min-w-0')}>
          {resolvedDisplayNode}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className={isMobile ? inlineEditIconClassName : desktopHoverEditIconClassName}
          onClick={() => setIsEditing(true)}
          aria-label={editLabel}
        >
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {type === 'textarea' ? (
        <Textarea
          ref={textareaRef}
          id={fieldId}
          value={editValue}
          onChange={(event) => setEditValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[60px]"
        />
      ) : type === 'select' && selectOptions ? (
        <Select value={editValue} onValueChange={setEditValue}>
          <SelectTrigger id={fieldId} className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {selectOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          ref={textInputRef}
          id={fieldId}
          type={type}
          inputMode={type === 'number' ? 'decimal' : undefined}
          value={editValue}
          onChange={(event) => setEditValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
      )}
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => void handleSave()}
          disabled={isSaving}
          aria-label={t('equipmentInline.save')}
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={handleCancel}
          disabled={isSaving}
          aria-label={t('equipmentInline.cancel')}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export default InlineEditField;
