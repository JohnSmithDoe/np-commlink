import { Component, ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { IonRouterOutlet, IonTabBar, IonTabs } from '@ionic/angular/standalone';
import { COMMON_TEST_PROVIDERS } from '../testing/test-providers';

@Component({ template: '{{ boom() }}' })
class RenderThrowsPage {
  boom(): string {
    throw new Error('render');
  }
}

@Component({ template: '' })
class ConstructorThrowsPage {
  constructor() {
    throw new Error('ctor');
  }
}

@Component({
  imports: [IonTabs, IonTabBar],
  template: `
    @boundary {
      <ion-tabs><ion-tab-bar slot="bottom" /></ion-tabs>
    } @error {
      <p class="tabs-fallback">{{ $error.message }}</p>
    }
  `,
})
class TabsShellPage {}

@Component({
  imports: [IonRouterOutlet],
  template: `
    @boundary {
      <ion-router-outlet />
    } @error {
      <p class="root-fallback">{{ $error.message }}</p>
    }
  `,
})
class RootShellComponent {}

async function visit(url: string) {
  const fixture = TestBed.createComponent(RootShellComponent);
  await fixture.whenStable();
  const navigation = TestBed.inject(Router).navigateByUrl(url);
  const outcome = await navigation.then(
    () => 'navigated',
    (error: unknown) => error
  );
  await fixture.whenStable();
  const host = fixture.nativeElement as HTMLElement;
  return {
    outcome,
    fallback: (selector: string) => host.querySelector(selector)?.textContent,
  };
}

describe('@boundary around an Ionic outlet', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...COMMON_TEST_PROVIDERS,
        provideRouter([
          { path: 'render', component: RenderThrowsPage },
          { path: 'ctor', component: ConstructorThrowsPage },
          {
            path: 'tabs',
            component: TabsShellPage,
            children: [{ path: 'render', component: RenderThrowsPage }],
          },
        ]),
        { provide: ErrorHandler, useValue: { handleError: vi.fn() } },
      ],
    });
  });

  it('catches a routed page that throws while rendering', async () => {
    const { fallback } = await visit('/render');
    expect(fallback('.root-fallback')).toBe('render');
  });

  it('lets the nearest boundary, inside the tabs shell, catch a tab page', async () => {
    const { fallback } = await visit('/tabs/render');
    expect(fallback('.tabs-fallback')).toBe('render');
    expect(fallback('.root-fallback')).toBeUndefined();
  });

  it('cannot catch a constructor: the navigation itself fails', async () => {
    const { outcome, fallback } = await visit('/ctor');
    expect(outcome).toEqual(new Error('ctor'));
    expect(fallback('.root-fallback')).toBeUndefined();
  });
});
