import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action, createActionGroup, createFeatureSelector } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of, toArray } from 'rxjs';
import { BaseItem } from '../../model/base-item.types';
import { ItemList } from '../../model/item-list.types';
import { NotificationsActions } from '../actions/notifications.actions';
import { UndoActions } from '../undo/undo.actions';
import { createItemListActionEvents } from './item-list.actions.factory';
import {
  clearSearchAfter,
  createItemListEffects,
} from './item-list.effects.factory';

const TestActions = createActionGroup({
  source: 'Test',
  events: createItemListActionEvents<BaseItem>(),
});

const selectTestList = createFeatureSelector<ItemList<BaseItem>>('test-list');

const selectTestDefaults =
  createFeatureSelector<Partial<BaseItem>>('test-defaults');

function filedUnder(name: string, filterBy?: string): BaseItem {
  return { id: 'new', name, categoryIds: filterBy ? [filterBy] : [] };
}

const item: BaseItem = { id: 'a', name: 'Milk' };

const TEST_LIST_ID = '_test-list';

const effectsFor = (isUndoable: boolean) => {
  return createItemListEffects({
    actions: TestActions,
    select: selectTestList,
    create: (name: string) => ({ id: 'new', name }),
    ...(isUndoable && {
      undoableDelete: {
        scope: TEST_LIST_ID,
        removeItem: TestActions.removeItem,
      },
    }),
  });
};

describe('createItemListEffects — undoableDelete', () => {
  let actions$: Observable<Action>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideMockActions(() => actions$), provideMockStore()],
    });
  });

  it('records the removed item under the list it was configured with', async () => {
    actions$ = of(TestActions.removeItem(item));
    const undoDelete$ = effectsFor(true).undoDelete$;
    if (!undoDelete$) throw new Error('expected an opted-in list to undo');

    const emitted = await firstValueFrom(
      TestBed.runInInjectionContext(() => undoDelete$()).pipe(toArray())
    );

    expect(emitted).toEqual([
      UndoActions.pushed({
        scope: TEST_LIST_ID,
        name: 'Milk',
        action: TestActions.addItem(item),
      }),
    ]);
  });

  it('creates no undo effect for a list that did not opt in', () => {
    expect(effectsFor(false).undoDelete$).toBeUndefined();
  });
});

describe('createItemListEffects — the list flow', () => {
  let actions$: Observable<Action>;

  const setup = (list: Partial<ItemList<BaseItem>> = {}) => {
    TestBed.configureTestingModule({
      providers: [
        provideMockActions(() => actions$),
        provideMockStore({
          initialState: {
            'test-list': { id: TEST_LIST_ID, items: [], ...list },
            'test-defaults': { categoryIds: ['seeded'] },
          },
        }),
      ],
    });
  };

  const emitted = (effect: () => Observable<Action>) => {
    return firstValueFrom(
      TestBed.runInInjectionContext(() => effect()).pipe(toArray())
    );
  };

  const fromSearch = (
    create: ((name: string, filterBy?: string) => BaseItem) | null,
    isSeeded = false
  ) => {
    actions$ = of(TestActions.addItemFromSearch());
    return emitted(
      createItemListEffects({
        actions: TestActions,
        select: selectTestList,
        create,
        ...(isSeeded && { defaults: selectTestDefaults }),
      }).addItemFromSearch$
    );
  };

  describe('addItemFromSearch$', () => {
    it('builds the item from the search query and the armed filter', async () => {
      setup({ searchQuery: 'Bread', filterBy: 'bakery' });

      expect(await fromSearch(filedUnder)).toEqual([
        TestActions.addItem({
          id: 'new',
          name: 'Bread',
          categoryIds: ['bakery'],
        }),
      ]);
    });

    it('lays the configured defaults over the created item', async () => {
      setup({ searchQuery: 'Bread' });

      expect(
        await fromSearch(
          (name) => ({ id: 'new', name, categoryIds: ['plain'] }),
          true
        )
      ).toEqual([
        TestActions.addItem({
          id: 'new',
          name: 'Bread',
          categoryIds: ['seeded'],
        }),
      ]);
    });

    it('reports the existing row instead of adding a duplicate', async () => {
      setup({ searchQuery: 'Milk', items: [item] });

      expect(await fromSearch((name) => ({ id: 'new', name }))).toEqual([
        TestActions.addItemFailure(item),
      ]);
    });

    it('adds nothing for a list that builds no item from a query', async () => {
      setup({ searchQuery: 'Milk' });

      expect(await fromSearch(null)).toEqual([]);
    });
  });

  describe('addOrUpdateItem$', () => {
    it('updates a row the list already holds', async () => {
      setup({ items: [item] });
      const renamed = { ...item, name: 'Oat milk' };
      actions$ = of(TestActions.addOrUpdateItem(renamed));

      expect(await emitted(effectsFor(false).addOrUpdateItem$)).toEqual([
        TestActions.updateItem(renamed),
      ]);
    });

    it('adds a row the list does not hold', async () => {
      setup();
      actions$ = of(TestActions.addOrUpdateItem(item));

      expect(await emitted(effectsFor(false).addOrUpdateItem$)).toEqual([
        TestActions.addItem(item),
      ]);
    });
  });

  it('syncSearchOnRename$ drops a query the renamed row no longer matches', async () => {
    setup({ searchQuery: 'Milk' });
    actions$ = of(TestActions.updateItem({ ...item, name: 'Bread' }));

    expect(await emitted(effectsFor(false).syncSearchOnRename$)).toEqual([
      TestActions.updateSearch(undefined),
    ]);
  });

  it('addItemFailure$ toasts a duplicate-name notice', async () => {
    setup();
    actions$ = of(TestActions.addItemFailure(item));

    expect(await emitted(effectsFor(false).addItemFailure$)).toEqual([
      NotificationsActions.toast({
        key: 'toast.add.item.failure',
        parameters: { name: 'Milk' },
        color: 'medium',
      }),
    ]);
  });

  it('clearSearchAfter empties the search after each trigger and nothing else', async () => {
    setup();
    actions$ = of(
      TestActions.addItem(item),
      TestActions.updateItem(item),
      TestActions.updateFilter('bakery')
    );

    expect(
      await emitted(
        clearSearchAfter(TestActions.updateSearch, [
          TestActions.addItem,
          TestActions.updateFilter,
        ])
      )
    ).toEqual([TestActions.updateSearch(''), TestActions.updateSearch('')]);
  });
});
