import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, ActionCreator, MemoizedSelector, Store } from '@ngrx/store';
import { filter, map, withLatestFrom } from 'rxjs';
import { IBaseItem, TUpdateDTO } from '../../model/base-item.types';
import { IListState, TItemListMode } from '../../model/item-list.types';
import { matchesItemExactly } from '../../util/app.utils';
import { updatedSearchQuery } from '../../util/list/list.utils';

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
type TCreator<Args extends unknown[], Props extends object> = ActionCreator<
  string,
  (...args: Args) => Props & Action
>;

export type TListFlowActions<T extends IBaseItem> = {
  addItemFromSearch: TCreator<[], object>;
  addOrUpdateItem: TCreator<[item: T], { item: T }>;
  addItem: TCreator<[item: T], { item: T }>;
  addItemFailure: TCreator<[item: T], { item: T }>;
  updateItem: TCreator<[item: TUpdateDTO<T>], { item: TUpdateDTO<T> }>;
  updateSearch: TCreator<[searchQuery?: string], { searchQuery?: string }>;
};

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

/**
 * Leaving categories mode clears any active category filter — otherwise the
 * flat list would come back silently filtered. Only for domains that HAVE
 * categories (tracking has none).
 */
export const clearFilterWhenLeavingCategories = (actions: {
  updateMode: TCreator<[mode?: TItemListMode], { mode?: TItemListMode }>;
  updateFilter: TCreator<[filterBy?: string], { filterBy?: string }>;
}) =>
  createEffect(
    (actions$ = inject(Actions)) => {
      return actions$.pipe(
        ofType(actions.updateMode),
        filter(({ mode }) => mode !== 'categories'),
        map(() => actions.updateFilter())
      );
    },
    { functional: true }
  );
