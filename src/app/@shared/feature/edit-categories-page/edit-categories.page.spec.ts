import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { COMMON_TEST_PROVIDERS } from '../../testing/test-providers';
import {
  CATEGORIES_FACADE,
  ICategoriesPageFacade,
} from '../../util/categories/categories-page.facade';
import { EditCategoriesPage } from './edit-categories.page';

type Entry = { category: { id: string; name: string }; count: number };

function setup(cats: Entry[] = []) {
  const add = vi.fn();
  const rename = vi.fn();
  const remove = vi.fn();
  const drillTo = vi.fn();
  const facade: ICategoriesPageFacade = {
    listTitleKey: signal('grocery.page-title.shopping'),
    listHref: signal('/shopping/_shopping'),
    categories: signal(cats),
    add,
    rename,
    remove,
    drillTo,
  };
  TestBed.configureTestingModule({
    imports: [EditCategoriesPage],
    providers: [
      ...COMMON_TEST_PROVIDERS,
      { provide: CATEGORIES_FACADE, useValue: facade },
    ],
  });
  const page = TestBed.createComponent(EditCategoriesPage).componentInstance;
  return { page, facade: { add, rename, remove, drillTo } };
}

const entry = (id: string, name: string, count = 0): Entry => ({
  category: { id, name },
  count,
});

describe('EditCategoriesPage', () => {
  it('should create', () => {
    expect(setup().page).toBeTruthy();
  });

  describe('canAdd', () => {
    it('is false for an empty / whitespace name', () => {
      const { page } = setup();
      expect(page.canAdd()).toBe(false);
      page.newCategory.set(' '.repeat(3));
      expect(page.canAdd()).toBe(false);
    });

    it('is true for a fresh name', () => {
      const { page } = setup([entry('1', 'Obst')]);
      page.newCategory.set('Gemüse');
      expect(page.canAdd()).toBe(true);
    });

    it('is false for a duplicate name (case-insensitive, trimmed)', () => {
      const { page } = setup([entry('1', 'Obst')]);
      page.newCategory.set('  obst ');
      expect(page.canAdd()).toBe(false);
    });
  });

  describe('add', () => {
    it('adds the trimmed name and clears the input', () => {
      const { page, facade } = setup();
      page.newCategory.set('  Gemüse ');
      page.add();
      expect(facade.add).toHaveBeenCalledWith('Gemüse');
      expect(page.newCategory()).toBe('');
    });

    it('is a no-op when the name is not addable', () => {
      const { page, facade } = setup([entry('1', 'Obst')]);
      page.newCategory.set('obst');
      page.add();
      expect(facade.add).not.toHaveBeenCalled();
    });
  });

  describe('drill', () => {
    it('drills to the category when not editing', () => {
      const { page, facade } = setup([entry('1', 'Obst')]);
      page.drill('1');
      expect(facade.drillTo).toHaveBeenCalledWith('1');
    });

    it('does not drill while a row is being renamed', () => {
      const { page, facade } = setup([entry('1', 'Obst')]);
      page.startEdit('1', 'Obst');
      page.drill('1');
      expect(facade.drillTo).not.toHaveBeenCalled();
    });
  });

  describe('rename', () => {
    it('commits a trimmed rename and clears the editing state', () => {
      const { page, facade } = setup([entry('1', 'Obst')]);
      page.startEdit('1', 'Obst');
      page.renameText.set('  Frisches Obst ');
      page.commitEdit();
      expect(facade.rename).toHaveBeenCalledWith('1', 'Frisches Obst');
      expect(page.editing()).toBeNull();
    });

    it('does not rename to an empty string', () => {
      const { page, facade } = setup([entry('1', 'Obst')]);
      page.startEdit('1', 'Obst');
      page.renameText.set(' '.repeat(3));
      page.commitEdit();
      expect(facade.rename).not.toHaveBeenCalled();
      expect(page.editing()).toBeNull();
    });

    it('cancel clears the editing state without renaming', () => {
      const { page, facade } = setup([entry('1', 'Obst')]);
      page.startEdit('1', 'Obst');
      page.cancelEdit();
      expect(facade.rename).not.toHaveBeenCalled();
      expect(page.editing()).toBeNull();
    });
  });

  describe('remove', () => {
    it('removes the category', () => {
      const { page, facade } = setup([entry('1', 'Obst')]);
      page.remove('1');
      expect(facade.remove).toHaveBeenCalledWith('1');
    });

    it('exits the rename editor when deleting the row being renamed', () => {
      const { page } = setup([entry('1', 'Obst')]);
      page.startEdit('1', 'Obst');
      page.remove('1');
      expect(page.editing()).toBeNull();
    });
  });
});
