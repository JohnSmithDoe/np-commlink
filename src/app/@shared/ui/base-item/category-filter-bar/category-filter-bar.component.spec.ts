import { ComponentFixture, TestBed } from '@angular/core/testing';
import { COMMON_TEST_PROVIDERS } from '../../../testing/test-providers';
import { CategoryFilterBarComponent } from './category-filter-bar.component';

describe('CategoryFilterBarComponent', () => {
  let fixture: ComponentFixture<CategoryFilterBarComponent>;
  let component: CategoryFilterBarComponent;
  let selected: string[];
  let cleared: number;

  const arm = (id: string | undefined) =>
    fixture.componentRef.setInput('active', id);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryFilterBarComponent],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryFilterBarComponent);
    component = fixture.componentInstance;
    selected = [];
    cleared = 0;
    component.selectCategory.subscribe((id) => selected.push(id));
    component.clearFilter.subscribe(() => (cleared += 1));
    fixture.componentRef.setInput('catalog', [
      { id: 'cat-1', name: 'Dairy' },
      { id: 'cat-2', name: 'Frozen' },
    ]);
  });

  it('marks only the armed category as active', () => {
    arm('cat-1');

    expect(component.isActive('cat-1')).toBe(true);
    expect(component.isActive('cat-2')).toBe(false);
  });

  it('arms an inactive category', () => {
    arm(undefined);

    component.toggle('cat-1');

    expect(selected).toEqual(['cat-1']);
    expect(cleared).toBe(0);
  });

  it('clears rather than re-arming when the active category is tapped', () => {
    arm('cat-1');

    component.toggle('cat-1');

    expect(cleared).toBe(1);
    expect(selected).toEqual([]);
  });
});
