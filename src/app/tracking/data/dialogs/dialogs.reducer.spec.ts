import { ITrackingItem } from '../../../@shared/types';
import { DialogsActions } from './dialogs.actions';
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
      DialogsActions.showEditDialog(item)
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
      DialogsActions.showEditDialog(track({ name: 'Old' }))
    );
    const patched = dialogsReducer(
      open,
      DialogsActions.updateItem({ name: 'New' })
    );
    expect(patched.item?.name).toBe('New');

    const untouched = dialogsReducer(
      initialSettings,
      DialogsActions.updateItem({ name: 'New' })
    );
    expect(untouched).toBe(initialSettings);
  });

  it('closes the dialog on hide, confirm and abort', () => {
    const open = dialogsReducer(
      initialSettings,
      DialogsActions.showEditDialog(track())
    );
    expect(dialogsReducer(open, DialogsActions.hideDialog()).isEditing).toBe(
      false
    );
    expect(
      dialogsReducer(open, DialogsActions.confirmChanges()).isEditing
    ).toBe(false);
    expect(dialogsReducer(open, DialogsActions.abortChanges()).isEditing).toBe(
      false
    );
  });
});
