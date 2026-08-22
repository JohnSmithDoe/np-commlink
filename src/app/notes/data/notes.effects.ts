/* ─── why ─────────────────────────────────────────────────────────
 * The undo hop is hand-written rather than taken from
 * `createItemListEffects`. That factory ships `syncSearchOnRename$`,
 * which rewrites the search box on every `updateItem` — harmless for a
 * dialog that saves once, wrong for an editor that autosaves per
 * keystroke, and doubly so because it decides on the NAME while a note
 * may have matched the search by its body.
 * ───────────────────────────────────────────────────────────────── */

import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import {
  catchError,
  concatMap,
  EMPTY,
  filter,
  from,
  map,
  switchMap,
  take,
} from 'rxjs';
import { UndoActions } from '../../@shared/data/undo/undo.actions';
import { Note, NoteImageId } from '../model/notes.types';
import { rotateBase64 } from '../util/notes.utils';
import { NotesActions } from './notes.actions';
import { selectNotes } from './notes.selector';

const rotatedImages = (
  note: Note,
  imageId: NoteImageId,
  dataUrl: string
): Note['images'] =>
  note.images?.map((image) =>
    image.id === imageId ? { ...image, dataUrl } : image
  );

export const notesListEffects = {
  undoDelete$: createEffect(
    (actions$ = inject(Actions)) => {
      return actions$.pipe(
        ofType(NotesActions.removeItem),
        map(({ item }) =>
          UndoActions.pushed({
            name: item.name,
            action: NotesActions.addItem(item),
          })
        )
      );
    },
    { functional: true }
  ),

  rotateImage$: createEffect(
    (actions$ = inject(Actions), store = inject(Store)) => {
      return actions$.pipe(
        ofType(NotesActions.rotateImage),
        concatMap(({ noteId, imageId }) =>
          store.select(selectNotes).pipe(
            take(1),
            switchMap((notes) => {
              const note = notes.find((candidate) => candidate.id === noteId);
              const image = note?.images?.find(
                (candidate) => candidate.id === imageId
              );
              if (!note || !image) return EMPTY;
              return from(rotateBase64(image.dataUrl)).pipe(
                filter((rotated): rotated is string => !!rotated),
                map((rotated) =>
                  NotesActions.updateItem({
                    id: note.id,
                    name: note.name,
                    images: rotatedImages(note, imageId, rotated),
                  })
                )
              );
            }),
            catchError(() => EMPTY)
          )
        )
      );
    },
    { functional: true }
  ),
};
