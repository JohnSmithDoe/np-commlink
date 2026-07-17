import { TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { COMMON_TEST_PROVIDERS } from '../../../@shared/testing/test-providers';
import { mockTaskItem } from '../../../@shared/testing/test-data';
import { ItemDialogsActions } from '../../../@shared/data/item-dialogs/item-dialogs.actions';
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
    // NOTE: no `detectChanges()` — the template embeds `ListPageComponent`,
    // whose router-based selectors throw against the seeded (router-less) mock
    // state. We test the component's methods directly against a dispatch spy.
    component = TestBed.createComponent(TasksPage).componentInstance;
    store = TestBed.inject(MockStore);
    dispatch = vi.spyOn(store, 'dispatch');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('dispatches enterPage on ionViewWillEnter', () => {
    component.ionViewWillEnter();
    expect(dispatch).toHaveBeenCalledWith(TasksActions.enterPage());
  });

  it('dispatches removeItem with the item', () => {
    const item = mockTaskItem();
    component.removeItem(item);
    expect(dispatch).toHaveBeenCalledWith(TasksActions.removeItem(item));
  });

  it('dispatches showEditDialog scoped to the tasks list', () => {
    const item = mockTaskItem();
    component.showEditDialog(item);
    expect(dispatch).toHaveBeenCalledWith(
      ItemDialogsActions.showEditDialog(item, '_tasks')
    );
  });

  it('dispatches a toggling updateSort for the given sort type', () => {
    component.setSortMode('name');
    expect(dispatch).toHaveBeenCalledWith(
      TasksActions.updateSort('name', 'toggle')
    );
  });
});
