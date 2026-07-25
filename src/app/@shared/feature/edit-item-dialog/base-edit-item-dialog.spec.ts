import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IBaseItem } from '../../model/types';
import { ItemDialogHost } from '../../data/item-dialogs/item-dialog-host';
import { mockBaseItem } from '../../testing/test-data';
import { BaseEditItemDialog } from './base-edit-item-dialog';

// A minimal concrete wrapper, so the base's behaviour is asserted ONCE here
// instead of being re-tested in all five domain wrappers.
class TestDialog extends BaseEditItemDialog<IBaseItem> {
  protected readonly listId = '_storage' as const;
  readonly listItems = signal<IBaseItem[]>([]);
  readonly saved: IBaseItem[] = [];

  protected save(item: IBaseItem): void {
    this.saved.push(item);
  }
}

describe('BaseEditItemDialog', () => {
  let host: ItemDialogHost;
  let dialog: TestDialog;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    host = TestBed.inject(ItemDialogHost);
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

    dialog.updateName('Oat milk');

    expect(dialog.draft()?.name).toBe('Oat milk');
    expect(host.request()?.item.name).toBe('Milk');
  });

  // The invariant that makes the linkedSignal draft correct: `open()` copies the
  // item, so reopening the SAME object still produces a fresh reference and the
  // draft recomputes. Without the copy an abandoned draft would come back.
  it('discards an abandoned draft when the same item is reopened', () => {
    const item = mockBaseItem({ id: 'x', name: 'Milk' });
    host.open({ item, listId: '_storage', editMode: 'update' });
    dialog.updateName('typo');
    dialog.close();

    host.open({ item, listId: '_storage', editMode: 'update' });

    expect(dialog.draft()?.name).toBe('Milk');
  });

  it('saves the draft then closes on confirm', () => {
    host.open({
      item: mockBaseItem({ id: 'x', name: 'Milk' }),
      listId: '_storage',
      editMode: 'update',
    });
    dialog.updateName('Oat milk');

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
});
