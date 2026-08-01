import { createActionGroup, emptyProps } from '@ngrx/store';
import { IDeckState, TAppModule, TDeckEntryId } from '../../model/deck.types';

/**
 * The user's deck configuration — which programs appear on the grid and in the
 * side menu, and in what order. Commlink-owned like the read-model beside it:
 * a domain serves routes, it does not decide its own place in navigation.
 *
 * `reorder` carries the complete resolved list rather than a from/to pair, so
 * the first drag also normalizes a config that predates a catalog change.
 */
export const DeckActions = createActionGroup({
  source: 'Deck',
  events: {
    load: emptyProps(),
    loaded: (deck: IDeckState | null) => ({ deck }),

    reorder: (order: TDeckEntryId[]) => ({ order }),
    toggleEntry: (id: TDeckEntryId) => ({ id }),
    toggleModule: (module: TAppModule) => ({ module }),
    reset: emptyProps(),
  },
});
