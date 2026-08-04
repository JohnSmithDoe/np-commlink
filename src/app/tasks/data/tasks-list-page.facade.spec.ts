import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MockStore } from '@ngrx/store/testing';
import { mockCategory } from '../../@shared/testing/test-data';
import { provideTestingProviders } from '../../@shared/testing/test-providers';
import { ItemDialogService } from '../../@shared/data/item-lists/item-dialog.service';
import { mockTaskItem, mockTasksState } from '../testing/tasks.test-data';
import { TaskCategoriesActions, TasksActions } from './tasks.actions';
import { TasksListPageFacade } from './tasks-list-page.facade';

describe('TasksListPageFacade', () => {
  let facade: TasksListPageFacade;
  let dispatch: ReturnType<typeof vi.spyOn>;
  let navigate: ReturnType<typeof vi.spyOn>;

  const setup = (tasks: Parameters<typeof mockTasksState>[0] = {}) => {
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
    setup({
      categoryList: { items: [mockCategory({ id: 'cat-1', name: 'Home' })] },
    });

    facade.setSortMode('name');
    facade.selectCategory('cat-1');
    facade.removeCategory('cat-1');
    facade.renameCategory('cat-1', 'Errands');

    expect(dispatch).toHaveBeenCalledWith(
      TasksActions.updateSort('name', 'toggle')
    );
    expect(dispatch).toHaveBeenCalledWith(TasksActions.updateFilter('cat-1'));
    expect(dispatch).toHaveBeenCalledWith(
      TaskCategoriesActions.removeItem(
        expect.objectContaining({ id: 'cat-1' }) as never
      )
    );
    expect(dispatch).toHaveBeenCalledWith(
      TaskCategoriesActions.updateItem({ id: 'cat-1', name: 'Errands' })
    );
  });

  it('adds an item from the search term', () => {
    setup({ list: { searchQuery: 'Call mum' } });

    facade.addItemFromSearch();

    expect(dispatch).toHaveBeenCalledWith(TasksActions.addItemFromSearch());
  });

  it('seeds the create dialog with the search term and the active filter', () => {
    setup({ list: { searchQuery: 'Call mum', filterBy: 'cat-1' } });

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
});
