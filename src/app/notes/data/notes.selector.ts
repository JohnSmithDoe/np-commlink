import { createFeatureSelector, createSelector } from '@ngrx/store';
import { selectRouteEntityId } from '../../@shared/data/router/router.selector';
import { SearchResult } from '../../@shared/model/item-list.types';
import { Note, NotesList, NotesState } from '../model/notes.types';
import { searchNotes } from '../util/notes.utils';

export const NOTES_STATE_KEY = 'notes';

export const selectNotesState =
  createFeatureSelector<NotesState>(NOTES_STATE_KEY);

export const selectNotesList = createSelector(
  selectNotesState,
  (state): NotesList => state.list
);

export const selectNotes = createSelector(
  selectNotesList,
  (list): Note[] => list.items
);

export const selectNotesSearchResult = createSelector(
  selectNotesList,
  (list): SearchResult<Note> | undefined => searchNotes(list)
);

export const selectVisibleNotes = createSelector(
  selectNotes,
  selectNotesSearchResult,
  (notes, result): Note[] => result?.listItems ?? notes
);

export const selectPinnedNotes = createSelector(
  selectVisibleNotes,
  (notes): Note[] => notes.filter((note) => note.pinned)
);

export const selectUnpinnedNotes = createSelector(
  selectVisibleNotes,
  (notes): Note[] => notes.filter((note) => !note.pinned)
);

export const selectRouteNote = createSelector(
  selectNotes,
  selectRouteEntityId,
  (notes, id): Note | undefined => notes.find((note) => note.id === id)
);

export const selectNoteCount = createSelector(
  selectNotes,
  (notes): number => notes.length
);
