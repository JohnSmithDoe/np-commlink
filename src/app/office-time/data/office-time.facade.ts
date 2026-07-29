import { computed, inject, Injectable, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { Dayjs } from 'dayjs';
import { DashboardSettingsType } from '../model/office-time.types';
import { OfficeTimeActions } from './actions/office-time.actions';
import {
  selectDashboardItems,
  selectDashboardSettings,
  selectFreedays,
  selectHolidayDays,
  selectHolidays,
  selectOfficedays,
  selectTargetOfficeDaysPerWeek,
} from './selectors/office-time.selector';
import {
  selectDashboardStatsMonth,
  selectDashboardStatsQuarter,
  selectDashboardStatsWeek,
  selectDashboardStatsYear,
} from './selectors/office-time-stats.selector';
import { dayjsToday, isOfficeDay } from '../util/office-time.utils';

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

  readonly statsWeek = this.#store.selectSignal(selectDashboardStatsWeek);
  readonly statsMonth = this.#store.selectSignal(selectDashboardStatsMonth);
  readonly statsQuarter = this.#store.selectSignal(selectDashboardStatsQuarter);
  readonly statsYear = this.#store.selectSignal(selectDashboardStatsYear);

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
