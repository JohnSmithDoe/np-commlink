import { ComponentFixture } from '@angular/core/testing';

/**
 * A rendered element under test. The index signature is what lets a spec read a
 * property off an `ion-*` custom element (`color`, `disabled`) the way it could
 * off the untyped `fixture.nativeElement`.
 */
type TTestElement = HTMLElement & Record<string, unknown>;

// The id is matched as an attribute value rather than interpolated into a
// selector: `CSS.escape` does not exist in jsdom, so there is no way to escape
// one safely here.
const query = <T>(
  fixture: ComponentFixture<T>,
  testId: string
): TTestElement | null =>
  [...fixture.nativeElement.querySelectorAll('[data-testid]')].find(
    (element: HTMLElement) => element.dataset['testid'] === testId
  ) ?? null;

/**
 * Locate a rendered element by its `data-testid`, failing loudly when it is
 * absent.
 *
 * Specs key off testids rather than Ionic element names, tag names or CSS
 * classes: those are framework and styling details a re-theme or an Ionic
 * upgrade may change freely, while a testid is a contract the template states on
 * purpose. Component element names (`app-*`) are already such a contract and are
 * used directly.
 */
export function getByTestId<T>(
  fixture: ComponentFixture<T>,
  testId: string
): TTestElement {
  const element = query(fixture, testId);
  if (!element) throw new Error(`No element with data-testid="${testId}"`);
  return element;
}

/** The same lookup for asserting that an element is *not* rendered. */
export function queryByTestId<T>(
  fixture: ComponentFixture<T>,
  testId: string
): TTestElement | null {
  return query(fixture, testId);
}
