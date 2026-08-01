import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router, TitleStrategy } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { AppTitleStrategy } from './app-title.strategy';

/**
 * Two defects went unnoticed for want of this file: `buildTitle` was reading a key
 * the manifests never set — they declared `data: { title }` where the router only
 * fills in a Symbol from a route's `title` **property** — so the class ran entirely
 * on a hand-rolled fallback; and a cold load put the raw `page-title.*` key in the
 * tab, because the one navigation that ever happens beat the i18n bundle over the
 * wire and nothing revisited it.
 *
 * So this drives a REAL navigation rather than hand-building a snapshot. The
 * property-vs-`data` distinction is the whole bug, and only the router can say
 * which one it honours — a duck-typed snapshot would have to guess, and guessing
 * the wrong one is how the original passed review.
 */
const TITLE_KEY = 'page-title.commlink';

@Component({ template: '' })
class BlankPage {}

describe('AppTitleStrategy', () => {
  let router: Router;
  let title: Title;
  let translate: TranslateService;

  const setup = (route: { title?: string }) => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTranslateService(),
        provideLocationMocks(),
        provideRouter([{ path: 'deck', component: BlankPage, ...route }]),
        { provide: TitleStrategy, useClass: AppTitleStrategy },
      ],
    });
    router = TestBed.inject(Router);
    title = TestBed.inject(Title);
    translate = TestBed.inject(TranslateService);
  };

  const withBundle = () => {
    translate.setTranslation('de', { [TITLE_KEY]: 'Deck' });
    translate.use('de');
  };

  it('reads the title off the route property, so buildTitle finds it', async () => {
    setup({ title: TITLE_KEY });
    withBundle();

    await router.navigateByUrl('/deck');

    expect(title.getTitle()).toBe('Deck | np-commlink');
  });

  it('shows the app name alone for a route that declares no title', async () => {
    setup({});
    withBundle();

    await router.navigateByUrl('/deck');

    expect(title.getTitle()).toBe('np-commlink');
  });

  // The cold-boot case. `instant` echoes the key back when nothing is loaded, and
  // the app name alone beats putting `page-title.commlink` in the tab.
  it('never shows a raw key while the bundle is still in flight', async () => {
    setup({ title: TITLE_KEY });

    await router.navigateByUrl('/deck');

    expect(title.getTitle()).toBe('np-commlink');
  });

  it('re-renders the title once the bundle lands, with no second navigation', async () => {
    setup({ title: TITLE_KEY });

    await router.navigateByUrl('/deck');
    expect(title.getTitle()).toBe('np-commlink');

    withBundle();

    expect(title.getTitle()).toBe('Deck | np-commlink');
  });
});
