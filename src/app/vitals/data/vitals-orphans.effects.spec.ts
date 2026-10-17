import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { Observable, of } from 'rxjs';
import { PEOPLE, Roster } from '../../@shared/util/people/people.token';
import {
  mockProfile,
  mockReading,
  mockReadingsState,
  mockVitalsState,
} from '../testing/vitals.test-data';
import { VitalsActions } from './vitals.actions';
import { VitalsOrphansEffects } from './vitals-orphans.effects';
import { VITALS_STATE_KEY } from './vitals.selector';

describe('VitalsOrphansEffects', () => {
  const ann = mockProfile({ id: 'ann' });
  const roster = signal<Roster>(undefined);
  let actions$: Observable<Action>;

  const emittedFor = (people: Roster): Action[] => {
    roster.set(undefined);
    TestBed.configureTestingModule({
      providers: [
        VitalsOrphansEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          initialState: {
            [VITALS_STATE_KEY]: mockVitalsState({
              readings: mockReadingsState([
                mockReading({ id: 'a', profileId: 'ann' }),
                mockReading({ id: 'c', profileId: 'carl' }),
              ]),
            }),
          },
        }),
        { provide: PEOPLE, useValue: roster },
      ],
    });
    actions$ = of(VitalsActions.loaded(null));
    const emitted: Action[] = [];
    TestBed.inject(VitalsOrphansEffects).sweepOrphans$.subscribe((action) =>
      emitted.push(action)
    );
    TestBed.tick();
    if (people) {
      roster.set(people);
      TestBed.tick();
    }
    return emitted;
  };

  it('sweeps nothing while the roster is unread', () => {
    expect(emittedFor(undefined)).toEqual([]);
  });

  it('sweeps against the roster once it is read', () => {
    expect(emittedFor([ann])).toEqual([VitalsActions.sweepOrphans(['ann'])]);
  });

  it('stays quiet when every record still resolves', () => {
    expect(
      emittedFor([ann, mockProfile({ id: 'carl', name: 'Carl' })])
    ).toEqual([]);
  });
});
