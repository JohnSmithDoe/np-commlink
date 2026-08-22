import { createActionGroup, emptyProps } from '@ngrx/store';
import {
  IntakesState,
  Pill,
  Profile,
  Reading,
  VitalsState,
} from '../model/vitals.types';

export const VitalsActions = createActionGroup({
  source: 'Vitals',
  events: {
    load: emptyProps(),
    loaded: (vitals: VitalsState | null) => ({ vitals }),
    restoreProfile: (
      profile: Profile,
      readings: Reading[],
      pills: Pill[],
      intakes: IntakesState
    ) => ({ profile, readings, pills, intakes }),
    restorePill: (pill: Pill, intakes: IntakesState) => ({ pill, intakes }),
  },
});
