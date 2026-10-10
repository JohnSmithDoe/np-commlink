import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { providePersistedContext } from '../../@shared/data/persisted-states/persisted-context.provider';
import { createMetric } from '../../@shared/data/persisted-states/persisted-slice.effects.factory';
import { PEOPLE } from '../../@shared/util/people/people.token';
import { peopleListEffects } from './people-list.effects';
import { PeopleActions } from './people.actions';
import { peopleReducer } from './people.reducer';
import {
  PEOPLE_STATE_KEY,
  selectPeopleCount,
  selectPeopleState,
  selectPersonItems,
} from './people.selector';

const peopleProvider = {
  provide: PEOPLE,
  useFactory: () => inject(Store).selectSignal(selectPersonItems),
};

export const peopleContext = providePersistedContext({
  key: PEOPLE_STATE_KEY,
  reducer: peopleReducer,
  lifecycle: PeopleActions,
  select: selectPeopleState,
  save: { sources: ['[People]'] },
  telemetry: [
    {
      source: 'people',
      select: selectPeopleCount,
      metrics: createMetric('count'),
    },
  ],
  hydrate: 'boot',
  effects: [peopleListEffects],
  publishes: [peopleProvider],
});
