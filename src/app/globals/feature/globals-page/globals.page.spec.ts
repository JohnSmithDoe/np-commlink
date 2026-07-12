import { TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { COMMON_TEST_PROVIDERS } from '../../../@shared/testing/test-providers';
import { mockGlobalItem } from '../../../@shared/testing/test-data';
import { ItemDialogsActions } from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import { GlobalsActions } from '../../../globals/data/globals.actions';
import { GlobalsPage } from './globals.page';

describe('GlobalsPage', () => {
  let component: GlobalsPage;
  let store: MockStore;
  let dispatch: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlobalsPage],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();
    // NOTE: no `detectChanges()` — the template embeds `ListPageComponent`,
    // whose router-based selectors throw against the seeded (router-less) mock
    // state. We test the component's methods directly against a dispatch spy.
    component = TestBed.createComponent(GlobalsPage).componentInstance;
    store = TestBed.inject(MockStore);
    dispatch = vi.spyOn(store, 'dispatch');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('dispatches enterPage on ionViewWillEnter', () => {
    component.ionViewWillEnter();
    expect(dispatch).toHaveBeenCalledWith(GlobalsActions.enterPage());
  });

  it('dispatches removeItem with the item', () => {
    const item = mockGlobalItem();
    component.removeItem(item);
    expect(dispatch).toHaveBeenCalledWith(GlobalsActions.removeItem(item));
  });

  it('dispatches showEditDialog scoped to the globals list', () => {
    const item = mockGlobalItem();
    component.showEditDialog(item);
    expect(dispatch).toHaveBeenCalledWith(
      ItemDialogsActions.showEditDialog(item, '_globals')
    );
  });
});
