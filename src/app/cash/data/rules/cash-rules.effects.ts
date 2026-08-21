/* ─── why ─────────────────────────────────────────────────────────
 * A rule that changed and did not fire reads as a broken rule, not as a
 * rule awaiting a button — so every write to the set re-derives the
 * categories, and `reorder` counts as a write because first-match-wins
 * makes the arrangement part of what a rule means.
 *
 * `recategorizations` is pure and skips `categoryManual` rows, which is
 * what makes re-running it on every change safe: it converges, and it
 * never overrules a category the user set by hand.
 *
 * The rules page keeps its apply button. This effect covers a change to the
 * RULES; the button covers everything else that can make the ledger and the
 * rules disagree — an import that ran under an older set, a category
 * merged away underneath one.
 * ───────────────────────────────────────────────────────────────── */
import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter, map, withLatestFrom } from 'rxjs';
import { recategorizations } from '../../util/categorize.utils';
import { selectAllTransactions } from '../cash.selector';
import { CashTransactionsActions } from '../transactions/cash-transactions.actions';
import { CashRulesActions } from './cash-rules.actions';
import { selectRuleItems } from './cash-rules.selector';

export const cashRulesEffects = {
  applyOnChange$: createEffect(
    (actions$ = inject(Actions), store = inject(Store)) => {
      return actions$.pipe(
        ofType(
          CashRulesActions.addItem,
          CashRulesActions.updateItem,
          CashRulesActions.removeItem,
          CashRulesActions.reorder
        ),
        withLatestFrom(
          store.select(selectAllTransactions),
          store.select(selectRuleItems)
        ),
        map(([, transactions, rules]) =>
          recategorizations(transactions, rules)
        ),
        filter((changes) => changes.length > 0),
        map((changes) => CashTransactionsActions.recategorize(changes))
      );
    },
    { functional: true }
  ),
};
