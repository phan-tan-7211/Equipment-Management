import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useI18n } from '@/i18n';
import { getFinalHardcodedAuditCopy } from '@/i18n/finalHardcodedAuditCopy';

type UseWorkOrderDetailsNotesComposerParams = {
  notesSectionRef: React.RefObject<HTMLDivElement | null>;
  isOnline: boolean;
};

export function useWorkOrderDetailsNotesComposer({
  notesSectionRef,
  isOnline,
}: UseWorkOrderDetailsNotesComposerParams) {
  const { language } = useI18n();
  const copy = getFinalHardcodedAuditCopy(language);
  const [openNoteFormTrigger, setOpenNoteFormTrigger] = useState(0);
  const [openCaptureTrigger, setOpenCaptureTrigger] = useState(0);

  const openNotesComposer = useCallback(() => {
    setOpenNoteFormTrigger((prev) => prev + 1);
    setTimeout(() => {
      notesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }, [notesSectionRef]);

  const openPhotoCapture = useCallback(() => {
    if (!isOnline) {
      toast.error(copy.photosNeedConnection);
      return;
    }
    setOpenNoteFormTrigger((prev) => prev + 1);
    setOpenCaptureTrigger((prev) => prev + 1);
    setTimeout(() => {
      notesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }, [copy.photosNeedConnection, isOnline, notesSectionRef]);

  return {
    openNoteFormTrigger,
    openCaptureTrigger,
    openNotesComposer,
    openPhotoCapture,
  };
}
