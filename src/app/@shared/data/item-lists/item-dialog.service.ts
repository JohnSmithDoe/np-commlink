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

  close(): void {
    this.#request.set(null);
  }
}
