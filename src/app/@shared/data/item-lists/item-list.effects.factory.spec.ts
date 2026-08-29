import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action, createActionGroup, createFeatureSelector } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of, toArray } from 'rxjs';
import { BaseItem } from '../../model/base-item.types';
import { ItemList } from '../../model/item-list.types';
import { UndoActions } from '../undo/undo.actions';
import { createItemListActionEvents } from './item-list.actions.factory';
import { createItemListEffects } from './item-list.effects.factory';

const TestActions = createActionGroup({
  source: 'Test',
  events: createItemListActionEvents<BaseItem>(),
});

const selectTestList = createFeatureSelector<ItemList<BaseItem>>('test-list');

const item: BaseItem = { id: 'a', name: 'Milk' };

const TEST_LIST_ID = '_test-list';

const effectsFor = (undoable: boolean) =>
  createItemListEffects({
    actions: TestActions,
    select: selectTestList,
    create: (name: string) => ({ id: 'new', name }),
    ...(undoable
      ? {
          undoableDelete: {
            scope: TEST_LIST_ID,
            removeItem: TestActions.removeItem,
          },
        }
      : {}),
  });

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
