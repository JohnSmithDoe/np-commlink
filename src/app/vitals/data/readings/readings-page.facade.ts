/* ─── why ─────────────────────────────────────────────────────────
 * `sortable` is false, which is how `ListPageComponent` learns this list
 * offers no sort buttons: a reading's `name` is its date, and the built-in
 * one is labelled A–Z. The order is real all the same — the readings slice
 * carries `name` descending, so the toolbar keeps its actions while the
 * list stays newest-first.
 *
 * `hasTrend` is what the page defers the chart on. One reading is a dot,
 * which says nothing the list does not — and chart.js is 76 KB gzipped, so
 * the question is worth asking before the download rather than inside the
 * component afterwards.
 * ───────────────────────────────────────────────────────────────── */

import { computed, inject, Injectable, signal } from '@angular/core';
import { BaseListPageFacade } from '../../../@shared/data/item-lists/list-page.facade.base';
import { Reading } from '../../model/vitals.types';
import { ProfilesFacade } from '../profiles/profiles.facade';
import { ReadingsFacade } from './readings.facade';

const MIN_TREND_READINGS = 2;

@Injectable({ providedIn: 'root' })
export class ReadingsPageFacade extends BaseListPageFacade {
  readonly #readings = inject(ReadingsFacade);
  readonly #profiles = inject(ProfilesFacade);

  protected readonly commands = this.#readings;

  readonly state = this.#readings.state;
  readonly items = this.#readings.items;
  readonly searchResult = this.#readings.searchResult;
  readonly sortable = signal(false);

  readonly profile = this.#profiles.routeProfile;
  readonly heading = computed(() => this.profile()?.name ?? '');
  readonly summary = this.#readings.summary;
  readonly hasTrend = computed(
    () => this.#readings.series().length >= MIN_TREND_READINGS
  );

  showCreateDialog(): void {
    this.#readings.showCreateDialog();
  }

  showEditDialog(item: Reading): void {
    this.#readings.showEditDialog(item);
  }

  removeItem(item: Reading): void {
    this.#readings.removeItem(item);
  }

  showEditProfileDialog(): void {
    const profile = this.profile();
    if (profile) {
      this.#profiles.showEditDialog(profile);
    }
  }
}
