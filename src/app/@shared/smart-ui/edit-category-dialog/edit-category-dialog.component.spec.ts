import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InputCustomEvent } from '@ionic/angular';
import { MockStore } from '@ngrx/store/testing';
import { COMMON_TEST_PROVIDERS } from '../../../@shared/testing/test-providers';
import { CategoriesActions } from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import { EditCategoryDialogComponent } from './edit-category-dialog.component';

describe('EditCategoryDialogComponent', () => {
  let fixture: ComponentFixture<EditCategoryDialogComponent>;
  let component: EditCategoryDialogComponent;
  let store: MockStore;
  let dispatch: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditCategoryDialogComponent],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();
    fixture = TestBed.createComponent(EditCategoryDialogComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(MockStore);
    dispatch = vi.spyOn(store, 'dispatch');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('dispatches updateCategory with the input value', () => {
    component.updateCategory({ detail: { value: 'New' } } as InputCustomEvent);
    expect(dispatch).toHaveBeenCalledWith(
      CategoriesActions.updateCategory('New')
    );
  });

  it('dispatches updateCategory with empty string when value is missing', () => {
    component.updateCategory({ detail: { value: null } } as InputCustomEvent);
    expect(dispatch).toHaveBeenCalledWith(CategoriesActions.updateCategory(''));
  });

  it('dispatches confirmEditChanges when submitting', () => {
    component.submitChanges();
    expect(dispatch).toHaveBeenCalledWith(
      CategoriesActions.confirmEditChanges()
    );
  });

  it('dispatches abortEditChanges when cancelling', () => {
    component.cancelChanges();
    expect(dispatch).toHaveBeenCalledWith(CategoriesActions.abortEditChanges());
  });

  it('dispatches abortEditChanges when the dialog is closed', () => {
    component.closedDialog();
    expect(dispatch).toHaveBeenCalledWith(CategoriesActions.abortEditChanges());
  });
});
