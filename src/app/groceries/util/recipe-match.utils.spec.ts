import {
  mockProduct,
  mockRecipe,
  mockRecipeIngredient,
  mockStorageItem,
} from '../testing/groceries.test-data';
import { rankRecipesByMissing, withoutProduct } from './recipe-match.utils';

const milk = mockProduct({ id: 'p-milk', name: 'Milk', unit: 'ml' });
const flour = mockProduct({ id: 'p-flour', name: 'Flour', unit: 'g' });
const salt = mockProduct({
  id: 'p-salt',
  name: 'Salt',
  unit: 'g',
  alwaysOnHand: true,
});

const needs = (productId: string) =>
  mockRecipeIngredient({ id: `line-${productId}`, productId });

describe('rankRecipesByMissing', () => {
  it('reports nothing missing when every ingredient is in storage', () => {
    const recipe = mockRecipe({ ingredients: [needs('p-milk')] });

    const [match] = rankRecipesByMissing(
      [recipe],
      [milk],
      [mockStorageItem({ name: 'Milk' })]
    );

    expect(match.missing).toEqual([]);
  });

  // The stepper floors at zero rather than deleting the row, so an emptied
  // pantry entry stays in the list — matching on presence alone ranked a recipe
  // as fully cookable while the low-stock tile flagged the same item as out.
  it('does not count a storage row that has run down to zero', () => {
    const recipe = mockRecipe({ ingredients: [needs('p-milk')] });

    const [match] = rankRecipesByMissing(
      [recipe],
      [milk],
      [mockStorageItem({ name: 'Milk', productId: 'p-milk', quantity: 0 })]
    );

    expect(match.missing).toEqual(['Milk']);
  });

  it('names the products that are not in storage', () => {
    const recipe = mockRecipe({
      ingredients: [needs('p-milk'), needs('p-flour')],
    });

    const [match] = rankRecipesByMissing(
      [recipe],
      [milk, flour],
      [mockStorageItem({ name: 'Milk' })]
    );

    expect(match.missing).toEqual(['Flour']);
  });

  // The reason `productId` exists: the storage row was copied from the catalog,
  // then the product was renamed. Name matching answers "missing" here, which is
  // wrong — it is the same product, and the pantry still holds it.
  it('still matches a storage row whose product was renamed', () => {
    const recipe = mockRecipe({ ingredients: [needs('p-milk')] });
    const renamed = mockProduct({ id: 'p-milk', name: 'Oat milk' });

    const [match] = rankRecipesByMissing(
      [recipe],
      [renamed],
      [mockStorageItem({ name: 'Milk', productId: 'p-milk' })]
    );

    expect(match.missing).toEqual([]);
  });

  // The link points at a product, not at a name that happens to collide.
  it('does not match a linked row against a different product', () => {
    const recipe = mockRecipe({ ingredients: [needs('p-flour')] });

    const [match] = rankRecipesByMissing(
      [recipe],
      [flour],
      [mockStorageItem({ name: 'Milk', productId: 'p-milk' })]
    );

    expect(match.missing).toEqual(['Flour']);
  });

  // The fallback for rows the link cannot reach: typed straight into the pantry,
  // or persisted before `productId` existed.
  it('matches an unlinked storage row by name, regardless of case or padding', () => {
    const recipe = mockRecipe({ ingredients: [needs('p-milk')] });

    const [match] = rankRecipesByMissing(
      [recipe],
      [milk],
      [mockStorageItem({ name: '  MILK ' })]
    );

    expect(match.missing).toEqual([]);
  });

  it('never counts an always-on-hand staple as missing', () => {
    const recipe = mockRecipe({ ingredients: [needs('p-salt')] });

    const [match] = rankRecipesByMissing([recipe], [salt], []);

    expect(match.missing).toEqual([]);
  });

  it('ranks cookable recipes first, then by ascending missing count', () => {
    const cookable = mockRecipe({
      id: 'r-1',
      name: 'Zwiebelsuppe',
      ingredients: [needs('p-milk')],
    });
    const oneMissing = mockRecipe({
      id: 'r-2',
      name: 'Pancakes',
      ingredients: [needs('p-milk'), needs('p-flour')],
    });

    const ranked = rankRecipesByMissing(
      [oneMissing, cookable],
      [milk, flour],
      [mockStorageItem({ name: 'Milk' })]
    );

    expect(ranked.map(({ recipe }) => recipe.id)).toEqual(['r-1', 'r-2']);
  });

  it('breaks ties alphabetically', () => {
    const beta = mockRecipe({ id: 'r-b', name: 'Beta' });
    const alpha = mockRecipe({ id: 'r-a', name: 'Alpha' });

    const ranked = rankRecipesByMissing([beta, alpha], [], []);

    expect(ranked.map(({ recipe }) => recipe.name)).toEqual(['Alpha', 'Beta']);
  });

  it('counts an ingredient whose product left the catalog as missing', () => {
    const recipe = mockRecipe({ ingredients: [needs('p-gone')] });

    const [match] = rankRecipesByMissing([recipe], [], []);

    expect(match.missing).toEqual(['p-gone']);
  });
});

describe('withoutProduct', () => {
  it('drops the lines referencing the product', () => {
    const recipe = mockRecipe({
      ingredients: [needs('p-milk'), needs('p-flour')],
    });

    expect(withoutProduct(recipe, 'p-milk').ingredients).toEqual([
      needs('p-flour'),
    ]);
  });

  it('returns the same recipe when nothing referenced the product', () => {
    const recipe = mockRecipe({ ingredients: [needs('p-milk')] });

    expect(withoutProduct(recipe, 'p-flour')).toBe(recipe);
  });
});
