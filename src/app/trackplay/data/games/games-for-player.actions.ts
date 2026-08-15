/* ─── why ─────────────────────────────────────────────────────────
 * Two groups rather than household's `listId` discriminator, because this
 * is two *views* of one collection, not two slices: household fans one
 * action out to three reducers, where here the only thing that varies is
 * which config object a page writes. If a third view appears, the
 * discriminator is the shape to reach for.
 * ───────────────────────────────────────────────────────────────── */

import { createActionGroup } from '@ngrx/store';
import { CategoryId } from '../../../@shared/model/category.types';
import {
  ItemListSortDirection,
  ItemListSortType,
} from '../../../@shared/model/item-list.types';

export const GamesForPlayerActions = createActionGroup({
  source: 'Trackplay GamesForPlayer',
  events: {
    updateSearch: (searchQuery?: string) => ({ searchQuery }),
    updateFilter: (filterBy?: CategoryId) => ({ filterBy }),
    updateSort: (
      sortBy?: ItemListSortType,
      sortDirection?: ItemListSortDirection | 'keep' | 'toggle'
    ) => ({ sortBy, sortDirection }),
    setShowEnded: (showEndedGames: boolean) => ({ showEndedGames }),
  },
});
