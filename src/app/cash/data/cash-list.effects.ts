/* ─── why ─────────────────────────────────────────────────────────
 * Registering the factory is the load-bearing half, not writing it:
 * `addOrUpdateItem` and `addItemFromSearch` are ROUTING actions no reducer
 * handles, so an unregistered collection loses every save silently — the
 * bug household's catalog shipped with.
 *
 * Only accounts and categories, deliberately: one minted from a search
 * term is a real thing the user then edits, where a rule with no
 * conditions can never fire and a transaction with no amount is not a
 * booking. Those two keep their own `addItem`/`updateItem` rather than
 * being given a `create` that must never be called.
 *
 * `clearSearchAfter` is categories-only: adding a transaction while
 * searching for one is how you find out you already had it.
 * ───────────────────────────────────────────────────────────────── */
import {
  clearSearchAfter,
  createItemListEffects,
} from '../../@shared/data/item-lists/item-list.effects.factory';
import { createCategory } from '../../@shared/util/app.factory';
import { createCashAccount } from '../util/cash.factory';
import { CashAccountsActions } from './accounts/cash-accounts.actions';
import { selectAccountsState } from './accounts/cash-accounts.selector';
import { CashCategoriesActions } from './categories/cash-categories.actions';
import { selectCashCategoryList } from './categories/cash-categories.selector';

export const cashAccountsListEffects = createItemListEffects({
  actions: CashAccountsActions,
  select: selectAccountsState,
  create: (name) => createCashAccount(name),
});

export const cashCategoriesListEffects = {
  ...createItemListEffects({
    actions: CashCategoriesActions,
    select: selectCashCategoryList,
    create: (name) => createCategory(name),
  }),

  clearSearch$: clearSearchAfter(CashCategoriesActions.updateSearch, [
    CashCategoriesActions.addItem,
    CashCategoriesActions.removeItem,
  ]),
};
