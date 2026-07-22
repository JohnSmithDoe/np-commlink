import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import {
  mockAppState,
  mockItemDialogsState,
} from '../../../@shared/testing/test-data';
import { GroceryListActions } from './grocery-list.actions';
import { GroceryCategoriesActions } from './grocery-categories.actions';
import {
  CategoriesActions,
  ItemDialogsActions,
} from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import { GroceryItemDialogsEffects } from './grocery-item-dialogs.effects';

describe('GroceryItemDialogsEffects', () => {
  let actions$: Observable<Action>;
  let effects: GroceryItemDialogsEffects;

  const setup = (state = mockAppState()) => {
    TestBed.configureTestingModule({
      providers: [
        GroceryItemDialogsEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState: state }),
      ],
    });
    effects = TestBed.inject(GroceryItemDialogsEffects);
  };

  it('openEditProduct$ opens the product dialog seeded with the scanned EAN', async () => {
    setup();
    actions$ = of(GroceryListActions.openEditProduct('12345'));
    const action = (await firstValueFrom(
      effects.openEditProduct$
    )) as ReturnType<typeof ItemDialogsActions.showEditDialog>;
    expect(action.type).toBe(ItemDialogsActions.showEditDialog.type);
    expect(action.listId).toBe('_products');
    expect(action.item.name).toBe('12345');
  });

  it('confirmEditCategoryChanges$ renames a category by id in the shared catalog', async () => {
    setup(
      mockAppState({
        itemDialogs: mockItemDialogsState({
          listId: '_storage',
          category: { isEditing: true, id: 'cat-1', name: 'Fridge' },
        }),
      })
    );
    actions$ = of(CategoriesActions.confirmEditChanges());
    expect(await firstValueFrom(effects.confirmEditCategoryChanges$)).toEqual(
      GroceryCategoriesActions.rename('cat-1', 'Fridge')
    );
  });

  it('confirmEditCategoryChanges$ mints a new category when no id is set', async () => {
    setup(
      mockAppState({
        itemDialogs: mockItemDialogsState({
          listId: '_storage',
          category: { isEditing: true, name: 'Fruit' },
        }),
      })
    );
    actions$ = of(CategoriesActions.confirmEditChanges());
    // The minted id is a uuid — assert on the type + name only.
    const action = (await firstValueFrom(
      effects.confirmEditCategoryChanges$
    )) as ReturnType<typeof GroceryCategoriesActions.add>;
    expect(action.type).toBe(GroceryCategoriesActions.add.type);
    expect(action.category.name).toBe('Fruit');
  });

  // Both dialog orchestrators stay registered once both route sets are visited
  // (injectors/effects are not torn down), so the grocery one MUST ignore a
  // tasks dialog — otherwise it routes into actionsByListId('_tasks') → throw.
  it('confirmEditCategoryChanges$ ignores a _tasks dialog (no throw)', () => {
    setup(
      mockAppState({
        itemDialogs: mockItemDialogsState({
          listId: '_tasks',
          category: { isEditing: true, id: 'x', name: 'Y' },
        }),
      })
    );
    actions$ = of(CategoriesActions.confirmEditChanges());
    const out: Action[] = [];
    effects.confirmEditCategoryChanges$.subscribe((a) => out.push(a));
    expect(out).toEqual([]);
  });
});
