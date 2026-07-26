import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonList } from '@ionic/angular/standalone';
import { TIonDragEvent } from '../../../model/app.types';
import { COMMON_TEST_PROVIDERS } from '../../../testing/test-providers';
import { mockBaseItem, mockCategory } from '../../../testing/test-data';
import { ListItemComponent } from './list-item.component';

const dragEvent = (amount: number): TIonDragEvent =>
  ({ detail: { amount, ratio: 0 } }) as unknown as TIonDragEvent;

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
    // the list's catalog resolves the item's category id → 'Bakery'
    fixture.componentRef.setInput('categories', [
      mockCategory({ id: 'c-bakery', name: 'Bakery' }),
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h2').textContent).toContain(
      '2 x Bread'
    );
    const note = fixture.nativeElement.querySelector('ion-note');
    expect(note.textContent).toBe('Bakery');
    expect(note.style.display).toBe('block');
  });

  it('marks the label as bought when crossedOut is true', () => {
    fixture.componentRef.setInput('crossedOut', true);
    fixture.detectChanges();

    const label = fixture.nativeElement.querySelector('ion-label');
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

    fixture.nativeElement.querySelector('ion-item').click();

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
    component.cartItem.subscribe(() => carted.push(true));

    await component.emitCartItem();

    expect(ionList.closeSlidingItems).toHaveBeenCalledTimes(1);
    expect(carted).toHaveLength(1);
  });

  it('routes end drag to delete', async () => {
    const deleted: unknown[] = [];
    component.deleteItem.subscribe(() => deleted.push(true));

    await component.deleteOrCartOnSwipe(dragEvent(200));

    expect(deleted).toHaveLength(1);
  });

  it('routes start drag to cart only when enabled', async () => {
    const carted: unknown[] = [];
    component.cartItem.subscribe(() => carted.push(true));

    await component.deleteOrCartOnSwipe(dragEvent(-200));
    expect(carted).toHaveLength(0);

    fixture.componentRef.setInput('showCartAction', true);
    await component.deleteOrCartOnSwipe(dragEvent(-200));
    expect(carted).toHaveLength(1);
  });

  it('shows a status bar when a status color is set', () => {
    fixture.componentRef.setInput('statusColor', 'warning');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.status-bar')).toBeTruthy();
  });
});
