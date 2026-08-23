import { computed, inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { UndoActions } from './undo.actions';
import { selectUndoTop } from './undo.selector';

@Injectable({ providedIn: 'root' })
export class UndoFacade {
  readonly #store = inject(Store);

  readonly top = this.#store.selectSignal(selectUndoTop);
  readonly canUndo = computed(() => this.top() !== undefined);

  undo(): void {
    this.#store.dispatch(UndoActions.performed());
  }
}
