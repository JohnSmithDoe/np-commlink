import { ComponentFixture, TestBed } from '@angular/core/testing';
import { getByTestId } from '../../../testing/dom';
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

    getByTestId(fixture, 'list-toolbar-sort-az').click();

    expect(emitted).toEqual(['name']);
  });
});
