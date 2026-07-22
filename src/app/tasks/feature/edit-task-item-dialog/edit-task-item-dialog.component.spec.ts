import { TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { COMMON_TEST_PROVIDERS } from '../../../@shared/testing/test-providers';
import { mockCategory } from '../../../@shared/testing/test-data';
import { ItemDialogsActions } from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import { createTaskItem } from '../../util/task.factory';
import { selectEditTaskItem, TasksActions } from '../../data';
import { EditTaskItemDialogComponent } from './edit-task-item-dialog.component';

describe('EditTaskItemDialogComponent', () => {
  let component: EditTaskItemDialogComponent;
  let store: MockStore;
  let dispatch: ReturnType<typeof vi.spyOn>;

  const seed = createTaskItem('Buy stamps', [], 1);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditTaskItemDialogComponent],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();
    store = TestBed.inject(MockStore);
    store.overrideSelector(selectEditTaskItem, seed);
    store.refreshState();
    dispatch = vi.spyOn(store, 'dispatch');
    component = TestBed.createComponent(
      EditTaskItemDialogComponent
    ).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('edits the local draft without dispatching per keystroke', () => {
    component.updatePrio(3);
    component.updateDueAt('2024-06-01');
    component.updateName('Post letters');

    expect(component.draft()?.prio).toBe(3);
    expect(component.draft()?.dueAt).toBe('2024-06-01');
    expect(component.draft()?.name).toBe('Post letters');
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('saves the draft and hides the dialog on confirm', () => {
    component.updatePrio(5);
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      TasksActions.addOrUpdateItem({ ...seed, prio: 5 })
    );
    expect(dispatch).toHaveBeenCalledWith(ItemDialogsActions.hideDialog());
  });

  it('persists a brand-new category to the tasks slice', () => {
    const errands = mockCategory({ id: 'errands', name: 'Errands' });
    component.addCategory(errands);
    expect(dispatch).toHaveBeenCalledWith(TasksActions.addCategory(errands));
  });
});
