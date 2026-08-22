import { createActionGroup, emptyProps } from '@ngrx/store';
import { Profile, Reading, VitalsState } from '../model/vitals.types';

export const VitalsActions = createActionGroup({
  source: 'Vitals',
  events: {
    load: emptyProps(),
    loaded: (vitals: VitalsState | null) => ({ vitals }),
    restoreProfile: (profile: Profile, readings: Reading[]) => ({
      profile,
      readings,
    }),
  },
});
