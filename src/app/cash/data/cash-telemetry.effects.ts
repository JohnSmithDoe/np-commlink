import { inject, Injectable } from '@angular/core';
import { createEffect } from '@ngrx/effects';
import { createSelector, Store } from '@ngrx/store';
import { map } from 'rxjs';
import { DashboardActions } from '../../@shared/util/dashboard/dashboard.actions';
import { selectCashState } from './cash.selector';

// Net balance in whole euros across all accounts (opening balances + signed
// transaction amounts, integer cents → euros) for the deck's CREDSTICK tile.
// Transfer legs net to zero across accounts, so they need no special-casing;
// reconciled-away legs (matchedTxnId set) ARE excluded — mirroring
// selectAccountBalances — so a spend logged before it cleared isn't counted
// twice (cash-plan.md "exclude reconciled-away legs").
export const selectCashBalanceEuros = createSelector(
  selectCashState,
  (state) => {
    const opening = (state?.accounts ?? []).reduce(
      (sum, account) => sum + account.openingBalanceCents,
      0
    );
    const txns = (state?.transactions ?? [])
      .filter((txn) => !txn.matchedTxnId)
      .reduce((sum, txn) => sum + txn.amountCents, 0);
    return Math.round((opening + txns) / 100);
  }
);

// Telemetry inversion (§4, CQRS): cash *pushes* its net balance to the shared
// dashboard read-model. store.select emits on registration and on every change.
// Imports only its own selector + the @shared contract; commlink never imports
// here.
@Injectable({ providedIn: 'root' })
export class CashTelemetryEffects {
  readonly #store = inject(Store);

  report$ = createEffect(() => {
    return this.#store
      .select(selectCashBalanceEuros)
      .pipe(
        map((balance) =>
          DashboardActions.report({ source: 'cash', metrics: { balance } })
        )
      );
  });
}
