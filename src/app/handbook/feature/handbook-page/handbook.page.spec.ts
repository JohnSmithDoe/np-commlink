import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { COMMON_TEST_PROVIDERS } from '../../../@shared/testing/test-providers';
import { HandbookService } from '../../data/handbook.service';
import { HandbookEntry } from '../../model/handbook.types';
import { HandbookPage } from './handbook.page';

const entry = (
  slug: string,
  group: HandbookEntry['group'] = 'programme'
): HandbookEntry => ({
  slug,
  title: `DECK ${slug}`,
  plain: `Klartext ${slug}`,
  route: `/${slug}`,
  group,
  summary: `Kurz zu ${slug}`,
  tags: [slug],
  text: `Der Text zu ${slug} nennt einen Timer.`,
});

interface FakeHandbook {
  entries: WritableSignal<readonly HandbookEntry[]>;
  indexPending: WritableSignal<boolean>;
  indexFailed: WritableSignal<boolean>;
  loads: number;
  loadIndex: () => void;
}

const fakeHandbook = (): FakeHandbook => {
  const fake = {
    entries: signal<readonly HandbookEntry[]>([]),
    indexPending: signal(false),
    indexFailed: signal(false),
    loads: 0,
    loadIndex: () => {
      fake.loads += 1;
    },
  };
  return fake;
};

describe('HandbookPage', () => {
  let fixture: ComponentFixture<HandbookPage>;
  let component: HandbookPage;
  let handbook: FakeHandbook;

  beforeEach(async () => {
    handbook = fakeHandbook();
    await TestBed.configureTestingModule({
      imports: [HandbookPage],
      providers: [
        ...COMMON_TEST_PROVIDERS,
        { provide: HandbookService, useValue: handbook },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(HandbookPage);
    component = fixture.componentInstance;
  });

  it('asks for the index as it opens', () => {
    expect(handbook.loads).toBe(1);
  });

  it('groups the table of contents in catalog order', () => {
    handbook.entries.set([entry('chrono'), entry('start', 'einstieg')]);

    expect(component.groups().map((view) => view.group)).toEqual([
      'einstieg',
      'programme',
    ]);
  });

  it('shows the contents, not results, while the box is empty', () => {
    handbook.entries.set([entry('chrono')]);

    expect(component.isSearching()).toBe(false);
    expect(component.hits()).toEqual([]);
  });

  it('reads whitespace as no query rather than as a search for nothing', () => {
    component.query.set(' '.repeat(3));

    expect(component.isSearching()).toBe(false);
  });

  it('filters to the pages every term matches', () => {
    handbook.entries.set([entry('chrono'), entry('agenda')]);
    component.query.set('chrono timer');

    expect(component.hits().map((hit) => hit.entry.slug)).toEqual(['chrono']);
  });

  it('renders the failure as a state with a retry, not as a throw', async () => {
    handbook.indexFailed.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="handbook-index-error"]'
      )
    ).not.toBeNull();

    component.retry();

    expect(handbook.loads).toBe(2);
  });
});
