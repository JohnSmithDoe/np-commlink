import { describe, expect, it } from 'vitest';
import { ITrackingItem } from '../../../@shared/types';
import { dialogsActions } from './dialogs.actions';
import { dialogsReducer, initialSettings } from './dialogs.reducer';

const track = (over: Partial<ITrackingItem> = {}): ITrackingItem => ({
  id: '1',
  name: 'Task',
  createdAt: '2026-01-01',
  state: 'stopped',
  ...over,
});

describe('dialogsReducer', () => {
  it('opens the edit dialog with a copy of the item in update mode', () => {
    const item = track({ id: 'a', name: 'Edit me' });
    const state = dialogsReducer(
      initialSettings,
      dialogsActions.showEditDialog(item)
    );

    expect(state.isEditing).toBe(true);
    expect(state.editMode).toBe('update');
    expect(state.item).toEqual(item);
    expect(state.item).not.toBe(item); // stored as a copy
    expect(state.dialogTitle).toBeTruthy();
    expect(state.saveButtonText).toBeTruthy();
  });

  it('patches the edited item, and no-ops when nothing is being edited', () => {
    const open = dialogsReducer(
      initialSettings,
      dialogsActions.showEditDialog(track({ name: 'Old' }))
    );
    const patched = dialogsReducer(
      open,
      dialogsActions.updateItem({ name: 'New' })
    );
    expect(patched.item?.name).toBe('New');

    const untouched = dialogsReducer(
      initialSettings,
      dialogsActions.updateItem({ name: 'New' })
    );
    expect(untouched).toBe(initialSettings);
  });

  it('closes the dialog on hide, confirm and abort', () => {
    const open = dialogsReducer(
      initialSettings,
      dialogsActions.showEditDialog(track())
    );
    expect(dialogsReducer(open, dialogsActions.hideDialog()).isEditing).toBe(
      false
    );
    expect(
      dialogsReducer(open, dialogsActions.confirmChanges()).isEditing
    ).toBe(false);
    expect(dialogsReducer(open, dialogsActions.abortChanges()).isEditing).toBe(
      false
    );
  });
});
