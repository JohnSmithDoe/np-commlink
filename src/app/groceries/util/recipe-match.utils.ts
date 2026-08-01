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
 *
 * Both sides are id-based now. The recipe side always was (an ingredient
 * references a product); the storage side became so when the copy factories
 * started carrying `productId`, which is what makes a product rename survive.
 */

/**
 * What storage can answer "do I have it" with, in order of trustworthiness.
 *
 * A row copied from the catalog carries `productId`, so the match survives a
 * product rename. A row typed straight into the pantry never had a product, and
 * rows persisted before that field existed have none — for those the name is the
 * only handle there is, so the fallback stays rather than the name half being
 * retired outright.
 *
 * A row at `quantity: 0` is NOT stock. The storage stepper floors at zero
 * instead of deleting the row (`withQuantityChangedBy`), which is the whole
 * reason `selectLowStockCount` exists — so counting every row present would
 * rank a recipe as cookable off an empty pantry entry while the deck tile
 * flagged the same item as out. This is presence, still: it asks whether there
 * is any, never how much, so it needs none of the deferred pack-size bridge.
 */
const stockedFrom = (storageItems: IStorageItem[]) => {
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

type TStocked = ReturnType<typeof stockedFrom>;

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

const isStocked = (product: IProduct, stocked: TStocked) =>
  stocked.productIds.has(product.id) || stocked.names.has(matchingTxt(product));

const isMissing = (product: IProduct | undefined, stocked: TStocked) =>
  !product || (!product.alwaysOnHand && !isStocked(product, stocked));

const missingIngredients = (
  recipe: IRecipe,
  catalog: Map<string, IProduct>,
  stocked: TStocked
): string[] =>
  recipe.ingredients
    .filter((ingredient) =>
      isMissing(catalog.get(ingredient.productId), stocked)
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
  const stocked = stockedFrom(storageItems);
  return recipes
    .map((recipe) => ({
      recipe,
      missing: missingIngredients(recipe, catalog, stocked),
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
