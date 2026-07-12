import { ComponentFixture, TestBed } from '@angular/core/testing';
import { COMMON_TEST_PROVIDERS } from '../../../../@shared/testing/test-providers';
import { ItemListToolbarComponent } from './item-list-toolbar.component';

describe('ItemListToolbarComponent', () => {
  let fixture: ComponentFixture<ItemListToolbarComponent>;
  let component: ItemListToolbarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemListToolbarComponent],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();
    fixture = TestBed.createComponent(ItemListToolbarComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('coerces the showReorder input via booleanAttribute', () => {
    // setInput applies the booleanAttribute transform (an empty attribute
    // string means "present" -> true); a direct assignment would not.
    fixture.componentRef.setInput('showReorder', '');
    fixture.detectChanges();
    expect(component.showReorder()).toBe(true);
  });

  it('emits the selected display mode', () => {
    const emitted: string[] = [];
    component.selectDisplayMode.subscribe((v) => emitted.push(v));

    component.selectDisplayMode.emit('categories');

    expect(emitted).toEqual(['categories']);
  });

  it('emits the selected sort mode', () => {
    const emitted: string[] = [];
    component.selectSortMode.subscribe((v) => emitted.push(v));

    component.selectSortMode.emit('name');

    expect(emitted).toEqual(['name']);
  });

  it('emits toggleReorder', () => {
    const emitted: void[] = [];
    component.toggleReorder.subscribe((v) => emitted.push(v));

    component.toggleReorder.emit();

    expect(emitted).toHaveLength(1);
  });

  it('emits a sort mode when the A-Z button is clicked', () => {
    fixture.detectChanges();
    const emitted: string[] = [];
    component.selectSortMode.subscribe((v) => emitted.push(v));

    const buttons: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('ion-button')
    );
    const azButton = buttons.find((b) => b.textContent?.includes('A-Z'));
    azButton?.click();

    expect(emitted).toEqual(['name']);
  });
});
