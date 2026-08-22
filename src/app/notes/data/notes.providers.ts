import { providePersistedContext } from '../../@shared/data/persisted-states/persisted-context.provider';
import { createMetric } from '../../@shared/data/persisted-states/persisted-slice.effects.factory';
import { NotesActions } from './notes.actions';
import { notesListEffects } from './notes.effects';
import { notesReducer } from './notes.reducer';
import {
  NOTES_STATE_KEY,
  selectNoteCount,
  selectNotesState,
} from './notes.selector';

export const notesContext = providePersistedContext({
  key: NOTES_STATE_KEY,
  reducer: notesReducer,
  lifecycle: NotesActions,
  select: selectNotesState,
  save: {
    on: [
      NotesActions.addItem,
      NotesActions.removeItem,
      NotesActions.updateItem,
      NotesActions.reorderSection,
      NotesActions.discardBlank,
      NotesActions.togglePin,
    ],
  },
  telemetry: [
    {
      source: 'notes',
      select: selectNoteCount,
      metrics: createMetric('count'),
    },
  ],
  effects: [notesListEffects],
});
