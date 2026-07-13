import { ComponentFixture, TestBed } from '@angular/core/testing';
import { COMMON_TEST_PROVIDERS } from '../../testing/test-providers';
import { PageHeaderComponent } from './page-header.component';

describe('PageHeaderComponent', () => {
  let fixture: ComponentFixture<PageHeaderComponent>;
  let component: PageHeaderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageHeaderComponent],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();
    fixture = TestBed.createComponent(PageHeaderComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the (translated) label in the ion-title', () => {
    fixture.componentRef.setInput('label', 'page-title.storage');
    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector('.app-brand__name');
    expect(title.textContent).toContain('page-title.storage');
  });

  it('reflects the color onto the ion-toolbar', () => {
    fixture.componentRef.setInput('color', 'storage');
    fixture.detectChanges();

    const toolbar = fixture.nativeElement.querySelector('ion-toolbar');
    expect(toolbar.color).toBe('storage');
  });

  it('shows the add button by default and hides it when hideButtons is set', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('ion-button')).not.toBeNull();

    // OnPush + zoneless: mutate the input through setInput so the view is
    // marked dirty (and the booleanAttribute transform runs).
    fixture.componentRef.setInput('hideButtons', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('ion-button')).toBeNull();
  });

  it('disables the add button when disabled is set', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('ion-button');
    expect(button.disabled).toBe(true);
  });

  it('emits addItem when the add button is clicked', () => {
    fixture.detectChanges();
    const emitted: void[] = [];
    component.addItem.subscribe(() => emitted.push(undefined));

    const button = fixture.nativeElement.querySelector('ion-button');
    button.click();

    expect(emitted).toHaveLength(1);
  });

  it('emits addItem when emit() is called', () => {
    const emitted: void[] = [];
    component.addItem.subscribe(() => emitted.push(undefined));

    component.addItem.emit();

    expect(emitted).toHaveLength(1);
  });
});
