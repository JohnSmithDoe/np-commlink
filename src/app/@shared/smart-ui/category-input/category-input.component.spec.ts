import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { COMMON_TEST_PROVIDERS } from '../../../@shared/testing/test-providers';
import {
  CategoriesActions,
  ItemDialogsActions,
} from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import { CategoryInputComponent } from './category-input.component';

describe('CategoryInputComponent', () => {
  let fixture: ComponentFixture<CategoryInputComponent>;
  let component: CategoryInputComponent;
  let store: MockStore;
  let dispatch: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryInputComponent],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();
    fixture = TestBed.createComponent(CategoryInputComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(MockStore);
    dispatch = vi.spyOn(store, 'dispatch');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders a chip per category', () => {
    component.categories = ['Dairy', 'Fresh'];
    fixture.detectChanges();

    const chips = fixture.nativeElement.querySelectorAll('ion-chip');
    expect(chips).toHaveLength(2);
    expect(fixture.nativeElement.textContent).toContain('Dairy');
    expect(fixture.nativeElement.textContent).toContain('Fresh');
  });

  it('dispatches showDialog when opening the category dialog', () => {
    component.showCategoryDialog();
    expect(dispatch).toHaveBeenCalledWith(CategoriesActions.showDialog());
  });

  it('dispatches removeCategory with the category', () => {
    component.removeCategory('Dairy');
    expect(dispatch).toHaveBeenCalledWith(
      ItemDialogsActions.removeCategory('Dairy')
    );
  });
});
