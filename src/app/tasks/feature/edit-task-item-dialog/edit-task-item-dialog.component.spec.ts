import { TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { mockTaskItem, mockTasksState } from '../../testing/tasks.test-data';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { mockCategory } from '../../../@shared/testing/test-data';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import { createTaskItem } from '../../util/task.factory';
import { TaskCategoriesActions, TasksActions } from '../../data';
import { EditTaskItemDialogComponent } from './edit-task-item-dialog.component';

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object') {
    for (const nested of Object.values(value)) deepFreeze(nested);
  }
  return Object.freeze(value);
};

describe('EditTaskItemDialogComponent', () => {
  let component: EditTaskItemDialogComponent;
  let store: MockStore;
  let dispatch: ReturnType<typeof vi.spyOn>;
  let host: ItemDialogService;

  const seed = createTaskItem('Buy stamps', [], 1);
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

  it('drops the derived date when either input changes', () => {
    component.updateDueAt('2026-08-20');
    expect(component.draft().nextDueAt).toBe('2026-08-20');

    component.updateInterval({ unit: 'week', every: 1 });
    expect(component.draft().nextDueAt).toBe('2026-08-20');

    component.updateDueAt('');
    component.updateInterval({ unit: 'day', weekdays: [1, 2] });
    expect(component.draft().nextDueAt).toBeUndefined();
  });

  it('persists a brand-new category to the tasks slice', () => {
    const errands = mockCategory({ id: 'errands', name: 'Errands' });
    component.addCategory(errands);
    expect(dispatch).toHaveBeenCalledWith(
      TaskCategoriesActions.addItem(errands)
    );
  });
});

describe('EditTaskItemDialogComponent · a closed task', () => {
  const closed = deepFreeze(
    mockTaskItem({
      id: 'closed',
      name: 'Rauchmelder',
      doneAt: '2026-07-26T10:00:00.000Z',
      dueAt: '2026-08-26',
      interval: { unit: 'month', every: 1 },
      closings: [{ on: '2026-06-26', missed: true }, { on: '2026-07-26' }],
    })
  );

  const open = async () => {
    await TestBed.configureTestingModule({
      imports: [EditTaskItemDialogComponent],
      providers: [
        ...provideTestingProviders({
          tasks: mockTasksState({ list: { items: [closed] } }),
        }),
      ],
    }).compileComponents();

    TestBed.inject(ItemDialogService).open({
      item: closed,
      listId: '_tasks',
      editMode: 'update',
    });
    return TestBed.createComponent(EditTaskItemDialogComponent)
      .componentInstance;
  };

  it('builds a form over a frozen task, log and all', async () => {
    const component = await open();
    expect(() => component.form.name()).not.toThrow();
    expect(component.canSave()).toBe(true);
  });

  it('keeps the log the form never carried', async () => {
    const component = await open();
    const store = TestBed.inject(MockStore);
    const dispatched = vi.spyOn(store, 'dispatch');

    expect(component.draft().closings).toBeUndefined();

    component.updatePrio(2);
    component.confirm();

    expect(dispatched).toHaveBeenCalledWith(
      TasksActions.addOrUpdateItem({ ...closed, prio: 2 })
    );
  });
});
