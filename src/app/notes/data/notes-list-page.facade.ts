/* ─── why ─────────────────────────────────────────────────────────
 * No `BaseListPageFacade`, because the page it serves is not a
 * `ListPageComponent`: notes are ARRANGED, not sorted, and a sort
 * toolbar over a hand-dragged order offers to silently discard it.
 * Reorder is also what keeps the page off the shared list —
 * `ion-reorder-group` must be an ancestor of every `ion-reorder`, and
 * `app-item-list` owns the element rows project into (`cash-rules.page`
 * left for the same reason).
 * ───────────────────────────────────────────────────────────────── */

import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Note, NoteImageId } from '../model/notes.types';
import { createNote } from '../util/notes.factory';
import { NoteImageStore } from './note-image.store';
import { NotesActions } from './notes.actions';
import {
  selectNotesList,
  selectNotesSearchResult,
  selectPinnedNotes,
  selectUnpinnedNotes,
} from './notes.selector';

@Injectable({ providedIn: 'root' })
export class NotesListPageFacade {
  readonly #store = inject(Store);
  readonly #router = inject(Router);
  readonly #images = inject(NoteImageStore);

  readonly imageUrls = this.#images.urls;

  readonly state = this.#store.selectSignal(selectNotesList);
  readonly searchResult = this.#store.selectSignal(selectNotesSearchResult);
  readonly pinned = this.#store.selectSignal(selectPinnedNotes);
  readonly unpinned = this.#store.selectSignal(selectUnpinnedNotes);

  search(term?: string): void {
    this.#store.dispatch(NotesActions.updateSearch(term));
  }

  createNote(): void {
    const note = createNote(this.state().searchQuery ?? '');
    this.#store.dispatch(NotesActions.addItem(note));
    this.openNote(note);
  }

  openNote(note: Note): void {
    void this.#router.navigate(['/notes', note.id]);
  }

  removeItem(note: Note): void {
    this.#store.dispatch(NotesActions.removeItem(note));
  }

  togglePin(note: Note): void {
    this.#store.dispatch(NotesActions.togglePin(note.id));
  }

  reorderSection(pinned: boolean, ids: string[]): void {
    this.#store.dispatch(NotesActions.reorderSection(pinned, ids));
  }

  rotateImage(imageId: NoteImageId): void {
    this.#store.dispatch(NotesActions.rotateImage(imageId));
  }
}
