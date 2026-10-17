/* ─── why ─────────────────────────────────────────────────────────
 * `todayISO` is a signal rather than a `dayjs()` inside the computed, because
 * a computed reading the clock never recomputes: it has no dependency to
 * invalidate, so the allowance would keep yesterday's denominator until
 * something else in the store changed. It comes from `TodayService`, which
 * re-arms at midnight and on `visibilitychange` — a page constructor cannot,
 * because the router outlet caches the page and never builds it again.
 * ───────────────────────────────────────────────────────────────── */
import { computed, inject, Service } from '@angular/core';
import { Store } from '@ngrx/store';
import { TodayService } from '../../@shared/data/services/today.service';
import { burndownFor, spendsThisMonth } from '../util/burndown.utils';
import { dueStatus } from '../util/schedule.utils';
import {
  selectAllowanceBalanceCents,
  selectAllowanceTransactions,
} from './cash.selector';
import { selectScheduleItems } from './schedules/cash-schedules.selector';

@Service()
export class CashBurndownFacade {
  readonly #store = inject(Store);

  readonly #todayISO = inject(TodayService).today;

  readonly #balanceCents = this.#store.selectSignal(
    selectAllowanceBalanceCents
  );
  readonly #transactions = this.#store.selectSignal(
    selectAllowanceTransactions
  );
  readonly schedules = this.#store.selectSignal(selectScheduleItems);

  readonly burndown = computed(() => {
    return burndownFor(
      this.#balanceCents(),
      this.#transactions(),
      this.schedules(),
      this.#todayISO()
    );
  });

  readonly monthSpends = computed(() =>
    spendsThisMonth(this.#transactions(), this.#todayISO())
  );

  readonly overdue = computed(() => {
    return this.schedules().filter(
      (schedule) => dueStatus(schedule, this.#todayISO()) === 'overdue'
    );
  });

  readonly upcoming = computed(() => {
    return this.schedules()
      .filter((schedule) => dueStatus(schedule, this.#todayISO()) !== 'overdue')
      .toSorted((a, b) => a.nextDueISO.localeCompare(b.nextDueISO));
  });
}
