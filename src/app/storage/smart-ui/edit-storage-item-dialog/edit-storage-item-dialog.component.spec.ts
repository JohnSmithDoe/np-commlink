import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { COMMON_TEST_PROVIDERS } from '../../../@shared/testing/test-providers';
import { ItemDialogsActions } from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import { EditStorageItemDialogComponent } from './edit-storage-item-dialog.component';

describe('EditStorageItemDialogComponent', () => {
  let fixture: ComponentFixture<EditStorageItemDialogComponent>;
  let component: EditStorageItemDialogComponent;
  let store: MockStore;
  let dispatch: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditStorageItemDialogComponent],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();
    fixture = TestBed.createComponent(EditStorageItemDialogComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(MockStore);
    dispatch = vi.spyOn(store, 'dispatch');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('dispatches updateItem with the bestBefore value', () => {
    component.updateBestBefore('2024-12-31');
    expect(dispatch).toHaveBeenCalledWith(
      ItemDialogsActions.updateItem({ bestBefore: '2024-12-31' })
    );
  });

  it('dispatches updateItem with the minAmount value', () => {
    component.updateMinAmount(5);
    expect(dispatch).toHaveBeenCalledWith(
      ItemDialogsActions.updateItem({ minAmount: 5 })
    );
  });
});
