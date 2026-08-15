import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  selectMonthlyTotals,
  selectReportTotals,
  selectSpendByCategory,
} from './cash.selector';

@Injectable({ providedIn: 'root' })
export class CashReportFacade {
  readonly #store = inject(Store);

  readonly totals = this.#store.selectSignal(selectReportTotals);
  readonly monthlyTotals = this.#store.selectSignal(selectMonthlyTotals);
  readonly spendByCategory = this.#store.selectSignal(selectSpendByCategory);
}
