import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { mockKernelState, MockState } from '../../../@shared/testing/test-data';
import {
  mockHouseholdCategoryList,
  mockHouseholdState,
} from '../../testing/household.test-data';
import { HouseholdCategoriesActions } from './household-categories.actions';
import { householdCategoriesListEffects } from './household-categories.effects';

describe('householdCategoriesListEffects', () => {
  let actions$: Observable<Action>;

  const setup = (state: MockState = {}) => {
    TestBed.configureTestingModule({
      providers: [
        provideMockActions(() => actions$),
        provideMockStore({ initialState: mockKernelState(state) }),
      ],
    });
  };

  const run = <T>(effect: () => Observable<T>): Observable<T> =>
    TestBed.runInInjectionContext(() => effect());

  it('addItemFromSearch$ builds a category from the search query', async () => {
    setup({
      household: mockHouseholdState({
        categories: mockHouseholdCategoryList({ searchQuery: 'Getränke' }),
      }),
    });
    actions$ = of(HouseholdCategoriesActions.addItemFromSearch());

    expect(
      await firstValueFrom(
        run(householdCategoriesListEffects.addItemFromSearch$)
      )
    ).toEqual(
      HouseholdCategoriesActions.addItem(
        expect.objectContaining({ name: 'Getränke' }) as never
      )
    );
  });
});
