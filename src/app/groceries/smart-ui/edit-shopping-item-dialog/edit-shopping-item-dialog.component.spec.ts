import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { COMMON_TEST_PROVIDERS } from '../../../@shared/testing/test-providers';
import { ItemDialogsActions } from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import { EditShoppingItemDialogComponent } from './edit-shopping-item-dialog.component';

describe('EditShoppingItemDialogComponent', () => {
  let fixture: ComponentFixture<EditShoppingItemDialogComponent>;
  let component: EditShoppingItemDialogComponent;
  let store: MockStore;
  let dispatch: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditShoppingItemDialogComponent],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();
    fixture = TestBed.createComponent(EditShoppingItemDialogComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(MockStore);
    dispatch = vi.spyOn(store, 'dispatch');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('dispatches updateItem with the quantity value', () => {
    component.updateQuantity(3);
    expect(dispatch).toHaveBeenCalledWith(
      ItemDialogsActions.updateItem({ quantity: 3 })
    );
  });
});
