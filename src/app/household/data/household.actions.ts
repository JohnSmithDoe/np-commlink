import { createActionGroup, emptyProps } from '@ngrx/store';
import { Category } from '../../@shared/model/category.types';
import { HouseholdState } from '../model/household.types';

export const HouseholdActions = createActionGroup({
  source: 'Household',
  events: {
    load: emptyProps(),
    loaded: (data: HouseholdState | null) => ({ data }),
    restoreCategory: (category: Category, tagged: readonly string[]) => ({
      category,
      tagged,
    }),
  },
});
