import { createActionGroup } from '@ngrx/store';
import { PersonId } from '../../../@shared/model/person.types';
import { ItemListSortType } from '../../../@shared/model/item-list.types';
import { AstroOverride } from '../../model/vitals.types';

export const ProfilesActions = createActionGroup({
  source: 'Vitals Profiles',
  events: {
    updateSearch: (searchQuery?: string) => ({ searchQuery }),
    updateSort: (
      sortBy?: ItemListSortType,
      sortDirection?: 'asc' | 'desc' | 'keep' | 'toggle'
    ) => ({ sortBy, sortDirection }),
    setAstro: (id: PersonId, astro: AstroOverride) => ({ id, astro }),
    setFavorite: (id: PersonId) => ({ id }),
  },
});
