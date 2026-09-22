import { toast } from 'sonner';
import type { NoteEditSubmitPayload } from '@/components/common/NoteEditDialog';
import type { NoteActionPermissions } from '@/components/common/noteCardPermissions';
import { finalHardcodedAuditCopy } from '@/i18n/finalHardcodedAuditCopy';
import { getRuntimeFinalHardcodedAuditCopy } from '@/i18n/finalHardcodedAuditRuntime';

type NoteForPermissions = {
  id: string;
  author_id: string;
  created_at: string;
};

type NoteMutationMessages = Pick<
  typeof finalHardcodedAuditCopy.en,
  | 'noteUpdated'
  | 'noteUpdateFailed'
  | 'noteDeleted'
  | 'noteDeleteFailed'
  | 'notePrivate'
  | 'notePublic'
  | 'noteVisibilityFailed'
  | 'noteNoEditPermission'
  | 'noteNoImagePermission'
  | 'noteNoDeletePermission'
  | 'noteNoVisibilityPermission'
>;

interface NoteMutationDeps<TNote extends NoteForPermissions> {
  organizationId?: string;
  setMutatingNoteId: (id: string | null) => void;
  invalidateNotes: () => void;
  resolvePermissions: (note: TNote) => NoteActionPermissions;
  updateNote: (
    note: TNote,
    payload: { content?: string; isPrivate?: boolean },
  ) => Promise<void>;
  deleteNote: (note: TNote) => Promise<void>;
  deleteNoteImage: (imageId: string) => Promise<void>;
  addNoteImages: (note: TNote, files: File[]) => Promise<void>;
  messages?: NoteMutationMessages;
}

function denyMutation(message: string): never {
  toast.error(message);
  throw new Error(message);
}

export function createNoteMutationHandlers<TNote extends NoteForPermissions>(
  deps: NoteMutationDeps<TNote>,
) {
  const messages = deps.messages ?? getRuntimeFinalHardcodedAuditCopy();

  const handleEditNote = async (note: TNote, payload: NoteEditSubmitPayload) => {
    if (!deps.organizationId) return;
    const perms = deps.resolvePermissions(note);
    if (!perms.canEdit) {
      denyMutation(messages.noteNoEditPermission);
    }
    if (
      (payload.removedImageIds.length > 0 || payload.newImages.length > 0) &&
      !perms.canManageImages
    ) {
      denyMutation(messages.noteNoImagePermission);
    }

    deps.setMutatingNoteId(note.id);
    try {
      await deps.updateNote(note, {
        content: payload.content,
        isPrivate: payload.isPrivate,
      });
      for (const imageId of payload.removedImageIds) {
        await deps.deleteNoteImage(imageId);
      }
      if (payload.newImages.length > 0) {
        await deps.addNoteImages(note, payload.newImages);
      }
      deps.invalidateNotes();
      toast.success(messages.noteUpdated);
    } catch (error) {
      if (
        error instanceof Error &&
        ([
          messages.noteNoEditPermission,
          messages.noteNoImagePermission,
          messages.noteNoDeletePermission,
          messages.noteNoVisibilityPermission,
        ] as string[]).includes(error.message)
      ) {
        throw error;
      }
      console.error('Failed to update note:', error);
      toast.error(messages.noteUpdateFailed);
      throw error;
    } finally {
      deps.setMutatingNoteId(null);
    }
  };

  const handleDeleteNote = async (note: TNote) => {
    if (!deps.organizationId) return;
    const perms = deps.resolvePermissions(note);
    if (!perms.canDelete) {
      denyMutation(messages.noteNoDeletePermission);
    }

    deps.setMutatingNoteId(note.id);
    try {
      await deps.deleteNote(note);
      deps.invalidateNotes();
      toast.success(messages.noteDeleted);
    } catch (error) {
      if (error instanceof Error && error.message === messages.noteNoDeletePermission) {
        throw error;
      }
      console.error('Failed to delete note:', error);
      toast.error(messages.noteDeleteFailed);
      throw error;
    } finally {
      deps.setMutatingNoteId(null);
    }
  };

  const handleToggleVisibility = async (note: TNote, isPrivate: boolean) => {
    if (!deps.organizationId) return;
    const perms = deps.resolvePermissions(note);
    if (!perms.canToggleVisibility) {
      denyMutation(messages.noteNoVisibilityPermission);
    }

    deps.setMutatingNoteId(note.id);
    try {
      await deps.updateNote(note, { isPrivate });
      deps.invalidateNotes();
      toast.success(isPrivate ? messages.notePrivate : messages.notePublic);
    } catch (error) {
      if (error instanceof Error && error.message === messages.noteNoVisibilityPermission) {
        throw error;
      }
      console.error('Failed to update note visibility:', error);
      toast.error(messages.noteVisibilityFailed);
      throw error;
    } finally {
      deps.setMutatingNoteId(null);
    }
  };

  return { handleEditNote, handleDeleteNote, handleToggleVisibility };
}
