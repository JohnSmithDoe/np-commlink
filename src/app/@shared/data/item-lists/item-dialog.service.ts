/* ─── why ─────────────────────────────────────────────────────────
 * `close` takes the caller's `listId`, and a caller that is no longer the
 * open dialog is IGNORED. One request means one dialog, so when a dialog
 * opens another the first one hides — and `ion-modal` answers that by
 * emitting `didDismiss`, whose handler is `close()`. Unqualified, that
 * closes the dialog that just opened: the second appears and vanishes.
 *
 * Navigation closes unconditionally, and passes no id for that reason:
 * there the request itself is what has become stale.
 * ───────────────────────────────────────────────────────────────── */
import { inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';
import { BaseItem, EditItemMode } from '../../model/base-item.types';
import { ItemListId } from '../../model/item-list.types';

export type ItemDialogRequest<T extends BaseItem> = Readonly<{
  item: T;
  listId: ItemListId;
  editMode: EditItemMode;
  addToAdditionalList?: ItemListId;
}>;

@Injectable({ providedIn: 'root' })
export class ItemDialogService {
  readonly #request = signal<ItemDialogRequest<BaseItem> | null>(null);

  readonly request = this.#request.asReadonly();

  constructor() {
    inject(Router, { optional: true })
      ?.events.pipe(
        filter((event) => event instanceof NavigationStart),
        takeUntilDestroyed()
      )
      .subscribe(() => this.close());
  }

  open<T extends BaseItem>(request: ItemDialogRequest<T>): void {
    this.#request.set({ ...request, item: { ...request.item } });
  }

  close(listId?: ItemListId): void {
    if (listId && this.#request()?.listId !== listId) return;
    this.#request.set(null);
  }
}
