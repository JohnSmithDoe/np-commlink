import { TestBed } from '@angular/core/testing';
import { queryByTestId } from '../../testing/dom';
import { COMMON_TEST_PROVIDERS } from '../../testing/test-providers';
import { PROGRAM_RETURN, ProgramReturn } from '../../util/program-return.token';
import { PageReturnComponent } from './page-return.component';

const rowFor = (program: ProgramReturn, route?: string, label?: string) => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [PageReturnComponent],
    providers: [
      ...COMMON_TEST_PROVIDERS,
      { provide: PROGRAM_RETURN, useValue: () => program },
    ],
  });
  const fixture = TestBed.createComponent(PageReturnComponent);
  if (route) fixture.componentRef.setInput('route', route);
  if (label) fixture.componentRef.setInput('label', label);
  fixture.detectChanges();

  return queryByTestId(fixture, 'page-return');
};

const INSIDE_CASH: ProgramReturn = {
  isProgram: false,
  parent: { route: '/cash', titleKey: 'page-title.cash' },
};

describe('PageReturnComponent', () => {
  it('names the program a child page sits inside', () => {
    const row = rowFor(INSIDE_CASH);

    expect(row).not.toBeNull();
    expect(row?.getAttribute('href')).toContain('/cash');
  });

  it('offers nothing on a program own route', () => {
    expect(rowFor({ isProgram: true })).toBeNull();
    expect(rowFor({ isProgram: true }, '/cash/categories', 'x')).toBeNull();
  });

  it('prefers the parent a page names over the program it sits inside', () => {
    const row = rowFor(
      INSIDE_CASH,
      '/cash/categories',
      'page-title.categories'
    );

    expect(row?.getAttribute('href')).toContain('/cash/categories');
  });

  it('falls back to the program when a page names a route without a label', () => {
    const row = rowFor(INSIDE_CASH, '/cash/categories');

    expect(row?.getAttribute('href')).toContain('/cash');
  });

  it('offers nothing where the catalog knows neither the page nor a parent', () => {
    expect(rowFor({ isProgram: false })).toBeNull();
  });
});
