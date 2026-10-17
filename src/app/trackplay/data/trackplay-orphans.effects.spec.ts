import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { Observable, of } from 'rxjs';
import { PEOPLE, Roster } from '../../@shared/util/people/people.token';
import {
  mockGame,
  mockGamesState,
  mockPlayer,
  mockTrackplayState,
} from '../testing/trackplay.test-data';
import { TrackplayActions } from './trackplay.actions';
import { TrackplayOrphansEffects } from './trackplay-orphans.effects';
import { TRACKPLAY_STATE_KEY } from './trackplay.selector';

describe('TrackplayOrphansEffects', () => {
  const ann = mockPlayer({ id: 'ann' });
  const roster = signal<Roster>(undefined);
  let actions$: Observable<Action>;

  const lost = mockTrackplayState({
    games: mockGamesState([
      mockGame({ id: 'lost', playerIds: ['ann', 'carl'] }),
    ]),
  });

  const emittedFor = (people: Roster): Action[] => {
    roster.set(undefined);
    TestBed.configureTestingModule({
      providers: [
        TrackplayOrphansEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          initialState: { [TRACKPLAY_STATE_KEY]: lost },
        }),
        { provide: PEOPLE, useValue: roster },
      ],
    });
    actions$ = of(TrackplayActions.loaded(null));
    const emitted: Action[] = [];
    TestBed.inject(TrackplayOrphansEffects).sweepOrphans$.subscribe(
      (action) => {
        emitted.push(action);
      }
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
    expect(emittedFor([ann])).toEqual([TrackplayActions.sweepOrphans(['ann'])]);
  });
});
