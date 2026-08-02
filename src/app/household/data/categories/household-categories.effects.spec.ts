import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { createCategory } from '../../../@shared/util/app.factory';
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

  const withCategories = (...items: ReturnType<typeof createCategory>[]) =>
    setup({
      household: mockHouseholdState({
        categories: mockHouseholdCategoryList({ items }),
      }),
    });

  const run = <T>(effect: () => Observable<T>): Observable<T> =>
    TestBed.runInInjectionContext(() => effect());

  describe('addOrUpdateItem$', () => {
    it('adds a category the catalog does not have yet', async () => {
      const category = createCategory('Tiefkühl');
      withCategories();
      actions$ = of(HouseholdCategoriesActions.addOrUpdateItem(category));

      expect(
        await firstValueFrom(
          run(householdCategoriesListEffects.addOrUpdateItem$)
        )
      ).toEqual(HouseholdCategoriesActions.addItem(category));
    });

    it('updates the category it recognises by id, so a rename is not a second entry', async () => {
      const existing = createCategory('Tiefkuhl');
      withCategories(existing);
      const renamed = { ...existing, name: 'Tiefkühl' };
      actions$ = of(HouseholdCategoriesActions.addOrUpdateItem(renamed));

      expect(
        await firstValueFrom(
          run(householdCategoriesListEffects.addOrUpdateItem$)
        )
      ).toEqual(HouseholdCategoriesActions.updateItem(renamed));
    });
  });

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

  it('clearSearch$ resets the search once a category lands', async () => {
    setup();
    actions$ = of(HouseholdCategoriesActions.addItem(createCategory('Obst')));

    expect(
      await firstValueFrom(run(householdCategoriesListEffects.clearSearch$))
    ).toEqual(HouseholdCategoriesActions.updateSearch(''));
  });
});
