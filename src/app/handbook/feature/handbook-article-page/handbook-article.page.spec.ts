import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { COMMON_TEST_PROVIDERS } from '../../../@shared/testing/test-providers';
import { HandbookService } from '../../data/handbook.service';
import { HandbookEntry, HandbookPageContent } from '../../model/handbook.types';
import { HandbookArticlePage } from './handbook-article.page';

const entry = (slug: string): HandbookEntry => ({
  slug,
  title: `DECK ${slug}`,
  plain: `Klartext ${slug}`,
  route: `/${slug}`,
  group: 'programme',
  summary: `Kurz zu ${slug}`,
  tags: [slug],
  text: `Text zu ${slug}`,
});

const ENTRIES = [entry('start'), entry('chrono'), entry('agenda')];

const CONTENT: HandbookPageContent = {
  slug: 'chrono',
  title: 'CHRONO',
  plain: 'Zeiterfassung',
  route: '/tracking',
  summary: 'Zeiten starten und stoppen.',
  sections: [
    {
      kind: 'pitfalls',
      heading: 'Fallen',
      blocks: [{ type: 'p', html: 'Ein <strong>Timer</strong> läuft weiter.' }],
    },
  ],
};

interface FakeHandbook {
  entries: WritableSignal<readonly HandbookEntry[]>;
  page: WritableSignal<HandbookPageContent | undefined>;
  pagePending: WritableSignal<boolean>;
  pageFailed: WritableSignal<boolean>;
  opened: string[];
  loadIndex: () => void;
  openPage: (slug: string) => void;
}

const fakeHandbook = (): FakeHandbook => {
  const fake: FakeHandbook = {
    entries: signal<readonly HandbookEntry[]>(ENTRIES),
    page: signal<HandbookPageContent | undefined>(undefined),
    pagePending: signal(false),
    pageFailed: signal(false),
    opened: [],
    loadIndex: () => {},
    openPage: (slug: string) => {
      fake.opened.push(slug);
    },
  };
  return fake;
};

describe('HandbookArticlePage', () => {
  let fixture: ComponentFixture<HandbookArticlePage>;
  let component: HandbookArticlePage;
  let handbook: FakeHandbook;
  let routeParameters: BehaviorSubject<ParamMap>;

  beforeEach(async () => {
    handbook = fakeHandbook();
    routeParameters = new BehaviorSubject<ParamMap>(
      convertToParamMap({ slug: 'chrono' })
    );
    await TestBed.configureTestingModule({
      imports: [HandbookArticlePage],
      providers: [
        ...COMMON_TEST_PROVIDERS,
        { provide: HandbookService, useValue: handbook },
        { provide: ActivatedRoute, useValue: { paramMap: routeParameters } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(HandbookArticlePage);
    component = fixture.componentInstance;
  });

  it('opens the article the route names', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.slug()).toBe('chrono');
    expect(handbook.opened).toEqual(['chrono']);
  });

  it('follows a param change instead of holding the first slug', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    routeParameters.next(convertToParamMap({ slug: 'agenda' }));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(handbook.opened).toEqual(['chrono', 'agenda']);
  });

  it('offers both neighbours from the middle of the index', () => {
    expect(component.previous()?.slug).toBe('start');
    expect(component.next()?.slug).toBe('agenda');
  });

  it('drops the neighbour the edge of the index has none of', () => {
    routeParameters.next(convertToParamMap({ slug: 'start' }));

    expect(component.previous()).toBeUndefined();
    expect(component.next()?.slug).toBe('chrono');
  });

  it('renders the failure as a state with a retry, not as a throw', async () => {
    handbook.pageFailed.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[data-testid="handbook-page-error"]')
    ).not.toBeNull();

    component.retry();

    expect(handbook.opened.at(-1)).toBe('chrono');
  });

  it('renders the article once it arrives', async () => {
    handbook.page.set(CONTENT);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('.hb-section[data-kind="pitfalls"]')
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('.hb-block__p strong')
    ).not.toBeNull();
  });
});
