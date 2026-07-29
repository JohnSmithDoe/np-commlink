import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createBaseItem } from '../../util/app.factory';
import { ItemDialogService } from '../../util/item-dialog.service';
import { mockBaseItem } from '../../testing/test-data';
import { BaseEditItemDialog } from './base-edit-item-dialog';
import { IBaseItem } from '../../model/base-item.types';

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
      providers: [provideZonelessChangeDetection()],
    });
    host = TestBed.inject(ItemDialogService);
    dialog = TestBed.runInInjectionContext(() => new TestDialog());
  });

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
