import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonList } from '@ionic/angular/standalone';
import { TIonDragEvent } from '../../types';
import { COMMON_TEST_PROVIDERS } from '../../testing/test-providers';
import { CategoryItemComponent } from './category-item.component';

/** Build a minimal ion-item-sliding drag event. amount > 160 => 'end'. */
const dragEvent = (amount: number): TIonDragEvent =>
  ({ detail: { amount, ratio: 0 } }) as unknown as TIonDragEvent;

describe('CategoryItemComponent', () => {
  let fixture: ComponentFixture<CategoryItemComponent>;
  let component: CategoryItemComponent;
  let ionList: IonList;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryItemComponent],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();
    fixture = TestBed.createComponent(CategoryItemComponent);
    component = fixture.componentInstance;
    ionList = {
      closeSlidingItems: vi.fn().mockResolvedValue(undefined),
    } as unknown as IonList;
    fixture.componentRef.setInput('category', { id: 'c-dairy', name: 'Dairy' });
    fixture.componentRef.setInput('count', 3);
    fixture.componentRef.setInput('ionList', ionList);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders the category name and count in the heading', () => {
    fixture.componentRef.setInput('category', { id: 'c-dairy', name: 'Dairy' });
    fixture.componentRef.setInput('count', 3);
    fixture.detectChanges();

    const h2 = fixture.nativeElement.querySelector('h2');
    expect(h2.textContent).toContain('Dairy (3)');
  });

  it('emits selectCategory when the ion-item is clicked', () => {
    fixture.detectChanges();
    const emitted: unknown[] = [];
    component.selectCategory.subscribe(() => emitted.push(true));

    fixture.nativeElement.querySelector('ion-item').click();

    expect(emitted).toHaveLength(1);
  });

  describe('emitDeleteItem', () => {
    it('closes sliding items then emits deleteCategory', async () => {
      const emitted: unknown[] = [];
      component.deleteCategory.subscribe(() => emitted.push(true));

      await component.emitDeleteItem();

      expect(ionList.closeSlidingItems).toHaveBeenCalledTimes(1);
      expect(emitted).toHaveLength(1);
    });
  });

  describe('handleItemOptionsOnDrag', () => {
    it('routes a large positive drag (end) to delete', async () => {
      const emitted: unknown[] = [];
      component.deleteCategory.subscribe(() => emitted.push(true));

      await component.handleItemOptionsOnDrag(dragEvent(200));

      expect(emitted).toHaveLength(1);
      expect(ionList.closeSlidingItems).toHaveBeenCalledTimes(1);
    });

    it('does not delete on a large negative drag (start)', async () => {
      const emitted: unknown[] = [];
      component.deleteCategory.subscribe(() => emitted.push(true));

      await component.handleItemOptionsOnDrag(dragEvent(-200));

      expect(emitted).toHaveLength(0);
      expect(ionList.closeSlidingItems).not.toHaveBeenCalled();
    });

    it('does nothing for a small drag below the trigger amount', async () => {
      const emitted: unknown[] = [];
      component.deleteCategory.subscribe(() => emitted.push(true));

      await component.handleItemOptionsOnDrag(dragEvent(0));

      expect(emitted).toHaveLength(0);
      expect(ionList.closeSlidingItems).not.toHaveBeenCalled();
    });
  });
});
