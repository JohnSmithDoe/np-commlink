import { ComponentFixture, TestBed } from '@angular/core/testing';
import { COMMON_TEST_PROVIDERS } from '../../../@shared/testing/test-providers';
import { HandbookEntry } from '../../model/handbook.types';
import { HandbookGroupView } from '../../util/handbook-content';
import { HandbookTocComponent } from './handbook-toc.component';

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

const GROUPS: HandbookGroupView[] = [
  { group: 'einstieg', entries: [entry('start')] },
  { group: 'programme', entries: [entry('chrono'), entry('agenda')] },
];

describe('HandbookTocComponent', () => {
  let fixture: ComponentFixture<HandbookTocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HandbookTocComponent],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();
    fixture = TestBed.createComponent(HandbookTocComponent);
    fixture.componentRef.setInput('groups', GROUPS);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('renders one row per entry across every group', () => {
    expect(
      fixture.nativeElement.querySelectorAll(
        '[data-testid="handbook-toc-entry"]'
      )
    ).toHaveLength(3);
  });

  it('carries both names, so the skin can choose without the data changing', () => {
    const text: string = fixture.nativeElement.textContent;

    expect(text).toContain('DECK chrono');
    expect(text).toContain('Klartext chrono');
  });

  it('names its group headings through the label map', () => {
    expect(fixture.componentInstance.groupLabel.einstieg).toBe(
      'handbook.group.einstieg'
    );
  });
});
