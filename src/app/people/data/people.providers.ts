import { computed, inject, Signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { providePersistedContext } from '../../@shared/data/persisted-states/persisted-context.provider';
import { createMetric } from '../../@shared/data/persisted-states/persisted-slice.effects.factory';
import { ReadBeforeWriteService } from '../../@shared/data/persistence/read-before-write.service';
import { PEOPLE, Roster } from '../../@shared/util/people/people.token';
import {
  PERSON_EDITOR,
  PersonEditor,
} from '../../@shared/util/people/person-editor.token';
import { peopleListEffects } from './people-list.effects';
import { PeopleActions } from './people.actions';
import { PeopleFacade } from './people.facade';
import { peopleReducer } from './people.reducer';
import {
  PEOPLE_STATE_KEY,
  selectPeopleCount,
  selectPeopleState,
  selectPersonItems,
} from './people.selector';

const peopleProvider = {
  provide: PEOPLE,
  useFactory: (): Signal<Roster> => {
    const people = inject(Store).selectSignal(selectPersonItems);
    const reads = inject(ReadBeforeWriteService);
    return computed(() =>
      reads.mayPersist(PEOPLE_STATE_KEY) ? people() : undefined
    );
  },
};

const personEditorProvider = {
  provide: PERSON_EDITOR,
  useFactory: (): PersonEditor => {
    const people = inject(PeopleFacade);
    return { create: (name = '') => people.showCreateDialog(name) };
  },
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
  publishes: [peopleProvider, personEditorProvider],
});
