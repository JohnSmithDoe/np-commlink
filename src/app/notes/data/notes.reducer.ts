/* ─── why ─────────────────────────────────────────────────────────
 * A note is identified by its id and by nothing else, which is why this
 * reducer keeps its own add/update/remove instead of the shared
 * `list.utils` ones. Those exist for catalogues where a name is the
 * identity: `addListItem` DROPS an item whose name is blank, and
 * `updateListItem` falls back to an exact-name match when no id hits.
 * Both are wrong here — an untitled note is the normal case, and two
 * notes may carry the same title without being the same note.
 *
 * `items` is ONE array and the arrangement itself; the two sections are
 * a partition of it, never two stored lists. So `reorderSection` writes
 * the section's new order back into the slots that section already
 * occupied, and the other section's positions cannot move underneath it
 * — which is also what makes pinning a note a one-field change rather
 * than a move between collections.
 * ───────────────────────────────────────────────────────────────── */

import { createReducer, on } from '@ngrx/store';
import {
  hydratedList,
  updateListSearch,
  withList,
} from '../../@shared/util/item-lists/list.utils';
import { Note, NOTES_LIST_ID, NotesState } from '../model/notes.types';
import { NotesActions } from './notes.actions';

export const initialState: NotesState = {
  list: { id: NOTES_LIST_ID, items: [] },
};

const reorderedSection = (
  items: readonly Note[],
  pinned: boolean,
  ids: readonly string[]
): Note[] => {
  const byId = new Map(items.map((note) => [note.id, note]));
  const moved = ids
    .map((id) => byId.get(id))
    .filter((note): note is Note => !!note && !!note.pinned === pinned);
  if (moved.length !== items.filter((note) => !!note.pinned === pinned).length)
    return [...items];

  let next = 0;
  return items.map((note) =>
    !!note.pinned === pinned ? (moved[next++] ?? note) : note
  );
};

const withoutNote = (state: NotesState, id: string): NotesState => ({
  list: {
    ...state.list,
    items: state.list.items.filter((note) => note.id !== id),
  },
});

// prettier-ignore
export const notesReducer = createReducer(
  initialState,

  on(NotesActions.addItem, (state, { item }): NotesState => ({
    list: { ...state.list, items: [item, ...state.list.items] },
  })),

  on(NotesActions.updateItem, (state, { item }): NotesState => ({
    list: {
      ...state.list,
      items: state.list.items.map((note) =>
        note.id === item.id ? { ...note, ...item, id: note.id } : note
      ),
    },
  })),

  on(NotesActions.togglePin, (state, { id }): NotesState => ({
    list: {
      ...state.list,
      items: state.list.items.map((note) =>
        note.id === id ? { ...note, pinned: !note.pinned } : note
      ),
    },
  })),

  on(NotesActions.removeItem, (state, { item }): NotesState => withoutNote(state, item.id)),
  on(NotesActions.discardBlank, (state, { id }): NotesState => withoutNote(state, id)),

  on(NotesActions.updateSearch, (state, { searchQuery }): NotesState => withList(state, 'list', updateListSearch(state.list, searchQuery))),
  on(NotesActions.reorderSection, (state, { pinned, ids }): NotesState => ({
    list: { ...state.list, items: reorderedSection(state.list.items, pinned, ids) },
  })),

  on(NotesActions.loaded, (state, { notes }): NotesState => ({
    list: hydratedList((notes ?? state).list),
  }))
);
