import {
  mockProduct,
  mockProductsState,
  mockRecipe,
  mockRecipeIngredient,
  mockRecipesState,
  mockStorageItem,
  mockStorageState,
} from '../../testing/household.test-data';
import {
  selectRecipeIngredientCatalog,
  selectRecipeMatches,
  selectRecipes,
} from './recipes.selector';

describe('recipes.selector', () => {
  it('reads an unregistered slice as an empty book', () => {
    expect(selectRecipes.projector(undefined as never)).toEqual([]);
  });

  it('offers the ingredient catalog alphabetically', () => {
    const products = mockProductsState({
      items: [
        mockProduct({ id: 'p-1', name: 'Milk' }),
        mockProduct({ id: 'p-2', name: 'Flour' }),
      ],
    });

    expect(
      selectRecipeIngredientCatalog.projector(products).map(({ name }) => name)
    ).toEqual(['Flour', 'Milk']);
  });

  it('joins recipes against products and storage, cookable first', () => {
    const milk = mockProduct({ id: 'p-milk', name: 'Milk' });
    const flour = mockProduct({ id: 'p-flour', name: 'Flour' });
    const recipes = [
      mockRecipe({
        id: 'r-short',
        name: 'Alpha',
        ingredients: [
          mockRecipeIngredient({ id: 'l-1', productId: 'p-flour' }),
        ],
      }),
      mockRecipe({
        id: 'r-ready',
        name: 'Beta',
        ingredients: [mockRecipeIngredient({ id: 'l-2', productId: 'p-milk' })],
      }),
    ];

    const matches = selectRecipeMatches.projector(
      recipes,
      mockProductsState({ items: [milk, flour] }),
      mockStorageState({ items: [mockStorageItem({ name: 'Milk' })] })
    );

    expect(matches.map(({ recipe }) => recipe.id)).toEqual([
      'r-ready',
      'r-short',
    ]);
    expect(matches[1].missing).toEqual(['Flour']);
  });

  it('survives siblings that are not registered yet', () => {
    const matches = selectRecipeMatches.projector(
      [mockRecipe({ ingredients: [] })],
      undefined as never,
      undefined as never
    );
    expect(matches).toHaveLength(1);
  });

  it('selects the recipes slice items', () => {
    const state = mockRecipesState({ items: [mockRecipe()] });
    expect(selectRecipes.projector(state)).toEqual(state.items);
  });
});
