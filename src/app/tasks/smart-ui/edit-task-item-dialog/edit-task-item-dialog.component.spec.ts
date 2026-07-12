import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { COMMON_TEST_PROVIDERS } from '../../../@shared/testing/test-providers';
import { ItemDialogsActions } from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import { EditTaskItemDialogComponent } from './edit-task-item-dialog.component';

describe('EditTaskItemDialogComponent', () => {
  let fixture: ComponentFixture<EditTaskItemDialogComponent>;
  let component: EditTaskItemDialogComponent;
  let store: MockStore;
  let dispatch: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditTaskItemDialogComponent],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();
    fixture = TestBed.createComponent(EditTaskItemDialogComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(MockStore);
    dispatch = vi.spyOn(store, 'dispatch');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('dispatches updateItem with the prio value', () => {
    component.updatePrio(2);
    expect(dispatch).toHaveBeenCalledWith(
      ItemDialogsActions.updateItem({ prio: 2 })
    );
  });

  it('dispatches updateItem with the dueAt value', () => {
    component.updateDueAt('2024-06-01');
    expect(dispatch).toHaveBeenCalledWith(
      ItemDialogsActions.updateItem({ dueAt: '2024-06-01' })
    );
  });
});
