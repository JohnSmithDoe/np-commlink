import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { NavController } from '@ionic/angular/standalone';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { HouseholdListId } from '../../model/household-list.types';
import { HouseholdListPageFacade } from './household-list-page.facade';
import { selectActiveHouseholdListId } from './household-list.selector';

describe('HouseholdListPageFacade list switching', () => {
  let store: MockStore;
  let navigateRoot: MockInstance<NavController['navigateRoot']>;

  const facadeOn = (listId: HouseholdListId): HouseholdListPageFacade => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideMockStore(),
        {
          provide: NavController,
          useValue: { navigateRoot: vi.fn() } as Partial<NavController>,
        },
      ],
    });
    store = TestBed.inject(MockStore);
    store.overrideSelector(selectActiveHouseholdListId, listId);
    store.refreshState();
    navigateRoot = vi.spyOn(TestBed.inject(NavController), 'navigateRoot');
    return TestBed.inject(HouseholdListPageFacade);
  };

  afterEach(() => store.resetSelectors());

  it('navigates to the target list as a root swap, unanimated and unstacked', () => {
    facadeOn('_shopping').switchList('_storage');

    expect(navigateRoot).toHaveBeenCalledWith('/household/storage', {
      animated: false,
      replaceUrl: true,
    });
  });

  it('does not navigate to the list already being viewed', () => {
    facadeOn('_storage').switchList('_storage');

    expect(navigateRoot).not.toHaveBeenCalled();
  });
});
