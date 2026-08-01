import { inject } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, ActionCreator, MemoizedSelector, Store } from '@ngrx/store';
import { map, withLatestFrom } from 'rxjs';
import { IBaseItem, TUpdateDTO } from '../../model/base-item.types';
import { IListState } from '../../model/item-list.types';
import { matchesItemExactly } from '../../util/app.utils';
import { updatedSearchQuery } from '../../util/item-lists/list.utils';
import { NotificationsActions } from '../actions/notifications.actions';

/**
 * The item-flow behaviours every single-list domain needs, as effect builders
 * rather than one shared class.
 *
 * A shared *class* is what the lazy-injector rule forbids: NgRx dedups
 * same-class instances and route injectors are never torn down, so one class
 * registered in two of them double-dispatches across a transition. A builder is
 * safe by construction — each caller gets its own effect identities, and each
 * only ever `ofType`s its own action group.
 *
 * The multi-list grocery engine does NOT use these: it is a router (generic
 * `GroceryListActions` → the concrete list's group, resolved from the action's
 * source prefix) plus the cross-list copy rules, so its versions of these
 * behaviours carry a `listId` these cannot know about.
 */
type TCreator<
  Arguments extends unknown[],
  Properties extends object,
> = ActionCreator<string, (...parameters: Arguments) => Properties & Action>;

type TListFlowActions<T extends IBaseItem> = {
  addItemFromSearch: TCreator<[], object>;
  addOrUpdateItem: TCreator<[item: T], { item: T }>;
  addItem: TCreator<[item: T], { item: T }>;
  addItemFailure: TCreator<[item: T], { item: T }>;
  updateItem: TCreator<[item: TUpdateDTO<T>], { item: TUpdateDTO<T> }>;
  updateSearch: TCreator<[searchQuery?: string], { searchQuery?: string }>;
};

/**
 * Say why an add did nothing: the list already holds an item by that name.
 *
 * Exported as well as folded into `createItemListEffects` above, because the
 * grocery engine cannot use that builder and needs one instance per list — one
 * creator per call keeps each list's item type exact, where three heterogeneous
 * creators would only unify at `IBaseItem`.
 */
export const toastAddItemFailure = <T extends IBaseItem>(
  addItemFailure: TCreator<[item: T], { item: T }>
) =>
  createEffect(
    (actions$ = inject(Actions)) => {
      return actions$.pipe(
        ofType(addItemFailure),
        map(({ item }) =>
          NotificationsActions.toast({
            key: marker('toast.add.item.failure'),
            parameters: { name: item.name },
            color: 'medium',
          })
        )
      );
    },
    { functional: true }
  );

export const createItemListEffects = <
  T extends IBaseItem,
  S extends IListState<T>,
>(cfg: {
  actions: TListFlowActions<T>;
  select: MemoizedSelector<object, S>;
  create: (name: string, filterBy?: string) => T;
}) => ({
  // Turn the searchbar's text into an item, unless the list already holds it.
  addItemFromSearch$: createEffect(
    (actions$ = inject(Actions), store = inject(Store)) => {
      return actions$.pipe(
        ofType(cfg.actions.addItemFromSearch),
        withLatestFrom(store.select(cfg.select), (_, list) => list),
        map((list) => {
          const item = cfg.create(list.searchQuery ?? '', list.filterBy);
          const duplicate = matchesItemExactly(item, list.items);
          return duplicate
            ? cfg.actions.addItemFailure(duplicate)
            : cfg.actions.addItem(item);
        })
      );
    },
    { functional: true }
  ),

  // Resolve an add-or-update into whichever it actually is.
  addOrUpdateItem$: createEffect(
    (actions$ = inject(Actions), store = inject(Store)) => {
      return actions$.pipe(
        ofType(cfg.actions.addOrUpdateItem),
        withLatestFrom(store.select(cfg.select)),
        map(([{ item }, list]) =>
          matchesItemExactly(item, list.items)
            ? cfg.actions.updateItem(item)
            : cfg.actions.addItem(item)
        )
      );
    },
    { functional: true }
  ),

  // A rename can move the item out of the current search results, hiding the row
  // the user just edited — so drop the query when it no longer matches.
  syncSearchOnRename$: createEffect(
    (actions$ = inject(Actions), store = inject(Store)) => {
      return actions$.pipe(
        ofType(cfg.actions.updateItem),
        withLatestFrom(store.select(cfg.select)),
        map(([{ item }, list]) =>
          cfg.actions.updateSearch(updatedSearchQuery(item, list.searchQuery))
        )
      );
    },
    { functional: true }
  ),

  // Paired with the dispatch rather than left to the caller: the failure is
  // raised by `addItemFromSearch$` above, so a domain that registered the builder
  // without this reaction swallowed the message. Groceries did exactly that, and
  // the fix at the time still left the pairing to every caller to remember.
  addItemFailure$: toastAddItemFailure(cfg.actions.addItemFailure),
});

/** Reset the search box after an action that changes what the list shows. */
export const clearSearchAfter = (
  updateSearch: TCreator<[searchQuery?: string], { searchQuery?: string }>,
  triggers: ActionCreator[]
) =>
  createEffect(
    (actions$ = inject(Actions)) => {
      return actions$.pipe(
        ofType(...triggers),
        map(() => updateSearch(''))
      );
    },
    { functional: true }
  );
