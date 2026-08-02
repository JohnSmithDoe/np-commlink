import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router, TitleStrategy } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { AppTitleStrategy } from './app-title.strategy';

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
