import { TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { COMMON_TEST_PROVIDERS } from '../../../@shared/testing/test-providers';
import { mockTaskItem } from '../../testing/tasks.test-data';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import { TasksActions } from '../../data';
import { TasksPage } from './tasks.page';

describe('TasksPage', () => {
  let component: TasksPage;
  let store: MockStore;
  let dispatch: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TasksPage],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();
    component = TestBed.createComponent(TasksPage).componentInstance;
    store = TestBed.inject(MockStore);
    dispatch = vi.spyOn(store, 'dispatch');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('dispatches removeItem with the item', () => {
    const item = mockTaskItem();
    component.removeItem(item);
    expect(dispatch).toHaveBeenCalledWith(TasksActions.removeItem(item));
  });

  it('opens the edit dialog scoped to the tasks list', () => {
    const item = mockTaskItem();
    component.showEditDialog(item);
    expect(TestBed.inject(ItemDialogService).request()).toEqual({
      item,
      listId: '_tasks',
      editMode: 'update',
    });
  });

  it('dispatches a toggling updateSort for the given sort type', () => {
    component.setSortMode('name');
    expect(dispatch).toHaveBeenCalledWith(
      TasksActions.updateSort('name', 'toggle')
    );
  });
});
