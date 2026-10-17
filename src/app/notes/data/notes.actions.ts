import { createActionGroup, emptyProps } from '@ngrx/store';
import dayjs from 'dayjs';
import { createItemListActionEvents } from '../../@shared/data/item-lists/item-list.actions.factory';
import {
  Note,
  NoteImageId,
  NotePicture,
  NotesState,
} from '../model/notes.types';

export const NotesActions = createActionGroup({
  source: 'Notes',
  events: {
    load: emptyProps(),
    loaded: (notes: NotesState | null) => ({ notes }),

    ...createItemListActionEvents<Note>(),

    discardBlank: (id: string) => ({ id }),
    togglePin: (id: string) => ({ id }),
    reorderSection: (isPinned: boolean, ids: string[]) => {
      return {
        pinned: isPinned,
        ids,
      };
    },

    addImage: (
      noteId: string,
      imageId: NoteImageId,
      picture: NotePicture,
      at: string = dayjs().format()
    ) => ({ noteId, imageId, picture, at }),
    removeImage: (
      noteId: string,
      imageId: NoteImageId,
      at: string = dayjs().format()
    ) => ({ noteId, imageId, at }),
    rotateImage: (imageId: NoteImageId) => ({ imageId }),
  },
});
