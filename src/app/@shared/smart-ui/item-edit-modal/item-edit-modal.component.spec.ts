import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { COMMON_TEST_PROVIDERS } from '../../testing/test-providers';
import { ItemDialogsActions } from '../../data/item-dialogs/item-dialogs.actions';
import { ItemEditModalComponent } from './item-edit-modal.component';

describe('ItemEditModalComponent', () => {
  let fixture: ComponentFixture<ItemEditModalComponent>;
  let component: ItemEditModalComponent;
  let store: MockStore;
  let dispatch: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemEditModalComponent],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();
    fixture = TestBed.createComponent(ItemEditModalComponent);
    component = fixture.componentInstance;
    component.listId = '_storage';
    store = TestBed.inject(MockStore);
    dispatch = vi.spyOn(store, 'dispatch');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('dispatches abortChanges when cancelling', () => {
    component.cancelChanges();
    expect(dispatch).toHaveBeenCalledWith(ItemDialogsActions.abortChanges());
  });

  it('dispatches hideDialog when the dialog closes', () => {
    component.closedDialog();
    expect(dispatch).toHaveBeenCalledWith(ItemDialogsActions.hideDialog());
  });

  it('dispatches confirmChanges when submitting', () => {
    component.submitChanges();
    expect(dispatch).toHaveBeenCalledWith(ItemDialogsActions.confirmChanges());
  });

  it('dispatches updateItem with the new name', () => {
    component.updateName('Butter');
    expect(dispatch).toHaveBeenCalledWith(
      ItemDialogsActions.updateItem({ name: 'Butter' })
    );
  });
});
