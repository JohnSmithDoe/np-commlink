import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectCustomEvent } from '@ionic/angular';
import { MockStore } from '@ngrx/store/testing';
import { COMMON_TEST_PROVIDERS } from '../../../@shared/testing/test-providers';
import { ItemDialogsActions } from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import { EditProductDialogComponent } from './edit-product-dialog.component';

describe('EditProductDialogComponent', () => {
  let fixture: ComponentFixture<EditProductDialogComponent>;
  let component: EditProductDialogComponent;
  let store: MockStore;
  let dispatch: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditProductDialogComponent],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();
    fixture = TestBed.createComponent(EditProductDialogComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(MockStore);
    dispatch = vi.spyOn(store, 'dispatch');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('dispatches updateItem with timespan and a default timevalue for a finite timespan', () => {
    component.setBestBeforeTimespan({
      detail: { value: 'days' },
    } as SelectCustomEvent);
    expect(dispatch).toHaveBeenCalledWith(
      ItemDialogsActions.updateItem({
        bestBeforeTimespan: 'days',
        bestBeforeTimevalue: 1,
      })
    );
  });

  it('dispatches updateItem with undefined timevalue when timespan is forever', () => {
    component.setBestBeforeTimespan({
      detail: { value: 'forever' },
    } as SelectCustomEvent);
    expect(dispatch).toHaveBeenCalledWith(
      ItemDialogsActions.updateItem({
        bestBeforeTimespan: 'forever',
        bestBeforeTimevalue: undefined,
      })
    );
  });

  it('dispatches updateItem with the timevalue', () => {
    component.setBestBeforeTimevalue(7);
    expect(dispatch).toHaveBeenCalledWith(
      ItemDialogsActions.updateItem({ bestBeforeTimevalue: 7 })
    );
  });
});
