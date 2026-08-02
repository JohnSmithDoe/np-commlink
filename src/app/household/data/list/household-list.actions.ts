import { createActionGroup } from '@ngrx/store';
import { HouseholdListId } from '../../model/household-list.types';
import { ItemListSortType } from '../../../@shared/model/item-list.types';
// prettier-ignore
export const HouseholdListActions = createActionGroup({
  source: 'HouseholdList',
  events: {
    addItemFromSearch: (listId: HouseholdListId) => ({ listId }),
    updateSearch: (listId: HouseholdListId, searchQuery?: string) => ({ searchQuery, listId }),
    updateFilter: (listId: HouseholdListId, filterBy?: string) => ({ filterBy, listId }),
    updateSort: (listId: HouseholdListId, sortBy?: ItemListSortType, sortDirection?: 'asc' | 'desc' | 'keep' | 'toggle') => ({ sortBy, sortDirection, listId }),
  },
});
