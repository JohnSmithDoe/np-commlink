import { inject, Injectable, signal } from '@angular/core';
import { BaseListPageFacade } from '../../../@shared/data/item-lists/list-page.facade.base';
import { PROFILES_LIST_ID } from '../../model/vitals.types';
import { ProfilesFacade } from './profiles.facade';

@Injectable({ providedIn: 'root' })
export class ProfilesPageFacade extends BaseListPageFacade {
  readonly #profiles = inject(ProfilesFacade);

  protected readonly commands = this.#profiles;

  readonly state = this.#profiles.state;
  readonly undoScope = signal(PROFILES_LIST_ID);
  readonly items = this.#profiles.items;
  readonly searchResult = this.#profiles.searchResult;

  showCreateDialog(): void {
    this.#profiles.showCreateDialog();
  }
}
