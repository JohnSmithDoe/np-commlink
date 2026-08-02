import { inject } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, ActionCreator, MemoizedSelector, Store } from '@ngrx/store';
import { map, withLatestFrom } from 'rxjs';
import { BaseItem, UpdateDTO } from '../../model/base-item.types';
import { ListState } from '../../model/item-list.types';
import { matchesItemExactly } from '../../util/app.utils';
import { updatedSearchQuery } from '../../util/item-lists/list.utils';
import { NotificationsActions } from '../actions/notifications.actions';

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

export const createItemListEffects = <
  T extends BaseItem,
  S extends ListState<T>,
>(cfg: {
  actions: ListFlowActions<T>;
  select: MemoizedSelector<object, S>;
  create: (name: string, filterBy?: string) => T;
}) => ({
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
