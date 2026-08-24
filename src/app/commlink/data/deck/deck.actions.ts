import { createActionGroup, emptyProps } from '@ngrx/store';
import { DeckState, DeckEntryId } from '../../model/deck.types';

export const DeckActions = createActionGroup({
  source: 'Deck',
  events: {
    load: emptyProps(),
    loaded: (deck: DeckState | null) => ({ deck }),

    reorder: (order: DeckEntryId[]) => ({ order }),
    toggleEntry: (id: DeckEntryId) => ({ id }),
    setEntries: (ids: DeckEntryId[], visible: boolean) => ({ ids, visible }),
    reset: emptyProps(),
  },
});
