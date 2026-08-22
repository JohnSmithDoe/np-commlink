/* ─── why ─────────────────────────────────────────────────────────
 * `scope` is a signal here and not a slice of the store: it is a question
 * the reader is asking, not a fact about the ledger, so it has no business
 * being persisted or replayed. `todayISO` comes from `TodayService` for the
 * reason the burn-down takes it from there — a computed that reads the clock
 * never invalidates, and a cached page never rebuilds to re-arm one.
 * ───────────────────────────────────────────────────────────────── */
import { computed, inject, Injectable, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { TodayService } from '../../@shared/data/services/today.service';
import { ReportScope } from '../model/report.types';
import { reportFor, uncategorizedOutflows } from '../util/report.utils';
import { selectAllTransactions } from './cash.selector';
import { selectCashCategories } from './categories/cash-categories.selector';

@Injectable({ providedIn: 'root' })
export class CashReportFacade {
  readonly #store = inject(Store);

  readonly #transactions = this.#store.selectSignal(selectAllTransactions);
  readonly #categories = this.#store.selectSignal(selectCashCategories);
  readonly #todayISO = inject(TodayService).today;
  readonly #scope = signal<ReportScope>('month');

  readonly scope = this.#scope.asReadonly();

  readonly report = computed(() =>
    reportFor(
      this.#transactions(),
      this.#categories(),
      this.#scope(),
      this.#todayISO()
    )
  );

  readonly totals = computed(() => this.report().totals);
  readonly monthlyTotals = computed(() => this.report().monthly);
  readonly spendByCategory = computed(() => this.report().byCategory);
  readonly biggestExpenses = computed(() => this.report().biggest);
  readonly spendByCounterparty = computed(() => this.report().byCounterparty);
  readonly uncategorized = computed(() => this.report().uncategorized);

  readonly uncategorizedOutflows = computed(() =>
    uncategorizedOutflows(this.#transactions(), this.#scope(), this.#todayISO())
  );

  setScope(scope: ReportScope): void {
    this.#scope.set(scope);
  }
}
