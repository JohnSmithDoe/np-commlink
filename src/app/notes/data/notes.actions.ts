import { createActionGroup, emptyProps } from '@ngrx/store';
import { createItemListActionEvents } from '../../@shared/data/item-lists/item-list.actions.factory';
import { Note, NoteImageId, NotesState } from '../model/notes.types';

export const NotesActions = createActionGroup({
  source: 'Notes',
  events: {
    load: emptyProps(),
    loaded: (notes: NotesState | null) => ({ notes }),

    ...createItemListActionEvents<Note>(),

    discardBlank: (id: string) => ({ id }),
    togglePin: (id: string) => ({ id }),
    reorderSection: (pinned: boolean, ids: string[]) => ({ pinned, ids }),
    rotateImage: (noteId: string, imageId: NoteImageId) => ({
      noteId,
      imageId,
    }),
  },
});
