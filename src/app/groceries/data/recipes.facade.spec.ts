import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ItemDialogService } from '../../@shared/util/item-dialog.service';
import { IRecipeMatch, RECIPES_LIST_ID } from '../model/recipe.types';
import { mockRecipe } from '../testing/groceries.test-data';
import { RecipesActions } from './actions/recipes.actions';
import { RecipesFacade } from './recipes.facade';
import {
  selectRecipeIngredientCatalog,
  selectRecipeMatches,
  selectRecipes,
} from './selectors/recipes.selector';

const match = (missing: string[]): IRecipeMatch =>
  ({ recipe: mockRecipe(), missing }) as unknown as IRecipeMatch;

describe('RecipesFacade', () => {
  let store: MockStore;
  let facade: RecipesFacade;

  const setup = (matches: IRecipeMatch[] = [], recipes = [mockRecipe()]) => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideMockStore()],
    });
    store = TestBed.inject(MockStore);
    store.overrideSelector(selectRecipeMatches, matches);
    store.overrideSelector(selectRecipes, recipes);
    store.overrideSelector(selectRecipeIngredientCatalog, []);
    store.refreshState();
    facade = TestBed.inject(RecipesFacade);
  };

  afterEach(() => store.resetSelectors());

  describe('cookableCount', () => {
    it('counts only the recipes missing nothing', () => {
      setup([match([]), match(['Milk']), match([])]);
      expect(facade.cookableCount()).toBe(2);
    });

    it('is zero without recipes', () => {
      setup([]);
      expect(facade.cookableCount()).toBe(0);
    });
  });

  describe('the dialog commands', () => {
    it('seeds a create dialog with a blank recipe on the recipes list', () => {
      setup();
      facade.showCreateDialog();

      const request = TestBed.inject(ItemDialogService).request();
      expect(request?.editMode).toBe('create');
      expect(request?.listId).toBe(RECIPES_LIST_ID);
      expect(request?.item.name).toBe('');
    });

    it('opens an edit dialog on the recipe it was handed', () => {
      setup();
      const recipe = mockRecipe({ id: 'recipe-9', name: 'Waffles' });

      facade.showEditDialog(recipe);

      const request = TestBed.inject(ItemDialogService).request();
      expect(request?.editMode).toBe('update');
      expect(request?.listId).toBe(RECIPES_LIST_ID);
      expect(request?.item.name).toBe('Waffles');
    });
  });

  // Add-vs-update is resolved synchronously off the list signal rather than by
  // an action round-trip, so the branch is the facade's own behaviour to pin.
  describe('saveRecipe', () => {
    it('updates a recipe the book already holds', () => {
      const known = mockRecipe({ id: 'recipe-1' });
      setup([], [known]);
      const dispatch = vi.spyOn(store, 'dispatch');

      facade.saveRecipe(known);

      expect(dispatch).toHaveBeenCalledWith(RecipesActions.updateItem(known));
    });

    it('adds one it has never seen', () => {
      setup([], [mockRecipe({ id: 'recipe-1' })]);
      const fresh = mockRecipe({ id: 'recipe-2', name: 'Waffles' });
      const dispatch = vi.spyOn(store, 'dispatch');

      facade.saveRecipe(fresh);

      expect(dispatch).toHaveBeenCalledWith(RecipesActions.addItem(fresh));
    });
  });

  it('removes a recipe', () => {
    setup();
    const recipe = mockRecipe();
    const dispatch = vi.spyOn(store, 'dispatch');

    facade.removeRecipe(recipe);

    expect(dispatch).toHaveBeenCalledWith(RecipesActions.removeItem(recipe));
  });
});
