import {
  computed,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EmojiRecentsFacade } from '../../../data/emoji/emoji-recents.facade';
import { createBaseItem } from '../../../util/app.factory';
import { ItemDialogService } from '../../../data/item-lists/item-dialog.service';
import { mockBaseItem, mockCategory } from '../../../testing/test-data';
import {
  BaseCategoryEditItemDialog,
  BaseEditItemDialog,
} from './base-edit-item-dialog';
import { BaseItem } from '../../../model/base-item.types';
import {
  Category,
  CategoryId,
  CategoryList,
} from '../../../model/category.types';
import {
  addToCatalog,
  removeFromCatalog,
  renameInCatalog,
} from '../../../util/categories/category-list.utils';

class TestDialog extends BaseEditItemDialog<BaseItem> {
  protected readonly listId = '_storage' as const;
  readonly siblings = signal<BaseItem[]>([]);
  readonly saved: BaseItem[] = [];

  protected save(item: BaseItem): void {
    this.saved.push(item);
  }

  protected blank(): BaseItem {
    return createBaseItem('');
  }

  setName(name: string): void {
    this.form.name().value.set(name);
  }
}

class TwinTolerantDialog extends TestDialog {
  protected override uniqueName(): boolean {
    return false;
  }
}

describe('BaseEditItemDialog', () => {
  let host: ItemDialogService;
  let dialog: TestDialog;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: EmojiRecentsFacade, useValue: { remember: vi.fn() } },
      ],
    });
    host = TestBed.inject(ItemDialogService);
    dialog = TestBed.runInInjectionContext(() => new TestDialog());
  });

  const confirmName = (name: string) => {
    host.open({
      item: mockBaseItem({ id: 'x', name: 'Milk' }),
      listId: '_storage',
      editMode: 'update',
    });
    dialog.setName(name);
    dialog.confirm();
    return TestBed.inject(EmojiRecentsFacade).remember;
  };

  it('is closed until a request for ITS list arrives', () => {
    expect(dialog.isOpen()).toBe(false);

    host.open({
      item: mockBaseItem(),
      listId: '_shopping',
      editMode: 'update',
    });
    expect(dialog.isOpen()).toBe(false);
    expect(dialog.seedItem()).toBeUndefined();

    host.open({ item: mockBaseItem(), listId: '_storage', editMode: 'update' });
    expect(dialog.isOpen()).toBe(true);
  });

  it('derives both labels from the edit mode', () => {
    host.open({ item: mockBaseItem(), listId: '_storage', editMode: 'create' });
    expect(dialog.dialogTitle()).toBe('edit.item.dialog.title.create');
    expect(dialog.saveButtonText()).toBe('edit.item.dialog.button.create');

    host.open({ item: mockBaseItem(), listId: '_storage', editMode: 'update' });
    expect(dialog.dialogTitle()).toBe('edit.item.dialog.title.update');
    expect(dialog.saveButtonText()).toBe('edit.item.dialog.button.update');
  });

  it('keeps edits on a local draft, leaving the request untouched', () => {
    const item = mockBaseItem({ id: 'x', name: 'Milk' });
    host.open({ item, listId: '_storage', editMode: 'update' });

    dialog.setName('Oat milk');

    expect(dialog.draft().name).toBe('Oat milk');
    expect(host.request()?.item.name).toBe('Milk');
  });

  it('discards an abandoned draft when the same item is reopened', () => {
    const item = mockBaseItem({ id: 'x', name: 'Milk' });
    host.open({ item, listId: '_storage', editMode: 'update' });
    dialog.setName('typo');
    dialog.close();

    host.open({ item, listId: '_storage', editMode: 'update' });

    expect(dialog.draft().name).toBe('Milk');
  });

  it('saves the draft then closes on confirm', () => {
    host.open({
      item: mockBaseItem({ id: 'x', name: 'Milk' }),
      listId: '_storage',
      editMode: 'update',
    });
    dialog.setName('Oat milk');

    dialog.confirm();

    expect(dialog.saved).toHaveLength(1);
    expect(dialog.saved[0].name).toBe('Oat milk');
    expect(host.request()).toBeNull();
  });

  describe('emoji recents', () => {
    it('reports every emoji the saved name carries', () => {
      expect(confirmName('🥛 Hafermilch 🌾')).toHaveBeenCalledWith([
        '🥛',
        '🌾',
      ]);
    });

    it('reports nothing for a name with no emoji', () => {
      expect(confirmName('Hafermilch')).toHaveBeenCalledWith([]);
    });

    it('records nothing when the draft cannot be saved', () => {
      expect(confirmName(' ')).not.toHaveBeenCalled();
    });
  });

  it('closes without saving on close', () => {
    host.open({ item: mockBaseItem(), listId: '_storage', editMode: 'update' });

    dialog.close();

    expect(dialog.saved).toEqual([]);
    expect(host.request()).toBeNull();
  });

  describe('canSave', () => {
    it('refuses a blank name', () => {
      host.open({
        item: mockBaseItem({ id: 'x', name: 'Milk' }),
        listId: '_storage',
        editMode: 'update',
      });
      expect(dialog.canSave()).toBe(true);

      dialog.setName(' '.repeat(3));

      expect(dialog.canSave()).toBe(false);
    });

    it('refuses a name another item in the list already has', () => {
      dialog.siblings.set([
        mockBaseItem({ id: 'other', name: 'Bread' }),
        mockBaseItem({ id: 'x', name: 'Milk' }),
      ]);
      host.open({
        item: mockBaseItem({ id: 'x', name: 'Milk' }),
        listId: '_storage',
        editMode: 'update',
      });

      dialog.setName('Bread');
      expect(dialog.canSave()).toBe(false);

      dialog.setName('milk');
      expect(dialog.canSave()).toBe(true);
    });

    it('accepts a duplicate name when the dialog opts out, but still not a blank one', () => {
      const twinTolerant = TestBed.runInInjectionContext(
        () => new TwinTolerantDialog()
      );
      twinTolerant.siblings.set([mockBaseItem({ id: 'other', name: 'Bread' })]);
      host.open({
        item: mockBaseItem({ id: 'x', name: 'Milk' }),
        listId: '_storage',
        editMode: 'update',
      });

      twinTolerant.setName('Bread');
      expect(twinTolerant.canSave()).toBe(true);

      twinTolerant.setName(' ');
      expect(twinTolerant.canSave()).toBe(false);
    });

    it('does not save an invalid draft on confirm', () => {
      host.open({
        item: mockBaseItem({ id: 'x', name: 'Milk' }),
        listId: '_storage',
        editMode: 'update',
      });
      dialog.setName('');

      dialog.confirm();

      expect(dialog.saved).toEqual([]);
      expect(host.request()).not.toBeNull();
    });
  });
});

