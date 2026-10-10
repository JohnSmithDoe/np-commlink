import { createActionGroup } from '@ngrx/store';
import { ItemListSortType } from '../../../@shared/model/item-list.types';

export const PlayersActions = createActionGroup({
  source: 'Trackplay Players',
  events: {
    updateSearch: (searchQuery?: string) => ({ searchQuery }),
    updateSort: (
      sortBy?: ItemListSortType,
      sortDirection?: 'asc' | 'desc' | 'keep' | 'toggle'
    ) => ({ sortBy, sortDirection }),
  },
});
