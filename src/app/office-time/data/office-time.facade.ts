import { computed, inject, Injectable, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { Dayjs } from 'dayjs';
import { DashboardSettingsType } from '../model/office-time.types';
import { OfficeTimeActions } from './office-time.actions';
import {
  selectDashboardItems,
  selectDashboardSettings,
  selectFreedays,
  selectHolidayDays,
  selectHolidays,
  selectOfficedays,
  selectTargetOfficeDaysPerWeek,
} from './office-time.selector';
import { selectStatsKeys } from './office-time-stats.selector';
import {
  calculateStats,
  dayjsToday,
  isOfficeDay,
  TimePeriod,
} from '../util/office-time.utils';

/**
 * The `office-time` (Soft-clock dashboard) domain facade — the single NgRx
 * surface for the office-time page, its settings page, and the dash smart-ui
 * cards. Injects `Store` so the components never do. Covers only the `officeTime`
 * slice; the app-global theme picker on the settings page reads the kernel
 * `SettingsFacade`.
 */
@Injectable({ providedIn: 'root' })
export class OfficeTimeFacade {
  readonly #store = inject(Store);

  readonly holidays = this.#store.selectSignal(selectHolidays);
  readonly holidayDays = this.#store.selectSignal(selectHolidayDays);
  readonly officedays = this.#store.selectSignal(selectOfficedays);
  readonly freedays = this.#store.selectSignal(selectFreedays);
  readonly dashboardSettings = this.#store.selectSignal(
    selectDashboardSettings
  );
  readonly dashboardItems = this.#store.selectSignal(selectDashboardItems);
  readonly targetOfficeDaysPerWeek = this.#store.selectSignal(
    selectTargetOfficeDaysPerWeek
  );
  // "Is today already logged" is not a pure function of the slice — it also
  // depends on the clock, which a memoized selector reading `dayjs()` in its
  // projector can never notice: `officedays` keeps its reference across
  // midnight, so the projector never re-runs and the dash button stays
  // disabled on the new day. Keeping `today` as an explicit, refreshable
  // input is what makes the answer expire.
  readonly #today = signal(dayjsToday());
  readonly todayIsOfficeDay = computed(() =>
    isOfficeDay(this.#today(), this.officedays())
  );

  // The same argument as `todayIsOfficeDay` above, and the cards were on the
  // wrong side of it: every stat is a function of the slice AND of what day it
  // is, so only the day-key half can be a memoized selector. Read as one, a
  // resumed session showed a live "log today" button beside a month card still
  // reporting the month that had just ended.
  readonly #statsKeys = this.#store.selectSignal(selectStatsKeys);
  readonly statsWeek = this.#statsFor('week');
  readonly statsMonth = this.#statsFor('month');
  readonly statsQuarter = this.#statsFor('quarter');
  readonly statsYear = this.#statsFor('year');

  constructor() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.#refreshToday();
    });
  }

  // ── Commands ─────────────────────────────────────────────────────────────
  // Page entry and returning to the foreground are the two moments the day can
  // have rolled over without anything in the slice changing.
  initOfficeTime(): void {
    this.#refreshToday();
    this.#store.dispatch(OfficeTimeActions.loadHolidays());
  }

  #refreshToday(): void {
    const today = dayjsToday();
    if (!today.isSame(this.#today(), 'day')) this.#today.set(today);
  }

  #statsFor(period: TimePeriod) {
    return computed(() =>
      calculateStats(period, this.#statsKeys(), this.#today())
    );
  }

  // Mark today as an office day (the dash button); the "today" timestamp is a
  // domain concern, minted here so the dumb button need not know dayjs.
  addOfficeToday(): void {
    this.#store.dispatch(OfficeTimeActions.addOfficeTime(dayjsToday()));
  }

  setFreedays(freedays: (string | undefined | null)[]): void {
    this.#store.dispatch(OfficeTimeActions.setFreedays(freedays));
  }

  setOfficedays(officedays: Dayjs[]): void {
    this.#store.dispatch(OfficeTimeActions.setOfficedays(officedays));
  }

  saveDashboardSettings(key: DashboardSettingsType, active: boolean): void {
    this.#store.dispatch(OfficeTimeActions.saveDashboardSettings(key, active));
  }

  saveTargetOfficeDaysPerWeek(daysPerWeek: number): void {
    this.#store.dispatch(
      OfficeTimeActions.saveTargetOfficeDaysPerWeek(daysPerWeek)
    );
  }

  resetData(): void {
    this.#store.dispatch(OfficeTimeActions.resetData());
  }
}
