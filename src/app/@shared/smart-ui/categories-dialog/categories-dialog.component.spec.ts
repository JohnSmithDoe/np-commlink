import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CheckboxCustomEvent } from '@ionic/angular';
import { MockStore } from '@ngrx/store/testing';
import {
  mockCategoriesState,
  mockItemDialogsState,
} from '../../../@shared/testing/test-data';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { CategoriesActions } from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import { CategoriesDialogComponent } from './categories-dialog.component';

describe('CategoriesDialogComponent', () => {
  let fixture: ComponentFixture<CategoriesDialogComponent>;
  let component: CategoriesDialogComponent;
  let store: MockStore;
  let dispatch: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriesDialogComponent],
      providers: [
        ...provideTestingProviders({
          itemDialogs: mockItemDialogsState({
            category: mockCategoriesState({ selection: ['Dairy'] }),
          }),
        }),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CategoriesDialogComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(MockStore);
    dispatch = vi.spyOn(store, 'dispatch');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('dispatches updateSearchQuery with the input value', () => {
    component.searchbarInput({ target: { value: 'Dai' } });
    expect(dispatch).toHaveBeenCalledWith(
      CategoriesActions.updateSearchQuery('Dai')
    );
  });

  it('dispatches toggleCategory with the checkbox value', () => {
    component.selectionChange({
      detail: { value: 'Dairy' },
    } as CheckboxCustomEvent);
    expect(dispatch).toHaveBeenCalledWith(
      CategoriesActions.toggleCategory('Dairy')
    );
  });

  it('dispatches addCategoryFromDialogSearch when adding a new category', () => {
    component.addNewCategory();
    expect(dispatch).toHaveBeenCalledWith(
      CategoriesActions.addCategoryFromDialogSearch()
    );
  });

  it('dispatches abortChanges when cancelling', () => {
    component.cancelChanges();
    expect(dispatch).toHaveBeenCalledWith(CategoriesActions.abortChanges());
  });

  it('dispatches abortChanges when the dialog is closed', () => {
    component.closedDialog();
    expect(dispatch).toHaveBeenCalledWith(CategoriesActions.abortChanges());
  });

  it('dispatches confirmChanges when confirming', () => {
    component.confirmChanges();
    expect(dispatch).toHaveBeenCalledWith(CategoriesActions.confirmChanges());
  });

  it('isChecked reflects the seeded selection', () => {
    expect(component.isChecked('Dairy')).toBe(true);
    expect(component.isChecked('Fresh')).toBe(false);
  });
});
