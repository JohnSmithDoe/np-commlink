import { createActionGroup } from '@ngrx/store';
import { ItemListId } from '../../model/item-list.types';
import { UndoEntry } from '../../model/undo.types';

export const UndoActions = createActionGroup({
  source: 'Undo',
  events: {
    pushed: (entry: UndoEntry) => ({ entry }),
    performed: (scope: ItemListId) => ({ scope }),
    popped: (scope: ItemListId) => ({ scope }),
  },
});
