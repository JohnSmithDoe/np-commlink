import { ComponentFixture, TestBed } from '@angular/core/testing';
import { COMMON_TEST_PROVIDERS } from '../../../@shared/testing/test-providers';
import { HandbookEntry } from '../../model/handbook.types';
import { HandbookHit } from '../../util/handbook-search';
import { HandbookSearchResultsComponent } from './handbook-search-results.component';

const CHRONO: HandbookEntry = {
  slug: 'chrono',
  title: 'CHRONO',
  plain: 'Zeiterfassung',
  route: '/tracking',
  group: 'programme',
  summary: 'Zeiten starten und stoppen.',
  tags: ['timer'],
  text: 'Ein Timer läuft weiter.',
};

const HITS: HandbookHit[] = [
  {
    entry: CHRONO,
    score: 4,
    snippet: [
      { text: 'Ein ', match: false },
      { text: 'Timer', match: true },
      { text: ' läuft weiter.', match: false },
    ],
  },
];

describe('HandbookSearchResultsComponent', () => {
  let fixture: ComponentFixture<HandbookSearchResultsComponent>;

  const render = async (hits: HandbookHit[], query: string): Promise<void> => {
    fixture.componentRef.setInput('hits', hits);
    fixture.componentRef.setInput('query', query);
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HandbookSearchResultsComponent],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();
    fixture = TestBed.createComponent(HandbookSearchResultsComponent);
  });

  it('renders one row per hit', async () => {
    await render(HITS, 'timer');

    expect(
      fixture.nativeElement.querySelectorAll(
        '[data-testid="handbook-search-hit"]'
      )
    ).toHaveLength(1);
  });

  it('marks the matched run rather than the whole snippet', async () => {
    await render(HITS, 'timer');

    const marks: NodeListOf<HTMLElement> =
      fixture.nativeElement.querySelectorAll('mark');

    expect([...marks].map((mark) => mark.textContent)).toEqual(['Timer']);
  });

  it('says nothing was found instead of rendering an empty list', async () => {
    await render([], 'nichts');

    expect(
      fixture.nativeElement.querySelector('[data-testid="handbook-search-hit"]')
    ).toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      'handbook.search.empty'
    );
  });
});
