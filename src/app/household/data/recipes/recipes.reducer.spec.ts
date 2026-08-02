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
  it('returns the initial state for an unknown action', () => {
    const state = recipesReducer(initialState, { type: 'noop' } as never);
    expect(state).toBe(initialState);
  });

  it('adds a recipe', () => {
    const recipe = mockRecipe();
    const state = recipesReducer(initialState, RecipesActions.addItem(recipe));
    expect(state.items).toEqual([recipe]);
  });

  it('removes a recipe by id', () => {
    const recipe = mockRecipe();
    const start = mockRecipesState({ items: [recipe] });
    const state = recipesReducer(start, RecipesActions.removeItem(recipe));
    expect(state.items).toHaveLength(0);
  });

  it('updates a recipe', () => {
    const recipe = mockRecipe({ servings: 2 });
    const start = mockRecipesState({ items: [recipe] });
    const state = recipesReducer(
      start,
      RecipesActions.updateItem({ ...recipe, servings: 6 })
    );
    expect(state.items[0].servings).toBe(6);
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
    expect(state).toBe(initialState);
  });
});
