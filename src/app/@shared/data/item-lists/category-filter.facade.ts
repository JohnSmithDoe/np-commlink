import { inject, Service } from '@angular/core';
import { Store } from '@ngrx/store';
import { ItemListRouteActions } from '../actions/item-list-route.actions';

@Service()
export class CategoryFilterFacade {
  readonly #store = inject(Store);

  clear(): void {
    this.#store.dispatch(ItemListRouteActions.clearCategoryFilter());
  }
}
