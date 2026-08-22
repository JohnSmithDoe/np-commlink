/* ─── why ─────────────────────────────────────────────────────────
 * The undo hop is hand-written rather than taken from
 * `createItemListEffects`. That factory ships `syncSearchOnRename$`,
 * which rewrites the search box on every `updateItem` — harmless for a
 * dialog that saves once, wrong for an editor that autosaves per
 * keystroke, and doubly so because it decides on the NAME while a note
 * may have matched the search by its body.
 *
 * The blob effects are where a picture's BYTES move; the reducer moves only
 * its id, so the slice and the store can never disagree about which images a
 * note has. Rotating dispatches nothing at all: the id does not change, and
 * the re-encoded bytes reach the template through the store's own signal.
 * ───────────────────────────────────────────────────────────────── */

import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, concatMap, EMPTY, filter, from } from 'rxjs';
import { pushUndoOnDelete } from '../../@shared/data/item-lists/item-list.effects.factory';
import { rotateBase64 } from '../util/notes.utils';
import { NoteImageStore } from './note-image.store';
import { NotesActions } from './notes.actions';

export const notesListEffects = {
  undoDelete$: pushUndoOnDelete(NotesActions.removeItem, NotesActions.addItem),

  storeImage$: createEffect(
    (actions$ = inject(Actions), images = inject(NoteImageStore)) => {
      return actions$.pipe(
        ofType(NotesActions.addImage),
        concatMap(({ imageId, dataUrl }) =>
          from(images.put(imageId, dataUrl)).pipe(catchError(() => EMPTY))
        )
      );
    },
    { functional: true, dispatch: false }
  ),

  dropImage$: createEffect(
    (actions$ = inject(Actions), images = inject(NoteImageStore)) => {
      return actions$.pipe(
        ofType(NotesActions.removeImage),
        concatMap(({ imageId }) =>
          from(images.drop([imageId])).pipe(catchError(() => EMPTY))
        )
      );
    },
    { functional: true, dispatch: false }
  ),

  rotateImage$: createEffect(
    (actions$ = inject(Actions), images = inject(NoteImageStore)) => {
      return actions$.pipe(
        ofType(NotesActions.rotateImage),
        concatMap(({ imageId }) =>
          from(rotateBase64(images.urlOf(imageId))).pipe(
            filter((rotated): rotated is string => !!rotated),
            concatMap((rotated) => images.put(imageId, rotated)),
            catchError(() => EMPTY)
          )
        )
      );
    },
    { functional: true, dispatch: false }
  ),

  collectImages$: createEffect(
    (actions$ = inject(Actions), images = inject(NoteImageStore)) => {
      return actions$.pipe(
        ofType(NotesActions.loaded),
        filter(({ notes }) => notes !== null),
        concatMap(({ notes }) =>
          from(
            images.collect(
              new Set(
                (notes?.list.items ?? []).flatMap((note) => note.images ?? [])
              )
            )
          ).pipe(catchError(() => EMPTY))
        )
      );
    },
    { functional: true, dispatch: false }
  ),
};
