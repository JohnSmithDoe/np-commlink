import { inject } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, ActionCreator, MemoizedSelector, Store } from '@ngrx/store';
import { EMPTY, map, withLatestFrom } from 'rxjs';
import { BaseItem, UpdateDTO } from '../../model/base-item.types';
import { ItemList, ItemListId } from '../../model/item-list.types';
import { findMatchingItem } from '../../util/app.utils';
import { updatedSearchQuery } from '../../util/item-lists/list.utils';
import { NotificationsActions } from '../actions/notifications.actions';
import { UndoActions } from '../undo/undo.actions';

type Creator<
  Arguments extends unknown[],
  Properties extends object,
> = ActionCreator<string, (...parameters: Arguments) => Properties & Action>;

type ListFlowActions<T extends BaseItem> = {
  addItemFromSearch: Creator<[], object>;
  addOrUpdateItem: Creator<[item: T], { item: T }>;
  addItem: Creator<[item: T], { item: T }>;
  addItemFailure: Creator<[item: T], { item: T }>;
  updateItem: Creator<[item: UpdateDTO<T>], { item: UpdateDTO<T> }>;
  updateSearch: Creator<[searchQuery?: string], { searchQuery?: string }>;
};

const toastAddItemFailure = <T extends BaseItem>(
  addItemFailure: Creator<[item: T], { item: T }>
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

export const pushUndoOnDelete = <T extends BaseItem>(
  scope: ItemListId,
  removeItem: Creator<[item: T], { item: T }>,
  addItem: Creator<[item: T], { item: T }>
) =>
  createEffect(
    (actions$ = inject(Actions)) => {
      return actions$.pipe(
        ofType(removeItem),
        map(({ item }) =>
          UndoActions.pushed({
            scope,
            name: item.name,
            action: addItem(item),
          })
        )
      );
    },
    { functional: true }
  );

type Matcher<T extends BaseItem> = (item: T, items: T[]) => T | undefined;
type ItemFromSearch<T> = (name: string, filterBy?: string) => T;

const matcherOf = <T extends BaseItem>(match?: Matcher<T>): Matcher<T> =>
  match ?? findMatchingItem;

const addFromSearch = <T extends BaseItem, S extends ItemList<T>>(
  actions: ListFlowActions<T>,
  select: MemoizedSelector<object, S>,
  create: ItemFromSearch<T> | null,
  match: Matcher<T>
) =>
  createEffect(
    (actions$ = inject(Actions), store = inject(Store)) => {
      if (!create) return EMPTY;
      return actions$.pipe(
        ofType(actions.addItemFromSearch),
        withLatestFrom(store.select(select), (_, list) => list),
        map((list) => {
          const item = create(list.searchQuery ?? '', list.filterBy);
          const duplicate = match(item, list.items);
          return duplicate
            ? actions.addItemFailure(duplicate)
            : actions.addItem(item);
        })
      );
    },
    { functional: true }
  );

export const createItemListEffects = <
  T extends BaseItem,
  S extends ItemList<T>,
>(cfg: {
  actions: ListFlowActions<T>;
  select: MemoizedSelector<object, S>;
  create: ItemFromSearch<T> | null;
  match?: Matcher<T>;
  undoableDelete?: {
    scope: ItemListId;
    removeItem: Creator<[item: T], { item: T }>;
  };
}) => ({
  addItemFromSearch$: addFromSearch(
    cfg.actions,
    cfg.select,
    cfg.create,
    matcherOf(cfg.match)
  ),

  addOrUpdateItem$: createEffect(
    (actions$ = inject(Actions), store = inject(Store)) => {
      const match = matcherOf(cfg.match);
      return actions$.pipe(
        ofType(cfg.actions.addOrUpdateItem),
        withLatestFrom(store.select(cfg.select)),
        map(([{ item }, list]) =>
          match(item, list.items)
            ? cfg.actions.updateItem(item)
            : cfg.actions.addItem(item)
        )
      );
    },
    { functional: true }
  ),

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

  addItemFailure$: toastAddItemFailure(cfg.actions.addItemFailure),

  ...(cfg.undoableDelete
    ? {
        undoDelete$: pushUndoOnDelete(
          cfg.undoableDelete.scope,
          cfg.undoableDelete.removeItem,
          cfg.actions.addItem
        ),
      }
    : {}),
});

export const clearSearchAfter = (
  updateSearch: Creator<[searchQuery?: string], { searchQuery?: string }>,
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
