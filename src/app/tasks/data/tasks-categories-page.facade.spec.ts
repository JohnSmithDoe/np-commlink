import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MockStore } from '@ngrx/store/testing';
import { mockCategory } from '../../@shared/testing/test-data';
import { provideTestingProviders } from '../../@shared/testing/test-providers';
import { ITasksState } from '../model/task.types';
import { mockTaskItem, mockTasksState } from '../testing/tasks.test-data';
import { TasksActions } from './actions/tasks.actions';
import { TasksCategoriesPageFacade } from './tasks-categories-page.facade';

describe('TasksCategoriesPageFacade', () => {
  let facade: TasksCategoriesPageFacade;
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
    facade = TestBed.inject(TasksCategoriesPageFacade);
  };

  it('mints an id for a newly added category', () => {
    setup();

    facade.add('Errands');

    expect(dispatch).toHaveBeenCalledWith(
      TasksActions.addCategory({
        id: expect.any(String) as unknown as string,
        name: 'Errands',
      })
    );
  });

  it('maps rename and remove onto the tasks slice actions', () => {
    setup();

    facade.rename('cat-1', 'Errands');
    facade.remove('cat-1');

    expect(dispatch).toHaveBeenCalledWith(
      TasksActions.updateCategory('cat-1', 'Errands')
    );
    expect(dispatch).toHaveBeenCalledWith(TasksActions.removeCategory('cat-1'));
  });

  // The drill target and the page's back link must stay the same list, or the
  // category→items affordance lands somewhere the back button never came from.
  it('drills into the list its back link points at, pre-filtered', () => {
    setup();

    facade.drillTo('cat-1');

    expect(navigate).toHaveBeenCalledWith([facade.listHref()], {
      queryParams: { filter: 'cat-1' },
    });
  });

  it('decorates the catalog with the number of tasks per category', () => {
    setup({
      categories: [
        mockCategory({ id: 'home', name: 'Home' }),
        mockCategory({ id: 'errands', name: 'Errands' }),
      ],
      items: [
        mockTaskItem({ id: 't1', categoryIds: ['home'] }),
        mockTaskItem({ id: 't2', categoryIds: ['home', 'errands'] }),
      ],
    });

    expect(facade.categories()).toEqual([
      { category: { id: 'errands', name: 'Errands' }, count: 1 },
      { category: { id: 'home', name: 'Home' }, count: 2 },
    ]);
  });
});
