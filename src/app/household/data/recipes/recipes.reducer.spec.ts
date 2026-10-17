import { RECIPE_RANK_SORT } from '../../model/recipe.types';
import { HouseholdActions } from '../household.actions';
import { ProductsActions } from '../products/products.actions';
import { RecipesActions } from './recipes.actions';
import { initialState, recipesReducer } from './recipes.reducer';
import {
  mockHouseholdState,
  mockProduct,
  mockRecipe,
  mockRecipeIngredient,
  mockRecipesState,
} from '../../testing/household.test-data';

describe('recipesReducer', () => {
  it('wires its list actions to the shared list utils', () => {
    const recipe = mockRecipe({ servings: 2 });
    const added = recipesReducer(initialState, RecipesActions.addItem(recipe));
    const updated = recipesReducer(
      added,
      RecipesActions.updateItem({ ...recipe, servings: 6 })
    );
    const removed = recipesReducer(updated, RecipesActions.removeItem(recipe));

    expect(updated.items).toEqual([{ ...recipe, servings: 6 }]);
    expect(removed.items).toEqual([]);
  });

  it('strips a deleted product from every recipe (no dangling reference)', () => {
    const gone = mockProduct({ id: 'p-milk' });
    const start = mockRecipesState({
      items: [
        mockRecipe({
          id: 'r-1',
          ingredients: [
            mockRecipeIngredient({ id: 'l-1', productId: 'p-milk' }),
            mockRecipeIngredient({ id: 'l-2', productId: 'p-flour' }),
          ],
        }),
      ],
    });

    const state = recipesReducer(start, ProductsActions.removeItem(gone));

    expect(
      state.items[0].ingredients.map(({ productId }) => productId)
    ).toEqual(['p-flour']);
  });

  it('hydrates from the persisted document', () => {
    const persisted = mockRecipesState({ items: [mockRecipe()] });
    const state = recipesReducer(
      initialState,
      HouseholdActions.loaded(mockHouseholdState({ recipes: persisted }))
    );
    expect(state).toEqual(persisted);
  });

  it('keeps the current state when there is nothing persisted', () => {
    const state = recipesReducer(initialState, HouseholdActions.loaded(null));
    expect(state).toEqual(initialState);
  });

  it('drops a stale query and filter on the way in', () => {
    const persisted = mockRecipesState({
      items: [mockRecipe()],
      searchQuery: 'stale',
      filterBy: 'Baking',
    });

    const state = recipesReducer(
      initialState,
      HouseholdActions.loaded(mockHouseholdState({ recipes: persisted }))
    );

    expect(state.searchQuery).toBeUndefined();
    expect(state.filterBy).toBeUndefined();
    expect(state.items).toEqual(persisted.items);
  });

  it('narrows to the search query and keeps the ranking underneath', () => {
    const searched = recipesReducer(
      initialState,
      RecipesActions.updateSearch('curry')
    );

    expect(searched.searchQuery).toBe('curry');
    expect(searched.sort).toBeUndefined();
  });

  it('records a sort mode the ranking is reachable from', () => {
    const sorted = recipesReducer(
      initialState,
      RecipesActions.updateSort('prepMinutes', 'toggle')
    );

    expect(sorted.sort).toEqual({
      sortBy: 'prepMinutes',
      sortDirection: 'asc',
    });
    expect(
      recipesReducer(sorted, RecipesActions.updateSort(RECIPE_RANK_SORT)).sort
        ?.sortBy
    ).toBe(RECIPE_RANK_SORT);
  });
});
