import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of, toArray } from 'rxjs';
import {
  mockReading,
  mockVitalsState,
  mockReadingsState,
} from '../testing/vitals.test-data';
import { ReadingsActions } from './readings/readings.actions';
import { readingsListEffects } from './vitals-list.effects';
import { VITALS_STATE_KEY } from './vitals.selector';

const stored = mockReading({ id: 'stored', name: '2026-08-20' });

const emissions = (): Promise<Action[]> =>
  firstValueFrom(
    TestBed.runInInjectionContext(() =>
      readingsListEffects.addOrUpdateItem$()
    ).pipe(toArray())
  );

describe('readingsListEffects — matching on the id alone', () => {
  let actions$: Observable<Action>;

  const setup = () => {
    TestBed.configureTestingModule({
      providers: [
        provideMockActions(() => actions$),
        provideMockStore({
          initialState: {
            [VITALS_STATE_KEY]: mockVitalsState({
              readings: mockReadingsState([stored]),
            }),
          },
        }),
      ],
    });
  };

  it('updates the reading whose id is already stored', async () => {
    setup();
    const edited = { ...stored, grams: 77_000 };
    actions$ = of(ReadingsActions.addOrUpdateItem(edited));

    expect(await emissions()).toEqual([ReadingsActions.updateItem(edited)]);
  });

  it('adds a reading that shares a date with another profile’s', async () => {
    setup();
    const twin = mockReading({
      id: 'cats',
      name: '2026-08-20',
      profileId: 'cat',
      grams: 4300,
    });
    actions$ = of(ReadingsActions.addOrUpdateItem(twin));

    expect(await emissions()).toEqual([ReadingsActions.addItem(twin)]);
  });
});
