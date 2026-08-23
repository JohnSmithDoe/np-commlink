/* ─── why ─────────────────────────────────────────────────────────
 * Registering the factory is the load-bearing half, not writing it:
 * `addOrUpdateItem` and `addItemFromSearch` are ROUTING actions no reducer
 * handles, so an unregistered collection loses every save silently — the
 * bug household's catalog shipped with.
 *
 * `create: null` is the declaration that a list cannot be MINTED from a
 * search term: a rule with no conditions can never fire and a schedule with
 * no amount is not a commitment, so `addItemFromSearch` stays inert and the
 * base facade opens the create dialog instead. It is not a reason to stay
 * off the factory — `addOrUpdateItem` and `syncSearchOnRename` are the same
 * question in every list, and answering it four times by hand is how one of
 * them ends up answering it differently.
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
import { CashRulesActions } from './rules/cash-rules.actions';
import { selectRulesState } from './rules/cash-rules.selector';
import { CashSchedulesActions } from './schedules/cash-schedules.actions';
import { selectSchedulesState } from './schedules/cash-schedules.selector';

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

export const cashRulesListEffects = createItemListEffects({
  actions: CashRulesActions,
  select: selectRulesState,
  create: null,
});

export const cashSchedulesListEffects = createItemListEffects({
  actions: CashSchedulesActions,
  select: selectSchedulesState,
  create: null,
});
