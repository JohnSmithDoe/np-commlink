import { createActionGroup, emptyProps } from '@ngrx/store';
import { HouseholdState } from '../model/household.types';

export const HouseholdActions = createActionGroup({
  source: 'Household',
  events: {
    load: emptyProps(),
    loaded: (data: HouseholdState | null) => ({ data }),
  },
});
