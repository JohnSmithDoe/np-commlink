import { ComponentFixture, TestBed } from '@angular/core/testing';
import { COMMON_TEST_PROVIDERS } from '../../../../../testing/test-providers';
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

    const h2 = fixture.nativeElement.querySelector('h2');
    expect(h2.textContent).toContain('My section');
  });

  it('passes the color through to the ion-item', () => {
    fixture.componentRef.setInput('color', 'storage');
    fixture.detectChanges();

    const item = fixture.nativeElement.querySelector('ion-item');
    expect(item.color).toBe('storage');
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

    const helper = fixture.nativeElement.querySelector('.text-item-helper');
    expect(helper).not.toBeNull();
    expect(helper.textContent).toContain('3 items');
  });

  it('does not render note/helper notes when they are unset', () => {
    fixture.componentRef.setInput('label', 'Label');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.text-item-helper')).toBeNull();
    // The only ion-note in the template is the inline note, which is @if-guarded.
    expect(fixture.nativeElement.querySelector('ion-note')).toBeNull();
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

    fixture.nativeElement.querySelector('ion-item').click();

    expect(emitted).toHaveLength(1);
  });
});
