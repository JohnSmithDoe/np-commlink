import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import {
  mockShoppingItem,
  mockShoppingState,
} from '../../../@shared/testing/test-data';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { ShoppingActions } from '../../../shopping/data/shopping.actions';
import { ShoppingActionSheetComponent } from './shopping-action-sheet.component';

describe('ShoppingActionSheetComponent', () => {
  let fixture: ComponentFixture<ShoppingActionSheetComponent>;
  let component: ShoppingActionSheetComponent;
  let store: MockStore;
  let dispatch: ReturnType<typeof vi.spyOn>;

  async function setup(providers = provideTestingProviders()) {
    await TestBed.configureTestingModule({
      imports: [ShoppingActionSheetComponent],
      providers: [...providers],
    }).compileComponents();
    fixture = TestBed.createComponent(ShoppingActionSheetComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(MockStore);
    dispatch = vi.spyOn(store, 'dispatch');
  }

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  it('shows only share + cancel buttons when there are no bought items', async () => {
    await setup();
    expect(component.actionSheetButtons()).toHaveLength(2);
  });

  it('adds the move button when a bought item exists', async () => {
    await setup(
      provideTestingProviders({
        shopping: mockShoppingState({
          items: [mockShoppingItem({ state: 'bought' })],
        }),
      })
    );
    expect(component.actionSheetButtons()).toHaveLength(3);
  });

  it('dispatches shareShoppinglist and hideActionSheet for the share action', async () => {
    await setup();
    component.triggerAction(
      new CustomEvent('', { detail: { data: { action: 'share' } } })
    );
    expect(dispatch).toHaveBeenCalledWith(ShoppingActions.shareShoppinglist());
    expect(dispatch).toHaveBeenCalledWith(ShoppingActions.hideActionSheet());
  });

  it('dispatches moveToStorage and hideActionSheet for the move action', async () => {
    await setup();
    component.triggerAction(
      new CustomEvent('', { detail: { data: { action: 'move' } } })
    );
    expect(dispatch).toHaveBeenCalledWith(ShoppingActions.moveToStorage());
    expect(dispatch).toHaveBeenCalledWith(ShoppingActions.hideActionSheet());
  });

  it('dispatches only hideActionSheet for the cancel action', async () => {
    await setup();
    component.triggerAction(
      new CustomEvent('', { detail: { data: { action: 'cancel' } } })
    );
    expect(dispatch).toHaveBeenCalledWith(ShoppingActions.hideActionSheet());
    expect(dispatch).not.toHaveBeenCalledWith(
      ShoppingActions.shareShoppinglist()
    );
    expect(dispatch).not.toHaveBeenCalledWith(ShoppingActions.moveToStorage());
  });
});
