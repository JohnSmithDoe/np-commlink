import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of, toArray } from 'rxjs';
import {
  mockAppState,
  mockTrackplayState,
} from '../../@shared/testing/test-data';
import { DatabaseService } from '../../@shared/util/database.service';
import { TrackplayActions } from './trackplay.actions';
import { TrackplaySaveEffects } from './trackplay-save.effects';

describe('TrackplaySaveEffects', () => {
  let actions$: Observable<Action>;
  let effects: TrackplaySaveEffects;
  let database: { save: ReturnType<typeof vi.fn> };

  const setup = (initialState = mockAppState()) => {
    database = { save: vi.fn().mockResolvedValue(undefined) };
    TestBed.configureTestingModule({
      providers: [
        TrackplaySaveEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState }),
        { provide: DatabaseService, useValue: database },
      ],
    });
    effects = TestBed.inject(TrackplaySaveEffects);
    return initialState;
  };

  it('does NOT persist on the [Trackplay] load/loaded hydration lifecycle', async () => {
    // Regression: `[Trackplay] load` fires on route entry at empty initialState
    // before the load effect reads storage — persisting here would clobber the
    // saved games.
    setup(mockAppState({ trackplay: mockTrackplayState() }));
    actions$ = of(
      TrackplayActions.load(),
      TrackplayActions.loaded(mockTrackplayState())
    );

    const emitted = await firstValueFrom(effects.saveOnChange$.pipe(toArray()));

    expect(emitted).toEqual([]);
    expect(database.save).not.toHaveBeenCalled();
  });

  it('persists on a real [Trackplay] mutation', async () => {
    const initialState = setup(
      mockAppState({ trackplay: mockTrackplayState() })
    );
    actions$ = of(TrackplayActions.createPlayer('Fastjack'));

    await firstValueFrom(effects.saveOnChange$);

    expect(database.save).toHaveBeenCalledWith(
      'trackplay',
      initialState.trackplay
    );
  });
});
