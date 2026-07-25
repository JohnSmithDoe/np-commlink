/**
 * Public API of the `groceries` data module (Sheriff barrel).
 *
 * Facade-only surface — consumers get the per-list action contracts, the
 * display selectors the grocery pages/dialogs read, the multi-list page
 * facade, and the lazy providers, and nothing else. The reducers, effects,
 * load/save/telemetry effects, initial states, and internal selectors (raw
 * feature selectors, search-result derivations, the grocery-list engine
 * internals) are module internals and stay hidden: importing them from
 * outside `groceries/data` is a Sheriff encapsulation violation.
 *
 * Named re-exports only (never `export *`) so the public surface is explicit
 * and a type-only consumer can't drag runtime providers into its chunk.
 */

// Action contracts
export { GroceriesActions } from './groceries.actions';
export { ShoppingActions } from './shopping.actions';
export { StorageActions } from './storage.actions';
export { ProductsActions } from './products.actions';
// One category catalog shared across the three grocery lists.
export { GroceryCategoriesActions } from './grocery-list/grocery-categories.actions';
// Grocery list feature-flags (the list-settings page + boot hydration wiring).
export { ListSettingsActions } from './list-settings/list-settings.actions';

// Page facades (LIST_FACADE / CATEGORIES_FACADE implementations) — the store's
// consumption surface, provided at the grocery routes.
export { GroceryListPageFacade } from './grocery-list-page.facade';
export { GroceryCategoriesPageFacade } from './grocery-categories-page.facade';
export { ListSettingsFacade } from './list-settings/list-settings.facade';

// Display selectors read by the grocery pages/dialogs
export {
  selectShoppingState,
  selectShoppingListHasBoughtItems,
  selectShoppingCategories,
} from './shopping.selector';
export {
  selectStorageListItems,
  selectStorageCategories,
} from './storage.selector';
export {
  selectProductListItems,
  selectProductsCategories,
} from './products.selector';

// Grocery list feature-flags (read by the list-settings page).
export { selectListSettingsState } from './list-settings/list-settings.selector';

// Quick-add derived UI state (read by the grocery quick-add smart-ui row).
export {
  selectQuickAddState,
  selectQuickAddCanAddLocal,
  selectQuickAddCanAddProduct,
  selectQuickAddCanAddCategory,
} from './quick-add/quick-add.selector';

// Lazy providers (state + effects), wired from the route
export {
  groceriesLazyProviders,
  groceriesHydrationResolver,
} from './provide-groceries-lazy';
// Minimal lazy providers for the /list-settings route (listSettings slice only —
// NOT the grocery lists, so the telemetry reporters don't fire with empty state).
export {
  listSettingsLazyProviders,
  listSettingsHydrationResolver,
} from './provide-list-settings-lazy';
