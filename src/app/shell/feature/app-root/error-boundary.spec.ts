import { Component, CUSTOM_ELEMENTS_SCHEMA, ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ModuleTabsPage } from '../../../@shared/feature/module-tabs-page/module-tabs.page';
import { COMMON_TEST_PROVIDERS } from '../../../@shared/testing/test-providers';
import { DrawerMenuComponent } from '../../smart-ui/drawer-menu/drawer-menu.component';
import { UpdateToastComponent } from '../../smart-ui/update-toast/update-toast.component';
import { AppComponent } from './app.component';

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

async function visit(url: string) {
  const fixture = TestBed.createComponent(AppComponent);
  await fixture.whenStable();
  let outcome: unknown = 'navigated';
  try {
    await TestBed.inject(Router).navigateByUrl(url);
  } catch (error) {
    outcome = error;
  }
  await fixture.whenStable();
  const host = fixture.nativeElement as HTMLElement;
  return {
    outcome,
    fallbacks: () => {
      return [...host.querySelectorAll('app-error-fallback')].map(
        (fallback) => {
          return {
            inTabs: !!fallback.closest('app-page-module-tabs'),
            reason: fallback.querySelector('.error-fallback__reason')
              ?.textContent,
          };
        }
      );
    },
  };
}

describe('@boundary in the real shells', () => {
  beforeEach(async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => {
        return {
          matches: false,
          addListener: vi.fn(),
          removeListener: vi.fn(),
        };
      })
    );
    TestBed.configureTestingModule({
      providers: [
        ...COMMON_TEST_PROVIDERS,
        provideRouter([
          { path: 'render', component: RenderThrowsPage },
          { path: 'ctor', component: ConstructorThrowsPage },
          {
            path: 'tabs',
            component: ModuleTabsPage,
            children: [{ path: 'render', component: RenderThrowsPage }],
          },
        ]),
        { provide: ErrorHandler, useValue: { handleError: vi.fn() } },
      ],
    });
    TestBed.overrideComponent(AppComponent, {
      remove: {
        imports: [DrawerMenuComponent, UpdateToastComponent],
      },
      add: { schemas: [CUSTOM_ELEMENTS_SCHEMA] },
    });
    await TestBed.compileComponents();
  });

  it('catches a routed page that throws while rendering, at the root', async () => {
    const { fallbacks } = await visit('/render');
    expect(fallbacks()).toEqual([{ inTabs: false, reason: 'render' }]);
  });

  it('lets the nearest boundary, inside the tabs shell, catch a tab page', async () => {
    const { fallbacks } = await visit('/tabs/render');
    expect(fallbacks()).toEqual([{ inTabs: true, reason: 'render' }]);
  });

  it('cannot catch a constructor: the navigation itself fails', async () => {
    const { outcome, fallbacks } = await visit('/ctor');
    expect(outcome).toEqual(new Error('ctor'));
    expect(fallbacks()).toEqual([]);
  });
});
