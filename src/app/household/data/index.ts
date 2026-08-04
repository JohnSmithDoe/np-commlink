/* ─── why ─────────────────────────────────────────────────────────
 * The five action groups below are exported for SPECS, not for callers.
 * Every production read and dispatch goes through a facade — that is what
 * `ngrx-data-layer-only` enforces — but a spec asserting a dispatch cannot
 * deep-import past this barrel, so the groups have to be reachable. Read
 * them as test surface; a facade method is the answer for anything else.
 * The persistence lifecycle group is deliberately NOT here: nothing
 * outside `data/` has any business dispatching load/loaded.
 * ───────────────────────────────────────────────────────────────── */

export { ShoppingActions } from './shopping/shopping.actions';
export { StorageActions } from './storage/storage.actions';
export { ProductsActions } from './products/products.actions';
export { HouseholdCategoriesActions } from './categories/household-categories.actions';
export { ListSettingsActions } from './list-settings/list-settings.actions';
export { RecipesActions } from './recipes/recipes.actions';

export { HouseholdListPageFacade } from './list/household-list-page.facade';
export { HouseholdCategoriesPageFacade } from './categories/household-categories-page.facade';
export { ListSettingsFacade } from './list-settings/list-settings.facade';
export { QuickAddFacade } from './quick-add/quick-add.facade';
export { ShoppingFacade } from './shopping/shopping.facade';
export { StorageFacade } from './storage/storage.facade';
export { ProductsFacade } from './products/products.facade';
export { RecipesFacade } from './recipes/recipes.facade';

export { householdContext } from './household.providers';
