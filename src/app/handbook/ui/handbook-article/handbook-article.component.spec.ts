import { ComponentFixture, TestBed } from '@angular/core/testing';
import { COMMON_TEST_PROVIDERS } from '../../../@shared/testing/test-providers';
import { HandbookPageContent } from '../../model/handbook.types';
import { HandbookArticleComponent } from './handbook-article.component';

const page = (
  overrides: Partial<HandbookPageContent> = {}
): HandbookPageContent => ({
  slug: 'soykaf',
  title: 'SOYKAF',
  plain: 'Rezepte',
  route: '/household/recipes',
  summary: 'Was sich kochen lässt.',
  sections: [],
  ...overrides,
});

describe('HandbookArticleComponent', () => {
  let fixture: ComponentFixture<HandbookArticleComponent>;

  const render = async (content: HandbookPageContent) => {
    fixture.componentRef.setInput('page', content);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement.querySelector('.hb-article__stale');
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HandbookArticleComponent],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();
    fixture = TestBed.createComponent(HandbookArticleComponent);
  });

  it('warns that the screenshots are older than the app', async () => {
    expect(await render(page({ shotsStale: true }))).not.toBeNull();
  });

  it('says nothing where the shots are current', async () => {
    expect(await render(page())).toBeNull();
  });
});
