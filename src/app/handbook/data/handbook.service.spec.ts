import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HandbookIndex, HandbookPageContent } from '../model/handbook.types';
import { HandbookService } from './handbook.service';

const INDEX: HandbookIndex = {
  language: 'de',
  pages: [
    {
      slug: 'start',
      title: 'START',
      plain: 'Erste Schritte',
      route: '/commlink',
      group: 'einstieg',
      summary: 'Wie das Deck bootet.',
      tags: ['start'],
      text: 'Das Deck startet leer.',
    },
  ],
};

const PAGE: HandbookPageContent = {
  slug: 'start',
  title: 'START',
  plain: 'Erste Schritte',
  route: '/commlink',
  summary: 'Wie das Deck bootet.',
  sections: [
    { kind: 'why', heading: 'Warum', blocks: [{ type: 'p', html: 'Text' }] },
  ],
};

describe('HandbookService', () => {
  let service: HandbookService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(HandbookService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('fetches the index from a relative url and exposes its pages', () => {
    service.loadIndex();
    http.expectOne('./handbook/index.json').flush(INDEX);

    expect(service.entries().map((entry) => entry.slug)).toEqual(['start']);
    expect(service.indexPending()).toBe(false);
    expect(service.indexFailed()).toBe(false);
  });

  it('fetches the index once, however many pages ask for it', () => {
    service.loadIndex();
    service.loadIndex();
    http.expectOne('./handbook/index.json').flush(INDEX);

    service.loadIndex();

    http.expectNone('./handbook/index.json');
  });

  it('reports a failed index as a state instead of throwing', () => {
    service.loadIndex();
    http
      .expectOne('./handbook/index.json')
      .flush('nope', { status: 404, statusText: 'Not Found' });

    expect(service.indexFailed()).toBe(true);
    expect(service.indexPending()).toBe(false);
    expect(service.entries()).toEqual([]);
  });

  it('retries the index after a failure', () => {
    service.loadIndex();
    http
      .expectOne('./handbook/index.json')
      .flush('nope', { status: 500, statusText: 'Server Error' });

    service.loadIndex();
    http.expectOne('./handbook/index.json').flush(INDEX);

    expect(service.indexFailed()).toBe(false);
    expect(service.entries()).toHaveLength(1);
  });

  it('caches a page, so a second visit costs no request', () => {
    service.openPage('start');
    http.expectOne('./handbook/pages/start.json').flush(PAGE);

    expect(service.page()?.slug).toBe('start');

    service.openPage('start');

    http.expectNone('./handbook/pages/start.json');
    expect(service.page()?.slug).toBe('start');
    expect(service.pagePending()).toBe(false);
  });

  it('reports a failed page as a state, with no article left on screen', () => {
    service.openPage('start');
    http
      .expectOne('./handbook/pages/start.json')
      .flush('nope', { status: 404, statusText: 'Not Found' });

    expect(service.pageFailed()).toBe(true);
    expect(service.page()).toBeUndefined();
  });

  it('ignores a slower response for a page the reader has already left', () => {
    service.openPage('start');
    const first = http.expectOne('./handbook/pages/start.json');

    service.openPage('sysop');
    const second = http.expectOne('./handbook/pages/sysop.json');
    second.flush({ ...PAGE, slug: 'sysop' });
    first.flush(PAGE);

    expect(service.page()?.slug).toBe('sysop');
  });
});
