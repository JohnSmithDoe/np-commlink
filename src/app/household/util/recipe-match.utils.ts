import { matchingTxt } from '../../@shared/util/app.utils';
import { Product, StorageItem } from '../model/household-list.types';
import { Recipe, RecipeIngredient, RecipeMatch } from '../model/recipe.types';

const stockedFrom = (storageItems: StorageItem[]) => {
  const inStock = storageItems.filter((item) => item.quantity > 0);
  return {
    productIds: new Set(
      inStock
        .map((item) => item.productId)
        .filter((id): id is string => id !== undefined)
    ),
    names: new Set(inStock.map((item) => matchingTxt(item.name))),
  };
};

type Stocked = ReturnType<typeof stockedFrom>;

const productsById = (products: Product[]): Map<string, Product> =>
  new Map(products.map((product) => [product.id, product]));

const missingLabel = (
  ingredient: RecipeIngredient,
  product?: Product
): string => product?.name ?? ingredient.productId;

const isStocked = (product: Product, stocked: Stocked) =>
  stocked.productIds.has(product.id) || stocked.names.has(matchingTxt(product));

const isMissing = (product: Product | undefined, stocked: Stocked) =>
  !product || (!product.alwaysOnHand && !isStocked(product, stocked));

const missingIngredients = (
  recipe: Recipe,
  catalog: Map<string, Product>,
  stocked: Stocked
): string[] =>
  recipe.ingredients
    .filter((ingredient) =>
      isMissing(catalog.get(ingredient.productId), stocked)
    )
    .map((ingredient) =>
      missingLabel(ingredient, catalog.get(ingredient.productId))
    );

const byMissingThenName = (a: RecipeMatch, b: RecipeMatch): number =>
  a.missing.length - b.missing.length ||
  a.recipe.name.localeCompare(b.recipe.name);

export const rankRecipesByMissing = (
  recipes: Recipe[],
  products: Product[],
  storageItems: StorageItem[]
): RecipeMatch[] => {
  const catalog = productsById(products);
  const stocked = stockedFrom(storageItems);
  return recipes
    .map((recipe) => ({
      recipe,
      missing: missingIngredients(recipe, catalog, stocked),
    }))
    .toSorted(byMissingThenName);
};

export const withoutProduct = (recipe: Recipe, productId: string): Recipe => {
  const ingredients = recipe.ingredients.filter(
    (ingredient) => ingredient.productId !== productId
  );
  return ingredients.length === recipe.ingredients.length
    ? recipe
    : { ...recipe, ingredients };
};
