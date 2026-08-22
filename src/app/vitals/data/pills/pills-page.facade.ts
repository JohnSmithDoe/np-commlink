import { computed, inject, Injectable, signal } from '@angular/core';
import { BaseListPageFacade } from '../../../@shared/data/item-lists/list-page.facade.base';
import { Pill } from '../../model/vitals.types';
import { ProfilesFacade } from '../profiles/profiles.facade';
import { PillsFacade } from './pills.facade';

@Injectable({ providedIn: 'root' })
export class PillsPageFacade extends BaseListPageFacade {
  readonly #pills = inject(PillsFacade);
  readonly #profiles = inject(ProfilesFacade);

  protected readonly commands = this.#pills;

  readonly state = this.#pills.state;
  readonly items = this.#pills.items;
  readonly searchResult = this.#pills.searchResult;
  readonly sortable = signal(false);

  readonly profile = this.#profiles.routeProfile;
  readonly heading = computed(() => this.profile()?.name ?? '');

  showCreateDialog(): void {
    this.#pills.showCreateDialog();
  }

  showEditDialog(item: Pill): void {
    this.#pills.showEditDialog(item);
  }

  removeItem(item: Pill): void {
    this.#pills.removeItem(item);
  }

  isTakenToday(item: Pill): boolean {
    return this.#pills.isTakenToday(item);
  }
}
