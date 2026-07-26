import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchbarCustomEvent } from '@ionic/angular/standalone';
import { ICategory, TCategoryId } from '../../../model/category.types';
import { mockCategory } from '../../../testing/test-data';
import { COMMON_TEST_PROVIDERS } from '../../../testing/test-providers';
import { CategoriesDialogComponent } from './categories-dialog.component';

const searchbarEvent = (value: string | null) =>
  ({ detail: { value } }) as unknown as SearchbarCustomEvent;

const DAIRY = mockCategory({ id: 'cat-dairy', name: 'Dairy' });
const BAKERY = mockCategory({ id: 'cat-bakery', name: 'Bakery' });

describe('CategoriesDialogComponent', () => {
  let fixture: ComponentFixture<CategoriesDialogComponent>;
  let component: CategoriesDialogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriesDialogComponent],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();
    fixture = TestBed.createComponent(CategoriesDialogComponent);
    component = fixture.componentInstance;
  });

  const open = (
    options: {
      categories?: ICategory[];
      selection?: TCategoryId[];
      multiple?: boolean;
    } = {}
  ) => {
    fixture.componentRef.setInput(
      'categories',
      options.categories ?? [DAIRY, BAKERY]
    );
    fixture.componentRef.setInput('selection', options.selection ?? []);
    fixture.componentRef.setInput('multiple', options.multiple ?? true);
    fixture.componentRef.setInput('isOpen', true);
  };

  const type = (query: string | null) =>
    component.searchbarInput(searchbarEvent(query));

  describe('multi-select', () => {
    it('toggles a tapped row in and out of the pending selection without emitting', () => {
      open({ selection: ['cat-dairy'] });
      const confirmed: TCategoryId[][] = [];
      component.confirmed.subscribe((ids) => confirmed.push(ids));

      component.rowClick(BAKERY);
      expect(component.isChecked(BAKERY)).toBe(true);

      component.rowClick(BAKERY);
      expect(component.isChecked(BAKERY)).toBe(false);
      expect(component.isChecked(DAIRY)).toBe(true);
      expect(confirmed).toEqual([]);
    });

    it('commits the whole pending selection on confirm, newest first', () => {
      open({ selection: ['cat-dairy'] });
      const confirmed: TCategoryId[][] = [];
      component.confirmed.subscribe((ids) => confirmed.push(ids));

      component.rowClick(BAKERY);
      component.confirmMultiple();

      expect(confirmed).toEqual([['cat-bakery', 'cat-dairy']]);
    });

    // The wrapper leaves the picker mounted, so a cancelled edit would otherwise
    // still be sitting there the next time it opens.
    it('discards uncommitted toggles when the picker reopens', () => {
      open({ selection: ['cat-dairy'] });
      component.rowClick(BAKERY);

      fixture.componentRef.setInput('isOpen', false);
      fixture.componentRef.setInput('isOpen', true);

      expect(component.selected()).toEqual(['cat-dairy']);
    });

    it('ignores a row tap while a category is being renamed inline', async () => {
      open();
      await component.startEdit(DAIRY);

      component.rowClick(BAKERY);

      expect(component.selected()).toEqual([]);
    });
  });

  describe('single-select', () => {
    it('picks and confirms in one tap', () => {
      open({ selection: ['cat-dairy'], multiple: false });
      const confirmed: TCategoryId[][] = [];
      component.confirmed.subscribe((ids) => confirmed.push(ids));

      component.rowClick(BAKERY);

      expect(confirmed).toEqual([['cat-bakery']]);
    });
  });

  describe('addNewCategory', () => {
    it('mints a category for a new name and selects the id it just published', () => {
      open();
      const added: ICategory[] = [];
      component.addNew.subscribe((category) => added.push(category));

      type('Frozen');
      component.addNewCategory();

      expect(added).toHaveLength(1);
      expect(added[0].name).toBe('Frozen');
      expect(component.selected()).toEqual([added[0].id]);
      expect(component.searchQuery()).toBe('');
    });

    // Minting a second id for a name the catalog already has would be dropped by
    // the domain's name-dedupe, leaving the item pointing at a category that
    // never gets persisted.
    it('selects the existing category instead of minting a duplicate', () => {
      open();
      const added: ICategory[] = [];
      component.addNew.subscribe((category) => added.push(category));

      type('  dAiRy ');
      component.addNewCategory();

      expect(added).toEqual([]);
      expect(component.selected()).toEqual(['cat-dairy']);
    });

    it('does not select an existing category twice', () => {
      open({ selection: ['cat-dairy'] });
      const added: ICategory[] = [];
      component.addNew.subscribe((category) => added.push(category));

      type('Dairy');
      component.addNewCategory();

      expect(added).toEqual([]);
      expect(component.selected()).toEqual(['cat-dairy']);
    });

    it('does nothing for a blank query', () => {
      open();
      const added: ICategory[] = [];
      const confirmed: TCategoryId[][] = [];
      component.addNew.subscribe((category) => added.push(category));
      component.confirmed.subscribe((ids) => confirmed.push(ids));

      type(' ');
      component.addNewCategory();

      expect(added).toEqual([]);
      expect(confirmed).toEqual([]);
      expect(component.selected()).toEqual([]);
    });

    it('confirms the minted id right away in single-select mode', () => {
      open({ multiple: false });
      const added: ICategory[] = [];
      const confirmed: TCategoryId[][] = [];
      component.addNew.subscribe((category) => added.push(category));
      component.confirmed.subscribe((ids) => confirmed.push(ids));

      type('Frozen');
      component.addNewCategory();

      expect(confirmed).toEqual([[added[0].id]]);
      expect(component.searchQuery()).toBe('');
    });
  });

  describe('search', () => {
    it('filters the catalog by a case-insensitive substring', () => {
      open();

      type('AIR');

      expect(component.filteredCategories()).toEqual([DAIRY]);
    });

    it('offers the create row until the query names a category exactly', () => {
      open();

      type('Dair');
      expect(component.searchContained()).toBe(false);

      type('dairy ');
      expect(component.searchContained()).toBe(true);
    });

    it('restores the full catalog when the searchbar is cleared', () => {
      open();
      type('Dairy');

      type(null);

      expect(component.filteredCategories()).toEqual([DAIRY, BAKERY]);
    });
  });

  describe('inline rename', () => {
    it('opens the editor on the current name and emits the trimmed one', async () => {
      open();
      const renamed: { id: TCategoryId; to: string }[] = [];
      component.renamed.subscribe((rename) => renamed.push(rename));

      await component.startEdit(DAIRY);
      expect(component.renameText()).toBe('Dairy');

      component.renameText.set('  Fridge  ');
      component.commitEdit();

      expect(renamed).toEqual([{ id: 'cat-dairy', to: 'Fridge' }]);
      expect(component.editing()).toBeNull();
    });

    it('drops a blanked rename instead of emitting an empty name', async () => {
      open();
      const renamed: unknown[] = [];
      component.renamed.subscribe((rename) => renamed.push(rename));

      await component.startEdit(DAIRY);
      component.renameText.set(' ');
      component.commitEdit();

      expect(renamed).toEqual([]);
      expect(component.editing()).toBeNull();
    });

    it('emits nothing when the edit is cancelled', async () => {
      open();
      const renamed: unknown[] = [];
      component.renamed.subscribe((rename) => renamed.push(rename));

      await component.startEdit(DAIRY);
      component.renameText.set('Fridge');
      component.cancelEdit();
      // Escape closes the editor, then ion-input's blur still fires commitEdit —
      // with nothing in edit mode it has to stay silent.
      component.commitEdit();

      expect(renamed).toEqual([]);
    });
  });

  it('emits the delete and drops the category from the pending selection', async () => {
    open({ selection: ['cat-dairy', 'cat-bakery'] });
    const deleted: TCategoryId[] = [];
    component.deleted.subscribe((id) => deleted.push(id));

    await component.deleteCategory(DAIRY);

    expect(deleted).toEqual(['cat-dairy']);
    expect(component.selected()).toEqual(['cat-bakery']);
  });
});
