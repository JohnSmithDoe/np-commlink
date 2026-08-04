/* ─── why ─────────────────────────────────────────────────────────
 * The other four dialogs are thin — a `patch` per field — and are spec'd
 * as such. This one carries the folder's only real class logic: the
 * ingredient list is a nested array inside the draft, so every edit is a
 * read-modify-write through `patch`, and `ingredientRows` resolves each
 * line's `productId` against the catalog with the id itself as the
 * fallback. That fallback is the interesting case, because a recipe
 * outlives the product it references.
 *
 * `open()` seeds the recipes slice as well as the dialog request, and has
 * to: `RecipesFacade.saveItem` decides add-vs-update by looking the id up
 * in state, so a recipe the store has never seen saves as a new one.
 * ───────────────────────────────────────────────────────────────── */

import { TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { SelectCustomEvent } from '@ionic/angular/standalone';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import { RECIPES_LIST_ID } from '../../model/recipe.types';
import {
  mockHouseholdCategoryList,
  mockHouseholdState,
  mockProduct,
  mockProductsState,
  mockRecipe,
  mockRecipeIngredient,
  mockRecipesState,
} from '../../testing/household.test-data';
import { RecipesActions } from '../../data';
import { EditRecipeDialogComponent } from './edit-recipe-dialog.component';

const milk = mockProduct({ id: 'p-milk', name: 'Milk' });
const flour = mockProduct({ id: 'p-flour', name: 'Flour' });

const selectEvent = (value: string) =>
  ({ detail: { value } }) as SelectCustomEvent<string>;

const line = (id: string, productId: string) =>
  mockRecipeIngredient({ id, productId });

describe('EditRecipeDialogComponent', () => {
  let component: EditRecipeDialogComponent;
  let store: MockStore;
  let dispatch: ReturnType<typeof vi.spyOn>;
  let host: ItemDialogService;

  const open = async (recipe = mockRecipe({ name: 'Pancakes' })) => {
    await TestBed.configureTestingModule({
      imports: [EditRecipeDialogComponent],
      providers: [
        ...provideTestingProviders({
          household: mockHouseholdState({
            products: mockProductsState({ items: [milk, flour] }),
            categories: mockHouseholdCategoryList(),
            recipes: mockRecipesState({ items: [recipe] }),
          }),
        }),
      ],
    }).compileComponents();
    store = TestBed.inject(MockStore);
    host = TestBed.inject(ItemDialogService);
    host.open({ item: recipe, listId: RECIPES_LIST_ID, editMode: 'update' });
    dispatch = vi.spyOn(store, 'dispatch');
    component = TestBed.createComponent(
      EditRecipeDialogComponent
    ).componentInstance;
    return recipe;
  };

  it('adds a picked product as an ingredient line and clears the picker', async () => {
    await open();
    component.pickerValue.set('p-milk');

    component.addIngredient(selectEvent('p-milk'));

    expect(component.draft().ingredients).toHaveLength(1);
    expect(component.draft().ingredients[0].productId).toBe('p-milk');
    expect(component.pickerValue()).toBeNull();
  });

  it('ignores a pick that names no product in the catalog', async () => {
    await open();

    component.addIngredient(selectEvent('p-gone'));

    expect(component.draft().ingredients).toEqual([]);
    expect(component.pickerValue()).toBeNull();
  });

  it('patches one line and leaves its siblings alone', async () => {
    const a = line('l-milk', milk.id);
    const b = line('l-flour', flour.id);
    await open(mockRecipe({ ingredients: [a, b] }));

    component.setIngredientAmount(b.id, 250);

    const [first, second] = component.draft().ingredients;
    expect(first).toEqual(a);
    expect(second.amount).toBe(250);
    expect(second.productId).toBe(flour.id);
  });

  it('removes a line by its own id, not by its product', async () => {
    const a = line('l-milk', milk.id);
    const b = line('l-flour', flour.id);
    await open(mockRecipe({ ingredients: [a, b] }));

    component.removeIngredient(a.id);

    expect(component.draft().ingredients.map(({ id }) => id)).toEqual([b.id]);
  });

  it('names each row from the catalog, falling back to the raw product id', async () => {
    const known = line('l-milk', milk.id);
    const orphan = line('l-gone', 'p-deleted');
    await open(mockRecipe({ ingredients: [known, orphan] }));

    expect(component.ingredientRows().map((row) => row.name)).toEqual([
      'Milk',
      'p-deleted',
    ]);
  });

  it('edits the draft without dispatching per keystroke', async () => {
    await open();

    component.setServings(4);
    component.setPrepMinutes(25);

    expect(component.draft().servings).toBe(4);
    expect(component.draft().prepMinutes).toBe(25);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('saves the whole draft on confirm and closes the dialog', async () => {
    const recipe = await open();
    component.setServings(6);

    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      RecipesActions.updateItem({ ...recipe, servings: 6 })
    );
    expect(host.request()).toBeNull();
  });
});
