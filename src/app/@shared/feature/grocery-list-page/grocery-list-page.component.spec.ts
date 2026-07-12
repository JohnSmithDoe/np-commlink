import { ComponentFixture, TestBed } from '@angular/core/testing';
import { COMMON_TEST_PROVIDERS } from '../../../@shared/testing/test-providers';
import { GroceryListPageComponent } from './grocery-list-page.component';

describe('GroceryListPageComponent', () => {
  let fixture: ComponentFixture<GroceryListPageComponent<any>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroceryListPageComponent],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();
    fixture = TestBed.createComponent(GroceryListPageComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
