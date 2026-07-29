import { ComponentFixture, TestBed } from '@angular/core/testing';
import { getByTestId, queryByTestId } from '../../../testing/dom';
import { COMMON_TEST_PROVIDERS } from '../../../testing/test-providers';
import { TextItemComponent } from './text-item.component';

describe('TextItemComponent', () => {
  let fixture: ComponentFixture<TextItemComponent>;
  let component: TextItemComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextItemComponent],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();
    fixture = TestBed.createComponent(TextItemComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the label in the heading', () => {
    fixture.componentRef.setInput('label', 'My section');
    fixture.detectChanges();

    expect(getByTestId(fixture, 'text-item-label').textContent).toContain(
      'My section'
    );
  });

  it('passes the color through to the ion-item', () => {
    fixture.componentRef.setInput('color', 'storage');
    fixture.detectChanges();

    expect(getByTestId(fixture, 'text-item')['color']).toBe('storage');
  });

  it('renders the note when set', () => {
    fixture.componentRef.setInput('label', 'Label');
    fixture.componentRef.setInput('note', 'A note');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('A note');
  });

  it('renders the helper in a dedicated note when set', () => {
    fixture.componentRef.setInput('label', 'Label');
    fixture.componentRef.setInput('helper', '3 items');
    fixture.detectChanges();

    expect(getByTestId(fixture, 'text-item-helper').textContent).toContain(
      '3 items'
    );
  });

  it('does not render note/helper notes when they are unset', () => {
    fixture.componentRef.setInput('label', 'Label');
    fixture.detectChanges();

    expect(queryByTestId(fixture, 'text-item-helper')).toBeNull();
    expect(queryByTestId(fixture, 'text-item-note')).toBeNull();
  });

  it('emits selectItem from selectCurrent()', () => {
    const emitted: unknown[] = [];
    component.selectItem.subscribe(() => emitted.push(true));

    component.selectCurrent();

    expect(emitted).toHaveLength(1);
  });

  it('emits selectItem when the ion-item is clicked', () => {
    fixture.componentRef.setInput('label', 'Label');
    fixture.detectChanges();
    const emitted: unknown[] = [];
    component.selectItem.subscribe(() => emitted.push(true));

    getByTestId(fixture, 'text-item').click();

    expect(emitted).toHaveLength(1);
  });
});
