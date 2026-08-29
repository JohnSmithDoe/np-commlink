/* ─── why ─────────────────────────────────────────────────────────
 * The two sections are built HERE and not in the shared list, because a
 * section carries an i18n key and `@shared` owns no wording. They are a
 * partition of one array, so an empty side is dropped rather than sent
 * as an empty section — a lone section renders no header.
 *
 * There is no `setSortMode` command and no toolbar: notes are ARRANGED,
 * and a sort over a hand-dragged order offers to silently discard it.
 * ───────────────────────────────────────────────────────────────── */

import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { BaseListPageFacade } from '../../@shared/data/item-lists/list-page.facade.base';
import { ListSection } from '../../@shared/util/item-lists/list-page.facade';
import { Note, NoteImageId, NOTES_LIST_ID } from '../model/notes.types';
import { createNote } from '../util/notes.factory';
import { NoteImageStore } from './note-image.store';
import { NotesActions } from './notes.actions';
import {
  selectNotesList,
  selectNotesSearchResult,
  selectPinnedNotes,
  selectUnpinnedNotes,
  selectVisibleNotes,
} from './notes.selector';

const PINNED_SECTION = 'pinned';
const OTHERS_SECTION = 'others';

@Injectable({ providedIn: 'root' })
export class NotesListPageFacade extends BaseListPageFacade {
  readonly #store = inject(Store);
  readonly #router = inject(Router);
  readonly #images = inject(NoteImageStore);

  readonly imageUrls = this.#images.urls;

  readonly state = this.#store.selectSignal(selectNotesList);
  readonly items = this.#store.selectSignal(selectVisibleNotes);
  readonly searchResult = this.#store.selectSignal(selectNotesSearchResult);
  readonly pinned = this.#store.selectSignal(selectPinnedNotes);
  readonly unpinned = this.#store.selectSignal(selectUnpinnedNotes);

  readonly hasToolbar = signal(false);
  readonly undoScope = signal(NOTES_LIST_ID);

  readonly sections = computed<readonly ListSection[]>(() =>
    [
      {
        id: PINNED_SECTION,
        labelKey: marker('notes.section.pinned'),
        items: this.pinned(),
      },
      {
        id: OTHERS_SECTION,
        labelKey: marker('notes.section.others'),
        items: this.unpinned(),
      },
    ].filter((section) => section.items.length > 0)
  );

  protected readonly commands = {
    search: (term?: string) =>
      this.#store.dispatch(NotesActions.updateSearch(term)),
  };

  showCreateDialog(): void {
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

  reorder(ids: string[], sectionId?: string): void {
    this.#store.dispatch(
      NotesActions.reorderSection(sectionId === PINNED_SECTION, ids)
    );
  }

  rotateImage(imageId: NoteImageId): void {
    this.#store.dispatch(NotesActions.rotateImage(imageId));
  }
}
