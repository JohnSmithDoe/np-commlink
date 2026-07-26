import { Injectable, signal } from '@angular/core';
import { IBaseItem, TEditItemMode } from '../model/base-item.types';
import { TItemListId } from '../model/item-list.types';

/**
 * "Open an edit dialog for this item on this list" — the whole payload. It is a
 * command, not form state: the editable copy is the wrapper's local draft (see
 * `BaseEditItemDialog`), and nothing here is ever written per keystroke.
 */
export type TItemDialogRequest<T extends IBaseItem> = Readonly<{
  item: T;
  listId: TItemListId;
  editMode: TEditItemMode;
  // "Create & add to another list": the sibling grocery list the new product
  // should also be pushed onto (only the product dialog acts on it).
  addToAdditionalList?: TItemListId;
}>;

/**
 * Host for the domain-blind item edit dialogs. This replaced the eager
 * `itemDialogs` NgRx slice, which was the wrong primitive for the job: the
 * open-command is transient, single-instance UI state with no persistence, no
 * cross-feature readers and no devtools value — and routing it through the store
 * cost a two-hop action round-trip per open plus a duplicated `listId` guard in
 * every lazy orchestrator effect (route injectors and effects are never torn
 * down, so every one of them saw every other domain's dialog actions).
 *
 * Each domain facade now calls {@link open} directly and synchronously, so the
 * orchestrators are gone. One instance serves every mounted wrapper; the
 * request's `listId` is what selects the target.
 */
@Injectable({ providedIn: 'root' })
export class ItemDialogService {
  readonly #request = signal<TItemDialogRequest<IBaseItem> | null>(null);

  /** The open dialog's command, or null when no dialog is open. */
  readonly request = this.#request.asReadonly();

  open<T extends IBaseItem>(request: TItemDialogRequest<T>): void {
    // Copy the item so reopening the SAME object still yields a fresh reference.
    // The wrappers' draft is a `linkedSignal` over it: without the copy, an
    // aborted edit followed by reopening the same row would show the abandoned
    // draft, because the computation would not re-run.
    this.#request.set({ ...request, item: { ...request.item } });
  }

  close(): void {
    this.#request.set(null);
  }
}
