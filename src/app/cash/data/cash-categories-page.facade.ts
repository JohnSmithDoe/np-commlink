import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TCategoryId } from '../../@shared/types';
import { uuidv4 } from '../../@shared/util/app.utils';
import { ICategoriesPageFacade } from '../../@shared/util/list/categories-page.facade';
import { CashActions } from './cash.actions';
import { selectCashCategoriesWithCount } from './cash.selector';

/**
 * {@link ICategoriesPageFacade} for the single cash catalog. Reuses the shared
 * manage-categories page (replacing the rules page's old inline palette). Cash
 * has one flat catalog (no `:listId`), so titles + href are constant.
 * `drillTo` navigates to the cash category→transactions view — cash's answer to
 * the grocery/tasks `?filter` drill, since cash has no `filterBy` list.
 */
@Injectable({ providedIn: 'root' })
export class CashCategoriesPageFacade implements ICategoriesPageFacade {
  readonly #store = inject(Store);
  readonly #router = inject(Router);

  readonly categories = this.#store.selectSignal(selectCashCategoriesWithCount);
  readonly listTitleKey = signal('cash.page-title.cash');
  readonly listHref = signal('/cash');

  add(name: string): void {
    this.#store.dispatch(CashActions.addCategory({ id: uuidv4(), name }));
  }

  rename(id: TCategoryId, name: string): void {
    this.#store.dispatch(CashActions.updateCategory(id, name));
  }

  remove(id: TCategoryId): void {
    this.#store.dispatch(CashActions.removeCategory(id));
  }

  drillTo(id: TCategoryId): void {
    void this.#router.navigate(['/cash/category', id]);
  }
}
