/* ─── why ─────────────────────────────────────────────────────────
 * The editor has no save button, so every keystroke is a candidate
 * write — and a write here serialises the WHOLE slice, base64 images
 * included. The debounce is what makes that affordable; `flush()` is
 * what makes it safe, since leaving the page must not lose the last
 * few hundred milliseconds of typing.
 *
 * A note is created BEFORE the editor opens, so the route always names
 * a real note and the page needs no create/update mode. `leave()` pays
 * for that: a note still blank on the way out never existed as far as
 * the list is concerned, and `discardBlank` drops it without the undo
 * entry a real deletion earns.
 *
 * `leave()` is TOLD which note, and cannot read `note()` for it: the page
 * is destroyed after the router has already moved on, so by then the
 * route carries no `:id` and the route-derived note is undefined. The
 * caller is the only one that still knows.
 * ───────────────────────────────────────────────────────────────── */

import { computed, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Store } from '@ngrx/store';
import dayjs from 'dayjs';
import { debounceTime, Subject } from 'rxjs';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import { UpdateDTO } from '../../@shared/model/base-item.types';
import { uuidv4 } from '../../@shared/util/app.utils';
import { Note, NoteImage, NoteImageId } from '../model/notes.types';
import { isBlankNote } from '../util/notes.factory';
import { resolveImages } from '../util/notes.utils';
import { NoteImageStore } from './note-image.store';
import { NotesActions } from './notes.actions';
import { selectNotes, selectRouteNote } from './notes.selector';

const AUTOSAVE_DELAY = 400;

@Injectable({ providedIn: 'root' })
export class NoteEditorFacade {
  readonly #store = inject(Store);
  readonly #router = inject(Router);
  readonly #edits = new Subject<void>();

  #pending: UpdateDTO<Note> | undefined;

  readonly #images = inject(NoteImageStore);

  readonly note = this.#store.selectSignal(selectRouteNote);

  readonly images = computed<NoteImage[]>(() =>
    resolveImages(this.note()?.images, this.#images.urls())
  );

  readonly #notes = this.#store.selectSignal(selectNotes);

  constructor() {
    this.#edits
      .pipe(debounceTime(AUTOSAVE_DELAY), takeUntilDestroyed())
      .subscribe(() => this.flush());
  }

  edit(patch: Pick<Partial<Note>, 'name' | 'body'>): void {
    const note = this.note();
    if (!note) return;
    this.#pending = {
      ...(this.#pending ?? { id: note.id, name: note.name }),
      ...patch,
      id: note.id,
    };
    this.#edits.next();
  }

  flush(): void {
    const patch = this.#pending;
    this.#pending = undefined;
    if (patch) this.#save(patch);
  }

  leave(noteId: string): void {
    this.flush();
    const note = this.#notes().find((candidate) => candidate.id === noteId);
    if (note && isBlankNote(note)) {
      this.#store.dispatch(NotesActions.discardBlank(noteId));
    }
  }

  addImage(dataUrl: string): void {
    this.flush();
    const note = this.note();
    if (!note) return;
    this.#store.dispatch(NotesActions.addImage(note.id, uuidv4(), dataUrl));
  }

  removeImage(imageId: NoteImageId): void {
    this.flush();
    const note = this.note();
    if (!note) return;
    this.#store.dispatch(NotesActions.removeImage(note.id, imageId));
  }

  togglePin(): void {
    const note = this.note();
    if (note) this.#store.dispatch(NotesActions.togglePin(note.id));
  }

  rotateImage(imageId: NoteImageId): void {
    this.#store.dispatch(NotesActions.rotateImage(imageId));
  }

  removeNote(): void {
    const note = this.note();
    this.#pending = undefined;
    if (!note) return;
    this.#store.dispatch(NotesActions.removeItem(note));
    void this.#router.navigate(['/notes']);
  }

  reportUploadFailure(): void {
    this.#store.dispatch(
      NotificationsActions.toast({
        key: marker('notes.upload.error'),
        color: 'danger',
      })
    );
  }

  #save(patch: UpdateDTO<Note>): void {
    this.#store.dispatch(
      NotesActions.updateItem({ ...patch, updatedAt: dayjs().format() })
    );
  }
}
