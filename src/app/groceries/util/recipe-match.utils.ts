import { matchingTxt } from '../../@shared/util/app.utils';
import { IProduct, IStorageItem } from '../model/grocery-list.types';
import {
  IRecipe,
  IRecipeIngredient,
  IRecipeMatch,
} from '../model/recipe.types';

/**
 * The recipe matcher: "what can I cook with what's in storage right now",
 * ranked by how many ingredients are missing.
 *
 * v1 is a PRESENCE check, not arithmetic — storage counts packages ("2 × milk")
 * while a recipe asks for a measure ("250 ml"), and nothing converts a bottle
 * into millilitres yet. So an ingredient is either in storage or it isn't;
 * "you are 200 ml short" needs the deferred pack-size bridge.
 */

/**
 * Storage rows are name-copies of catalog products — `createStorageItemFromProduct`
 * copies `product.name` and no id — so the storage side of the match can only be
 * answered by name. The recipe side stays id-based (an ingredient references a
 * product), which is what survives a product rename.
 */
const namesInStorage = (storageItems: IStorageItem[]): Set<string> =>
  new Set(storageItems.map((item) => matchingTxt(item.name)));

const productsById = (products: IProduct[]): Map<string, IProduct> =>
  new Map(products.map((product) => [product.id, product]));

/**
 * The label a missing line shows. A dangling `productId` cannot arise through the
 * UI (deleting a product strips it from every recipe), so an unresolvable line is
 * stale persisted data: surface the raw id rather than silently dropping the
 * ingredient.
 */
const missingLabel = (
  ingredient: IRecipeIngredient,
  product?: IProduct
): string => product?.name ?? ingredient.productId;

const isMissing = (product: IProduct | undefined, inStorage: Set<string>) =>
  !product || (!product.alwaysOnHand && !inStorage.has(matchingTxt(product)));

const missingIngredients = (
  recipe: IRecipe,
  catalog: Map<string, IProduct>,
  inStorage: Set<string>
): string[] =>
  recipe.ingredients
    .filter((ingredient) =>
      isMissing(catalog.get(ingredient.productId), inStorage)
    )
    .map((ingredient) =>
      missingLabel(ingredient, catalog.get(ingredient.productId))
    );

const byMissingThenName = (a: IRecipeMatch, b: IRecipeMatch): number =>
  a.missing.length - b.missing.length ||
  a.recipe.name.localeCompare(b.recipe.name);

export const rankRecipesByMissing = (
  recipes: IRecipe[],
  products: IProduct[],
  storageItems: IStorageItem[]
): IRecipeMatch[] => {
  const catalog = productsById(products);
  const inStorage = namesInStorage(storageItems);
  return recipes
    .map((recipe) => ({
      recipe,
      missing: missingIngredients(recipe, catalog, inStorage),
    }))
    .toSorted(byMissingThenName);
};

/**
 * Drop every ingredient line referencing `productId` — the cascade that keeps
 * recipes referentially intact when a product leaves the catalog (the same
 * arrangement as the category cascade).
 */
export const withoutProduct = (recipe: IRecipe, productId: string): IRecipe => {
  const ingredients = recipe.ingredients.filter(
    (ingredient) => ingredient.productId !== productId
  );
  return ingredients.length === recipe.ingredients.length
    ? recipe
    : { ...recipe, ingredients };
};
