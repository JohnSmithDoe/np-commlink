import { createActionGroup, emptyProps } from '@ngrx/store';
import { PersonId } from '../../@shared/model/person.types';
import { IntakesState, Pill, VitalsState } from '../model/vitals.types';

export const VitalsActions = createActionGroup({
  source: 'Vitals',
  events: {
    load: emptyProps(),
    loaded: (vitals: VitalsState | null) => ({ vitals }),
    restorePill: (pill: Pill, intakes: IntakesState) => ({ pill, intakes }),
    sweepOrphans: (people: readonly PersonId[]) => ({ people }),
  },
});
