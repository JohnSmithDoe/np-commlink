import { ComponentFixture } from '@angular/core/testing';

type TestElement = HTMLElement & Record<string, unknown>;

const query = <T>(
  fixture: ComponentFixture<T>,
  testId: string
): TestElement | null =>
  [...fixture.nativeElement.querySelectorAll('[data-testid]')].find(
    (element: HTMLElement) => element.dataset['testid'] === testId
  ) ?? null;

export function getByTestId<T>(
  fixture: ComponentFixture<T>,
  testId: string
): TestElement {
  const element = query(fixture, testId);
  if (!element) throw new Error(`No element with data-testid="${testId}"`);
  return element;
}

export function queryByTestId<T>(
  fixture: ComponentFixture<T>,
  testId: string
): TestElement | null {
  return query(fixture, testId);
}
