import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MockStore } from '@ngrx/store/testing';
import { mockCategory } from '../../@shared/testing/test-data';
import { provideTestingProviders } from '../../@shared/testing/test-providers';
import { ItemDialogService } from '../../@shared/util/item-dialog.service';
import { ITasksState } from '../model/task.types';
import { mockTaskItem, mockTasksState } from '../testing/tasks.test-data';
import { TasksActions } from './actions/tasks.actions';
import { TasksListPageFacade } from './tasks-list-page.facade';

describe('TasksListPageFacade', () => {
  let facade: TasksListPageFacade;
  let dispatch: ReturnType<typeof vi.spyOn>;
  let navigate: ReturnType<typeof vi.spyOn>;

  const setup = (tasks: Partial<ITasksState> = {}) => {
    TestBed.configureTestingModule({
      providers: [provideTestingProviders({ tasks: mockTasksState(tasks) })],
    });
    dispatch = vi.spyOn(TestBed.inject(MockStore), 'dispatch');
    navigate = vi
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);
    facade = TestBed.inject(TasksListPageFacade);
  };

  it('dispatches a search update', () => {
    setup();

    facade.search('call');

    expect(dispatch).toHaveBeenCalledWith(TasksActions.updateSearch('call'));
  });

  it('maps the list commands onto the tasks slice actions', () => {
    setup();

    facade.setSortMode('name');
    facade.setDisplayMode('categories');
    facade.selectCategory('cat-1');
    facade.deleteCategory('cat-1');
    facade.renameCategory('cat-1', 'Errands');

    expect(dispatch).toHaveBeenCalledWith(
      TasksActions.updateSort('name', 'toggle')
    );
    expect(dispatch).toHaveBeenCalledWith(
      TasksActions.updateMode('categories')
    );
    expect(dispatch).toHaveBeenCalledWith(TasksActions.updateFilter('cat-1'));
    expect(dispatch).toHaveBeenCalledWith(TasksActions.removeCategory('cat-1'));
    expect(dispatch).toHaveBeenCalledWith(
      TasksActions.updateCategory('cat-1', 'Errands')
    );
  });

  // Unconditionally an item, in every mode — `ListPageComponent` is what decides
  // whether its add affordance means "item" or "category".
  it('adds an item from the search term', () => {
    setup({ mode: 'categories', searchQuery: 'Call mum' });

    facade.addItemFromSearch();

    expect(dispatch).toHaveBeenCalledWith(TasksActions.addItemFromSearch());
  });

  it('mints a category from the search term on the category command', () => {
    setup({ mode: 'categories', searchQuery: 'Errands' });

    facade.addCategoryFromSearch();

    expect(dispatch).toHaveBeenCalledWith(
      TasksActions.addCategory({
        id: expect.any(String) as unknown as string,
        name: 'Errands',
      })
    );
  });

  it('mints an id for a category confirmed by the name dialog', () => {
    setup();

    facade.saveCategory('Errands');

    expect(dispatch).toHaveBeenCalledWith(
      TasksActions.addCategory({
        id: expect.any(String) as unknown as string,
        name: 'Errands',
      })
    );
  });

  it('seeds the create dialog with the search term and the active filter', () => {
    setup({ searchQuery: 'Call mum', filterBy: 'cat-1' });

    facade.showCreateDialog();

    const request = TestBed.inject(ItemDialogService).request();
    expect(request?.listId).toBe('_tasks');
    expect(request?.editMode).toBe('create');
    expect(request?.item.name).toBe('Call mum');
    expect(request?.item.categoryIds).toEqual(['cat-1']);
  });

  it('opens the edit dialog scoped to the tasks list', () => {
    setup();
    const item = mockTaskItem();

    facade.showEditDialog(item);

    expect(TestBed.inject(ItemDialogService).request()).toEqual({
      item,
      listId: '_tasks',
      editMode: 'update',
    });
  });

  it('navigates to the tasks catalog', () => {
    setup();

    facade.manageCategories();

    expect(navigate).toHaveBeenCalledWith(['/tasks/categories']);
  });

  it('decorates the catalog with the number of tasks per category', () => {
    setup({
      categories: [
        mockCategory({ id: 'home', name: 'Home' }),
        mockCategory({ id: 'errands', name: 'Errands' }),
      ],
      items: [
        mockTaskItem({ id: 't1', categoryIds: ['home'] }),
        mockTaskItem({ id: 't2', categoryIds: ['home'] }),
        mockTaskItem({ id: 't3' }),
      ],
    });

    expect(facade.categories()).toEqual([
      { category: { id: 'errands', name: 'Errands' }, count: 0 },
      { category: { id: 'home', name: 'Home' }, count: 2 },
    ]);
  });
});
