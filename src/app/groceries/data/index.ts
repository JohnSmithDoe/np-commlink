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

// Display selectors read by the grocery pages/dialogs
export {
  selectShoppingState,
  selectShoppingListHasBoughtItems,
} from './shopping.selector';
export { selectStorageListItems } from './storage.selector';
export { selectProductListItems } from './products.selector';

// Grocery's typed views of the shared, domain-blind itemDialogs slice
export {
  selectEditProduct,
  selectEditShoppingItem,
  selectEditStorageItem,
} from './item-dialogs.selector';

// Multi-list page facade
export { GroceryListPageFacade } from './grocery-list/grocery-list-page.facade';

// Lazy providers (state + effects), wired from the route
export { groceriesLazyProviders } from './provide-groceries-lazy';
