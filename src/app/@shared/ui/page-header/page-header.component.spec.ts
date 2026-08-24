import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { getByTestId, queryByTestId } from '../../testing/dom';
import { COMMON_TEST_PROVIDERS } from '../../testing/test-providers';
import { PROGRAM_ICON } from '../../util/program-icon.token';
import { PageHeaderComponent } from './page-header.component';

const glyphOf = (icon?: string) => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [PageHeaderComponent],
    providers: [
      ...COMMON_TEST_PROVIDERS,
      { provide: PROGRAM_ICON, useValue: signal('wallet-outline') },
    ],
  });
  const header = TestBed.createComponent(PageHeaderComponent);
  header.componentRef.setInput('label', 'page-title.cash');
  if (icon) header.componentRef.setInput('icon', icon);
  header.detectChanges();

  return header.nativeElement.querySelector('ion-icon.sr-brand__icon');
};

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

    const title = getByTestId(fixture, 'page-header-title');
    expect(title.textContent).toContain('page-title.storage');
  });

  it('renders a heading verbatim — it is a name from state, not a key', () => {
    fixture.componentRef.setInput('heading', 'Girokonto');
    fixture.detectChanges();

    expect(getByTestId(fixture, 'page-header-title').textContent).toContain(
      'Girokonto'
    );
  });

  it('swaps the menu button for a back button, and the page names only the fallback', () => {
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('ion-menu-button')
    ).not.toBeNull();

    fixture.componentRef.setInput('backHref', '/cash');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('ion-menu-button')).toBeNull();
    const back = fixture.nativeElement.querySelector('ion-back-button');
    expect(back['defaultHref']).toBe('/cash');
  });

  it('shows the add button by default and hides it when hideButtons is set', () => {
    fixture.detectChanges();
    expect(queryByTestId(fixture, 'page-header-add')).not.toBeNull();

    fixture.componentRef.setInput('hideButtons', true);
    fixture.detectChanges();
    expect(queryByTestId(fixture, 'page-header-add')).toBeNull();
  });

  it('disables the add button when disabled is set', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    expect(getByTestId(fixture, 'page-header-add')['disabled']).toBe(true);
  });

  describe('the glyph', () => {
    it("falls back to the route's program", () => {
      expect(glyphOf()['name']).toBe('wallet-outline');
    });

    it('yields to a page that names its own', () => {
      expect(glyphOf('options-outline')['name']).toBe('options-outline');
    });
  });

  it('emits addItem when the add button is clicked', () => {
    fixture.detectChanges();
    const emitted: void[] = [];
    component.addItem.subscribe(() => emitted.push(undefined));

    getByTestId(fixture, 'page-header-add').click();

    expect(emitted).toHaveLength(1);
  });
});
