import { inject, Service } from '@angular/core';
import { Store } from '@ngrx/store';
import { ItemDialogService } from '../../@shared/data/item-lists/item-dialog.service';
import { PEOPLE_LIST_ID, Person } from '../model/people.types';
import { createPerson } from '../util/people.factory';
import { PeopleActions } from './people.actions';
import {
  selectPeopleListItems,
  selectPeopleSearchResult,
  selectPeopleState,
  selectPersonItems,
} from './people.selector';

@Service()
export class PeopleFacade {
  readonly #store = inject(Store);
  readonly #dialogs = inject(ItemDialogService);

  readonly state = this.#store.selectSignal(selectPeopleState);
  readonly allItems = this.#store.selectSignal(selectPersonItems);
  readonly items = this.#store.selectSignal(selectPeopleListItems);
  readonly searchResult = this.#store.selectSignal(selectPeopleSearchResult);

  showCreateDialog(name: string): void {
    this.#dialogs.open({
      item: createPerson(name),
      listId: PEOPLE_LIST_ID,
      editMode: 'create',
    });
  }

  showEditDialog(item: Person): void {
    this.#dialogs.open({ item, listId: PEOPLE_LIST_ID, editMode: 'update' });
  }

  saveItem(person: Person): void {
    this.#store.dispatch(PeopleActions.addOrUpdateItem(person));
  }

  removeItem(person: Person): void {
    this.#store.dispatch(PeopleActions.removeItem(person));
  }
}
