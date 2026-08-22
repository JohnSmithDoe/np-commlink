import { inject, Injectable } from '@angular/core';
import { BaseListPageFacade } from '../../../@shared/data/item-lists/list-page.facade.base';
import { ProfilesFacade } from './profiles.facade';

@Injectable({ providedIn: 'root' })
export class ProfilesPageFacade extends BaseListPageFacade {
  readonly #profiles = inject(ProfilesFacade);

  protected readonly commands = this.#profiles;

  readonly state = this.#profiles.state;
  readonly items = this.#profiles.items;
  readonly searchResult = this.#profiles.searchResult;

  showCreateDialog(): void {
    this.#profiles.showCreateDialog();
  }
}
