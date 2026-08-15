import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SegmentCustomEvent } from '@ionic/angular/standalone';
import { mockRouterState } from '../../../@shared/testing/test-data';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { HouseholdListPageFacade } from '../../data';
import { HouseholdListId } from '../../model/household-list.types';
import { HouseholdListSwitcherComponent } from './household-list-switcher.component';

async function setup(listId: HouseholdListId = '_shopping') {
  await TestBed.configureTestingModule({
    imports: [HouseholdListSwitcherComponent],
    providers: provideTestingProviders({
      router: mockRouterState({ parameters: { listId } }),
    }),
  }).compileComponents();
  const fixture: ComponentFixture<HouseholdListSwitcherComponent> =
    TestBed.createComponent(HouseholdListSwitcherComponent);
  return { fixture, component: fixture.componentInstance };
}

const changedTo = (value: unknown) =>
  ({ detail: { value } }) as SegmentCustomEvent;

describe('HouseholdListSwitcherComponent', () => {
  it('reads the selected list off the route rather than off its own state', async () => {
    const { component } = await setup('_storage');

    expect(component.facade.activeListId()).toBe('_storage');
  });

  it('switches to the list the segment reports', async () => {
    const { component } = await setup('_shopping');
    const switchList = vi
      .spyOn(TestBed.inject(HouseholdListPageFacade), 'switchList')
      .mockImplementation(() => {});

    component.switchList(changedTo('_storage'));

    expect(switchList).toHaveBeenCalledWith('_storage');
  });

  it('ignores a value that is not a household list', async () => {
    const { component } = await setup();
    const switchList = vi
      .spyOn(TestBed.inject(HouseholdListPageFacade), 'switchList')
      .mockImplementation(() => {});

    component.switchList(changedTo('_recipes'));
    component.switchList(changedTo(undefined));

    expect(switchList).not.toHaveBeenCalled();
  });

  it('renders one button per list, the active one selected', async () => {
    const { fixture } = await setup('_products');
    fixture.detectChanges();

    const buttons =
      fixture.nativeElement.querySelectorAll('ion-segment-button');
    expect(buttons).toHaveLength(3);
    expect(fixture.nativeElement.querySelector('ion-segment').value).toBe(
      '_products'
    );
  });
});
