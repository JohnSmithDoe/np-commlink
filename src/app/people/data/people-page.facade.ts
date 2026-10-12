import { inject, Injectable, signal } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Store } from '@ngrx/store';
import {
  BaseListPageFacade,
  itemListCommands,
} from '../../@shared/data/item-lists/list-page.facade.base';
import { ItemListSortOption } from '../../@shared/model/item-list.types';
import { PEOPLE_LIST_ID } from '../model/people.types';
import { PeopleActions } from './people.actions';
import { PeopleFacade } from './people.facade';

const SORT_OPTIONS: readonly ItemListSortOption[] = [
  { type: 'birthDate', labelKey: marker('people.list-toolbar.birth-date') },
];

@Injectable({ providedIn: 'root' })
export class PeoplePageFacade extends BaseListPageFacade {
  readonly #store = inject(Store);
  readonly #people = inject(PeopleFacade);

  protected readonly commands = itemListCommands(this.#store, {
    updateSearch: PeopleActions.updateSearch,
    updateSort: PeopleActions.updateSort,
  });

  readonly state = this.#people.state;
  readonly undoScope = signal(PEOPLE_LIST_ID);
  readonly items = this.#people.items;
  readonly searchResult = this.#people.searchResult;
  readonly sortOptions = signal(SORT_OPTIONS);

  showCreateDialog(): void {
    this.#people.showCreateDialog();
  }
}
