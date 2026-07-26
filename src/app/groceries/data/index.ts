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
export { GroceriesActions } from './actions/groceries.actions';
export { ShoppingActions } from './actions/shopping.actions';
export { StorageActions } from './actions/storage.actions';
export { ProductsActions } from './actions/products.actions';
// One category catalog shared across the three grocery lists.
export { GroceryCategoriesActions } from './actions/grocery-categories.actions';
// Grocery list feature-flags (the list-settings page + boot hydration wiring).
export { ListSettingsActions } from './actions/list-settings.actions';

// Page facades (LIST_FACADE / CATEGORIES_FACADE implementations) — the store's
// consumption surface, provided at the grocery routes.
export { GroceryListPageFacade } from './grocery-list-page.facade';
export { GroceryCategoriesPageFacade } from './grocery-categories-page.facade';
export { ListSettingsFacade } from './list-settings.facade';
// The recipe book (SOYKAF) — a purpose-built page, so it has its own facade
// instead of a LIST_FACADE binding: the matcher's rows are nothing like list rows.
export { RecipesFacade } from './recipes.facade';

// Display selectors read by the grocery pages/dialogs
export {
  selectShoppingState,
  selectShoppingListHasBoughtItems,
  selectShoppingCategories,
} from './selectors/shopping.selector';
export {
  selectStorageListItems,
  selectStorageCategories,
} from './selectors/storage.selector';
export {
  selectProductListItems,
  selectProductsCategories,
} from './selectors/products.selector';

// Grocery list feature-flags (read by the list-settings page).
export { selectListSettingsState } from './selectors/list-settings.selector';

// Quick-add derived UI state (read by the grocery quick-add smart-ui row).
export {
  selectQuickAddState,
  selectQuickAddCanAddLocal,
  selectQuickAddCanAddProduct,
  selectQuickAddCanAddCategory,
} from './selectors/quick-add.selector';

// The lazy context bundle (state + effects + hydration resolver), spread by
// every grocery route. One grain, because the aggregates are one slice: the
// lists, the catalog, the feature flags and the recipe book all hydrate together.
export { groceriesContext } from './groceries.providers';
