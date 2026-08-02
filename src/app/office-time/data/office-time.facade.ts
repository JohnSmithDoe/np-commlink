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
  readonly #today = signal(dayjsToday());
  readonly todayIsOfficeDay = computed(() =>
    isOfficeDay(this.#today(), this.officedays())
  );

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
