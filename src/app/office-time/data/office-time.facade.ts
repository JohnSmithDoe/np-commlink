import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Dayjs } from 'dayjs';
import { DashboardSettingsType } from '../model';
import { OfficeTimeActions } from './office-time/office-time.actions';
import {
  selectDashboardItems,
  selectDashboardSettings,
  selectFreedays,
  selectHolidayDays,
  selectHolidays,
  selectOfficedays,
  selectTargetOfficeDaysPerWeek,
} from './office-time/office-time.selector';
import {
  selectDashboardStatsMonth,
  selectDashboardStatsQuarter,
  selectDashboardStatsWeek,
  selectDashboardStatsYear,
  selectTodayIsOfficeDay,
} from './office-time/office-time.stats.selector';
import { dayjsToday } from './office-time/office-time.utils';

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
  readonly todayIsOfficeDay = this.#store.selectSignal(selectTodayIsOfficeDay);

  readonly statsWeek = this.#store.selectSignal(selectDashboardStatsWeek);
  readonly statsMonth = this.#store.selectSignal(selectDashboardStatsMonth);
  readonly statsQuarter = this.#store.selectSignal(selectDashboardStatsQuarter);
  readonly statsYear = this.#store.selectSignal(selectDashboardStatsYear);

  // ── Commands ─────────────────────────────────────────────────────────────
  initOfficeTime(): void {
    this.#store.dispatch(OfficeTimeActions.initOfficeTime());
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
