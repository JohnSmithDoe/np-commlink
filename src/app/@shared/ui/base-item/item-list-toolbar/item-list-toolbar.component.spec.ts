import { ComponentFixture, TestBed } from '@angular/core/testing';
import { COMMON_TEST_PROVIDERS } from '../../../testing/test-providers';
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

  it('emits a sort mode when the A-Z button is clicked', () => {
    fixture.detectChanges();
    const emitted: string[] = [];
    component.selectSortMode.subscribe((v) => emitted.push(v));

    const buttons: HTMLElement[] = [
      ...fixture.nativeElement.querySelectorAll('ion-button'),
    ];
    // The label is now i18n'd; TranslateModule.forRoot() has no loader in tests,
    // so the pipe renders the key ('item-list.toolbar.sort-az').
    const azButton = buttons.find((b) => b.textContent?.includes('sort-az'));
    azButton?.click();

    expect(emitted).toEqual(['name']);
  });
});
