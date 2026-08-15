import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonList } from '@ionic/angular/standalone';
import { IonDragEvent } from '../../../model/app.types';
import { getByTestId, queryByTestId } from '../../../testing/dom';
import { COMMON_TEST_PROVIDERS } from '../../../testing/test-providers';
import { mockBaseItem, mockCategory } from '../../../testing/test-data';
import { ListItemComponent } from './list-item.component';

const dragEvent = (amount: number): IonDragEvent =>
  ({ detail: { amount, ratio: 0 } }) as unknown as IonDragEvent;

const settle = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 0));

describe('ListItemComponent', () => {
  let fixture: ComponentFixture<ListItemComponent>;
  let component: ListItemComponent;
  let ionList: IonList;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListItemComponent],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();
    fixture = TestBed.createComponent(ListItemComponent);
    component = fixture.componentInstance;
    ionList = {
      closeSlidingItems: vi.fn().mockResolvedValue(undefined),
    } as unknown as IonList;
    fixture.componentRef.setInput('item', mockBaseItem({ name: 'Bread' }));
    fixture.componentRef.setInput('title', '2 x Bread');
    fixture.componentRef.setInput('ionList', ionList);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders the title and category note', () => {
    fixture.componentRef.setInput(
      'item',
      mockBaseItem({ categoryIds: ['c-bakery'] })
    );
    fixture.componentRef.setInput('categories', [
      mockCategory({ id: 'c-bakery', name: 'Bakery' }),
    ]);
    fixture.detectChanges();

    expect(getByTestId(fixture, 'list-row-title').textContent).toContain(
      '2 x Bread'
    );
    expect(getByTestId(fixture, 'list-row-category').textContent).toBe(
      'Bakery'
    );
  });

  it('renders no category note when the catalog resolves none of the ids', () => {
    fixture.componentRef.setInput(
      'item',
      mockBaseItem({ categoryIds: ['c-x'] })
    );
    fixture.detectChanges();

    expect(queryByTestId(fixture, 'list-row-category')).toBeNull();
  });

  it('marks the label as bought when crossedOut is true', () => {
    fixture.componentRef.setInput('crossedOut', true);
    fixture.detectChanges();

    const label = getByTestId(fixture, 'list-row-label');
    expect(label.classList.contains('bought')).toBe(true);
  });

  it('emits increment/decrement and stops propagation', () => {
    fixture.componentRef.setInput('showQuantityActions', true);
    fixture.detectChanges();

    const incremented: unknown[] = [];
    const decremented: unknown[] = [];
    component.increment.subscribe(() => incremented.push(true));
    component.decrement.subscribe(() => decremented.push(true));

    const stopA = vi.fn();
    const stopB = vi.fn();
    component.incrementQuantity({
      stopPropagation: stopA,
    } as unknown as MouseEvent);
    component.decrementQuantity({
      stopPropagation: stopB,
    } as unknown as MouseEvent);

    expect(incremented).toHaveLength(1);
    expect(decremented).toHaveLength(1);
    expect(stopA).toHaveBeenCalledTimes(1);
    expect(stopB).toHaveBeenCalledTimes(1);
  });

  it('emits selectItem when ion-item is clicked', () => {
    fixture.detectChanges();
    const selected: unknown[] = [];
    component.selectItem.subscribe(() => selected.push(true));

    getByTestId(fixture, 'list-row-select').click();

    expect(selected).toHaveLength(1);
  });

  it('emits delete and closes sliding items', async () => {
    const deleted: unknown[] = [];
    component.deleteItem.subscribe(() => deleted.push(true));

    await component.emitDeleteItem();

    expect(ionList.closeSlidingItems).toHaveBeenCalledTimes(1);
    expect(deleted).toHaveLength(1);
  });

  it('emits cart and closes sliding items', async () => {
    const carted: unknown[] = [];
    component.startSwipe.subscribe(() => carted.push(true));

    await component.emitStartSwipe();

    expect(ionList.closeSlidingItems).toHaveBeenCalledTimes(1);
    expect(carted).toHaveLength(1);
  });

  it('routes end drag to delete', async () => {
    const deleted: unknown[] = [];
    component.deleteItem.subscribe(() => deleted.push(true));

    component.onSwipe(dragEvent(200));

    await vi.waitFor(() => expect(deleted).toHaveLength(1));
  });

  it('routes start drag to cart only once the host has named the action', async () => {
    const carted: unknown[] = [];
    component.startSwipe.subscribe(() => carted.push(true));

    component.onSwipe(dragEvent(-200));
    await settle();
    expect(carted).toHaveLength(0);

    fixture.componentRef.setInput('startSwipeAction', {
      labelKey: 'household.a11y.buy-item',
      icon: 'cart',
    });
    component.onSwipe(dragEvent(-200));
    await vi.waitFor(() => expect(carted).toHaveLength(1));
  });

  it('shows a status bar when a status color is set', () => {
    fixture.componentRef.setInput('statusColor', 'warning');
    fixture.detectChanges();

    expect(queryByTestId(fixture, 'list-row-status')).not.toBeNull();
  });

  it('renders a leading icon only once the host names one', () => {
    fixture.detectChanges();
    const slotted = (): { name?: string } | null =>
      fixture.nativeElement.querySelector('ion-icon[slot="start"]');
    expect(slotted()).toBeNull();

    fixture.componentRef.setInput('leadingIcon', 'play-circle');
    fixture.detectChanges();

    expect(slotted()?.name).toBe('play-circle');
  });

  it('hides the delete option when the row forbids deletion', () => {
    fixture.detectChanges();
    const endOptions = () =>
      fixture.nativeElement.querySelector('ion-item-options[side="end"]');
    expect(endOptions()).not.toBeNull();

    fixture.componentRef.setInput('canDelete', false);
    fixture.detectChanges();

    expect(endOptions()).toBeNull();
  });

  it('disables the row on request', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    expect(getByTestId(fixture, 'list-row-select')['disabled']).toBe(true);
  });
});
