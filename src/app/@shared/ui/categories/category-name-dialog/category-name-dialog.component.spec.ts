import { TestBed } from '@angular/core/testing';
import { InputCustomEvent } from '@ionic/angular/standalone';
import { COMMON_TEST_PROVIDERS } from '../../../testing/test-providers';
import { CategoryNameDialogComponent } from './category-name-dialog.component';

const typed = (value: string) =>
  ({ detail: { value } }) as unknown as InputCustomEvent;

describe('CategoryNameDialogComponent', () => {
  let fixture: ReturnType<
    typeof TestBed.createComponent<CategoryNameDialogComponent>
  >;
  let component: CategoryNameDialogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryNameDialogComponent],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();
    fixture = TestBed.createComponent(CategoryNameDialogComponent);
    component = fixture.componentInstance;
  });

  it('seeds the draft from the incoming name', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('name', 'Dairy');

    expect(component.draft()).toBe('Dairy');
  });

  it('keeps typing local and emits only the confirmed name', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('name', 'Dairy');
    const confirmed: string[] = [];
    component.confirmed.subscribe((name) => confirmed.push(name));

    component.updateName(typed('Fridge'));
    expect(confirmed).toEqual([]);

    component.confirm();
    expect(confirmed).toEqual(['Fridge']);
  });

  // Reopening resets the draft, so a cancelled edit can't leak into the next one.
  it('discards uncommitted text when it reopens', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('name', 'Dairy');
    component.updateName(typed('typo'));

    fixture.componentRef.setInput('isOpen', false);
    fixture.componentRef.setInput('isOpen', true);

    expect(component.draft()).toBe('Dairy');
  });
});
