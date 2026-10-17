import { inject, Service } from '@angular/core';
import { Store } from '@ngrx/store';
import { ItemListId } from '../../model/item-list.types';
import { UndoEntry } from '../../model/undo.types';
import { newestIn } from '../../util/undo.utils';
import { UndoActions } from './undo.actions';
import { selectUndoEntries } from './undo.selector';

@Service()
export class UndoFacade {
  readonly #store = inject(Store);
  readonly #entries = this.#store.selectSignal(selectUndoEntries);

  topIn(scope: ItemListId): UndoEntry | undefined {
    return newestIn(this.#entries(), scope);
  }

  undo(scope: ItemListId): void {
    this.#store.dispatch(UndoActions.performed(scope));
  }
}
