import { TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { mockTaskItem, mockTasksState } from '../../testing/tasks.test-data';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { mockCategory } from '../../../@shared/testing/test-data';
import { ItemDialogService } from '../../../@shared/util/item-lists/item-dialog.service';
import { createTaskItem } from '../../util/task.factory';
import { TaskCategoriesActions, TasksActions } from '../../data';
import { EditTaskItemDialogComponent } from './edit-task-item-dialog.component';

describe('EditTaskItemDialogComponent', () => {
  let component: EditTaskItemDialogComponent;
  let store: MockStore;
  let dispatch: ReturnType<typeof vi.spyOn>;
  let host: ItemDialogService;

  const seed = createTaskItem('Buy stamps', [], 1);
  // A real sibling, so the duplicate-name rule below has something to catch — an
  // `items: []` slice would make that branch unreachable while looking seeded.
  const sibling = mockTaskItem({ id: 'other', name: 'Post letters' });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditTaskItemDialogComponent],
      providers: [
        ...provideTestingProviders({
          tasks: mockTasksState({ list: { items: [sibling, seed] } }),
        }),
      ],
    }).compileComponents();
    store = TestBed.inject(MockStore);
    host = TestBed.inject(ItemDialogService);
    host.open({ item: seed, listId: '_tasks', editMode: 'update' });
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
    component.form.name().value.set('Fetch stamps');

    expect(component.draft().prio).toBe(3);
    expect(component.draft().dueAt).toBe('2024-06-01');
    expect(component.draft().name).toBe('Fetch stamps');
    expect(dispatch).not.toHaveBeenCalled();
  });

  // The rule is the BASE's schema now; which list it compares against is this
  // wrapper's wiring, and that is the half that can silently go wrong (the tasks
  // PAGE's view would drop a sibling its search box is hiding).
  it('refuses a name a sibling task already has', () => {
    expect(component.canSave()).toBe(true);

    component.form.name().value.set('Post letters');

    expect(component.canSave()).toBe(false);
  });

  it('saves the draft and hides the dialog on confirm', () => {
    component.updatePrio(5);
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      TasksActions.addOrUpdateItem({ ...seed, prio: 5 })
    );
    expect(host.request()).toBeNull();
  });

  it('persists a brand-new category to the tasks slice', () => {
    const errands = mockCategory({ id: 'errands', name: 'Errands' });
    component.addCategory(errands);
    expect(dispatch).toHaveBeenCalledWith(
      TaskCategoriesActions.addItem(errands)
    );
  });
});
