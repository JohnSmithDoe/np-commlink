import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { mockAppState } from '../../@shared/testing/test-data';
import {
  mockTrackingItem,
  mockTrackingState,
} from '../testing/tracking.test-data';
import { DatabaseService } from '../../@shared/util/database.service';
import { TrackingActions } from './tracking.actions';
import { TrackingSaveEffects } from './tracking-save.effects';

describe('TrackingSaveEffects', () => {
  let actions$: Observable<Action>;
  let effects: TrackingSaveEffects;
  let database: { save: ReturnType<typeof vi.fn> };

  const setup = (initialState = mockAppState()) => {
    database = { save: vi.fn().mockResolvedValue(undefined) };
    TestBed.configureTestingModule({
      providers: [
        TrackingSaveEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState }),
        { provide: DatabaseService, useValue: database },
      ],
    });
    effects = TestBed.inject(TrackingSaveEffects);
    return initialState;
  };

  it('persists the tracking slice on a mutation', async () => {
    const tracking = mockTrackingState();
    setup(mockAppState({ tracking }));
    actions$ = of(TrackingActions.addItem(mockTrackingItem()));
    await firstValueFrom(effects.saveOnChange$);
    expect(database.save).toHaveBeenCalledWith('tracking', tracking);
  });

  it('does NOT persist on the load lifecycle', () => {
    setup();
    // `load` is not in the save filter — hydration must not clobber saved data.
    actions$ = of(TrackingActions.load());
    effects.saveOnChange$.subscribe();
    expect(database.save).not.toHaveBeenCalled();
  });
});
