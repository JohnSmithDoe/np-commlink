import { ComponentFixture, TestBed } from '@angular/core/testing';
import { COMMON_TEST_PROVIDERS } from '../../../testing/test-providers';
import { ItemListEmptyComponent } from './item-list-empty.component';

describe('ItemListEmptyComponent', () => {
  let fixture: ComponentFixture<ItemListEmptyComponent>;
  let component: ItemListEmptyComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemListEmptyComponent],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();
    fixture = TestBed.createComponent(ItemListEmptyComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the "is empty" message for an empty, non-searching list', () => {
    fixture.componentRef.setInput('isEmptyList', true);
    fixture.componentRef.setInput('isSearching', false);
    fixture.detectChanges();

    const textItem = fixture.nativeElement.querySelector('app-text-item');
    expect(textItem).toBeTruthy();
    // The TranslatePipe has no translations loaded, so keys pass through.
    expect(fixture.nativeElement.textContent).toContain(
      'item-list.empty.isempty'
    );
    expect(fixture.nativeElement.textContent).not.toContain(
      'item-list.empty.notfound'
    );
  });

  it('shows the "not found" message when searching', () => {
    fixture.componentRef.setInput('isEmptyList', true);
    fixture.componentRef.setInput('isSearching', true);
    fixture.componentRef.setInput('searchTerm', 'milk');
    fixture.detectChanges();

    const textItem = fixture.nativeElement.querySelector('app-text-item');
    expect(textItem).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain(
      'item-list.empty.notfound'
    );
  });

  it('renders nothing when the list is not empty', () => {
    fixture.componentRef.setInput('isEmptyList', false);
    fixture.componentRef.setInput('isSearching', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-text-item')).toBeNull();
  });
});
