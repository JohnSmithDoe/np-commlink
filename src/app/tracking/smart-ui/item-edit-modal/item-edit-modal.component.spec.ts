import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { DialogsActions } from '../../data/dialogs/dialogs.actions';
import {
  selectEditItem,
  selectEditState,
} from '../../data/dialogs/dialogs.selector';
import { ItemEditModalComponent } from './item-edit-modal.component';

describe('ItemEditModalComponent', () => {
  let store: MockStore;
  let component: ItemEditModalComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ItemEditModalComponent, TranslateModule.forRoot()],
      providers: [provideZonelessChangeDetection(), provideMockStore()],
    });
    store = TestBed.inject(MockStore);
    store.overrideSelector(selectEditState, {
      isEditing: false,
      item: undefined,
    });
    store.overrideSelector(selectEditItem, undefined);
    component = TestBed.createComponent(
      ItemEditModalComponent
    ).componentInstance;
  });

  it('dispatches the dialog lifecycle actions', () => {
    const dispatch = vi.spyOn(store, 'dispatch');

    component.cancelChanges();
    component.closedDialog();
    component.submitChanges();

    expect(
      dispatch.mock.calls.map((c) => (c[0] as unknown as { type: string }).type)
    ).toEqual([
      DialogsActions.abortChanges.type,
      DialogsActions.hideDialog.type,
      DialogsActions.confirmChanges.type,
    ]);
  });

  it('dispatches a name update', () => {
    const dispatch = vi.spyOn(store, 'dispatch');

    component.updateName('Groceries');

    const action = dispatch.mock.calls[0][0] as unknown as ReturnType<
      typeof DialogsActions.updateItem
    >;
    expect(action.type).toBe(DialogsActions.updateItem.type);
    expect(action.data).toEqual({ name: 'Groceries' });
  });
});
