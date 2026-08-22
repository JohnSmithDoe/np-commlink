import { createActionGroup, emptyProps } from '@ngrx/store';
import dayjs from 'dayjs';
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

    addImage: (
      noteId: string,
      imageId: NoteImageId,
      dataUrl: string,
      at: string = dayjs().format()
    ) => ({ noteId, imageId, dataUrl, at }),
    removeImage: (
      noteId: string,
      imageId: NoteImageId,
      at: string = dayjs().format()
    ) => ({ noteId, imageId, at }),
    rotateImage: (imageId: NoteImageId) => ({ imageId }),
  },
});
