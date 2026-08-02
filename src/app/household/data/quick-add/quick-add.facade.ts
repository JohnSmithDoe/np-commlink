import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  selectQuickAddCanAddLocal,
  selectQuickAddCanAddProduct,
  selectQuickAddState,
} from './quick-add.selector';

@Injectable({ providedIn: 'root' })
export class QuickAddFacade {
  readonly #store = inject(Store);

  readonly state = this.#store.selectSignal(selectQuickAddState);
  readonly canAddLocal = this.#store.selectSignal(selectQuickAddCanAddLocal);
  readonly canAddProduct = this.#store.selectSignal(
    selectQuickAddCanAddProduct
  );
}
