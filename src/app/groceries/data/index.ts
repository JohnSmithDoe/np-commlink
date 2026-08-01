/**
 * Public API of the `groceries` data module (Sheriff barrel).
 *
 * Facade-only surface — consumers get the per-list action contracts, the
 * display selectors the grocery pages/dialogs read, the multi-list page
 * facade, and the lazy context bundles, and nothing else. The reducers,
 * effects, initial states, and internal selectors (raw feature selectors,
 * search-result derivations, the grocery-list engine internals) are module
 * internals and stay hidden: importing them from outside `groceries/data` is a
 * Sheriff encapsulation violation.
 *
 * Named re-exports only (never `export *`) so the public surface is explicit
 * and a type-only consumer can't drag runtime providers into its chunk.
 */

// Action contracts
export { GroceriesActions } from './groceries/groceries.actions';
export { ShoppingActions } from './shopping/shopping.actions';
export { StorageActions } from './storage/storage.actions';
export { ProductsActions } from './products/products.actions';
// One category catalog shared across the three grocery lists.
export { GroceryCategoriesActions } from './categories/grocery-categories.actions';
// Grocery list feature-flags (the list-settings page + boot hydration wiring).
export { ListSettingsActions } from './list-settings/list-settings.actions';

// Page facades (LIST_FACADE / CATEGORY_LIST_FACADE implementations) — the store's
// consumption surface, provided at the grocery routes.
export { GroceryListPageFacade } from './grocery-list-page.facade';
export { GroceryCategoriesPageFacade } from './categories/grocery-categories-page.facade';
export { ListSettingsFacade } from './list-settings/list-settings.facade';
// The recipe book (SOYKAF) — a purpose-built page, so it has its own facade
// instead of a LIST_FACADE binding: the matcher's rows are nothing like list rows.
export { RecipesFacade } from './recipes/recipes.facade';

// Display selectors read by the grocery pages/dialogs. The per-list ITEM reads
// are deliberately absent: every consumer goes through `GroceryListPageFacade`,
// and publishing both a page view and an aggregate read of the same list is how a
// caller ends up picking the filtered one by accident.
export {
  selectShoppingState,
  selectShoppingListHasBoughtItems,
} from './shopping/shopping.selector';
// removed: export {} from './selectors/storage.selector';
// removed: export {} from './selectors/products.selector';

// Grocery list feature-flags (read by the list-settings page).
export { selectListSettingsState } from './list-settings/list-settings.selector';

// Quick-add derived UI state (read by the grocery quick-add smart-ui row).
export {
  selectQuickAddState,
  selectQuickAddCanAddLocal,
  selectQuickAddCanAddProduct,
} from './quick-add/quick-add.selector';

// The lazy context bundle (state + effects + hydration resolver), spread by
// every grocery route. One grain, because the aggregates are one slice: the
// lists, the catalog, the feature flags and the recipe book all hydrate together.
export { groceriesContext } from './groceries/groceries.providers';