class TestCategoryDialog extends BaseCategoryEditItemDialog<BaseItem> {
  protected readonly listId = '_storage' as const;
  readonly siblings = signal<BaseItem[]>([]);
  readonly catalog = signal<CategoryList>({ items: [] });
  readonly categories = computed(() => this.catalog().items);
  readonly saved: BaseItem[] = [];

  protected save(item: BaseItem): void {
    this.saved.push(item);
  }

  protected blank(): BaseItem {
    return createBaseItem('');
  }

  protected addCategoryToCatalog(category: Category): void {
    this.catalog.update((catalog) => addToCatalog(catalog, category));
  }

  protected removeCategoryFromCatalog(categoryId: CategoryId): void {
    this.catalog.update((catalog) => removeFromCatalog(catalog, categoryId));
  }

  protected renameCategoryInCatalog(id: CategoryId, to: string): void {
    this.catalog.update((catalog) => renameInCatalog(catalog, id, to).catalog);
  }
}

describe('BaseCategoryEditItemDialog', () => {
  let host: ItemDialogService;
  let dialog: TestCategoryDialog;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: EmojiRecentsFacade, useValue: { remember: vi.fn() } },
      ],
    });
    host = TestBed.inject(ItemDialogService);
    dialog = TestBed.runInInjectionContext(() => new TestCategoryDialog());
    dialog.catalog.set({
      items: [
        mockCategory({ id: 'obst', name: 'Obst' }),
        mockCategory({ id: 'gemuese', name: 'Gemüse' }),
      ],
    });
  });

  const openWith = (categoryIds: CategoryId[]) =>
    host.open({
      item: mockBaseItem({ id: 'x', name: 'Milch', categoryIds }),
      listId: '_storage',
      editMode: 'update',
    });

  it('leaves the draft alone on a plain rename', () => {
    openWith(['obst']);

    dialog.renameCategory({ id: 'obst', to: 'Früchte' });

    expect(dialog.draft().categoryIds).toEqual(['obst']);
  });

  it('follows the survivor when a rename merges', () => {
    openWith(['obst']);

    dialog.renameCategory({ id: 'obst', to: 'Gemüse' });

    expect(dialog.draft().categoryIds).toEqual(['gemuese']);
    dialog.confirm();
    expect(dialog.saved[0].categoryIds).toEqual(['gemuese']);
  });

  it('does not duplicate the survivor when the draft carried both', () => {
    openWith(['obst', 'gemuese']);

    dialog.renameCategory({ id: 'obst', to: 'Gemüse' });

    expect(dialog.draft().categoryIds).toEqual(['gemuese']);
  });

  it('drops the id from the draft when a category is deleted', () => {
    openWith(['obst', 'gemuese']);

    dialog.deleteCategory('obst');

    expect(dialog.draft().categoryIds).toEqual(['gemuese']);
  });
});
