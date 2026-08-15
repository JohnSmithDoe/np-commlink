import { createActionGroup, emptyProps } from '@ngrx/store';
import { UndoEntry } from '../../model/undo.types';

export const UndoActions = createActionGroup({
  source: 'Undo',
  events: {
    pushed: (entry: UndoEntry) => ({ entry }),
    performed: emptyProps(),
    popped: emptyProps(),
  },
});
