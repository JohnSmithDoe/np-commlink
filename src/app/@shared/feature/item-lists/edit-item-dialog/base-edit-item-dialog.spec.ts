import {
  computed,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EmojiRecentsFacade } from '../../../data/emoji/emoji-recents.facade';
import { createBaseItem } from '../../../util/app.factory';
import { ItemDialogService } from '../../../util/item-lists/item-dialog.service';
import { mockBaseItem, mockCategory } from '../../../testing/test-data';
import {
  BaseCategoryEditItemDialog,
  BaseEditItemDialog,
} from './base-edit-item-dialog';
import { IBaseItem } from '../../../model/base-item.types';
import {
  ICategory,
  ICategoryList,
  TCategoryId,
} from '../../../model/category.types';
import {
  addToCatalog,
  removeFromCatalog,
  renameInCatalog,
} from '../../../util/categories/category-list.utils';

// A minimal concrete wrapper, so the base's behaviour is asserted ONCE here
// instead of being re-tested in all six domain wrappers. It supplies only what
// the base declares abstract — the name schema is the BASE's now, which is what
// makes asserting it here cover the six real dialogs instead of a copy of them.
class TestDialog extends BaseEditItemDialog<IBaseItem> {
  protected readonly listId = '_storage' as const;
  readonly siblings = signal<IBaseItem[]>([]);
  readonly saved: IBaseItem[] = [];

  protected save(item: IBaseItem): void {
    this.saved.push(item);
  }

  protected blank(): IBaseItem {
    return createBaseItem('');
  }

  // The name is bound through `form.name` in the template; a spec drives it the
  // same way the control would.
  setName(name: string): void {
    this.form.name().value.set(name);
  }
}

describe('BaseEditItemDialog', () => {
  let host: ItemDialogService;
  let dialog: TestDialog;

  beforeEach(() => {
    TestBed.configureTestingModule({
      // The base reports used emoji on confirm. Stubbed rather than driven
      // through a mock store: what this class owns is *which glyphs it reports*,
      // and the action they become is the facade's own contract.
      providers: [
        provideZonelessChangeDetection(),
        { provide: EmojiRecentsFacade, useValue: { remember: vi.fn() } },
      ],
    });
    host = TestBed.inject(ItemDialogService);
    dialog = TestBed.runInInjectionContext(() => new TestDialog());
  });

  // Open, rename, confirm — and hand back the recents spy to assert against.
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

  // The invariant that makes the linkedSignal draft correct: `open()` copies the
  // item, so reopening the SAME object still produces a fresh reference and the
  // draft recomputes. Without the copy an abandoned draft would come back.
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

  // Recents are recorded from the SAVED name rather than from the picker tap,
  // which is what spares all six wrappers a pass-through output.
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

    // An invalid draft never reaches `save`, so it must not reach the recents
    // either — a name that was rejected was not used.
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

  // The whole point of the Signal Forms conversion: the shell reads `canSave`
  // instead of reaching into the name input for validity, so a rule the SCHEMA
  // carries is what disables saving.
  describe('canSave', () => {
    it('refuses a blank name', () => {
      host.open({
        item: mockBaseItem({ id: 'x', name: 'Milk' }),
        listId: '_storage',
        editMode: 'update',
      });
      expect(dialog.canSave()).toBe(true);

      // Whitespace-only, which is exactly what `requireText` exists to catch —
      // the built-in `required()` counts it as present while `save` would trim it
      // to nothing.
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

      // Its own name is not a duplicate of itself — the rule excludes by id,
      // which is what lets a capitalization-only rename save.
      dialog.setName('milk');
      expect(dialog.canSave()).toBe(true);
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
      // Still open: a rejected confirm must not look like a successful save.
      expect(host.request()).not.toBeNull();
    });
  });
});

// The real wrappers route these three hooks to a domain facade, i.e. to a
// reducer. Here they apply the very catalog helpers those reducers apply, so the
// draft is asserted against the catalog a merge actually produces rather than
// against a mock's idea of one.
class TestCategoryDialog extends BaseCategoryEditItemDialog<IBaseItem> {
  protected readonly listId = '_storage' as const;
  readonly siblings = signal<IBaseItem[]>([]);
  readonly catalog = signal<ICategoryList>({ items: [] });
  readonly categories = computed(() => this.catalog().items);
  readonly saved: IBaseItem[] = [];

  protected save(item: IBaseItem): void {
    this.saved.push(item);
  }

  protected blank(): IBaseItem {
    return createBaseItem('');
  }

  protected addCategoryToCatalog(category: ICategory): void {
    this.catalog.update((catalog) => addToCatalog(catalog, category));
  }

  protected removeCategoryFromCatalog(categoryId: TCategoryId): void {
    this.catalog.update((catalog) => removeFromCatalog(catalog, categoryId));
  }

  protected renameCategoryInCatalog(id: TCategoryId, to: string): void {
    this.catalog.update((catalog) => renameInCatalog(catalog, id, to).catalog);
  }
}

describe('BaseCategoryEditItemDialog', () => {
  let host: ItemDialogService;
  let dialog: TestCategoryDialog;

  beforeEach(() => {
    TestBed.configureTestingModule({
      // The base reports used emoji on confirm. Stubbed rather than driven
      // through a mock store: what this class owns is *which glyphs it reports*,
      // and the action they become is the facade's own contract.
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

  const openWith = (categoryIds: TCategoryId[]) =>
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

  // Renaming ONTO an existing name merges: the reducer drops the renamed entry
  // and remaps every stored row onto the survivor. A draft still holding the
  // retired id puts it straight back on save, leaving the item pointing at a
  // category the catalog no longer has — invisible, and unreachable by the
  // cascades, which only clean up ids the catalog still knows.
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
