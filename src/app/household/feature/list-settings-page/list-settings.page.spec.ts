import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import {
  mockHouseholdState,
  mockListSettings,
} from '../../testing/household.test-data';
import { ListSettingsActions } from '../../data';
import { ListSettingsPage } from './list-settings.page';

describe('ListSettingsPage', () => {
  let fixture: ComponentFixture<ListSettingsPage>;
  let component: ListSettingsPage;
  let store: MockStore;
  let dispatch: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListSettingsPage],
      providers: [
        ...provideTestingProviders({
          household: mockHouseholdState({
            listSettings: mockListSettings({ showQuickAdd: true }),
          }),
        }),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ListSettingsPage);
    component = fixture.componentInstance;
    store = TestBed.inject(MockStore);
    dispatch = vi.spyOn(store, 'dispatch');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exposes the seeded settings via the settings signal', () => {
    expect(component.settings().showQuickAdd).toBe(true);
  });

  it('renders a toggle per setting flag', () => {
    fixture.detectChanges();
    const toggles = fixture.nativeElement.querySelectorAll(
      '[data-testid^="list-settings-flag-"]'
    );
    expect(toggles.length).toBe(8);
  });

  it('dispatches toggleFlag with the given flag', () => {
    component.toggleFlag('showQuickAdd');
    expect(dispatch).toHaveBeenCalledWith(
      ListSettingsActions.toggleFlag('showQuickAdd')
    );
  });
});
