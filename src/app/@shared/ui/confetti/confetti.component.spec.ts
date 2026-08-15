import { ComponentFixture, TestBed } from '@angular/core/testing';
import { COMMON_TEST_PROVIDERS } from '../../testing/test-providers';
import { ConfettiComponent } from './confetti.component';

describe('ConfettiComponent', () => {
  let fixture: ComponentFixture<ConfettiComponent>;

  const sparks = (): HTMLElement[] => [
    ...fixture.nativeElement.querySelectorAll('.confetti__spark'),
  ];

  const render = (pieces?: number) => {
    if (pieces !== undefined) fixture.componentRef.setInput('pieces', pieces);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfettiComponent],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();
    fixture = TestBed.createComponent(ConfettiComponent);
  });

  it('renders fourteen pieces by default', () => {
    render();

    expect(sparks().length).toBe(14);
  });

  it('renders the requested number of pieces', () => {
    render(6);

    expect(sparks().length).toBe(6);
  });

  it('spreads across the full width whatever the count', () => {
    render(24);

    const columns = sparks().map((spark) =>
      Number.parseFloat(spark.style.left)
    );

    expect(columns.length).toBe(24);
    expect(columns[0]).toBe(2);
    expect(columns.at(-1)).toBe(98);
    expect(new Set(columns).size).toBe(24);
  });

  it('gives each piece its own size and timing', () => {
    render(3);

    const [first, second, third] = sparks();

    expect(first!.style.width).toBe(first!.style.height);
    expect(
      new Set([
        first!.style.animationDuration,
        second!.style.animationDuration,
        third!.style.animationDuration,
      ]).size
    ).toBeGreaterThan(1);
  });

  it('survives being asked for a single piece', () => {
    render(1);

    expect(sparks()[0]!.style.left).toBe('2%');
  });

  it('stays out of the accessibility tree — it says nothing', () => {
    render();

    expect(fixture.nativeElement.getAttribute('aria-hidden')).toBe('true');
  });
});
