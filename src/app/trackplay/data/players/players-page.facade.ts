import { inject, Injectable, signal } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Store } from '@ngrx/store';
import {
  BaseListPageFacade,
  itemListCommands,
} from '../../../@shared/data/item-lists/list-page.facade.base';
import { ItemListSortOption } from '../../../@shared/model/item-list.types';
import { PERSON_EDITOR } from '../../../@shared/util/people/person-editor.token';
import { PlayersActions } from './players.actions';
import { PlayersFacade } from './players.facade';

const SORT_OPTIONS: readonly ItemListSortOption[] = [
  { type: 'createdAt', labelKey: marker('trackplay.list-toolbar.created') },
  { type: 'lastPlayedAt', labelKey: marker('trackplay.list-toolbar.last') },
];

@Injectable({ providedIn: 'root' })
export class PlayersPageFacade extends BaseListPageFacade {
  readonly #store = inject(Store);
  readonly #personEditor = inject(PERSON_EDITOR);
  readonly #players = inject(PlayersFacade);

  protected readonly commands = itemListCommands(this.#store, PlayersActions);

  readonly state = this.#players.state;
  readonly items = this.#players.items;
  readonly searchResult = this.#players.searchResult;
  readonly sortOptions = signal(SORT_OPTIONS);

  showCreateDialog(): void {
    this.#personEditor.create(this.state().searchQuery);
  }
}
