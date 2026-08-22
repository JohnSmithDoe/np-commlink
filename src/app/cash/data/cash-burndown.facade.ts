/* ─── why ─────────────────────────────────────────────────────────
 * `todayISO` is a signal the facade owns rather than a `dayjs()` inside the
 * computed, because a computed reading the clock never recomputes: it has no
 * dependency to invalidate, so the allowance would keep yesterday's
 * denominator until something else in the store changed.
 * ───────────────────────────────────────────────────────────────── */
import { computed, inject, Injectable, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import dayjs from 'dayjs';
import { burndownFor, spendsThisMonth } from '../util/burndown.utils';
import { dueStatus } from '../util/schedule.utils';
import {
  selectAllowanceBalanceCents,
  selectAllTransactions,
} from './cash.selector';
import { selectScheduleItems } from './schedules/cash-schedules.selector';

@Injectable({ providedIn: 'root' })
export class CashBurndownFacade {
  readonly #store = inject(Store);

  readonly #todayISO = signal(dayjs().format());

  readonly #balanceCents = this.#store.selectSignal(
    selectAllowanceBalanceCents
  );
  readonly #transactions = this.#store.selectSignal(selectAllTransactions);
  readonly schedules = this.#store.selectSignal(selectScheduleItems);

  readonly burndown = computed(() =>
    burndownFor(
      this.#balanceCents(),
      this.#transactions(),
      this.schedules(),
      this.#todayISO()
    )
  );

  readonly monthSpends = computed(() =>
    spendsThisMonth(this.#transactions(), this.#todayISO())
  );

  readonly overdue = computed(() =>
    this.schedules().filter(
      (schedule) => dueStatus(schedule, this.#todayISO()) === 'overdue'
    )
  );

  readonly upcoming = computed(() =>
    this.schedules()
      .filter((schedule) => dueStatus(schedule, this.#todayISO()) !== 'overdue')
      .toSorted((a, b) => a.nextDueISO.localeCompare(b.nextDueISO))
  );

  refreshToday(): void {
    this.#todayISO.set(dayjs().format());
  }
}
